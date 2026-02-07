"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from "react";

/**
 * Form State Management Hook
 *
 * Provides comprehensive form handling with validation, touched states,
 * dirty tracking, and submission management.
 */

/**
 * Field validation result
 */
export interface FieldError {
  message: string;
  type?: string;
}

/**
 * Validation rule types
 */
export type ValidationRule<T> =
  | ((
      value: T,
      values: Record<string, unknown>
    ) => string | undefined | Promise<string | undefined>)
  | {
      validate: (
        value: T,
        values: Record<string, unknown>
      ) => string | undefined | Promise<string | undefined>;
      message?: string;
    };

/**
 * Form field configuration
 */
export interface FieldConfig<T> {
  defaultValue?: T;
  validate?: ValidationRule<T> | ValidationRule<T>[];
  transform?: (value: T) => T;
  deps?: string[];
}

/**
 * Form configuration
 */
export interface FormConfig<T extends Record<string, unknown>> {
  defaultValues?: Partial<T>;
  mode?: "onChange" | "onBlur" | "onSubmit" | "all";
  reValidateMode?: "onChange" | "onBlur" | "onSubmit";
  shouldUnregister?: boolean;
  delayError?: number;
}

/**
 * Form state
 */
export interface FormState<T extends Record<string, unknown>> {
  values: T;
  errors: Partial<Record<keyof T, FieldError>>;
  touched: Partial<Record<keyof T, boolean>>;
  dirty: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
  isSubmitted: boolean;
  isValidating: boolean;
  submitCount: number;
}

/**
 * Field registration result
 */
export interface FieldRegistration {
  name: string;
  value: unknown;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> | unknown
  ) => void;
  onBlur: (e: React.FocusEvent) => void;
  ref: React.RefCallback<HTMLElement>;
}

/**
 * Field methods for manual control
 */
export interface FieldMethods<T> {
  setValue: (
    value: T,
    options?: { shouldValidate?: boolean; shouldTouch?: boolean; shouldDirty?: boolean }
  ) => void;
  getValue: () => T;
  setError: (error: FieldError | undefined) => void;
  getError: () => FieldError | undefined;
  setTouched: (touched: boolean) => void;
  isTouched: () => boolean;
  isDirty: () => boolean;
  reset: () => void;
}

/**
 * Form return type
 */
export interface UseFormReturn<T extends Record<string, unknown>> {
  // State
  formState: FormState<T>;
  values: T;
  errors: Partial<Record<keyof T, FieldError>>;

  // Registration
  register: <K extends keyof T>(name: K, config?: FieldConfig<T[K]>) => FieldRegistration;

  // Actions
  handleSubmit: (
    onSubmit: (values: T) => void | Promise<void>,
    onError?: (errors: Partial<Record<keyof T, FieldError>>) => void
  ) => (e?: React.FormEvent) => void;
  reset: (values?: Partial<T>) => void;
  setValue: <K extends keyof T>(
    name: K,
    value: T[K],
    options?: { shouldValidate?: boolean; shouldTouch?: boolean; shouldDirty?: boolean }
  ) => void;
  setValues: (values: Partial<T>, options?: { shouldValidate?: boolean }) => void;
  setError: <K extends keyof T>(name: K, error: FieldError) => void;
  clearErrors: (name?: keyof T | (keyof T)[]) => void;
  trigger: (name?: keyof T | (keyof T)[]) => Promise<boolean>;

  // Field access
  getValues: () => T;
  getValue: <K extends keyof T>(name: K) => T[K];
  getFieldState: <K extends keyof T>(
    name: K
  ) => { error?: FieldError; isTouched: boolean; isDirty: boolean };

  // Utilities
  watch: <K extends keyof T>(name: K) => T[K];
  resetField: <K extends keyof T>(name: K, options?: { defaultValue?: T[K] }) => void;
  setFocus: <K extends keyof T>(name: K) => void;
}

/**
 * Main form hook
 */
