
const express = require('express');
const router = express.Router();
const Profile = require('../models/Profile');
// Hardcoded Stripe Secret Key as requested
const stripe = require('stripe')('sk_test_51Pubx8P1qC7BzO0wxjFThVG8TkyWBV6PtKUb3w8OpsYzC1w6rI9FS5xXtFqSyhS9CnUYGEHRIpU6LEkjfyQlrVkC009KGTGs8Y');

// 1. Create Checkout Session
router.post('/create-checkout', async (req, res) => {
  try {
    const { planId, email } = req.body;
    
    // Attempt to find existing stripe customer if email provided
    let customerId;
    if (email) {
      const existingProfile = await Profile.findOne({ where: { email } });
      if (existingProfile && existingProfile.stripe_customer_id) {
        customerId = existingProfile.stripe_customer_id;
      }
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer: customerId,
      customer_email: customerId ? undefined : (email || undefined),
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: planId.replace('plan_', '').replace('_', ' ').toUpperCase() + ' PROTOCOL',
              description: 'Access to FitLife Pro Elite Coaching Infrastructure',
            },
            unit_amount: planId.includes('starter') ? 4900 : 
                         planId.includes('performance') ? 19900 : 
                         planId.includes('executive') ? 49900 : 1000000,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      metadata: { planId: planId, email: email }, 
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/?payment=success&plan=${planId}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/?payment=cancel`,
    });

    res.json({ success: true, url: session.url });
  } catch (error) {
    console.error('Stripe Session Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. Stripe Webhook Handler (Order Fulfillment)
router.post('/webhook', async (req, res) => {
  let event;

  try {
    // If body is raw (Buffer), parse it. If already object (from other middleware), use it.
    event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle successful payments
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const planId = session.metadata.planId;
    const email = session.customer_details.email || session.metadata.email;

    try {
      // Find member by email and update their active protocol and Stripe ID
      const profile = await Profile.findOne({ where: { email } });
      if (profile) {
        await profile.update({ 
          activePlanId: planId,
          stripe_customer_id: session.customer // Link the profile to the Stripe Customer
        });
        console.log(`✅ Plan ${planId} activated for ${email}. Stripe ID linked.`);
      }
    } catch (dbError) {
      console.error('❌ Failed to update plan in database:', dbError);
    }
  }

  res.json({ received: true });
});

module.exports = router;
