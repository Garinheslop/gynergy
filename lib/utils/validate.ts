/**
 * Validation Schema Utilities
 *
 * Lightweight, chainable validation library with TypeScript support.
 * No external dependencies.
 */

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validator function type
 */
export type ValidatorFn<T> = (value: T) => string | undefined;

/**
 * Schema validator type
 */
export type SchemaValidator<T> = {
  validate: (value: unknown) => ValidationResult;
  validateAsync: (value: unknown) => Promise<ValidationResult>;
  parse: (value: unknown) => T;
  safeParse: (value: unknown) => { success: true; data: T } | { success: false; errors: string[] };
  optional: () => SchemaValidator<T | undefined>;
  nullable: () => SchemaValidator<T | null>;
  default: (defaultValue: T) => SchemaValidator<T>;
  transform: <U>(fn: (value: T) => U) => SchemaValidator<U>;
  refine: (fn: (value: T) => boolean, message: string) => SchemaValidator<T>;
};

/**
 * Create a base validator
 */
function createValidator<T>(
  validators: ValidatorFn<unknown>[],
  transformer?: (value: unknown) => T,
  defaultValue?: T,
  isOptional = false,
  isNullable = false
): SchemaValidator<T> {
  const validate = (value: unknown): ValidationResult => {
    // Handle undefined
    if (value === undefined) {
      if (defaultValue !== undefined) {
        value = defaultValue;
      } else if (isOptional) {
        return { valid: true, errors: [] };
      } else {
        return { valid: false, errors: ["Value is required"] };
      }
    }

    // Handle null
    if (value === null) {
      if (isNullable) {
        return { valid: true, errors: [] };
      } else {
        return { valid: false, errors: ["Value cannot be null"] };
      }
    }

    // Apply transformer if exists
    if (transformer) {
      try {
        value = transformer(value);
      } catch (err) {
        return { valid: false, errors: [err instanceof Error ? err.message : "Transform failed"] };
      }
    }

    // Run all validators
    const errors: string[] = [];
    for (const validator of validators) {
      const error = validator(value);
      if (error) {
        errors.push(error);
      }
    }

    return { valid: errors.length === 0, errors };
  };

  return {
    validate,
    validateAsync: async (value: unknown) => validate(value),
    parse: (value: unknown) => {
      const result = validate(value);
      if (!result.valid) {
        throw new Error(result.errors.join(", "));
      }
      return (transformer ? transformer(value) : value) as T;
    },
    safeParse: (value: unknown) => {
      const result = validate(value);
      if (result.valid) {
        return { success: true, data: (transformer ? transformer(value) : value) as T };
      }
      return { success: false, errors: result.errors };
    },
    optional: () =>
      createValidator<T | undefined>(validators, transformer, defaultValue, true, isNullable),
    nullable: () =>
      createValidator<T | null>(validators, transformer, defaultValue, isOptional, true),
    default: (newDefault: T) =>
      createValidator<T>(validators, transformer, newDefault, isOptional, isNullable),
    transform: <U>(fn: (value: T) => U) =>
      createValidator<U>(
        validators,
        (v) => fn((transformer ? transformer(v) : v) as T),
        undefined,
        isOptional,
        isNullable
      ),
    refine: (fn: (value: T) => boolean, message: string) =>
      createValidator<T>(
        [...validators, (v) => (fn(v as T) ? undefined : message)],
        transformer,
        defaultValue,
        isOptional,
        isNullable
      ),
  };
}

/**
 * String validators
 */
