import { promises as fs } from 'fs';
import { resolve } from 'path';
import { AccessibilityConfig, PartialAccessibilityConfig } from './types.js';

// Constants to eliminate repetition
const WCAG_LEVELS = ['A', 'AA', 'AAA'] as const;
const IMPACT_LEVELS = ['minor', 'moderate', 'serious', 'critical'] as const;
const REPORT_FORMATS = ['detailed', 'summary', 'compact'] as const;

const ENV_VAR_MAPPINGS = {
  'ACCESSIBILITY_WCAG_LEVEL': { path: ['wcag', 'defaultLevel'], type: 'string' },
  'ACCESSIBILITY_ARIA_VALIDATION': { path: ['aria', 'enableValidation'], type: 'boolean' },
  'ACCESSIBILITY_MIN_IMPACT': { path: ['evaluation', 'minImpactLevel'], type: 'string' },
  'ACCESSIBILITY_REPORT_FORMAT': { path: ['reporting', 'format'], type: 'string' }
} as const;

const WCAG_TAG_MAPPING = {
  'A': ['wcag2a'],
  'AA': ['wcag2a', 'wcag2aa', 'wcag21aa'],
  'AAA': ['wcag2a', 'wcag2aa', 'wcag2aaa', 'wcag21aa', 'wcag21aaa']
} as const;

/**
 * Singleton class responsible for loading and managing accessibility configuration.
 * Supports loading from multiple sources including config files, environment variables,
 * and provides intelligent defaults. Configuration is loaded in order of priority:
 * 1. User-specified paths
 * 2. Project-level configs
 * 3. Package.json accessibility field
 * 4. Home directory config
 * 5. System-wide config
 * 6. Environment variables
 * 7. Default values
 * 
 * @class ConfigLoader
 * @example
 * ```typescript
 * const loader = ConfigLoader.getInstance();
 * loader.addConfigPath('./my-config.json');
 * const config = await loader.loadConfig();
 * ```
 */
export class ConfigLoader {
  /** @private {ConfigLoader} Singleton instance */
  private static instance: ConfigLoader;
  
  /** @private {AccessibilityConfig} Default configuration (cached) */
  private static readonly DEFAULT_CONFIG: AccessibilityConfig = {
    wcag: {
      defaultLevel: 'AA',
      enabledCriteria: [],
      disabledCriteria: [],
      customCriteria: [],
      strictMode: false
    },
    aria: {
      enableValidation: true,
      customRoles: [],
      ignoreDeprecated: true,
      strictMode: false
    },
    evaluation: {
      includePassedChecks: true,
      minImpactLevel: 'minor',
      enableEnhancedExplanations: true,
      includeCodeExamples: true,
      enableDocumentationLinks: true
    },
    reporting: {
      format: 'detailed',
      includeRecommendations: true,
      groupByPrinciple: false,
      showProgressScores: true,
      includeMetadata: true
    },
    axe: {
      rules: {},
      tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
      resultTypes: ['violations', 'incomplete']
    }
  };
  
  /** @private {AccessibilityConfig | null} Cached configuration object */
  private config: AccessibilityConfig | null = null;
  
  /** @private {Set<string>} Set of configuration file paths for efficient deduplication */
  private configPaths = new Set<string>();
  
  /** @private {string[]} Cached search paths */
  private cachedSearchPaths: string[] | null = null;
  
  /** @private {string} Cached current working directory */
  private cachedCwd: string | null = null;

  /**
   * Private constructor to enforce singleton pattern.
   * @private
   */
  private constructor() {}

  /**
   * Gets the singleton instance of ConfigLoader.
   * @static
   * @returns {ConfigLoader} The singleton ConfigLoader instance
   */
  static getInstance(): ConfigLoader {
    if (!ConfigLoader.instance) {
      ConfigLoader.instance = new ConfigLoader();
    }
    return ConfigLoader.instance;
  }

  /**
   * Provides the default configuration values used as fallbacks.
   * @private
   * @returns {AccessibilityConfig} Complete default configuration object
   */
  private getDefaultConfig(): AccessibilityConfig {
    // Return a deep copy to prevent mutation of the cached default
    return this.deepMerge({}, ConfigLoader.DEFAULT_CONFIG) as AccessibilityConfig;
  }

