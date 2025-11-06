# vite-plugin-sveltekit-decorators

A powerful Vite plugin that automatically decorates SvelteKit functions with customizable wrappers for logging, analytics, error handling, and more.

## 🚀 Try it now

**[Open in StackBlitz →](https://stackblitz.com/edit/github-adiyb5rg?file=src%2F%2Bdecorators.server.ts)**

Experience the plugin in action with a live, interactive demo. No installation required!

## The Problem

SvelteKit lacks a built-in way to execute common code across multiple functions (load functions, actions, API routes, remote functions). This plugin solves that by providing a decorator pattern that allows you to:

- Add logging to all your SvelteKit functions
- Implement analytics tracking
- Handle errors consistently
- Add authentication checks
- Measure performance
- Execute any custom logic before/after your functions
- Monitor remote function calls (RPC)

## Quick Start

1. **Install the plugin**

   ```bash
   npm install vite-plugin-sveltekit-decorators
   ```

2. **Add to your Vite configuration**

   ```javascript
   // vite.config.js
   import { sveltekit } from '@sveltejs/kit/vite';
   import { svelteKitDecorators } from 'vite-plugin-sveltekit-decorators';

   export default {
     plugins: [
       sveltekit(),
       svelteKitDecorators({
         enabled: true,
         debug: false
       })
     ]
   };
   ```

3. **Create your decorator functions**

   ```typescript
   // src/+decorators.server.ts
   import type { 
     ServerLoadDecorator, 
     ActionsDecorator, 
     ApiDecorator,
     RemoteFunctionDecorator
   } from 'vite-plugin-sveltekit-decorators';

   export const loadDecorator: ServerLoadDecorator = (originalFunction, metadata) => {
     return async (event) => {
       console.log(`Loading ${metadata.functionName}...`);
       const result = await originalFunction(event);
       console.log(`Loaded ${metadata.functionName} successfully`);
       return result;
     };
   };

   export const actionsDecorator: ActionsDecorator = (originalFunction, metadata) => {
     return async (event) => {
       console.log(`Executing action ${metadata.action}...`);
       return await originalFunction(event);
     };
   };

   export const apiDecorator: ApiDecorator = (originalFunction, metadata) => {
     return async (event) => {
       console.log(`API ${metadata.method} request to ${metadata.functionName}`);
       return await originalFunction(event);
     };
   };

   export const remoteFunctionDecorator: RemoteFunctionDecorator = (originalFunction, metadata) => {
     return async (...args) => {
       console.log(`Calling remote function ${metadata.functionName}...`);
       const result = await originalFunction(...args);
       console.log(`Remote function ${metadata.functionName} completed`);
       return result;
     };
   };
   ```

4. **That's it!** Your existing SvelteKit code will automatically be decorated without any modifications.

## Example

Check out our [complete working example](./examples/simple-demo/) which demonstrates all features including:

- Load function decoration
- Actions decoration
- API routes decoration
- Granular configuration
- Opt-out mechanisms

## Features

### Available Decorators

| Decorator | Purpose | File Location | Applies To |
|-----------|---------|---------------|------------|
| `loadDecorator` | Client-side load functions | `src/+decorators.ts` | Page/layout `load` functions |
| `loadDecorator` | Server-side load functions | `src/+decorators.server.ts` | Page/layout `load` functions on server |
| `actionsDecorator` | Form actions | `src/+decorators.server.ts` | Page `actions` (default, named) |
| `apiDecorator` | API route handlers | `src/+decorators.server.ts` | API routes (`GET`, `POST`, etc.) |
| `remoteFunctionDecorator` | Remote functions (RPC) | `src/+decorators.server.ts` | Functions in `.remote.ts` file |

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | `boolean \| 'dev' \| 'build'` | `true` | Enable/disable the plugin |
| `debug` | `boolean` | `false` | Enable debug logging |
| `serverWrapperFile` | `string` | `'./src/+decorators.server.ts'` | Path to server decorators file |
| `clientWrapperFile` | `string` | `'./src/+decorators.ts'` | Path to client decorators file |

### Granular Configuration

You can configure decorators per page using the `decorators` configuration, following SvelteKit's convention:

```typescript
// +page.server.ts - Just like other SvelteKit config exports!
export const config = {
  decorators: {
    load: true,           // Enable load decoration
    actions: ['create'],  // Only decorate 'create' action
    api: false           // Disable API decoration
  }
};

export const load = async () => { /* automatically decorated */ };

export const actions = {
  create: async () => { /* decorated */ },
  update: async () => { /* decorated */ },
  delete: async () => { /* NOT decorated */ }
};
```

Configuration options:

- `true`: Enable for all functions
- `false`: Disable completely  
- `string[]`: Enable only for specific actions/HTTP methods

**This follows the exact same pattern as SvelteKit's built-in configuration** - no new concepts to learn!

> **Note:** Remote functions (`.remote.ts` files) do not currently support granular configuration via `export const config` due to SvelteKit restrictions. Decorators are applied to all remote functions if `remoteFunctionDecorator` is defined.

## Type Safety

This plugin is **fully type-safe** and provides:

- Complete TypeScript definitions for all decorator functions
- Metadata interfaces with function information
- No runtime type checking overhead
- Full IntelliSense support

## Zero Code Changes Required

The plugin works by **transforming your code at build time**. You don't need to:

- Modify existing SvelteKit functions
- Import anything in your route files
- Change your development workflow
- Wrap functions manually

Your existing code remains untouched and clean.

## Easy Debugging & SvelteKit Conventions

This plugin follows **SvelteKit's established patterns** for a familiar developer experience:

- **Easy debugging:** Decorator files can be debugged normally with breakpoints - no special tooling required
- **Familiar file structure:** Uses SvelteKit's `+` file conventions (`+decorators.ts`, `+decorators.server.ts`)
- **SvelteKit-style configuration:** Per-route configuration using simple `export const config`, just like SvelteKit's own patterns

```typescript
// Debugging works exactly as you'd expect
export const loadDecorator: ServerLoadDecorator = (originalFunction, metadata) => {
  return async (event) => {
    debugger; // ✅ Works perfectly!
    console.log(`Loading ${metadata.functionName}...`);
    const result = await originalFunction(event);
    return result;
  };
};
```

## Performance

This plugin has **zero performance impact** on your application because:

- All transformations happen at build time
- No runtime overhead is added
- Your decorator functions control performance
- Original function logic is preserved

⚠️ **Performance depends on your decorator implementation** - avoid heavy computations or blocking operations in your decorators.

## Advanced Usage

### Metadata Available in Decorators

Each decorator receives metadata about the function:

```typescript
interface BaseDecoratorMetadata {
  functionName: string;  // Name of the original function
  isAsync: boolean;     // Whether the function is async
}

// Server decorators also include:
interface ServerDecoratorMetadata extends BaseDecoratorMetadata {
  filePath: string;     // File path (server-side only)
  startLine: number;    // Line number where function starts
  endLine: number;      // Line number where function ends
}

// Action decorators include:
interface ActionsDecoratorMetadata extends ServerDecoratorMetadata {
  functionType: 'actions';
  action: string;       // Action name ('default' for default action)
}

// API decorators include:
interface ApiDecoratorMetadata extends ServerDecoratorMetadata {
  functionType: 'api';
  method: string;       // HTTP method (GET, POST, etc.)
}
```

### Conditional Decoration

```typescript
export const loadDecorator: ServerLoadDecorator = (originalFunction, metadata) => {
  return async (event) => {
    // Only log in development
    if (import.meta.env.DEV) {
      console.log(`Loading ${metadata.functionName}...`);
    }
    
    const start = Date.now();
    const result = await originalFunction(event);
    
    // Performance monitoring
    const duration = Date.now() - start;
    if (duration > 1000) {
      console.warn(`Slow load function: ${metadata.functionName} (${duration}ms)`);
    }
    
    return result;
  };
};
```

### Remote Functions (RPC)

Decorate SvelteKit's remote functions in `.remote.ts` files:

```typescript
// src/lib/api.remote.ts
import z from 'zod';
import { prerender } from '$app/server';

export const getUser = prerender(async () => {
  // This function will be automatically decorated
  return { name: 'John Doe' };
});

// With validation
export const updateProfile = prerender(
  z.string(),  // validation function
  async (name) => {          // remote function (decorated)
    return { name: name };
  }
);
```

The `remoteFunctionDecorator` wraps the inner function:

```typescript
export const remoteFunctionDecorator: RemoteFunctionDecorator = (originalFunction, metadata) => {
  return async (...args) => {
    console.log(`🚀 Remote function called: ${metadata.functionName}`);
    console.log(`📦 Arguments:`, args);
    
    const result = await originalFunction(...args);
    
    console.log(`✅ Result:`, result);
    return result;
  };
};
```

### Error Handling

```typescript
export const apiDecorator: ApiDecorator = (originalFunction, metadata) => {
  return async (event) => {
    try {
      return await originalFunction(event);
    } catch (error) {
      console.error(`API error in ${metadata.functionName}:`, error);
      
      return new Response(
        JSON.stringify({ error: 'Internal server error' }), 
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  };
};
```

## Requirements

- SvelteKit project
- Vite as build tool
- Node.js 16+

## License

MIT License - see [LICENSE](./LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.
