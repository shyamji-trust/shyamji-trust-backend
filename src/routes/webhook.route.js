import express, { Router } from "express";
import { handleWebhook } from "../controllers/webhook.controller.js";

const router = Router();

router.post("/",
    express.raw({ type: "application/json" }),
    handleWebhook
);

export default router;