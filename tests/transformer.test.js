import { describe, expect, it } from 'vitest';
import { transformFile } from '../src/transformer.js';

describe('Transformer', () => {
  // Mock data con i vecchi nomi per testare retrocompatibilità
  const mockFunctionInfo = {
    name: 'load',
    type: 'load',
    filePath: '/src/routes/+page.server.js',
    functions: [
      { name: 'load', type: 'load' },
    ]
  };
  
  const mockServerAutowrapInfo = {
    filePath: 'src/+decorators.server.ts',
    functions: ['loadDecorator']
  };
  
  const mockClientAutowrapInfo = {
    filePath: 'src/+decorators.ts',
    functions: ['loadDecorator']
  };

  describe('Load Function Transformation', () => {
    it('should wrap load function', () => {
      const code = `
        export const load = async ({ params }) => {
          return { data: 'test' };
        };
      `;
      
      const result = transformFile(
        code, 
        '/src/routes/+page.server.js', 
        {}, 
        mockServerAutowrapInfo, 
        mockClientAutowrapInfo,
        true
      );
      
      expect(result.changed).toBe(true);
      expect(result.code).toContain('import { loadDecorator } from');
      expect(result.code).toContain('loadDecorator(');
      expect(result.code).toContain('filePath');
      expect(result.code).toContain('functionName');
    });

    it('should not wrap load function when disabled', () => {
      const code = `
        export const config = {
          decorators: false
        };
        
        export const load = async ({ params }) => {
          return { data: 'test' };
        };
      `;
      
      const result = transformFile(
        code, 
        '/src/routes/+page.server.js', 
        {}, 
        mockServerAutowrapInfo, 
        mockClientAutowrapInfo,
        true
      );
      
      expect(result.changed).toBe(false);
      expect(result.code).not.toContain('loadDecorator');
    });
  });

  describe('Actions Transformation', () => {
    it('should wrap all actions by default', () => {
      const code = `
        export const actions = {
          default: async ({ request }) => {
            return { success: true };
          },
          delete: async ({ request }) => {
            return { deleted: true };
          }
        };
      `;
      
      const result = transformFile(
        code, 
        '/src/routes/+page.server.js', 
        {}, 
        mockServerAutowrapInfo, 
        mockClientAutowrapInfo,
        true
      );
      
      expect(result.changed).toBe(true);
      expect(result.code).toContain('import { actionsDecorator } from');
      
      // Should wrap both actions
      const wrappedMatches = result.code.match(/actionsDecorator\(/g);
      expect(wrappedMatches).toHaveLength(2);
    });

    it('should wrap only specified actions with granular config', () => {
      const code = `
        export const config = {
          decorators: {
            actions: ['delete'] // Only wrap 'delete' action
          }
        };
        
        export const actions = {
          default: async ({ request }) => {
            return { success: true };
          },
          delete: async ({ request }) => {
            return { deleted: true };
          },
          update: async ({ request }) => {
            return { updated: true };
          }
        };
      `;
      
      const result = transformFile(
        code, 
        '/src/routes/+page.server.js', 
        {}, 
        mockServerAutowrapInfo, 
        mockClientAutowrapInfo,
        true
      );
      
      expect(result.changed).toBe(true);
      expect(result.code).toContain('import { actionsDecorator } from');
      
      // Should wrap only the delete action
      const wrappedMatches = result.code.match(/actionsDecorator\(/g);
      expect(wrappedMatches).toHaveLength(1);
      
      // Check that delete is wrapped but default and update are not
      expect(result.code).toMatch(/delete:\s*actionsDecorator\(/);
      expect(result.code).not.toMatch(/default:\s*actionsDecorator\(/);
      expect(result.code).not.toMatch(/update:\s*actionsDecorator\(/);
    });

    it('should not wrap any actions when disabled', () => {
      const code = `
        export const config = {
          decorators: {
            actions: false
          }
        };
        
        export const actions = {
          default: async ({ request }) => {
            return { success: true };
          }
        };
      `;
      
      const result = transformFile(
        code, 
        '/src/routes/+page.server.js', 
        {}, 
        mockServerAutowrapInfo, 
        mockClientAutowrapInfo,
        true
      );
      
      expect(result.changed).toBe(false);
      expect(result.code).not.toContain('actionsDecorator');
    });
  });

  describe('Client-Side vs Server-Side', () => {
    it('should exclude sensitive information from client metadata', () => {
      const code = `
        export const load = async ({ params }) => {
          return { data: 'test' };
        };
      `;
      
      const result = transformFile(
        code, 
        '/src/routes/+page.js', 
        {}, 
        mockServerAutowrapInfo, 
        mockClientAutowrapInfo,
        false // client-side
      );
      
      expect(result.changed).toBe(true);
      expect(result.code).toContain('loadDecorator(');
      
      // Should include safe metadata
      expect(result.code).toContain('functionName');
      expect(result.code).toContain('timestamp');
      expect(result.code).toContain('isAsync');
      
      // Should not contain sensitive information
      expect(result.code).not.toContain('filePath');
      expect(result.code).not.toContain('startLine');
      expect(result.code).not.toContain('endLine');
    });

    it('should include metadata in server-side transformations', () => {
      const code = `
        export const load = async ({ params }) => {
          return { data: 'test' };
        };
      `;
      
      const result = transformFile(
        code, 
        '/src/routes/+page.server.js', 
        {}, 
        mockServerAutowrapInfo, 
        mockClientAutowrapInfo,
        true // server-side
      );
      
      expect(result.changed).toBe(true);
      expect(result.code).toContain('loadDecorator(');
      
      // Should contain metadata object
      expect(result.code).toContain('filePath');
      expect(result.code).toContain('functionName');
      expect(result.code).toContain('timestamp');
    });
  });

  describe('Granular Configuration', () => {
    it('should respect load granular config', () => {
      const code = `
        export const config = {
          decorators: {
            load: false,
            actions: true
          }
        };
        
        export const load = async ({ params }) => {
          return { data: 'test' };
        };
        
        export const actions = {
          default: async () => ({ success: true })
        };
      `;
      
      const result = transformFile(
        code, 
        '/src/routes/+page.server.js', 
        {}, 
        mockServerAutowrapInfo, 
        mockClientAutowrapInfo,
        true
      );
      
      expect(result.changed).toBe(true);
      expect(result.code).not.toContain('loadDecorator');
      expect(result.code).toContain('actionsDecorator');
    });
  });

  describe('Import Generation', () => {
    it('should generate correct relative imports', () => {
      const code = `
        export const load = async ({ params }) => {
          return { data: 'test' };
        };
      `;
      
      const result = transformFile(
        code, 
        '/src/routes/user/+page.server.js', 
        {}, 
        mockServerAutowrapInfo, 
        mockClientAutowrapInfo,
        true
      );
      
      expect(result.changed).toBe(true);
      // Should contain relative path import
      expect(result.code).toContain("import { loadDecorator } from");
    });

    it('should import only needed wrappers', () => {
      const code = `
        export const load = async ({ params }) => {
          return { data: 'test' };
        };
        
        export const actions = {
          default: async () => ({ success: true })
        };
      `;
      
      const result = transformFile(
        code, 
        '/src/routes/+page.server.js', 
        {}, 
        mockServerAutowrapInfo, 
        mockClientAutowrapInfo,
        true
      );
      
      expect(result.changed).toBe(true);
      expect(result.code).toContain('import { loadDecorator, actionsDecorator } from');
      expect(result.code).not.toContain('wrapHooks');
    });
  });

  describe('Error Handling', () => {
    it('should handle syntax errors gracefully', () => {
      const code = `
        export const load = async ({ params }) => {
          return { data: 'test'
        // Missing closing brace and semicolon
      `;
      
      const result = transformFile(
        code, 
        '/src/routes/+page.server.js', 
        {}, 
        mockServerAutowrapInfo, 
        mockClientAutowrapInfo,
        true
      );
      
      expect(result.changed).toBe(false);
      expect(result.code).toBe(code); // Should return original code
    });

    it('should handle missing autowrap info', () => {
      const code = `
        export const load = async ({ params }) => {
          return { data: 'test' };
        };
      `;
      
      const result = transformFile(
        code, 
        '/src/routes/+page.server.js', 
        {}, 
        null, // no autowrap info
        null,
        true
      );
      
      expect(result.changed).toBe(false);
      expect(result.code).toBe(code);
    });
  });

  describe('Metadata Generation', () => {
    it('should include correct metadata for actions', () => {
      const code = `
        export const actions = {
          login: async ({ request }) => {
            return { success: true };
          }
        };
      `;
      
      const result = transformFile(
        code, 
        '/src/routes/auth/+page.server.js', 
        {}, 
        mockServerAutowrapInfo, 
        mockClientAutowrapInfo,
        true
      );
      
      expect(result.changed).toBe(true);
      expect(result.code).toContain('"action":"login"');
      expect(result.code).toContain('"functionType":"actions"');
      expect(result.code).toContain('"functionName":"actions"');
      expect(result.code).toContain('"/src/routes/auth/+page.server.js"');
    });

    it('should include correct metadata for API routes', () => {
      const code = `
        export async function GET({ url }) {
          return new Response(JSON.stringify({ data: [] }));
        }
        
        export async function POST({ request }) {
          const data = await request.json();
          return new Response(JSON.stringify(data));
        }
      `;
      
      const result = transformFile(
        code,
        '/src/routes/api/users/+server.js',
        {},
        mockServerAutowrapInfo, 
        mockClientAutowrapInfo,
        {}
      );
      
      expect(result.changed).toBe(true);
      expect(result.code).toContain('"method":"GET"');
      expect(result.code).toContain('"method":"POST"');
      expect(result.code).toContain('"functionType":"api"');
      expect(result.code).toContain('"/src/routes/api/users/+server.js"');
    });

    it('should exclude sensitive information from client metadata', () => {
      const code = `
        export const load = async ({ fetch }) => {
          return { data: 'test' };
        };
      `;
      
      // Test client-side transformation
      const clientResult = transformFile(
        code,
        '/src/routes/+page.js',
        {},
        {},
        mockClientAutowrapInfo,
        false // isServerSide = false
      );
      
      expect(clientResult.changed).toBe(true);
      // Client-side metadata should not contain sensitive information
      expect(clientResult.code).not.toContain('"filePath"');
      expect(clientResult.code).not.toContain('"startLine"');
      expect(clientResult.code).not.toContain('"endLine"');
      
      // Test server-side transformation for comparison
      const serverResult = transformFile(
        code,
        '/src/routes/+page.server.js',
        {},
        mockServerAutowrapInfo,
        {},
        true // isServerSide = true
      );
      
      expect(serverResult.changed).toBe(true);
      // Server-side metadata should contain sensitive information
      expect(serverResult.code).toContain('"filePath"');
      expect(serverResult.code).toContain('"startLine"');
      expect(serverResult.code).toContain('"endLine"');
    });
  });
});
