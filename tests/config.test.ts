import {
  configureLogging,
  convertConfig,
  convertOverrides,
  defaultLoggingConfig,
  resolveLogLevel
} from '../src/config';
import * as LogLevel from '../src/LogLevel';
import * as LogFormat from '../src/LogFormat';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    // Clear all relevant environment variables
    delete process.env.LOGGING_CONFIG;
    delete process.env.EXPO_PUBLIC_LOGGING_CONFIG;
    delete process.env.NEXT_PUBLIC_LOGGING_CONFIG;
    delete process.env.LOG_LEVEL;
    delete process.env.LOG_FORMAT;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('defaultLoggingConfig', () => {
    it('should have correct default values', () => {
      expect(defaultLoggingConfig.logLevel).toBe(LogLevel.INFO);
      expect(defaultLoggingConfig.logFormat).toBe(LogFormat.TEXT);
      expect(defaultLoggingConfig.overrides).toEqual({});
      expect(defaultLoggingConfig.floodControl).toEqual({
        enabled: false,
        threshold: 10,
        timeframe: 1000,
      });
      expect(defaultLoggingConfig.masking).toBeDefined();
    });
  });

  describe('convertOverrides', () => {
    it('should convert valid overrides correctly', () => {
      const overrides = {
        'test-component': { logLevel: 'DEBUG' },
        'another-component': { logLevel: 'ERROR' }
      };

      const result = convertOverrides(overrides);
      expect(result).toEqual({
        'test-component': { logLevel: LogLevel.DEBUG },
        'another-component': { logLevel: LogLevel.ERROR }
      });
    });

    it('should use default log level when override logLevel is missing', () => {
      const overrides = {
        'test-component': {},
        'another-component': { logLevel: 'WARNING' }
      };

      const result = convertOverrides(overrides);
      expect(result).toEqual({
        'test-component': { logLevel: LogLevel.INFO },
        'another-component': { logLevel: LogLevel.WARNING }
      });
    });

    it('should return empty object when overrides is null', () => {
      const result = convertOverrides(null);
      expect(result).toEqual({});
    });

    it('should return empty object when overrides is undefined', () => {
      const result = convertOverrides(void 0);
      expect(result).toEqual({});
    });

    it('should return empty object when overrides is empty object', () => {
      const result = convertOverrides({});
      expect(result).toEqual({});
    });

    it('should handle overrides with invalid log level gracefully', () => {
      const overrides = {
        'test-component': { logLevel: 'INVALID_LEVEL' }
      };

      expect(() => convertOverrides(overrides)).toThrow(
        "Invalid Log Level Supplied to Logging Configuration 'INVALID_LEVEL'"
      );
    });
  });

  describe('convertConfig', () => {
    it('should convert valid config correctly', () => {
      const config = {
        logLevel: 'DEBUG',
        logFormat: 'STRUCTURED',
        overrides: {
          'test-component': { logLevel: 'ERROR' }
        },
        floodControl: {
          enabled: true,
          threshold: 20,
          timeframe: 2000
        },
        masking: {
          enabled: true
        }
      };

      const result = convertConfig(config);
      expect(result.logLevel).toBe(LogLevel.DEBUG);
      expect(result.logFormat).toBe(LogFormat.STRUCTURED);
      expect(result.overrides).toEqual({
        'test-component': { logLevel: LogLevel.ERROR }
      });
      expect(result.floodControl).toEqual({
        enabled: true,
        threshold: 20,
        timeframe: 2000
      });
      expect(result.masking).toEqual({
        ...defaultLoggingConfig.masking,
        enabled: true
      });
    });

    it('should use defaults when config properties are missing', () => {
      const config = {};

      const result = convertConfig(config);
      expect(result.logLevel).toBe(LogLevel.INFO);
      expect(result.logFormat).toBe(LogFormat.TEXT);
      expect(result.overrides).toEqual({});
      expect(result.floodControl).toEqual(defaultLoggingConfig.floodControl);
      expect(result.masking).toEqual(defaultLoggingConfig.masking);
    });

    it('should merge floodControl with defaults', () => {
      const config = {
        floodControl: {
          enabled: true
        }
      };

      const result = convertConfig(config);
      expect(result.floodControl).toEqual({
        enabled: true,
        threshold: 10,
        timeframe: 1000
      });
    });

    it('should merge masking with defaults', () => {
      const config = {
        masking: {
          enabled: true
        }
      };

      const result = convertConfig(config);
      expect(result.masking).toEqual({
        ...defaultLoggingConfig.masking,
        enabled: true
      });
    });

    it('should throw error when config is null', () => {
      expect(() => convertConfig(null)).toThrow();
    });

    it('should throw error when config is undefined', () => {
      expect(() => convertConfig(void 0)).toThrow();
    });

    it('should throw error when invalid logLevel is provided', () => {
      const config = {
        logLevel: 'INVALID_LEVEL'
      };

      expect(() => convertConfig(config)).toThrow(
        "Invalid Log Level Supplied to Logging Configuration 'INVALID_LEVEL'"
      );
    });

    it('should throw error when invalid logFormat is provided', () => {
      const config = {
        logFormat: 'INVALID_FORMAT'
      };

      expect(() => convertConfig(config)).toThrow(
        "Invalid Log Format Supplied to Logging Configuration 'INVALID_FORMAT'"
      );
    });
  });

  describe('configureLogging', () => {
    it('should return default config when no environment variables are set', () => {
      const config = configureLogging();
      expect(config.logLevel).toBe(LogLevel.INFO);
      expect(config.logFormat).toBe(LogFormat.TEXT);
      expect(config.overrides).toEqual({});
      expect(config.floodControl).toEqual(defaultLoggingConfig.floodControl);
      expect(config.masking).toEqual(defaultLoggingConfig.masking);
    });

    it('should parse LOGGING_CONFIG environment variable', () => {
      process.env.LOGGING_CONFIG = JSON.stringify({
        logLevel: 'DEBUG',
        logFormat: 'STRUCTURED',
        overrides: {
          'test-component': { logLevel: 'ERROR' }
        }
      });

      const config = configureLogging();
      expect(config.logLevel).toBe(LogLevel.DEBUG);
      expect(config.logFormat).toBe(LogFormat.STRUCTURED);
      expect(config.overrides).toEqual({
        'test-component': { logLevel: LogLevel.ERROR }
      });
    });

    it('should parse EXPO_PUBLIC_LOGGING_CONFIG environment variable', () => {
      process.env.EXPO_PUBLIC_LOGGING_CONFIG = JSON.stringify({
        logLevel: 'WARNING',
        logFormat: 'TEXT'
      });

      const config = configureLogging();
      expect(config.logLevel).toBe(LogLevel.WARNING);
      expect(config.logFormat).toBe(LogFormat.TEXT);
    });

    it('should parse NEXT_PUBLIC_LOGGING_CONFIG environment variable', () => {
      process.env.NEXT_PUBLIC_LOGGING_CONFIG = JSON.stringify({
        logLevel: 'ERROR',
        logFormat: 'STRUCTURED'
      });

      const config = configureLogging();
      expect(config.logLevel).toBe(LogLevel.ERROR);
      expect(config.logFormat).toBe(LogFormat.STRUCTURED);
    });

    it('should prioritize LOGGING_CONFIG over EXPO_PUBLIC_LOGGING_CONFIG', () => {
      process.env.LOGGING_CONFIG = JSON.stringify({
        logLevel: 'DEBUG'
      });
      process.env.EXPO_PUBLIC_LOGGING_CONFIG = JSON.stringify({
        logLevel: 'ERROR'
      });

      const config = configureLogging();
      expect(config.logLevel).toBe(LogLevel.DEBUG);
    });

    it('should prioritize LOGGING_CONFIG over NEXT_PUBLIC_LOGGING_CONFIG', () => {
      process.env.LOGGING_CONFIG = JSON.stringify({
        logLevel: 'DEBUG'
      });
      process.env.NEXT_PUBLIC_LOGGING_CONFIG = JSON.stringify({
        logLevel: 'ERROR'
      });

      const config = configureLogging();
      expect(config.logLevel).toBe(LogLevel.DEBUG);
    });

    it('should prioritize EXPO_PUBLIC_LOGGING_CONFIG over NEXT_PUBLIC_LOGGING_CONFIG', () => {
      process.env.EXPO_PUBLIC_LOGGING_CONFIG = JSON.stringify({
        logLevel: 'DEBUG'
      });
      process.env.NEXT_PUBLIC_LOGGING_CONFIG = JSON.stringify({
        logLevel: 'ERROR'
      });

      const config = configureLogging();
      expect(config.logLevel).toBe(LogLevel.DEBUG);
    });

    it('should handle invalid JSON in LOGGING_CONFIG gracefully', () => {
      process.env.LOGGING_CONFIG = 'invalid json';
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

      const config = configureLogging();
      expect(config.logLevel).toBe(LogLevel.INFO);
      expect(config.logFormat).toBe(LogFormat.TEXT);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Invalid JSON in LOGGING_CONFIG environment variable:',
        expect.any(SyntaxError)
      );

      consoleSpy.mockRestore();
    });

    it('should handle invalid JSON in EXPO_PUBLIC_LOGGING_CONFIG gracefully', () => {
      process.env.EXPO_PUBLIC_LOGGING_CONFIG = 'invalid json';
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

      const config = configureLogging();
      expect(config.logLevel).toBe(LogLevel.INFO);
      expect(config.logFormat).toBe(LogFormat.TEXT);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Invalid JSON in EXPO_PUBLIC_LOGGING_CONFIG environment variable:',
        expect.any(SyntaxError)
      );

      consoleSpy.mockRestore();
    });

    it('should handle invalid JSON in NEXT_PUBLIC_LOGGING_CONFIG gracefully', () => {
      process.env.NEXT_PUBLIC_LOGGING_CONFIG = 'invalid json';
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

      const config = configureLogging();
      expect(config.logLevel).toBe(LogLevel.INFO);
      expect(config.logFormat).toBe(LogFormat.TEXT);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Invalid JSON in NEXT_PUBLIC_LOGGING_CONFIG environment variable:',
        expect.any(SyntaxError)
      );

      consoleSpy.mockRestore();
    });

    it('should override log level from LOG_LEVEL environment variable', () => {
      process.env.LOG_LEVEL = 'DEBUG';
      const config = configureLogging();
      expect(config.logLevel).toBe(LogLevel.DEBUG);
    });

    it('should override log format from LOG_FORMAT environment variable', () => {
      process.env.LOG_FORMAT = 'STRUCTURED';
      const config = configureLogging();
      expect(config.logFormat).toBe(LogFormat.STRUCTURED);
    });

    it('should override config from environment variables over JSON config', () => {
      process.env.LOGGING_CONFIG = JSON.stringify({
        logLevel: 'INFO',
        logFormat: 'TEXT'
      });
      process.env.LOG_LEVEL = 'ERROR';
      process.env.LOG_FORMAT = 'STRUCTURED';

      const config = configureLogging();
      expect(config.logLevel).toBe(LogLevel.ERROR);
      expect(config.logFormat).toBe(LogFormat.STRUCTURED);
    });

    it('should handle case-insensitive LOG_LEVEL', () => {
      process.env.LOG_LEVEL = 'debug';
      const config = configureLogging();
      expect(config.logLevel).toBe(LogLevel.DEBUG);
    });

    it('should handle case-insensitive LOG_FORMAT', () => {
      process.env.LOG_FORMAT = 'structured';
      const config = configureLogging();
      expect(config.logFormat).toBe(LogFormat.STRUCTURED);
    });

    it('should throw error when invalid LOG_LEVEL is provided', () => {
      process.env.LOG_LEVEL = 'INVALID_LEVEL';

      expect(() => {
        configureLogging();
      }).toThrow("Invalid Log Level Supplied to Logging Configuration 'INVALID_LEVEL'");
    });

    it('should throw error when invalid LOG_FORMAT is provided', () => {
      process.env.LOG_FORMAT = 'INVALID_FORMAT';

      expect(() => {
        configureLogging();
      }).toThrow("Invalid Log Format Supplied to Logging Configuration 'INVALID_FORMAT'");
    });

    it('should merge environment config with defaults correctly', () => {
      process.env.LOGGING_CONFIG = JSON.stringify({
        floodControl: {
          enabled: true,
          threshold: 25
        }
      });

      const config = configureLogging();
      expect(config.floodControl).toEqual({
        enabled: true,
        threshold: 25,
        timeframe: 1000 // default value preserved
      });
    });

    it('should handle empty string environment variables', () => {
      process.env.LOG_LEVEL = '';
      process.env.LOG_FORMAT = '';

      const config = configureLogging();
      expect(config.logLevel).toBe(LogLevel.INFO);
      expect(config.logFormat).toBe(LogFormat.TEXT);
    });

    it('should throw error when whitespace-only environment variables are provided', () => {
      process.env.LOG_LEVEL = '   ';
      process.env.LOG_FORMAT = '  ';

      expect(() => configureLogging()).toThrow("Invalid Log Level Supplied to Logging Configuration '   '");
    });
  });

  describe('hierarchical component overrides', () => {
    describe('convertOverrides with nested components', () => {
      it('should convert nested component overrides correctly', () => {
        const overrides = {
          '@fjell/cache': {
            logLevel: 'INFO',
            components: {
              'CacheWarmer': { logLevel: 'DEBUG' },
              'TwoLayerCache': { logLevel: 'WARNING' }
            }
          }
        };

        const result = convertOverrides(overrides);
        expect(result['@fjell/cache'].logLevel).toBe(LogLevel.INFO);
        expect(result['@fjell/cache'].components).toBeDefined();
        expect(result['@fjell/cache'].components!['CacheWarmer'].logLevel).toBe(LogLevel.DEBUG);
        expect(result['@fjell/cache'].components!['TwoLayerCache'].logLevel).toBe(LogLevel.WARNING);
      });

      it('should handle deeply nested component overrides', () => {
        const overrides = {
          '@fjell/cache': {
            logLevel: 'INFO',
            components: {
              'CacheWarmer': {
                logLevel: 'DEBUG',
                components: {
                  'SubComponent': { logLevel: 'TRACE' }
                }
              }
            }
          }
        };

        const result = convertOverrides(overrides);
        expect(result['@fjell/cache'].components!['CacheWarmer'].components!['SubComponent'].logLevel).toBe(LogLevel.TRACE);
      });

      it('should handle components without nested components', () => {
        const overrides = {
          '@fjell/cache': {
            logLevel: 'INFO'
          }
        };

        const result = convertOverrides(overrides);
        expect(result['@fjell/cache'].logLevel).toBe(LogLevel.INFO);
        expect(result['@fjell/cache'].components).toBeUndefined();
      });

      it('should handle 4 levels of nesting', () => {
        const overrides = {
          '@fjell/cache': {
            logLevel: 'ERROR',
            components: {
              'Layer1': {
                logLevel: 'WARNING',
                components: {
                  'Layer2': {
                    logLevel: 'INFO',
                    components: {
                      'Layer3': { logLevel: 'DEBUG' }
                    }
                  }
                }
              }
            }
          }
        };

        const result = convertOverrides(overrides);
        expect(result['@fjell/cache'].logLevel).toBe(LogLevel.ERROR);
        expect(result['@fjell/cache'].components!['Layer1'].logLevel).toBe(LogLevel.WARNING);
        expect(result['@fjell/cache'].components!['Layer1'].components!['Layer2'].logLevel).toBe(LogLevel.INFO);
        expect(result['@fjell/cache'].components!['Layer1'].components!['Layer2'].components!['Layer3'].logLevel).toBe(LogLevel.DEBUG);
      });

      it('should handle 5 levels of nesting', () => {
        const overrides = {
          '@fjell/cache': {
            logLevel: 'ERROR',
            components: {
              'Level1': {
                logLevel: 'WARNING',
                components: {
                  'Level2': {
                    logLevel: 'NOTICE',
                    components: {
                      'Level3': {
                        logLevel: 'INFO',
                        components: {
                          'Level4': { logLevel: 'TRACE' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        };

        const result = convertOverrides(overrides);
        const level4 = result['@fjell/cache']
          .components!['Level1']
          .components!['Level2']
          .components!['Level3']
          .components!['Level4'];
        
        expect(level4.logLevel).toBe(LogLevel.TRACE);
      });

      it('should handle mixed configured and unconfigured levels', () => {
        const overrides = {
          '@fjell/cache': {
            logLevel: 'INFO',
            components: {
              'CacheWarmer': {
                logLevel: 'DEBUG',
                components: {
                  'Strategy': {
                    logLevel: 'TRACE'
                    // LRU is not configured, should inherit from Strategy
                  }
                }
              }
            }
          }
        };

        const result = convertOverrides(overrides);
        expect(result['@fjell/cache'].components!['CacheWarmer'].components!['Strategy'].logLevel).toBe(LogLevel.TRACE);
        expect(result['@fjell/cache'].components!['CacheWarmer'].components!['Strategy'].components).toBeUndefined();
      });

      it('should handle multiple sibling branches with different depths', () => {
        const overrides = {
          '@fjell/cache': {
            logLevel: 'INFO',
            components: {
              'CacheWarmer': {
                logLevel: 'DEBUG',
                components: {
                  'Strategy': { logLevel: 'TRACE' }
                }
              },
              'TwoLayerCache': {
                logLevel: 'WARNING'
                // No nested components
              },
              'Storage': {
                logLevel: 'INFO',
                components: {
                  'IndexedDB': {
                    logLevel: 'DEBUG',
                    components: {
                      'Transaction': { logLevel: 'TRACE' }
                    }
                  }
                }
              }
            }
          }
        };

        const result = convertOverrides(overrides);
        
        // Verify CacheWarmer branch
        expect(result['@fjell/cache'].components!['CacheWarmer'].logLevel).toBe(LogLevel.DEBUG);
        expect(result['@fjell/cache'].components!['CacheWarmer'].components!['Strategy'].logLevel).toBe(LogLevel.TRACE);
        
        // Verify TwoLayerCache branch (no nesting)
        expect(result['@fjell/cache'].components!['TwoLayerCache'].logLevel).toBe(LogLevel.WARNING);
        expect(result['@fjell/cache'].components!['TwoLayerCache'].components).toBeUndefined();
        
        // Verify Storage branch (deeper nesting)
        expect(result['@fjell/cache'].components!['Storage'].logLevel).toBe(LogLevel.INFO);
        expect(result['@fjell/cache'].components!['Storage'].components!['IndexedDB'].logLevel).toBe(LogLevel.DEBUG);
        expect(result['@fjell/cache'].components!['Storage'].components!['IndexedDB'].components!['Transaction'].logLevel).toBe(LogLevel.TRACE);
      });
    });

    describe('resolveLogLevel', () => {
      it('should return default log level when no overrides exist', () => {
        const config = {
          ...defaultLoggingConfig,
          logLevel: LogLevel.INFO
        };

        const result = resolveLogLevel(config, '@fjell/cache', []);
        expect(result).toBe(LogLevel.INFO);
      });

      it('should return category-level override when no component specified', () => {
        const config = {
          ...defaultLoggingConfig,
          logLevel: LogLevel.INFO,
          overrides: {
            '@fjell/cache': {
              logLevel: LogLevel.DEBUG
            }
          }
        };

        const result = resolveLogLevel(config, '@fjell/cache', []);
        expect(result).toBe(LogLevel.DEBUG);
      });

      it('should return component-level override when component matches', () => {
        const config = {
          ...defaultLoggingConfig,
          logLevel: LogLevel.INFO,
          overrides: {
            '@fjell/cache': {
              logLevel: LogLevel.INFO,
              components: {
                'CacheWarmer': { logLevel: LogLevel.DEBUG }
              }
            }
          }
        };

        const result = resolveLogLevel(config, '@fjell/cache', ['CacheWarmer']);
        expect(result).toBe(LogLevel.DEBUG);
      });

      it('should return category-level override when component does not match', () => {
        const config = {
          ...defaultLoggingConfig,
          logLevel: LogLevel.INFO,
          overrides: {
            '@fjell/cache': {
              logLevel: LogLevel.WARNING,
              components: {
                'CacheWarmer': { logLevel: LogLevel.DEBUG }
              }
            }
          }
        };

        const result = resolveLogLevel(config, '@fjell/cache', ['OtherComponent']);
        expect(result).toBe(LogLevel.WARNING);
      });

      it('should resolve deeply nested component overrides', () => {
        const config = {
          ...defaultLoggingConfig,
          logLevel: LogLevel.INFO,
          overrides: {
            '@fjell/cache': {
              logLevel: LogLevel.INFO,
              components: {
                'CacheWarmer': {
                  logLevel: LogLevel.DEBUG,
                  components: {
                    'SubComponent': { logLevel: LogLevel.TRACE }
                  }
                }
              }
            }
          }
        };

        const result = resolveLogLevel(config, '@fjell/cache', ['CacheWarmer', 'SubComponent']);
        expect(result).toBe(LogLevel.TRACE);
      });

      it('should stop at deepest matching component level', () => {
        const config = {
          ...defaultLoggingConfig,
          logLevel: LogLevel.INFO,
          overrides: {
            '@fjell/cache': {
              logLevel: LogLevel.INFO,
              components: {
                'CacheWarmer': {
                  logLevel: LogLevel.DEBUG,
                  components: {
                    'SubComponent': { logLevel: LogLevel.TRACE }
                  }
                }
              }
            }
          }
        };

        // Requesting a deeper component that doesn't exist should use the parent's level
        const result = resolveLogLevel(config, '@fjell/cache', ['CacheWarmer', 'SubComponent', 'DeepComponent']);
        expect(result).toBe(LogLevel.TRACE);
      });

      it('should use parent level when intermediate component not configured', () => {
        const config = {
          ...defaultLoggingConfig,
          logLevel: LogLevel.INFO,
          overrides: {
            '@fjell/cache': {
              logLevel: LogLevel.WARNING,
              components: {
                'CacheWarmer': { logLevel: LogLevel.DEBUG }
              }
            }
          }
        };

        // Requesting ['OtherComponent', 'SubComponent'] should use category level
        const result = resolveLogLevel(config, '@fjell/cache', ['OtherComponent', 'SubComponent']);
        expect(result).toBe(LogLevel.WARNING);
      });

      it('should handle empty component array', () => {
        const config = {
          ...defaultLoggingConfig,
          logLevel: LogLevel.INFO,
          overrides: {
            '@fjell/cache': {
              logLevel: LogLevel.DEBUG
            }
          }
        };

        const result = resolveLogLevel(config, '@fjell/cache', []);
        expect(result).toBe(LogLevel.DEBUG);
      });

      it('should resolve 4 levels deep correctly', () => {
        const config = {
          ...defaultLoggingConfig,
          logLevel: LogLevel.ERROR,
          overrides: {
            '@fjell/cache': {
              logLevel: LogLevel.WARNING,
              components: {
                'CacheWarmer': {
                  logLevel: LogLevel.NOTICE,
                  components: {
                    'Strategy': {
                      logLevel: LogLevel.INFO,
                      components: {
                        'LRU': { logLevel: LogLevel.DEBUG }
                      }
                    }
                  }
                }
              }
            }
          }
        };

        // Test each level
        expect(resolveLogLevel(config, '@fjell/cache', [])).toBe(LogLevel.WARNING);
        expect(resolveLogLevel(config, '@fjell/cache', ['CacheWarmer'])).toBe(LogLevel.NOTICE);
        expect(resolveLogLevel(config, '@fjell/cache', ['CacheWarmer', 'Strategy'])).toBe(LogLevel.INFO);
        expect(resolveLogLevel(config, '@fjell/cache', ['CacheWarmer', 'Strategy', 'LRU'])).toBe(LogLevel.DEBUG);
      });

      it('should resolve 5 levels deep correctly', () => {
        const config = {
          ...defaultLoggingConfig,
          logLevel: LogLevel.EMERGENCY,
          overrides: {
            '@fjell/cache': {
              logLevel: LogLevel.ERROR,
              components: {
                'L1': {
                  logLevel: LogLevel.WARNING,
                  components: {
                    'L2': {
                      logLevel: LogLevel.NOTICE,
                      components: {
                        'L3': {
                          logLevel: LogLevel.INFO,
                          components: {
                            'L4': { logLevel: LogLevel.TRACE }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        };

        expect(resolveLogLevel(config, '@fjell/cache', ['L1', 'L2', 'L3', 'L4'])).toBe(LogLevel.TRACE);
      });

      it('should handle partial path through deep hierarchy', () => {
        const config = {
          ...defaultLoggingConfig,
          logLevel: LogLevel.INFO,
          overrides: {
            '@fjell/cache': {
              logLevel: LogLevel.WARNING,
              components: {
                'CacheWarmer': {
                  logLevel: LogLevel.INFO,
                  components: {
                    'Strategy': {
                      logLevel: LogLevel.DEBUG,
                      components: {
                        'LRU': { logLevel: LogLevel.TRACE }
                      }
                    }
                  }
                }
              }
            }
          }
        };

        // Request a path that goes through configured components but adds unconfigured ones
        // Should stop at the deepest configured level
        expect(resolveLogLevel(config, '@fjell/cache', ['CacheWarmer', 'Strategy', 'LRU', 'SubAlgorithm'])).toBe(LogLevel.TRACE);
        expect(resolveLogLevel(config, '@fjell/cache', ['CacheWarmer', 'UnknownComponent'])).toBe(LogLevel.INFO);
      });

      it('should handle multiple sibling paths correctly', () => {
        const config = {
          ...defaultLoggingConfig,
          logLevel: LogLevel.INFO,
          overrides: {
            '@fjell/cache': {
              logLevel: LogLevel.WARNING,
              components: {
                'CacheWarmer': {
                  logLevel: LogLevel.DEBUG,
                  components: {
                    'Strategy': { logLevel: LogLevel.TRACE }
                  }
                },
                'TwoLayerCache': {
                  logLevel: LogLevel.ERROR,
                  components: {
                    'L1Cache': { logLevel: LogLevel.WARNING }
                  }
                },
                'Storage': {
                  logLevel: LogLevel.INFO
                }
              }
            }
          }
        };

        // Test different sibling paths
        expect(resolveLogLevel(config, '@fjell/cache', ['CacheWarmer', 'Strategy'])).toBe(LogLevel.TRACE);
        expect(resolveLogLevel(config, '@fjell/cache', ['TwoLayerCache', 'L1Cache'])).toBe(LogLevel.WARNING);
        expect(resolveLogLevel(config, '@fjell/cache', ['Storage'])).toBe(LogLevel.INFO);
        
        // Test sibling without further nesting
        expect(resolveLogLevel(config, '@fjell/cache', ['CacheWarmer'])).toBe(LogLevel.DEBUG);
        expect(resolveLogLevel(config, '@fjell/cache', ['TwoLayerCache'])).toBe(LogLevel.ERROR);
      });

      it('should handle alternating configured and unconfigured levels', () => {
        const config = {
          ...defaultLoggingConfig,
          logLevel: LogLevel.INFO,
          overrides: {
            '@fjell/cache': {
              logLevel: LogLevel.WARNING,
              components: {
                'CacheWarmer': {
                  logLevel: LogLevel.DEBUG,
                  components: {
                    'Strategy': {
                      logLevel: LogLevel.TRACE
                      // No further nesting configured
                    }
                  }
                }
              }
            }
          }
        };

        // Path with configured components followed by unconfigured ones
        expect(resolveLogLevel(config, '@fjell/cache', ['CacheWarmer', 'Strategy', 'LRU', 'Algorithm', 'Detail'])).toBe(LogLevel.TRACE);
      });

      it('should handle very deep nesting (stress test)', () => {
        const config = {
          ...defaultLoggingConfig,
          logLevel: LogLevel.INFO,
          overrides: {
            '@fjell/cache': {
              logLevel: LogLevel.WARNING,
              components: {
                'A': {
                  logLevel: LogLevel.NOTICE,
                  components: {
                    'B': {
                      logLevel: LogLevel.INFO,
                      components: {
                        'C': {
                          logLevel: LogLevel.DEBUG,
                          components: {
                            'D': {
                              logLevel: LogLevel.TRACE,
                              components: {
                                'E': {
                                  logLevel: LogLevel.DEFAULT,
                                  components: {
                                    'F': { logLevel: LogLevel.TRACE }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        };

        // Test deep path resolution
        expect(resolveLogLevel(config, '@fjell/cache', ['A', 'B', 'C', 'D', 'E', 'F'])).toBe(LogLevel.TRACE);
        
        // Test intermediate levels
        expect(resolveLogLevel(config, '@fjell/cache', ['A'])).toBe(LogLevel.NOTICE);
        expect(resolveLogLevel(config, '@fjell/cache', ['A', 'B'])).toBe(LogLevel.INFO);
        expect(resolveLogLevel(config, '@fjell/cache', ['A', 'B', 'C'])).toBe(LogLevel.DEBUG);
        expect(resolveLogLevel(config, '@fjell/cache', ['A', 'B', 'C', 'D'])).toBe(LogLevel.TRACE);
        expect(resolveLogLevel(config, '@fjell/cache', ['A', 'B', 'C', 'D', 'E'])).toBe(LogLevel.DEFAULT);
        
        // Test with extra unconfigured levels beyond F
        expect(resolveLogLevel(config, '@fjell/cache', ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'])).toBe(LogLevel.TRACE);
      });

      it('should handle complex multi-branch hierarchy', () => {
        const config = {
          ...defaultLoggingConfig,
          logLevel: LogLevel.INFO,
          overrides: {
            '@fjell/cache': {
              logLevel: LogLevel.WARNING,
              components: {
                'Branch1': {
                  logLevel: LogLevel.INFO,
                  components: {
                    'Sub1A': { logLevel: LogLevel.DEBUG },
                    'Sub1B': {
                      logLevel: LogLevel.TRACE,
                      components: {
                        'Deep1B': { logLevel: LogLevel.DEFAULT }
                      }
                    }
                  }
                },
                'Branch2': {
                  logLevel: LogLevel.ERROR,
                  components: {
                    'Sub2A': {
                      logLevel: LogLevel.WARNING,
                      components: {
                        'Deep2A': { logLevel: LogLevel.INFO }
                      }
                    }
                  }
                },
                'Branch3': { logLevel: LogLevel.NOTICE }
              }
            }
          }
        };

        // Test Branch1 paths
        expect(resolveLogLevel(config, '@fjell/cache', ['Branch1'])).toBe(LogLevel.INFO);
        expect(resolveLogLevel(config, '@fjell/cache', ['Branch1', 'Sub1A'])).toBe(LogLevel.DEBUG);
        expect(resolveLogLevel(config, '@fjell/cache', ['Branch1', 'Sub1B'])).toBe(LogLevel.TRACE);
        expect(resolveLogLevel(config, '@fjell/cache', ['Branch1', 'Sub1B', 'Deep1B'])).toBe(LogLevel.DEFAULT);
        
        // Test Branch2 paths
        expect(resolveLogLevel(config, '@fjell/cache', ['Branch2'])).toBe(LogLevel.ERROR);
        expect(resolveLogLevel(config, '@fjell/cache', ['Branch2', 'Sub2A'])).toBe(LogLevel.WARNING);
        expect(resolveLogLevel(config, '@fjell/cache', ['Branch2', 'Sub2A', 'Deep2A'])).toBe(LogLevel.INFO);
        
        // Test Branch3 (no deeper nesting)
        expect(resolveLogLevel(config, '@fjell/cache', ['Branch3'])).toBe(LogLevel.NOTICE);
        expect(resolveLogLevel(config, '@fjell/cache', ['Branch3', 'AnythingElse'])).toBe(LogLevel.NOTICE);
      });
    });

    describe('integration with configureLogging', () => {
      it('should parse hierarchical config from LOGGING_CONFIG', () => {
        process.env.LOGGING_CONFIG = JSON.stringify({
          logLevel: 'INFO',
          overrides: {
            '@fjell/cache': {
              logLevel: 'INFO',
              components: {
                'CacheWarmer': { logLevel: 'DEBUG' }
              }
            }
          }
        });

        const config = configureLogging();
        expect(config.overrides['@fjell/cache'].logLevel).toBe(LogLevel.INFO);
        expect(config.overrides['@fjell/cache'].components!['CacheWarmer'].logLevel).toBe(LogLevel.DEBUG);
      });

      it('should parse deeply nested config from LOGGING_CONFIG', () => {
        process.env.LOGGING_CONFIG = JSON.stringify({
          logLevel: 'INFO',
          overrides: {
            '@fjell/cache': {
              logLevel: 'WARNING',
              components: {
                'A': {
                  logLevel: 'NOTICE',
                  components: {
                    'B': {
                      logLevel: 'INFO',
                      components: {
                        'C': { logLevel: 'DEBUG' }
                      }
                    }
                  }
                }
              }
            }
          }
        });

        const config = configureLogging();
        expect(config.overrides['@fjell/cache'].components!['A'].components!['B'].components!['C'].logLevel).toBe(LogLevel.DEBUG);
      });
    });

    describe('edge cases and error handling', () => {
      it('should handle empty components object', () => {
        const overrides = {
          '@fjell/cache': {
            logLevel: 'INFO',
            components: {}
          }
        };

        const result = convertOverrides(overrides);
        expect(result['@fjell/cache'].logLevel).toBe(LogLevel.INFO);
        expect(result['@fjell/cache'].components).toEqual({});
      });

      it('should handle null components property gracefully', () => {
        const overrides = {
          '@fjell/cache': {
            logLevel: 'INFO',
            components: null
          }
        };

        const result = convertOverrides(overrides);
        expect(result['@fjell/cache'].logLevel).toBe(LogLevel.INFO);
      });

      it('should use default log level when component logLevel is missing', () => {
        const overrides = {
          '@fjell/cache': {
            logLevel: 'INFO',
            components: {
              'CacheWarmer': {
                // No logLevel specified
                components: {
                  'Strategy': { logLevel: 'DEBUG' }
                }
              }
            }
          }
        };

        const result = convertOverrides(overrides);
        expect(result['@fjell/cache'].components!['CacheWarmer'].logLevel).toBe(LogLevel.INFO); // Uses default
        expect(result['@fjell/cache'].components!['CacheWarmer'].components!['Strategy'].logLevel).toBe(LogLevel.DEBUG);
      });

      it('should handle component names with special characters', () => {
        const overrides = {
          '@fjell/cache': {
            logLevel: 'INFO',
            components: {
              'Cache-Warmer': { logLevel: 'DEBUG' },
              'Two_Layer_Cache': { logLevel: 'WARNING' },
              'Cache.Strategy': { logLevel: 'TRACE' }
            }
          }
        };

        const result = convertOverrides(overrides);
        expect(result['@fjell/cache'].components!['Cache-Warmer'].logLevel).toBe(LogLevel.DEBUG);
        expect(result['@fjell/cache'].components!['Two_Layer_Cache'].logLevel).toBe(LogLevel.WARNING);
        expect(result['@fjell/cache'].components!['Cache.Strategy'].logLevel).toBe(LogLevel.TRACE);
      });

      it('should handle numeric component names', () => {
        const overrides = {
          '@fjell/cache': {
            logLevel: 'INFO',
            components: {
              '123': { logLevel: 'DEBUG' },
              'Worker-1': { logLevel: 'TRACE' }
            }
          }
        };

        const result = convertOverrides(overrides);
        expect(result['@fjell/cache'].components!['123'].logLevel).toBe(LogLevel.DEBUG);
        expect(result['@fjell/cache'].components!['Worker-1'].logLevel).toBe(LogLevel.TRACE);
      });

      it('should handle very long component names', () => {
        const longName = 'A'.repeat(200);
        const overrides = {
          '@fjell/cache': {
            logLevel: 'INFO',
            components: {
              [longName]: { logLevel: 'DEBUG' }
            }
          }
        };

        const result = convertOverrides(overrides);
        expect(result['@fjell/cache'].components![longName].logLevel).toBe(LogLevel.DEBUG);
      });

      it('should resolve with empty component array', () => {
        const config = {
          ...defaultLoggingConfig,
          logLevel: LogLevel.INFO,
          overrides: {
            '@fjell/cache': {
              logLevel: LogLevel.DEBUG,
              components: {
                'CacheWarmer': { logLevel: LogLevel.TRACE }
              }
            }
          }
        };

        const result = resolveLogLevel(config, '@fjell/cache', []);
        expect(result).toBe(LogLevel.DEBUG);
      });

      it('should handle resolution with undefined overrides', () => {
        const config = {
          ...defaultLoggingConfig,
          logLevel: LogLevel.INFO,
          overrides: undefined as any
        };

        const result = resolveLogLevel(config, '@fjell/cache', ['CacheWarmer']);
        expect(result).toBe(LogLevel.INFO);
      });

      it('should handle resolution with null overrides', () => {
        const config = {
          ...defaultLoggingConfig,
          logLevel: LogLevel.INFO,
          overrides: null as any
        };

        const result = resolveLogLevel(config, '@fjell/cache', ['CacheWarmer']);
        expect(result).toBe(LogLevel.INFO);
      });

      it('should handle single component in path', () => {
        const config = {
          ...defaultLoggingConfig,
          logLevel: LogLevel.INFO,
          overrides: {
            '@fjell/cache': {
              logLevel: LogLevel.WARNING,
              components: {
                'Single': { logLevel: LogLevel.DEBUG }
              }
            }
          }
        };

        const result = resolveLogLevel(config, '@fjell/cache', ['Single']);
        expect(result).toBe(LogLevel.DEBUG);
      });

      it('should handle all standard log levels', () => {
        const config = {
          ...defaultLoggingConfig,
          logLevel: LogLevel.INFO,
          overrides: {
            '@fjell/cache': {
              logLevel: LogLevel.EMERGENCY,
              components: {
                'Alert': { logLevel: LogLevel.ALERT },
                'Critical': { logLevel: LogLevel.CRITICAL },
                'Error': { logLevel: LogLevel.ERROR },
                'Warning': { logLevel: LogLevel.WARNING },
                'Notice': { logLevel: LogLevel.NOTICE },
                'Info': { logLevel: LogLevel.INFO },
                'Debug': { logLevel: LogLevel.DEBUG },
                'Trace': { logLevel: LogLevel.TRACE },
                'Default': { logLevel: LogLevel.DEFAULT }
              }
            }
          }
        };

        expect(resolveLogLevel(config, '@fjell/cache', ['Alert'])).toBe(LogLevel.ALERT);
        expect(resolveLogLevel(config, '@fjell/cache', ['Critical'])).toBe(LogLevel.CRITICAL);
        expect(resolveLogLevel(config, '@fjell/cache', ['Error'])).toBe(LogLevel.ERROR);
        expect(resolveLogLevel(config, '@fjell/cache', ['Warning'])).toBe(LogLevel.WARNING);
        expect(resolveLogLevel(config, '@fjell/cache', ['Notice'])).toBe(LogLevel.NOTICE);
        expect(resolveLogLevel(config, '@fjell/cache', ['Info'])).toBe(LogLevel.INFO);
        expect(resolveLogLevel(config, '@fjell/cache', ['Debug'])).toBe(LogLevel.DEBUG);
        expect(resolveLogLevel(config, '@fjell/cache', ['Trace'])).toBe(LogLevel.TRACE);
        expect(resolveLogLevel(config, '@fjell/cache', ['Default'])).toBe(LogLevel.DEFAULT);
      });
    });

    describe('performance and stress tests', () => {
      it('should handle 10 levels of nesting', () => {
        const overrides = {
          '@fjell/cache': {
            logLevel: 'ERROR',
            components: {
              'L1': {
                logLevel: 'CRITICAL',
                components: {
                  'L2': {
                    logLevel: 'WARNING',
                    components: {
                      'L3': {
                        logLevel: 'NOTICE',
                        components: {
                          'L4': {
                            logLevel: 'INFO',
                            components: {
                              'L5': {
                                logLevel: 'DEBUG',
                                components: {
                                  'L6': {
                                    logLevel: 'TRACE',
                                    components: {
                                      'L7': {
                                        logLevel: 'DEBUG',
                                        components: {
                                          'L8': {
                                            logLevel: 'INFO',
                                            components: {
                                              'L9': { logLevel: 'WARNING' }
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        };

        const result = convertOverrides(overrides);
        
        // Navigate to L9
        const l9 = result['@fjell/cache']
          .components!['L1']
          .components!['L2']
          .components!['L3']
          .components!['L4']
          .components!['L5']
          .components!['L6']
          .components!['L7']
          .components!['L8']
          .components!['L9'];
        
        expect(l9.logLevel).toBe(LogLevel.WARNING);
      });

      it('should resolve 10 levels deep efficiently', () => {
        const config = {
          ...defaultLoggingConfig,
          logLevel: LogLevel.INFO,
          overrides: {
            '@fjell/cache': {
              logLevel: LogLevel.ERROR,
              components: {
                'L1': {
                  logLevel: LogLevel.CRITICAL,
                  components: {
                    'L2': {
                      logLevel: LogLevel.WARNING,
                      components: {
                        'L3': {
                          logLevel: LogLevel.NOTICE,
                          components: {
                            'L4': {
                              logLevel: LogLevel.INFO,
                              components: {
                                'L5': {
                                  logLevel: LogLevel.DEBUG,
                                  components: {
                                    'L6': {
                                      logLevel: LogLevel.TRACE,
                                      components: {
                                        'L7': {
                                          logLevel: LogLevel.DEBUG,
                                          components: {
                                            'L8': {
                                              logLevel: LogLevel.INFO,
                                              components: {
                                                'L9': { logLevel: LogLevel.WARNING }
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        };

        const start = Date.now();
        const result = resolveLogLevel(config, '@fjell/cache', ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8', 'L9']);
        const duration = Date.now() - start;
        
        expect(result).toBe(LogLevel.WARNING);
        expect(duration).toBeLessThan(10); // Should be very fast (< 10ms)
      });

      it('should handle 20 sibling components efficiently', () => {
        const components: any = {};
        for (let i = 0; i < 20; i++) {
          components[`Component${i}`] = { logLevel: i % 2 === 0 ? 'DEBUG' : 'INFO' };
        }

        const overrides = {
          '@fjell/cache': {
            logLevel: 'WARNING',
            components
          }
        };

        const result = convertOverrides(overrides);
        
        // Verify all 20 components were converted
        expect(Object.keys(result['@fjell/cache'].components!).length).toBe(20);
        expect(result['@fjell/cache'].components!['Component0'].logLevel).toBe(LogLevel.DEBUG);
        expect(result['@fjell/cache'].components!['Component1'].logLevel).toBe(LogLevel.INFO);
        expect(result['@fjell/cache'].components!['Component19'].logLevel).toBe(LogLevel.INFO);
      });

      it('should handle 100 sibling components', () => {
        const components: any = {};
        for (let i = 0; i < 100; i++) {
          components[`C${i}`] = { logLevel: 'DEBUG' };
        }

        const overrides = {
          '@fjell/cache': {
            logLevel: 'INFO',
            components
          }
        };

        const start = Date.now();
        const result = convertOverrides(overrides);
        const duration = Date.now() - start;
        
        expect(Object.keys(result['@fjell/cache'].components!).length).toBe(100);
        expect(duration).toBeLessThan(100); // Should be fast
      });
    });
  });
});
