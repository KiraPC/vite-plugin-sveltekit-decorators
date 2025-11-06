import type { RequestEvent } from '@sveltejs/kit';
import type { ActionsDecorator, ApiDecorator, RemoteFunctionDecorator, ServerLoadDecorator } from 'vite-plugin-sveltekit-decorators';

// Decorator for server load functions
export const loadDecorator: ServerLoadDecorator = (originalFunction, metadata) => {
  return async (event) => {
    const start = performance.now();
    const functionName = metadata.functionName || 'load';
    const fileName = metadata.filePath.split('/').pop() || 'unknown';
    
    console.log(`🔄 [SERVER-LOAD] Starting execution of '${functionName}' in ${fileName}`);
    console.log(`� [SERVER-LOAD] Location: ${metadata.filePath}:${metadata.startLine}-${metadata.endLine}`);
    console.log(`⚡ [SERVER-LOAD] Route: ${event.route?.id || 'unknown'}`);
    
    try {
      const result = await originalFunction(event);
      const duration = performance.now() - start;
      
      if (duration > 500) {
        console.warn(`⚠️  [SERVER-LOAD] Slow execution detected: ${functionName} took ${duration.toFixed(2)}ms`);
      } else {
        console.log(`✅ [SERVER-LOAD] Successfully completed '${functionName}' in ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.error(`❌ [SERVER-LOAD] Failed '${functionName}' after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  };
};

// Decorator for actions - now handles one action at a time
export const actionsDecorator: ActionsDecorator = (originalFunction, metadata) => {
  return async (event: RequestEvent) => {
    const start = performance.now();
    const actionName = metadata.action;
    const fileName = metadata.filePath.split('/').pop() || 'unknown';
    const formData = event.request.method === 'POST' ? ' (with form data)' : '';
    
    console.log(`🎯 [ACTION] Executing action '${actionName}' in ${fileName}${formData}`);
    console.log(`📍 [ACTION] Location: ${metadata.filePath}:${metadata.startLine}-${metadata.endLine}`);
    console.log(`🌐 [ACTION] Route: ${event.route?.id || 'unknown'} | Method: ${event.request.method}`);
    
    try {
      const result = await originalFunction(event);
      const duration = performance.now() - start;
      
      if (duration > 1000) {
        console.warn(`⚠️  [ACTION] Slow action detected: '${actionName}' took ${duration.toFixed(2)}ms`);
      } else {
        console.log(`✅ [ACTION] Successfully completed action '${actionName}' in ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.error(`❌ [ACTION] Failed action '${actionName}' after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  };
};

// Decorator for API routes (GET, POST, DELETE, etc.)
export const apiDecorator: ApiDecorator = (originalFunction, metadata) => {
  return async (event) => {
    const start = performance.now();
    const method = metadata.method || metadata.functionName || 'API';
    const fileName = metadata.filePath.split('/').pop() || 'unknown';
    const url = event.url.pathname;
    const userAgent = event.request.headers.get('user-agent')?.split(' ')[0] || 'unknown';
    
    console.log(`🌐 [API-${method}] Processing ${method} request to ${url}`);
    console.log(`� [API-${method}] Handler in ${fileName} at lines ${metadata.startLine}-${metadata.endLine}`);
    console.log(`� [API-${method}] Client: ${userAgent} | Content-Type: ${event.request.headers.get('content-type') || 'none'}`);
    
    try {
      const result = await originalFunction(event);
      const duration = performance.now() - start;
      const status = result instanceof Response ? result.status : 'unknown';
      
      if (duration > 2000) {
        console.warn(`⚠️  [API-${method}] Slow API detected: ${url} took ${duration.toFixed(2)}ms`);
      } else {
        console.log(`✅ [API-${method}] ${method} ${url} completed successfully in ${duration.toFixed(2)}ms (status: ${status})`);
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.error(`❌ [API-${method}] Failed ${method} ${url} after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  };
};

// Decorator for Remote Functions (SvelteKit RPC)
export const remoteFunctionDecorator: RemoteFunctionDecorator = (originalFunction, metadata) => {
  return async (...args) => {
    const start = performance.now();
    const functionName = metadata.functionName;
    const fileName = metadata.filePath.split('/').pop() || 'unknown';

    console.log(`🚀 [REMOTE-FN] Calling remote function ${metadata.remoteType} '${functionName}' in ${fileName}`);
    console.log(`📍 [REMOTE-FN] Location: ${metadata.filePath}:${metadata.startLine}-${metadata.endLine}`);
    console.log(`📦 [REMOTE-FN] Arguments: ${args.length > 0 ? JSON.stringify(args, null, 2) : 'none'}`);
    
    try {
      const result = await originalFunction(...args);
      const duration = performance.now() - start;
      
      if (duration > 1000) {
        console.warn(`⚠️  [REMOTE-FN] Slow remote function: '${functionName}' took ${duration.toFixed(2)}ms`);
      } else {
        console.log(`✅ [REMOTE-FN] Successfully completed '${functionName}' in ${duration.toFixed(2)}ms`);
      }
      
      console.log(`📤 [REMOTE-FN] Result: ${typeof result === 'object' ? JSON.stringify(result, null, 2) : result}`);
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.error(`❌ [REMOTE-FN] Failed '${functionName}' after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  };
};
