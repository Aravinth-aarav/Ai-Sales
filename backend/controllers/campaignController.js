import asyncHandler from 'express-async-handler';
import Campaign from '../models/Campaign.js';
import AIInsight from '../models/AIInsight.js';
import AIAction from '../models/AIAction.js';
import Notification from '../models/Notification.js';
import { executeCampaignLaunch } from '../services/campaignService.js';
import { sendCampaignLaunchEmail } from '../services/emailService.js';

// @desc    Get all campaigns for merchant
// @route   GET /api/campaigns
// @access  Private
export const getCampaigns = asyncHandler(async (req, res) => {
  const campaigns = await Campaign.find({ merchantId: req.user._id }).sort({ createdAt: -1 });
  res.json(campaigns);
});

// @desc    Create/Launch a new campaign (merchant approved)
// @route   POST /api/campaigns
// @access  Private
export const createCampaign = asyncHandler(async (req, res) => {
  const launched = await executeCampaignLaunch(req.user._id, req.body);
  
  // Dispatch asynchronous launch confirmation email
  sendCampaignLaunchEmail(
    req.user.email, 
    launched.title, 
    launched.discount, 
    req.body.durationDays || 10
  ).catch(err => console.error('Email notification failed:', err));

  res.status(201).json(launched);
});

// @desc    Delete a campaign with cascade cleanup & audit trail preservation
// @route   DELETE /api/campaigns/:id
// @access  Private
export const deleteCampaign = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const merchantId = req.user._id;

  const campaign = await Campaign.findOne({ _id: id, merchantId });
  if (!campaign) {
    res.status(404);
    throw new Error('Campaign not found or unauthorized.');
  }

  try {
    const campaignTitleEscaped = campaign.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // 1. Remove AI opportunities/insights tied to this campaign (no longer actionable)
    await AIInsight.deleteMany({
      $or: [
        { campaignId: id },
        { 'suggestedAction.campaignDetails.title': campaign.title }
      ]
    });

    // 2. Preserve AI Audit Trail: mark related logs with campaignDeleted: true
    await AIAction.updateMany(
      {
        $or: [
          { campaignId: id },
          { 'originalAIProposal.campaignDetails.title': campaign.title }
        ]
      },
      { $set: { campaignDeleted: true } }
    );

    // 3. Clean up notifications referencing this campaign
    await Notification.deleteMany({
      $or: [
        { campaignId: id },
        { message: new RegExp(campaignTitleEscaped, 'i') }
      ]
    });

    // 4. Finally, delete the campaign document itself
    await Campaign.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Campaign and associated AI insights cleaned up successfully. Audit trail history preserved.'
    });
  } catch (error) {
    console.error('Cascade campaign deletion failed:', error);
    res.status(500);
    throw new Error(`Failed to clean up and delete campaign: ${error.message}`);
  }
});

// @desc    Get all payment history for admin panel
// @route   GET /api/campaigns/payments
// @access  Private/Admin
export const getPaymentHistory = asyncHandler(async (req, res) => {
  const payments = await Campaign.find({ isPaid: true })
    .populate('merchantId', 'name email')
    .sort({ paidAt: -1, updatedAt: -1 });
  res.json(payments);
});