export function string() {
  const validators: ValidatorFn<unknown>[] = [
    (value) => (typeof value === "string" ? undefined : "Expected string"),
  ];

  const schema = createValidator<string>(validators);

  return {
    ...schema,
    min: (length: number, message?: string) =>
      createValidator<string>([
        ...validators,
        (v) =>
          (v as string).length >= length
            ? undefined
            : (message ?? `Must be at least ${length} characters`),
      ]),
    max: (length: number, message?: string) =>
      createValidator<string>([
        ...validators,
        (v) =>
          (v as string).length <= length
            ? undefined
            : (message ?? `Must be at most ${length} characters`),
      ]),
    length: (length: number, message?: string) =>
      createValidator<string>([
        ...validators,
        (v) =>
          (v as string).length === length
            ? undefined
            : (message ?? `Must be exactly ${length} characters`),
      ]),
    email: (message?: string) =>
      createValidator<string>([
        ...validators,
        (v) =>
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v as string)
            ? undefined
            : (message ?? "Invalid email address"),
      ]),
    url: (message?: string) =>
      createValidator<string>([
        ...validators,
        (v) => {
          try {
            new URL(v as string);
            return undefined;
          } catch {
            return message ?? "Invalid URL";
          }
        },
      ]),
    uuid: (message?: string) =>
      createValidator<string>([
        ...validators,
        (v) =>
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v as string)
            ? undefined
            : (message ?? "Invalid UUID"),
      ]),
    regex: (pattern: RegExp, message?: string) =>
      createValidator<string>([
        ...validators,
        (v) => (pattern.test(v as string) ? undefined : (message ?? "Invalid format")),
      ]),
    includes: (search: string, message?: string) =>
      createValidator<string>([
        ...validators,
        (v) =>
          (v as string).includes(search) ? undefined : (message ?? `Must include "${search}"`),
      ]),
    startsWith: (prefix: string, message?: string) =>
      createValidator<string>([
        ...validators,
        (v) =>
          (v as string).startsWith(prefix) ? undefined : (message ?? `Must start with "${prefix}"`),
      ]),
    endsWith: (suffix: string, message?: string) =>
      createValidator<string>([
        ...validators,
        (v) =>
          (v as string).endsWith(suffix) ? undefined : (message ?? `Must end with "${suffix}"`),
      ]),
    trim: () => createValidator<string>(validators, (v) => (v as string).trim()),
    toLowerCase: () => createValidator<string>(validators, (v) => (v as string).toLowerCase()),
    toUpperCase: () => createValidator<string>(validators, (v) => (v as string).toUpperCase()),
    nonempty: (message?: string) =>
      createValidator<string>([
        ...validators,
        (v) => ((v as string).trim().length > 0 ? undefined : (message ?? "Cannot be empty")),
      ]),
  };
}

/**
 * Number validators
 */
export function number() {
  const validators: ValidatorFn<unknown>[] = [
    (value) => (typeof value === "number" && !isNaN(value) ? undefined : "Expected number"),
  ];

  const schema = createValidator<number>(validators);

  return {
    ...schema,
    min: (min: number, message?: string) =>
      createValidator<number>([
        ...validators,
        (v) => ((v as number) >= min ? undefined : (message ?? `Must be at least ${min}`)),
      ]),
    max: (max: number, message?: string) =>
      createValidator<number>([
        ...validators,
        (v) => ((v as number) <= max ? undefined : (message ?? `Must be at most ${max}`)),
      ]),
    positive: (message?: string) =>
      createValidator<number>([
        ...validators,
        (v) => ((v as number) > 0 ? undefined : (message ?? "Must be positive")),
      ]),
    negative: (message?: string) =>
      createValidator<number>([
        ...validators,
        (v) => ((v as number) < 0 ? undefined : (message ?? "Must be negative")),
      ]),
    nonnegative: (message?: string) =>
      createValidator<number>([
        ...validators,
        (v) => ((v as number) >= 0 ? undefined : (message ?? "Must be non-negative")),
      ]),
    int: (message?: string) =>
      createValidator<number>([
        ...validators,
        (v) => (Number.isInteger(v) ? undefined : (message ?? "Must be an integer")),
      ]),
    finite: (message?: string) =>
      createValidator<number>([
        ...validators,
        (v) => (Number.isFinite(v) ? undefined : (message ?? "Must be finite")),
      ]),
    multipleOf: (multiple: number, message?: string) =>
      createValidator<number>([
        ...validators,
        (v) =>
          (v as number) % multiple === 0
            ? undefined
            : (message ?? `Must be a multiple of ${multiple}`),
      ]),
  };
}

/**
 * Boolean validator
 */
