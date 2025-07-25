import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Check,
  AlertTriangle,
  Info,
  Bell,
  ExternalLink,
  Settings,
  Mail,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { NotificationTypes } from "@/services/notificationService";

interface NotificationToastProps {
  notification: NotificationTypes;
  onClose: () => void;
  onAction?: () => void;
  autoClose?: boolean;
  duration?: number;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
}

export function NotificationToast({
  notification,
  onClose,
  onAction,
  autoClose = true,
  duration = 5000,
  position = "top-right",
}: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!autoClose) return;

    // Usar setTimeout em vez de setInterval para melhor performance.
    // Isto evita re-renderizações constantes do componente.
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Esperar a animação de saída
    }, duration);

    return () => clearTimeout(timer);
  }, [autoClose, duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleAction = () => {
    if (notification.actionUrl) {
      window.open(notification.actionUrl, "_blank");
    }
    onAction?.();
    handleClose();
  };

  const getIcon = () => {
    switch (notification.type) {
      case "project":
        return <Smartphone className="w-5 h-5" />;
      case "maintenance":
        return <Settings className="w-5 h-5" />;
      case "success":
        return <Check className="w-5 h-5" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5" />;
      case "error":
        return <X className="w-5 h-5" />;
      case "info":
        return <Info className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getColorClasses = () => {
    switch (notification.type) {
      case "success":
        return {
          bg: "bg-green-50 border-green-200",
          icon: "text-green-600",
          title: "text-green-900",
          message: "text-green-700",
          button: "bg-green-600 hover:bg-green-700",
        };
      case "warning":
        return {
          bg: "bg-yellow-50 border-yellow-200",
          icon: "text-yellow-600",
          title: "text-yellow-900",
          message: "text-yellow-700",
          button: "bg-yellow-600 hover:bg-yellow-700",
        };
      case "error":
        return {
          bg: "bg-red-50 border-red-200",
          icon: "text-red-600",
          title: "text-red-900",
          message: "text-red-700",
          button: "bg-red-600 hover:bg-red-700",
        };
      case "project":
        return {
          bg: "bg-garden-green/10 border-garden-green/30",
          icon: "text-garden-green",
          title: "text-garden-green-dark",
          message: "text-garden-green-dark/80",
          button: "bg-garden-green hover:bg-garden-green-dark",
        };
      case "maintenance":
        return {
          bg: "bg-orange-50 border-orange-200",
          icon: "text-orange-600",
          title: "text-orange-900",
          message: "text-orange-700",
          button: "bg-orange-600 hover:bg-orange-700",
        };
      default:
        return {
          bg: "bg-blue-50 border-blue-200",
          icon: "text-blue-600",
          title: "text-blue-900",
          message: "text-blue-700",
          button: "bg-blue-600 hover:bg-blue-700",
        };
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case "top-left":
        return "top-4 left-4";
      case "top-right":
        return "top-4 right-4";
      case "bottom-left":
        return "bottom-4 left-4";
      case "bottom-right":
        return "bottom-4 right-4";
      default:
        return "top-4 right-4";
    }
  };

  const colors = getColorClasses();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 100, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 100, scale: 0.95 }}
          className={cn(
            "fixed z-50 w-96 max-w-[calc(100vw-2rem)]",
            getPositionClasses(),
          )}
        >
          <Card
            className={cn(
              "shadow-lg border-l-4 overflow-hidden",
              colors.bg,
              notification.priority === "urgent" && "shadow-xl border-l-8",
            )}
          >
            <div className="p-4">
              <div className="flex items-start space-x-3">
                {/* Icon */}
                <div className={cn("mt-0.5", colors.icon)}>{getIcon()}</div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4
                        className={cn(
                          "text-sm font-semibold",
                          colors.title,
                          notification.priority === "urgent" &&
                            "text-red-900 font-bold",
                        )}
                      >
                        {notification.title}
                        {notification.priority === "urgent" && (
                          <Badge variant="destructive" className="ml-2 text-xs">
                            URGENTE
                          </Badge>
                        )}
                      </h4>
                      <p className={cn("text-sm mt-1", colors.message)}>
                        {notification.message}
                      </p>
                    </div>

                    {/* Close button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClose}
                      className="p-1 h-auto hover:bg-black/10"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Action button */}
                  {(notification.actionUrl || onAction) && (
                    <div className="mt-3">
                      <Button
                        size="sm"
                        onClick={handleAction}
                        className={cn(
                          "text-white text-xs",
                          colors.button,
                          "hover:shadow-md transition-all",
                        )}
                      >
                        {notification.actionLabel || "Ver"}
                        {notification.actionUrl && (
                          <ExternalLink className="w-3 h-3 ml-1" />
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Timestamp */}
                  <div className="mt-2 text-xs opacity-70">
                    {formatTimestamp(notification.timestamp)}
                  </div>
                </div>
              </div>
            </div>

            {/* Progress bar for auto-close */}
            {autoClose && (
              <div className="h-1 bg-black/10">
                <motion.div
                  className="h-full bg-current opacity-30"
                  // Animar a barra de progresso diretamente com framer-motion
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: duration / 1000, ease: "linear" }}
                />
              </div>
            )}
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Toast container for managing multiple toasts
interface ToastContainerProps {
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  maxToasts?: number;
}

export function ToastContainer({
  position = "top-right",
  maxToasts = 5,
}: ToastContainerProps) {
  const [toasts, setToasts] = useState<
    (NotificationTypes & { id: string; key: string })[]
  >([]);

  useEffect(() => {
    const handleNewNotification = (event: CustomEvent<NotificationTypes>) => {
      const notification = event.detail;
      const toastId = `toast_${Date.now()}_${Math.random()}`;

      setToasts((prev) => {
        const newToasts = [
          {
            ...notification,
            id: toastId,
            key: toastId,
          },
          ...prev,
        ].slice(0, maxToasts);

        return newToasts;
      });
    };

    window.addEventListener(
      "notification-added",
      handleNewNotification as EventListener,
    );

    return () => {
      window.removeEventListener(
        "notification-added",
        handleNewNotification as EventListener,
      );
    };
  }, [maxToasts]);

  const removeToast = (toastId: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== toastId));
  };

  const getContainerClasses = () => {
    switch (position) {
      case "top-left":
        return "top-0 left-0";
      case "top-right":
        return "top-0 right-0";
      case "bottom-left":
        return "bottom-0 left-0";
      case "bottom-right":
        return "bottom-0 right-0";
      default:
        return "top-0 right-0";
    }
  };

  return (
    <div
      className={cn(
        "fixed z-50 p-4 space-y-2 pointer-events-none",
        getContainerClasses(),
      )}
    >
      <AnimatePresence>
        {toasts.map((toast, index) => (
          <motion.div
            key={toast.key}
            initial={{ opacity: 0, y: -20 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: { delay: index * 0.1 },
            }}
            exit={{ opacity: 0, x: 100 }}
            className="pointer-events-auto"
          >
            <NotificationToast
              notification={toast}
              onClose={() => removeToast(toast.id)}
              position={position}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Utility function to show toast notifications programmatically
export function showToast(
  notification: Omit<NotificationTypes, "id" | "timestamp" | "read">,
) {
  const event = new CustomEvent("notification-added", {
    detail: {
      ...notification,
      id: `manual_${Date.now()}`,
      timestamp: new Date(),
      read: false,
    },
  });
  window.dispatchEvent(event);
}

// Predefined toast functions for common scenarios
export const toast = {
  success: (title: string, message: string, actionUrl?: string) =>
    showToast({
      title,
      message,
      type: "success",
      priority: "medium",
      userRole: "all",
      actionUrl,
    }),

  error: (title: string, message: string, actionUrl?: string) =>
    showToast({
      title,
      message,
      type: "error",
      priority: "high",
      userRole: "all",
      actionUrl,
    }),

  warning: (title: string, message: string, actionUrl?: string) =>
    showToast({
      title,
      message,
      type: "warning",
      priority: "medium",
      userRole: "all",
      actionUrl,
    }),

  info: (title: string, message: string, actionUrl?: string) =>
    showToast({
      title,
      message,
      type: "info",
      priority: "low",
      userRole: "all",
      actionUrl,
    }),

  project: (title: string, message: string, actionUrl?: string) =>
    showToast({
      title,
      message,
      type: "project",
      priority: "medium",
      userRole: "all",
      actionUrl,
      actionLabel: "Ver Projeto",
    }),

  maintenance: (title: string, message: string, actionUrl?: string) =>
    showToast({
      title,
      message,
      type: "maintenance",
      priority: "medium",
      userRole: "collaborator",
      actionUrl,
      actionLabel: "Ver Tarefa",
    }),

  urgent: (title: string, message: string, actionUrl?: string) =>
    showToast({
      title,
      message,
      type: "error",
      priority: "urgent",
      userRole: "all",
      actionUrl,
    }),
};

// Helper function to format timestamps
function formatTimestamp(timestamp: Date): string {
  const now = new Date();
  const diff = now.getTime() - timestamp.getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "Agora mesmo";
  if (minutes < 60) return `Há ${minutes} minuto${minutes > 1 ? "s" : ""}`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Há ${hours} hora${hours > 1 ? "s" : ""}`;

  return timestamp.toLocaleTimeString("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default NotificationToast;
