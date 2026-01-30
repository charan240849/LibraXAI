import nodemailer from 'nodemailer';
import { config } from '../config';

// Create transporter for Mailhog
const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: false, // Mailhog doesn't use TLS
});

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: config.smtp.from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
    console.log(`Email sent to ${options.to}: ${options.subject}`);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

export async function sendDueReminder(
  to: string,
  fullName: string,
  bookTitle: string,
  dueDate: string
): Promise<boolean> {
  return sendEmail({
    to,
    subject: `Reminder: "${bookTitle}" is due soon`,
    html: `
      <h2>Library Due Date Reminder</h2>
      <p>Dear ${fullName},</p>
      <p>This is a friendly reminder that the following book is due soon:</p>
      <ul>
        <li><strong>Book:</strong> ${bookTitle}</li>
        <li><strong>Due Date:</strong> ${dueDate}</li>
      </ul>
      <p>Please return or renew the book before the due date to avoid overdue charges.</p>
      <p>Thank you,<br>Library Management System</p>
    `,
  });
}

export async function sendOverdueNotice(
  to: string,
  fullName: string,
  bookTitle: string,
  dueDate: string
): Promise<boolean> {
  return sendEmail({
    to,
    subject: `OVERDUE: "${bookTitle}" - Please Return Immediately`,
    html: `
      <h2>Overdue Book Notice</h2>
      <p>Dear ${fullName},</p>
      <p>The following book is now <strong>OVERDUE</strong>:</p>
      <ul>
        <li><strong>Book:</strong> ${bookTitle}</li>
        <li><strong>Due Date:</strong> ${dueDate}</li>
      </ul>
      <p>Please return the book as soon as possible.</p>
      <p>Thank you,<br>Library Management System</p>
    `,
  });
}
