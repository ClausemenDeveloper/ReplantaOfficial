import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  BellOff,
  Check,
  X,
  Settings,
  Smartphone,
  Mail,
  Shield,
  AlertTriangle,
  Info,
} from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Switch } from "../ui/switch";
import { Alert, AlertDescription } from "../ui/alert";
import { notificationService } from "../../services/notificationService";
import { cn } from "../../lib/utils";

interface NotificationPermissionsProps {
  userRole: "client" | "admin" | "collaborator";
  userId: string;
  onPermissionChange?: (hasPermission: boolean) => void;
}

export function NotificationPermissions({
  userRole,
  userId,
  onPermissionChange,
}: NotificationPermissionsProps) {
  const [pushPermission, setPushPermission] =
    useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    checkPermissionStatus();
  }, []);

  const checkPermissionStatus = async () => {
    if (!("Notification" in window)) {
      setError("Notificações não são suportadas neste navegador");
      return;
    }

    const permission = Notification.permission;
    setPushPermission(permission);

    // Check if user is already subscribed
    const subscription = localStorage.getItem("replanta_push_subscription");
    setIsSubscribed(!!subscription);

    onPermissionChange?.(permission === "granted");
  };

  const requestPermission = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const success = await notificationService.subscribeToPush(
        userId,
        userRole,
      );

      if (success) {
        setPushPermission("granted");
        setIsSubscribed(true);
        onPermissionChange?.(true);
      } else {
        setError("Falha ao activar notificações push");
      }
    } catch (error) {
      console.error("Permission request failed:", error);
      setError("Erro ao solicitar permissões de notificação");
    } finally {
      setIsLoading(false);
    }
  };

  const getPermissionStatus = () => {
    switch (pushPermission) {
      case "granted":
        return {
          icon: <Check className="w-5 h-5 text-green-600" />,
          text: "Notificações Activadas",
          color: "text-green-600",
          bgColor: "bg-green-50 border-green-200",
        };
      case "denied":
        return {
          icon: <X className="w-5 h-5 text-red-600" />,
          text: "Notificações Bloqueadas",
          color: "text-red-600",
          bgColor: "bg-red-50 border-red-200",
        };
      default:
        return {
          icon: <Bell className="w-5 h-5 text-yellow-600" />,
          text: "Configurar Notificações",
          color: "text-yellow-600",
          bgColor: "bg-yellow-50 border-yellow-200",
        };
    }
  };

  const status = getPermissionStatus();

  return (
    <div className="space-y-4">
      {/* Permission Status Card */}
      <Card className={cn("border-l-4", status.bgColor)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-sm">
            {status.icon}
            <span className={status.color}>{status.text}</span>
            {isSubscribed && (
              <Badge variant="secondary" className="ml-2">
                Ativo
              </Badge>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Permission request UI */}
          {pushPermission === "default" && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Active as notificações para receber atualizações importantes
                sobre os seus projetos e tarefas.
              </p>

              <div className="flex space-x-2">
                <Button
                  onClick={requestPermission}
                  disabled={isLoading}
                  className="bg-garden-green hover:bg-garden-green-dark text-white"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <Bell className="w-4 h-4 mr-2" />
                  )}
                  Ativar Notificações
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setShowSetup(!showSetup)}
                  className="border-garden-green/20 text-garden-green hover:bg-garden-green hover:text-white"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Configurar
                </Button>
              </div>
            </div>
          )}

          {/* Denied permission help */}
          {pushPermission === "denied" && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                As notificações foram bloqueadas. Para activar:
                <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                  <li>Clique no ícone do cadeado na barra de endereços</li>
                  <li>Altere "Notificações" para "Permitir"</li>
                  <li>Recarregue a página</li>
                </ol>
              </AlertDescription>
            </Alert>
          )}

          {/* Success state */}
          {pushPermission === "granted" && isSubscribed && (
            <div className="space-y-3">
              <p className="text-sm text-green-700">
                ✓ Notificações push configuradas com sucesso! Irá receber
                atualizações importantes diretamente no seu dispositivo.
              </p>

              <div className="flex items-center space-x-4 p-3 bg-green-50 rounded-lg">
                <Smartphone className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-900">
                    Tipos de notificação ativas:
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      Projetos
                    </Badge>
                    {(userRole === "collaborator" || userRole === "admin") && (
                      <Badge variant="secondary" className="text-xs">
                        Manutenção
                      </Badge>
                    )}
                    {userRole === "admin" && (
                      <Badge variant="secondary" className="text-xs">
                        Sistema
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error display */}
          {error && (
            <Alert variant="destructive">
              <X className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Advanced Setup */}
      <AnimatePresence>
        {showSetup && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <NotificationSetup userRole={userRole} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Advanced notification setup component
interface NotificationSetupProps {
  userRole: string;
}

function NotificationSetup({ userRole }: NotificationSetupProps) {
  const [settings, setSettings] = useState({
    pushEnabled: true,
    emailEnabled: true,
    soundEnabled: true,
    quietHours: false,
    quietStart: "22:00",
    quietEnd: "08:00",
    projectUpdates: true,
    maintenanceReminders: userRole !== "client",
    systemAlerts: userRole === "admin",
    weeklyReports: true,
    urgentOnly: false,
  });

  const [testInProgress, setTestInProgress] = useState(false);

  const updateSetting = <K extends keyof typeof settings>(key: K, value: typeof settings[K]) => {
    setSettings((prev) => {
      const updated = { ...prev, [key]: value };
      localStorage.setItem("notification_settings", JSON.stringify(updated));
      return updated;
    });
  };

  const sendTestNotification = async () => {
    setTestInProgress(true);

    // Add a test notification
    notificationService.addNotification({
      title: "Notificação de Teste",
      message: "As suas notificações estão a funcionar correctamente! 🎉",
      type: "info",
      priority: "medium",
      userRole: userRole as any,
      actionUrl: window.location.href,
      actionLabel: "OK",
      module: "system",
    });

    // Show browser notification if permitted
    if (Notification.permission === "granted") {
      new Notification("ReplantaSystem - Teste", {
        body: "Notificação de teste enviada com sucesso!",
        icon: "/icon-192.png",
        tag: "test-notification",
      });
    }

    setTimeout(() => setTestInProgress(false), 2000);
  };

  return (
    <Card className="border-garden-green/20">
      <CardHeader>
        <CardTitle className="flex items-center text-garden-green-dark">
          <Settings className="w-5 h-5 mr-2" />
          Configurações Avançadas
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Notification Types */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-gray-900">
            Tipos de Notificação
          </h4>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Smartphone className="w-4 h-4 text-garden-green" />
                <span className="text-sm">Notificações Push</span>
              </div>
              <Switch
                checked={settings.pushEnabled}
                onCheckedChange={(checked) =>
                  updateSetting("pushEnabled", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-garden-green" />
                <span className="text-sm">Notificações por Email</span>
              </div>
              <Switch
                checked={settings.emailEnabled}
                onCheckedChange={(checked) =>
                  updateSetting("emailEnabled", checked)
                }
              />
            </div>
          </div>
        </div>

        {/* Content Preferences */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-gray-900">
            Preferências de Conteúdo
          </h4>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Atualizações de Projetos</span>
              <Switch
                checked={settings.projectUpdates}
                onCheckedChange={(checked) =>
                  updateSetting("projectUpdates", checked)
                }
              />
            </div>

            {userRole !== "client" && (
              <div className="flex items-center justify-between">
                <span className="text-sm">Lembretes de Manutenção</span>
                <Switch
                  checked={settings.maintenanceReminders}
                  onCheckedChange={(checked) =>
                    updateSetting("maintenanceReminders", checked)
                  }
                />
              </div>
            )}

            {userRole === "admin" && (
              <div className="flex items-center justify-between">
                <span className="text-sm">Alertas do Sistema</span>
                <Switch
                  checked={settings.systemAlerts}
                  onCheckedChange={(checked) =>
                    updateSetting("systemAlerts", checked)
                  }
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm">Relatórios Semanais</span>
              <Switch
                checked={settings.weeklyReports}
                onCheckedChange={(checked) =>
                  updateSetting("weeklyReports", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Apenas Urgentes</span>
              <Switch
                checked={settings.urgentOnly}
                onCheckedChange={(checked) =>
                  updateSetting("urgentOnly", checked)
                }
              />
            </div>
          </div>
        </div>

        {/* Behavior Settings */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-gray-900">Comportamento</h4>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Som das Notificações</span>
              <Switch
                checked={settings.soundEnabled}
                onCheckedChange={(checked) =>
                  updateSetting("soundEnabled", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Horário Silencioso</span>
              <Switch
                checked={settings.quietHours}
                onCheckedChange={(checked) =>
                  updateSetting("quietHours", checked)
                }
              />
            </div>

            {settings.quietHours && (
              <div className="pl-4 space-y-2">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <label className="text-xs text-gray-600">Início:</label>
                    <input
                      type="time"
                      value={settings.quietStart}
                      onChange={(e) =>
                        updateSetting("quietStart", e.target.value)
                      }
                      className="text-xs border border-gray-300 rounded px-2 py-1"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="text-xs text-gray-600">Fim:</label>
                    <input
                      type="time"
                      value={settings.quietEnd}
                      onChange={(e) =>
                        updateSetting("quietEnd", e.target.value)
                      }
                      className="text-xs border border-gray-300 rounded px-2 py-1"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Test Notification */}
        <div className="pt-4 border-t">
          <Button
            onClick={sendTestNotification}
            disabled={testInProgress}
            variant="outline"
            className="w-full border-garden-green/20 text-garden-green hover:bg-garden-green hover:text-white"
          >
            {testInProgress ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <Bell className="w-4 h-4 mr-2" />
            )}
            Testar Notificações
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default NotificationPermissions;
