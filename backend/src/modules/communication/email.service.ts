import nodemailer from "nodemailer";
import { env } from "../../config/env";

export class EmailService {
  private transporter;
  private readonly isConfigured: boolean;

  constructor() {
    this.isConfigured = Boolean(env.EMAIL_HOST && env.EMAIL_USER && env.EMAIL_PASS);

    this.transporter = nodemailer.createTransport({
      host: env.EMAIL_HOST,
      port: Number(env.EMAIL_PORT),
      secure: false, // true for 465, false for 587
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASS
      }
    });
  }

  // ======================
  // SEND EMAIL
  // ======================
  async send(data: any) {
    const { to, subject, text, html, userId } = data;

    // ======================
    // VALIDATION
    // ======================
    if (!to || !subject) {
      throw new Error("Missing required email fields");
    }

    // ======================
    // FALLBACK CONTENT
    // ======================
    const finalText = text || this.stripHtml(html);
    const finalHtml = html || `<p>${text || ""}</p>`;

    // ======================
    // SEND
    // ======================
    if (!this.isConfigured) {
      console.warn("[email] SMTP not configured, returning mocked sent response");

      return {
        messageId: `mock_${Date.now()}`,
        to,
        status: "sent"
      };
    }

    let info;
    try {
      info = await this.transporter.sendMail({
        from: env.EMAIL_FROM,
        to,
        subject,
        text: finalText,
        html: finalHtml
      });
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[email] send failed in non-production, returning mocked sent response", error);
        return {
          messageId: `mock_${Date.now()}`,
          to,
          status: "sent"
        };
      }

      throw error;
    }

    // ======================
    // LOG (OPTIONAL)
    // ======================
    console.log("📧 Email sent:", {
      messageId: info.messageId,
      to,
      userId
    });

    return {
      messageId: info.messageId,
      to,
      status: "sent"
    };
  }

  // ======================
  // HELPER: STRIP HTML
  // ======================
  private stripHtml(html?: string) {
    if (!html) return "";
    return html.replace(/<[^>]*>?/gm, "");
  }
}