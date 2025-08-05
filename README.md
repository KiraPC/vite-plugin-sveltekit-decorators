# vite-plugin-sveltekit-decorators

A powerful Vite plugin that automatically decorates SvelteKit functions with customizable wrappers for logging, analytics, error handling, and more.

## The Problem

SvelteKit lacks a built-in way to execute common code across multiple functions (load functions, actions, API routes). This plugin solves that by providing a decorator pattern that allows you to:

- Add logging to all your SvelteKit functions
- Implement analytics tracking
- Handle errors consistently
- Add authentication checks
- Measure performance
- Execute any custom logic before/after your functions

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
     ApiDecorator 
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

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | `boolean \| 'dev' \| 'build'` | `true` | Enable/disable the plugin |
| `debug` | `boolean` | `false` | Enable debug logging |
| `serverWrapperFile` | `string` | `'./src/+decorators.server.ts'` | Path to server decorators file |
| `clientWrapperFile` | `string` | `'./src/+decorators.ts'` | Path to client decorators file |

### Granular Configuration

You can configure decorators per page using the `decorators` configuration:

```typescript
// +page.server.ts
export const config = {
  decorators: {
    load: true,           // Enable load decoration
    actions: ['create'],  // Only decorate 'create' action
    api: false           // Disable API decoration
  }
};
```

Configuration options:

- `true`: Enable for all functions
- `false`: Disable completely  
- `string[]`: Enable only for specific actions/HTTP methods

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
