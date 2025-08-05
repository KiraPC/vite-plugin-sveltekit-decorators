import { describe, expect, it } from 'vitest';
import { parseFile } from '../src/parser.js';
import { transformFile } from '../src/transformer.js';

describe('Real-World Use Cases', () => {
  const mockAutowrapInfo = {
    filePath: '/src/+decorators.server.js',
    functions: {
      load: 'loadDecorator',
      actions: 'actionsDecorator',
    }
  };

  describe('E-commerce Application', () => {
    it('should handle product page with load and actions', () => {
      const code = `
        import { db } from '$lib/database';
        
        export const load = async ({ params }) => {
          const product = await db.products.findUnique({
            where: { id: params.id }
          });
          
          return {
            product
          };
        };
        
        export const actions = {
          addToCart: async ({ request, cookies }) => {
            const data = await request.formData();
            const productId = data.get('productId');
            const quantity = Number(data.get('quantity'));
            
            // Add to cart logic
            const cart = cookies.get('cart') || '[]';
            const cartItems = JSON.parse(cart);
            cartItems.push({ productId, quantity });
            
            cookies.set('cart', JSON.stringify(cartItems));
            
            return { success: true };
          },
          
          removeFromCart: async ({ request, cookies }) => {
            const data = await request.formData();
            const productId = data.get('productId');
            
            const cart = cookies.get('cart') || '[]';
            const cartItems = JSON.parse(cart);
            const updatedCart = cartItems.filter(item => item.productId !== productId);
            
            cookies.set('cart', JSON.stringify(updatedCart));
            
            return { success: true };
          }
        };
      `;

      const parseResult = parseFile(code, '/src/routes/products/[id]/+page.server.js');
      expect(parseResult.functions).toHaveLength(3);
      
      const loadFunction = parseResult.functions.find(f => f.name === 'load');
      expect(loadFunction).toMatchObject({
        name: 'load',
        type: 'load',
        isAsync: true
      });

      const addToCartAction = parseResult.functions.find(f => f.action === 'addToCart');
      expect(addToCartAction).toMatchObject({
        name: 'actions',
        type: 'actions',
        action: 'addToCart',
        isAsync: true
      });

      const transformResult = transformFile(
        code,
        '/src/routes/products/[id]/+page.server.js',
        {},
        mockAutowrapInfo,
        null,
        true
      );

      expect(transformResult.changed).toBe(true);
      expect(transformResult.code).toContain('loadDecorator(');
      expect(transformResult.code).toContain('actionsDecorator(');
    });

    it('should handle selective action wrapping for admin pages', () => {
      const code = `
        export const config = {
          decorators: {
            actions: ['updatePrice', 'delete'] // Only wrap specific actions
          }
        };
        
        export const actions = {
          updatePrice: async ({ request }) => {
            // Admin only - needs logging
            const data = await request.formData();
            return { success: true };
          },
          
          delete: async ({ request }) => {
            // Admin only - needs logging
            const data = await request.formData();
            return { success: true };
          },
          
          view: async ({ request }) => {
            // Safe read operation - no logging needed
            return { success: true };
          }
        };
      `;

      const transformResult = transformFile(
        code,
        '/src/routes/admin/products/+page.server.js',
        {},
        mockAutowrapInfo,
        null,
        true
      );

      expect(transformResult.changed).toBe(true);
      
      // Should wrap only specified actions
      const wrappedMatches = transformResult.code.match(/actionsDecorator\(/g);
      expect(wrappedMatches).toHaveLength(2);
      
      expect(transformResult.code).toMatch(/updatePrice:\s*actionsDecorator\(/);
      expect(transformResult.code).toMatch(/delete:\s*actionsDecorator\(/);
      expect(transformResult.code).not.toMatch(/view:\s*actionsDecorator\(/);
    });
  });

  describe('Authentication System', () => {
    it('should handle login page with form actions', () => {
      const code = `
        import { redirect } from '@sveltejs/kit';
        import { auth } from '$lib/auth';
        
        export const load = async ({ locals }) => {
          if (locals.user) {
            throw redirect(302, '/dashboard');
          }
          return {};
        };
        
        export const actions = {
          login: async ({ request, cookies }) => {
            const data = await request.formData();
            const email = data.get('email');
            const password = data.get('password');
            
            const user = await auth.validateCredentials(email, password);
            
            if (!user) {
              return {
                error: 'Invalid credentials'
              };
            }
            
            cookies.set('session', user.sessionId, {
              httpOnly: true,
              secure: true,
              sameSite: 'strict'
            });
            
            throw redirect(302, '/dashboard');
          },
          
          register: async ({ request }) => {
            const data = await request.formData();
            const email = data.get('email');
            const password = data.get('password');
            
            const user = await auth.createUser(email, password);
            
            return {
              success: true,
              userId: user.id
            };
          }
        };
      `;

      const parseResult = parseFile(code, '/src/routes/auth/+page.server.js');
      expect(parseResult.functions).toHaveLength(3);

      const transformResult = transformFile(
        code,
        '/src/routes/auth/+page.server.js',
        {},
        mockAutowrapInfo,
        null,
        true
      );

      expect(transformResult.changed).toBe(true);
      expect(transformResult.code).toContain('loadDecorator(');
      expect(transformResult.code).toContain('actionsDecorator(');
    });
  });

  describe('API Routes', () => {
    it('should handle REST API with multiple HTTP methods', () => {
      const code = `
        import { json } from '@sveltejs/kit';
        import { db } from '$lib/database';
        
        export async function GET({ url }) {
          const page = Number(url.searchParams.get('page')) || 1;
          const limit = Number(url.searchParams.get('limit')) || 10;
          
          const users = await db.users.findMany({
            skip: (page - 1) * limit,
            take: limit
          });
          
          return json(users);
        }
        
        export async function POST({ request }) {
          const userData = await request.json();
          
          const user = await db.users.create({
            data: userData
          });
          
          return json(user, { status: 201 });
        }
        
        export async function DELETE({ params }) {
          await db.users.delete({
            where: { id: params.id }
          });
          
          return json({ success: true });
        }
      `;

      const parseResult = parseFile(code, '/src/routes/api/users/+server.js');
      expect(parseResult.functions).toHaveLength(3);

      const getFunction = parseResult.functions.find(f => f.name === 'GET');
      expect(getFunction).toMatchObject({
        name: 'GET',
        type: 'api',
        isAsync: true
      });

      // Test transformation to verify method metadata is included
      const transformResult = transformFile(
        code,
        '/src/routes/api/users/+server.js',
        {},
        mockAutowrapInfo,
        {},
        {}
      );

      expect(transformResult.changed).toBe(true);
      expect(transformResult.code).toContain('"method":"GET"');
      expect(transformResult.code).toContain('"method":"POST"');
      expect(transformResult.code).toContain('"method":"DELETE"');
    });
  });

  describe('Complex Granular Configuration', () => {
    it('should handle multi-level configuration', () => {
      const code = `
        export const config = {
          decorators: {
            load: false, // Don't wrap load - it's just data fetching
            actions: ['create', 'update', 'delete'] // Only wrap CUD operations
          }
        };
        
        export const load = async ({ params }) => {
          // Simple data loading - no wrapping needed
          return { data: await fetchData(params.id) };
        };
        
        export const actions = {
          // Read operation - no wrapping
          view: async ({ request }) => {
            return { success: true };
          },
          
          // Write operations - needs wrapping for audit
          create: async ({ request }) => {
            const data = await request.formData();
            return { success: true };
          },
          
          update: async ({ request }) => {
            const data = await request.formData();
            return { success: true };
          },
          
          delete: async ({ request }) => {
            const data = await request.formData();
            return { success: true };
          },
          
          // Another read operation - no wrapping
          search: async ({ request }) => {
            return { results: [] };
          }
        };
      `;

      const transformResult = transformFile(
        code,
        '/src/routes/data/+page.server.js',
        {},
        mockAutowrapInfo,
        null,
        true
      );

      expect(transformResult.changed).toBe(true);
      
      // Should not wrap load function
      expect(transformResult.code).not.toContain('loadDecorator');
      
      // Should wrap only specified actions
      const wrappedMatches = transformResult.code.match(/actionsDecorator\(/g);
      expect(wrappedMatches).toHaveLength(3);
      
      expect(transformResult.code).toMatch(/create:\s*actionsDecorator\(/);
      expect(transformResult.code).toMatch(/update:\s*actionsDecorator\(/);
      expect(transformResult.code).toMatch(/delete:\s*actionsDecorator\(/);
      
      expect(transformResult.code).not.toMatch(/view:\s*actionsDecorator\(/);
      expect(transformResult.code).not.toMatch(/search:\s*actionsDecorator\(/);
    });
  });

  describe('Performance Edge Cases', () => {
    it('should handle large actions object efficiently', () => {
      const actionsArray = Array.from({ length: 50 }, (_, i) => 
        `action${i}: async ({ request }) => ({ success: true })`
      ).join(',\n          ');

      const code = `
        export const config = {
          decorators: {
            actions: ['action5', 'action10', 'action25']
          }
        };
        
        export const actions = {
          ${actionsArray}
        };
      `;

      const parseResult = parseFile(code, '/src/routes/large/+page.server.js');
      expect(parseResult.functions).toHaveLength(50);

      const transformResult = transformFile(
        code,
        '/src/routes/large/+page.server.js',
        {},
        mockAutowrapInfo,
        null,
        true
      );

      expect(transformResult.changed).toBe(true);
      
      // Should wrap only the 3 specified actions
      const wrappedMatches = transformResult.code.match(/actionsDecorator\(/g);
      expect(wrappedMatches).toHaveLength(3);
    });
  });
});