export function useForm<T extends Record<string, unknown>>(
  config: FormConfig<T> = {}
): UseFormReturn<T> {
  const {
    defaultValues = {} as Partial<T>,
    mode = "onSubmit",
    reValidateMode = "onChange",
  } = config;

  // Internal refs
  const fieldRefs = useRef<Map<keyof T, HTMLElement>>(new Map());
  const fieldConfigs = useRef<Map<keyof T, FieldConfig<unknown>>>(new Map());
  const defaultValuesRef = useRef<Partial<T>>(defaultValues);

  // State
  const [values, setValuesState] = useState<T>({ ...defaultValues } as T);
  const [errors, setErrors] = useState<Partial<Record<keyof T, FieldError>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [dirty, setDirty] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);

  // Computed state
  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);
  const isDirty = useMemo(() => Object.values(dirty).some(Boolean), [dirty]);

  // Validate a single field
  const validateField = useCallback(
    async <K extends keyof T>(name: K, value: T[K]): Promise<FieldError | undefined> => {
      const fieldConfig = fieldConfigs.current.get(name);
      if (!fieldConfig?.validate) return undefined;

      const rules = Array.isArray(fieldConfig.validate)
        ? fieldConfig.validate
        : [fieldConfig.validate];

      for (const rule of rules) {
        const validateFn = typeof rule === "function" ? rule : rule.validate;
        const defaultMessage = typeof rule === "object" ? rule.message : undefined;

        try {
          const errorMessage = await validateFn(value as never, values);
          if (errorMessage) {
            return { message: defaultMessage || errorMessage, type: "validation" };
          }
        } catch (err) {
          return {
            message: err instanceof Error ? err.message : "Validation error",
            type: "exception",
          };
        }
      }

      return undefined;
    },
    [values]
  );

  // Validate multiple fields
  const validateFields = useCallback(
    async (names: (keyof T)[]): Promise<Partial<Record<keyof T, FieldError>>> => {
      setIsValidating(true);
      const newErrors: Partial<Record<keyof T, FieldError>> = {};

      await Promise.all(
        names.map(async (name) => {
          const error = await validateField(name, values[name]);
          if (error) {
            newErrors[name] = error;
          }
        })
      );

      setIsValidating(false);
      return newErrors;
    },
    [validateField, values]
  );

  // Set a single value
  const setValue = useCallback(
    <K extends keyof T>(
      name: K,
      value: T[K],
      options: { shouldValidate?: boolean; shouldTouch?: boolean; shouldDirty?: boolean } = {}
    ) => {
      const { shouldValidate = false, shouldTouch = false, shouldDirty = true } = options;
      const fieldConfig = fieldConfigs.current.get(name);
      const transformedValue = fieldConfig?.transform
        ? (fieldConfig.transform(value as never) as T[K])
        : value;

      setValuesState((prev) => ({ ...prev, [name]: transformedValue }));

      if (shouldDirty) {
        const defaultValue = defaultValuesRef.current[name];
        setDirty((prev) => ({ ...prev, [name]: transformedValue !== defaultValue }));
      }

      if (shouldTouch) {
        setTouched((prev) => ({ ...prev, [name]: true }));
      }

      if (shouldValidate || (isSubmitted && reValidateMode === "onChange")) {
        validateField(name, transformedValue).then((error) => {
          setErrors((prev) => {
            if (error) {
              return { ...prev, [name]: error };
            } else {
              const { [name]: _removed, ...rest } = prev;
              return rest as Partial<Record<keyof T, FieldError>>;
            }
          });
        });
      }
    },
    [isSubmitted, reValidateMode, validateField]
  );

  // Set multiple values
  const setValues = useCallback(
    (newValues: Partial<T>, options: { shouldValidate?: boolean } = {}) => {
      Object.entries(newValues).forEach(([name, value]) => {
        setValue(name as keyof T, value as T[keyof T], options);
      });
    },
    [setValue]
  );

  // Set error for a field
  const setError = useCallback(<K extends keyof T>(name: K, error: FieldError) => {
    setErrors((prev) => ({ ...prev, [name]: error }));
  }, []);

  // Clear errors
  const clearErrors = useCallback((name?: keyof T | (keyof T)[]) => {
    if (!name) {
      setErrors({});
    } else if (Array.isArray(name)) {
      setErrors((prev) => {
        const next = { ...prev };
        name.forEach((n) => delete next[n]);
        return next;
      });
    } else {
      setErrors((prev) => {
        const { [name]: _removed, ...rest } = prev;
        return rest as Partial<Record<keyof T, FieldError>>;
      });
    }
  }, []);

  // Trigger validation
  const trigger = useCallback(
    async (name?: keyof T | (keyof T)[]): Promise<boolean> => {
      const fieldsToValidate = name
        ? Array.isArray(name)
          ? name
          : [name]
        : (Array.from(fieldConfigs.current.keys()) as (keyof T)[]);

      const newErrors = await validateFields(fieldsToValidate);

      setErrors((prev) => {
        const updated = { ...prev };
        fieldsToValidate.forEach((field) => {
          if (newErrors[field]) {
            updated[field] = newErrors[field];
          } else {
            delete updated[field];
          }
        });
        return updated;
      });

      return Object.keys(newErrors).length === 0;
    },
    [validateFields]
  );

  // Get all values
  const getValues = useCallback(() => values, [values]);

  // Get single value
  const getValue = useCallback(<K extends keyof T>(name: K): T[K] => values[name], [values]);

  // Get field state
  const getFieldState = useCallback(
    <K extends keyof T>(name: K) => ({
      error: errors[name],
      isTouched: touched[name] ?? false,
      isDirty: dirty[name] ?? false,
    }),
    [errors, touched, dirty]
  );

  // Watch a field (just returns value, but triggers re-render on change)
  const watch = useCallback(<K extends keyof T>(name: K): T[K] => values[name], [values]);

  // Reset single field
  const resetField = useCallback(
    <K extends keyof T>(name: K, options: { defaultValue?: T[K] } = {}) => {
      const defaultValue = options.defaultValue ?? defaultValuesRef.current[name];
      setValuesState((prev) => ({ ...prev, [name]: defaultValue }));
      setErrors((prev) => {
        const { [name]: _removed, ...rest } = prev;
        return rest as Partial<Record<keyof T, FieldError>>;
      });
      setTouched((prev) => ({ ...prev, [name]: false }));
      setDirty((prev) => ({ ...prev, [name]: false }));
    },
    []
  );

  // Reset entire form
  const reset = useCallback((newValues?: Partial<T>) => {
    const resetValues = { ...defaultValuesRef.current, ...newValues } as T;
    defaultValuesRef.current = resetValues;
    setValuesState(resetValues);
    setErrors({});
    setTouched({});
    setDirty({});
    setIsSubmitted(false);
  }, []);

  // Set focus on a field
  const setFocus = useCallback(<K extends keyof T>(name: K) => {
    const element = fieldRefs.current.get(name);
    if (element && "focus" in element) {
      (element as HTMLElement & { focus: () => void }).focus();
    }
  }, []);

  // Register a field
  const register = useCallback(
    <K extends keyof T>(name: K, fieldConfig?: FieldConfig<T[K]>): FieldRegistration => {
      // Store field config
      if (fieldConfig) {
        fieldConfigs.current.set(name, fieldConfig as FieldConfig<unknown>);
      }

      // Set default value if provided and not already set
      if (fieldConfig?.defaultValue !== undefined && values[name] === undefined) {
        setValuesState((prev) => ({ ...prev, [name]: fieldConfig.defaultValue }));
      }

      return {
        name: name as string,
        value: values[name] ?? "",
        onChange: (
          e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> | unknown
        ) => {
          let value: T[K];

          if (e && typeof e === "object" && "target" in e) {
            const target = (e as React.ChangeEvent<HTMLInputElement>).target;
            if (target.type === "checkbox") {
              value = target.checked as unknown as T[K];
            } else if (target.type === "number") {
              value = (target.value === "" ? "" : Number(target.value)) as unknown as T[K];
            } else {
              value = target.value as unknown as T[K];
            }
          } else {
            value = e as T[K];
          }

          setValue(name, value, {
            shouldValidate: mode === "onChange" || mode === "all",
            shouldDirty: true,
          });
        },
        onBlur: () => {
          setTouched((prev) => ({ ...prev, [name]: true }));

          if (mode === "onBlur" || mode === "all" || (isSubmitted && reValidateMode === "onBlur")) {
            validateField(name, values[name]).then((error) => {
              setErrors((prev) => {
                if (error) {
                  return { ...prev, [name]: error };
                } else {
                  const { [name]: _removed, ...rest } = prev;
                  return rest as Partial<Record<keyof T, FieldError>>;
                }
              });
            });
          }
        },
        ref: (element: HTMLElement | null) => {
          if (element) {
            fieldRefs.current.set(name, element);
          } else {
            fieldRefs.current.delete(name);
          }
        },
      };
    },
    [values, mode, isSubmitted, reValidateMode, setValue, validateField]
  );

  // Handle submit
  const handleSubmit = useCallback(
    (
      onSubmit: (values: T) => void | Promise<void>,
      onError?: (errors: Partial<Record<keyof T, FieldError>>) => void
    ) => {
      return async (e?: React.FormEvent) => {
        e?.preventDefault();

        setIsSubmitting(true);
        setSubmitCount((prev) => prev + 1);

        // Validate all fields
        const allFields = Array.from(fieldConfigs.current.keys()) as (keyof T)[];
        const validationErrors = await validateFields(allFields);

        setErrors(validationErrors);
        setIsSubmitted(true);

        if (Object.keys(validationErrors).length > 0) {
          onError?.(validationErrors);
          setIsSubmitting(false);

          // Focus first error field
          const firstErrorField = allFields.find((field) => validationErrors[field]);
          if (firstErrorField) {
            setFocus(firstErrorField);
          }

          return;
        }

        try {
          await onSubmit(values);
        } finally {
          setIsSubmitting(false);
        }
      };
    },
    [values, validateFields, setFocus]
  );

  // Form state object
  const formState: FormState<T> = useMemo(
    () => ({
      values,
      errors,
      touched,
      dirty,
      isValid,
      isDirty,
      isSubmitting,
      isSubmitted,
      isValidating,
      submitCount,
    }),
    [
      values,
      errors,
      touched,
      dirty,
      isValid,
      isDirty,
      isSubmitting,
      isSubmitted,
      isValidating,
      submitCount,
    ]
  );

  return {
    formState,
    values,
    errors,
    register,
    handleSubmit,
    reset,
    setValue,
    setValues,
    setError,
    clearErrors,
    trigger,
    getValues,
    getValue,
    getFieldState,
    watch,
    resetField,
    setFocus,
  };
}

