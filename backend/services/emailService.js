import nodemailer from 'nodemailer';
import logger from '../config/logger.js';

let transporter;

const getTransporter = async () => {
  if (transporter) return transporter;

  // Use SMTP settings from environment variables if present
  if (process.env.SMTP_HOST && process.env.SMTP_PORT) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    return transporter;
  }

  // Fallback: Create ethereal test account for local testing
  try {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass, // generated ethereal password
      },
    });
    logger.info(`Initialized Ethereal Test Email account: ${testAccount.user}`);
    return transporter;
  } catch (error) {
    logger.error('Failed to initialize Ethereal test email account. Mocking transporter instead.');
    // Ultra fallback: mock transporter that logs to console
    transporter = {
      sendMail: async (options) => {
        logger.info(`[MOCK EMAIL] To: ${options.to} | Subject: ${options.subject} | Text: ${options.text}`);
        return { messageId: 'mock-id', previewUrl: 'http://localhost:5000/mock-email-preview' };
      }
    };
    return transporter;
  }
};

export const sendEmailNotification = async ({ to, subject, html, text }) => {
  try {
    const client = await getTransporter();
    const info = await client.sendMail({
from: `"MerchantAI Assistant" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text: text || subject,
      html,
    });

    logger.info(`Email sent successfully: ${info.messageId}`);
    
    // Log ethereal preview URL if available
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      logger.info(`📧 Ethereal Email Preview URL: ${previewUrl}`);
    }
    
    return info;
  } catch (error) {
    logger.error('Failed to dispatch notification email:', error);
  }
};

export const sendCampaignLaunchEmail = async (userEmail, campaignTitle, discount, duration) => {
  const subject = `🚀 Promotion Activated: ${campaignTitle}`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 12px; background-color: #fcfcfc;">
      <h2 style="color: #6B21A8;">MerchantAI Campaign Activation Alert</h2>
      <p>Hello,</p>
      <p>We are writing to confirm that the campaign <strong>"${campaignTitle}"</strong> has been successfully launched.</p>
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 5px 0; color: #6b7280; font-size: 14px;">Campaign Title</td>
            <td style="padding: 5px 0; font-weight: bold; text-align: right;">${campaignTitle}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #6b7280; font-size: 14px;">Discount Applied</td>
            <td style="padding: 5px 0; font-weight: bold; color: #eab308; text-align: right;">${discount}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #6b7280; font-size: 14px;">Duration Limit</td>
            <td style="padding: 5px 0; font-weight: bold; text-align: right;">${duration} Days</td>
          </tr>
        </table>
      </div>
      <p>Your dashboard telemetry has updated to reflect active transaction tracking.</p>
      <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;" />
      <span style="color: #9ca3af; font-size: 11px;">Powered by MerchantAI Growth Engine.</span>
    </div>
  `;
  return sendEmailNotification({ to: userEmail, subject, html });
};
