import { createHmac, randomUUID } from "node:crypto";
import getSupabase from "../config/db.config.js";
import { getRazorpay } from "../config/razorpay.config.js";

export const createOrderService = async (customerId, totalAmount) => {
  const order = await getRazorpay().orders.create({
    amount: Math.round(totalAmount * 100),
    currency: "INR",
    receipt: `receipt#${Date.now()}`,
  });

  const qrToken = randomUUID();

  const { data, error } = await getSupabase()
    .from("payments")
    .insert([{
      customer_id: customerId,
      razorpay_order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      status: "PENDING",
      qr_token: qrToken,
    }])
    .select()
    .single();

  if (error) throw error;
  return { order, payment: data, key_id: process.env.LIVE_API_KEY, qr_token: qrToken };
};

export const verifyPaymentService = async ({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
}) => {
  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  if (!process.env.LIVE_KEY_SECRET) throw Object.assign(new Error("Payment configuration error"), { status: 500 });
  const expectedSignature = createHmac("sha256", process.env.LIVE_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    const err = new Error("Payment verification failed: invalid signature");
    err.status = 400;
    throw err;
  }

  const { data: updatedRows, error } = await getSupabase()
    .from("payments")
    .update({ razorpay_payment_id, status: "COMPLETED" })
    .eq("razorpay_order_id", razorpay_order_id)
    .neq("status", "COMPLETED")
    .select();

  if (error) throw error;

  // If 0 rows updated, payment was already COMPLETED (webhook ran first) — fetch existing record
  let paymentData;
  if (updatedRows && updatedRows.length > 0) {
    paymentData = updatedRows[0];
  } else {
    const { data: existing, error: fetchError } = await getSupabase()
      .from("payments")
      .select()
      .eq("razorpay_order_id", razorpay_order_id)
      .single();
    if (fetchError) throw fetchError;
    paymentData = existing;
  }

  const { data: customer, error: customerError } = await getSupabase()
    .from("customers")
    .select("reg_no")
    .eq("id", paymentData.customer_id)
    .single();

  if (customerError) throw customerError;
  return { ...paymentData, reg_no: customer.reg_no };
};

export const scanPaymentService = async (qrToken) => {
  const { data, error } = await getSupabase()
    .from("payments")
    .select("*, customers(*)")
    .eq("qr_token", qrToken)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      const err = new Error("Invalid or unverified ticket QR Code");
      err.status = 404;
      throw err;
    }
    console.error("scanPaymentService DB error:", error);
    const err = new Error("Database error while scanning QR code");
    err.status = 500;
    throw err;
  }

  if (data.status !== "COMPLETED") {
    const err = new Error("Payment not completed for this QR code");
    err.status = 400;
    throw err;
  }

  if (data.scanned) {
    return { alreadyScanned: true, customer: data.customers, payment: data };
  }

  const { data: updated, error: updateError } = await getSupabase()
    .from("payments")
    .update({ scanned: true })
    .eq("qr_token", qrToken)
    .select("*, customers(*)")
    .single();

  if (updateError) throw updateError;
  return { alreadyScanned: false, customer: updated.customers, payment: updated };
};