  /**
   * Adds a configuration file path to the search list with high priority.
   * The path will be resolved to an absolute path and deduplicated.
   * @param {string} path - The path to the configuration file (relative or absolute)
   * @example
   * ```typescript
   * loader.addConfigPath('./accessibility.config.json');
   * loader.addConfigPath('/absolute/path/to/config.json');
   * ```
   */
  addConfigPath(path: string): void {
    const resolvedPath = resolve(path);
    this.configPaths.add(resolvedPath);
    // Invalidate cached search paths
    this.cachedSearchPaths = null;
  }

  /**
   * Sets the configuration file paths in order of priority, replacing any existing paths.
   * All paths will be resolved to absolute paths.
   * @param {string[]} paths - Array of configuration file paths in priority order
   * @example
   * ```typescript
   * loader.setConfigPaths([
   *   './project-config.json',
   *   '~/.accessibility.json'
   * ]);
   * ```
   */
  setConfigPaths(paths: string[]): void {
    this.configPaths = new Set(paths.map(path => resolve(path)));
    // Invalidate cached search paths
    this.cachedSearchPaths = null;
  }

  /**
   * Loads configuration from files and environment variables.
   * This method caches the result - subsequent calls return the cached configuration.
   * Configuration sources are merged in order of priority with later sources
   * overriding earlier ones.
   * @async
   * @returns {Promise<AccessibilityConfig>} The complete merged configuration
   * @throws {Error} When configuration validation fails
   * @example
   * ```typescript
   * try {
   *   const config = await loader.loadConfig();
   *   console.log('WCAG Level:', config.wcag.defaultLevel);
   * } catch (error) {
   *   console.error('Config loading failed:', error.message);
   * }
   * ```
   */
  async loadConfig(): Promise<AccessibilityConfig> {
    if (this.config) {
      return this.config;
    }

    // Start with defaults
    let mergedConfig = this.getDefaultConfig();

    // Try to load from config files in order of priority
    for (const configPath of this.getConfigSearchPaths()) {
      try {
        const fileConfig = await this.loadConfigFile(configPath);
        mergedConfig = this.deepMerge(mergedConfig, fileConfig) as AccessibilityConfig;
        console.error(`✓ Loaded config from: ${configPath}`);
        break; // Use first found config file
      } catch (error) {
        // Continue to next config path
        continue;
      }
    }

    // Load and merge environment variables
    const envConfig = this.loadFromEnvironment();
    mergedConfig = this.deepMerge(mergedConfig, envConfig) as AccessibilityConfig;

    // Validate configuration
    this.validateConfig(mergedConfig);

    this.config = mergedConfig;
    return this.config;
  }

  /**
   * Gets the current configuration, loading it if not already cached.
   * This is a convenience method that ensures configuration is always available.
   * @async
   * @returns {Promise<AccessibilityConfig>} The current configuration
   * @example
   * ```typescript
   * const config = await loader.getConfig();
   * ```
   */
  async getConfig(): Promise<AccessibilityConfig> {
    return this.config ?? await this.loadConfig();
  }

  /**
   * Clears the cached configuration and reloads from files and environment.
   * Useful when configuration files have changed and need to be re-read.
   * @async
   * @returns {Promise<AccessibilityConfig>} The newly loaded configuration
   * @example
   * ```typescript
   * // After modifying config file
   * const freshConfig = await loader.reloadConfig();
   * ```
   */
  async reloadConfig(): Promise<AccessibilityConfig> {
    this.config = null;
    this.cachedSearchPaths = null;
    this.cachedCwd = null;
    return await this.loadConfig();
  }

