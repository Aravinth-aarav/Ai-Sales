import mongoose from 'mongoose';
import Campaign from '../models/Campaign.js';
import AIAction from '../models/AIAction.js';
import AIInsight from '../models/AIInsight.js';
import Notification from '../models/Notification.js';
import { validateCampaignGuardrails } from './guardrailService.js';

/**
 * Creates and launches a campaign based on merchant input/approval.
 * Checks guardrails on the incoming payload (which may contain merchant edits).
 */
export const executeCampaignLaunch = async (merchantId, payload) => {
  const { title, type, discount, marketingCopy, insightId, durationDays, productId } = payload;

  // 1. Run Backend Guardrails check BEFORE creating any campaign
  const guardrailResult = await validateCampaignGuardrails(merchantId, {
    title,
    type,
    discount,
    marketingCopy,
    durationDays,
    productId
  });

  if (!guardrailResult.valid) {
    const error = new Error('Campaign blocked by policy.');
    error.code = 'POLICY_VIOLATION';
    error.status = 400;
    error.reason = guardrailResult.reason;
    throw error;
  }

  const campaignId = new mongoose.Types.ObjectId();

  // 2. Generate Real Razorpay Payment Link (with fallback to mock)
  let paymentLink = `https://rzp.io/i/pl_MOCK${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (keyId && keySecret) {
    try {
      const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
      const response = await fetch('https://api.razorpay.com/v1/payment_links', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reference_id: campaignId.toString(), // Unique reference ID forces a fresh unpaid session
          amount: 1000, // ₹10.00 sandbox transaction
          currency: 'INR',
          accept_partial: false,
          description: `Campaign Checkout: ${title} (${discount})`,
          customer: {
            name: 'Buildathon Judge',
            contact: '+919876543210',
            email: 'judge@razorpay.com'
          },
          notify: {
            sms: false,
            email: false
          },
          reminder_enable: false,
          notes: {
            campaign_id: campaignId.toString(),
            campaign_title: title,
            discount_applied: discount
          }
        })
      });

      if (response.ok) {
        const rzpData = await response.json();
        if (rzpData.short_url) {
          paymentLink = rzpData.short_url;
        }
      } else {
        const errorText = await response.text();
        console.error('Razorpay Error Response:', response.status, errorText);
      }
    } catch (err) {
      console.error('Failed to create Razorpay Payment Link, using mock link:', err);
    }
  }

  // 3. Simulated performance parameters for demo mode
  const simulatedOrders = Math.floor(Math.random() * 20) + 15;
  const simulatedConversion = parseFloat((Math.random() * 5 + 4).toFixed(1));
  const simulatedRevenue = Math.floor(simulatedOrders * (Math.random() * 100 + 150));
  const simulatedEstimate = Math.floor(simulatedRevenue / (1 + (Math.random() * 0.1 + 0.1)));

  const beforeSalesCount = Math.floor(Math.random() * 30) + 50;
  const beforeConversionRate = parseFloat((Math.random() * 1.5 + 2.0).toFixed(1));
  const beforeRevenueVal = Math.floor(beforeSalesCount * (Math.random() * 80 + 150));

  const lift = parseFloat((Math.random() * 0.15 + 0.15).toFixed(3)); // 15% to 30%
  const afterSalesCount = Math.round(beforeSalesCount * (1 + lift));
  const afterConversionRate = parseFloat((beforeConversionRate * (1 + lift * 1.3)).toFixed(1));
  const afterRevenueVal = Math.round(beforeRevenueVal * (1 + lift * 1.1));

  const redemptionCountVal = Math.floor(afterSalesCount * (Math.random() * 0.15 + 0.1));
  const estimatedROIVal = Math.round(((afterRevenueVal - beforeRevenueVal) / beforeRevenueVal) * 100);

  // 4. Build and save the Campaign record with explicit approval timestamps
  const campaign = new Campaign({
    _id: campaignId,
    merchantId,
    title,
    type,
    discount,
    marketingCopy: marketingCopy || 'No promotional message provided.',
    paymentLink,
    status: 'active',
    aiGenerated: !!insightId,
    merchantApproved: true,
    approvedBy: merchantId,
    approvedAt: new Date(),
    ordersCount: simulatedOrders,
    actualRevenue: simulatedRevenue,
    estimatedRevenue: simulatedEstimate,
    conversionRate: simulatedConversion,
    beforeStats: {
      salesCount: beforeSalesCount,
      revenue: beforeRevenueVal,
      conversionRate: beforeConversionRate
    },
    afterStats: {
      salesCount: afterSalesCount,
      revenue: afterRevenueVal,
      conversionRate: afterConversionRate
    },
    redemptionCount: redemptionCountVal,
    estimatedROI: estimatedROIVal
  });

  const savedCampaign = await campaign.save();

  // Create in-app notification
  await Notification.create({
    userId: merchantId,
    message: `Campaign '${title}' is now live`,
    type: 'campaign_live'
  });

  // 5. Update AIInsight status if triggered by an opportunity
  if (insightId) {
    await AIInsight.findByIdAndUpdate(insightId, { status: 'actioned' });

    // Look up or create the AIAction audit log to log decision parameters
    const auditAction = await AIAction.findOne({ merchantId, insightId });
    
    // Determine if values were edited from original AI suggestion
    let merchantEdits = null;
    if (auditAction && auditAction.originalAIProposal) {
      const orig = auditAction.originalAIProposal;
      const isTitleEdited = title !== orig.campaignDetails?.title;
      const isDiscountEdited = discount !== orig.campaignDetails?.discount;
      const isCopyEdited = marketingCopy !== orig.campaignDetails?.marketingCopy;
      
      if (isTitleEdited || isDiscountEdited || isCopyEdited) {
        merchantEdits = { title, discount, marketingCopy, durationDays };
      }
    }

    if (auditAction) {
      auditAction.merchantEditedValues = merchantEdits;
      auditAction.merchantDecision = 'APPROVED';
      auditAction.guardrailResult = guardrailResult;
      auditAction.status = 'EXECUTED';
      auditAction.approvedAt = new Date();
      auditAction.executedAt = new Date();
      auditAction.result = `Campaign launched successfully. Razorpay Smart Link generated: ${paymentLink}`;
      await auditAction.save();
    } else {
      // Fallback action log creation
      const newAudit = new AIAction({
        merchantId,
        insightId,
        actionType: type || 'DISCOUNT_CAMPAIGN',
        originalAIProposal: { campaignDetails: { title, type, discount, marketingCopy } },
        merchantEditedValues: merchantEdits,
        merchantDecision: 'APPROVED',
        guardrailResult,
        approvedAt: new Date(),
        executedAt: new Date(),
        status: 'EXECUTED',
        result: `Campaign launched: ID ${savedCampaign._id}`
      });
      await newAudit.save();
    }
  }

  return savedCampaign;
};

/**
 * Rejects a proposed AI opportunity.
 */
export const executeActionReject = async (merchantId, insightId) => {
  await AIInsight.findByIdAndUpdate(insightId, { status: 'dismissed' });

  const auditAction = await AIAction.findOne({ merchantId, insightId });
  if (auditAction) {
    auditAction.merchantDecision = 'REJECTED';
    auditAction.status = 'REJECTED';
    auditAction.result = 'Merchant dismissed recommendation.';
    await auditAction.save();
  } else {
    const newAudit = new AIAction({
      merchantId,
      insightId,
      actionType: 'DISCOUNT_CAMPAIGN',
      originalAIProposal: {},
      merchantEditedValues: null,
      merchantDecision: 'REJECTED',
      status: 'REJECTED',
      result: 'Merchant dismissed recommendation.'
    });
    await newAudit.save();
  }
};
