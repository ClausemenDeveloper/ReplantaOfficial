import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: undefined, errorInfo: undefined };
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    // Atualiza o estado para mostrar a UI de fallback
    return {
      hasError: true,
      error,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log para debug e serviço externo
    if (process.env.NODE_ENV === "production") {
      // Envie para Sentry, LogRocket, etc.
      // window.logErrorService?.({ error, errorInfo });
      console.warn("Production error logged:", {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });
    } else {
      console.error("Error boundary caught an error:", error, errorInfo);
    }
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.assign("/");
  };

  private handleResetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  public render() {
    const { hasError, error, errorInfo } = this.state;
    const { fallback, children } = this.props;
    if (hasError) {
      if (fallback) return fallback;
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4" role="alert" aria-live="assertive">
          <Card className="w-full max-w-2xl border-red-200 shadow-xl">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertTriangle className="w-8 h-8 text-red-600" aria-hidden="true" />
                </div>
              </div>
              <CardTitle className="text-2xl text-red-800">Oops! Algo deu errado</CardTitle>
              <p className="text-red-600 mt-2">Ocorreu um erro inesperado na aplicação.</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Error Details (Development Only) */}
              {process.env.NODE_ENV === "development" && error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-800 mb-2">Detalhes do Erro (Desenvolvimento):</h4>
                  <details className="text-sm">
                    <summary className="cursor-pointer text-red-700 font-medium mb-2">{error.message}</summary>
                    <pre className="text-xs text-red-600 bg-red-100 p-2 rounded overflow-x-auto whitespace-pre-wrap">{error.stack}</pre>
                    {errorInfo && (
                      <pre className="text-xs text-red-600 bg-red-100 p-2 rounded overflow-x-auto whitespace-pre-wrap mt-2">{errorInfo.componentStack}</pre>
                    )}
                  </details>
                </div>
              )}
              {/* User-friendly message */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">O que pode fazer:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Tente recarregar a página</li>
                  <li>• Verifique a sua conexão com a internet</li>
                  <li>• Limpe o cache do navegador</li>
                  <li>• Se o problema persistir, contacte o suporte</li>
                </ul>
              </div>
              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={this.handleResetError}
                  className="flex-1 bg-garden-green hover:bg-garden-green-dark text-white"
                  aria-label="Tentar novamente"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Tentar Novamente
                </Button>
                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-50"
                  aria-label="Recarregar página"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Recarregar Página
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                  aria-label="Ir para início"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Ir para Início
                </Button>
              </div>
              {/* Footer info */}
              <div className="text-center pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  ReplantaSystem • Se precisar de ajuda, contacte-nos em{' '}
                  <a
                    href="mailto:suporte@replantasystem.com"
                    className="text-garden-green hover:underline"
                  >
                    suporte@replantasystem.com
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
    return children;
  }
}

// Functional wrapper for easier use with hooks
export const ErrorBoundaryWrapper: React.FC<Props> = ({
  children,
  fallback,
}) => {
  return <ErrorBoundary fallback={fallback}>{children}</ErrorBoundary>;
};

export default ErrorBoundary;
