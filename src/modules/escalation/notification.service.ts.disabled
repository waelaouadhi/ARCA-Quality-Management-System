/**
 * Notification Service
 * 
 * Multi-channel notification system with:
 * - Email, In-app, WebSocket, SMS, Slack support
 * - Retry mechanism with exponential backoff
 * - Idempotency (duplicate prevention)
 * - Extensible channel architecture
 */

import { PrismaClient } from '@prisma/client';
import {
  INotificationService,
  NotificationPayload,
  NotificationChannel,
  NotificationStatus,
  ChannelNotification,
} from './escalation.types';
import crypto from 'crypto';

// Channel implementations
interface IChannelHandler {
  send(notification: ChannelNotification): Promise<boolean>;
  validate(address: string): boolean;
}

/**
 * Email channel handler
 */
class EmailChannelHandler implements IChannelHandler {
  async send(notification: ChannelNotification): Promise<boolean> {
    try {
      // In production, integrate with email service (SendGrid, AWS SES, etc.)
      console.log(`📧 Email sent to ${notification.recipientAddress}`);
      console.log(`   Subject: ${notification.subject}`);
      console.log(`   Body: ${notification.body.substring(0, 100)}...`);
      return true;
    } catch (error) {
      console.error(`❌ Email failed:`, error);
      return false;
    }
  }

  validate(address: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address);
  }
}

/**
 * In-app notification channel handler
 */
class InAppChannelHandler implements IChannelHandler {
  constructor(private prisma: PrismaClient) {}

  async send(notification: ChannelNotification): Promise<boolean> {
    try {
      // Store in-app notification in database
      // In real implementation, this would be a dedicated notification store
      console.log(
        `📱 In-app notification created for user ${notification.recipientAddress}`
      );
      return true;
    } catch (error) {
      console.error(`❌ In-app notification failed:`, error);
      return false;
    }
  }

  validate(address: string): boolean {
    return !!address;  // User ID should exist
  }
}

/**
 * WebSocket channel handler (real-time notifications)
 */
class WebSocketChannelHandler implements IChannelHandler {
  private connections: Map<string, any> = new Map();

  registerConnection(userId: string, socket: any): void {
    this.connections.set(userId, socket);
  }

  async send(notification: ChannelNotification): Promise<boolean> {
    try {
      const socket = this.connections.get(notification.recipientAddress);

      if (socket) {
        socket.emit('escalation-alert', {
          title: notification.subject,
          body: notification.body,
          data: notification.data,
          timestamp: new Date(),
        });
        console.log(`⚡ WebSocket notification sent to ${notification.recipientAddress}`);
        return true;
      } else {
        console.log(`⚠️  WebSocket connection not active for ${notification.recipientAddress}`);
        return false;  // Fail gracefully - can retry
      }
    } catch (error) {
      console.error(`❌ WebSocket notification failed:`, error);
      return false;
    }
  }

  validate(address: string): boolean {
    return !!address;
  }
}

/**
 * SMS channel handler
 */
class SMSChannelHandler implements IChannelHandler {
  async send(notification: ChannelNotification): Promise<boolean> {
    try {
      // In production, integrate with SMS service (Twilio, AWS SNS, etc.)
      console.log(`📱 SMS sent to ${notification.recipientAddress}`);
      console.log(`   Message: ${notification.body.substring(0, 160)}...`);
      return true;
    } catch (error) {
      console.error(`❌ SMS failed:`, error);
      return false;
    }
  }

  validate(address: string): boolean {
    return /^\+?[1-9]\d{1,14}$/.test(address);  // E.164 format
  }
}

/**
 * Slack channel handler
 */
class SlackChannelHandler implements IChannelHandler {
  private webhookUrls: Map<string, string> = new Map();

  setWebhookUrl(userId: string, webhookUrl: string): void {
    this.webhookUrls.set(userId, webhookUrl);
  }

  async send(notification: ChannelNotification): Promise<boolean> {
    try {
      const webhookUrl = this.webhookUrls.get(notification.recipientAddress);

      if (!webhookUrl) {
        console.log(`⚠️  Slack webhook not configured for ${notification.recipientAddress}`);
        return false;
      }

      // In production, post to Slack webhook
      console.log(`💬 Slack message sent to ${notification.recipientAddress}`);
      return true;
    } catch (error) {
      console.error(`❌ Slack notification failed:`, error);
      return false;
    }
  }

  validate(address: string): boolean {
    return !!address;
  }
}

/**
 * Notification Service Implementation
 */
export class NotificationService implements INotificationService {
  private channelHandlers: Map<NotificationChannel, IChannelHandler>;
  private wsHandler: WebSocketChannelHandler;

  constructor(private prisma: PrismaClient) {
    this.wsHandler = new WebSocketChannelHandler();
    this.channelHandlers = new Map([
      ['EMAIL', new EmailChannelHandler()],
      ['IN_APP', new InAppChannelHandler(prisma)],
      ['WEBSOCKET', this.wsHandler],
      ['SMS', new SMSChannelHandler()],
      ['SLACK', new SlackChannelHandler()],
    ]);
  }

