# Noor Exclusive — Jacket Landing Page

Responsive recreation of the Noor Exclusive Winter Half Zipper Jacket product/order page. Static frontend + Vercel serverless order endpoint + Google Apps Script receiver.

## 1. Create the Google Sheet

1. Create a new Google Sheet, for example `Noor Exclusive Orders`.
2. Open **Extensions → Apps Script**.
3. Replace the editor contents with `google-apps-script/Code.gs`.
4. In Apps Script open **Project Settings → Script properties → Add script property**:
   - Property: `ORDER_SECRET`
   - Value: create a long random string (at least 32 characters). Keep it private.
5. Save the script.
6. Choose **Deploy → New deployment → Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
7. Deploy, authorize when prompted, and copy the Web app URL ending in `/exec`.

The `Orders` tab and header row are created automatically on the first valid order.

## 2. Deploy with GitHub + Vercel

1. Create a new GitHub repository named `noor-exclusive-jacket-landing`.
2. Upload the contents of this project to the repository root (not the containing folder).
3. In Vercel choose **Add New → Project**, import the GitHub repository, and deploy.
4. In Vercel **Project → Settings → Environment Variables**, add:
   - `GOOGLE_APPS_SCRIPT_URL` = the Apps Script `/exec` URL
   - `ORDER_SECRET` = the exact same secret saved in Apps Script
5. Redeploy after adding the environment variables.

## 3. Test

Open the deployed URL, submit a test order with your own details, then verify that a new row appears in the Google Sheet's `Orders` tab. Do not advertise the form until this test succeeds.

## Notes

- Price is configured as BDT 1,450 per jacket; shipping is BDT 60 inside Dhaka and BDT 120 outside Dhaka.
- Product photos currently load from the reference website's public image URLs. For long-term reliability, download and host licensed product photos in this repository.
- Update product text, pricing, return policy, and social links before production if the seller's actual terms differ.