/**
 * Simple controlled input hook
 */
export function useInput<T = string>(
  initialValue: T,
  options: {
    validate?: (value: T) => string | undefined;
    transform?: (value: T) => T;
  } = {}
): {
  value: T;
  error: string | undefined;
  touched: boolean;
  isDirty: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | T) => void;
  onBlur: () => void;
  reset: () => void;
  setValue: (value: T) => void;
  setError: (error: string | undefined) => void;
} {
  const { validate, transform } = options;
  const [value, setValueState] = useState<T>(initialValue);
  const [error, setError] = useState<string | undefined>();
  const [touched, setTouched] = useState(false);
  const initialValueRef = useRef(initialValue);

  const isDirty = value !== initialValueRef.current;

  const setValue = useCallback(
    (newValue: T) => {
      const transformedValue = transform ? transform(newValue) : newValue;
      setValueState(transformedValue);

      if (touched && validate) {
        setError(validate(transformedValue));
      }
    },
    [transform, touched, validate]
  );

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | T) => {
      let newValue: T;
      if (e && typeof e === "object" && "target" in e) {
        newValue = e.target.value as unknown as T;
      } else {
        newValue = e as T;
      }
      setValue(newValue);
    },
    [setValue]
  );

  const onBlur = useCallback(() => {
    setTouched(true);
    if (validate) {
      setError(validate(value));
    }
  }, [validate, value]);

  const reset = useCallback(() => {
    setValueState(initialValueRef.current);
    setError(undefined);
    setTouched(false);
  }, []);

  return {
    value,
    error,
    touched,
    isDirty,
    onChange,
    onBlur,
    reset,
    setValue,
    setError,
  };
}

