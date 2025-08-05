const DEFAULT_CONFIG = {
  enabled: true,
  serverWrapperFile: './src/+decorators.server.js',
  clientWrapperFile: './src/+decorators.js',
  metadata: {
    includeFilePath: true,
    includeFunctionName: true,
    includeTimestamp: true,
  },
  debug: false,
};

export function normalizeConfig(userConfig = {}) {
  // Handle null or non-object inputs
  if (!userConfig || typeof userConfig !== 'object' || Array.isArray(userConfig)) {
    userConfig = {};
  }

  const config = {
    ...DEFAULT_CONFIG,
    ...userConfig,
  };

  // Normalize boolean strings
  if (typeof config.enabled === 'string') {
    config.enabled = config.enabled === 'true';
  }

  // Ensure metadata is an object and merge with defaults
  if (typeof config.metadata !== 'object' || config.metadata === null) {
    config.metadata = DEFAULT_CONFIG.metadata;
  } else {
    config.metadata = {
      ...DEFAULT_CONFIG.metadata,
      ...config.metadata,
    };
  }

  // Validate wrapper file paths
  if (!config.serverWrapperFile || typeof config.serverWrapperFile !== 'string') {
    config.serverWrapperFile = DEFAULT_CONFIG.serverWrapperFile;
  }
  if (!config.clientWrapperFile || typeof config.clientWrapperFile !== 'string') {
    config.clientWrapperFile = DEFAULT_CONFIG.clientWrapperFile;
  }

  return config;
}

export function findAutowrapFiles(basePath, config) {
  // This function would need filesystem operations to work properly
  // For now, we return the config paths as-is
  return {
    server: config.serverWrapperFile,
    client: config.clientWrapperFile,
  };
}

export function shouldProcessFile(filePath) {
  // Always process SvelteKit files, individual files can opt-out with `export const autowrap = false`
  return isSvelteKitFile(filePath);
}

export function isSvelteKitFile(filePath) {
  const svelteKitPatterns = [
    /\/\+page\.server\.(js|ts)$/,
    /\/\+layout\.server\.(js|ts)$/,
    /\/\+page\.(js|ts)$/,
    /\/\+layout\.(js|ts)$/,
    /\/\+server\.(js|ts)$/,  // API routes
  ];

  return svelteKitPatterns.some(pattern => pattern.test(filePath));
}

export function isServerFile(filePath) {
  return /\.server\.(js|ts)$/.test(filePath);
}

export function shouldEnable(config, command) {
  if (typeof config.enabled === 'boolean') {
    return config.enabled;
  }
  
  if (config.enabled === 'dev') {
    return command === 'serve';
  }
  
  if (config.enabled === 'build') {
    return command === 'build';
  }
  
  return true;
}