  /**
   * Gets the ordered list of configuration file paths to search.
   * Paths are returned in priority order from highest to lowest.
   * Results are cached for performance.
   * @private
   * @returns {string[]} Array of absolute file paths to search for configuration
   */
  private getConfigSearchPaths(): string[] {
    const currentCwd = process.cwd();
    
    // Return cached paths if CWD hasn't changed
    if (this.cachedSearchPaths && this.cachedCwd === currentCwd) {
      return this.cachedSearchPaths;
    }

    this.cachedCwd = currentCwd;
    this.cachedSearchPaths = [
      // User-specified paths (highest priority)
      ...Array.from(this.configPaths),
      
      // Project-level configs
      resolve(currentCwd, 'accessibility.config.json'),
      resolve(currentCwd, 'accessibility.config.js'),
      resolve(currentCwd, '.accessibilityrc.json'),
      resolve(currentCwd, '.accessibilityrc'),
      
      // Package.json accessibility field
      resolve(currentCwd, 'package.json'),
      
      // Home directory config
      resolve(process.env.HOME || '~', '.accessibility.config.json'),
      
      // System-wide config
      '/etc/accessibility/config.json'
    ];

    return this.cachedSearchPaths;
  }

  /**
   * Loads configuration from a specific file path.
   * Supports JSON files and package.json accessibility field.
   * @private
   * @async
   * @param {string} path - Absolute path to the configuration file
   * @returns {Promise<PartialAccessibilityConfig>} The parsed configuration object
   * @throws {Error} When file doesn't exist, can't be read, or has invalid JSON
   */
  private async loadConfigFile(path: string): Promise<PartialAccessibilityConfig> {
    try {
      await fs.access(path);
    } catch {
      throw new Error(`Config file not found: ${path}`);
    }

    const content = await fs.readFile(path, 'utf-8');

    // Handle different file types
    if (path.endsWith('.js')) {
      // For .js files, we'd need to use dynamic import, but for now just support JSON
      throw new Error('JavaScript config files not yet supported');
    } else if (path.endsWith('package.json')) {
      const pkg = JSON.parse(content);
      return pkg.accessibility || {};
    } else {
      // JSON files (.json, .accessibilityrc, etc.)
      return JSON.parse(content);
    }
  }

  /**
   * Loads configuration from environment variables using a mapping approach.
   * Supports common configuration options via environment variables with
   * the ACCESSIBILITY_ prefix.
   * @private
   * @returns {PartialAccessibilityConfig} Configuration object built from environment variables
   * @example
   * Environment variables:
   * - ACCESSIBILITY_WCAG_LEVEL=AAA
   * - ACCESSIBILITY_ARIA_VALIDATION=true
   * - ACCESSIBILITY_MIN_IMPACT=serious
   * - ACCESSIBILITY_REPORT_FORMAT=summary
   */
  private loadFromEnvironment(): PartialAccessibilityConfig {
    const config: PartialAccessibilityConfig = {};

    for (const [envVar, mapping] of Object.entries(ENV_VAR_MAPPINGS)) {
      const value = process.env[envVar];
      if (value !== undefined) {
        const processedValue = mapping.type === 'boolean' ? value === 'true' : value;
        this.setNestedProperty(config, mapping.path, processedValue);
      }
    }

    return config;
  }

