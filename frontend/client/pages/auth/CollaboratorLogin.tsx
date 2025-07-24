import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  UserCheck,
  ArrowLeft,
  Sprout,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { authenticateWithBackend } from "@/hooks/useGoogleAuth";

export default function CollaboratorLogin() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleBack = () => {
    navigate("/select-interface");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Collaborator login:", formData);
    navigate("/collaborator/dashboard");
  };

  const handleGoogleSuccess = async (googleUser: any) => {
    try {
      console.log("Google login successful for collaborator:", googleUser);
      // TODO: Verify collaborator permissions
      // const result = await authenticateWithBackend(googleUser, 'collaborator');
      // if (result.success) {
      //   navigate('/collaborator/dashboard');
      // }
      navigate("/collaborator/dashboard");
    } catch (error) {
      console.error("Google authentication error:", error);
    }
  };

  const handleGoogleError = (error: string) => {
    console.error("Google login error:", error);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-garden-green-dark/10 via-white to-green-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mb-4 hover:bg-green-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar à seleção
          </Button>

          <div className="flex justify-center mb-4">
            <div className="p-3 bg-garden-green-dark/10 rounded-full">
              <Sprout className="w-8 h-8 text-garden-green-dark" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-garden-green-dark mb-2">
            Área do Colaborador
          </h1>
          <p className="text-gray-600">
            Gerir projetos e comunicar com clientes
          </p>
        </div>

        <Card className="garden-card border-garden-green-dark/20">
          <CardHeader className="text-center pb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-garden-green-dark to-green-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <UserCheck className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-garden-green-dark flex items-center justify-center gap-2">
              <Briefcase className="w-5 h-5" />
              Portal do Colaborador
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-garden-green-dark">
                  Email Profissional
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10 border-garden-green-dark/30 focus:border-garden-green-dark"
                    placeholder="colaborador@replantasystem.com"
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
                    className="pl-10 pr-10 border-garden-green-dark/30 focus:border-garden-green-dark"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-garden-green-dark"
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
                    className="rounded border-garden-green-dark/30 text-garden-green-dark focus:ring-garden-green-dark"
                  />
                  <span className="text-gray-600">Lembrar-me</span>
                </label>
                <Link
                  to="/collaborator/reset-password"
                  className="text-garden-green-dark hover:text-garden-green underline"
                >
                  Esqueci a palavra-passe
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full bg-garden-green-dark hover:bg-green-800 text-white py-3"
              >
                Entrar na Área de Trabalho
              </Button>
            </form>

            {/* Divider */}
            <div className="flex items-center my-6">
              <div className="flex-1 border-t border-garden-green-dark/20"></div>
              <span className="px-4 text-sm text-gray-500 bg-white">ou</span>
              <div className="flex-1 border-t border-garden-green-dark/20"></div>
            </div>

            {/* Google Sign In */}
            <div className="flex justify-center">
              <GoogleSignInButton
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                text="signin_with"
                theme="filled_blue"
                size="large"
                width={280}
                className="mb-4"
              />
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Ainda não tem acesso?{" "}
                <Link
                  to="/collaborator/register"
                  className="text-garden-green-dark hover:text-garden-green font-medium underline"
                >
                  Solicitar Acesso
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
