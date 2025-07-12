import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Settings,
  ArrowLeft,
  Sprout,
  Shield,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import GoogleSignInButton from "@/components/GoogleSignInButton";

export default function AdminRegister() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    adminCode: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });

  const handleBack = () => {
    navigate("/admin/login");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("As palavras-passe não coincidem!");
      return;
    }
    if (!formData.acceptTerms) {
      alert("Deve aceitar os termos e condições!");
      return;
    }
    console.log("Admin registration:", formData);
    alert("Solicitação de acesso administrativo enviada! Aguarde aprovação.");
    navigate("/admin/login");
  };

  const handleGoogleSuccess = async (googleUser: any) => {
    try {
      console.log("Google registration successful for admin:", googleUser);
      setFormData({
        ...formData,
        name: googleUser.name,
        email: googleUser.email,
      });
      alert(
        "Dados do Google importados! Complete o registo com o código administrativo.",
      );
    } catch (error) {
      console.error("Google registration error:", error);
    }
  };

  const handleGoogleError = (error: string) => {
    console.error("Google registration error:", error);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
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
            Voltar ao login
          </Button>

          <div className="flex justify-center mb-4">
            <div className="p-3 bg-garden-brown/10 rounded-full">
              <Sprout className="w-8 h-8 text-garden-brown" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-garden-brown mb-2">
            Registo Administrativo
          </h1>
          <p className="text-gray-600">
            Solicitar acesso como administrador do sistema
          </p>
        </div>

        <Card className="garden-card border-garden-brown/20">
          <CardHeader className="text-center pb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-garden-brown to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Settings className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-garden-brown flex items-center justify-center gap-2">
              <Shield className="w-5 h-5" />
              Acesso Restrito
            </CardTitle>
          </CardHeader>

          <CardContent>
            {/* Warning */}
            <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                <div className="text-sm text-orange-800">
                  <p className="font-medium mb-1">Acesso Administrativo</p>
                  <p>
                    Este registo requer aprovação especial e código de acesso
                    válido.
                  </p>
                </div>
              </div>
            </div>

            {/* Google Sign Up */}
            <div className="mb-6">
              <div className="flex justify-center mb-4">
                <GoogleSignInButton
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  text="signup_with"
                  theme="filled_black"
                  size="large"
                  width={280}
                />
              </div>

              <div className="flex items-center my-6">
                <div className="flex-1 border-t border-garden-brown/20"></div>
                <span className="px-4 text-sm text-gray-500 bg-white">ou</span>
                <div className="flex-1 border-t border-garden-brown/20"></div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-garden-brown">
                  Nome Completo
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    className="pl-10 border-garden-brown/30 focus:border-garden-brown"
                    placeholder="Seu nome completo"
                    required
                  />
                </div>
              </div>

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
                <Label htmlFor="adminCode" className="text-garden-brown">
                  Código Administrativo
                </Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    id="adminCode"
                    name="adminCode"
                    type="text"
                    value={formData.adminCode}
                    onChange={handleChange}
                    className="pl-10 border-garden-brown/30 focus:border-garden-brown"
                    placeholder="Código fornecido pela administração"
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-garden-brown">
                  Confirmar Palavra-passe
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="pl-10 pr-10 border-garden-brown/30 focus:border-garden-brown"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-garden-brown"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  id="acceptTerms"
                  name="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={handleChange}
                  className="mt-1 rounded border-garden-brown/30 text-garden-brown focus:ring-garden-brown"
                  required
                />
                <label htmlFor="acceptTerms" className="text-sm text-gray-600">
                  Aceito os termos administrativos e responsabilidades do
                  sistema
                </label>
              </div>

              <Button
                type="submit"
                className="w-full bg-garden-brown hover:bg-garden-brown/90 text-white py-3"
              >
                <Shield className="w-4 h-4 mr-2" />
                Solicitar Acesso Admin
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Já tem acesso?{" "}
                <Link
                  to="/admin/login"
                  className="text-garden-brown hover:text-garden-brown/80 font-medium underline"
                >
                  Faça login aqui
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
