import mongoose from 'mongoose';

const campaignSchema = mongoose.Schema({
  merchantId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  title: { type: String, required: true },
  type: { type: String, required: true }, 
  discount: { type: String, required: true },
  marketingCopy: { type: String },
  paymentLink: { type: String },
  status: { 
    type: String, 
    required: true, 
    default: 'active', 
    enum: ['DRAFT', 'PENDING_APPROVAL', 'active', 'completed', 'REJECTED', 'FAILED', 'created'] 
  },
  aiGenerated: { type: Boolean, default: false },
  merchantApproved: { type: Boolean, default: false },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  
  // Performance Metrics
  ordersCount: { type: Number, default: 0 },
  actualRevenue: { type: Number, default: 0 },
  estimatedRevenue: { type: Number, default: 0 },
  conversionRate: { type: Number, default: 0 },
  beforeStats: {
    salesCount: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 }
  },
  afterStats: {
    salesCount: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 }
  },
  redemptionCount: { type: Number, default: 0 },
  estimatedROI: { type: Number, default: 0 },
}, { timestamps: true });

const Campaign = mongoose.model('Campaign', campaignSchema);
export default Campaign;
