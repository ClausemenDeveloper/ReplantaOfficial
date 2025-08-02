import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import {
  Mail,
  Lock,
  ArrowLeft,
  Sprout,
  Users,
  CheckCircle,
  Eye,
  EyeOff,
  AlertTriangle,
  Shield,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import {
  SecurityValidator,
  SecureHTTP,
  SecureErrorHandler,
} from "../../lib/security";

export default function ClientResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<"request" | "reset">(
    searchParams.get("token") ? "reset" : "request",
  );
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [requestData, setRequestData] = useState({
    email: "",
  });

  const [resetData, setResetData] = useState({
    token: searchParams.get("token") || "",
    password: "",
    confirmPassword: "",
  });

  const handleBack = () => {
    navigate("/client/login");
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setError("");
    setMessage("");

    // Validação de email
    if (!SecurityValidator.validateEmail(requestData.email)) {
      setError("Email inválido");
      return;
    }

    // Rate limit
    if (!SecurityValidator.checkRateLimit("password_reset", 3, 60 * 60 * 1000)) {
      setError("Muitas tentativas. Tente novamente em 1 hora.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await SecureHTTP.post(
        "/api/auth/client/reset-password-request",
        { email: SecurityValidator.sanitizeInput(requestData.email) }
      );
      if (response.ok) {
        setMessage("Se o email estiver registado como cliente, receberá as instruções de reset em breve.");
        SecureErrorHandler.logSecurityEvent("password_reset_requested", {
          email: requestData.email,
          userType: "client",
        });
        setRequestData({ email: "" });
      } else {
        const data = await response.json();
        setError(data.error || "Erro ao solicitar reset de password");
      }
    } catch (error) {
      SecureErrorHandler.handleError(error as Error, "Password reset request");
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setError("");
    setMessage("");

    // Validação de senha
    const passwordValidation = SecurityValidator.validatePassword(resetData.password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.errors[0]);
      return;
    }
    if (resetData.password !== resetData.confirmPassword) {
      setError("As passwords não coincidem");
      return;
    }
    if (!resetData.token) {
      setError("Token de reset inválido");
      return;
    }

    setIsLoading(true);
    try {
      const response = await SecureHTTP.post(
        "/api/auth/client/reset-password-confirm",
        {
          token: resetData.token,
          password: resetData.password,
        }
      );
      if (response.ok) {
        setMessage("Password alterada com sucesso! Pode agora fazer login.");
        SecureErrorHandler.logSecurityEvent("password_reset_completed", {
          userType: "client",
        });
        setTimeout(() => {
          navigate("/client/login");
        }, 3000);
      } else {
        const data = await response.json();
        setError(data.error || "Erro ao alterar password");
      }
    } catch (error) {
      SecureErrorHandler.handleError(error as Error, "Password reset");
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRequestData({ ...requestData, [e.target.name]: e.target.value });
  };

  const handleResetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setResetData({ ...resetData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-garden-green-light/20 via-white to-garden-light-blue/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mb-4 hover:bg-garden-green-light/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao login
          </Button>

          <div className="flex justify-center mb-4">
            <div className="p-3 bg-garden-green-light/10 rounded-full">
              <Sprout className="w-8 h-8 text-garden-green" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-garden-green-dark mb-2">
            {step === "request" ? "Recuperar Password" : "Nova Password"}
          </h1>
          <p className="text-gray-600">
            {step === "request"
              ? "Enviaremos um link de recuperação para o seu email"
              : "Defina a sua nova password"}
          </p>
        </div>

        {/* Reset Form */}
        <Card className="garden-card">
          <CardHeader className="text-center pb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-garden-green-light to-garden-light-blue rounded-2xl flex items-center justify-center mx-auto mb-4">
              {step === "request" ? (
                <Mail className="w-8 h-8 text-white" />
              ) : (
                <Lock className="w-8 h-8 text-white" />
              )}
            </div>
            <CardTitle className="text-garden-green-dark flex items-center justify-center gap-2">
              <Users className="w-5 h-5" />
              {step === "request" ? "Solicitar Reset" : "Definir Nova Password"}
            </CardTitle>
          </CardHeader>

          <CardContent>
            {/* Success Message */}
            {message && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2 text-green-700">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm">{message}</span>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2 text-red-700">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="text-sm">{error}</span>
                </div>
              </div>
            )}

            {step === "request" ? (
              /* Password Reset Request Form */
              <form onSubmit={handleRequestSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-garden-green-dark">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={requestData.email}
                      onChange={handleRequestChange}
                      className="pl-10 border-garden-brown/20 focus:border-garden-green"
                      placeholder="seu.email@exemplo.com"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Introduza o email associado à sua conta de cliente
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full garden-button py-3"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>A processar...</span>
                    </div>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Enviar Link de Recuperação
                    </>
                  )}
                </Button>
              </form>
            ) : (
              /* New Password Form */
              <form onSubmit={handleResetSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-garden-green-dark">
                    Nova Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={resetData.password}
                      onChange={handleResetChange}
                      className="pl-10 pr-10 border-garden-brown/20 focus:border-garden-green"
                      placeholder="••••••••"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-garden-green"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <div className="text-xs text-gray-500">
                    Mínimo 8 caracteres com maiúsculas, minúsculas, números e
                    símbolos
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="confirmPassword"
                    className="text-garden-green-dark"
                  >
                    Confirmar Nova Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={resetData.confirmPassword}
                      onChange={handleResetChange}
                      className="pl-10 pr-10 border-garden-brown/20 focus:border-garden-green"
                      placeholder="••••••••"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-3 text-gray-400 hover:text-garden-green"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full garden-button py-3"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>A alterar...</span>
                    </div>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Alterar Password
                    </>
                  )}
                </Button>
              </form>
            )}

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Lembrou-se da password?{" "}
                <Link
                  to="/client/login"
                  className="text-garden-green hover:text-garden-green-dark font-medium underline"
                >
                  Voltar ao login
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Security Info */}
        <div className="mt-6 p-4 bg-garden-green-light/10 rounded-lg">
          <div className="text-xs text-garden-green-dark space-y-1">
            <p className="font-medium flex items-center">
              <Shield className="w-3 h-3 mr-1" />
              Segurança:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>Os links de recuperação expiram em 1 hora</li>
              <li>Apenas emails válidos de clientes recebem links</li>
              <li>Tentativas limitadas por segurança (3 por hora)</li>
              <li>Toda a atividade é registada e monitorizada</li>
              <li>Passwords devem cumprir critérios de segurança</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
