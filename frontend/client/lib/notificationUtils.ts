import { Bell, BellRing } from "lucide-react";
import type { NotificationTypes } from "../services/notificationService";

export function getNotificationIcon(type: string, priority?: string) {
  // Example: return different icons based on type/priority
  if (type === "project") {
    return BellRing;
  }
  return Bell;
}

export function getPriorityColor(priority?: string) {
  switch (priority) {
    case "high":
      return "bg-red-500";
    case "medium":
      return "bg-yellow-500";
    case "low":
      return "bg-green-500";
    default:
      return "bg-gray-300";
  }
}

export function formatTimestamp(timestamp: string | number | Date) {
  const date = new Date(timestamp);
  return date.toLocaleString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
