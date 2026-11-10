/**
 * Noor Exclusive order receiver.
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

    var required = ["orderId", "customerName", "phone", "address", "shippingArea", "size", "color"];
    for (var i = 0; i < required.length; i++) {
      if (!data[required[i]]) throw new Error("Missing " + required[i]);
    }

    var quantity = Number(data.quantity);
    var unitPrice = 1450;
    var shippingFee = data.shippingArea === "Inside Dhaka" ? 60 :
      data.shippingArea === "Outside Dhaka" ? 120 : 0;
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20 || !shippingFee ||
        !["M", "L", "XL", "XXL"].includes(data.size) ||
        !["Black", "Red", "Pastel Green", "Blue"].includes(data.color)) {
      throw new Error("Invalid order data");
    }

    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      if (!spreadsheet) throw new Error("Bind this script to a Google Sheet first");
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
        safe(data.color), quantity, unitPrice, unitPrice * quantity,
        unitPrice * quantity + shippingFee, "Cash on Delivery",
        "Winter Half Zipper Style Jacket"
      ]);
      return jsonOutput({ success: true, orderId: data.orderId });
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    console.error(error);
    return jsonOutput({ success: false, message: "Could not save order" });
  }
}

function jsonOutput(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
