import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Users,
  ArrowLeft,
  Sprout,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import GoogleSignInButton from "../../components/GoogleSignInButton";
import { authenticateWithBackend } from "../../hooks/useGoogleAuth";

export default function ClientLogin() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleBack = () => {
    navigate("/select-interface");
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Chamada ao backend para autenticação
      const response = await fetch("/api/auth/client-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        localStorage.setItem("authToken", data.token);
        navigate("/client/dashboard");
      } else {
        setError(data.message || "Email ou palavra-passe inválidos.");
      }
    } catch (err) {
      setError("Erro ao autenticar. Tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (googleUser: any) => {
    setLoading(true);
    setError(null);
    try {
      const result = await authenticateWithBackend(googleUser, "client");
      if (result.success) {
        localStorage.setItem("authToken", result.token);
        navigate("/client/dashboard");
      } else {
        setError("Falha na autenticação Google.");
      }
    } catch (error) {
      setError("Erro na autenticação Google. Tente novamente.");
      console.error("Google authentication error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = (error: string) => {
    setError("Erro ao autenticar com Google: " + error);
    console.error("Google login error:", error);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
            Voltar à seleção
          </Button>

          <div className="flex justify-center mb-4">
            <div className="p-3 bg-garden-green-light/10 rounded-full">
              <Sprout className="w-8 h-8 text-garden-green" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-garden-green-dark mb-2">
            Bem-vindo, Cliente
          </h1>
          <p className="text-gray-600">
            Aceda à sua conta para gerir os seus projetos de jardinagem
          </p>
        </div>

        {/* Login Form */}
        <Card className="garden-card">
          <CardHeader className="text-center pb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-garden-green-light to-garden-light-blue rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-garden-green-dark">
              Iniciar Sessão
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
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
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10 border-garden-brown/20 focus:border-garden-green"
                    placeholder="seu.email@exemplo.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-garden-green-dark">
                  Palavra-passe
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10 pr-10 border-garden-brown/20 focus:border-garden-green"
                    placeholder="••••••••"
                    required
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
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-garden-brown/20 text-garden-green focus:ring-garden-green"
                  />
                  <span className="text-gray-600">Lembrar-me</span>
                </label>
                <Link
                  to="/client/reset-password"
                  className="text-garden-green hover:text-garden-green-dark underline"
                >
                  Esqueci a palavra-passe
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full garden-button py-3"
                disabled={loading}
                aria-busy={loading}
              >
                {loading ? "A autenticar..." : "Entrar"}
              </Button>
            {error && (
              <div className="text-red-600 text-sm text-center mt-2" role="alert">
                {error}
              </div>
            )}
            </form>

            {/* Divider */}
            <div className="flex items-center my-6">
              <div className="flex-1 border-t border-garden-brown/10"></div>
              <span className="px-4 text-sm text-gray-500 bg-white">ou</span>
              <div className="flex-1 border-t border-garden-brown/10"></div>
            </div>

            {/* Google Sign In */}
            <div className="flex justify-center">
              <GoogleSignInButton
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                text="signin_with"
                theme="outline"
                size="large"
                width={280}
                className="mb-4"
              />
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Ainda não tem conta?{" "}
                <Link
                  to="/client/register"
                  className="text-garden-green hover:text-garden-green-dark font-medium underline"
                >
                  Registe-se aqui
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Ao entrar, concorda com os nossos{" "}
            <a href="#" className="underline hover:text-garden-green">
              Termos de Uso
            </a>{" "}
            e{" "}
            <a href="#" className="underline hover:text-garden-green">
              Política de Privacidade
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
