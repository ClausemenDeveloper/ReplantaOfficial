import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, TreePine, Lock, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

// Validation schema
const loginSchema = z.object({
  email: z.string().email("Email inválido").min(1, "Email é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Erro ao fazer login");
      }

      // Store authentication data
      if (result.data?.token) {
        localStorage.setItem("auth_token", result.data.token);
        localStorage.setItem("user", JSON.stringify(result.data.user));

        // Redirect based on user role
        const userRole = result.data.user.role;
        switch (userRole) {
          case "admin":
            navigate("/dashboard/admin");
            break;
          case "collaborator":
            navigate("/dashboard/collaborator");
            break;
          case "client":
          default:
            navigate("/dashboard/client");
            break;
        }
      }
    } catch (err: any) {
      // Mostrar mensagens específicas baseadas no tipo de erro
      if (err.message.includes("aprovação")) {
        setError(
          "⏳ A sua conta está aguardando aprovação do administrador. Será notificado quando aprovada.",
        );
      } else if (err.message.includes("rejeitada")) {
        setError(
          "❌ A sua conta foi rejeitada pelo administrador. Contacte-nos para mais informações.",
        );
      } else if (err.message.includes("Acesso negado")) {
        setError(
          "🔒 Acesso negado. Verifique as suas credenciais ou contacte o administrador.",
        );
      } else {
        setError(err.message || "Erro interno do servidor");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Pre-fill admin credentials for demonstration
  const fillAdminCredentials = () => {
    const emailInput = document.getElementById("email") as HTMLInputElement;
    const passwordInput = document.getElementById(
      "password",
    ) as HTMLInputElement;

    if (emailInput && passwordInput) {
      emailInput.value = "clausemenandredossantos@gmail.com";
      passwordInput.value = "@Venus0777";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-garden-green/10 to-garden-green-light/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-garden-green/10 rounded-full flex items-center justify-center">
            <TreePine className="w-8 h-8 text-garden-green" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold text-garden-green">
              Bem-vindo de volta
            </CardTitle>
            <p className="text-garden-green-dark">
              Entre na sua conta ReplantaSystem
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="seu@email.com"
                  className={cn("pl-10", errors.email && "border-red-500")}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  {...register("password")}
                  placeholder="Sua senha"
                  className={cn("pl-10", errors.password && "border-red-500")}
                />
              </div>
              {errors.password && (
                <p className="text-sm text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-garden-green hover:bg-garden-green-dark text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />A entrar...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          {/* Admin quick access for testing */}
          <div className="pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={fillAdminCredentials}
              className="w-full text-xs text-gray-600 hover:text-gray-800"
            >
              Acesso Rápido Admin (Para Teste)
            </Button>
          </div>

          <div className="space-y-4 text-center text-sm">
            <Link
              to="/forgot-password"
              className="text-garden-green hover:text-garden-green-dark"
            >
              Esqueceu a senha?
            </Link>

            <div className="text-gray-600">
              Não tem uma conta?{" "}
              <Link
                to="/register"
                className="text-garden-green hover:text-garden-green-dark font-medium"
              >
                Registe-se aqui
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
