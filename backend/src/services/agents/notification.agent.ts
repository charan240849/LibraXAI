import db from '../../db';
import { sendDueReminder, sendOverdueNotice } from '../../utils/mailer';
import { config } from '../../config';

interface LoanWithUser {
  id: number;
  user_id: number;
  book_id: number;
  due_at: string;
  status: string;
  email: string;
  full_name: string;
  book_title: string;
}

class NotificationAgent {
  /**
   * Find and send due soon reminders (books due within dueSoonDays)
   * Also send overdue notices and update loan status
   */
  async sendDueReminders(): Promise<{
    dueSoonSent: number;
    overdueSent: number;
    errors: number;
  }> {
    let dueSoonSent = 0;
    let overdueSent = 0;
    let errors = 0;

    const now = new Date();
    const dueSoonDate = new Date();
    dueSoonDate.setDate(dueSoonDate.getDate() + config.dueSoonDays);

    // Get all issued loans with user info
    const loans = db.prepare(`
      SELECT 
        l.id, l.user_id, l.book_id, l.due_at, l.status,
        u.email, u.full_name,
        b.title as book_title
      FROM loans l
      JOIN users u ON l.user_id = u.id
      JOIN books b ON l.book_id = b.id
      WHERE l.status = 'ISSUED'
    `).all() as LoanWithUser[];

    for (const loan of loans) {
      const dueDate = new Date(loan.due_at);
      
      // Check if overdue
      if (dueDate < now) {
        // Update status to OVERDUE
        db.prepare(`UPDATE loans SET status = 'OVERDUE' WHERE id = ?`).run(loan.id);

        // Send overdue notice
        const success = await this.createAndSendNotification(
          loan.user_id,
          'overdue',
          loan.email,
          loan.full_name,
          loan.book_title,
          dueDate.toLocaleDateString()
        );

        if (success) {
          overdueSent++;
        } else {
          errors++;
        }
      }
      // Check if due soon (within dueSoonDays days)
      else if (dueDate <= dueSoonDate) {
        const success = await this.createAndSendNotification(
          loan.user_id,
          'due_soon',
          loan.email,
          loan.full_name,
          loan.book_title,
          dueDate.toLocaleDateString()
        );

        if (success) {
          dueSoonSent++;
        } else {
          errors++;
        }
      }
    }

    return { dueSoonSent, overdueSent, errors };
  }

  /**
   * Create notification record and send email
   */
  private async createAndSendNotification(
    userId: number,
    type: 'due_soon' | 'overdue',
    email: string,
    fullName: string,
    bookTitle: string,
    dueDate: string
  ): Promise<boolean> {
    try {
      // Create notification record
      const payload = JSON.stringify({ bookTitle, dueDate });
      const result = db.prepare(`
        INSERT INTO notifications (user_id, type, channel, payload, scheduled_for, status)
        VALUES (?, ?, 'email', ?, CURRENT_TIMESTAMP, 'PENDING')
      `).run(userId, type, payload);

      const notificationId = result.lastInsertRowid;

      // Send email
      let success: boolean;
      if (type === 'overdue') {
        success = await sendOverdueNotice(email, fullName, bookTitle, dueDate);
      } else {
        success = await sendDueReminder(email, fullName, bookTitle, dueDate);
      }

      // Update notification status
      db.prepare(`
        UPDATE notifications 
        SET status = ?, sent_at = CASE WHEN ? = 'SENT' THEN CURRENT_TIMESTAMP ELSE NULL END
        WHERE id = ?
      `).run(success ? 'SENT' : 'FAILED', success ? 'SENT' : 'FAILED', notificationId);

      return success;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }
}

export const notificationAgent = new NotificationAgent();
