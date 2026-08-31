import asyncHandler from 'express-async-handler';
import Campaign from '../models/Campaign.js';
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

// @desc    Delete a campaign
// @route   DELETE /api/campaigns/:id
// @access  Private
export const deleteCampaign = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findOne({ _id: req.params.id, merchantId: req.user._id });
  if (!campaign) {
    res.status(404);
    throw new Error('Campaign not found or unauthorized.');
  }
  await Campaign.deleteOne({ _id: req.params.id });
  res.json({ message: 'Campaign deleted successfully.' });
});
