import { type InputHTMLAttributes, type TextareaHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id ?? `input-${Math.random().toString(36).slice(2, 8)}`;
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full h-10 px-3.5 rounded-xl border bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 ${
            error ? 'border-error-500' : 'border-gray-200 dark:border-gray-700'
          } ${className ?? ''}`}
          {...props}
        />
        {error && <p className="text-sm text-error-600 dark:text-error-500">{error}</p>}
      </div>
    );
  },
);
Input.displayName = 'Input';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const textareaId = id ?? `textarea-${Math.random().toString(36).slice(2, 8)}`;
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={`w-full px-3.5 py-2.5 rounded-xl border bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 resize-y ${
            error ? 'border-error-500' : 'border-gray-200 dark:border-gray-700'
          } ${className ?? ''}`}
          {...props}
        />
        {error && <p className="text-sm text-error-600 dark:text-error-500">{error}</p>}
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';
