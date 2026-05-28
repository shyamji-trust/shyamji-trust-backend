import { createOrderService, verifyPaymentService, scanPaymentService } from "../services/payment.service.js";
import { handleWebhook } from "./webhook.controller.js";

export const createOrder = async (req, res) => {
  try {
    const { customer_id, total_amount } = req.body;

    if (!customer_id)
      return res.status(400).json({ error: "customer_id is required" });
    if (!total_amount || Number(total_amount) <= 0)
      return res.status(400).json({ error: "Valid total_amount is required" });

    const result = await createOrderService(customer_id, Number(total_amount));
    return res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error("Error in createOrder controller:", error);
    return res.status(500).json({ error: error.message || "Failed to create order" });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: "razorpay_order_id, razorpay_payment_id, and razorpay_signature are all required" });
    }

    const payment = await verifyPaymentService({ razorpay_order_id, razorpay_payment_id, razorpay_signature });
    return res.json({ success: true, data: payment });
  } catch (error) {
    console.error("Error in verifyPayment controller:", error);
    return res.status(error.status || 500).json({ error: error.message || "Failed to verify payment" });
  }
};

export const scanPayment = async (req, res) => {
  try {
    const { qrToken } = req.params;
    if (!qrToken) return res.status(400).json({ error: "qrToken is required" });

    const result = await scanPaymentService(qrToken);
    return res.json({ success: true, data: result });
  } catch (error) {
    console.error("Error in scanPayment controller:", error);
    return res.status(error.status || 500).json({ error: error.message || "Scan failed" });
  }
};
