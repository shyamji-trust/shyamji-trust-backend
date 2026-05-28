import { Router } from "express";
import { createOrder, verifyPayment, scanPayment } from "../controllers/payment.controller.js";

const router = Router();

router.post("/create-order", createOrder);
router.post("/verify", verifyPayment);
router.get("/scan/:qrToken", scanPayment);

export default router;
