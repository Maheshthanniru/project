import toast from 'react-hot-toast';

export interface AppError {
  id: string;
  type: 'validation' | 'network' | 'database' | 'auth' | 'permission' | 'system';
  message: string;
  details?: string;
  timestamp: Date;
  userId?: string;
  context?: Record<string, any>;
  isHandled: boolean;
  retryCount: number;
  maxRetries: number;
}

export interface ErrorConfig {
  showToast?: boolean;
  logToConsole?: boolean;
  retryable?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  fallbackMessage?: string;
}

class ErrorHandler {
  private errors: AppError[] = [];
  private retryQueue: Map<string, () => Promise<any>> = new Map();

  constructor() {
    this.loadErrors();
  }

  private loadErrors() {
    const savedErrors = localStorage.getItem('thirumala_errors');
    if (savedErrors) {
      this.errors = JSON.parse(savedErrors).map((error: any) => ({
        ...error,
        timestamp: new Date(error.timestamp)
      }));
    }
  }

  private saveErrors() {
    localStorage.setItem('thirumala_errors', JSON.stringify(this.errors));
  }

  // Handle different types of errors
  handleError(
    error: Error | string | any,
    context?: Record<string, any>,
    config: ErrorConfig = {}
  ): AppError {
    const {
      showToast = true,
      logToConsole = true,
      retryable = false,
      maxRetries = 3,
      retryDelay = 1000,
      fallbackMessage = 'An unexpected error occurred'
    } = config;

    // Determine error type and message
    let errorType: AppError['type'] = 'system';
    let message = fallbackMessage;
    let details = '';

    if (typeof error === 'string') {
      message = error;
    } else if (error instanceof Error) {
      message = error.message;
      details = error.stack || '';
      
      // Determine error type based on message or name
      if (error.message.includes('validation') || error.message.includes('Validation')) {
        errorType = 'validation';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorType = 'network';
      } else if (error.message.includes('database') || error.message.includes('db')) {
        errorType = 'database';
      } else if (error.message.includes('auth') || error.message.includes('unauthorized')) {
        errorType = 'auth';
      } else if (error.message.includes('permission') || error.message.includes('forbidden')) {
        errorType = 'permission';
      }
    } else if (error && typeof error === 'object') {
      message = error.message || error.error || fallbackMessage;
      details = error.details || error.stack || '';
      errorType = error.type || 'system';
    }

    // Create error object
    const appError: AppError = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: errorType,
      message,
      details,
      timestamp: new Date(),
      context,
      isHandled: false,
      retryCount: 0,
      maxRetries: retryable ? maxRetries : 0
    };

    // Add to errors list
    this.errors.push(appError);
    this.saveErrors();

    // Log to console if enabled
    if (logToConsole) {
      console.error('Application Error:', {
        ...appError,
        originalError: error
      });
    }

    // Show toast if enabled
    if (showToast) {
      this.showErrorToast(appError);
    }

