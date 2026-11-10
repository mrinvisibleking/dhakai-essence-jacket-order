# Noor Exclusive — Jacket Landing Page

Responsive Bengali product landing page for the Winter Half Zipper Style Jacket. It includes product color thumbnails, size guide, quantity and delivery-price calculation, and a Cash on Delivery order form.

## 1. Connect Google Sheets (required for order submissions)

1. Create a Google Sheet named **Noor Exclusive Orders**.
2. In that sheet, open **Extensions → Apps Script**.
3. Replace the editor contents with the code in `google-apps-script/Code.gs`.
4. In Apps Script, open **Project Settings → Script properties** and add:
   - Property: `ORDER_SECRET`
   - Value: a long random secret (at least 32 characters). Keep it private.
5. Save, then choose **Deploy → New deployment → Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Deploy, authorize access, and copy the web app URL ending in `/exec`.

The script creates an `Orders` tab and header row automatically when the first valid order arrives.

## 2. Configure Vercel

This repository is `mrinvisibleking/dhakai-essence-jacket-order`.

1. Open the Vercel project **dhakai-essence-jacket-order**.
2. Go to **Settings → Environment Variables** and add both variables for **Production** (and Preview too if you want to test preview deployments):
   - `GOOGLE_APPS_SCRIPT_URL` = the Apps Script web app URL ending in `/exec`
   - `ORDER_SECRET` = exactly the same secret saved in Apps Script
3. Redeploy after adding the variables.

The landing page itself works without these variables. Until they are configured, order submissions intentionally return a clear configuration message and are not falsely reported as successful.

## 3. Test before sharing

1. Open the deployed site.
2. Submit one test order using your own test details.
3. Confirm the order appears in the Google Sheet's `Orders` tab.
4. Only advertise the order form after this end-to-end test succeeds.

## Product settings

- Product: Winter Half Zipper Style Jacket
- Unit price: BDT 1,450
- Delivery: BDT 60 inside Dhaka; BDT 120 outside Dhaka
- Available sizes: M, L, XL, XXL
- Available colors: Black, Red, Pastel Green, Blue

The product images currently load from public image URLs on the reference shop. For long-term reliability, use product images you own or are licensed to use.
