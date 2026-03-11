// Global Error Handler
// Provides centralized error handling for the application

export class AppError extends Error {
  public readonly code: string;
  public readonly isUserError: boolean;
  public readonly details?: any;

  constructor(message: string, code: string, isUserError: boolean = false, details?: any) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.isUserError = isUserError;
    this.details = details;
  }
}

export interface ErrorResponse {
  message: string;
  code: string;
  details?: any;
  timestamp: Date;
}

export interface ErrorHandler {
  handleError: (error: Error | AppError, context?: string) => void;
  handleAsyncError: (promise: Promise<any>, context?: string) => Promise<T>;
  getErrorMessages: () => ErrorResponse[];
  clearErrors: () => void;
}

class ErrorHandlerService implements ErrorHandler {
  private errors: ErrorResponse[] = [];

  handleError(error: Error | AppError, context?: string): void {
    const timestamp = new Date();
    let errorResponse: ErrorResponse;

    if (error instanceof AppError) {
      errorResponse = {
        message: error.message,
        code: error.code,
        details: error.details,
        timestamp,
      };
    } else {
      errorResponse = {
        message: error.message || 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR',
        details: error.stack,
        timestamp,
      };
    }

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`[${context || 'App'}] Error:`, errorResponse);
    }

    // Add error to error list
    this.errors.unshift(errorResponse);

    // Keep only last 50 errors
    if (this.errors.length > 50) {
      this.errors = this.errors.slice(0, 50);
    }

    // Notify user (could integrate with toast/snackbar)
    if (!error.isUserError) {
      this.notifyUser(errorResponse);
    }
  }

  async handleAsyncError<T>(promise: Promise<any>, context?: string): Promise<T> {
    try {
      return await promise;
    } catch (error) {
      this.handleError(error as Error, context);
      throw error; // Re-throw to allow calling code to handle it
    }
  }

  getErrorMessages(): ErrorResponse[] {
    return [...this.errors];
  }

  clearErrors(): void {
    this.errors = [];
  }

  private notifyUser(error: ErrorResponse): void {
    // Dispatch custom event for UI to handle
    const event = new CustomEvent('app-error', {
      detail: {
        message: error.message,
        code: error.code,
        details: error.details,
      },
    });

    window.dispatchEvent(event);

    // Also trigger console notification
    if (Notification.permission === 'granted') {
      new Notification('Error', {
        body: error.message,
        icon: '/error-icon.png',
      });
    }
  }

  // Common error types
  public static commonErrors = {
    NETWORK_ERROR: new AppError('Network error occurred', 'NETWORK_ERROR'),
    VALIDATION_ERROR: new AppError('Invalid input data', 'VALIDATION_ERROR', true),
    AUTH_ERROR: new AppError('Authentication failed', 'AUTH_ERROR', true),
    NOT_FOUND: new AppError('Resource not found', 'NOT_FOUND'),
    UNAUTHORIZED: new AppError('Unauthorized access', 'UNAUTHORIZED', true),
    FORBIDDEN: new AppError('Access forbidden', 'FORBIDDEN', true),
    TIMEOUT: new AppError('Request timed out', 'TIMEOUT'),
    SERVER_ERROR: new AppError('Server error occurred', 'SERVER_ERROR'),
    UNKNOWN: new AppError('Unknown error occurred', 'UNKNOWN_ERROR'),
  };
}

// Create singleton instance
export const errorHandler = new ErrorHandlerService();

// Export convenience functions
export const handleError = (error: Error | AppError, context?: string) => {
  errorHandler.handleError(error, context);
};

export const handleAsyncError = async <T>(promise: Promise<any>, context?: string): Promise<T> => {
  return await errorHandler.handleAsyncError(promise, context);
};

export const getErrors = (): ErrorResponse[] => {
  return errorHandler.getErrorMessages();
};

export const clearErrors = (): void => {
  errorHandler.clearErrors();
};

export const createError = (message: string, code: string, isUserError = false, details?: any) => {
  return new AppError(message, code, isUserError, details);
};

export const {
  NETWORK_ERROR,
  VALIDATION_ERROR,
  AUTH_ERROR,
  NOT_FOUND,
  UNAUTHORIZED,
  FORBIDDEN,
  TIMEOUT,
  SERVER_ERROR,
  UNKNOWN,
} = ErrorHandlerService.commonErrors;

export default errorHandler;
