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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { authenticateWithBackend } from "@/hooks/useGoogleAuth";

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Admin login:", formData);
    navigate("/admin/dashboard");
  };

  const handleGoogleSuccess = async (googleUser: any) => {
    try {
      console.log("Google login successful for admin:", googleUser);
      // TODO: Verify admin permissions
      // const result = await authenticateWithBackend(googleUser, 'admin');
      // if (result.success && result.user.role === 'admin') {
      //   navigate('/admin/dashboard');
      // } else {
      //   alert('Acesso negado: Permissões de administrador necessárias');
      // }
      navigate("/admin/dashboard");
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
            <form onSubmit={handleSubmit} className="space-y-6">
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
              >
                Aceder ao Painel
              </Button>
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
