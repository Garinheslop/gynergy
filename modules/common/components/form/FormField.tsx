"use client";

import { ReactNode } from "react";

import { cn } from "@lib/utils/style";

interface FormFieldProps {
  name: string;
  label?: string;
  error?: string;
  touched?: boolean;
  required?: boolean;
  hint?: string;
  children: ReactNode;
  className?: string;
}

export function FormField({
  name,
  label,
  error,
  touched,
  required,
  hint,
  children,
  className,
}: FormFieldProps) {
  const showError = touched && error;

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label htmlFor={name} className="text-grey-300 block text-sm font-medium">
          {label}
          {required && <span className="text-danger ml-1">*</span>}
        </label>
      )}
      {children}
      {showError ? (
        <p
          id={`${name}-error`}
          role="alert"
          className="text-danger flex items-center gap-1.5 text-sm"
        >
          <i className="gng-alert-circle text-xs" />
          {error}
        </p>
      ) : hint ? (
        <p className="text-grey-500 text-xs">{hint}</p>
      ) : null}
    </div>
  );
}

// Input component with consistent styling
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconClick?: () => void;
}

export function Input({
  hasError,
  leftIcon,
  rightIcon,
  onRightIconClick,
  className,
  ...props
}: InputProps) {
  return (
    <div className="relative">
      {leftIcon && (
        <i className={cn("text-grey-500 absolute top-1/2 left-3 -translate-y-1/2", leftIcon)} />
      )}
      <input
        className={cn(
          "bg-grey-900 placeholder-grey-500 w-full rounded-lg border px-3 py-2.5 text-sm text-white transition-colors",
          "focus:ring-2 focus:outline-none",
          hasError
            ? "border-danger focus:border-danger focus:ring-danger/30"
            : "border-grey-700 focus:border-action-500 focus:ring-action-500/30",
          leftIcon && "pl-10",
          rightIcon && "pr-10",
          className
        )}
        {...props}
      />
      {rightIcon && (
        <button
          type="button"
          onClick={onRightIconClick}
          className="text-grey-500 hover:text-grey-300 absolute top-1/2 right-3 -translate-y-1/2"
        >
          <i className={rightIcon} />
        </button>
      )}
    </div>
  );
}

// Textarea component
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export function Textarea({ hasError, className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "bg-grey-900 placeholder-grey-500 w-full rounded-lg border px-3 py-2.5 text-sm text-white transition-colors",
        "resize-none focus:ring-2 focus:outline-none",
        hasError
          ? "border-danger focus:border-danger focus:ring-danger/30"
          : "border-grey-700 focus:border-action-500 focus:ring-action-500/30",
        className
      )}
      {...props}
    />
  );
}

// Select component
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export function Select({ hasError, options, placeholder, className, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        "bg-grey-900 w-full rounded-lg border px-3 py-2.5 text-sm text-white transition-colors",
        "cursor-pointer appearance-none focus:ring-2 focus:outline-none",
        hasError
          ? "border-danger focus:border-danger focus:ring-danger/30"
          : "border-grey-700 focus:border-action-500 focus:ring-action-500/30",
        className
      )}
      {...props}
    >
      {placeholder && (
        <option value="" className="text-grey-500">
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

// Checkbox component
interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  hasError?: boolean;
}

export function Checkbox({ label, hasError, className, ...props }: CheckboxProps) {
  return (
    <label className={cn("flex cursor-pointer items-center gap-2.5", className)}>
      <input
        type="checkbox"
        className={cn(
          "bg-grey-900 text-action-500 h-4 w-4 rounded border transition-colors",
          "focus:ring-offset-grey-900 focus:ring-2 focus:ring-offset-0",
          hasError
            ? "border-danger focus:ring-danger/30"
            : "border-grey-700 focus:ring-action-500/30"
        )}
        {...props}
      />
      <span className="text-grey-300 text-sm">{label}</span>
    </label>
  );
}

// Radio group component
interface RadioGroupProps {
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string; description?: string }>;
  hasError?: boolean;
  className?: string;
}

export function RadioGroup({
  name,
  value,
  onChange,
  options,
  hasError,
  className,
}: RadioGroupProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {options.map((option) => (
        <label
          key={option.value}
          className={cn(
            "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
            value === option.value
              ? "border-action-500 bg-action-900/20"
              : hasError
                ? "border-danger bg-grey-900"
                : "border-grey-700 bg-grey-900 hover:border-grey-600"
          )}
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={(e) => onChange(e.target.value)}
            className="border-grey-600 text-action-500 focus:ring-action-500/30 mt-0.5 h-4 w-4"
          />
          <div>
            <span className="text-sm font-medium text-white">{option.label}</span>
            {option.description && <p className="text-grey-400 text-xs">{option.description}</p>}
          </div>
        </label>
      ))}
    </div>
  );
}
