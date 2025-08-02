import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  BellRing,
  Check,
  Settings,
  MoreVertical,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import { ScrollArea } from "../ui/scroll-area";
import { cn } from "../../lib/utils";
import { useNotifications } from "../../services/notificationService";
import {
  getNotificationIcon,
  getPriorityColor,
  formatTimestamp,
} from "../../lib/notificationUtils";
import type { NotificationTypes } from "../../services/notificationService";
import NotificationSettings from "./NotificationSettings";

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
      window.open(notification.actionUrl, "_blank");
    }
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  };

  return (
    <div className={cn("relative", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="relative p-2 hover:bg-garden-green/10"
            aria-label="Abrir centro de notificações"
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
                    onClick={() => setShowSettings((prev) => !prev)}
                    aria-label="Abrir definições de notificações"
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
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center py-8 text-gray-500"
                    >
                      <Bell className="w-12 h-12 mb-2 opacity-50" />
                      <p className="text-sm">Nenhuma notificação</p>
                    </motion.div>
                  ) : (
                    filteredNotifications.map((notification: NotificationTypes) => (
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
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2 text-garden-green"
                  onClick={() =>
                    window.location.href = `/${userRole}/notifications`
                  }
                >
                  Ver todas as notificações
                </Button>
              </div>
            </ScrollArea>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

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
    <div
      className={cn(
        "p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md group",
        notification.read
          ? "border-gray-200 bg-white"
          : "border-garden-green/30 bg-garden-green/5",
      )}
      tabIndex={0}
      role="button"
      aria-label={`Notificação: ${notification.title}`}
      onClick={onClick}
      onKeyPress={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick();
      }}
    >
      <div className="flex items-start space-x-3">
        <div
          className={cn(
            "w-2 h-2 rounded-full mt-2",
            getPriorityColor(notification.priority),
          )}
        />
        <div className="mt-1">
          {getNotificationIcon(notification.type, notification.priority)}
        </div>
        <div className="flex-1 min-w-0">
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

interface NotificationSettingsProps {
  userRole: "client" | "admin" | "collaborator";
}

