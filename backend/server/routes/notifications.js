// Notification API Routes for ReplantaSystem
const express = require("express");
const router = express.Router();
const emailService = require("../services/emailService");
const {
  authenticateJWT,
  requireRole,
  validateInput,
  rateLimits,
} = require("../middleware/security");

// In-memory storage for demo - in production, use database
const pushSubscriptions = new Map();
const notificationHistory = [];

// ===============================
// PUSH NOTIFICATION ENDPOINTS
// ===============================

// Subscribe to push notifications
router.post(
  "/subscribe",
  rateLimits.auth,
  authenticateJWT,
  async (req, res) => {
    try {
      const { endpoint, keys, deviceInfo } = req.body;
      const userId = req.user.id;
      const userRole = req.user.role;

      // Validate subscription data
      if (
        typeof endpoint !== "string" ||
        !keys ||
        typeof keys.p256dh !== "string" ||
        typeof keys.auth !== "string"
      ) {
        return res.status(400).json({
          error: "Invalid subscription data",
        });
      }

      // Store subscription
      const subscriptionData = {
        endpoint,
        keys,
        userId,
        userRole,
        deviceInfo: {
          ...(typeof deviceInfo === "object" ? deviceInfo : {}),
          subscribedAt: new Date().toISOString(),
        },
      };

      pushSubscriptions.set(userId, subscriptionData);

      console.log(`Push subscription stored for user ${userId}`);

      res.json({
        success: true,
        message: "Subscription stored successfully",
      });
    } catch (error) {
      console.error("Error storing push subscription:", error);
      res.status(500).json({
        error: "Failed to store subscription",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  },
);

// Unsubscribe from push notifications
router.delete("/subscribe", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(401).json({
        error: "Usuário não autenticado",
      });
    }
    if (pushSubscriptions.has(userId)) {
      pushSubscriptions.delete(userId);
      console.log(`Push subscription removed for user ${userId}`);
    }
    res.json({
      success: true,
      message: "Unsubscribed successfully",
    });
  } catch (error) {
    console.error("Error removing push subscription:", error);
    res.status(500).json({
      error: "Failed to unsubscribe",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// Send push notification (admin only)
router.post(
  "/push",
  rateLimits.admin,
  authenticateJWT,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { userId, title, body, data, priority } = req.body;

      // Validate input
      if (typeof title !== "string" || typeof body !== "string" || !title || !body) {
        return res.status(400).json({
          error: "Title and body are required",
        });
      }
      if (typeof userId !== "string" || !userId) {
        return res.status(400).json({
          error: "UserId is required",
        });
      }

      const subscription = pushSubscriptions.get(userId);
      if (!subscription) {
        return res.status(404).json({
          error: "User not subscribed to push notifications",
        });
      }

      // In production, use a proper push service like Firebase or OneSignal
      // For now, we'll simulate sending and store for service worker pickup
      const notification = {
        id: `push_${Date.now()}`,
        type: "push",
        userId,
        title,
        body,
        data: typeof data === "object" ? data : {},
        priority: priority || "normal",
        timestamp: new Date().toISOString(),
        delivered: false,
      };

      notificationHistory.push(notification);

      console.log("Push notification queued:", notification);

      res.json({
        success: true,
        notificationId: notification.id,
        message: "Push notification sent",
      });
    } catch (error) {
      console.error("Error sending push notification:", error);
      res.status(500).json({
        error: "Failed to send push notification",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  },
);

// ===============================
// EMAIL NOTIFICATION ENDPOINTS
// ===============================

// Send email notification
router.post("/email", rateLimits.default, authenticateJWT, async (req, res) => {
  try {
    const { to, subject, template, data, priority, sendAt } = req.body;

    // Validate email data
    if (!to || !subject || !template) {
      return res.status(400).json({
        error: "Missing required email data",
      });
    }

    if (!validateInput(to, "email")) {
      return res.status(400).json({
        error: "Invalid email address",
      });
    }

    // Check user permissions for sending emails
    const userRole = req.user.role;
    if (userRole !== "admin" && userRole !== "collaborator") {
      // Clients can only send emails to themselves
      if (to !== req.user.email) {
        return res.status(403).json({
          error: "Insufficient permissions to send email to this address",
        });
      }
    }

    const emailData = {
      to,
      subject,
      template,
      data: data || {},
      priority: priority || "normal",
      sendAt,
    };

    const result = await emailService.sendEmail(emailData);

    if (result.success) {
      // Log email activity
      notificationHistory.push({
        id: `email_${Date.now()}`,
        type: "email",
        to,
        subject,
        template,
        sentBy: req.user.id,
        timestamp: result.timestamp,
        messageId: result.messageId,
      });

      res.json({
        success: true,
        messageId: result.messageId,
        message: "Email sent successfully",
      });
    } else {
      res.status(500).json({
        error: "Failed to send email",
        details: result.error,
      });
    }
  } catch (error) {
    console.error("Error in email endpoint:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});

// Send bulk emails (admin only)
router.post(
  "/email/bulk",
  rateLimits.admin,
  authenticateJWT,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { emails } = req.body;

      if (!Array.isArray(emails) || emails.length === 0) {
        return res.status(400).json({
          error: "Invalid email list",
        });
      }

      if (emails.length > 100) {
        return res.status(400).json({
          error: "Bulk email limit exceeded (max 100)",
        });
      }

      const results = await emailService.sendBulkEmails(emails);

      const successCount = results.filter(
        (r) => r.status === "fulfilled",
      ).length;
      const failureCount = results.length - successCount;

      res.json({
        success: true,
        total: results.length,
        sent: successCount,
        failed: failureCount,
        message: `Bulk email operation completed: ${successCount} sent, ${failureCount} failed`,
      });
    } catch (error) {
      console.error("Error in bulk email endpoint:", error);
      res.status(500).json({
        error: "Bulk email operation failed",
        details: error.message,
      });
    }
  },
);

// ===============================
// PREDEFINED NOTIFICATION ENDPOINTS
// ===============================

// Send project update notification
router.post(
  "/project-update",
  rateLimits.default,
  authenticateJWT,
  requireRole(["admin", "collaborator"]),
  async (req, res) => {
    try {
      const { projectId, projectName, clientEmail, status, collaboratorName } =
        req.body;

      if (!projectId || !projectName || !clientEmail || !status) {
        return res.status(400).json({
          error: "Missing required project update data",
        });
      }

      const projectUrl = `${req.protocol}://${req.get("host")}/client/dashboard?project=${projectId}`;

      const result = await emailService.sendProjectUpdateEmail(
        clientEmail,
        projectName,
        status,
        collaboratorName || req.user.name,
        projectUrl,
      );

      if (result.success) {
        res.json({
          success: true,
          message: "Project update notification sent",
        });
      } else {
        res.status(500).json({
          error: "Failed to send project update notification",
          details: result.error,
        });
      }
    } catch (error) {
      console.error("Error sending project update:", error);
      res.status(500).json({
        error: "Failed to send project update",
        details: error.message,
      });
    }
  },
);

// Send maintenance reminder
router.post(
  "/maintenance-reminder",
  rateLimits.default,
  authenticateJWT,
  requireRole(["admin", "collaborator"]),
  async (req, res) => {
    try {
      const { collaboratorEmail, location, scheduledDate, taskDetails } =
        req.body;

      if (!collaboratorEmail || !location || !scheduledDate) {
        return res.status(400).json({
          error: "Missing required maintenance reminder data",
        });
      }

      const result = await emailService.sendMaintenanceReminder(
        collaboratorEmail,
        location,
        scheduledDate,
        taskDetails || "Tarefa de manutenção geral",
      );

      if (result.success) {
        res.json({
          success: true,
          message: "Maintenance reminder sent",
        });
      } else {
        res.status(500).json({
          error: "Failed to send maintenance reminder",
          details: result.error,
        });
      }
    } catch (error) {
      console.error("Error sending maintenance reminder:", error);
      res.status(500).json({
        error: "Failed to send maintenance reminder",
        details: error.message,
      });
    }
  },
);

// Send welcome email
router.post(
  "/welcome",
  rateLimits.default,
  authenticateJWT,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { userEmail, userName, userRole } = req.body;

      if (!userEmail || !userName || !userRole) {
        return res.status(400).json({
          error: "Missing required welcome email data",
        });
      }

      const result = await emailService.sendWelcomeEmail(
        userEmail,
        userName,
        userRole,
      );

      if (result.success) {
        res.json({
          success: true,
          message: "Welcome email sent",
        });
      } else {
        res.status(500).json({
          error: "Failed to send welcome email",
          details: result.error,
        });
      }
    } catch (error) {
      console.error("Error sending welcome email:", error);
      res.status(500).json({
        error: "Failed to send welcome email",
        details: error.message,
      });
    }
  },
);

// ===============================
// NOTIFICATION HISTORY & TRACKING
// ===============================

// Get notification history (admin only)
router.get("/history", authenticateJWT, requireRole("admin"), (req, res) => {
  try {
    const { limit = 50, offset = 0, type } = req.query;

    let filteredHistory = notificationHistory;

    if (type) {
      filteredHistory = notificationHistory.filter((n) => n.type === type);
    }

    const paginatedHistory = filteredHistory
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    res.json({
      success: true,
      notifications: paginatedHistory,
      total: filteredHistory.length,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error("Error fetching notification history:", error);
    res.status(500).json({
      error: "Failed to fetch notification history",
      details: error.message,
    });
  }
});

// Track notification interactions
router.post("/track", async (req, res) => {
  try {
    const { notificationId, action, timestamp } = req.body;

    if (!notificationId || !action) {
      return res.status(400).json({
        error: "Missing tracking data",
      });
    }

    // Find and update notification
    const notification = notificationHistory.find(
      (n) => n.id === notificationId,
    );

    if (notification) {
      if (!notification.interactions) {
        notification.interactions = [];
      }

      notification.interactions.push({
        action,
        timestamp: timestamp || new Date().toISOString(),
      });

      console.log(`Notification ${notificationId} action: ${action}`);
    }

    res.json({
      success: true,
      message: "Interaction tracked",
    });
  } catch (error) {
    console.error("Error tracking notification:", error);
    res.status(500).json({
      error: "Failed to track notification",
      details: error.message,
    });
  }
});

// Test email connection (admin only)
router.get(
  "/test-email",
  authenticateJWT,
  requireRole("admin"),
  async (req, res) => {
    try {
      const result = await emailService.testEmailConnection();
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  },
);

// Retry failed notifications
router.post("/retry", rateLimits.default, authenticateJWT, async (req, res) => {
  try {
    const { notificationData } = req.body;

    // This would typically retry failed email/push notifications
    // Implementation depends on your retry logic and storage

    res.json({
      success: true,
      message: "Retry operation completed",
    });
  } catch (error) {
    console.error("Error retrying notification:", error);
    res.status(500).json({
      error: "Retry operation failed",
      details: error.message,
    });
  }
});

// Get notification statistics (admin only)
router.get("/stats", authenticateJWT, requireRole("admin"), (req, res) => {
  try {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const stats = {
      total: notificationHistory.length,
      last24h: notificationHistory.filter(
        (n) => new Date(n.timestamp) > last24h,
      ).length,
      last7d: notificationHistory.filter((n) => new Date(n.timestamp) > last7d)
        .length,
      byType: {
        email: notificationHistory.filter((n) => n.type === "email").length,
        push: notificationHistory.filter((n) => n.type === "push").length,
      },
      subscriptions: {
        total: pushSubscriptions.size,
        byRole: Array.from(pushSubscriptions.values()).reduce((acc, sub) => {
          acc[sub.userRole] = (acc[sub.userRole] || 0) + 1;
          return acc;
        }, {}),
      },
    };

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Error fetching notification stats:", error);
    res.status(500).json({
      error: "Failed to fetch statistics",
      details: error.message,
    });
  }
});

module.exports = router;