  /**
   * Sets a nested property in an object using a path array.
   * @private
   * @param {any} obj - The object to modify
   * @param {string[]} path - Array representing the nested path
   * @param {any} value - The value to set
   */
  private setNestedProperty(obj: any, path: readonly string[], value: any): void {
    let current = obj;
    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i];
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    current[path[path.length - 1]] = value;
  }

  /**
   * Performs deep merge of two objects, recursively merging nested objects.
   * Arrays and primitive values are replaced rather than merged.
   * @private
   * @param {any} target - The target object to merge into
   * @param {any} source - The source object to merge from
   * @returns {any} A new object with merged properties
   * @example
   * ```typescript
   * const result = this.deepMerge(
   *   { a: { b: 1, c: 2 } },
   *   { a: { c: 3, d: 4 } }
   * );
   * // Result: { a: { b: 1, c: 3, d: 4 } }
   * ```
   */
  private deepMerge(target: any, source: any): any {
    const result = { ...target };

    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }

  /**
   * Validates a configuration value against allowed options.
   * @private
   * @param {string} value - The value to validate
   * @param {readonly string[]} allowedValues - Array of allowed values
   * @param {string} fieldName - Name of the field for error messages
   * @throws {Error} When value is not in allowed values
   */
  private validateConfigValue(value: string, allowedValues: readonly string[], fieldName: string): void {
    if (!allowedValues.includes(value)) {
      throw new Error(`Invalid ${fieldName}: ${value}. Must be one of: ${allowedValues.join(', ')}.`);
    }
  }

  /**
   * Validates the loaded configuration for correctness and consistency.
   * Throws descriptive errors for invalid configuration values.
   * @private
   * @param {AccessibilityConfig} config - The configuration object to validate
   * @throws {Error} When configuration contains invalid values
   * @example
   * Validates:
   * - WCAG level is A, AA, or AAA
   * - Impact level is valid
   * - Report format is supported
   * - WCAG criterion IDs follow correct format
   */
  private validateConfig(config: AccessibilityConfig): void {
    // Validate using centralized validation method
    this.validateConfigValue(config.wcag.defaultLevel, WCAG_LEVELS, 'WCAG level');
    this.validateConfigValue(config.evaluation.minImpactLevel, IMPACT_LEVELS, 'impact level');
    this.validateConfigValue(config.reporting.format, REPORT_FORMATS, 'reporting format');

    // Validate WCAG criteria IDs if specified
    if (config.wcag.enabledCriteria?.length) {
      const criterionIdPattern = /^\d+\.\d+\.\d+$/;
      for (const criterion of config.wcag.enabledCriteria) {
        if (!criterionIdPattern.test(criterion)) {
          console.warn(`Warning: Invalid WCAG criterion ID format: ${criterion}`);
        }
      }
    }
  }

  /**
   * Gets the effective WCAG level, with optional override capability.
   * Returns the override if provided, otherwise the configured level, or 'AA' as default.
   * @param {('A' | 'AA' | 'AAA')} [override] - Optional level to override the configured level
   * @returns {('A' | 'AA' | 'AAA')} The WCAG level to use
   * @example
   * ```typescript
   * const level = loader.getWCAGLevel(); // Uses config or default
   * const overrideLevel = loader.getWCAGLevel('AAA'); // Forces AAA level
   * ```
   */
  getWCAGLevel(override?: 'A' | 'AA' | 'AAA'): 'A' | 'AA' | 'AAA' {
    return override || this.config?.wcag.defaultLevel || 'AA';
  }

  /**
   * Checks if a specific WCAG criterion is enabled based on configuration.
   * Considers both enabled and disabled criterion lists, with disabled taking precedence.
   * @param {string} criterionId - The WCAG criterion ID (e.g., '1.1.1')
   * @returns {boolean} True if the criterion should be checked, false otherwise
   * @example
   * ```typescript
   * if (loader.isWCAGCriterionEnabled('1.1.1')) {
   *   // Check alt text requirement
   * }
   * ```
   */
  isWCAGCriterionEnabled(criterionId: string): boolean {
    if (!this.config) return true;

    const { enabledCriteria, disabledCriteria } = this.config.wcag;

    // If disabled list exists and contains this criterion, it's disabled
    if (disabledCriteria?.includes(criterionId)) {
      return false;
    }

    // If enabled list exists, only those in the list are enabled
    if (enabledCriteria?.length) {
      return enabledCriteria.includes(criterionId);
    }

    // Default: enabled
    return true;
  }

  /**
   * Generates an Axe-core configuration object based on the loaded accessibility config.
   * Maps WCAG levels to appropriate tags and includes custom rule configurations.
   * @returns {any} Configuration object compatible with axe-core
   * @example
   * ```typescript
   * const axeConfig = loader.getAxeConfig();
   * // Use with axe-core: axe.run(element, axeConfig)
   * ```
   */
  getAxeConfig(): any {
    if (!this.config?.axe) return {};

    const axeConfig: any = {};

    if (this.config.axe.tags) {
      // Use mapping to get WCAG tags efficiently
      const wcagLevel = this.config.wcag.defaultLevel;
      const wcagTags = WCAG_TAG_MAPPING[wcagLevel] || [];
      
      // Combine with existing tags and deduplicate using Set
      const allTags = new Set([...this.config.axe.tags, ...wcagTags]);
      axeConfig.tags = Array.from(allTags);
    }

    if (this.config.axe.rules) {
      axeConfig.rules = this.config.axe.rules;
    }

    if (this.config.axe.resultTypes) {
      axeConfig.resultTypes = this.config.axe.resultTypes;
    }

    return axeConfig;
  }
} 