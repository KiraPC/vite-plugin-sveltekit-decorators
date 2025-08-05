import { describe, expect, it } from 'vitest';
import { parseFile } from '../src/parser.js';

describe('Parser', () => {
  describe('parseFile - Load Functions', () => {
    it('should parse load function in server file', () => {
      const code = `
        export const load = async ({ params }) => {
          return { data: 'test' };
        };
      `;
      
      const result = parseFile(code, '/src/routes/+page.server.js');
      const { functions } = result;
      
      expect(functions).toHaveLength(1);
      expect(functions[0]).toMatchObject({
        name: 'load',
        type: 'load',
        isAsync: true,
      });
    });

    it('should parse sync load function', () => {
      const code = `
        export const load = ({ params }) => {
          return { data: 'test' };
        };
      `;
      
      const result = parseFile(code, '/src/routes/+page.server.js');
      const { functions } = result;
      
      expect(functions).toHaveLength(1);
      expect(functions[0]).toMatchObject({
        name: 'load',
        type: 'load',
        isAsync: false,
      });
    });
  });

  describe('parseFile - Actions', () => {
    it('should parse actions object with multiple actions', () => {
      const code = `
        export const actions = {
          default: async ({ request }) => {
            return { success: true };
          },
          delete: async ({ request }) => {
            return { deleted: true };
          },
          update: ({ request }) => {
            return { updated: true };
          }
        };
      `;
      
      const result = parseFile(code, '/src/routes/+page.server.js');
      const { functions } = result;
      
      expect(functions).toHaveLength(3);
      
      // Check default action
      const defaultAction = functions.find(f => f.action === 'default');
      expect(defaultAction).toMatchObject({
        name: 'actions',
        type: 'actions',
        action: 'default',
        isAsync: true,
      });
      
      // Check delete action
      const deleteAction = functions.find(f => f.action === 'delete');
      expect(deleteAction).toMatchObject({
        name: 'actions',
        type: 'actions',
        action: 'delete',
        isAsync: true,
      });
      
      // Check update action
      const updateAction = functions.find(f => f.action === 'update');
      expect(updateAction).toMatchObject({
        name: 'actions',
        type: 'actions',
        action: 'update',
        isAsync: false,
      });
    });

    it('should parse single action', () => {
      const code = `
        export const actions = {
          login: async ({ request }) => {
            return { success: true };
          }
        };
      `;
      
      const result = parseFile(code, '/src/routes/login/+page.server.js');
      const { functions } = result;
      
      expect(functions).toHaveLength(1);
      expect(functions[0]).toMatchObject({
        name: 'actions',
        type: 'actions',
        action: 'login',
        isAsync: true,
      });
    });
  });

  describe('parseFile - API Routes', () => {
    it('should parse multiple HTTP methods', () => {
      const code = `
        export async function GET({ url }) {
          return new Response(JSON.stringify({ method: 'GET' }));
        }
        
        export async function POST({ request }) {
          return new Response(JSON.stringify({ method: 'POST' }));
        }
        
        export function DELETE() {
          return new Response(JSON.stringify({ method: 'DELETE' }));
        }
      `;
      
      const result = parseFile(code, '/src/routes/api/users/+server.js');
      const { functions } = result;
      
      expect(functions).toHaveLength(3);
      
      // Check GET function
      const getFunction = functions.find(f => f.name === 'GET');
      expect(getFunction).toMatchObject({
        name: 'GET',
        type: 'api',
        isAsync: true,
      });
      
      // Check POST function
      const postFunction = functions.find(f => f.name === 'POST');
      expect(postFunction).toMatchObject({
        name: 'POST',
        type: 'api',
        isAsync: true,
      });
      
      // Check DELETE function
      const deleteFunction = functions.find(f => f.name === 'DELETE');
      expect(deleteFunction).toMatchObject({
        name: 'DELETE',
        type: 'api',
        isAsync: false,
      });
    });

    it('should parse single API method', () => {
      const code = `
        export async function PUT({ request, params }) {
          const data = await request.json();
          return new Response(JSON.stringify(data));
        }
      `;
      
      const result = parseFile(code, '/src/routes/api/items/[id]/+server.js');
      const { functions } = result;
      
      expect(functions).toHaveLength(1);
      expect(functions[0]).toMatchObject({
        name: 'PUT',
        type: 'api',
        isAsync: true,
      });
    });
  });

  describe('parseFile - Decorators Configuration', () => {
    it('should parse disabled decorators config', () => {
      const code = `
        export const config = {
          decorators: false
        };
        
        export const load = async () => {
          return { data: 'test' };
        };
      `;
      
      const result = parseFile(code, '/src/routes/+page.server.js');
      const { autowrapConfig } = result;
      
      expect(autowrapConfig.enabled).toBe(false);
    });

    it('should parse granular decorators config', () => {
      const code = `
        export const config = {
          decorators: {
            load: true,
            actions: ['delete', 'update']
          }
        };
        
        export const actions = {
          delete: async () => ({ success: true }),
          create: async () => ({ success: true })
        };
      `;
      
      const result = parseFile(code, '/src/routes/+page.server.js');
      const { autowrapConfig } = result;
      
      expect(autowrapConfig.enabled).toBe(true);
      expect(autowrapConfig.granular).toEqual({
        load: true,
        actions: ['delete', 'update']
      });
    });

    it('should default to enabled when no config', () => {
      const code = `
        export const load = async () => {
          return { data: 'test' };
        };
      `;
      
      const result = parseFile(code, '/src/routes/+page.server.js');
      const { autowrapConfig } = result;
      
      expect(autowrapConfig.enabled).toBe(true);
      expect(autowrapConfig.granular).toBeNull();
    });
  });

  describe('parseFile - Mixed Functions', () => {
    it('should parse load and actions together', () => {
      const code = `
        export const load = async ({ params }) => {
          return { data: params };
        };
        
        export const actions = {
          default: async ({ request }) => {
            return { success: true };
          }
        };
      `;
      
      const result = parseFile(code, '/src/routes/+page.server.js');
      const { functions } = result;
      
      expect(functions).toHaveLength(2);
      
      const loadFunction = functions.find(f => f.name === 'load');
      expect(loadFunction).toMatchObject({
        name: 'load',
        type: 'load',
      });
      
      const actionFunction = functions.find(f => f.name === 'actions');
      expect(actionFunction).toMatchObject({
        name: 'actions',
        type: 'actions',
        action: 'default',
      });
    });
  });

  describe('parseFile - Edge Cases', () => {
    it('should handle empty file', () => {
      const code = '';
      
      const result = parseFile(code, '/src/routes/+page.server.js');
      const { functions } = result;
      
      expect(functions).toHaveLength(0);
    });

    it('should handle file with no exports', () => {
      const code = `
        const someFunction = () => {
          return 'test';
        };
      `;
      
      const result = parseFile(code, '/src/routes/+page.server.js');
      const { functions } = result;
      
      expect(functions).toHaveLength(0);
    });

    it('should handle file with non-function exports', () => {
      const code = `
        export const someVariable = 'test';
        export const someObject = { key: 'value' };
      `;
      
      const result = parseFile(code, '/src/routes/+page.server.js');
      const { functions } = result;
      
      expect(functions).toHaveLength(0);
    });
  });
});