    return appError;
  }

  // Show user-friendly error toast
  private showErrorToast(error: AppError): void {
    const toastMessage = this.getUserFriendlyMessage(error);
    const toastOptions = this.getToastOptions(error);

    toast.error(toastMessage, toastOptions);
  }

  // Get user-friendly error message
  private getUserFriendlyMessage(error: AppError): string {
    switch (error.type) {
      case 'validation':
        return `Please check your input: ${error.message}`;
      case 'network':
        return 'Connection error. Please check your internet connection and try again.';
      case 'database':
        return 'Data error. Please try again or contact support if the problem persists.';
      case 'auth':
        return 'Authentication error. Please log in again.';
      case 'permission':
        return 'You don\'t have permission to perform this action.';
      case 'system':
      default:
        return error.message || 'An unexpected error occurred. Please try again.';
    }
  }

  // Get toast options based on error type
  private getToastOptions(error: AppError): any {
    const baseOptions = {
      duration: 5000,
      position: 'top-right' as const
    };

    switch (error.type) {
      case 'validation':
        return { ...baseOptions, duration: 4000 };
      case 'network':
        return { ...baseOptions, duration: 6000 };
      case 'auth':
        return { ...baseOptions, duration: 3000 };
      case 'permission':
        return { ...baseOptions, duration: 4000 };
      default:
        return baseOptions;
    }
  }

  // Retry mechanism for failed operations
  async retryOperation<T>(
    operation: () => Promise<T>,
    operationName: string,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === maxRetries) {
          // Final attempt failed
          this.handleError(lastError, {
            operation: operationName,
            attempt,
            maxRetries
          }, {
            showToast: true,
            logToConsole: true,
            retryable: false
          });
          throw lastError;
        }

        // Show retry notification
        toast.error(
          `Operation failed. Retrying... (${attempt}/${maxRetries})`,
          { duration: 2000 }
        );

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }

    throw lastError;
  }

  // Handle API errors specifically
  handleApiError(response: Response, context?: Record<string, any>): AppError {
    let errorType: AppError['type'] = 'system';
    let message = 'API request failed';

    switch (response.status) {
      case 400:
        errorType = 'validation';
        message = 'Invalid request data';
        break;
      case 401:
        errorType = 'auth';
        message = 'Authentication required';
        break;
      case 403:
        errorType = 'permission';
        message = 'Access denied';
        break;
      case 404:
        message = 'Resource not found';
        break;
      case 500:
        errorType = 'system';
        message = 'Server error';
        break;
      case 502:
      case 503:
      case 504:
        errorType = 'network';
        message = 'Service temporarily unavailable';
        break;
      default:
        message = `HTTP ${response.status}: ${response.statusText}`;
    }

    return this.handleError(new Error(message), {
      ...context,
      status: response.status,
      statusText: response.statusText,
      url: response.url
    }, {
      showToast: true,
      logToConsole: true,
      retryable: response.status >= 500
    });
  }

  // Handle validation errors
  handleValidationError(errors: string[], field?: string): AppError {
    const message = field 
      ? `Validation error in ${field}: ${errors.join(', ')}`
      : `Validation errors: ${errors.join(', ')}`;

    return this.handleError(new Error(message), {
      validationErrors: errors,
      field
    }, {
      showToast: true,
      logToConsole: false,
      retryable: false
    });
  }

  // Handle database errors
  handleDatabaseError(error: any, operation: string): AppError {
    return this.handleError(error, {
      operation,
      database: true
    }, {
      showToast: true,
      logToConsole: true,
      retryable: true,
      maxRetries: 3
    });
  }

  // Handle network errors
  handleNetworkError(error: any, url?: string): AppError {
    return this.handleError(error, {
      url,
      network: true
    }, {
      showToast: true,
      logToConsole: true,
      retryable: true,
      maxRetries: 2
    });
  }

  // Get all errors
  getErrors(filters?: {
    type?: AppError['type'];
    isHandled?: boolean;
    fromDate?: Date;
    toDate?: Date;
  }): AppError[] {
    let filteredErrors = [...this.errors];

    if (filters) {
      if (filters.type) {
        filteredErrors = filteredErrors.filter(error => error.type === filters.type);
      }
      if (filters.isHandled !== undefined) {
        filteredErrors = filteredErrors.filter(error => error.isHandled === filters.isHandled);
      }
      if (filters.fromDate) {
        filteredErrors = filteredErrors.filter(error => error.timestamp >= filters.fromDate!);
      }
      if (filters.toDate) {
        filteredErrors = filteredErrors.filter(error => error.timestamp <= filters.toDate!);
      }
    }

    return filteredErrors.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Mark error as handled
  markAsHandled(errorId: string): void {
    const error = this.errors.find(e => e.id === errorId);
    if (error) {
      error.isHandled = true;
      this.saveErrors();
    }
  }

  // Clear old errors
  clearOldErrors(daysOld: number = 30): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    this.errors = this.errors.filter(error => error.timestamp > cutoffDate);
    this.saveErrors();
  }

  // Get error statistics
  getErrorStats(): {
    total: number;
    byType: Record<AppError['type'], number>;
    handled: number;
    unhandled: number;
    today: number;
  } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = {
      total: this.errors.length,
      byType: {
        validation: 0,
        network: 0,
        database: 0,
        auth: 0,
        permission: 0,
        system: 0
      },
      handled: 0,
      unhandled: 0,
      today: 0
    };

    this.errors.forEach(error => {
      stats.byType[error.type]++;
      if (error.isHandled) {
        stats.handled++;
      } else {
        stats.unhandled++;
      }
      if (error.timestamp >= today) {
        stats.today++;
      }
    });

    return stats;
  }

  // Create a wrapper for async operations with error handling
  async withErrorHandling<T>(
    operation: () => Promise<T>,
    context?: Record<string, any>,
    config: ErrorConfig = {}
  ): Promise<T | null> {
    try {
      return await operation();
    } catch (error) {
      this.handleError(error, context, config);
      return null;
    }
  }

  // Create a wrapper for sync operations with error handling
  withErrorHandlingSync<T>(
    operation: () => T,
    context?: Record<string, any>,
    config: ErrorConfig = {}
  ): T | null {
    try {
      return operation();
    } catch (error) {
      this.handleError(error, context, config);
      return null;
    }
  }
}

// Export singleton instance
export const errorHandler = new ErrorHandler();

// Export utility functions
export const handleApiError = (response: Response, context?: Record<string, any>) => {
  return errorHandler.handleApiError(response, context);
};

export const handleValidationError = (errors: string[], field?: string) => {
  return errorHandler.handleValidationError(errors, field);
};

export const withErrorHandling = <T>(
  operation: () => Promise<T>,
  context?: Record<string, any>,
  config: ErrorConfig = {}
) => {
  return errorHandler.withErrorHandling(operation, context, config);
};

export const withErrorHandlingSync = <T>(
  operation: () => T,
  context?: Record<string, any>,
  config: ErrorConfig = {}
) => {
  return errorHandler.withErrorHandlingSync(operation, context, config);
}; 