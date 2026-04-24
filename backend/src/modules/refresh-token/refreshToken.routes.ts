// auto-generated
// src/modules/refresh-token/refreshToken.routes.ts

import { Router } from "express";
import * as controller from "./refreshToken.controller";

const router = Router();

// Get new access token
router.post("/refresh", controller.refreshToken);

export default router;