# SvelteKit Decorators - Simple Demo

This example demonstrates all the features of `vite-plugin-sveltekit-decorators` in a working SvelteKit application.

## Features Demonstrated

### 🔧 Basic Setup
- Plugin configuration in `vite.config.ts`
- Server-side decorators in `src/+decorators.server.ts`
- Client-side decorators in `src/+decorators.ts`

### 📄 Load Function Decoration
- **Server Load**: `src/routes/+page.server.ts` - Product data loading with timing logs
- **Client Load**: Client-side loading decoration (when applicable)

### 🎯 Actions Decoration
- **Form Actions**: `src/routes/granular-test/+page.server.ts`
  - Default action handling
  - Named actions (`create`, `delete`) 
  - Granular configuration to selectively enable decorators

### 🌐 API Routes Decoration
- **GET Endpoints**: 
  - `src/routes/api/products/+server.ts` - Product listing API
  - `src/routes/api/orders/+server.ts` - Order management API
- **POST Endpoints**: Create operations with request logging

### ⚙️ Granular Configuration
- **Selective Decoration**: `src/routes/granular-test/+page.server.ts`
  ```typescript
  export const config = {
    decorators: {
      actions: ['create'] // Only decorate the 'create' action
    }
  };
  ```

### 🚫 Opt-out Mechanism
- **Disabled Decoration**: `src/routes/opt-out-test/+page.server.ts`
  ```typescript
  export const config = {
    decorators: false // Disable all decorators for this page
  };
  ```

## Running the Demo

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start the development server**
   ```bash
   npm run dev
   ```

3. **Open your browser** to `http://localhost:5173`

## What to Look For

### Console Output
Watch the terminal/browser console for decorator logs:
- Load function timing
- Action execution logs
- API request/response logging
- Performance monitoring

### Test Routes
- **Homepage** (`/`) - See load function decoration
- **Granular Test** (`/granular-test`) - Test selective action decoration
- **Opt-out Test** (`/opt-out-test`) - See how opt-out works
- **API Endpoints** - Test via browser or curl:
  ```bash
  curl http://localhost:5173/api/products
  curl -X POST http://localhost:5173/api/orders -d '{"product":"test"}'
  ```

## File Structure

```
src/
├── +decorators.server.ts    # Server-side decorators
├── +decorators.ts           # Client-side decorators  
├── routes/
│   ├── +page.server.ts      # Homepage with load function
│   ├── +page.svelte         # Homepage UI
│   ├── api/
│   │   ├── products/+server.ts  # Products API
│   │   └── orders/+server.ts    # Orders API
│   ├── granular-test/
│   │   ├── +page.server.ts      # Selective decoration demo
│   │   └── +page.svelte         # Granular test UI
│   └── opt-out-test/
│       ├── +page.server.ts      # Opt-out demonstration
│       └── +page.svelte         # Opt-out test UI
└── vite.config.ts           # Plugin configuration
```

## Decorator Implementations

### Server Load Decorator
- Logs function start/end
- Measures execution time
- Warns about slow operations (>500ms)

### Actions Decorator  
- Logs action execution
- Includes action name in logs
- Can be configured per action

### API Decorator
- Logs HTTP method and endpoint
- Request/response timing
- Error handling examples

## Learning Points

1. **Zero Code Changes**: Notice how your SvelteKit functions remain unchanged
2. **Type Safety**: All decorators are fully typed
3. **Flexible Configuration**: Enable/disable per page or per function
4. **Performance Monitoring**: Built-in timing and logging
5. **Development vs Production**: Conditional logging based on environment

This demo shows how easy it is to add consistent functionality across your entire SvelteKit application without modifying existing code.
