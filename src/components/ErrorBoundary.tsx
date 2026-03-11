import React, { Component, ReactNode, ErrorInfo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { cn } from '../../utils/formatters';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call onError prop if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Set state to trigger fallback UI
    this.setState({ hasError: true, error });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Render fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error fallback
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <Card className="max-w-lg w-full">
            <CardHeader>
              <CardTitle>Oops! Something went wrong</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0A4 4 0 015.656 0l1.414-1.414a1 1 0 010-1.414 0l-1.414 1.414a1 1 0 010-1.414 0zm5.656-9.656a4 4 0 01-5.656 0l-1.414 1.414a1 1 0 010 1.414 0l1.414-1.414a1 1 0 010-1.414 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-900 mb-2">Application Error</p>
                    <p className="text-sm text-red-700 mb-4">
                      {this.state.error?.message || 'An unexpected error occurred'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900 mb-2">What can you do?</p>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Refresh the page and try again</li>
                  <li>• Check your internet connection</li>
                  <li>• Try the action again later</li>
                  <li>• If the problem persists, contact support</li>
                </ul>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => window.location.reload()}>
                  Refresh Page
                </Button>
                <Button variant="primary" onClick={this.handleReset}>
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
