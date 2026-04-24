// src/events/index.ts

/**
 * 🔥 CENTRAL EVENT INITIALIZER
 * Import this ONCE in app.ts
 * This wires the entire system:
 * Auth + CRM + AI + Automation + Realtime
 */

// ======================
// CORE SYSTEM LISTENERS
// ======================
import "./listeners/auth.listener";
import "./listeners/user.listener";
import "./listeners/audit.listener";
import "./listeners/crmAutomation.listener";

// ======================
// CRM MODULE EVENTS
// ======================
import "../modules/lead/lead.events";
import "../modules/activity/activity.events";
import "../modules/payment/payment.events";
import "../modules/brain/brain.events";

// ======================
// SOCKET BRIDGE (OPTIONAL SEPARATION)
// ======================
import "../socket/socket.events";

// ======================
// EXPORT EVENT EMITTER
// ======================
export { eventBus } from "../core/events/eventBus";