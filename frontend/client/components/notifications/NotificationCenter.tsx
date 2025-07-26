import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  BellRing,
  Check,
  X,
  Settings,
  Mail,
  Smartphone,
  Filter,
  MoreVertical,
  Trash2,
  Archive,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/services/notificationService";
// SUGESTÃO: Mover estas funções para um ficheiro de utilitários, ex: @/lib/notificationUtils.ts
// para evitar duplicação e promover a reutilização.
import {
  getNotificationIcon,
  getPriorityColor,
  formatTimestamp,
} from "@/lib/notificationUtils";
import type {
  NotificationTypes,
  ProjectNotification,
  MaintenanceNotification,
  SystemNotification,
} from "@/services/notificationService";

interface NotificationCenterProps {
  userRole: "client" | "admin" | "collaborator";
  className?: string;
  onNotificationClick?: (notification: NotificationTypes) => void;
}

export function NotificationCenter({
  userRole,
  className,
  onNotificationClick,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [showSettings, setShowSettings] = useState(false);

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications(userRole);

  // Filter notifications based on current filter
  const filteredNotifications = notifications.filter((notification) => {
    if (filter === "all") return true;
    if (filter === "unread") return !notification.read;
    return notification.type === filter;
  });

  const handleNotificationClick = (notification: NotificationTypes) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }

    onNotificationClick?.(notification);
    setIsOpen(false);
  };

  return (
    <div className={cn("relative", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="relative p-2 hover:bg-garden-green/10"
          >
            {unreadCount > 0 ? (
              <BellRing className="h-5 w-5 text-garden-green" />
            ) : (
              <Bell className="h-5 w-5 text-gray-600" />
            )}
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align="end"
          className="w-96 p-0 shadow-xl border-garden-green/20"
        >
          <div className="bg-white rounded-lg">
            {/* Header */}
            <div className="p-4 border-b border-garden-green/10">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-garden-green-dark">
                  Notificações
                </h3>
                <div className="flex items-center space-x-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-xs"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Marcar todas
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSettings(!showSettings)}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Filters */}
              <div className="flex space-x-2 mt-3">
                <Button
                  variant={filter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("all")}
                  className={cn(
                    "text-xs",
                    filter === "all"
                      ? "bg-garden-green text-white"
                      : "border-garden-green/20 text-garden-green hover:bg-garden-green hover:text-white",
                  )}
                >
                  Todas
                </Button>
                <Button
                  variant={filter === "unread" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("unread")}
                  className={cn(
                    "text-xs",
                    filter === "unread"
                      ? "bg-garden-green text-white"
                      : "border-garden-green/20 text-garden-green hover:bg-garden-green hover:text-white",
                  )}
                >
                  Não lidas
                </Button>
                <Button
                  variant={filter === "project" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("project")}
                  className={cn(
                    "text-xs",
                    filter === "project"
                      ? "bg-garden-green text-white"
                      : "border-garden-green/20 text-garden-green hover:bg-garden-green hover:text-white",
                  )}
                >
                  Projetos
                </Button>
              </div>
            </div>

            {/* Settings Panel */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-b border-garden-green/10 overflow-hidden"
                >
                  <NotificationSettings userRole={userRole} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Notifications List */}
            <ScrollArea className="h-96">
              <div className="p-2">
                <AnimatePresence>
                  {filteredNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                      <Bell className="w-12 h-12 mb-2 opacity-50" />
                      <p className="text-sm">Nenhuma notificação</p>
                    </div>
                  ) : (
                    filteredNotifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        className="mb-2"
                      >
                        <NotificationItem
                          notification={notification}
                          onClick={() => handleNotificationClick(notification)}
                          onDelete={() => deleteNotification(notification.id)}
                          onMarkAsRead={() => markAsRead(notification.id)}
                        />
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </ScrollArea>

            {/* Footer */}
            {filteredNotifications.length > 0 && (
              <div className="p-3 border-t border-garden-green/10 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-garden-green hover:bg-garden-green hover:text-white"
                  onClick={() => {
                    // Navigate to full notifications page
                    window.location.href = `/${userRole}/notifications`;
                  }}
                >
                  Ver todas as notificações
                </Button>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// Individual notification item component
interface NotificationItemProps {
  notification: NotificationTypes;
  onClick: () => void;
  onDelete: () => void;
  onMarkAsRead: () => void;
}

function NotificationItem({
  notification,
  onClick,
  onDelete,
  onMarkAsRead,
}: NotificationItemProps) {
  return (
    // SUGESTÃO: Este componente `NotificationItem` poderia ser movido para o seu próprio ficheiro
    // (ex: `components/notifications/NotificationItem.tsx`) para melhorar a organização do código.
    <div
      className={cn(
        "p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md group",
        notification.read
          ? "border-gray-200 bg-white"
          : "border-garden-green/30 bg-garden-green/5",
      )}
    >
      <div className="flex items-start space-x-3">
        {/* Priority indicator */}
        <div
          className={cn(
            "w-2 h-2 rounded-full mt-2",
            getPriorityColor(notification.priority),
          )}
        />

        {/* Notification icon */}
        <div className="mt-1">
          {getNotificationIcon(notification.type, notification.priority)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0" onClick={onClick}>
          <div className="flex items-start justify-between">
            <h4
              className={cn(
                "text-sm font-medium truncate",
                notification.read ? "text-gray-900" : "text-garden-green-dark",
              )}
            >
              {notification.title}
            </h4>
            <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
              {formatTimestamp(notification.timestamp)}
            </span>
          </div>

          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
            {notification.message}
          </p>

          {/* Action button */}
          {notification.actionUrl && (
            <div className="mt-2">
              <Button
                size="sm"
                variant="outline"
                className="text-xs border-garden-green/20 text-garden-green hover:bg-garden-green hover:text-white"
              >
                {notification.actionLabel || "Ver"}
                <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            </div>
          )}
        </div>

        {/* Actions menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!notification.read && (
              <DropdownMenuItem onClick={onMarkAsRead}>
                <Check className="w-4 h-4 mr-2" />
                Marcar como lida
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={onDelete} className="text-red-600">
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// Notification settings component
interface NotificationSettingsProps {
  userRole: string;
}

function NotificationSettings({ userRole }: NotificationSettingsProps) {
  // SUGESTÃO: Este componente `NotificationSettings` também poderia ser movido para o seu próprio ficheiro
  // (ex: `components/notifications/NotificationSettings.tsx`).
  const [settings, setSettings] = useState({
    pushEnabled: true,
    emailEnabled: true,
    projectUpdates: true,
    maintenanceReminders: true,
    systemAlerts: userRole === "admin",
    weeklyReports: true,
    soundEnabled: true,
  });

  const updateSetting = (key: keyof typeof settings, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    // Save to localStorage or send to backend
    localStorage.setItem(
      "notification_settings",
      JSON.stringify({ ...settings, [key]: value }),
    );
  };

  return (
    <div className="p-4 space-y-4">
      <h4 className="font-medium text-garden-green-dark">
        Configura��ões de Notificação
      </h4>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Smartphone className="w-4 h-4 text-garden-green" />
            <span className="text-sm">Notificações Push</span>
          </div>
          <Switch
            checked={settings.pushEnabled}
            onCheckedChange={(checked) => updateSetting("pushEnabled", checked)}
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

        <Separator />

        <div className="flex items-center justify-between">
          <span className="text-sm">Atualizações de Projetos</span>
          <Switch
            checked={settings.projectUpdates}
            onCheckedChange={(checked) =>
              updateSetting("projectUpdates", checked)
            }
          />
        </div>

        {(userRole === "collaborator" || userRole === "admin") && (
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
          <span className="text-sm">Som das Notificações</span>
          <Switch
            checked={settings.soundEnabled}
            onCheckedChange={(checked) =>
              updateSetting("soundEnabled", checked)
            }
          />
        </div>
      </div>
    </div>
  );
}

export default NotificationCenter;
