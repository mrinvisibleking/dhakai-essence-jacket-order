const PRICE = 1450;
let quantity = 1;
const $ = (selector) => document.querySelector(selector);
const money = (value) => `৳${new Intl.NumberFormat('bn-BD').format(value)}`;
const selectedColor = () => document.querySelector('input[name="color"]:checked')?.value || 'Black';
const shippingFee = () => $('#shipping').value === 'inside' ? 60 : 120;

function updateTotals() {
  const subtotal = PRICE * quantity;
  const total = subtotal + shippingFee();
  $('#quantity').textContent = quantity;
  $('#summary-product').textContent = `Jacket Model - 1 (${selectedColor()}) × ${quantity}`;
  $('#subtotal').textContent = money(subtotal);
  $('#subtotal2').textContent = money(subtotal);
  $('#shipping-cost').textContent = money(shippingFee());
  $('#total').textContent = money(total);
  $('#submit-button').textContent = `অর্ডার কনফার্ম করুন — ${money(total)}`;
  $('#mobile-total').textContent = money(total);
}

function syncGalleryToColor(color) {
  const thumb = [...document.querySelectorAll('.thumb')].find((item) => item.dataset.color === color);
  if (!thumb) return;
  $('#main-image').src = thumb.dataset.image;
  $('#main-image').alt = `${color} Winter Half Zipper Jacket`;
  document.querySelectorAll('.thumb').forEach((item) => item.classList.toggle('active', item === thumb));
}

document.querySelectorAll('.thumb').forEach((button) => button.addEventListener('click', () => {
  syncGalleryToColor(button.dataset.color);
  const radio = document.querySelector(`input[name="color"][value="${CSS.escape(button.dataset.color)}"]`);
  if (radio) radio.checked = true;
  updateTotals();
}));

document.querySelectorAll('input[name="color"]').forEach((radio) => radio.addEventListener('change', () => {
  syncGalleryToColor(radio.value);
  updateTotals();
}));

$('#minus').addEventListener('click', () => { quantity = Math.max(1, quantity - 1); updateTotals(); });
$('#plus').addEventListener('click', () => { quantity = Math.min(20, quantity + 1); updateTotals(); });
$('#shipping').addEventListener('change', updateTotals);
$('#year').textContent = new Date().getFullYear();

$('#order-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;

  const button = $('#submit-button');
  const message = $('#form-message');
  const formData = new FormData(form);
  const shippingArea = formData.get('shipping') === 'inside' ? 'Inside Dhaka' : 'Outside Dhaka';
  const shipping = shippingFee();
  const subtotal = PRICE * quantity;
  const order = {
    customerName: String(formData.get('customerName') || '').trim(),
    phone: String(formData.get('phone') || '').trim(),
    address: String(formData.get('address') || '').trim(),
    shippingArea,
    shippingFee: shipping,
    size: formData.get('size'),
    color: selectedColor(),
    quantity,
    unitPrice: PRICE,
    subtotal,
    total: subtotal + shipping,
    paymentMethod: 'Cash on Delivery',
    product: 'Winter Half Zipper Style Jacket',
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
    if (!response.ok || !result || result.success !== true) {
      throw new Error(result?.message || 'অর্ডার পাঠানো যায়নি। আবার চেষ্টা করুন।');
    }

    message.className = 'form-message show success';
    message.textContent = `ধন্যবাদ ${order.customerName}! আপনার অর্ডারটি গ্রহণ করা হয়েছে। অর্ডার আইডি: ${result.orderId}`;
    form.reset();
    quantity = 1;
    syncGalleryToColor('Black');
    updateTotals();
    window.scrollTo({ top: message.getBoundingClientRect().top + window.scrollY - 110, behavior: 'smooth' });
  } catch (error) {
    message.className = 'form-message show error';
    message.textContent = error.message || 'দুঃখিত, অর্ডারটি পাঠানো যায়নি। আবার চেষ্টা করুন।';
  } finally {
    button.disabled = false;
    updateTotals();
  }
});

updateTotals();
