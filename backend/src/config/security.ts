export const securityConfig = {
  password: {
    minLength: 8,
    maxLength: 128,
  },

  otp: {
    length: 6,
    expiresInMinutes: 10,
    maxAttempts: 5,
  },

  bruteForce: {
    maxAttempts: 5,
    blockTimeMinutes: 15,
  },

  session: {
    maxDevices: 5,
  },

  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 min
    maxRequests: 100,
  },
};