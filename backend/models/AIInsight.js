import mongoose from 'mongoose';

const aiInsightSchema = mongoose.Schema({
  merchantId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  type: { 
    type: String, 
    required: true,
    enum: ['SALES_TREND', 'PRODUCT_BUNDLE', 'SLOW_MOVING', 'BEST_SELLER', 'CUSTOMER_SEGMENT']
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  severity: { type: String, required: true, default: 'medium', enum: ['low', 'medium', 'high'] },
  confidence: { type: Number, required: true, default: 0.8 },
  recommendation: { type: String, required: true },
  suggestedAction: {
    type: { type: String, required: true }, // e.g. DISCOUNT_CAMPAIGN, BUNDLE_CAMPAIGN
    discountPercentage: { type: Number, default: 10 },
    durationDays: { type: Number, default: 7 },
    campaignDetails: {
      title: { type: String },
      type: { type: String },
      discount: { type: String },
      marketingCopy: { type: String }
    }
  },
  expectedImpact: {
    metric: { type: String, default: 'revenue' },
    estimatedIncreasePercentage: { type: String, default: '5-10%' }
  },
  reasoning: { type: String },
  confidenceScore: { type: Number },
  expectedImpactText: { type: String },
  status: { 
    type: String, 
    required: true, 
    default: 'active', 
    enum: ['active', 'dismissed', 'actioned'] 
  },
}, { timestamps: true });

const AIInsight = mongoose.model('AIInsight', aiInsightSchema);
export default AIInsight;
