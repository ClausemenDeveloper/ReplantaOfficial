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
import {
  Loader2,
  TreePine,
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Validation schema
const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Nome deve ter pelo menos 2 caracteres")
      .max(100, "Nome não pode ter mais de 100 caracteres"),
    email: z.string().email("Email inválido").min(1, "Email é obrigatório"),
    password: z
      .string()
      .min(6, "Senha deve ter pelo menos 6 caracteres")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número",
      ),
    confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória"),
    phone: z
      .string()
      .min(9, "Telefone deve ter pelo menos 9 dígitos")
      .regex(/^[\d\s\+\-\(\)]+$/, "Telefone inválido")
      .optional()
      .or(z.literal("")),
    address: z.object({
      street: z.string().optional(),
      city: z.string().min(2, "Cidade é obrigatória"),
      state: z.string().min(2, "Distrito/Estado é obrigatório"),
      zipCode: z.string().min(4, "Código postal é obrigatório"),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Senhas não coincidem",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
      address: {
        street: "",
        city: "",
        state: "",
        zipCode: "",
      },
    },
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          phone: data.phone || undefined,
          address: data.address,
          role: "client", // Always client for this registration
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Erro ao registrar usuário");
      }

      setSuccess(true);

      // Store token only if user is auto-approved (admin)
      if (result.data?.token && !result.data?.needsApproval) {
        localStorage.setItem("auth_token", result.data.token);
        localStorage.setItem("user", JSON.stringify(result.data.user));

        // Redirect to dashboard for auto-approved users
        setTimeout(() => {
          const userRole = result.data.user.role;
          if (userRole === "admin") {
            navigate("/dashboard/admin");
          } else {
            navigate("/dashboard/client");
          }
        }, 2000);
      }

      // Reset form
      reset();
    } catch (err: any) {
      setError(err.message || "Erro interno do servidor");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-garden-green/10 to-garden-green-light/20 p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="pt-6">
            <div className="text-center space-y-6">
              <div className="mx-auto w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center">
                <TreePine className="w-10 h-10 text-yellow-600" />
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-yellow-800">
                  Registo Efetuado com Sucesso!
                </h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-yellow-800">
                      ⏳ Conta aguardando aprovação
                    </p>
                    <p className="text-sm text-yellow-700">
                      A sua conta foi criada com sucesso, mas precisa de ser
                      aprovada pelo administrador antes de poder aceder à
                      plataforma.
                    </p>
                    <p className="text-xs text-yellow-600 mt-3">
                      Será notificado por email quando a sua conta for aprovada.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={() => navigate("/login")}
                    variant="outline"
                    className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                  >
                    Ir para Login
                  </Button>
                  <Button
                    onClick={() =>
                      (window.location.href =
                        "mailto:clausemenandredossantos@gmail.com")
                    }
                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                  >
                    Contactar Admin
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-garden-green/10 to-garden-green-light/20 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-garden-green/10 rounded-full flex items-center justify-center">
            <TreePine className="w-8 h-8 text-garden-green" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold text-garden-green">
              Junte-se ao ReplantaSystem
            </CardTitle>
            <p className="text-garden-green-dark">
              Crie a sua conta e comece a gerir os seus projetos de jardinagem
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
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center">
                <User className="w-5 h-5 mr-2" />
                Informações Pessoais
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    {...register("name")}
                    placeholder="Seu nome completo"
                    className={cn(errors.name && "border-red-500")}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    {...register("phone")}
                    placeholder="+351 912 345 678"
                    className={cn(errors.phone && "border-red-500")}
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-500">
                      {errors.phone.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center">
                <Mail className="w-5 h-5 mr-2" />
                Informações da Conta
              </h3>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="seu@email.com"
                  className={cn(errors.email && "border-red-500")}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Senha *</Label>
                  <Input
                    id="password"
                    type="password"
                    {...register("password")}
                    placeholder="Senha segura"
                    className={cn(errors.password && "border-red-500")}
                  />
                  {errors.password && (
                    <p className="text-sm text-red-500">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    {...register("confirmPassword")}
                    placeholder="Confirme a senha"
                    className={cn(errors.confirmPassword && "border-red-500")}
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-500">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Morada
              </h3>

              <div className="space-y-2">
                <Label htmlFor="street">Rua</Label>
                <Input
                  id="street"
                  {...register("address.street")}
                  placeholder="Rua, número, andar"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade *</Label>
                  <Input
                    id="city"
                    {...register("address.city")}
                    placeholder="Lisboa"
                    className={cn(errors.address?.city && "border-red-500")}
                  />
                  {errors.address?.city && (
                    <p className="text-sm text-red-500">
                      {errors.address.city.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">Distrito *</Label>
                  <Input
                    id="state"
                    {...register("address.state")}
                    placeholder="Lisboa"
                    className={cn(errors.address?.state && "border-red-500")}
                  />
                  {errors.address?.state && (
                    <p className="text-sm text-red-500">
                      {errors.address.state.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zipCode">Código Postal *</Label>
                  <Input
                    id="zipCode"
                    {...register("address.zipCode")}
                    placeholder="1000-001"
                    className={cn(errors.address?.zipCode && "border-red-500")}
                  />
                  {errors.address?.zipCode && (
                    <p className="text-sm text-red-500">
                      {errors.address.zipCode.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-garden-green hover:bg-garden-green-dark text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />A criar
                  conta...
                </>
              ) : (
                "Criar Conta"
              )}
            </Button>
          </form>

          <div className="text-center text-sm text-gray-600">
            Já tem uma conta?{" "}
            <Link
              to="/login"
              className="text-garden-green hover:text-garden-green-dark font-medium"
            >
              Faça login aqui
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
