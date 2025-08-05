import type { LoadDecorator } from 'vite-plugin-sveltekit-decorators';

export const loadDecorator: LoadDecorator = (originalFunction, metadata) => {
  return async (event) => {
    const start = performance.now();
    const functionName = metadata.functionName || 'load';
    const route = event.route?.id || 'unknown';
    
    console.log(`🔄 [CLIENT-LOAD] Starting client-side load for route: ${route}`);
    console.log(`⚡ [CLIENT-LOAD] Function: '${functionName}' | Async: ${metadata.isAsync}`);
    console.log(`🌍 [CLIENT-LOAD] URL: ${event.url.pathname}${event.url.search}`);
    
    try {
      const result = await originalFunction(event);
      const duration = performance.now() - start;
      
      if (duration > 300) {
        console.warn(`⚠️  [CLIENT-LOAD] Slow client load detected: ${route} took ${duration.toFixed(2)}ms`);
      } else {
        console.log(`✅ [CLIENT-LOAD] Successfully completed '${functionName}' for ${route} in ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.error(`❌ [CLIENT-LOAD] Failed '${functionName}' for ${route} after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  };
};
