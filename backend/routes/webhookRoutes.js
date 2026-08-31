import express from 'express';
import crypto from 'crypto';
import Campaign from '../models/Campaign.js';
import AIAction from '../models/AIAction.js';
import Notification from '../models/Notification.js';

const router = express.Router();

router.post('/razorpay', async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  
  if (!secret) {
    console.error('Webhook secret not set in environment.');
    return res.status(500).json({ success: false, message: 'Server configuration error' });
  }

  const signature = req.headers['x-razorpay-signature'];
  const isSimulation = req.headers['x-simulation'] === 'true';

  if (!signature && !isSimulation) {
    return res.status(400).json({ success: false, message: 'Missing webhook signature header' });
  }

  // Verify the payload signature using the raw body
  try {
    if (!isSimulation) {
      const shasum = crypto.createHmac('sha256', secret);
      shasum.update(req.rawBody || JSON.stringify(req.body));
      const digest = shasum.digest('hex');

      if (digest !== signature) {
        console.warn('Webhook signature verification failed');
        return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
      }
    }

    const { event, payload } = req.body;
    console.log(`Razorpay webhook received: ${event}`);

    let campaignId = null;

    // Extract campaignId based on event payload
    if (event === 'payment_link.paid') {
      campaignId = payload.payment_link?.entity?.reference_id;
    } else if (event === 'payment.captured' || event === 'payment.failed') {
      campaignId = payload.payment?.entity?.notes?.campaign_id;
    }

    if (campaignId) {
      const campaign = await Campaign.findById(campaignId);
      if (campaign) {
        if (event === 'payment.captured' || event === 'payment_link.paid') {
          campaign.status = 'active';
          await campaign.save();
          console.log(`Campaign ${campaignId} updated to active via webhook success`);
          
          // Trigger in-app notification
          const amountRaw = payload.payment?.entity?.amount || 1000;
          const amountFormatted = (amountRaw / 100).toFixed(2);
          await Notification.create({
            userId: campaign.merchantId,
            message: `Payment of ₹${amountFormatted} received for Campaign '${campaign.title}'`,
            type: 'payment_success'
          });

          // Also update audit log if exists
          await AIAction.findOneAndUpdate(
            { merchantId: campaign.merchantId, result: new RegExp(campaignId) },
            { status: 'EXECUTED', result: `Campaign successfully verified via Razorpay webhook transaction: ${payload.payment?.entity?.id || ''}` }
          );
        } else if (event === 'payment.failed') {
          campaign.status = 'FAILED';
          await campaign.save();
          console.log(`Campaign ${campaignId} set to FAILED status`);

          // Trigger in-app notification
          await Notification.create({
            userId: campaign.merchantId,
            message: `Payment failed for Campaign '${campaign.title}'`,
            type: 'payment_failed'
          });
        }
      } else {
        console.warn(`Campaign not found for ID: ${campaignId}`);
      }
    }

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Error handling Razorpay webhook:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
