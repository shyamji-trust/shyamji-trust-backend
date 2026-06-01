import { createHmac } from "node:crypto";
import getSupabase from "../config/db.config.js";

export const handleWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const rawBody = req.body.toString();

    const expectedResult = createHmac("sha256", process.env.WEBHOOK_KEY)
                            .update(rawBody)
                            .digest("hex");

    if (expectedResult !== signature) {
      console.warn("Invalid webhook signature received");
      return res.status(400).json({
        success: false,
        message: "Invalid signature"
      });
    }

    const eventData = JSON.parse(rawBody);

    if (eventData.event === "order.paid") {
      const razorpayOrderId = eventData.payload.order.entity.id;
      const razorpayPaymentId = eventData.payload.payment?.entity?.id || null;
      console.log(`Webhook: Processing payment for Order ID: ${razorpayOrderId}, Payment ID: ${razorpayPaymentId}`);

      const { data: updatedPayment, error } = await getSupabase()
        .from("payments")
        .update({ status: "COMPLETED", razorpay_payment_id: razorpayPaymentId })
        .eq("razorpay_order_id", razorpayOrderId)
        .neq("status", "COMPLETED")
        .select();

      if (error) {
        console.error("Database update error:", error);
        throw error;
      }

      if (updatedPayment && updatedPayment.length > 0) {
        console.log(`Webhook: Order ${razorpayOrderId} successfully marked as COMPLETED.`);
      } else {
        console.log(`Webhook: Order ${razorpayOrderId} was already marked as COMPLETED. Skipping update.`);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Webhook processed successfully"
    });
  } catch (error) {
    console.error("Error in webhook handler:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};