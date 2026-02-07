/**
 * Search & Filter Utilities
 *
 * Client-side search, filtering, and sorting utilities for arrays of objects.
 */

/**
 * Filter operator types
 */
export type FilterOperator =
  | "equals"
  | "notEquals"
  | "contains"
  | "notContains"
  | "startsWith"
  | "endsWith"
  | "greaterThan"
  | "greaterThanOrEqual"
  | "lessThan"
  | "lessThanOrEqual"
  | "between"
  | "in"
  | "notIn"
  | "isEmpty"
  | "isNotEmpty"
  | "isNull"
  | "isNotNull";

/**
 * Filter condition
 */
export interface FilterCondition<T> {
  field: keyof T;
  operator: FilterOperator;
  value?: unknown;
  caseSensitive?: boolean;
}

/**
 * Sort direction
 */
export type SortDirection = "asc" | "desc";

/**
 * Sort configuration
 */
export interface SortConfig<T> {
  field: keyof T;
  direction: SortDirection;
  nullsFirst?: boolean;
}

/**
 * Search options
 */
export interface SearchOptions<T> {
  fields?: (keyof T)[];
  caseSensitive?: boolean;
  fuzzy?: boolean;
  threshold?: number;
  highlight?: boolean;
  highlightTag?: string;
}

/**
 * Search result with highlighting
 */
export interface SearchResult<T> {
  item: T;
  score: number;
  matches: Array<{ field: keyof T; indices: Array<[number, number]> }>;
  highlighted?: Partial<Record<keyof T, string>>;
}

/**
 * Simple text search across object fields
 */
export function search<T extends Record<string, unknown>>(
  items: T[],
  query: string,
  options: SearchOptions<T> = {}
): T[] {
  const { fields, caseSensitive = false, fuzzy = false, threshold = 0.3 } = options;

  if (!query.trim()) {
    return items;
  }

  const searchQuery = caseSensitive ? query : query.toLowerCase();

  return items.filter((item) => {
    const fieldsToSearch = fields ?? (Object.keys(item) as (keyof T)[]);

    return fieldsToSearch.some((field) => {
      const value = item[field];
      if (value === null || value === undefined) return false;

      const stringValue = String(value);
      const compareValue = caseSensitive ? stringValue : stringValue.toLowerCase();

      if (fuzzy) {
        return fuzzyMatch(searchQuery, compareValue, threshold);
      }

      return compareValue.includes(searchQuery);
    });
  });
}

/**
 * Advanced search with scoring and highlighting
 */
export function searchWithScores<T extends Record<string, unknown>>(
  items: T[],
  query: string,
  options: SearchOptions<T> = {}
): SearchResult<T>[] {
  const {
    fields,
    caseSensitive = false,
    fuzzy = false,
    threshold = 0.3,
    highlight = false,
    highlightTag = "mark",
  } = options;

  if (!query.trim()) {
    return items.map((item) => ({
      item,
      score: 1,
      matches: [],
    }));
  }

  const searchQuery = caseSensitive ? query : query.toLowerCase();
  const results: SearchResult<T>[] = [];

  for (const item of items) {
    const fieldsToSearch = fields ?? (Object.keys(item) as (keyof T)[]);
    const matches: SearchResult<T>["matches"] = [];
    let totalScore = 0;

    for (const field of fieldsToSearch) {
      const value = item[field];
      if (value === null || value === undefined) continue;

      const stringValue = String(value);
      const compareValue = caseSensitive ? stringValue : stringValue.toLowerCase();

      if (fuzzy) {
        const score = fuzzyScore(searchQuery, compareValue);
        if (score > threshold) {
          totalScore += score;
          matches.push({ field, indices: [[0, stringValue.length]] });
        }
      } else {
        const indices = findAllMatches(compareValue, searchQuery);
        if (indices.length > 0) {
          totalScore += 1 / (1 + indices[0][0]); // Higher score for earlier matches
          matches.push({ field, indices });
        }
      }
    }

    if (matches.length > 0) {
      const result: SearchResult<T> = {
        item,
        score: totalScore / matches.length,
        matches,
      };

      if (highlight) {
        result.highlighted = highlightMatches(item, matches, highlightTag);
      }

      results.push(result);
    }
  }

  // Sort by score descending
  return results.sort((a, b) => b.score - a.score);
}

/**
 * Filter items based on conditions
 */
export function filter<T extends Record<string, unknown>>(
  items: T[],
  conditions: FilterCondition<T>[],
  logic: "and" | "or" = "and"
): T[] {
  if (conditions.length === 0) {
    return items;
  }

  return items.filter((item) => {
    const results = conditions.map((condition) => evaluateCondition(item, condition));

    if (logic === "and") {
      return results.every(Boolean);
    } else {
      return results.some(Boolean);
    }
  });
}

/**
 * Sort items by multiple fields
 */
