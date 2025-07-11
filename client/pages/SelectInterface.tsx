import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Settings,
  UserCheck,
  Sprout,
  ArrowLeft,
  CheckCircle,
  Star,
  Shield,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function SelectInterface() {
  const navigate = useNavigate();
  const [selectedInterface, setSelectedInterface] = useState<string | null>(
    null,
  );

  const handleGoBack = () => {
    navigate("/");
  };

  const handleSelectInterface = (interfaceType: string) => {
    setSelectedInterface(interfaceType);
    // Navigate to login page for the selected interface
    setTimeout(() => {
      navigate(`/${interfaceType}/login`);
    }, 500);
  };

  const interfaces = [
    {
      id: "client",
      title: "Cliente",
      description:
        "Acesso para clientes que desejam solicitar serviços de jardinagem e acompanhar seus projetos.",
      icon: <Users className="w-12 h-12" />,
      color: "from-garden-green-light to-garden-light-blue",
      features: [
        "Solicitar orçamentos",
        "Acompanhar projetos",
        "Galeria de inspirações",
        "Chat direto com equipas",
      ],
      buttonText: "Aceder como Cliente",
    },
    {
      id: "admin",
      title: "Administrador",
      description:
        "Painel completo para administradores gerirem toda a plataforma e aprovar novos utilizadores.",
      icon: <Settings className="w-12 h-12" />,
      color: "from-garden-brown to-orange-600",
      features: [
        "Gestão de utilizadores",
        "Aprovação de registos",
        "Relatórios completos",
        "Configurações do sistema",
      ],
      buttonText: "Aceder como Admin",
    },
    {
      id: "collaborator",
      title: "Colaborador",
      description:
        "Interface para colaboradores gerirem suas tarefas e projetos atribuídos pela administração.",
      icon: <UserCheck className="w-12 h-12" />,
      color: "from-garden-green-dark to-green-800",
      features: [
        "Gerir projetos atribuídos",
        "Atualizar progresso",
        "Comunicar com clientes",
        "Registo de atividades",
      ],
      buttonText: "Aceder como Colaborador",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-garden-green-light/10 via-white to-garden-light-blue/10">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Button
              variant="ghost"
              onClick={handleGoBack}
              className="mr-4 p-2 hover:bg-garden-green-light/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center">
              <Sprout className="w-8 h-8 text-garden-green mr-3" />
              <h1 className="text-2xl font-bold text-garden-green-dark">
                ReplantaSystem
              </h1>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-garden-green-dark mb-6">
            Escolha a sua interface
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Selecione o tipo de acesso que melhor se adequa ao seu perfil. Cada
            interface foi desenhada especificamente para as suas necessidades.
          </p>
        </div>

        {/* Interface Cards */}
        <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-8 mb-16">
          {interfaces.map((interfaceOption) => (
            <Card
              key={interfaceOption.id}
              className={`garden-card hover:scale-105 transition-all duration-300 cursor-pointer border-2 ${
                selectedInterface === interfaceOption.id
                  ? "border-garden-green shadow-2xl"
                  : "border-transparent hover:border-garden-green/30"
              }`}
              onClick={() => handleSelectInterface(interfaceOption.id)}
            >
              <CardContent className="p-8 text-center h-full flex flex-col">
                {/* Icon with gradient background */}
                <div
                  className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${interfaceOption.color} flex items-center justify-center text-white shadow-lg`}
                >
                  {interfaceOption.icon}
                </div>

                {/* Title and description */}
                <h3 className="text-2xl font-bold text-garden-green-dark mb-4">
                  {interfaceOption.title}
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed flex-grow">
                  {interfaceOption.description}
                </p>

                {/* Features list */}
                <div className="mb-8">
                  <ul className="space-y-2 text-sm text-gray-700">
                    {interfaceOption.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-garden-green mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action button */}
                <Button
                  className={`w-full garden-button py-3 ${
                    selectedInterface === interfaceOption.id
                      ? "bg-garden-green-dark"
                      : ""
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectInterface(interfaceOption.id);
                  }}
                >
                  {interfaceOption.buttonText}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Info Section */}
        <div className="bg-white rounded-2xl shadow-lg p-12 mb-16">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-garden-green-dark mb-4">
              Primeiros passos na plataforma
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Não tem conta ainda? Não se preocupe! O processo é simples e
              rápido.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-garden-green-light/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-garden-green" />
              </div>
              <h4 className="text-xl font-semibold text-garden-green-dark mb-2">
                1. Registe-se
              </h4>
              <p className="text-gray-600">
                Crie a sua conta de forma gratuita e rápida
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-garden-green-light/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-garden-green" />
              </div>
              <h4 className="text-xl font-semibold text-garden-green-dark mb-2">
                2. Aprovação
              </h4>
              <p className="text-gray-600">
                Aguarde a aprovação da administração (rápida e segura)
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-garden-green-light/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-garden-green" />
              </div>
              <h4 className="text-xl font-semibold text-garden-green-dark mb-2">
                3. Comece
              </h4>
              <p className="text-gray-600">
                Aceda à sua interface e comece a usar todos os recursos
              </p>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            Tem dúvidas sobre qual interface escolher?
          </p>
          <Button
            variant="outline"
            className="border-garden-green text-garden-green hover:bg-garden-green hover:text-white"
          >
            Contacte o Suporte
          </Button>
        </div>
      </div>
    </div>
  );
}
