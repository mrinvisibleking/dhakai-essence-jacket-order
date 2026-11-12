const PRICE = 1550;
let quantity = 1;
let galleryIndex = 0;
const $ = (selector) => document.querySelector(selector);
const money = (value) => `৳${new Intl.NumberFormat('bn-BD').format(value)}`;
const selectedColor = () => document.querySelector('input[name="color"]:checked')?.value || 'Black';
const selectedShipping = () => document.querySelector('input[name="shipping"]:checked')?.value || 'outside';
const shippingFee = () => selectedShipping() === 'inside' ? 60 : 120;
const galleryColors = ['Black', 'Red'];

function showGallery(index) {
  galleryIndex = (index + galleryColors.length) % galleryColors.length;
  $('#gallery-track').style.transform = `translateX(-${galleryIndex * 50}%)`;
  document.querySelectorAll('#gallery-dots button').forEach((dot, i) => dot.classList.toggle('active', i === galleryIndex));
}
function updateTotals() {
  const subtotal = PRICE * quantity;
  const total = subtotal + shippingFee();
  $('#quantity').textContent = quantity;
  const colorLabels = { Black: 'Classic Black', Red: 'Deep Maroon' };
  $('#summary-product').textContent = `GUESS Exclusive Jacket (${colorLabels[selectedColor()] || selectedColor()}) × ${quantity}`;
  $('#subtotal').textContent = money(subtotal);
  $('#subtotal2').textContent = money(subtotal);
  $('#shipping-cost').textContent = money(shippingFee());
  $('#total').textContent = money(total);
  $('#submit-button').textContent = `অর্ডার কনফার্ম করুন — ${money(total)}`;
  $('#mobile-total').textContent = money(total);
}
function syncGalleryToColor(color) {
  const index = galleryColors.indexOf(color);
  if (index >= 0) showGallery(index);
}
$('#gallery-prev').addEventListener('click', () => showGallery(galleryIndex - 1));
$('#gallery-next').addEventListener('click', () => showGallery(galleryIndex + 1));
document.querySelectorAll('#gallery-dots button').forEach((dot) => dot.addEventListener('click', () => showGallery(Number(dot.dataset.slide))));
window.addEventListener('resize', () => showGallery(galleryIndex));
document.querySelectorAll('input[name="color"]').forEach((radio) => radio.addEventListener('change', () => {
  syncGalleryToColor(radio.value);
  updateTotals();
}));
$('#minus').addEventListener('click', () => { quantity = Math.max(1, quantity - 1); updateTotals(); });
$('#plus').addEventListener('click', () => { quantity = Math.min(20, quantity + 1); updateTotals(); });
document.querySelectorAll('input[name="shipping"]').forEach((radio) => radio.addEventListener('change', updateTotals));
$('#year').textContent = new Date().getFullYear();

$('#order-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const button = $('#submit-button');
  const message = $('#form-message');
  const formData = new FormData(form);
  const order = {
    customerName: String(formData.get('customerName') || '').trim(),
    phone: String(formData.get('phone') || '').trim(),
    address: String(formData.get('address') || '').trim(),
    shippingArea: selectedShipping() === 'inside' ? 'Inside Dhaka' : 'Outside Dhaka',
    shippingFee: shippingFee(),
    size: formData.get('size'),
    color: selectedColor(),
    quantity,
    unitPrice: PRICE,
    subtotal: PRICE * quantity,
    total: PRICE * quantity + shippingFee(),
    paymentMethod: 'Cash on Delivery',
    product: 'GUESS Exclusive Jacket',
    createdAt: new Date().toISOString()
  };
  button.disabled = true;
  button.textContent = 'অর্ডার পাঠানো হচ্ছে...';
  message.className = 'form-message';
  message.textContent = '';
  try {
    const response = await fetch('/api/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(order)
    });
    const raw = await response.text();
    let result;
    try { result = JSON.parse(raw); } catch { result = null; }
    if (!response.ok || !result || result.success !== true || !result.orderId) {
      throw new Error(result?.message || 'অর্ডার পাঠানো যায়নি। আবার চেষ্টা করুন।');
    }
    order.orderId = result.orderId;
    order.createdAt = new Date().toISOString();
    try {
      sessionStorage.setItem('dhakaiEssenceLastOrder', JSON.stringify(order));
    } catch {
      throw new Error('অর্ডার গ্রহণ করা হয়েছে, কিন্তু ইনভয়েস পেইজ খোলা যাচ্ছে না। অনুগ্রহ করে এই পেইজটি রিফ্রেশ না করে আমাদের সাথে যোগাযোগ করুন।');
    }
    window.location.assign('/order-confirmation.html');
  } catch (error) {
    message.className = 'form-message show error';
    message.textContent = error.message || 'দুঃখিত, অর্ডারটি পাঠানো যায়নি। আবার চেষ্টা করুন।';
    button.disabled = false;
    updateTotals();
  }
});
syncGalleryToColor(selectedColor());
updateTotals();
