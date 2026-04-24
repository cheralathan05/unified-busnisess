import { eventBus } from "../../core/events/eventBus";
import { Events } from "../types/event.types";
import { sendEmail } from "../../config/mail";

eventBus.on(Events.USER_REGISTERED, async ({ email }) => {
  console.log("🎉 New user registered:", email);

  await sendEmail({
    to: email,
    subject: "Welcome to Digital Brain",
    html: "<h1>Welcome 🚀</h1>",
  });
});

eventBus.on(Events.PASSWORD_RESET_REQUESTED, async ({ email, otp }) => {
  await sendEmail({
    to: email,
    subject: "Reset your password",
    html: `<p>Your OTP is <b>${otp}</b></p>`,
  });
});

eventBus.on(Events.USER_LOGGED_IN, ({ userId, ip }) => {
  console.log(`✅ Login: ${userId} from ${ip}`);
});

eventBus.on(Events.FAILED_LOGIN, ({ email, ip }) => {
  console.warn(`❌ Failed login: ${email} from ${ip}`);
});