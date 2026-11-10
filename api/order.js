const crypto = require("node:crypto");

const MAX_BODY_BYTES = 12_000;
const ALLOWED_COLORS = new Set(["Black", "Red", "Pastel Green", "Cream"]);
const ALLOWED_SIZES = new Set(["M", "L", "XL", "XXL"]);

function send(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  return res.end(JSON.stringify(body));
}
function clean(value, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return send(res, 405, { success: false, message: "শুধু POST রিকোয়েস্ট গ্রহণ করা হয়।" });
  }
  const secret = process.env.ORDER_SECRET;
  const appsScriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
  if (!secret || secret.length < 32 || !appsScriptUrl) {
    return send(res, 503, { success: false, message: "অর্ডার সার্ভিস এখনো কনফিগার করা হয়নি। অনুগ্রহ করে পরে চেষ্টা করুন।" });
  }
  let target;
  try {
    target = new URL(appsScriptUrl);
    if (target.protocol !== "https:" || target.hostname !== "script.google.com" || !target.pathname.includes("/macros/s/") || !target.pathname.endsWith("/exec")) throw new Error("Invalid Apps Script URL");
  } catch {
    return send(res, 500, { success: false, message: "অর্ডার সার্ভারের কনফিগারেশন সঠিক নয়।" });
  }
  let order = req.body;
  if (typeof order === "string") {
    try { order = JSON.parse(order); } catch { order = null; }
  }
  if (!order || typeof order !== "object" || Buffer.byteLength(JSON.stringify(order), "utf8") > MAX_BODY_BYTES) {
    return send(res, 400, { success: false, message: "অর্ডারের তথ্য সঠিক নয়।" });
  }
  const customerName = clean(order.customerName, 100);
  const phone = clean(order.phone, 20);
  const address = clean(order.address, 700);
  const size = clean(order.size, 5);
  const color = clean(order.color, 30);
  const quantity = Number(order.quantity);
  const shippingArea = clean(order.shippingArea, 30);
  const unitPrice = 1450;
  const shippingFee = shippingArea === "Inside Dhaka" ? 60 : shippingArea === "Outside Dhaka" ? 120 : 0;
  if (customerName.length < 2 || !/^[0-9+()\\-\\s]{8,20}$/.test(phone) ||
      address.length < 8 || !ALLOWED_SIZES.has(size) || !ALLOWED_COLORS.has(color) ||
      !Number.isInteger(quantity) || quantity < 1 || quantity > 20 || !shippingFee) {
    return send(res, 400, { success: false, message: "নাম, ফোন, ঠিকানা, সাইজ বা অর্ডারের পরিমাণ যাচাই করুন।" });
  }
  const subtotal = unitPrice * quantity;
  const payload = {
    orderId: "NE-" + crypto.randomUUID().slice(0, 8).toUpperCase(),
    customerName, phone, address, shippingArea, shippingFee, size, color,
    quantity, unitPrice, subtotal, total: subtotal + shippingFee,
    paymentMethod: "Cash on Delivery",
    product: "Winter Half Zipper Style Jacket",
    createdAt: new Date().toISOString(),
    secret
  };
  try {
    const response = await fetch(target, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(12_000),
      redirect: "follow"
    });
    const raw = await response.text();
    let result;
    try { result = JSON.parse(raw); } catch { result = null; }
    if (!response.ok || !result || result.success !== true || !result.orderId) {
      console.error("Apps Script order receiver rejected request:", response.status, raw.slice(0, 500));
      return send(res, 502, { success: false, message: "অর্ডারটি সংরক্ষণ করা যায়নি। কিছুক্ষণ পর আবার চেষ্টা করুন।" });
    }
    return send(res, 200, { success: true, orderId: result.orderId });
  } catch (error) {
    console.error("Order forwarding failed:", error.message);
    return send(res, 502, { success: false, message: "সার্ভারের সাথে সংযোগ করা যাচ্ছে না। আবার চেষ্টা করুন।" });
  }
};
