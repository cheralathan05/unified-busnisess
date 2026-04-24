# AI Project Factory

Frontend lives at the repo root. The new Prisma-backed auth API lives in `backend/`.

## Run locally

1. Install frontend dependencies at the repo root with `npm install` if needed.
2. Install backend dependencies with `npm install` inside `backend/`.
3. Set backend env values from `backend/.env.example` and start the backend with `npm run dev` inside `backend/`.
4. Start the frontend with `npm run dev` at the repo root.

## Auth flow

- Sign up creates a real user record in Prisma.
- Login verifies the password against the backend and stores a signed session token.
- First successful login routes the user to company setup.
- Forgot password sends a one-time code to email, then lets the user set a new password.
