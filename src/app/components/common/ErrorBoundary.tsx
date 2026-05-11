import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                    <Card className="max-w-md w-full p-8 text-center space-y-6 bg-white shadow-xl border-t-4 border-t-red-500">
                        <div className="flex justify-center">
                            <div className="p-4 bg-red-50 rounded-full">
                                <AlertTriangle className="h-12 w-12 text-red-500" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
                            <p className="text-gray-600">
                                We encountered an unexpected error while rendering this page.
                            </p>
                            {this.state.error && (
                                <div className="mt-4 p-3 bg-gray-100 rounded text-left text-xs font-mono text-gray-700 overflow-auto max-h-32">
                                    {this.state.error.message}
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-3">
                            <Button
                                onClick={() => window.location.reload()}
                                className="w-full flex items-center justify-center gap-2"
                            >
                                <RefreshCcw className="h-4 w-4" />
                                Reload Page
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => window.location.href = '/'}
                                className="w-full flex items-center justify-center gap-2"
                            >
                                <Home className="h-4 w-4" />
                                Return to Dashboard
                            </Button>
                        </div>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}
