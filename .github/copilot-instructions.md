# Copilot Instructions: vite-plugin-sveltekit-decorators

## Project Overview

This is a Vite plugin that automatically decorates SvelteKit functions (load functions, actions, API routes) with customizable wrappers for logging, analytics, error handling, and performance monitoring. It works by transforming code at build-time using Babel AST manipulation.

## Architecture & Core Components

### Plugin Entry Point (`src/index.js`)
- `svelteKitDecorators()` is the main plugin function
- Runs in `enforce: 'post'` mode to avoid conflicts with other plugins
- Discovers and loads decorator files: `+decorators.server.ts` (server-side) and `+decorators.ts` (client-side)
- Uses file naming conventions to determine server vs client context

### Code Transformation Pipeline
1. **Parser** (`src/parser.js`): Extracts functions and config from SvelteKit files using Babel AST
2. **Transformer** (`src/transformer.js`): Wraps discovered functions with decorator calls
3. **Config** (`src/config.js`): Handles plugin configuration and file filtering
4. **Utils** (`src/utils.js`): File discovery and decorator loading utilities

### Decorator Pattern
```typescript
// In +decorators.server.ts
export const loadDecorator: ServerLoadDecorator = (originalFunction, metadata) => {
  return async (event) => {
    // Pre-execution logic
    const result = await originalFunction(event);
    // Post-execution logic
    return result;
  };
};
```

## Key Development Workflows

### Build Process
- **Custom build script**: `npm run build` runs `scripts/build.js` (simple file copying, not bundling)
- **No TypeScript compilation**: Plugin uses `.js` files with TypeScript definitions in `types.d.ts`
- **Distribution**: Copies source files to `dist/` preserving structure

### Testing Strategy
- **Vitest** with comprehensive test suite (66 tests)
- **Test categories**: config, parser, transformer, integration, use-cases
- **Run tests**: `npm test` or `npm run test:watch`
- **Coverage**: Configured with v8 provider

### Development & Debugging
- **Example project**: `examples/simple-demo/` demonstrates real usage
- **Debug mode**: Set `debug: true` in plugin config for verbose logging
- **Live testing**: `npm run dev` builds plugin and starts demo project

## SvelteKit Integration Patterns

### File Detection Logic
- **Server files**: Contains `.server.` or ends with `+page.server.ts`, `+layout.server.ts`, `+server.ts`
- **Decorator discovery**: Searches for `+decorators.server.ts` and `+decorators.ts` in src/
- **Function matching**: Detects `load`, `actions`, and API route functions by export name

### Configuration Options
```javascript
// Per-file granular control in SvelteKit files
export const config = {
  decorators: {
    enabled: false,  // Disable decorators for this file
    granular: {
      load: false,   // Disable only load function decoration
      actions: true  // Keep actions decoration enabled
    }
  }
};
```

### Transformation Behavior
- **Zero code changes**: Original functions remain unchanged, decorators wrap them
- **Metadata injection**: Decorators receive function name, file path, and line numbers
- **Context awareness**: Server vs client decorators applied based on file naming

## Critical Dependencies

### Babel Ecosystem
- **Parser**: `@babel/parser` for TypeScript/JSX support
- **Traversal**: `@babel/traverse` for AST manipulation
- **Generation**: `@babel/generator` for code output
- **Types**: `@babel/types` for AST node creation

### Code Manipulation
- **MagicString**: Used for precise source transformations with source maps
- **Import handling**: Decorators are imported dynamically at build time

## Common Patterns & Conventions

### Error Handling
- Graceful degradation: Plugin warns but continues if decorator files missing
- Function-level try/catch in decorators to prevent breaking original functionality
- AST parsing errors logged but don't break build

### TypeScript Integration
- Plugin written in JavaScript with separate `.d.ts` files
- Strong typing for decorator function signatures
- Example decorators demonstrate proper TypeScript usage

## Development Guidelines

### Adding New Features
1. Update `types.d.ts` for new interfaces
2. Add parser logic in `parser.js` for new function types
3. Extend transformer in `transformer.js` for new decoration patterns
4. Add comprehensive tests covering edge cases
5. Update example project to demonstrate new functionality

### Testing New Changes
- Run full test suite: `npm test`
- Test with example project: `npm run dev`
- Verify build output: `npm run build && ls -la dist/`
- Check TypeScript compatibility with example decorators
