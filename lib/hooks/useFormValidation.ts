import { useState, useCallback, useMemo } from "react";

import { z } from "zod";

interface ValidationError {
  field: string;
  message: string;
}

interface UseFormValidationOptions<T> {
  schema: z.ZodSchema<T>;
  onSubmit?: (data: T) => void | Promise<void>;
}

interface UseFormValidationReturn<T> {
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isValid: boolean;
  isSubmitting: boolean;
  validate: (field: string, value: unknown) => string | null;
  validateAll: (data: Partial<T>) => ValidationError[];
  setFieldTouched: (field: string) => void;
  clearErrors: () => void;
  clearFieldError: (field: string) => void;
  handleSubmit: (data: Partial<T>) => Promise<boolean>;
  getFieldProps: (field: string) => {
    onBlur: () => void;
    "aria-invalid": boolean;
    "aria-describedby": string | undefined;
  };
}

export function useFormValidation<T>({
  schema,
  onSubmit,
}: UseFormValidationOptions<T>): UseFormValidationReturn<T> {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  const validate = useCallback(
    (field: string, value: unknown): string | null => {
      try {
        // Try to parse the full data with just this field
        // This works with any Zod schema type
        const partialData = { [field]: value };
        const result = schema.safeParse(partialData);

        if (!result.success) {
          // Find errors for this specific field
          const fieldError = result.error.errors.find((e) => e.path[0] === field);
          if (fieldError) {
            setErrors((prev) => ({ ...prev, [field]: fieldError.message }));
            return fieldError.message;
          }
        }

        // Clear error if valid
        setErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });

        return null;
      } catch (error) {
        if (error instanceof z.ZodError) {
          const message = error.errors[0]?.message || "Invalid value";
          setErrors((prev) => ({ ...prev, [field]: message }));
          return message;
        }
        return null;
      }
    },
    [schema]
  );

  const validateAll = useCallback(
    (data: Partial<T>): ValidationError[] => {
      try {
        schema.parse(data);
        setErrors({});
        return [];
      } catch (error) {
        if (error instanceof z.ZodError) {
          const validationErrors: ValidationError[] = error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          }));

          const errorMap: Record<string, string> = {};
          validationErrors.forEach((e) => {
            errorMap[e.field] = e.message;
          });

          setErrors(errorMap);
          return validationErrors;
        }
        return [];
      }
    },
    [schema]
  );

  const setFieldTouched = useCallback((field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const handleSubmit = useCallback(
    async (data: Partial<T>): Promise<boolean> => {
      // Mark all fields as touched
      const allFields = Object.keys(data);
      const touchedAll = allFields.reduce((acc, field) => ({ ...acc, [field]: true }), {});
      setTouched(touchedAll);

      // Validate all fields
      const validationErrors = validateAll(data);

      if (validationErrors.length > 0) {
        return false;
      }

      if (onSubmit) {
        setIsSubmitting(true);
        try {
          await onSubmit(data as T);
          return true;
        } finally {
          setIsSubmitting(false);
        }
      }

      return true;
    },
    [validateAll, onSubmit]
  );

  const getFieldProps = useCallback(
    (field: string) => ({
      onBlur: () => setFieldTouched(field),
      "aria-invalid": touched[field] && !!errors[field],
      "aria-describedby": errors[field] ? `${field}-error` : undefined,
    }),
    [touched, errors, setFieldTouched]
  );

  return {
    errors,
    touched,
    isValid,
    isSubmitting,
    validate,
    validateAll,
    setFieldTouched,
    clearErrors,
    clearFieldError,
    handleSubmit,
    getFieldProps,
  };
}

// Common validation schemas
export const commonSchemas = {
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  name: z.string().min(1, "Name is required").max(50, "Name must be less than 50 characters"),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, "Please enter a valid phone number")
    .optional()
    .or(z.literal("")),
  url: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  positiveNumber: z.number().positive("Must be a positive number"),
  nonNegativeNumber: z.number().min(0, "Cannot be negative"),
  requiredString: z.string().min(1, "This field is required"),
};
