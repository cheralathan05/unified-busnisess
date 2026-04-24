// auto-generated
// src/modules/social-auth/github.strategy.ts

import passport from "passport";
import { Strategy as GitHubStrategy } from "passport-github2";
import { handleSocialLogin } from "./socialAuth.service";

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      callbackURL: "/api/auth/github/callback",
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const user = await handleSocialLogin({
          email: profile.emails?.[0]?.value || "",
          name: profile.username || "GitHub User",
          provider: "github",
          providerId: profile.id,
        });

        done(null, user);
      } catch (err) {
        done(err, null);
      }
    }
  )
);