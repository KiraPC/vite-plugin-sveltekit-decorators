import { normalizeConfig, shouldEnable, shouldProcessFile } from './config.js';
import { hasLoadFunction, isServerSideFile } from './parser.js';
import { transformFile } from './transformer.js';
import { debugLog, findAutowrapFile, loadAutowrapFunctions, normalizeFilePath } from './utils.js';

export function createPlugin(userConfig = {}) {
  return svelteKitDecorators(userConfig);
}

export function svelteKitDecorators(userConfig = {}) {
  const config = normalizeConfig(userConfig);
  let isEnabled = false;
  let serverAutowrapInfo = null;
  let clientAutowrapInfo = null;
  
  return {
    name: 'vite-plugin-sveltekit-decorators',
    enforce: 'post', // Run after other plugins to avoid conflicts
    
    configResolved(resolvedConfig) {
      isEnabled = shouldEnable(config, resolvedConfig.command);
      
      if (isEnabled) {
        // Find and load the +decorators.server.ts file
        const serverAutowrapFilePath = findAutowrapFile(resolvedConfig.root, config, true);
        if (serverAutowrapFilePath) {
          serverAutowrapInfo = loadAutowrapFunctions(serverAutowrapFilePath);
          console.log('[vite-plugin-sveltekit-decorators] Loaded server autowrap functions from:', serverAutowrapFilePath);
        } else {
          console.log('[vite-plugin-sveltekit-decorators] No server autowrap file found');
        }
        
        // Find and load the +decorators.ts file for client-side
        const clientAutowrapFilePath = findAutowrapFile(resolvedConfig.root, config, false);
        if (clientAutowrapFilePath) {
          clientAutowrapInfo = loadAutowrapFunctions(clientAutowrapFilePath);
          console.log('[vite-plugin-sveltekit-decorators] Loaded client autowrap functions from:', clientAutowrapFilePath);
        } else {
          console.log('[vite-plugin-sveltekit-decorators] No client autowrap file found');
        }
        
        if (!serverAutowrapInfo && !clientAutowrapInfo) {
          console.warn('[vite-plugin-sveltekit-decorators] No autowrap files found. Plugin will have no effect.');
          console.warn('[vite-plugin-sveltekit-decorators] Create +decorators.server.ts and/or +decorators.ts files in your src/ directory.');
        }
      }
      
      debugLog('Plugin enabled:', isEnabled);
      debugLog('Config:', config);
      debugLog('Server autowrap info:', serverAutowrapInfo);
      debugLog('Client autowrap info:', clientAutowrapInfo);
    },
    
    transform(code, id) {
      if (!isEnabled || (!serverAutowrapInfo && !clientAutowrapInfo)) {
        return null;
      }
      
      const filePath = normalizeFilePath(id);
      
      // Skip node_modules, .svelte-kit, and any .svelte files
      if (filePath.includes('node_modules') || 
          filePath.includes('.svelte-kit') ||
          filePath.endsWith('.svelte') ||
          id.includes('?')) { // Skip query parameters (Vite virtual modules)
        return null;
      }
      
      // Only process actual TypeScript/JavaScript files
      if (!/\.(ts|js)$/.test(filePath)) {
        return null;
      }
      
      // Check if this file should be processed
      if (!shouldProcessFile(filePath)) {
        return null;
      }
      
      // Determine if this is a server-side file and choose appropriate autowrap info
      const isServerFile = isServerSideFile(filePath);
      const autowrapInfo = isServerFile ? serverAutowrapInfo : clientAutowrapInfo;
      
      // Skip if no appropriate autowrap file is available
      if (!autowrapInfo) {
        debugLog(`Skipping ${isServerFile ? 'server' : 'client'} file (no autowrap file):`, filePath);
        return null;
      }
      
      // For non-server files, only process if they contain load functions
      if (!isServerFile && !hasLoadFunction(code)) {
        return null;
      }
      
      debugLog(`Processing ${isServerFile ? 'server' : 'client'} file:`, filePath);
      
      try {
        const result = transformFile(code, filePath, config, serverAutowrapInfo, clientAutowrapInfo, isServerFile);
        
        if (result.changed) {
          debugLog('Transformed file:', filePath);
          return {
            code: result.code,
            map: result.map,
          };
        }

        return null;
      } catch (error) {
        console.error(`Error processing ${filePath}:`, error);
        return null;
      }
    },
    
    buildStart() {
      if (!isEnabled) {
        return;
      }
      
      if (!serverAutowrapInfo && !clientAutowrapInfo) {
        console.warn('[sveltekit-autowrap] No autowrap files found. Plugin will have no effect.');
        console.warn('[sveltekit-decorators] Create +decorators.server.ts and/or +decorators.ts files to define wrapper functions.');
      } else {
        if (serverAutowrapInfo) {
          debugLog('Starting build with server autowrap file:', serverAutowrapInfo.filePath);
        }
        if (clientAutowrapInfo) {
          debugLog('Starting build with client autowrap file:', clientAutowrapInfo.filePath);
        }
      }
    },
    
    buildEnd() {
      if (isEnabled) {
        debugLog('Build completed');
      }
    },
  };
}

// Default export for convenience
export default svelteKitDecorators;