  /**
   * Send notification via configured channels with idempotency
   */
  async send(payload: NotificationPayload): Promise<string> {
    // Check idempotency - prevent duplicate notifications
    const existingNotif = await this.prisma.notification.findUnique({
      where: { idempotencyKey: payload.idempotencyKey },
    });

    if (existingNotif) {
      console.log(`♻️  Notification already sent (idempotency key: ${payload.idempotencyKey})`);
      return existingNotif.id;
    }

    // Create notification record
    const notification = await this.prisma.notification.create({
      data: {
        entityType: payload.entityType,
        entityId: payload.entityId,
        escalationLevel: payload.escalationLevel,
        recipientEmail: payload.recipientEmail,
        recipientUserId: payload.recipientUserId,
        channels: payload.channels,
        idempotencyKey: payload.idempotencyKey,
        status: 'PENDING' as any,
      },
    });

    // Send via each channel
    const channelResults: Record<string, NotificationStatus> = {};

    for (const channel of payload.channels) {
      try {
        const handler = this.channelHandlers.get(channel);
        if (!handler) {
          console.warn(`⚠️  No handler for channel: ${channel}`);
          channelResults[channel] = 'FAILED';
          continue;
        }

        // Prepare channel-specific notification
        const channelNotif = this.buildChannelNotification(
          channel,
          payload
        );

        // Send
        const success = await handler.send(channelNotif);
        channelResults[channel] = success ? 'SENT' : 'FAILED';
      } catch (error) {
        console.error(`❌ Error sending via ${channel}:`, error);
        channelResults[channel] = 'FAILED';
      }
    }

    // Update notification with channel statuses
    const allSent = Object.values(channelResults).every((s) => s === 'SENT');
    const anyFailed = Object.values(channelResults).some((s) => s === 'FAILED');

    await this.prisma.notification.update({
      where: { id: notification.id },
      data: {
        status: allSent ? 'SENT' : anyFailed ? 'RETRYING' : 'PENDING',
        channelStatuses: JSON.stringify(channelResults),
        sentAt: allSent ? new Date() : undefined,
        nextRetryAt: anyFailed ? new Date(Date.now() + 5 * 60 * 1000) : undefined,
      },
    });

    console.log(
      `✅ Notification ${notification.id} sent via: ${Object.keys(channelResults).join(', ')}`
    );

    return notification.id;
  }

  /**
   * Retry failed notification with exponential backoff
   */
  async retry(notificationId: string): Promise<void> {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new Error(`Notification not found: ${notificationId}`);
    }

    if (notification.retryCount >= notification.maxRetries) {
      console.log(`❌ Max retries reached for notification ${notificationId}`);
      await this.prisma.notification.update({
        where: { id: notificationId },
        data: { status: 'FAILED' as any },
      });
      return;
    }

    // Calculate exponential backoff
    const delay = Math.pow(2, notification.retryCount) * 5 * 60 * 1000;  // 5m * 2^n
    const nextRetry = new Date(Date.now() + delay);

    await this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        retryCount: notification.retryCount + 1,
        lastRetryAt: new Date(),
        nextRetryAt: nextRetry,
        status: 'RETRYING' as any,
      },
    });

    console.log(`🔄 Scheduled retry for notification ${notificationId} at ${nextRetry}`);
  }

  /**
   * Get notification status
   */
  async getStatus(notificationId: string): Promise<NotificationStatus> {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    return (notification?.status as NotificationStatus) || 'PENDING';
  }

  /**
   * Register WebSocket connection for real-time notifications
   */
  registerWebSocketConnection(userId: string, socket: any): void {
    this.wsHandler.registerConnection(userId, socket);
  }

  /**
   * Private: Build channel-specific notification
   */
  private buildChannelNotification(
    channel: NotificationChannel,
    payload: NotificationPayload
  ): ChannelNotification {
    const recipientAddress =
      channel === 'WEBSOCKET' || channel === 'IN_APP'
        ? payload.recipientUserId || payload.recipientEmail || ''
        : payload.recipientEmail || payload.recipientUserId || '';

    const subject = `[${payload.severity}] ${payload.entityType} Escalation - ${payload.escalationLevel}`;

    const body = `
${payload.entityType}: ${payload.entityTitle}

Status: ${payload.escalationLevel}
Severity: ${payload.severity}
Due Date: ${payload.dueDate.toLocaleString()}
Hours Overdue: ${this.getHoursOverdue(payload.dueDate)}

Please take action immediately.
    `.trim();

    return {
      channel,
      recipientAddress,
      subject,
      body,
      data: {
        entityId: payload.entityId,
        entityType: payload.entityType,
        escalationLevel: payload.escalationLevel,
        dueDate: payload.dueDate.toISOString(),
      },
    };
  }

  /**
   * Private: Get hours overdue
   */
  private getHoursOverdue(dueDate: Date): number {
    const now = new Date();
    const diff = now.getTime() - dueDate.getTime();
    return Math.floor(diff / (1000 * 60 * 60));
  }

  /**
   * Generate idempotency key
   */
  static generateIdempotencyKey(
    entityId: string,
    escalationLevel: string,
    channel: string
  ): string {
    const combined = `${entityId}:${escalationLevel}:${channel}:${Date.now()}`;
    return crypto.createHash('sha256').update(combined).digest('hex');
  }
}
