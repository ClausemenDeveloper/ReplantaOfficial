import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Settings,
  ArrowLeft,
  Sprout,
  Shield,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import GoogleSignInButton from "../../components/GoogleSignInButton";
import { authenticateWithBackend } from "../../hooks/useGoogleAuth";

export default function AdminLogin() {
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
      // Exemplo de chamada ao backend para autenticação
      const response = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok && data.user?.role === "admin") {
        localStorage.setItem("authToken", data.token);
        navigate("/admin/dashboard");
      } else {
        setError(data.message || "Acesso negado: Permissões de administrador necessárias");
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
      // Chama autenticação backend para Google, verifica role
      const result = await authenticateWithBackend(googleUser, "admin");
      if (result.success && result.user?.role === "admin") {
        localStorage.setItem("authToken", result.token);
        navigate("/admin/dashboard");
      } else {
        setError("Acesso negado: Permissões de administrador necessárias");
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
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-white to-garden-brown/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mb-4 hover:bg-orange-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar à seleção
          </Button>

          <div className="flex justify-center mb-4">
            <div className="p-3 bg-garden-brown/10 rounded-full">
              <Sprout className="w-8 h-8 text-garden-brown" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-garden-brown mb-2">
            Painel Administrativo
          </h1>
          <p className="text-gray-600">
            Acesso restrito para administradores do sistema
          </p>
        </div>

        <Card className="garden-card border-garden-brown/20">
          <CardHeader className="text-center pb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-garden-brown to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Settings className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-garden-brown flex items-center justify-center gap-2">
              <Shield className="w-5 h-5" />
              Acesso Seguro
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-garden-brown">
                  Email Administrativo
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10 border-garden-brown/30 focus:border-garden-brown"
                    placeholder="admin@replantasystem.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-garden-brown">
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
                    className="pl-10 pr-10 border-garden-brown/30 focus:border-garden-brown"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-garden-brown"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-garden-brown hover:bg-garden-brown/90 text-white py-3"
                disabled={loading}
                aria-busy={loading}
              >
                {loading ? "A autenticar..." : "Aceder ao Painel"}
              </Button>
            {error && (
              <div className="text-red-600 text-sm text-center mt-2" role="alert">
                {error}
              </div>
            )}
            </form>

            {/* Divider */}
            <div className="flex items-center my-6">
              <div className="flex-1 border-t border-garden-brown/20"></div>
              <span className="px-4 text-sm text-gray-500 bg-white">ou</span>
              <div className="flex-1 border-t border-garden-brown/20"></div>
            </div>

            {/* Google Sign In */}
            <div className="flex justify-center">
              <GoogleSignInButton
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                text="signin_with"
                theme="filled_black"
                size="large"
                width={280}
                className="mb-4"
              />
            </div>

            <div className="mt-6 text-center">
              <Link
                to="/admin/reset-password"
                className="text-sm text-garden-brown hover:text-garden-brown/80 underline"
              >
                Esqueci a palavra-passe
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
