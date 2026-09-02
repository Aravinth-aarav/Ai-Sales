import { useState } from 'react';
import axios from 'axios';
import { Sparkles, CheckCircle2, X, AlertTriangle, Edit3, Trash2, ArrowRight } from 'lucide-react';

const InsightCard = ({ insightResult, user, onApprove, onClose }) => {
  const { insight, guardrail: initialGuardrail } = insightResult;
  
  const [loading, setLoading] = useState(false);
  const [approved, setApproved] = useState(false);
  const [isEditing, setIsEditing] = useState(!initialGuardrail?.valid); // auto-edit if blocked
  const [guardrailError, setGuardrailError] = useState(initialGuardrail?.valid ? '' : initialGuardrail?.reason);

  // Form states for approval/editing
  const [title, setTitle] = useState(insight.suggestedAction?.campaignDetails?.title || '');
  const [type, setType] = useState(insight.suggestedAction?.campaignDetails?.type || 'Discount');
  const [discount, setDiscount] = useState(insight.suggestedAction?.campaignDetails?.discount || '10% Off');
  const [marketingCopy, setMarketingCopy] = useState(insight.suggestedAction?.campaignDetails?.marketingCopy || '');
  const [durationDays, setDurationDays] = useState(insight.suggestedAction?.durationDays || 7);

  const handleApproveAndLaunch = async () => {
    setLoading(true);
    try {
      const payload = {
        title,
        type,
        discount,
        marketingCopy,
        insightId: insight._id,
        durationDays: parseInt(durationDays, 10) || 7
      };

      await axios.post('/api/campaigns', payload, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      
      setApproved(true);
      if (onApprove) onApprove();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to launch campaign');
    }
    setLoading(false);
  };

  const handleModifyAndLaunch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setGuardrailError('');

    try {
      const payload = {
        title,
        type,
        discount,
        marketingCopy,
        insightId: insight._id,
        durationDays: parseInt(durationDays, 10)
      };

      await axios.post('/api/ai/actions/modify', payload, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      setApproved(true);
      if (onApprove) onApprove();
    } catch (err) {
      console.error(err);
      setGuardrailError(err.response?.data?.reason || err.response?.data?.message || 'Policy validation failed.');
    }
    setLoading(false);
  };

  const handleReject = async () => {
    if (!window.confirm('Dismiss this AI recommendation?')) return;
    setLoading(true);
    try {
      await axios.post(`/api/ai/insights/${insight._id}/reject`, {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to reject opportunity');
    }
    setLoading(false);
  };

  if (approved) {
    return (
      <div className="bg-green-500/10 border border-green-500/20 p-6 rounded-2xl flex flex-col items-center justify-center space-y-3 relative text-center">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-green-300/40 hover:text-white transition-colors cursor-pointer"
          title="Close"
        >
          <X size={16} />
        </button>
        <div className="p-3 bg-green-500/10 text-green-400 rounded-full border border-green-500/20">
          <CheckCircle2 size={32} />
        </div>
        <h3 className="text-md font-bold text-white">Campaign Executed Successfully</h3>
        <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
          The AI Growth action has been launched. Razorpay Smart Link has been generated and audit trails have been recorded.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#120f26]/85 to-[#19122c]/85 border border-purple-500/20 p-6 rounded-2xl shadow-lg relative overflow-hidden flex flex-col justify-between">
      {/* Absolute Dismiss Cross */}
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 text-purple-300/40 hover:text-white transition-colors cursor-pointer z-10"
        title="Dismiss Opportunity"
      >
        <X size={16} />
      </button>

      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-4 flex items-center gap-1.5">
          <Sparkles size={14} className="text-yellow-400" /> AI Growth Agent Suggestion
        </h3>

        {/* Suggestion & Description */}
        <div className="mb-4 space-y-2.5">
          <div>
            <span className="text-[10px] text-purple-400 uppercase tracking-widest font-bold block mb-0.5">AI Suggestion</span>
            <p className="text-white text-sm leading-relaxed font-bold">{insight.recommendation || insight.title}</p>
          </div>
          <div>
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold block mb-0.5">Detected Issue</span>
            <p className="text-gray-300 text-xs leading-relaxed font-medium max-h-24 overflow-y-auto pr-1">{insight.description}</p>
          </div>
          {(insight.reasoning || insight.confidenceScore) && (
            <div className="bg-white/[0.01] border border-white/[0.04] p-3 rounded-xl space-y-1 mt-1">
              <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold block">AI Rationale</span>
              <p className="text-gray-300 text-xs leading-relaxed max-h-24 overflow-y-auto pr-1">{insight.reasoning || 'Based on historical sales trends and inventory levels.'}</p>
              <div className="flex gap-2 items-center text-[10px] text-purple-300/80 font-bold mt-1">
                <span>AI Confidence: {insight.confidenceScore || Math.floor((insight.confidence || 0.8) * 100)}%</span>
                <span className="text-white/20">|</span>
                <span>{insight.expectedImpactText || `Predicted ${insight.expectedImpact?.estimatedIncreasePercentage || '8-12%'} sales lift`}</span>
              </div>
            </div>
          )}
        </div>

        {/* Guardrail Validation Message */}
        {guardrailError && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex gap-2">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block uppercase tracking-wider text-[9px] mb-0.5">Action Blocked by Policy</span>
              <p className="leading-relaxed">{guardrailError}</p>
            </div>
          </div>
        )}

        {/* Action Form / Details block */}
        {isEditing ? (
          <form onSubmit={handleModifyAndLaunch} className="space-y-3.5 pt-2 border-t border-white/[0.04] mb-4">
            <span className="text-[10px] text-purple-400 uppercase tracking-widest font-bold block">Configure Campaign Details</span>
            
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] text-gray-400 font-semibold mb-1 uppercase tracking-wider">Campaign Title</label>
                <input 
                  type="text" 
                  className="w-full bg-white/[0.02] text-white border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-purple-500"
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 font-semibold mb-1 uppercase tracking-wider">Discount Value</label>
                <input 
                  type="text" 
                  className="w-full bg-white/[0.02] text-white border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-purple-500"
                  value={discount} 
                  placeholder="e.g. 10% Off"
                  onChange={(e) => setDiscount(e.target.value)} 
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] text-gray-400 font-semibold mb-1 uppercase tracking-wider">Campaign Type</label>
                <input 
                  type="text" 
                  className="w-full bg-white/[0.02] text-white border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-purple-500"
                  value={type} 
                  onChange={(e) => setType(e.target.value)} 
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 font-semibold mb-1 uppercase tracking-wider">Duration (Days)</label>
                <input 
                  type="number" 
                  className="w-full bg-white/[0.02] text-white border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-purple-500"
                  value={durationDays} 
                  onChange={(e) => setDurationDays(e.target.value)} 
                  max="30"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-gray-400 font-semibold mb-1 uppercase tracking-wider">Promotional Wording</label>
              <textarea 
                className="w-full bg-white/[0.02] text-white border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-purple-500 h-16 resize-none"
                value={marketingCopy} 
                onChange={(e) => setMarketingCopy(e.target.value)} 
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-purple-500/5 cursor-pointer disabled:opacity-50 flex justify-center items-center gap-1.5"
            >
              {loading ? 'Processing...' : 'Apply Modifications & Launch'} <ArrowRight size={12} />
            </button>
          </form>
        ) : (
          <div className="space-y-4 pt-2 border-t border-white/[0.04]">
            {/* Campaign Proposal Details Display */}
            <div className="p-3.5 bg-white/[0.01] border border-white/[0.04] rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-bold px-2 py-0.5 bg-blue-500/10 text-blue-300 rounded border border-blue-500/20 uppercase tracking-wider">
                  {type}
                </span>
                <span className="text-[10px] font-bold text-yellow-400">
                  {discount}
                </span>
              </div>
              <h4 className="text-xs font-bold text-white">{title}</h4>
              <p className="text-gray-400 text-xs italic leading-relaxed max-h-24 overflow-y-auto pr-1">
                "{marketingCopy}"
              </p>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400 font-semibold">Est. Increase:</span>
              <span className="text-green-400 font-bold bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded">
                {insight.expectedImpact?.estimatedIncreasePercentage || '8-12%'}
              </span>
            </div>

            {/* Merchant Control Buttons */}
            <div className="grid grid-cols-3 gap-2.5 pt-2">
              <button 
                onClick={handleApproveAndLaunch}
                disabled={loading}
                className="col-span-2 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-purple-500/5 cursor-pointer disabled:opacity-50 flex justify-center items-center gap-1"
              >
                Approve & Launch
              </button>
              <button 
                onClick={handleReject}
                disabled={loading}
                className="py-2.5 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-50 flex justify-center items-center"
              >
                Reject
              </button>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="w-full py-2 border border-white/[0.08] hover:bg-white/[0.02] text-gray-300 rounded-lg text-xs font-bold transition-all cursor-pointer flex justify-center items-center gap-1"
            >
              <Edit3 size={12} /> Custom Edit Options
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InsightCard;
