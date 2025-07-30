import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Alert, AlertDescription } from "../../components/ui/alert";
import {
  Loader2,
  TreePine,
  User,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { cn } from "../../lib/utils";

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
  type AddressType = {
    street?: string;
    city: string;
    state: string;
    zipCode: string;
  };
  type RegisterFormType = {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    phone?: string;
    address: AddressType;
  };
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RegisterFormType>({
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
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    setSuccess(false);
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
          role: "client",
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Erro ao registrar usuário");
      }
      setSuccess(true);
      if (result.data?.token && !result.data?.needsApproval) {
        localStorage.setItem("auth_token", result.data.token);
        localStorage.setItem("user", JSON.stringify(result.data.user));
        setTimeout(() => {
          const userRole = result.data.user.role;
          navigate(userRole === "admin" ? "/dashboard/admin" : "/dashboard/client");
        }, 2000);
      }
      reset();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro interno do servidor");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TreePine className="w-6 h-6 text-green-600" />
            Criar Conta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert variant="default">
                <AlertDescription>
                  Registro realizado com sucesso!
                </AlertDescription>
              </Alert>
            )}
            <div>
              <Label htmlFor="name">Nome</Label>
              <div className="relative">
                <Input
                  id="name"
                  type="text"
                  {...register("name")}
                  placeholder="Seu nome completo"
                  className={cn(errors.name && "border-red-500")}
                />
                <User className="absolute right-2 top-2 w-4 h-4 text-gray-400" />
              </div>
              {errors.name && (
                <span className="text-xs text-red-500">{errors.name.message}</span>
              )}
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="seu@email.com"
                  className={cn(errors.email && "border-red-500")}
                />
                <Mail className="absolute right-2 top-2 w-4 h-4 text-gray-400" />
              </div>
              {errors.email && (
                <span className="text-xs text-red-500">{errors.email.message}</span>
              )}
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                {...register("password")}
                placeholder="Senha"
                className={cn(errors.password && "border-red-500")}
              />
              {errors.password && (
                <span className="text-xs text-red-500">{errors.password.message}</span>
              )}
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...register("confirmPassword")}
                placeholder="Confirme sua senha"
                className={cn(errors.confirmPassword && "border-red-500")}
              />
              {errors.confirmPassword && (
                <span className="text-xs text-red-500">{errors.confirmPassword.message}</span>
              )}
            </div>
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <div className="relative">
                <Input
                  id="phone"
                  type="text"
                  {...register("phone")}
                  placeholder="(xx) xxxxx-xxxx"
                  className={cn(errors.phone && "border-red-500")}
                />
                <Phone className="absolute right-2 top-2 w-4 h-4 text-gray-400" />
              </div>
              {errors.phone && (
                <span className="text-xs text-red-500">{errors.phone.message}</span>
              )}
            </div>
            <div>
              <Label htmlFor="street">Rua</Label>
              <Input
                id="street"
                type="text"
                {...register("address.street")}
                placeholder="Rua (opcional)"
                className={cn(errors.address?.street && "border-red-500")}
              />
              {errors.address?.street && (
                <span className="text-xs text-red-500">{errors.address.street.message}</span>
              )}
            </div>
            <div>
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                type="text"
                {...register("address.city")}
                placeholder="Cidade"
                className={cn(errors.address?.city && "border-red-500")}
              />
              {errors.address?.city && (
                <span className="text-xs text-red-500">{errors.address.city.message}</span>
              )}
            </div>
            <div>
              <Label htmlFor="state">Distrito/Estado</Label>
              <Input
                id="state"
                type="text"
                {...register("address.state")}
                placeholder="Distrito/Estado"
                className={cn(errors.address?.state && "border-red-500")}
              />
              {errors.address?.state && (
                <span className="text-xs text-red-500">{errors.address.state.message}</span>
              )}
            </div>
            <div>
              <Label htmlFor="zipCode">Código Postal</Label>
              <Input
                id="zipCode"
                type="text"
                {...register("address.zipCode")}
                placeholder="Código Postal"
                className={cn(errors.address?.zipCode && "border-red-500")}
              />
              {errors.address?.zipCode && (
                <span className="text-xs text-red-500">{errors.address.zipCode.message}</span>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="animate-spin w-4 h-4 mr-2" />
              ) : null}
              Registrar
            </Button>
            <div className="text-center text-sm mt-2">
              Já tem uma conta?{" "}
              <Link to="/auth/login" className="text-green-600 hover:underline">
                Entrar
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
