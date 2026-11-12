/**
 * Dhakai Essence order receiver.
 * Bind this Apps Script project to the Google Sheet via Extensions > Apps Script.
 * Store ORDER_SECRET in Project Settings > Script properties.
 */
var ORDER_HEADERS = [
  "Date", "Order Id", "Status", "Support Manager", "Summary", "Courier ID",
  "Product Name", "Color", "Size", "Customer Name", "Phone", "Address",
  "Quantity", "Price Amount", "shipping method", "Payment Method"
];

function doPost(e) {
  try {
    var data = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    var expected = PropertiesService.getScriptProperties().getProperty("ORDER_SECRET");
    if (!expected || !data.secret || data.secret !== expected) {
      return jsonOutput({ success: false, message: "Unauthorized" });
    }

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

      ensureOrderSheetSchema(sheet);

      var safe = function(value) {
        var text = String(value == null ? "" : value);
        return /^[=+@-]/.test(text) ? "'" + text : text;
      };
      var createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
      if (isNaN(createdAt.getTime())) createdAt = new Date();
      var productName = "GUESS Exclusive Jacket";
      var shippingMethod = data.shippingArea === "Inside Dhaka" ? "ঢাকার ভিতরে" : "ঢাকার বাহিরে";
      var totalAmount = unitPrice * quantity + shippingFee;

      sheet.appendRow([
        createdAt,
        safe(data.orderId),
        "", "", "", "",
        safe(productName),
        safe(color),
        safe(data.size),
        safe(data.customerName),
        safe(data.phone),
        safe(data.address),
        quantity,
        totalAmount,
        safe(shippingMethod),
        "Cash on Delivery"
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

/**
 * Creates the requested 16-field row layout. If the sheet still has the
 * previous 15-column layout, historical orders are migrated into the new
 * positions and the four manually managed fields are left blank.
 * Unknown layouts are rejected to avoid overwriting unrelated sheet data.
 */
function ensureOrderSheetSchema(sheet) {
  var lastRow = sheet.getLastRow();
  var lastColumn = sheet.getLastColumn();

  if (lastRow === 0 || lastColumn === 0) {
    sheet.getRange(1, 1, 1, ORDER_HEADERS.length).setValues([ORDER_HEADERS]);
    sheet.setFrozenRows(1);
    return;
  }

  var currentHeaders = sheet.getRange(1, 1, 1, lastColumn).getDisplayValues()[0]
    .map(function(value) { return String(value).trim(); });
  if (currentHeaders.join("|") === ORDER_HEADERS.join("|")) {
    sheet.setFrozenRows(1);
    return;
  }

  var oldHeaders = [
    "Order ID", "Date & Time", "Customer Name", "Phone", "Address",
    "Delivery Area", "Delivery Fee (BDT)", "Size", "Color", "Quantity",
    "Unit Price (BDT)", "Subtotal (BDT)", "Total (BDT)", "Payment Method", "Product"
  ];
  if (currentHeaders.join("|") !== oldHeaders.join("|")) {
    throw new Error("Orders sheet has an unrecognized header layout. No sheet data was changed.");
  }

  var oldRows = lastRow > 1
    ? sheet.getRange(2, 1, lastRow - 1, oldHeaders.length).getValues()
    : [];
  var migratedRows = oldRows.map(function(row) {
    return [
      row[1], row[0], "", "", "", "",
      "GUESS Exclusive Jacket", row[8] === "Black" ? "Classic Black" : row[8] === "Red" ? "Deep Maroon" : row[8], row[7], row[2], row[3], row[4],
      row[9], row[12], row[5] === "Inside Dhaka" ? "ঢাকার ভিতরে" : "ঢাকার বাহিরে",
      row[13]
    ];
  });

  sheet.clearContents();
  sheet.getRange(1, 1, 1, ORDER_HEADERS.length).setValues([ORDER_HEADERS]);
  if (migratedRows.length) {
    sheet.getRange(2, 1, migratedRows.length, ORDER_HEADERS.length).setValues(migratedRows);
  }
  sheet.setFrozenRows(1);
}

function jsonOutput(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
