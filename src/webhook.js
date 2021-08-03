const process = require('process');
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const fetch = require('node-fetch');
const bodyParser = require('body-parser');
const getToken = require('./token');

const router = express.Router();
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const dbDriverUrl = process.env.DATABASE_DRIVER_URL;

router.post('/', express.raw({type: 'application/json'}), async (req, res) => {
    const token = await getToken();

    let data;
    let eventType;
    if (webhookSecret) {
        let event;
        let signature = req.headers["stripe-signature"];
        
        try {
            event = stripe.webhooks.constructEvent(
                req.body,
                signature,
                webhookSecret
            );
        } catch (err) {
            console.error(`⚠️  Webhook signature verification failed.`);
        return res.sendStatus(400);
        }
        data = event.data;
        eventType = event.type;
    } else {
        data = req.body.data;
        eventType = req.body.type;
    }

    switch (eventType) {
        case 'checkout.session.completed':
            // Payment is successful and the subscription is created.
            // You should provision the subscription and save the customer ID to your database.
            try {
                await fetch(`${dbDriverUrl}/subscriptions/`, {
                    method: 'PUT',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        sub: data.object.metadata.sub,
                        plan: 'pro',
                        customerId: data.object.customer,
                    }),
                });
            } catch (error) {
                console.error(error);
            }
            break;
        case 'invoice.paid':
            // Continue to provision the subscription as payments continue to be made.
            // Store the status in your database and check when a user accesses your service.
            // This approach helps you avoid hitting rate limits.
            console.log("event type: " + eventType)
            
            break;
        case 'invoice.payment_failed':
            // The payment failed or the customer does not have a valid payment method.
            // The subscription becomes past_due. Notify your customer and send them to the
            // customer portal to update their payment information.
            console.log("event type: " + eventType)
            
            break;
        case 'customer.subscription.deleted':
            try {
                await fetch(`${dbDriverUrl}/subscriptions/${data.object.customer}`, {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
            } catch (error) {
                console.error(error);
            }
            break;
        default:
            console.log("event type: " + eventType)
        }

    res.sendStatus(200);
});

module.exports = router;