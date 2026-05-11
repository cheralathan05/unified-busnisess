// auto-generated
import dotenv from "dotenv";

dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",

  PORT: Number(process.env.PORT) || 5000,

  DATABASE_URL: process.env.DATABASE_URL!,

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET!,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "7d",

  EMAIL_HOST: process.env.EMAIL_HOST!,
  EMAIL_PORT: Number(process.env.EMAIL_PORT) || 587,
  EMAIL_USER: process.env.EMAIL_USER!,
  EMAIL_PASS: process.env.EMAIL_PASS!,
  EMAIL_FROM: process.env.EMAIL_FROM!,

  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",

  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  TWILIO_WHATSAPP_FROM: process.env.TWILIO_WHATSAPP_FROM,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
  GOOGLE_CALENDAR_ID: process.env.GOOGLE_CALENDAR_ID || "primary",
  GOOGLE_CALENDAR_ACCESS_TOKEN: process.env.GOOGLE_CALENDAR_ACCESS_TOKEN,
  GOOGLE_REFRESH_TOKEN: process.env.GOOGLE_REFRESH_TOKEN,
  ZOOM_ACCESS_TOKEN: process.env.ZOOM_ACCESS_TOKEN,
  ZOOM_CLIENT_ID: process.env.ZOOM_CLIENT_ID,
  ZOOM_CLIENT_SECRET: process.env.ZOOM_CLIENT_SECRET,
  ZOOM_ACCOUNT_ID: process.env.ZOOM_ACCOUNT_ID,
  ADMIN_NOTIFICATION_EMAILS: process.env.ADMIN_NOTIFICATION_EMAILS,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  CLOUDINARY_FOLDER: process.env.CLOUDINARY_FOLDER || "digital-brain",
  OCR_PROVIDER: process.env.OCR_PROVIDER || "mock",

  OLLAMA_URL: process.env.OLLAMA_URL || "http://localhost:11434/api/generate",
  OLLAMA_MODEL: process.env.OLLAMA_MODEL || "llama3",
  OLLAMA_MODEL_TEXT: process.env.OLLAMA_MODEL_TEXT || "llama3",
  OLLAMA_MODEL_CLASSIFIER: process.env.OLLAMA_MODEL_CLASSIFIER || "llama3",
  OLLAMA_MODEL_REASONING: process.env.OLLAMA_MODEL_REASONING || "llama3",
  OLLAMA_TIMEOUT_MS: Number(process.env.OLLAMA_TIMEOUT_MS) || 30000,

  WEBAUTHN_RP_NAME: process.env.WEBAUTHN_RP_NAME || "Digital Brain",
  WEBAUTHN_RP_ID: process.env.WEBAUTHN_RP_ID || "localhost",
  WEBAUTHN_ORIGIN: process.env.WEBAUTHN_ORIGIN || "http://localhost:3000",
};