import { existsSync } from 'node:fs';
import path from 'node:path';

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
    // Calcola il path relativo correttamente
    const relativePath = path.relative(process.cwd(), autowrapFilePath).replace(/\\/g, '/');
    
    return {
      filePath: autowrapFilePath,
      relativePath: relativePath.startsWith('.') ? relativePath : `./${relativePath}`,
    };
  } catch (error) {
    console.warn('Failed to load autowrap functions:', error);
    return null;
  }
}
