import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  UserCheck,
  ArrowLeft,
  Sprout,
  Briefcase,
  FileText,
  Phone,
  MapPin,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import GoogleSignInButton from "../../components/GoogleSignInButton";

export default function CollaboratorRegister() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    specialization: "",
    experience: "",
    description: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });

  const handleBack = () => {
    navigate("/collaborator/login");
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (formData.password !== formData.confirmPassword) {
      setError("As palavras-passe não coincidem!");
      return;
    }
    if (!formData.acceptTerms) {
      setError("Deve aceitar os termos e condições!");
      return;
    }
    setLoading(true);
    try {
      // Chamada ao backend para registro
      const response = await fetch("/api/auth/collaborator-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        alert("Candidatura enviada! Aguarde aprovação da administração para aceder à plataforma como colaborador.");
        navigate("/collaborator/login");
      } else {
        setError(data.message || "Erro ao registrar. Tente novamente.");
      }
    } catch (err) {
      setError("Erro ao registrar. Tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (googleUser: any) => {
    try {
      setFormData((prev) => ({
        ...prev,
        name: googleUser.name,
        email: googleUser.email,
      }));
      setError(null);
      alert("Dados do Google importados! Complete a candidatura abaixo.");
    } catch (error) {
      setError("Erro ao importar dados do Google.");
      console.error("Google registration error:", error);
    }
  };

  const handleGoogleError = (error: string) => {
    setError("Erro ao autenticar com Google: " + error);
    console.error("Google registration error:", error);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const specializations = [
    "Jardinagem Geral",
    "Paisagismo",
    "Manutenção de Jardins",
    "Horticultura",
    "Rega Automática",
    "Poda e Tratamento de Árvores",
    "Design de Jardins",
    "Jardinagem Sustentável",
    "Outro",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-garden-green-dark/5 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mb-4 hover:bg-green-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao login
          </Button>

          <div className="flex justify-center mb-4">
            <div className="p-3 bg-garden-green-dark/10 rounded-full">
              <Sprout className="w-8 h-8 text-garden-green-dark" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-garden-green-dark mb-2">
            Candidatura de Colaborador
          </h1>
          <p className="text-gray-600">
            Junte-se à nossa equipa de especialistas em jardinagem
          </p>
        </div>

        {/* Registration Form */}
        <Card className="garden-card border-garden-green-dark/20">
          <CardHeader className="text-center pb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-garden-green-dark to-green-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <UserCheck className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-garden-green-dark flex items-center justify-center gap-2">
              <Briefcase className="w-5 h-5" />
              Tornar-se Colaborador
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
                  theme="filled_blue"
                  size="large"
                  width={320}
                />
              </div>

              <div className="flex items-center my-6">
                <div className="flex-1 border-t border-garden-green-dark/20"></div>
                <span className="px-4 text-sm text-gray-500 bg-white">ou</span>
                <div className="flex-1 border-t border-garden-green-dark/20"></div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
              {/* Personal Information */}
              <div className="grid md:grid-cols-2 gap-4">
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
                      className="pl-10 border-garden-green-dark/30 focus:border-garden-green-dark"
                      placeholder="Seu nome completo"
                      required
                    />
                  </div>
                </div>

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
                      placeholder="seu.email@exemplo.com"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
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
                      className="pl-10 border-garden-green-dark/30 focus:border-garden-green-dark"
                      placeholder="+351 912 345 678"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="text-garden-green-dark">
                    Localização
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      id="location"
                      name="location"
                      type="text"
                      value={formData.location}
                      onChange={handleChange}
                      className="pl-10 border-garden-green-dark/30 focus:border-garden-green-dark"
                      placeholder="Cidade, Distrito"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="specialization"
                    className="text-garden-green-dark"
                  >
                    Especialização
                  </Label>
                  <Select
                    value={formData.specialization}
                    onValueChange={(value) =>
                      handleSelectChange("specialization", value)
                    }
                  >
                    <SelectTrigger className="border-garden-green-dark/30 focus:border-garden-green-dark">
                      <SelectValue placeholder="Escolha a sua especialização" />
                    </SelectTrigger>
                    <SelectContent>
                      {specializations.map((spec) => (
                        <SelectItem key={spec} value={spec}>
                          {spec}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="experience"
                    className="text-garden-green-dark"
                  >
                    Anos de Experiência
                  </Label>
                  <Select
                    value={formData.experience}
                    onValueChange={(value) =>
                      handleSelectChange("experience", value)
                    }
                  >
                    <SelectTrigger className="border-garden-green-dark/30 focus:border-garden-green-dark">
                      <SelectValue placeholder="Anos de experiência" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-1">0-1 anos</SelectItem>
                      <SelectItem value="2-5">2-5 anos</SelectItem>
                      <SelectItem value="6-10">6-10 anos</SelectItem>
                      <SelectItem value="11-15">11-15 anos</SelectItem>
                      <SelectItem value="15+">Mais de 15 anos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-garden-green-dark">
                  Descrição Profissional
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="border-garden-green-dark/30 focus:border-garden-green-dark"
                  placeholder="Descreva a sua experiência, competências e motivação para se juntar à nossa equipa..."
                  rows={4}
                  required
                />
              </div>

              {/* Password Section */}
              <div className="grid md:grid-cols-2 gap-4">
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
                      className="pl-10 pr-10 border-garden-green-dark/30 focus:border-garden-green-dark"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-3 text-gray-400 hover:text-garden-green-dark"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  id="acceptTerms"
                  name="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={handleChange}
                  className="mt-1 rounded border-garden-green-dark/30 text-garden-green-dark focus:ring-garden-green-dark"
                  required
                />
                <label htmlFor="acceptTerms" className="text-sm text-gray-600">
                  Aceito os{" "}
                  <a
                    href="#"
                    className="text-garden-green-dark hover:underline"
                  >
                    Termos de Colaboração
                  </a>{" "}
                  e{" "}
                  <a
                    href="#"
                    className="text-garden-green-dark hover:underline"
                  >
                    Política de Privacidade
                  </a>
                </label>
              </div>

              <Button
                type="submit"
                className="w-full bg-garden-green-dark hover:bg-green-800 text-white py-3"
                disabled={loading}
                aria-busy={loading}
              >
                <FileText className="w-4 h-4 mr-2" />
                {loading ? "A enviar..." : "Enviar Candidatura"}
              </Button>
            {error && (
              <div className="text-red-600 text-sm text-center mt-2" role="alert">
                {error}
              </div>
            )}
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Já tem acesso?{" "}
                <Link
                  to="/collaborator/login"
                  className="text-garden-green-dark hover:text-garden-green font-medium underline"
                >
                  Faça login aqui
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        <div className="mt-6 p-4 bg-garden-green-dark/5 rounded-lg">
          <div className="text-sm text-garden-green-dark space-y-2">
            <p className="font-medium">📋 Processo de Candidatura:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>A sua candidatura será revista pela administração</li>
              <li>Poderá ser contactado para uma entrevista</li>
              <li>
                Aprovação baseada em experiência e necessidades da empresa
              </li>
              <li>
                Receberá confirmação por email sobre o estado da candidatura
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
