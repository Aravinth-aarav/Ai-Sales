import mongoose from 'mongoose';

const aiActionSchema = mongoose.Schema({
  merchantId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  insightId: { type: mongoose.Schema.Types.ObjectId, ref: 'AIInsight' },
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
  campaignDeleted: { type: Boolean, default: false },
  actionType: { type: String, required: true }, // e.g. DISCOUNT_CAMPAIGN, BUNDLE_CAMPAIGN
  originalAIProposal: { type: mongoose.Schema.Types.Mixed, required: true },
  merchantEditedValues: { type: mongoose.Schema.Types.Mixed, default: null },
  merchantDecision: { 
    type: String, 
    required: true, 
    enum: ['APPROVED', 'REJECTED', 'BLOCKED', 'PENDING'], 
    default: 'PENDING' 
  },
  guardrailResult: { type: mongoose.Schema.Types.Mixed },
  status: { 
    type: String, 
    required: true, 
    default: 'PROPOSED', 
    enum: ['PROPOSED', 'APPROVED', 'REJECTED', 'EXECUTED', 'BLOCKED', 'FAILED'] 
  },
  approvedAt: { type: Date },
  executedAt: { type: Date },
  failureReason: { type: String },
}, { timestamps: true });

const AIAction = mongoose.model('AIAction', aiActionSchema);
export default AIAction;
