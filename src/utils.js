import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

// Handle default export for traverse
const babelTraverse = traverse.default || traverse;

export function debugLog(message, ...args) {
  if (process.env.DEBUG_SVELTEKIT_DECORATORS) {
    console.log(`[vite-plugin-sveltekit-decorators] ${message}`, ...args);
  }
}

export function normalizeFilePath(filePath) {
  return filePath.replace(/\\/g, '/');
}

export function findAutowrapFile(rootPath, config, isServerSide = true) {
  // Determine which file to look for based on context
  const fileName = isServerSide ? '+decorators.server' : '+decorators';
  
  // Start with default paths
  const possiblePaths = [
    path.join(rootPath, `src/${fileName}.ts`),
    path.join(rootPath, `src/${fileName}.js`),
    path.join(rootPath, `${fileName}.ts`),
    path.join(rootPath, `${fileName}.js`),
  ];
  
  // Add custom path if specified in config
  if (isServerSide && config.serverWrapperFile) {
    possiblePaths.unshift(path.join(rootPath, config.serverWrapperFile));
  } else if (!isServerSide && config.clientWrapperFile) {
    possiblePaths.unshift(path.join(rootPath, config.clientWrapperFile));
  }

  for (const filePath of possiblePaths) {
    if (existsSync(filePath)) {
      debugLog(`Found autowrap file (${isServerSide ? 'server' : 'client'}):`, filePath);
      return filePath;
    }
  }

  return null;
}

export function loadAutowrapFunctions(autowrapFilePath) {
  if (!autowrapFilePath || !existsSync(autowrapFilePath)) {
    return null;
  }

  try {
    const relativePath = path.relative(process.cwd(), autowrapFilePath).replace(/\\/g, '/');
  
    const fileContent = readFileSync(autowrapFilePath, 'utf-8');
    const availableDecorators = new Set();
    
    // Parse the file with Babel to extract exported decorators
    const ast = parse(fileContent, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
    });
    
    // Decorators we're looking for
    const decoratorNames = new Set([
      'loadDecorator',
      'serverLoadDecorator', 
      'actionsDecorator',
      'apiDecorator',
      'remoteFunctionDecorator'
    ]);
    
    // Traverse AST to find exported decorator functions
    babelTraverse(ast, {
      ExportNamedDeclaration(path) {
        const declaration = path.node.declaration;
        
        // Handle: export const loadDecorator = ...
        if (t.isVariableDeclaration(declaration)) {
          for (const declarator of declaration.declarations) {
            if (t.isIdentifier(declarator.id) && decoratorNames.has(declarator.id.name)) {
              availableDecorators.add(declarator.id.name);
            }
          }
        }
        
        // Handle: export function loadDecorator() { ... }
        if (t.isFunctionDeclaration(declaration) && declaration.id) {
          if (decoratorNames.has(declaration.id.name)) {
            availableDecorators.add(declaration.id.name);
          }
        }
      }
    });
    
    return {
      filePath: autowrapFilePath,
      relativePath: relativePath.startsWith('.') ? relativePath : `./${relativePath}`,
      availableDecorators,
    };
  } catch (error) {
    console.warn('Failed to load autowrap functions:', error);
    return null;
  }
}
