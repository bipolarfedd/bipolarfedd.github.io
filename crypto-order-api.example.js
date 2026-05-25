/*
Example backend for a from-scratch crypto checkout.

This stores pending BTC/Solana orders on your server. It does not take custody
of funds or automatically verify blockchain payments. For production, add a
database, admin auth, and payment verification through your own node or a
trusted blockchain API.

Install:
  npm install express cors

Run:
  DOMAIN=https://yourdomain.com node crypto-order-api.example.js
*/

const express = require('express');
const cors = require('cors');

const app = express();
const domain = process.env.DOMAIN || 'http://localhost:3000';
const orders = new Map();

app.use(cors({ origin: domain }));
app.use(express.json());

app.post('/api/orders', (req, res) => {
    const order = req.body;

    if (!order || !order.id || !Array.isArray(order.items) || order.items.length === 0) {
        return res.status(400).json({ error: 'Valid order is required' });
    }

    orders.set(order.id, {
        ...order,
        status: 'pending',
        paymentStatus: 'awaiting_payment',
        createdAt: new Date().toISOString()
    });

    return res.json({ ok: true, orderId: order.id });
});

app.get('/api/orders/:id', (req, res) => {
    const order = orders.get(req.params.id);

    if (!order) {
        return res.status(404).json({ error: 'Order not found' });
    }

    return res.json(order);
});

app.post('/api/orders/:id/mark-paid', (req, res) => {
    const order = orders.get(req.params.id);

    if (!order) {
        return res.status(404).json({ error: 'Order not found' });
    }

    order.status = 'paid';
    order.paymentStatus = 'paid';
    order.txHash = req.body.txHash || order.txHash || '';
    order.paidAt = new Date().toISOString();
    orders.set(order.id, order);

    return res.json({ ok: true, order });
});

app.listen(process.env.PORT || 3000, () => {
    console.log(`Crypto order API running for ${domain}`);
});
