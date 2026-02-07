/**
 * Feature Flags Utility
 *
 * Client-side feature flag management with percentage rollouts,
 * user targeting, and A/B testing support.
 */

/**
 * Feature flag value types
 */
export type FlagValue = boolean | string | number | object;

/**
 * User context for targeting
 */
export interface UserContext {
  id?: string;
  email?: string;
  role?: string;
  plan?: string;
  createdAt?: Date;
  properties?: Record<string, unknown>;
}

/**
 * Targeting rule types
 */
export type TargetingOperator =
  | "equals"
  | "notEquals"
  | "contains"
  | "notContains"
  | "startsWith"
  | "endsWith"
  | "greaterThan"
  | "lessThan"
  | "in"
  | "notIn"
  | "regex"
  | "before"
  | "after";

/**
 * Targeting rule
 */
export interface TargetingRule {
  field: string;
  operator: TargetingOperator;
  value: unknown;
}

/**
 * Feature flag definition
 */
export interface FeatureFlag<T extends FlagValue = boolean> {
  key: string;
  defaultValue: T;
  description?: string;
  enabled?: boolean;
  percentage?: number;
  targeting?: TargetingRule[];
  variants?: Array<{ value: T; weight: number }>;
  overrides?: Array<{ userId: string; value: T }>;
}

/**
 * Feature flags configuration
 */
export interface FeatureFlagsConfig {
  flags: FeatureFlag[];
  defaultEnabled?: boolean;
  onEvaluate?: (key: string, value: FlagValue, context?: UserContext) => void;
  storage?: Storage;
  storageKey?: string;
}

/**
 * Evaluation result
 */
export interface EvaluationResult<T extends FlagValue> {
  value: T;
  reason: "default" | "disabled" | "targeting" | "percentage" | "variant" | "override";
  ruleIndex?: number;
}

/**
 * Feature Flags Manager
 */
class FeatureFlagsManager {
  private flags: Map<string, FeatureFlag> = new Map();
  private userContext: UserContext | null = null;
  private config: FeatureFlagsConfig;
  private overrides: Map<string, FlagValue> = new Map();
  private listeners: Map<string, Set<(value: FlagValue) => void>> = new Map();

  constructor(config: FeatureFlagsConfig = { flags: [] }) {
    this.config = {
      defaultEnabled: true,
      storageKey: "feature_flags_overrides",
      ...config,
    };

    // Load flags
    for (const flag of config.flags) {
      this.flags.set(flag.key, flag);
    }

    // Load persisted overrides
    this.loadOverrides();
  }

  /**
   * Set user context for targeting
   */
  setUserContext(context: UserContext): void {
    this.userContext = context;
  }

  /**
   * Clear user context
   */
  clearUserContext(): void {
    this.userContext = null;
  }

  /**
   * Get a feature flag value
   */
  get<T extends FlagValue = boolean>(key: string, defaultValue?: T): T {
    const result = this.evaluate<T>(key, defaultValue);
    return result.value;
  }

  /**
   * Check if a boolean feature flag is enabled
   */
  isEnabled(key: string): boolean {
    return this.get<boolean>(key, false);
  }

  /**
   * Evaluate a feature flag with full result
   */
  evaluate<T extends FlagValue = boolean>(key: string, defaultValue?: T): EvaluationResult<T> {
    const flag = this.flags.get(key) as FeatureFlag<T> | undefined;

    // Check local overrides first
    if (this.overrides.has(key)) {
      return {
        value: this.overrides.get(key) as T,
        reason: "override",
      };
    }

    // No flag defined
    if (!flag) {
      const value = (defaultValue ?? false) as T;
      return { value, reason: "default" };
    }

    // Flag explicitly disabled
    if (flag.enabled === false) {
      return { value: flag.defaultValue, reason: "disabled" };
    }

    // Check user overrides
    if (flag.overrides && this.userContext?.id) {
      const override = flag.overrides.find((o) => o.userId === this.userContext?.id);
      if (override) {
        this.notifyEvaluate(key, override.value);
        return { value: override.value, reason: "override" };
      }
    }

    // Check targeting rules
    if (flag.targeting && flag.targeting.length > 0 && this.userContext) {
      const matchedRuleIndex = this.evaluateTargeting(flag.targeting, this.userContext);
      if (matchedRuleIndex === -1) {
        return { value: flag.defaultValue, reason: "targeting" };
      }
    }

    // Check percentage rollout
    if (flag.percentage !== undefined && flag.percentage < 100) {
      const hash = this.hashUserId(key);
      if (hash > flag.percentage) {
        return { value: flag.defaultValue, reason: "percentage" };
      }
    }

    // Check variants (A/B testing)
    if (flag.variants && flag.variants.length > 0) {
      const variant = this.selectVariant(flag.variants, key);
      this.notifyEvaluate(key, variant);
      return { value: variant, reason: "variant" };
    }

    // Return enabled value (true for boolean, or the non-default value)
    const enabledValue = (typeof flag.defaultValue === "boolean" ? true : flag.defaultValue) as T;
    this.notifyEvaluate(key, enabledValue);
    return { value: enabledValue, reason: "default" };
  }

