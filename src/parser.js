import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';

// Handle default export for traverse
const babelTraverse = traverse.default || traverse;

export function isServerSideFile(filePath) {
  return filePath.includes('.server.') || 
         filePath.endsWith('+page.server.ts') || 
         filePath.endsWith('+page.server.js') ||
         filePath.endsWith('+layout.server.ts') ||
         filePath.endsWith('+layout.server.js') ||
         filePath.endsWith('+server.ts') ||
         filePath.endsWith('+server.js');
}

export function parseFile(code, filePath) {
  const functions = [];
  let autowrapConfig = { enabled: true, granular: null }; // Default: everything enabled
  
  try {
    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
      allowImportExportEverywhere: true,
      allowReturnOutsideFunction: true,
    });

    babelTraverse(ast, {
      ExportNamedDeclaration(path) {
        const declaration = path.node.declaration;
        
        if (t.isVariableDeclaration(declaration)) {
          for (const declarator of declaration.declarations) {
            if (t.isIdentifier(declarator.id)) {
              // Check for config.decorators
              if (declarator.id.name === 'config') {
                autowrapConfig = parseAutowrapConfig(declarator.init);
                continue;
              }

              const functionInfo = analyzeFunctionDeclarator(
                declarator,
                filePath,
                path.node.loc?.start.line || 0,
                path.node.loc?.end.line || 0
              );
              
              if (functionInfo) {
                // If it's an array (multiple actions), add them all
                if (Array.isArray(functionInfo)) {
                  functions.push(...functionInfo);
                } else {
                  functions.push(functionInfo);
                }
              }
            }
          }
        } else if (t.isFunctionDeclaration(declaration)) {
          // Handle export function declarations (like export async function GET)
          const name = declaration.id.name;
          const functionType = determineFunctionType(name, filePath);
          
          if (functionType) {
            functions.push({
              name,
              type: functionType,
              startLine: path.node.loc?.start.line || 0,
              endLine: path.node.loc?.end.line || 0,
              isAsync: declaration.async,
            });
          }
        }
      },
      
    });
  } catch (error) {
    console.warn(`Failed to parse ${filePath}:`, error);
    return { functions: [], autowrapConfig: { enabled: true } };
  }

  return { functions, autowrapConfig };
}

function analyzeFunctionDeclarator(declarator, filePath, startLine, endLine) {
  if (!t.isIdentifier(declarator.id)) {
    return null;
  }

  const name = declarator.id.name;
  const init = declarator.init;

  // Determine function type based on name and file path
  const functionType = determineFunctionType(name, filePath);
  if (!functionType) {
    return null;
  }

  // If it's an actions object, extract the individual actions
  if (functionType === 'actions' && t.isObjectExpression(init)) {
    const individualActions = [];
    
    for (const property of init.properties) {
      if (t.isObjectProperty(property) && t.isIdentifier(property.key)) {
        individualActions.push({
          name: 'actions',
          type: 'actions',
          action: property.key.name, // Nome specifico dell'action
          startLine,
          endLine,
          isAsync: isAsyncFunction(property.value),
        });
      }
    }
    
    return individualActions;
  }

  // Check if it's an async function
  const isAsync = init ? isAsyncFunction(init) : false;

  return {
    name,
    type: functionType,
    startLine,
    endLine,
    isAsync,
  };
}

function determineFunctionType(name, filePath) {
  if (filePath.includes('+server.')) {
    // API routes with HTTP methods
    if (['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'].includes(name)) {
      return 'api';
    }
  } else {
    if (name === 'load') {
      return 'load';
    }
    if (name === 'actions') {
      return 'actions';
    }
  }
  
  return null;
}

function isAsyncFunction(node) {
  if (t.isFunctionExpression(node) || t.isFunctionDeclaration(node)) {
    return node.async;
  }
  
  if (t.isArrowFunctionExpression(node)) {
    return node.async;
  }
  
  return false;
}

export function hasLoadFunction(code) {
  try {
    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
    });

    let hasLoad = false;
    
    babelTraverse(ast, {
      ExportNamedDeclaration(path) {
        const declaration = path.node.declaration;
        
        if (t.isVariableDeclaration(declaration)) {
          for (const declarator of declaration.declarations) {
            if (t.isIdentifier(declarator.id) && declarator.id.name === 'load') {
              hasLoad = true;
            }
          }
        }
      },
    });

    return hasLoad;
  } catch {
    return false;
  }
}

function parseAutowrapConfig(node) {
  const config = { enabled: true, granular: null };
  
  if (!t.isObjectExpression(node)) {
    return config;
  }

  for (const property of node.properties) {
    if (t.isObjectProperty(property) && t.isIdentifier(property.key)) {
      if (property.key.name === 'decorators') {
        if (t.isBooleanLiteral(property.value)) {
          // Simple configuration: decorators: false
          config.enabled = property.value.value;
          config.granular = null;
        } else if (t.isObjectExpression(property.value)) {
          // Granular configuration: decorators: { load: false, actions: ['delete'] }
          config.enabled = true; // At least something is configured
          config.granular = {};
          
          for (const subProperty of property.value.properties) {
            if (t.isObjectProperty(subProperty) && t.isIdentifier(subProperty.key)) {
              const key = subProperty.key.name;
              
              if (t.isBooleanLiteral(subProperty.value)) {
                config.granular[key] = subProperty.value.value;
              } else if (t.isArrayExpression(subProperty.value) && (key === 'actions' || key === 'api')) {
                // Array of specific actions/API methods to enable
                config.granular[key] = subProperty.value.elements
                  .filter(el => t.isStringLiteral(el))
                  .map(el => el.value);
              }
            }
          }
        }
      }
    }
  }
  
  return config;
}
