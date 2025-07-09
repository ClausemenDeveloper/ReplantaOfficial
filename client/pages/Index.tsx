import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Leaf, Users, Shield, Sprout, ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Index() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleGetStarted = () => {
    navigate("/select-interface");
  };

  const features = [
    {
      icon: <Leaf className="w-8 h-8 text-garden-green" />,
      title: "Gestão Sustentável",
      description:
        "Soluções ecológicas para um futuro mais verde e sustentável.",
    },
    {
      icon: <Users className="w-8 h-8 text-garden-green" />,
      title: "Equipas Especializadas",
      description:
        "Profissionais qualificados para cada tipo de projeto de jardinagem.",
    },
    {
      icon: <Shield className="w-8 h-8 text-garden-green" />,
      title: "Serviço de Confiança",
      description: "Anos de experiência e centenas de clientes satisfeitos.",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-garden-green-light via-garden-light-blue to-garden-green-dark">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative container mx-auto px-4 py-24">
          <div
            className={`text-center text-white transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-white/20 rounded-full backdrop-blur-sm">
                <Sprout className="w-16 h-16 text-white" />
              </div>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Replanta<span className="text-garden-light-blue">System</span>
            </h1>

            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto leading-relaxed">
              A sua plataforma completa para gestão de projetos de jardinagem e
              paisagismo. Conectamos clientes, administradores e colaboradores
              numa experiência única.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleGetStarted}
                size="lg"
                className="garden-button text-lg px-8 py-4 group"
              >
                Começar Agora
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-lg px-8 py-4 bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm"
              >
                Saber Mais
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-garden-green-dark mb-4">
              Por que escolher o ReplantaSystem?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Uma plataforma moderna e intuitiva que revoluciona a forma como
              gerimos projetos de jardinagem.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="garden-card hover:scale-105 transition-transform duration-300"
              >
                <CardContent className="p-8 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-garden-green-light/10 rounded-full">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-garden-green-dark mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Stats Section */}
          <div className="bg-garden-green-dark rounded-2xl p-12 text-white">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold mb-2">500+</div>
                <div className="text-garden-light-blue">
                  Projetos Concluídos
                </div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">150+</div>
                <div className="text-garden-light-blue">
                  Clientes Satisfeitos
                </div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">98%</div>
                <div className="text-garden-light-blue">Taxa de Sucesso</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-gradient-to-r from-garden-green to-garden-green-dark">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Pronto para transformar o seu projeto?
          </h2>
          <p className="text-xl text-garden-light-blue mb-8 max-w-2xl mx-auto">
            Junte-se à nossa comunidade e descubra como podemos ajudar a tornar
            os seus sonhos de jardinagem realidade.
          </p>
          <div className="flex justify-center">
            <Button
              onClick={handleGetStarted}
              size="lg"
              className="bg-white text-garden-green-dark hover:bg-gray-100 text-lg px-8 py-4 group"
            >
              Aceder à Plataforma
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-garden-green-dark text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <Sprout className="w-8 h-8 mr-3 text-garden-light-blue" />
              <span className="text-xl font-semibold">ReplantaSystem</span>
            </div>
            <div className="flex space-x-6 text-sm">
              <a
                href="#"
                className="hover:text-garden-light-blue transition-colors"
              >
                Política de Privacidade
              </a>
              <a
                href="#"
                className="hover:text-garden-light-blue transition-colors"
              >
                Termos de Uso
              </a>
              <a
                href="#"
                className="hover:text-garden-light-blue transition-colors"
              >
                Contacto
              </a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-garden-green text-center text-sm">
            <p>&copy; 2025 ReplantaSystem. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
