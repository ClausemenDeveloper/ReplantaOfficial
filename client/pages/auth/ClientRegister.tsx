import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Users,
  ArrowLeft,
  Sprout,
  Phone,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { authenticateWithBackend } from "@/hooks/useGoogleAuth";

export default function ClientRegister() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });

  const handleBack = () => {
    navigate("/client/login");
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
    console.log("Client registration:", formData);
    // TODO: Implement registration logic
    alert("Registo enviado! Aguarde aprovação da administração.");
    navigate("/client/login");
  };

  const handleGoogleSuccess = async (googleUser: any) => {
    try {
      console.log("Google registration successful for client:", googleUser);
      // Pre-fill form with Google data
      setFormData({
        ...formData,
        name: googleUser.name,
        email: googleUser.email,
      });

      // Or directly register with Google data
      // TODO: Implement backend registration
      // const result = await authenticateWithBackend(googleUser, 'client');
      // if (result.success) {
      //   alert('Registo com Google realizado! Aguarde aprovação da administração.');
      //   navigate('/client/login');
      // }
      alert("Dados do Google importados! Complete o registo abaixo.");
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
            Registo de Cliente
          </h1>
          <p className="text-gray-600">
            Crie a sua conta para aceder aos nossos serviços
          </p>
        </div>

        {/* Registration Form */}
        <Card className="garden-card">
          <CardHeader className="text-center pb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-garden-green-light to-garden-light-blue rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-garden-green-dark">
              Criar Conta
            </CardTitle>
          </CardHeader>

          <CardContent>
            {/* Google Sign Up */}
            <div className="mb-6">
              <div className="flex justify-center mb-4">
                <GoogleSignInButton
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  text="signup_with"
                  theme="outline"
                  size="large"
                  width={280}
                />
              </div>

              {/* Divider */}
              <div className="flex items-center my-6">
                <div className="flex-1 border-t border-garden-brown/10"></div>
                <span className="px-4 text-sm text-gray-500 bg-white">ou</span>
                <div className="flex-1 border-t border-garden-brown/10"></div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-garden-green-dark">
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
                    className="pl-10 border-garden-brown/20 focus:border-garden-green"
                    placeholder="Seu nome completo"
                    required
                  />
                </div>
              </div>

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
                <Label htmlFor="phone" className="text-garden-green-dark">
                  Telefone
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className="pl-10 border-garden-brown/20 focus:border-garden-green"
                    placeholder="+351 912 345 678"
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

              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="text-garden-green-dark"
                >
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
                    className="pl-10 pr-10 border-garden-brown/20 focus:border-garden-green"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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

              <div className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  id="acceptTerms"
                  name="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={handleChange}
                  className="mt-1 rounded border-garden-brown/20 text-garden-green focus:ring-garden-green"
                  required
                />
                <label htmlFor="acceptTerms" className="text-sm text-gray-600">
                  Aceito os{" "}
                  <a href="#" className="text-garden-green hover:underline">
                    Termos de Uso
                  </a>{" "}
                  e{" "}
                  <a href="#" className="text-garden-green hover:underline">
                    Política de Privacidade
                  </a>
                </label>
              </div>

              <Button type="submit" className="w-full garden-button py-3">
                <CheckCircle className="w-4 h-4 mr-2" />
                Criar Conta
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Já tem conta?{" "}
                <Link
                  to="/client/login"
                  className="text-garden-green hover:text-garden-green-dark font-medium underline"
                >
                  Faça login aqui
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        <div className="mt-6 p-4 bg-garden-green-light/10 rounded-lg">
          <div className="flex items-center space-x-2 text-sm text-garden-green-dark">
            <CheckCircle className="w-4 h-4" />
            <span>
              A sua conta será revista pela administração antes da aprovação.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
