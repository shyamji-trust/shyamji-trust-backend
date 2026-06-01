import { createOrderService, verifyPaymentService, scanPaymentService } from "../services/payment.service.js";

export const createOrder = async (req, res) => {
  try {
    const { customer_id, total_amount } = req.body;

    if (!customer_id)
      return res.status(400).json({ error: "customer_id is required" });
    const amount = Number(total_amount);
    if (!Number.isFinite(amount) || !Number.isInteger(amount) || amount < 1)
      return res.status(400).json({ error: "total_amount must be a positive whole number in rupees" });

    // Gross up so recipient receives the full intended amount after Razorpay deducts ~2% + 18% GST on fee (2.36% effective)
    const grossedAmount = Math.ceil(amount / (1 - 0.0236));

    if (grossedAmount > 100000)
      return res.status(400).json({ error: "Maximum order amount is ₹1,00,000" });

    const result = await createOrderService(customer_id, grossedAmount);
    return res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error("Error in createOrder controller:", error);
    return res.status(500).json({ error: error.message || "Failed to create order" });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    console.log(`[/api/payments/verify] Request received for order: ${razorpay_order_id}`);

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: "razorpay_order_id, razorpay_payment_id, and razorpay_signature are all required" });
    }

    const payment = await verifyPaymentService({ razorpay_order_id, razorpay_payment_id, razorpay_signature });
    console.log(`[/api/payments/verify] Payment verified successfully for order: ${razorpay_order_id}`);
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
