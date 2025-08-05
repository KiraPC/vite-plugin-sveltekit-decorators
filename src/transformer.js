import generate from '@babel/generator';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import MagicString from 'magic-string';
import path from 'node:path';
import { parseFile } from './parser.js';

// Handle default export for Babel modules
const babelGenerate = generate.default || generate;
const babelTraverse = traverse.default || traverse;

export function transformFile(code, filePath, config, serverAutowrapInfo, clientAutowrapInfo, isServerSide = true) {
  const parseResult = parseFile(code, filePath);
  const { functions, autowrapConfig } = parseResult;
  
  // If autowrap is explicitly disabled in this file, skip transformation
  if (!autowrapConfig.enabled) {
    return { code, changed: false };
  }
  
  // Choose the appropriate autowrap info based on context
  const autowrapInfo = isServerSide ? serverAutowrapInfo : clientAutowrapInfo;
  
  if (functions.length === 0) {
    return { code, changed: false };
  }
  
  if (!autowrapInfo) {
    return { code, changed: false };
  }

  try {
    const s = new MagicString(code);
    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
      allowImportExportEverywhere: true,
      allowReturnOutsideFunction: true,
    });

    // Track which wrappers we need to import
    const neededWrappers = new Set();
    const transformations = [];

    babelTraverse(ast, {
      ExportNamedDeclaration(path) {
        const declaration = path.node.declaration;
        
        if (t.isVariableDeclaration(declaration)) {
          for (const declarator of declaration.declarations) {
            if (t.isIdentifier(declarator.id)) {
              // Skip config variable
              if (declarator.id.name === 'config') {
                continue;
              }

              // For actions, there might be multiple functions with the same name but different actionName
              const matchingFunctions = functions.filter(f => f.name === declarator.id.name);
              
              if (matchingFunctions.length > 0) {
                // For actions, we need to handle each action individually
                if (matchingFunctions[0].type === 'actions') {
                  // For actions, we only modify the individual properties that should be wrapped
                  if (declarator.init && t.isObjectExpression(declarator.init)) {
                    
                    for (const property of declarator.init.properties) {
                      if (t.isObjectProperty(property) && t.isIdentifier(property.key)) {
                        const actionName = property.key.name;
                        
                        // Find the function info for this specific action
                        const actionFunction = matchingFunctions.find(f => f.action === actionName);
                        if (actionFunction) {
                          const shouldWrap = shouldWrapFunction(actionFunction, autowrapConfig);
                          
                          if (shouldWrap) {
                            neededWrappers.add('actions');
                            
                            const metadata = createMetadata(actionFunction, filePath, isServerSide);
                            
                            // Wrap only this single action
                            if (property.value && property.value.start !== null && property.value.end !== null) {
                              const wrapperName = getWrapperFunctionName('actions');
                              const wrappedCode = `${wrapperName}(${babelGenerate(property.value).code}, ${JSON.stringify(metadata)})`;
                              
                              transformations.push({
                                start: property.value.start,
                                end: property.value.end,
                                replacement: wrappedCode,
                              });
                            }
                          }
                        }
                      }
                    }
                  }
                } else {
                  // Logic for load and other functions
                  const functionInfo = matchingFunctions[0];
                  if (functionInfo && declarator.init) {
                    const shouldWrap = shouldWrapFunction(functionInfo, autowrapConfig);
                    
                    if (shouldWrap) {
                      const wrapperType = getWrapperType(functionInfo.type);
                      if (wrapperType) {
                        neededWrappers.add(wrapperType);
                        
                        const metadata = createMetadata(functionInfo, filePath, isServerSide);
                        const wrappedCode = wrapFunction(
                          declarator.init,
                          functionInfo,
                          metadata,
                          wrapperType
                        );
                        
                        if (wrappedCode && declarator.init.start !== null && declarator.init.end !== null) {
                          transformations.push({
                            start: declarator.init.start,
                            end: declarator.init.end,
                            replacement: wrappedCode,
                          });
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        } else if (t.isFunctionDeclaration(declaration)) {
          // Handle export function declarations (API routes like export function GET)
          const functionName = declaration.id.name;
          const matchingFunction = functions.find(f => f.name === functionName);
          
          if (matchingFunction) {
            const shouldWrap = shouldWrapFunction(matchingFunction, autowrapConfig);
            
            if (shouldWrap) {
              const wrapperType = getWrapperType(matchingFunction.type);
              if (wrapperType) {
                neededWrappers.add(wrapperType);
                
                const metadata = createMetadata(matchingFunction, filePath, isServerSide);
                
                // For function declarations, we need to replace the entire function
                const functionCode = babelGenerate(declaration).code;
                const wrappedCode = `export const ${functionName} = ${getWrapperFunctionName(wrapperType)}(${functionCode.replace(`export function ${functionName}`, `async function ${functionName}`)}, ${JSON.stringify(metadata)});`;
                
                if (path.node.start !== null && path.node.end !== null) {
                  transformations.push({
                    start: path.node.start,
                    end: path.node.end,
                    replacement: wrappedCode,
                  });
                }
              }
            }
          }
        }
      },
    });

    // Apply transformations in reverse order to maintain positions
    transformations
      .sort((a, b) => b.start - a.start)
      .forEach(({ start, end, replacement }) => {
        s.overwrite(start, end, replacement);
      });

    // Add imports at the top
    if (neededWrappers.size > 0) {
      const imports = generateImports(neededWrappers, autowrapInfo, filePath);
      s.prepend(imports + '\n');
    }

    const finalCode = s.toString();

    return {
      code: finalCode,
      map: s.generateMap({ hires: true }),
      changed: neededWrappers.size > 0,
    };
  } catch (error) {
    console.warn(`Failed to transform ${filePath}:`, error);
    return { code, changed: false };
  }
}

function getWrapperType(functionType) {
  switch (functionType) {
    case 'load':
      return 'load';
    case 'actions':
      return 'actions';
    case 'api':
      return 'api';
    default:
      return null;
  }
}

function getWrapperFunctionName(wrapperType) {
  switch (wrapperType) {
    case 'load':
      return 'loadDecorator';
    case 'actions':
      return 'actionsDecorator';
    case 'api':
      return 'apiDecorator';
  }
}

function generateImports(neededWrappers, autowrapInfo, currentFilePath) {
  const imports = [];
  const wrapperNames = [];
  
  for (const wrapperType of Array.from(neededWrappers)) {
    const functionName = getWrapperFunctionName(wrapperType);
    wrapperNames.push(functionName);
  }
  
  if (wrapperNames.length > 0) {
    // Calculate the relative path from current file to autowrap file
    const relativePath = path.relative(
      path.dirname(currentFilePath), 
      autowrapInfo.filePath
    ).replace(/\\/g, '/');
    
    const importPath = relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
    imports.push(`import { ${wrapperNames.join(', ')} } from '${importPath}';`);
  }
  
  return imports.join('\n');
}

function shouldWrapFunction(functionInfo, autowrapConfig) {
  // If there's no granular configuration, use default (enabled)
  if (!autowrapConfig.granular) {
    return true;
  }
  
  const { granular } = autowrapConfig;
  
  switch (functionInfo.type) {
    case 'load':
      return granular.load !== false; // Default: true
      
    case 'actions':
      if (granular.actions === false) {
        return false; // Tutte le actions disabilitate
      }
      if (Array.isArray(granular.actions)) {
        // If it's an array, check if this specific action is in the array (ENABLED)
        // actions: ['delete'] means "enable wrapping ONLY for delete"
        return granular.actions.includes(functionInfo.action);
      }
      return granular.actions !== false; // Default: true
      
    case 'api':
      if (granular.api === false) {
        return false; // Tutte le API routes disabilitate
      }
      if (Array.isArray(granular.api)) {
        // If it's an array, check if this specific HTTP method is in the array (ENABLED)
        // api: ['POST', 'DELETE'] means "enable wrapping ONLY for POST and DELETE"
        return granular.api.includes(functionInfo.name);
      }
      return granular.api !== false; // Default: true
      
    default:
      return true;
  }
}

function createMetadata(functionInfo, filePath, isServerSide = true) {
  const metadata = {
    functionName: functionInfo.name,
    functionType: functionInfo.type,
    isAsync: functionInfo.isAsync,
    timestamp: Date.now(),
  };
  
  // Only include sensitive information in server-side metadata
  if (isServerSide) {
    metadata.filePath = filePath;
    metadata.startLine = functionInfo.startLine;
    metadata.endLine = functionInfo.endLine;
  }
  
  // Add action if present (for actions)
  if (functionInfo.action) {
    metadata.action = functionInfo.action;
  }
  
  // Add method if present (for API routes)
  if (functionInfo.name && functionInfo.type === 'api') {
    metadata.method = functionInfo.name.toUpperCase();
  }
  
  return metadata;
}

function wrapFunction(node, functionInfo, metadata, wrapperType) {
  try {
    const originalCode = babelGenerate(node).code;
    const wrapperName = getWrapperFunctionName(wrapperType);
    
    // Always pass metadata, but exclude sensitive info for client-side
    const metadataCode = JSON.stringify(metadata, null, 2);
    return `${wrapperName}(${originalCode}, ${metadataCode})`;
  } catch (error) {
    console.warn(`Failed to wrap function ${functionInfo.name}:`, error);
    return null;
  }
}
