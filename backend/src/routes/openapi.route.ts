import { Router } from "express";

const router = Router();

const spec = {
  openapi: "3.0.3",
  info: {
    title: "Digital Nexus AI CRM API",
    version: "1.0.0",
    description: "Event-driven autonomous CRM backend"
  },
  servers: [{ url: "/api" }],
  tags: [
    { name: "Auth" },
    { name: "Leads" },
    { name: "Deals" },
    { name: "AI" },
    { name: "Email" },
    { name: "WhatsApp" },
    { name: "Meetings" },
    { name: "Payments" },
    { name: "Invoices" },
    { name: "Notifications" },
    { name: "Analytics" }
  ],
  paths: {
    "/auth/login": { post: { tags: ["Auth"], summary: "Login with email/password" } },
    "/auth/forgot-password": { post: { tags: ["Auth"], summary: "Send reset OTP" } },
    "/leads": {
      get: { tags: ["Leads"], summary: "List leads" },
      post: { tags: ["Leads"], summary: "Create lead" }
    },
    "/deals": { get: { tags: ["Deals"], summary: "Get pipeline/deals" } },
    "/ai/suggestions": { get: { tags: ["AI"], summary: "Get AI suggestions" } },
    "/email/send": { post: { tags: ["Email"], summary: "Send email" } },
    "/whatsapp/send": { post: { tags: ["WhatsApp"], summary: "Send WhatsApp" } },
    "/meetings/create": { post: { tags: ["Meetings"], summary: "Create CRM meeting with provider link + notifications" } },
    "/meetings/schedule": { post: { tags: ["Meetings"], summary: "Schedule meeting" } },
    "/payments": {
      get: { tags: ["Payments"], summary: "List payments" },
      post: { tags: ["Payments"], summary: "Create payment" }
    },
    "/payments/proof/verify": {
      post: {
        tags: ["Payments"],
        summary: "Upload and AI-verify payment proof (OCR + fraud checks)"
      }
    },
    "/payments/invoice": {
      post: { tags: ["Invoices"], summary: "Create invoice for lead/deal" }
    },
    "/payments/reminder": {
      post: { tags: ["Notifications"], summary: "Send payment reminder" }
    },
    "/invoices": { post: { tags: ["Invoices"], summary: "Create invoice" } },
    "/notifications": { post: { tags: ["Notifications"], summary: "Send notification" } },
    "/analytics/dashboard": { get: { tags: ["Analytics"], summary: "Dashboard metrics" } }
  }
};

router.get("/openapi.json", (_req, res) => {
  res.json(spec);
});

router.get("/swagger", (_req, res) => {
  res.status(200).send(`
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Digital Nexus API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.onload = function () {
        window.SwaggerUIBundle({
          url: '/api/docs/openapi.json',
          dom_id: '#swagger-ui'
        });
      };
    </script>
  </body>
</html>
  `);
});

export default router;
