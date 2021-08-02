// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
const process = require('process');
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const fetch = require('node-fetch');
const { default: getToken } = require('./token');

const router = express.Router();
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

router.post('/', async (req, res) => {
    const token = await getToken();

    let data;
    let eventType;
    // Check if webhook signing is configured.
    if (webhookSecret) {
        // Retrieve the event by verifying the signature using the raw body and secret.
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
        // Extract the object from the event.
        data = event.data;
        eventType = event.type;
    } else {
        // Webhook signing is recommended, but if the secret is not configured in `config.js`,
        // retrieve the event data directly from the request body.
        data = req.body.data;
        eventType = req.body.type;
    }

    switch (eventType) {
        case 'checkout.session.completed':
            // Payment is successful and the subscription is created.
            // You should provision the subscription and save the customer ID to your database.
            console.log("event type: " + eventType)
            console.log("data: " + data)
            break;
        case 'invoice.paid':
            // Continue to provision the subscription as payments continue to be made.
            // Store the status in your database and check when a user accesses your service.
            // This approach helps you avoid hitting rate limits.
            console.log("event type: " + eventType)
            console.log("data: " + data)
            break;
        case 'invoice.payment_failed':
            // The payment failed or the customer does not have a valid payment method.
            // The subscription becomes past_due. Notify your customer and send them to the
            // customer portal to update their payment information.
            console.log("event type: " + eventType)
            console.log("data: " + data)
            break;
        default:
        // Unhandled event type
        }

    res.sendStatus(200);
});

module.exports = router;