export function sort<T extends Record<string, unknown>>(items: T[], configs: SortConfig<T>[]): T[] {
  if (configs.length === 0) {
    return items;
  }

  return [...items].sort((a, b) => {
    for (const config of configs) {
      const comparison = compareValues(
        a[config.field],
        b[config.field],
        config.direction,
        config.nullsFirst
      );
      if (comparison !== 0) {
        return comparison;
      }
    }
    return 0;
  });
}

/**
 * Paginate items
 */
export function paginate<T>(
  items: T[],
  page: number,
  pageSize: number
): {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
} {
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const normalizedPage = Math.max(1, Math.min(page, totalPages || 1));
  const startIndex = (normalizedPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  return {
    items: items.slice(startIndex, endIndex),
    page: normalizedPage,
    pageSize,
    totalItems,
    totalPages,
    hasNextPage: normalizedPage < totalPages,
    hasPrevPage: normalizedPage > 1,
  };
}

/**
 * Group items by a field
 */
export function groupBy<T extends Record<string, unknown>, K extends keyof T>(
  items: T[],
  field: K
): Map<T[K], T[]> {
  const groups = new Map<T[K], T[]>();

  for (const item of items) {
    const key = item[field];
    const existing = groups.get(key) || [];
    groups.set(key, [...existing, item]);
  }

  return groups;
}

/**
 * Count items by a field value
 */
export function countBy<T extends Record<string, unknown>, K extends keyof T>(
  items: T[],
  field: K
): Map<T[K], number> {
  const counts = new Map<T[K], number>();

  for (const item of items) {
    const key = item[field];
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  return counts;
}

/**
 * Get unique values for a field
 */
export function uniqueValues<T extends Record<string, unknown>, K extends keyof T>(
  items: T[],
  field: K
): T[K][] {
  const seen = new Set<T[K]>();
  const result: T[K][] = [];

  for (const item of items) {
    const value = item[field];
    if (!seen.has(value)) {
      seen.add(value);
      result.push(value);
    }
  }

  return result;
}

/**
 * Aggregate functions
 */
export const aggregate = {
  sum: <T extends Record<string, unknown>>(items: T[], field: keyof T): number => {
    return items.reduce((sum, item) => sum + (Number(item[field]) || 0), 0);
  },

  avg: <T extends Record<string, unknown>>(items: T[], field: keyof T): number => {
    if (items.length === 0) return 0;
    return aggregate.sum(items, field) / items.length;
  },

  min: <T extends Record<string, unknown>>(items: T[], field: keyof T): number => {
    const values = items.map((item) => Number(item[field])).filter((v) => !isNaN(v));
    return values.length > 0 ? Math.min(...values) : 0;
  },

  max: <T extends Record<string, unknown>>(items: T[], field: keyof T): number => {
    const values = items.map((item) => Number(item[field])).filter((v) => !isNaN(v));
    return values.length > 0 ? Math.max(...values) : 0;
  },

  count: <T>(items: T[]): number => items.length,

  countDistinct: <T extends Record<string, unknown>>(items: T[], field: keyof T): number => {
    return new Set(items.map((item) => item[field])).size;
  },
};

/**
 * Create a reusable query builder
 */
export class QueryBuilder<T extends Record<string, unknown>> {
  private items: T[];
  private filterConditions: FilterCondition<T>[] = [];
  private filterLogic: "and" | "or" = "and";
  private sortConfigs: SortConfig<T>[] = [];
  private searchQuery = "";
  private searchOptions: SearchOptions<T> = {};

  constructor(items: T[]) {
    this.items = items;
  }

  where(condition: FilterCondition<T>): this {
    this.filterConditions.push(condition);
    return this;
  }

  whereEquals<K extends keyof T>(field: K, value: T[K]): this {
    return this.where({ field, operator: "equals", value });
  }

  whereContains<K extends keyof T>(field: K, value: string): this {
    return this.where({ field, operator: "contains", value });
  }

  whereIn<K extends keyof T>(field: K, values: T[K][]): this {
    return this.where({ field, operator: "in", value: values });
  }

  whereBetween<K extends keyof T>(field: K, min: T[K], max: T[K]): this {
    return this.where({ field, operator: "between", value: [min, max] });
  }

  orWhere(): this {
    this.filterLogic = "or";
    return this;
  }

  andWhere(): this {
    this.filterLogic = "and";
    return this;
  }

  searchFor(query: string, options?: SearchOptions<T>): this {
    this.searchQuery = query;
    this.searchOptions = options || {};
    return this;
  }

  orderBy(field: keyof T, direction: SortDirection = "asc"): this {
    this.sortConfigs.push({ field, direction });
    return this;
  }

  execute(): T[] {
    let result = [...this.items];

    // Apply search
    if (this.searchQuery) {
      result = search(result, this.searchQuery, this.searchOptions);
    }

    // Apply filters
    if (this.filterConditions.length > 0) {
      result = filter(result, this.filterConditions, this.filterLogic);
    }

    // Apply sorting
    if (this.sortConfigs.length > 0) {
      result = sort(result, this.sortConfigs);
    }

    return result;
  }

  paginate(page: number, pageSize: number) {
    return paginate(this.execute(), page, pageSize);
  }

  first(): T | undefined {
    return this.execute()[0];
  }

  count(): number {
    return this.execute().length;
  }
}

/**
 * Create a query builder for an array
 */
export function query<T extends Record<string, unknown>>(items: T[]): QueryBuilder<T> {
  return new QueryBuilder(items);
}

// Helper functions

function evaluateCondition<T extends Record<string, unknown>>(
  item: T,
  condition: FilterCondition<T>
): boolean {
  const { field, operator, value, caseSensitive = false } = condition;
  const fieldValue = item[field];

  // Handle null/empty checks first
  switch (operator) {
    case "isEmpty":
      return fieldValue === "" || fieldValue === null || fieldValue === undefined;
    case "isNotEmpty":
      return fieldValue !== "" && fieldValue !== null && fieldValue !== undefined;
    case "isNull":
      return fieldValue === null || fieldValue === undefined;
    case "isNotNull":
      return fieldValue !== null && fieldValue !== undefined;
  }

  // Handle other operators
  const compareValue = caseSensitive ? String(fieldValue) : String(fieldValue).toLowerCase();
  const searchValue = caseSensitive ? String(value) : String(value).toLowerCase();

  switch (operator) {
    case "equals":
      return fieldValue === value;
    case "notEquals":
      return fieldValue !== value;
    case "contains":
      return compareValue.includes(searchValue);
    case "notContains":
      return !compareValue.includes(searchValue);
    case "startsWith":
      return compareValue.startsWith(searchValue);
    case "endsWith":
      return compareValue.endsWith(searchValue);
    case "greaterThan":
      return Number(fieldValue) > Number(value);
    case "greaterThanOrEqual":
      return Number(fieldValue) >= Number(value);
    case "lessThan":
      return Number(fieldValue) < Number(value);
    case "lessThanOrEqual":
      return Number(fieldValue) <= Number(value);
    case "between": {
      const [min, max] = value as [unknown, unknown];
      const numValue = Number(fieldValue);
      return numValue >= Number(min) && numValue <= Number(max);
    }
    case "in":
      return (value as unknown[]).includes(fieldValue);
    case "notIn":
      return !(value as unknown[]).includes(fieldValue);
    default:
      return true;
  }
}

function compareValues(
  a: unknown,
  b: unknown,
  direction: SortDirection,
  nullsFirst = false
): number {
  // Handle nulls
  if (a === null || a === undefined) {
    if (b === null || b === undefined) return 0;
    return nullsFirst ? -1 : 1;
  }
  if (b === null || b === undefined) {
    return nullsFirst ? 1 : -1;
  }

  // Compare values
  let comparison = 0;
  if (typeof a === "string" && typeof b === "string") {
    comparison = a.localeCompare(b);
  } else if (a instanceof Date && b instanceof Date) {
    comparison = a.getTime() - b.getTime();
  } else {
    comparison = Number(a) - Number(b);
  }

  return direction === "asc" ? comparison : -comparison;
}

function fuzzyMatch(pattern: string, text: string, threshold: number): boolean {
  return fuzzyScore(pattern, text) >= threshold;
}

function fuzzyScore(pattern: string, text: string): number {
  if (pattern.length === 0) return 1;
  if (text.length === 0) return 0;
  if (pattern.length > text.length) return 0;

  let patternIdx = 0;
  let score = 0;
  let consecutiveBonus = 0;

  for (let i = 0; i < text.length && patternIdx < pattern.length; i++) {
    if (text[i] === pattern[patternIdx]) {
      score += 1 + consecutiveBonus * 0.5;
      consecutiveBonus++;
      patternIdx++;
    } else {
      consecutiveBonus = 0;
    }
  }

  if (patternIdx !== pattern.length) {
    return 0;
  }

  return score / (pattern.length + (text.length - pattern.length) * 0.1);
}

function findAllMatches(text: string, pattern: string): Array<[number, number]> {
  const matches: Array<[number, number]> = [];
  let index = 0;

  while (index <= text.length - pattern.length) {
    const foundIndex = text.indexOf(pattern, index);
    if (foundIndex === -1) break;
    matches.push([foundIndex, foundIndex + pattern.length]);
    index = foundIndex + 1;
  }

  return matches;
}

function highlightMatches<T extends Record<string, unknown>>(
  item: T,
  matches: SearchResult<T>["matches"],
  tag: string
): Partial<Record<keyof T, string>> {
  const highlighted: Partial<Record<keyof T, string>> = {};

  for (const match of matches) {
    const value = String(item[match.field]);
    let result = "";
    let lastEnd = 0;

    // Sort indices by start position
    const sortedIndices = [...match.indices].sort((a, b) => a[0] - b[0]);

    for (const [start, end] of sortedIndices) {
      result += value.slice(lastEnd, start);
      result += `<${tag}>${value.slice(start, end)}</${tag}>`;
      lastEnd = end;
    }

    result += value.slice(lastEnd);
    highlighted[match.field] = result;
  }

  return highlighted;
}
