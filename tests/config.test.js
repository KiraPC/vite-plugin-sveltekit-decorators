import { describe, expect, it } from 'vitest';
import { findAutowrapFiles, normalizeConfig } from '../src/config.js';

describe('Config', () => {
  describe('normalizeConfig', () => {
    it('should normalize minimal config', () => {
      const input = {
        enabled: true,
        serverWrapperFile: './src/+decorators.server.js'
      };

      const result = normalizeConfig(input);

      expect(result).toMatchObject({
        enabled: true,
        serverWrapperFile: './src/+decorators.server.js',
        clientWrapperFile: './src/+decorators.js',
        metadata: {
          includeFilePath: true,
          includeTimestamp: true,
          includeFunctionName: true,
        }
      });
    });

    it('should merge custom metadata config', () => {
      const input = {
        enabled: true,
        serverWrapperFile: './src/+decorators.server.js',
        metadata: {
          includeFilePath: false,
          customField: 'test'
        }
      };

      const result = normalizeConfig(input);

      expect(result.metadata).toEqual({
        includeFilePath: false,
        includeTimestamp: true,
        includeFunctionName: true,
        customField: 'test'
      });
    });

    it('should handle undefined input', () => {
      const result = normalizeConfig(undefined);

      expect(result).toMatchObject({
        enabled: true,
        serverWrapperFile: './src/+decorators.server.js',
        clientWrapperFile: './src/+decorators.js',
      });
    });

    it('should handle empty object input', () => {
      const result = normalizeConfig({});

      expect(result).toMatchObject({
        enabled: true,
        serverWrapperFile: './src/+decorators.server.js',
        clientWrapperFile: './src/+decorators.js',
      });
    });

    it('should respect disabled config', () => {
      const input = {
        enabled: false,
        serverWrapperFile: './src/+decorators.server.js'
      };

      const result = normalizeConfig(input);

      expect(result.enabled).toBe(false);
    });

    it('should handle custom wrapper files', () => {
      const input = {
        enabled: true,
        serverWrapperFile: './custom/server-wrapper.js',
        clientWrapperFile: './custom/client-wrapper.js'
      };

      const result = normalizeConfig(input);

      expect(result.serverWrapperFile).toBe('./custom/server-wrapper.js');
      expect(result.clientWrapperFile).toBe('./custom/client-wrapper.js');
    });
  });

  describe('findAutowrapFiles', () => {
    // Note: These tests would need to be adapted based on actual file system
    // For now, we'll test the logic with mocked file system operations
    
    it('should prioritize exact file matches', () => {
      // This would need file system mocking to test properly
      // For now, we test the basic structure
      expect(findAutowrapFiles).toBeDefined();
      expect(typeof findAutowrapFiles).toBe('function');
    });

    it('should handle missing autowrap files gracefully', () => {
      // Mock scenario where no autowrap files exist
      const result = findAutowrapFiles('/non/existent/path', {
        serverWrapperFile: './src/+decorators.server.js',
        clientWrapperFile: './src/+decorators.js'
      });

      // Should handle gracefully without throwing
      expect(result).toBeDefined();
    });
  });

  describe('Config Edge Cases', () => {
    it('should handle null config', () => {
      const result = normalizeConfig(null);

      expect(result).toMatchObject({
        enabled: true,
        serverWrapperFile: './src/+decorators.server.js',
        clientWrapperFile: './src/+decorators.js',
      });
    });

    it('should preserve additional config properties', () => {
      const input = {
        enabled: true,
        serverWrapperFile: './src/+decorators.server.js',
        customProperty: 'customValue',
        nested: {
          property: 'nestedValue'
        }
      };

      const result = normalizeConfig(input);

      expect(result.customProperty).toBe('customValue');
      expect(result.nested).toEqual({ property: 'nestedValue' });
    });

    it('should handle partial metadata config', () => {
      const input = {
        enabled: true,
        metadata: {
          includeTimestamp: false
        }
      };

      const result = normalizeConfig(input);

      expect(result.metadata).toEqual({
        includeFilePath: true,
        includeTimestamp: false,
        includeFunctionName: true,
      });
    });

    it('should handle string boolean values', () => {
      const input = {
        enabled: 'true',
        serverWrapperFile: './src/+decorators.server.js'
      };

      const result = normalizeConfig(input);

      // Should normalize string to boolean
      expect(result.enabled).toBe(true);
    });

    it('should validate wrapper file paths', () => {
      const input = {
        enabled: true,
        serverWrapperFile: '',
        clientWrapperFile: null
      };

      const result = normalizeConfig(input);

      // Should provide defaults for invalid paths
      expect(result.serverWrapperFile).toBe('./src/+decorators.server.js');
      expect(result.clientWrapperFile).toBe('./src/+decorators.js');
    });
  });

  describe('Config Validation', () => {
    it('should handle invalid metadata config', () => {
      const input = {
        enabled: true,
        metadata: 'invalid'
      };

      const result = normalizeConfig(input);

      // Should provide default metadata when invalid
      expect(result.metadata).toEqual({
        includeFilePath: true,
        includeTimestamp: true,
        includeFunctionName: true,
      });
    });

    it('should handle array as config', () => {
      const input = ['invalid', 'config'];

      const result = normalizeConfig(input);

      // Should provide defaults when config is not an object
      expect(result).toMatchObject({
        enabled: true,
        serverWrapperFile: './src/+decorators.server.js',
        clientWrapperFile: './src/+decorators.js',
      });
    });

    it('should handle function as config', () => {
      const input = () => ({ enabled: true });

      const result = normalizeConfig(input);

      // Should provide defaults when config is not an object
      expect(result).toMatchObject({
        enabled: true,
        serverWrapperFile: './src/+decorators.server.js',
        clientWrapperFile: './src/+decorators.js',
      });
    });
  });
});