export function boolean() {
  return createValidator<boolean>([
    (value) => (typeof value === "boolean" ? undefined : "Expected boolean"),
  ]);
}

/**
 * Date validator
 */
export function date() {
  const validators: ValidatorFn<unknown>[] = [
    (value) =>
      value instanceof Date && !isNaN(value.getTime()) ? undefined : "Expected valid date",
  ];

  const schema = createValidator<Date>(validators);

  return {
    ...schema,
    min: (minDate: Date, message?: string) =>
      createValidator<Date>([
        ...validators,
        (v) =>
          (v as Date) >= minDate
            ? undefined
            : (message ?? `Must be after ${minDate.toISOString()}`),
      ]),
    max: (maxDate: Date, message?: string) =>
      createValidator<Date>([
        ...validators,
        (v) =>
          (v as Date) <= maxDate
            ? undefined
            : (message ?? `Must be before ${maxDate.toISOString()}`),
      ]),
  };
}

/**
 * Array validator
 */
export function array<T>(itemSchema?: SchemaValidator<T>) {
  const validators: ValidatorFn<unknown>[] = [
    (value) => (Array.isArray(value) ? undefined : "Expected array"),
  ];

  if (itemSchema) {
    validators.push((value) => {
      const arr = value as unknown[];
      for (let i = 0; i < arr.length; i++) {
        const result = itemSchema.validate(arr[i]);
        if (!result.valid) {
          return `Item ${i}: ${result.errors.join(", ")}`;
        }
      }
      return undefined;
    });
  }

  const schema = createValidator<T[]>(validators);

  return {
    ...schema,
    min: (length: number, message?: string) =>
      createValidator<T[]>([
        ...validators,
        (v) =>
          (v as T[]).length >= length
            ? undefined
            : (message ?? `Must have at least ${length} items`),
      ]),
    max: (length: number, message?: string) =>
      createValidator<T[]>([
        ...validators,
        (v) =>
          (v as T[]).length <= length
            ? undefined
            : (message ?? `Must have at most ${length} items`),
      ]),
    length: (length: number, message?: string) =>
      createValidator<T[]>([
        ...validators,
        (v) =>
          (v as T[]).length === length
            ? undefined
            : (message ?? `Must have exactly ${length} items`),
      ]),
    nonempty: (message?: string) =>
      createValidator<T[]>([
        ...validators,
        (v) => ((v as T[]).length > 0 ? undefined : (message ?? "Array cannot be empty")),
      ]),
  };
}

/**
 * Object validator
 */
export function object<T extends Record<string, SchemaValidator<unknown>>>(
  shape: T
): SchemaValidator<{ [K in keyof T]: T[K] extends SchemaValidator<infer U> ? U : never }> {
  type ResultType = { [K in keyof T]: T[K] extends SchemaValidator<infer U> ? U : never };

  const validators: ValidatorFn<unknown>[] = [
    (value) => {
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return "Expected object";
      }

      const obj = value as Record<string, unknown>;
      const errors: string[] = [];

      for (const [key, schema] of Object.entries(shape)) {
        const result = schema.validate(obj[key]);
        if (!result.valid) {
          errors.push(`${key}: ${result.errors.join(", ")}`);
        }
      }

      return errors.length > 0 ? errors.join("; ") : undefined;
    },
  ];

  return createValidator<ResultType>(validators);
}

/**
 * Enum validator
 */
export function enumType<T extends string | number>(
  values: readonly T[],
  message?: string
): SchemaValidator<T> {
  return createValidator<T>([
    (value) =>
      values.includes(value as T) ? undefined : (message ?? `Must be one of: ${values.join(", ")}`),
  ]);
}

/**
 * Literal validator
 */
export function literal<T extends string | number | boolean>(value: T): SchemaValidator<T> {
  return createValidator<T>([(v) => (v === value ? undefined : `Expected "${value}"`)]);
}

/**
 * Union validator
 */
