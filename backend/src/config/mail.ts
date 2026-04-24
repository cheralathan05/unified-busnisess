// auto-generated
import nodemailer from "nodemailer";
import { env } from "./env";

const requiredMailEnv = [
  "EMAIL_HOST",
  "EMAIL_PORT",
  "EMAIL_USER",
  "EMAIL_PASS",
  "EMAIL_FROM"
] as const;

function assertMailConfig() {
  const missing = requiredMailEnv.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`SMTP_NOT_CONFIGURED: missing ${missing.join(", ")}`);
  }
}

export const transporter = nodemailer.createTransport({
  host: env.EMAIL_HOST,
  port: env.EMAIL_PORT,
  secure: false,
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS,
  },
});

export const sendEmail = async ({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) => {
  assertMailConfig();

  const info = await transporter.sendMail({
    from: env.EMAIL_FROM,
    to,
    subject,
    html,
  });

  console.log(`📨 SMTP delivered message ${info.messageId} to ${to}`);
};