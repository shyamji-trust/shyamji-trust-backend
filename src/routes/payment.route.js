import { Router } from "express";
import { createOrder, verifyPayment, scanPayment, getReceipt } from "../controllers/payment.controller.js";

const router = Router();

router.post("/create-order", createOrder);
router.post("/verify", verifyPayment);
router.get("/receipt/:qrToken", getReceipt);
router.get("/scan/:qrToken", scanPayment);

export default router;
