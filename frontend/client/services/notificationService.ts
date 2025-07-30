// Comprehensive Notification Service for ReplantaSystem
import { validateInput } from "../lib/security";
import { useState, useEffect } from "react";

// Types for different notification scenarios
export interface BaseNotification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error" | "project" | "maintenance";
  timestamp: Date;
  read: boolean;
  priority: "low" | "medium" | "high" | "urgent";
  userRole: "client" | "admin" | "collaborator" | "all";
  actionUrl?: string;
  actionLabel?: string;
}

export interface ProjectNotification extends BaseNotification {
  type: "project";
  projectId?: string;
  projectName?: string;
  clientId?: string;
  collaboratorId?: string;
  status?: "started" | "progress" | "completed" | "delayed" | "cancelled";
}

export interface MaintenanceNotification extends BaseNotification {
  type: "maintenance";
  taskId?: string;
  location?: string;
  scheduledDate?: Date;
  assignedTo?: string;
}

export interface SystemNotification extends BaseNotification {
  type: "info" | "success" | "warning" | "error";
  module?: "auth" | "system" | "user" | "project" | "payment";
}

export type NotificationTypes =
  | ProjectNotification
  | MaintenanceNotification
  | SystemNotification;

// Push notification configuration
export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userId: string;
  userRole: string;
  deviceInfo: {
    userAgent: string;
    platform: string;
    timestamp: Date;
  };
}

// Email notification configuration
export interface EmailNotificationData {
  to: string;
  subject: string;
  template: EmailTemplate;
  data: Record<string, any>;
  priority: "low" | "normal" | "high";
  sendAt?: Date; // For scheduled emails
}

export type EmailTemplate =
  | "welcome"
  | "project_update"
  | "project_completion"
  | "maintenance_reminder"
  | "payment_reminder"
  | "password_reset"
  | "account_activation"
  | "weekly_report";

class NotificationService {
  private notifications: NotificationTypes[] = [];
  private subscribers: PushSubscriptionData[] = [];
  private apiKey: string;
  private vapidKeys: { publicKey: string; privateKey: string };

  constructor() {
    this.apiKey = import.meta.env.VITE_NOTIFICATION_API_KEY || "";
    this.vapidKeys = {
      publicKey:
        import.meta.env.VITE_VAPID_PUBLIC_KEY ||
        "BEl62iUYgUivxIkv69yViEuiBIa40HI6YrrfQAsxiJqMVkmOpJHVrkmUOW6JC_VvK8sARvKdwQSg5rE0H9BPKjQ",
      privateKey: import.meta.env.VITE_VAPID_PRIVATE_KEY || "",
    };

    this.loadNotifications();
    this.initializePushNotifications();
  }

  // ===============================
  // CORE NOTIFICATION MANAGEMENT
  // ===============================

  private loadNotifications(): void {
    try {
      const stored = localStorage.getItem("replanta_notifications");
      if (stored) {
        const parsed = JSON.parse(stored);
        this.notifications = Array.isArray(parsed)
          ? parsed.map((n: any) => ({
              ...n,
              timestamp: n.timestamp ? new Date(n.timestamp) : new Date(),
              read: typeof n.read === "boolean" ? n.read : false,
            }))
          : [];
      } else {
        this.notifications = [];
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
      this.notifications = [];
    }
  }

  private saveNotifications(): void {
    try {
      localStorage.setItem(
        "replanta_notifications",
        JSON.stringify(this.notifications),
      );
    } catch (error) {
      console.error("Error saving notifications:", error);
    }
  }

  public addNotification(notification: Partial<NotificationTypes>): string {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: NotificationTypes = {
      ...notification,
      id,
      timestamp: new Date(),
      read: false,
      type: notification.type || "info",
      priority: notification.priority || "low",
      userRole: notification.userRole || "all",
      title: notification.title || "Nova Notificação",
      message: notification.message || "Você recebeu uma nova notificação.",
    } as NotificationTypes;

    this.notifications.unshift(newNotification);

    // Keep only last 100 notifications per user
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }

    this.saveNotifications();
    this.triggerPushNotification(newNotification);

    // Trigger custom event for real-time updates
    window.dispatchEvent(
      new CustomEvent("notification-added", {
        detail: newNotification,
      }),
    );

    return id;
  }