export function union<T extends SchemaValidator<unknown>[]>(
  schemas: T
): SchemaValidator<T[number] extends SchemaValidator<infer U> ? U : never> {
  type ResultType = T[number] extends SchemaValidator<infer U> ? U : never;

  return createValidator<ResultType>([
    (value) => {
      for (const schema of schemas) {
        const result = schema.validate(value);
        if (result.valid) {
          return undefined;
        }
      }
      return "Value does not match any of the expected types";
    },
  ]);
}

/**
 * Any validator (passes all values)
 */
export function any(): SchemaValidator<unknown> {
  return createValidator<unknown>([]);
}

/**
 * Unknown validator (same as any but more type-safe)
 */
export function unknown(): SchemaValidator<unknown> {
  return createValidator<unknown>([]);
}

/**
 * Custom validator
 */
export function custom<T>(
  validateFn: (value: unknown) => boolean,
  message: string
): SchemaValidator<T> {
  return createValidator<T>([(value) => (validateFn(value) ? undefined : message)]);
}

/**
 * Common validation patterns
 */
export const patterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[\d\s-()]{10,}$/,
  url: /^https?:\/\/.+/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  alpha: /^[a-zA-Z]+$/,
  numeric: /^[0-9]+$/,
  slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  hexColor: /^#([0-9a-f]{3}|[0-9a-f]{6})$/i,
  ipv4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  creditCard:
    /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})$/,
  password: {
    weak: /^.{6,}$/,
    medium: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
    strong: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{12,}$/,
  },
};

/**
 * Pre-built validators for common use cases
 */
export const validators = {
  required:
    (message = "This field is required") =>
    (value: unknown) =>
      value !== undefined && value !== null && value !== "" ? undefined : message,

  email:
    (message = "Invalid email address") =>
    (value: string) =>
      patterns.email.test(value) ? undefined : message,

  phone:
    (message = "Invalid phone number") =>
    (value: string) =>
      patterns.phone.test(value) ? undefined : message,

  url:
    (message = "Invalid URL") =>
    (value: string) =>
      patterns.url.test(value) ? undefined : message,

  minLength: (min: number, message?: string) => (value: string) =>
    value.length >= min ? undefined : (message ?? `Must be at least ${min} characters`),

  maxLength: (max: number, message?: string) => (value: string) =>
    value.length <= max ? undefined : (message ?? `Must be at most ${max} characters`),

  min: (min: number, message?: string) => (value: number) =>
    value >= min ? undefined : (message ?? `Must be at least ${min}`),

  max: (max: number, message?: string) => (value: number) =>
    value <= max ? undefined : (message ?? `Must be at most ${max}`),

  pattern:
    (regex: RegExp, message = "Invalid format") =>
    (value: string) =>
      regex.test(value) ? undefined : message,

  matches: (fieldName: string, getValue: () => unknown, message?: string) => (value: unknown) =>
    value === getValue() ? undefined : (message ?? `Must match ${fieldName}`),

  passwordStrength: (level: "weak" | "medium" | "strong", message?: string) => (value: string) =>
    patterns.password[level].test(value)
      ? undefined
      : (message ?? `Password does not meet ${level} strength requirements`),
};

/**
 * Combine multiple validators
 */
export function compose<T>(...fns: ValidatorFn<T>[]): ValidatorFn<T> {
  return (value: T) => {
    for (const fn of fns) {
      const error = fn(value);
      if (error) return error;
    }
    return undefined;
  };
}

/**
 * Validate an object against a schema
 */
export function validateObject<T extends Record<string, unknown>>(
  data: T,
  rules: Partial<Record<keyof T, ValidatorFn<unknown> | ValidatorFn<unknown>[]>>
): Partial<Record<keyof T, string>> {
  const errors: Partial<Record<keyof T, string>> = {};

  for (const [field, fieldRules] of Object.entries(rules)) {
    const value = data[field as keyof T];
    const rulesArray = Array.isArray(fieldRules) ? fieldRules : [fieldRules];

    for (const rule of rulesArray as ValidatorFn<unknown>[]) {
      const error = rule(value);
      if (error) {
        errors[field as keyof T] = error;
        break;
      }
    }
  }

  return errors;
}
