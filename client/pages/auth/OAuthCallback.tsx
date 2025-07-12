import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Sprout, CheckCircle, AlertCircle, Loader } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get parameters from URL
        const code = searchParams.get("code");
        const state = searchParams.get("state");
        const error = searchParams.get("error");

        if (error) {
          setStatus("error");
          setMessage(`Erro de autenticação: ${error}`);
          return;
        }

        if (!code) {
          setStatus("error");
          setMessage("Código de autorização não encontrado");
          return;
        }

        // TODO: Process OAuth callback with backend
        // const response = await fetch('/api/auth/oauth/callback', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ code, state })
        // });

        // Simulate successful authentication
        setTimeout(() => {
          setStatus("success");
          setMessage("Autenticação realizada com sucesso!");

          // Redirect based on state parameter (role)
          setTimeout(() => {
            const role = state || "client";
            navigate(`/${role}/dashboard`);
          }, 2000);
        }, 1500);
      } catch (error) {
        console.error("OAuth callback error:", error);
        setStatus("error");
        setMessage("Erro interno durante a autenticação");
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  const handleRetry = () => {
    navigate("/select-interface");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-garden-green-light/10 via-white to-garden-light-blue/10 flex items-center justify-center p-4">
      <Card className="garden-card w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-garden-green-light/10 rounded-full">
              <Sprout className="w-12 h-12 text-garden-green" />
            </div>
          </div>
          <CardTitle className="text-garden-green-dark">
            Autenticação Google
          </CardTitle>
        </CardHeader>

        <CardContent className="text-center">
          {status === "loading" && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <Loader className="w-8 h-8 text-garden-green animate-spin" />
              </div>
              <p className="text-gray-600">A processar a sua autenticação...</p>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-garden-green-dark mb-2">
                  Sucesso!
                </h3>
                <p className="text-gray-600">{message}</p>
                <p className="text-sm text-gray-500 mt-2">
                  A redireccionar para o dashboard...
                </p>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <AlertCircle className="w-12 h-12 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-600 mb-2">
                  Erro de Autenticação
                </h3>
                <p className="text-gray-600 mb-4">{message}</p>
                <Button onClick={handleRetry} className="garden-button">
                  Tentar Novamente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