  public getNotifications(
    userRole?: string,
    unreadOnly: boolean = false,
  ): NotificationTypes[] {
    let filtered = this.notifications;

    if (userRole) {
      filtered = filtered.filter(
        (n) => n.userRole === userRole || n.userRole === "all",
      );
    }

    if (unreadOnly) {
      filtered = filtered.filter((n) => !n.read);
    }

    // Remove notifications with missing required fields
    filtered = filtered.filter(
      (n) => n.title && n.message && n.timestamp,
    );

    return filtered.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    );
  }

  public markAsRead(notificationId: string): boolean {
    const notification = this.notifications.find(
      (n) => n.id === notificationId,
    );
    if (notification && !notification.read) {
      notification.read = true;
      this.saveNotifications();

      window.dispatchEvent(
        new CustomEvent("notification-read", {
          detail: notification,
        }),
      );

      return true;
    }
    return false;
  }

  public markAllAsRead(userRole?: string): number {
    let count = 0;
    this.notifications.forEach((notification) => {
      if (
        !notification.read &&
        (!userRole ||
          notification.userRole === userRole ||
          notification.userRole === "all")
      ) {
        notification.read = true;
        count++;
      }
    });

    if (count > 0) {
      this.saveNotifications();
      window.dispatchEvent(new CustomEvent("notifications-all-read"));
    }

    return count;
  }

  public deleteNotification(notificationId: string): boolean {
    const index = this.notifications.findIndex((n) => n.id === notificationId);
    if (index > -1) {
      const deleted = this.notifications.splice(index, 1)[0];
      this.saveNotifications();

      window.dispatchEvent(
        new CustomEvent("notification-deleted", {
          detail: deleted,
        }),
      );

      return true;
    }
    return false;
  }

  // ===============================
  // PUSH NOTIFICATIONS
  // ===============================

  private async initializePushNotifications(): Promise<void> {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.warn("Push notifications not supported");
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription =
        await registration.pushManager.getSubscription();

      if (existingSubscription) {
        console.log("Push subscription already exists");
      }
    } catch (error) {
      console.error("Error initializing push notifications:", error);
    }
  }

  public async requestPushPermission(): Promise<boolean> {
    if (!("Notification" in window)) {
      console.warn("Notifications not supported");
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission === "denied") {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  public async subscribeToPush(
    userId: string,
    userRole: string,
  ): Promise<boolean> {
    try {
      const hasPermission = await this.requestPushPermission();
      if (!hasPermission) {
        throw new Error("Push notification permission denied");
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          this.vapidKeys.publicKey,
        ),
      });

      const subscriptionData: PushSubscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: btoa(
            String.fromCharCode(
              ...new Uint8Array(subscription.getKey("p256dh")!),
            ),
          ),
          auth: btoa(
            String.fromCharCode(
              ...new Uint8Array(subscription.getKey("auth")!),
            ),
          ),
        },
        userId,
        userRole,
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          timestamp: new Date(),
        },
      };

      // Save subscription locally
      this.subscribers.push(subscriptionData);
      localStorage.setItem(
        "replanta_push_subscription",
        JSON.stringify(subscriptionData),
      );

      // Send to backend
      await this.sendSubscriptionToBackend(subscriptionData);

      return true;
    } catch (error) {
      console.error("Error subscribing to push notifications:", error);
      return false;
    }
  }

  private async sendSubscriptionToBackend(
    subscription: PushSubscriptionData,
  ): Promise<void> {
    try {
      const response = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(subscription),
      });

      if (!response.ok) {
        throw new Error("Failed to send subscription to backend");
      }
    } catch (error) {
      console.error("Error sending subscription to backend:", error);
      // Store for retry later
      const failedSubscriptions = JSON.parse(
        localStorage.getItem("replanta_failed_subscriptions") || "[]",
      );
      failedSubscriptions.push(subscription);
      localStorage.setItem(
        "replanta_failed_subscriptions",
        JSON.stringify(failedSubscriptions),
      );
    }
  }

  private async triggerPushNotification(
    notification: NotificationTypes,
  ): Promise<void> {
    try {
      // Only send push if user has permission and is subscribed
      const subscription = localStorage.getItem("replanta_push_subscription");
      if (!subscription || Notification.permission !== "granted") {
        return;
      }

      // For high priority notifications, send immediately
      if (
        notification.priority === "high" ||
        notification.priority === "urgent"
      ) {
        // Send via service worker messaging
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: "SHOW_NOTIFICATION",
            notification: {
              title: notification.title,
              body: notification.message,
              icon: "/icon-192.png",
              badge: "/badge-72.png",
              tag: notification.id,
              data: {
                notificationId: notification.id,
                actionUrl: notification.actionUrl,
                type: notification.type,
              },
              actions: notification.actionUrl
                ? [
                    {
                      action: "open",
                      title: notification.actionLabel || "Ver",
                    },
                  ]
                : undefined,
            },
          });
        } else {
          // Fallback to browser notification
          new Notification(notification.title, {
            body: notification.message,
            icon: "/icon-192.png",
            tag: notification.id,
          });
        }
      }
    } catch (error) {
      console.error("Error triggering push notification:", error);
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // ===============================
  // EMAIL NOTIFICATIONS
  // ===============================

  public async sendEmailNotification(
    emailData: EmailNotificationData,
  ): Promise<boolean> {
    try {
      // Validate email data
      if (!validateInput(emailData.to, "email")) {
        throw new Error("Invalid email address");
      }

      const response = await fetch("/api/notifications/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...emailData,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Email send failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("Email sent successfully:", result);

      return true;
    } catch (error) {
      console.error("Error sending email notification:", error);

      // Store failed emails for retry
      const failedEmails = JSON.parse(
        localStorage.getItem("replanta_failed_emails") || "[]",
      );
      failedEmails.push({
        ...emailData,
        timestamp: new Date().toISOString(),
        retryCount: 0,
      });
      localStorage.setItem(
        "replanta_failed_emails",
        JSON.stringify(failedEmails),
      );

      return false;
    }
  }

  // ===============================
  // PREDEFINED NOTIFICATION HELPERS
  // ===============================

  public async notifyProjectUpdate(
    projectId: string,
    projectName: string,
    status: "started" | "progress" | "completed" | "delayed" | "cancelled",
    clientEmail: string,
    collaboratorName: string,
  ): Promise<void> {
    const statusMessages: Record<typeof status, string> = {
      started: "foi iniciado",
      progress: "teve progresso atualizado",
      completed: "foi concluído",
      delayed: "teve o prazo adiado",
      cancelled: "foi cancelado",
    };

    // Add to notification system
    this.addNotification({
      title: `Projeto ${statusMessages[status]}`,
      message: `O projeto "${projectName}" ${statusMessages[status]} por ${collaboratorName}`,
      type: "project",
      priority: status === "completed" ? "high" : "medium",
      userRole: "client",
      projectId,
      projectName,
      status,
      actionUrl: `/client/dashboard?project=${projectId}`,
      actionLabel: "Ver Projeto",
    });

    // Send email notification
    await this.sendEmailNotification({
      to: clientEmail,
      subject: `ReplantaSystem: ${projectName} - ${statusMessages[status]}`,
      template: "project_update",
      priority: "normal",
      data: {
        projectName,
        status: statusMessages[status],
        collaboratorName,
        projectUrl: `${window.location.origin}/client/dashboard?project=${projectId}`,
      },
    });
  }

  public async notifyMaintenanceReminder(
    taskId: string,
    location: string,
    scheduledDate: Date,
    assignedTo: string,
    collaboratorEmail: string,
  ): Promise<void> {
    this.addNotification({
      title: "Manutenção Agendada",
      message: `Manutenção em ${location} agendada para ${scheduledDate.toLocaleDateString("pt-PT")}`,
      type: "maintenance",
      priority: "medium",
      userRole: "collaborator",
      taskId,
      location,
      scheduledDate,
      assignedTo,
      actionUrl: `/collaborator/dashboard?task=${taskId}`,
      actionLabel: "Ver Tarefa",
    });

    await this.sendEmailNotification({
      to: collaboratorEmail,
      subject: `ReplantaSystem: Manutenção agendada - ${location}`,
      template: "maintenance_reminder",
      priority: "normal",
      data: {
        location,
        scheduledDate: scheduledDate.toLocaleDateString("pt-PT"),
        taskUrl: `${window.location.origin}/collaborator/dashboard?task=${taskId}`,
      },
    });
  }

  public async notifySystemAlert(
    title: string,
    message: string,
    type: "info" | "success" | "warning" | "error",
    module: "auth" | "system" | "user" | "project" | "payment",
    priority: "low" | "medium" | "high" | "urgent" = "medium",
  ): Promise<void> {
    this.addNotification({
      title,
      message,
      type,
      priority,
      userRole: "admin",
      module,
      actionUrl: "/admin/dashboard",
      actionLabel: "Ver Painel",
    });
  }

  // ===============================
  // UTILITY METHODS
  // ===============================

  public getUnreadCount(userRole?: string): number {
    return this.getNotifications(userRole, true).length;
  }

  public async retryFailedOperations(): Promise<void> {
    // Retry failed email notifications
    const failedEmails = JSON.parse(
      localStorage.getItem("replanta_failed_emails") || "[]",
    );

    for (const email of failedEmails) {
      if (email.retryCount < 3) {
        const success = await this.sendEmailNotification(email);
        if (success) {
          const index = failedEmails.indexOf(email);
          failedEmails.splice(index, 1);
        } else {
          email.retryCount++;
        }
      }
    }

    localStorage.setItem(
      "replanta_failed_emails",
      JSON.stringify(failedEmails),
    );

    // Retry failed push subscriptions
    const failedSubscriptions = JSON.parse(
      localStorage.getItem("replanta_failed_subscriptions") || "[]",
    );

    for (const subscription of failedSubscriptions) {
      try {
        await this.sendSubscriptionToBackend(subscription);
        const index = failedSubscriptions.indexOf(subscription);
        failedSubscriptions.splice(index, 1);
      } catch (error) {
        console.error("Retry failed for subscription:", error);
      }
    }

    localStorage.setItem(
      "replanta_failed_subscriptions",
      JSON.stringify(failedSubscriptions),
    );
  }

  public exportNotifications(): string {
    return JSON.stringify(this.notifications, null, 2);
  }

  public clearAllNotifications(): void {
    this.notifications = [];
    this.saveNotifications();
    window.dispatchEvent(new CustomEvent("notifications-cleared"));
  }
}

// Singleton instance
export const notificationService = new NotificationService();

// React hook for using notifications
export function useNotifications(userRole?: string) {
  const [notifications, setNotifications] = useState<NotificationTypes[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const updateNotifications = () => {
      const allNotifications = notificationService.getNotifications(userRole);
      const unread = notificationService.getUnreadCount(userRole);

      setNotifications(allNotifications);
      setUnreadCount(unread);
    };

    // Initial load
    updateNotifications();

    // Listen for real-time updates
    const handleNotificationAdded = () => updateNotifications();
    const handleNotificationRead = () => updateNotifications();
    const handleNotificationsCleared = () => updateNotifications();

    window.addEventListener("notification-added", handleNotificationAdded);
    window.addEventListener("notification-read", handleNotificationRead);
    window.addEventListener("notifications-all-read", handleNotificationRead);
    window.addEventListener(
      "notifications-cleared",
      handleNotificationsCleared,
    );

    return () => {
      window.removeEventListener("notification-added", handleNotificationAdded);
      window.removeEventListener("notification-read", handleNotificationRead);
      window.removeEventListener(
        "notifications-all-read",
        handleNotificationRead,
      );
      window.removeEventListener(
        "notifications-cleared",
        handleNotificationsCleared,
      );
    };
  }, [userRole]);

  const markAsRead = (notificationId: string) => {
    notificationService.markAsRead(notificationId);
  };

  const markAllAsRead = () => {
    notificationService.markAllAsRead(userRole);
  };

  const deleteNotification = (notificationId: string) => {
    notificationService.deleteNotification(notificationId);
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}

export default notificationService;