  /**
   * Set a local override (for testing/debugging)
   */
  setOverride(key: string, value: FlagValue): void {
    this.overrides.set(key, value);
    this.saveOverrides();
    this.notifyListeners(key, value);
  }

  /**
   * Remove a local override
   */
  removeOverride(key: string): void {
    this.overrides.delete(key);
    this.saveOverrides();
    const flag = this.flags.get(key);
    if (flag) {
      this.notifyListeners(key, flag.defaultValue);
    }
  }

  /**
   * Clear all overrides
   */
  clearOverrides(): void {
    this.overrides.clear();
    this.saveOverrides();
  }

  /**
   * Get all overrides
   */
  getOverrides(): Record<string, FlagValue> {
    return Object.fromEntries(this.overrides);
  }

  /**
   * Subscribe to flag changes
   */
  subscribe(key: string, callback: (value: FlagValue) => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(key)?.delete(callback);
    };
  }

  /**
   * Get all flags
   */
  getAllFlags(): Record<string, FlagValue> {
    const result: Record<string, FlagValue> = {};
    const entries = Array.from(this.flags.entries());
    for (const [key] of entries) {
      result[key] = this.get(key);
    }
    return result;
  }

  /**
   * Reload flags from config
   */
  reload(flags: FeatureFlag[]): void {
    this.flags.clear();
    for (const flag of flags) {
      this.flags.set(flag.key, flag);
    }
  }

  // Private methods

  private evaluateTargeting(rules: TargetingRule[], context: UserContext): number {
    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      const value = this.getFieldValue(context, rule.field);

      if (this.evaluateRule(value, rule.operator, rule.value)) {
        return i;
      }
    }
    return -1;
  }

  private getFieldValue(context: UserContext, field: string): unknown {
    if (field.startsWith("properties.")) {
      const propKey = field.slice(11);
      return context.properties?.[propKey];
    }
    return (context as Record<string, unknown>)[field];
  }

  private evaluateRule(value: unknown, operator: TargetingOperator, ruleValue: unknown): boolean {
    switch (operator) {
      case "equals":
        return value === ruleValue;
      case "notEquals":
        return value !== ruleValue;
      case "contains":
        return String(value).includes(String(ruleValue));
      case "notContains":
        return !String(value).includes(String(ruleValue));
      case "startsWith":
        return String(value).startsWith(String(ruleValue));
      case "endsWith":
        return String(value).endsWith(String(ruleValue));
      case "greaterThan":
        return Number(value) > Number(ruleValue);
      case "lessThan":
        return Number(value) < Number(ruleValue);
      case "in":
        return Array.isArray(ruleValue) && ruleValue.includes(value);
      case "notIn":
        return Array.isArray(ruleValue) && !ruleValue.includes(value);
      case "regex":
        return new RegExp(String(ruleValue)).test(String(value));
      case "before":
        return new Date(String(value)) < new Date(String(ruleValue));
      case "after":
        return new Date(String(value)) > new Date(String(ruleValue));
      default:
        return false;
    }
  }

  private hashUserId(key: string): number {
    const userId = this.userContext?.id || "anonymous";
    const str = `${key}:${userId}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash % 100);
  }

  private selectVariant<T extends FlagValue>(
    variants: Array<{ value: T; weight: number }>,
    key: string
  ): T {
    const hash = this.hashUserId(key);
    const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
    const normalizedHash = (hash / 100) * totalWeight;

    let cumulative = 0;
    for (const variant of variants) {
      cumulative += variant.weight;
      if (normalizedHash <= cumulative) {
        return variant.value;
      }
    }

    return variants[variants.length - 1].value;
  }

  private loadOverrides(): void {
    if (typeof window === "undefined" || !this.config.storage) return;

    try {
      const stored = this.config.storage.getItem(this.config.storageKey!);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.overrides = new Map(Object.entries(parsed));
      }
    } catch {
      // Ignore storage errors
    }
  }

  private saveOverrides(): void {
    if (typeof window === "undefined" || !this.config.storage) return;

    try {
      const data = Object.fromEntries(this.overrides);
      this.config.storage.setItem(this.config.storageKey!, JSON.stringify(data));
    } catch {
      // Ignore storage errors
    }
  }

  private notifyEvaluate(key: string, value: FlagValue): void {
    this.config.onEvaluate?.(key, value, this.userContext || undefined);
  }

  private notifyListeners(key: string, value: FlagValue): void {
    this.listeners.get(key)?.forEach((callback) => callback(value));
  }
}

// Singleton instance
let instance: FeatureFlagsManager | null = null;

/**
 * Initialize feature flags
 */
export function initFeatureFlags(config: FeatureFlagsConfig): FeatureFlagsManager {
  instance = new FeatureFlagsManager(config);
  return instance;
}

/**
 * Get the feature flags manager instance
 */
export function getFeatureFlags(): FeatureFlagsManager {
  if (!instance) {
    instance = new FeatureFlagsManager({ flags: [] });
  }
  return instance;
}

/**
 * Quick helper to check if a flag is enabled
 */
export function isFeatureEnabled(key: string): boolean {
  return getFeatureFlags().isEnabled(key);
}

/**
 * Quick helper to get a flag value
 */
export function getFeatureValue<T extends FlagValue>(key: string, defaultValue?: T): T {
  return getFeatureFlags().get<T>(key, defaultValue);
}

/**
 * Common feature flag keys (for type safety)
 */
export const FeatureKeys = {
  // UI Features
  DARK_MODE: "dark_mode",
  NEW_NAVIGATION: "new_navigation",
  BETA_FEATURES: "beta_features",

  // Functional Features
  AI_CHAT: "ai_chat",
  VIDEO_CALLS: "video_calls",
  COMMUNITY_POSTS: "community_posts",
  GAMIFICATION: "gamification",

  // Experiments
  NEW_ONBOARDING: "new_onboarding",
  PRICING_TEST: "pricing_test",
  CHECKOUT_V2: "checkout_v2",

  // Admin
  DEBUG_MODE: "debug_mode",
  ADMIN_TOOLS: "admin_tools",
} as const;

/**
 * Create feature flag definitions helper
 */
export function defineFlags(
  flags: Array<Omit<FeatureFlag, "key"> & { key: string }>
): FeatureFlag[] {
  return flags;
}

/**
 * Example usage:
 *
 * ```typescript
 * // Initialize
 * initFeatureFlags({
 *   flags: [
 *     { key: 'new_feature', defaultValue: false, percentage: 50 },
 *     { key: 'premium_only', defaultValue: false, targeting: [
 *       { field: 'plan', operator: 'equals', value: 'premium' }
 *     ]},
 *     { key: 'button_color', defaultValue: 'blue', variants: [
 *       { value: 'blue', weight: 50 },
 *       { value: 'green', weight: 50 }
 *     ]}
 *   ],
 *   storage: localStorage
 * });
 *
 * // Set user context
 * getFeatureFlags().setUserContext({
 *   id: 'user123',
 *   plan: 'premium',
 *   role: 'member'
 * });
 *
 * // Check flags
 * if (isFeatureEnabled('new_feature')) {
 *   // Show new feature
 * }
 *
 * const buttonColor = getFeatureValue('button_color', 'blue');
 * ```
 */
