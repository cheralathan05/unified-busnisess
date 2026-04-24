// auto-generated
// src/modules/social-auth/google.strategy.ts

import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { handleSocialLogin } from "./socialAuth.service";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/auth/google/callback",
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const user = await handleSocialLogin({
          email: profile.emails?.[0]?.value!,
          name: profile.displayName,
          provider: "google",
          providerId: profile.id,
        });

        done(null, user);
      } catch (err) {
        done(err, null);
      }
    }
  )
);