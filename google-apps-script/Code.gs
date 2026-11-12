/**
 * Dhakai Essence order receiver.
 * Bind this Apps Script project to the Google Sheet via Extensions > Apps Script.
 * Store ORDER_SECRET in Project Settings > Script properties.
 */
function doPost(e) {
  try {
    var data = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    var expected = PropertiesService.getScriptProperties().getProperty("ORDER_SECRET");
    if (!expected || !data.secret || data.secret !== expected) {
      return jsonOutput({ success: false, message: "Unauthorized" });
    }

    // Normalize color text so every displayed option is accepted consistently.
    var rawColor = String(data.color || "").trim().toLowerCase();
    var colorMap = {
      "black": "Classic Black",
      "classic black": "Classic Black",
      "red": "Deep Maroon",
      "deep maroon": "Deep Maroon"
    };
    var color = colorMap[rawColor] || "";

    var required = ["orderId", "customerName", "phone", "address", "shippingArea", "size"];
    for (var i = 0; i < required.length; i++) {
      if (!data[required[i]]) throw new Error("Missing " + required[i]);
    }

    var quantity = Number(data.quantity);
    var unitPrice = 1550;
    var shippingFee = data.shippingArea === "Inside Dhaka" ? 60 :
      data.shippingArea === "Outside Dhaka" ? 120 : 0;

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20 ||
        !shippingFee || !["M", "L", "XL", "XXL"].includes(data.size) || !color) {
      throw new Error("Invalid order data: check size, color, quantity and delivery area");
    }

    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      if (!spreadsheet) throw new Error("Apps Script is not bound to the Google Sheet");

      var sheet = spreadsheet.getSheetByName("Orders");
      if (!sheet) sheet = spreadsheet.insertSheet("Orders");

      if (sheet.getLastRow() === 0) {
        sheet.appendRow([
          "Order ID", "Date & Time", "Customer Name", "Phone", "Address",
          "Delivery Area", "Delivery Fee (BDT)", "Size", "Color", "Quantity",
          "Unit Price (BDT)", "Subtotal (BDT)", "Total (BDT)", "Payment Method", "Product"
        ]);
        sheet.setFrozenRows(1);
      }

      var safe = function(value) {
        var text = String(value == null ? "" : value);
        return /^[=+@-]/.test(text) ? "'" + text : text;
      };
      var createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
      if (isNaN(createdAt.getTime())) createdAt = new Date();

      sheet.appendRow([
        safe(data.orderId), createdAt, safe(data.customerName), safe(data.phone),
        safe(data.address), safe(data.shippingArea), shippingFee, safe(data.size),
        color, quantity, unitPrice, unitPrice * quantity,
        unitPrice * quantity + shippingFee, "Cash on Delivery",
        "Winter Half Zipper Style Jacket"
      ]);

      return jsonOutput({ success: true, orderId: data.orderId });
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    console.error("Dhakai Essence order save failed: " + (error && error.stack ? error.stack : error));
    return jsonOutput({
      success: false,
      message: String(error && error.message ? error.message : "Could not save order")
    });
  }
}

function jsonOutput(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
