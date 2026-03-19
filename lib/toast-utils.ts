import { toast } from 'sonner';

export type ToastType = 'success' | 'error' | 'loading' | 'info';

interface ToastOptions {
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Unified toast notification system with consistent styling and messaging
 */
export const showToast = {
  success: (message: string, options?: ToastOptions) => {
    return toast.success(message, {
      duration: options?.duration ?? 3000,
      position: 'top-center',
      richColors: true,
      action: options?.action,
    });
  },

  error: (message: string, options?: ToastOptions) => {
    return toast.error(message, {
      duration: options?.duration ?? 4000,
      position: 'top-center',
      richColors: true,
      action: options?.action,
    });
  },

  loading: (message: string) => {
    return toast.loading(message, {
      position: 'top-center',
    });
  },

  info: (message: string, options?: ToastOptions) => {
    return toast.info(message, {
      duration: options?.duration ?? 3000,
      position: 'top-center',
      richColors: true,
      action: options?.action,
    });
  },

  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    },
  ) => {
    return toast.promise(promise, messages);
  },

  dismiss: (toastId?: string | number) => {
    toast.dismiss(toastId);
  },
};

/**
 * Handle API response with appropriate toast notification
 */
export const handleApiResponse = (
  result: { success: boolean; message?: string },
  successMessage?: string,
  errorMessage?: string,
) => {
  if (result.success) {
    showToast.success(successMessage || result.message || 'Success!');
  } else {
    showToast.error(
      errorMessage || result.message || 'Something went wrong. Please try again.',
    );
  }
};

/**
 * Format error messages for better UX
 */
export const formatErrorMessage = (error: unknown): string => {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred. Please try again.';
};

/**
 * Validate form field and show inline error
 */
export const validateField = (
  value: string,
  fieldName: string,
  rules: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: string) => string | null;
  },
): string | null => {
  if (rules.required && !value.trim()) {
    return `${fieldName} is required`;
  }

  if (rules.minLength && value.length < rules.minLength) {
    return `${fieldName} must be at least ${rules.minLength} characters`;
  }

  if (rules.maxLength && value.length > rules.maxLength) {
    return `${fieldName} must not exceed ${rules.maxLength} characters`;
  }

  if (rules.pattern && !rules.pattern.test(value)) {
    return `${fieldName} format is invalid`;
  }

  if (rules.custom) {
    return rules.custom(value);
  }

  return null;
};
