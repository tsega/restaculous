import express from "express";

import * as users from "../controllers/users.js";
import { requireAuthentication } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validate-request.js";
import {
  idValidator,
  loginValidator,
  registerValidator,
  updateValidator
} from "./validators/user.js";

const router = express.Router();

router.post("/", registerValidator, validateRequest, users.createUser);
router.post("/login", loginValidator, validateRequest, users.loginUser);
router.get("/search", requireAuthentication, users.searchUsers);
router.get("/me", requireAuthentication, users.getCurrentUser);
router.get("/:userId", requireAuthentication, idValidator, validateRequest, users.getUser);
router.put("/:userId", requireAuthentication, updateValidator, validateRequest, users.updateUser);
router.delete("/:userId", requireAuthentication, idValidator, validateRequest, users.removeUser);

export default router;
