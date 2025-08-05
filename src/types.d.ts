import type { LoadEvent, RequestEvent, ServerLoadEvent } from '@sveltejs/kit';

// Base metadata (common fields)
export interface BaseDecoratorMetadata {
  functionName: string;
  isAsync: boolean;
  [key: string]: any;
}

// Server-side metadata (includes sensitive information)
export interface ServerDecoratorMetadata extends BaseDecoratorMetadata {
  filePath: string;
  startLine: number;
  endLine: number;
}

// Client-side metadata (excludes sensitive information)
export interface ClientDecoratorMetadata extends BaseDecoratorMetadata {
  // No filePath, startLine, endLine for security reasons
}

// Server-specific metadata types
export interface ServerLoadDecoratorMetadata extends ServerDecoratorMetadata {
  functionType: 'load';
}

export interface ActionsDecoratorMetadata extends ServerDecoratorMetadata {
  functionType: 'actions';
  action: string; // Specific action name
}

export interface ApiDecoratorMetadata extends ServerDecoratorMetadata {
  functionType: 'api';
  method: string; // HTTP method (GET, POST, etc.)
}

// Client-specific metadata types
export interface ClientLoadDecoratorMetadata extends ClientDecoratorMetadata {
  functionType: 'load';
}

export type ServerDecoratorMetadataTypes = ServerLoadDecoratorMetadata | ActionsDecoratorMetadata | ApiDecoratorMetadata;
export type ClientDecoratorMetadataTypes = ClientLoadDecoratorMetadata;

// Legacy type for backward compatibility
export type DecoratorMetadata = ServerDecoratorMetadataTypes;

export interface PluginConfig {
  enabled?: boolean | 'dev' | 'build';
  serverWrapperFile?: string; // Path to +decorators.server.ts (default: './src/+decorators.server.ts')
  clientWrapperFile?: string; // Path to +decorators.ts (default: './src/+decorators.ts')
  debug?: boolean;
}

export interface DecoratorsConfig {
  config?: {
    decorators?: boolean | {
      load?: boolean;
      actions?: boolean | string[]; // true/false for all, array for specific actions
      api?: boolean | string[]; // true/false for all, array for specific HTTP methods
    };
    [key: string]: any;
  };
}

export interface DecoratorFunctions {
  loadDecorator?: LoadDecorator;
  serverLoadDecorator?: ServerLoadDecorator;
  actionsDecorator?: ActionsDecorator;
  apiDecorator?: ApiDecorator;
}

// SvelteKit Load Function Types
export type LoadFunction<T = Record<string, any>> = (event: LoadEvent) => T | Promise<T>;
export type ServerLoadFunction<T = Record<string, any>> = (event: ServerLoadEvent) => T | Promise<T>;

// Client Load Decorator (uses client metadata without filePath)
export type LoadDecorator = <T = Record<string, any>>(
  originalLoadFunction: LoadFunction<T>,
  metadata: ClientLoadDecoratorMetadata
) => LoadFunction<T>;

// Server Load Decorator (uses server metadata with filePath)
export type ServerLoadDecorator = <T = Record<string, any>>(
  originalLoadFunction: ServerLoadFunction<T>,
  metadata: ServerDecoratorMetadata
) => ServerLoadFunction<T>;

// SvelteKit Actions Types  
export type ActionFunction = (event: RequestEvent) => any | Promise<any>;
export type ActionsObject = Record<string, ActionFunction>;

export type ActionsDecorator = (
  originalActionFunction: ActionFunction,
  metadata: ActionsDecoratorMetadata
) => ActionFunction;

// SvelteKit API Routes Types
export type ApiRouteHandler = (event: RequestEvent) => Response | Promise<Response>;
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

export type ApiDecorator = (
  originalApiHandler: ApiRouteHandler,
  metadata: ApiDecoratorMetadata
) => ApiRouteHandler;

export declare function svelteKitDecorators(config?: PluginConfig): any;
