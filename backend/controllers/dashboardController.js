import asyncHandler from 'express-async-handler';
import Campaign from '../models/Campaign.js';

// @desc    Get dashboard summary metrics
// @route   GET /api/dashboard/summary
// @access  Private
export const getDashboardSummary = asyncHandler(async (req, res) => {
  try {
    const totalCampaigns = await Campaign.countDocuments({ merchantId: req.user._id });
    const activeCampaigns = await Campaign.countDocuments({ merchantId: req.user._id, status: 'active' });

    const totals = await Campaign.aggregate([
      { $match: { merchantId: req.user._id } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$afterStats.revenue' },
          totalPaymentsReceived: { $sum: '$actualRevenue' }
        }
      }
    ]);

    const totalRevenue = totals.length > 0 ? totals[0].totalRevenue : 0;
    const totalPaymentsReceived = totals.length > 0 ? totals[0].totalPaymentsReceived : 0;

    res.json({
      totalCampaigns,
      activeCampaigns,
      totalRevenue,
      totalPaymentsReceived
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
