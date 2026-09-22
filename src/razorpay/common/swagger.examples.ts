export const ORDER_EXAMPLE = {
  id: 'order_QHI2xgVvRyJmQb',
  entity: 'order',
  amount: 49900,
  amount_paid: 0,
  currency: 'INR',
  receipt: 'rcpt_1727010000000',
  status: 'created',
  attempts: 0,
  notes: { customer_id: 'cust_demo_1' },
  created_at: 1727009990,
};

export const PAYMENT_EXAMPLE = {
  id: 'pay_QHI3aBcDeFgHiJ',
  entity: 'payment',
  amount: 49900,
  currency: 'INR',
  status: 'captured',
  order_id: 'order_QHI2xgVvRyJmQb',
  method: 'upi',
  captured: true,
  email: 'customer@example.com',
  contact: '+919999999999',
  created_at: 1727010012,
};

export const REFUND_EXAMPLE = {
  id: 'rfnd_QHI4kLmNoPqRsT',
  entity: 'refund',
  amount: 10000,
  currency: 'INR',
  payment_id: 'pay_QHI3aBcDeFgHiJ',
  status: 'processed',
  speed: 'optimum',
  created_at: 1727010300,
};

export const INVOICE_EXAMPLE = {
  id: 'inv_QHI5uVwXyZaBcD',
  entity: 'invoice',
  payment_status: 'paid',
  customer_details: {
    name: 'Jane Doe',
    email: 'jane@example.com',
    contact: '+919888888888',
  },
  line_items: [
    {
      id: 'li_QHI5xyz',
      name: 'Pro Plan',
      amount: 49900,
      currency: 'INR',
      quantity: 1,
    },
  ],
  total_amount: 49900,
  currency: 'INR',
  issued_at: 1727010400,
  status: 'paid',
};

export const VERIFICATION_EXAMPLE = {
  success: true,
  message: 'Payment signature verified. Order can be marked as paid.',
  order_id: 'order_QHI2xgVvRyJmQb',
  payment_id: 'pay_QHI3aBcDeFgHiJ',
};

export const ERROR_EXAMPLE = {
  statusCode: 400,
  message: 'Invalid payment signature verification failed.',
  code: 'invalid_signature',
  provider: 'razorpay',
};

export const WEBHOOK_OK_EXAMPLE = {
  received: true,
  event: 'payment.captured',
  handled: true,
};
