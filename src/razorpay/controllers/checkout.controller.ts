import { Controller, Get, Header, Query, Res } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { RazorpayService } from '../razorpay.service';

@ApiTags('demo-checkout')
@Controller('checkout')
export class CheckoutController {
  constructor(private readonly razorpayService: RazorpayService) {}

  @Get()
  @ApiOperation({
    summary: 'Hosted Test Mode Checkout demo page',
    description: [
      'Open `/checkout?orderId=order_...` after creating an order.',
      '',
      'Loads Razorpay Checkout.js with your **test key_id** and opens the payment modal.',
      'Complete payment with a test card/UPI → order becomes **Paid** in the dashboard and a Payment row appears.',
      '',
      'Test card: `4111 1111 1111 1111`, any future expiry, any CVV · UPI: `success@razorpay`',
    ].join('\n'),
  })
  @ApiOkResponse({ description: 'HTML checkout page', content: { 'text/html': {} } })
  @Header('Content-Type', 'text/html; charset=utf-8')
  getCheckoutPage(
    @Query('orderId') orderId?: string,
    @Query('amount') amount?: string,
    @Query('name') name?: string,
    @Res({ passthrough: true }) res?: Response,
  ): string {
    if (res) res.type('text/html');
    const keyId = JSON.stringify(this.razorpayService.getKeyId());
    const orderIdJson = JSON.stringify(orderId ?? '');
    const amountJson = JSON.stringify(amount ?? '');
    const nameJson = JSON.stringify(name ?? 'Razorpay NestJS Demo');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Razorpay Test Checkout</title>
  <style>
    body { font-family: ui-sans-serif, system-ui, sans-serif; background:#0f172a; color:#e2e8f0; margin:0; padding:2rem; }
    .card { max-width: 520px; margin: 3rem auto; background:#1e293b; border:1px solid #334155; border-radius:12px; padding:1.5rem; }
    h1 { font-size:1.25rem; margin:0 0 .5rem; }
    p { color:#94a3b8; font-size:.9rem; line-height:1.5; }
    code { background:#0f172a; padding:.15rem .4rem; border-radius:4px; color:#fbbf24; }
    button { background:#3b82f6; color:#fff; border:0; border-radius:8px; padding:.75rem 1.25rem; font-size:1rem; cursor:pointer; width:100%; margin-top:1rem; }
    button:hover { background:#2563eb; }
    button:disabled { opacity:.5; cursor:not-allowed; }
    .hint { margin-top:1rem; font-size:.8rem; color:#64748b; }
    #result { margin-top:1rem; padding:.75rem; border-radius:8px; background:#0f172a; display:none; font-size:.85rem; word-break:break-all; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${nameJson.replace(/^"|"$/g, '')}</h1>
    <p>Test Mode checkout for order <code id="oid">${orderIdJson.replace(/^"|"$/g, '') || '—'}</code></p>
    <p>Amount: <code id="amt">${amountJson.replace(/^"|"$/g, '') || 'set amount below'}</code></p>
    <button id="pay" ${orderIdJson === '""' ? 'disabled' : ''}>Pay with Razorpay (Test)</button>
    <div class="hint">
      Test card <code>4111 1111 1111 1111</code> · any future expiry · any CVV<br/>
      UPI id <code>success@razorpay</code><br/>
      Or use <a style="color:#60a5fa" href="/api/v1/payment-links" target="_blank">Payment Links</a> (Success/Failure buttons, no card).
    </div>
    <div id="result"></div>
  </div>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <script>
    const keyId = ${keyId};
    const orderId = ${orderIdJson};
    let amountMinor = ${amountJson} ? Math.round(parseFloat(${amountJson}) * 100) : null;

    async function ensureAmount() {
      if (amountMinor) return amountMinor;
      const res = await fetch('/api/v1/orders/' + encodeURIComponent(orderId));
      const order = await res.json();
      amountMinor = order.amount;
      document.getElementById('amt').textContent = (amountMinor / 100) + ' ' + order.currency;
      return amountMinor;
    }

    document.getElementById('pay').addEventListener('click', async () => {
      const btn = document.getElementById('pay');
      btn.disabled = true;
      try {
        const amount = await ensureAmount();
        const rzp = new Razorpay({
          key: keyId,
          amount: amount,
          currency: 'INR',
          name: 'Razorpay NestJS Demo',
          order_id: orderId,
          theme: { color: '#3b82f6' },
          handler: async function (response) {
            const body = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            };
            const verify = await fetch('/api/v1/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body),
            });
            const data = await verify.json();
            const el = document.getElementById('result');
            el.style.display = 'block';
            el.textContent = JSON.stringify(data, null, 2);
            el.style.color = verify.ok ? '#4ade80' : '#f87171';
          },
          modal: { ondismiss: function () { btn.disabled = false; } },
        });
        rzp.open();
      } catch (e) {
        btn.disabled = false;
        alert('Failed to open checkout: ' + e.message);
      }
    });
  </script>
</body>
</html>`;
  }
}