/**
 * Field array hook for dynamic lists
 */
export function useFieldArray<T>(initialItems: T[] = []): {
  fields: Array<T & { id: string }>;
  append: (item: T) => void;
  prepend: (item: T) => void;
  insert: (index: number, item: T) => void;
  remove: (index: number) => void;
  swap: (indexA: number, indexB: number) => void;
  move: (from: number, to: number) => void;
  update: (index: number, item: T) => void;
  replace: (items: T[]) => void;
} {
  const idCounter = useRef(0);
  const generateId = () => `field_${idCounter.current++}`;

  const [fields, setFields] = useState<Array<T & { id: string }>>(() =>
    initialItems.map((item) => ({ ...item, id: generateId() }))
  );

  const append = useCallback((item: T) => {
    setFields((prev) => [...prev, { ...item, id: generateId() }]);
  }, []);

  const prepend = useCallback((item: T) => {
    setFields((prev) => [{ ...item, id: generateId() }, ...prev]);
  }, []);

  const insert = useCallback((index: number, item: T) => {
    setFields((prev) => {
      const next = [...prev];
      next.splice(index, 0, { ...item, id: generateId() });
      return next;
    });
  }, []);

  const remove = useCallback((index: number) => {
    setFields((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const swap = useCallback((indexA: number, indexB: number) => {
    setFields((prev) => {
      const next = [...prev];
      [next[indexA], next[indexB]] = [next[indexB], next[indexA]];
      return next;
    });
  }, []);

  const move = useCallback((from: number, to: number) => {
    setFields((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }, []);

  const update = useCallback((index: number, item: T) => {
    setFields((prev) => {
      const next = [...prev];
      next[index] = { ...item, id: next[index].id };
      return next;
    });
  }, []);

  const replace = useCallback((items: T[]) => {
    setFields(items.map((item) => ({ ...item, id: generateId() })));
  }, []);

  return {
    fields,
    append,
    prepend,
    insert,
    remove,
    swap,
    move,
    update,
    replace,
  };
}

/**
 * Watch for form value changes
 */
export function useWatch<T extends Record<string, unknown>, K extends keyof T>(
  form: UseFormReturn<T>,
  name: K
): T[K] {
  const [value, setValue] = useState(form.getValue(name));

  useEffect(() => {
    const interval = setInterval(() => {
      const currentValue = form.getValue(name);
      if (currentValue !== value) {
        setValue(currentValue);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [form, name, value]);

  return value;
}
