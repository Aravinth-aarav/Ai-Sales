import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  CreditCard, 
  Smartphone, 
  Landmark, 
  QrCode, 
  CheckCircle2, 
  Sparkles, 
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  ExternalLink
} from 'lucide-react';

const Pay = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(true); // Toggle Demo Simulator vs Razorpay
  const [selectedMethod, setSelectedMethod] = useState('upi'); // upi, card, netbanking
  const [selectedUpiApp, setSelectedUpiApp] = useState('gpay'); // gpay, phonepe, paytm, bhim, amazon, custom
  const [customUpiId, setCustomUpiId] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [txnId, setTxnId] = useState('');

  // Fetch Campaign Details
  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const { data } = await axios.get('/api/campaigns', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        const found = data.find(c => c._id === id);
        if (found) {
          setCampaign(found);
        }
      } catch (err) {
        console.error('Error fetching campaign details:', err);
      }
      setLoading(false);
    };
    if (user && id) {
      fetchCampaign();
    }
  }, [user, id]);

  const handleSimulatePayment = async () => {
    let upiIdToUse = 'success@razorpay';
    
    if (selectedMethod === 'upi') {
      if (selectedUpiApp === 'custom') {
        if (!customUpiId) {
          toast.error('Please enter a UPI ID');
          return;
        }
        const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
        if (!upiRegex.test(customUpiId)) {
          toast.error('Invalid UPI ID format (e.g. name@upi)');
          return;
        }
        upiIdToUse = customUpiId;
      }
    }

    setIsPaying(true);
    try {
      const mockTxn = `TXN_${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
      
      if (upiIdToUse === 'success@razorpay') {
        // Trigger payment.captured webhook
        await axios.post('/api/webhook/razorpay', {
          event: 'payment.captured',
          payload: {
            payment: {
              entity: {
                id: mockTxn,
                amount: 1000,
                notes: {
                  campaign_id: campaign._id
                }
              }
            }
          }
        }, {
          headers: { 'x-simulation': 'true' }
        });
        
        setTxnId(mockTxn);
        setPaymentSuccess(true);
        toast.success('Simulated payment processed successfully!');
      } else {
        // Trigger payment.failed webhook
        await axios.post('/api/webhook/razorpay', {
          event: 'payment.failed',
          payload: {
            payment: {
              entity: {
                id: mockTxn,
                amount: 1000,
                notes: {
                  campaign_id: campaign._id
                }
              }
            }
          }
        }, {
          headers: { 'x-simulation': 'true' }
        });
        
        toast.error('Simulated payment failed (non-success UPI ID).');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to communicate with payment webhook simulator.');
    } finally {
      setIsPaying(false);
    }
  };

  const getUpiPayload = () => {
    if (!campaign) return '';
    const cleanTitle = encodeURIComponent(campaign.title);
    return `upi://pay?pa=demo@upi&pn=MerchantAI&am=10.00&cu=INR&tn=Campaign_${cleanTitle}`;
  };

  const getQrCodeUrl = () => {
    const data = getUpiPayload();
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&color=9333ea&data=${encodeURIComponent(data)}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#06050c]">
        <span className="animate-spin border-2 border-white/20 border-t-white rounded-full w-8 h-8"></span>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#06050c] text-white p-6 space-y-4">
        <AlertCircle size={48} className="text-red-500" />
        <h2 className="text-xl font-bold">Campaign Not Found</h2>
        <p className="text-gray-400 text-sm">The campaign you are attempting to pay for does not exist or has been deleted.</p>
        <button 
          onClick={() => navigate('/campaigns')}
          className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold cursor-pointer"
        >
          Back to Campaigns
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pt-4 pb-12">
      {/* Top Navigation */}
      <button 
        onClick={() => navigate('/campaigns')}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-all text-xs font-semibold cursor-pointer"
      >
        <ArrowLeft size={14} /> Back to Campaigns
      </button>

      {/* Success Page overlay */}
      {paymentSuccess ? (
        <div className="glass-panel p-8 rounded-3xl text-center space-y-6 border border-green-500/20 bg-green-500/[0.02]">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20 text-green-400 animate-pulse">
              <CheckCircle2 size={36} />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-white">Payment Successful ✅</h2>
            <p className="text-gray-400 text-sm max-w-sm mx-auto leading-relaxed">
              Your transaction has been processed in sandbox test mode. The campaign settings are active.
            </p>
          </div>

          <div className="bg-white/[0.02] border border-white/[0.04] p-4 rounded-2xl max-w-md mx-auto space-y-2.5 text-left text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Transaction ID</span>
              <span className="font-mono text-gray-300 font-bold">{txnId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Campaign Title</span>
              <span className="text-gray-300 font-semibold">{campaign.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Amount Paid</span>
              <span className="text-green-400 font-bold">₹10.00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Mode</span>
              <span className="text-purple-400 font-bold uppercase">Demo Simulator</span>
            </div>
          </div>

          <button 
            onClick={() => navigate('/campaigns')}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg shadow-purple-500/20"
          >
            Go to Active Campaigns
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Left panel: Order Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="glass-panel p-5 rounded-2xl space-y-4">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Checkout Summary</span>
              <div>
                <h3 className="text-lg font-extrabold text-white leading-snug">{campaign.title}</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-yellow-500/10 text-yellow-400 rounded border border-yellow-500/20 inline-block mt-1">
                  {campaign.discount}
                </span>
              </div>

              <div className="border-t border-white/[0.04] pt-4 space-y-2 text-xs">
                <div className="flex justify-between text-gray-400">
                  <span>Target Cohort</span>
                  <span className="text-gray-200 font-medium">{campaign.type}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal</span>
                  <span className="text-gray-200 font-medium">₹10.00</span>
                </div>
                <div className="flex justify-between text-gray-400 border-t border-dashed border-white/[0.06] pt-2 mt-2">
                  <span className="font-bold text-white">Amount Payable</span>
                  <span className="font-bold text-purple-400">₹10.00</span>
                </div>
              </div>
            </div>

            {/* Mode Switcher */}
            <div className="glass-panel p-4 rounded-2xl space-y-3">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Gateway Config</span>
              <div className="flex gap-1.5 bg-white/[0.02] border border-white/[0.06] p-1 rounded-xl">
                <button
                  onClick={() => setDemoMode(true)}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    demoMode 
                      ? 'bg-purple-600 text-white shadow' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Demo Simulator
                </button>
                <button
                  onClick={() => setDemoMode(false)}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    !demoMode 
                      ? 'bg-purple-600 text-white shadow' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Razorpay Live
                </button>
              </div>
              
              <div className="flex items-center gap-1.5 text-[10px] text-gray-500 bg-white/[0.01] border border-white/[0.03] p-2.5 rounded-xl leading-relaxed">
                <ShieldCheck size={14} className="text-purple-400 shrink-0" />
                <span>
                  {demoMode 
                    ? "Interactive sandbox simulator. No API hits will be triggered."
                    : "Processes checkout directly using live Razorpay sandbox integrations."}
                </span>
              </div>
            </div>
          </div>

          {/* Right panel: Payment interface */}
          <div className="md:col-span-3">
            {demoMode ? (
              <div className="glass-panel p-6 rounded-2xl space-y-5 relative overflow-hidden">
                {/* Banner */}
                <div className="absolute top-0 right-0 bg-purple-500/25 border-b border-l border-purple-500/30 text-purple-300 font-bold text-[9px] px-3 py-1 uppercase tracking-widest rounded-bl-xl">
                  Demo Mode
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">Select UPI Method</h3>
                  <p className="text-gray-400 text-xs">Choose your application to scan or complete checkout</p>
                </div>

                {/* Tabs for Payment Channels */}
                <div className="flex gap-2 border-b border-white/[0.04] pb-2">
                  <button
                    onClick={() => setSelectedMethod('upi')}
                    className={`pb-1 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                      selectedMethod === 'upi' ? 'text-purple-400 border-purple-500' : 'text-gray-500 border-transparent hover:text-gray-300'
                    }`}
                  >
                    UPI Apps & QR
                  </button>
                  <button
                    onClick={() => setSelectedMethod('card')}
                    className={`pb-1 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                      selectedMethod === 'card' ? 'text-purple-400 border-purple-500' : 'text-gray-500 border-transparent hover:text-gray-300'
                    }`}
                  >
                    Card
                  </button>
                  <button
                    onClick={() => setSelectedMethod('netbanking')}
                    className={`pb-1 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                      selectedMethod === 'netbanking' ? 'text-purple-400 border-purple-500' : 'text-gray-500 border-transparent hover:text-gray-300'
                    }`}
                  >
                    Netbanking
                  </button>
                </div>

                {/* UPI Layout */}
                {selectedMethod === 'upi' && (
                  <div className="space-y-4">
                    {/* Grid of Apps */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'gpay', name: 'Google Pay', color: 'border-blue-500/30 text-blue-300 bg-blue-500/5' },
                        { id: 'phonepe', name: 'PhonePe', color: 'border-purple-500/30 text-purple-300 bg-purple-500/5' },
                        { id: 'paytm', name: 'Paytm', color: 'border-cyan-500/30 text-cyan-300 bg-cyan-500/5' },
                        { id: 'bhim', name: 'BHIM UPI', color: 'border-orange-500/30 text-orange-300 bg-orange-500/5' },
                        { id: 'amazon', name: 'Amazon Pay', color: 'border-yellow-500/30 text-yellow-300 bg-yellow-500/5' },
                        { id: 'custom', name: 'UPI ID', color: 'border-gray-500/30 text-gray-300 bg-gray-500/5' }
                      ].map((app) => (
                        <button
                          key={app.id}
                          onClick={() => setSelectedUpiApp(app.id)}
                          className={`p-2.5 border rounded-xl text-[10px] font-bold text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                            selectedUpiApp === app.id 
                              ? `${app.color} border-2` 
                              : 'border-white/[0.06] bg-white/[0.01] text-gray-400 hover:bg-white/[0.04]'
                          }`}
                        >
                          <Smartphone size={16} />
                          <span>{app.name}</span>
                        </button>
                      ))}
                    </div>

                    {/* Custom UPI ID form */}
                    {selectedUpiApp === 'custom' && (
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="success@razorpay"
                          value={customUpiId}
                          onChange={(e) => setCustomUpiId(e.target.value)}
                          className="w-full bg-white/[0.01] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-purple-500 transition-all font-mono"
                        />
                        <div className="text-[10px] text-gray-500 bg-white/[0.01] border border-white/[0.04] p-2.5 rounded-xl leading-relaxed text-left">
                          💡 <strong>Test UPI ID:</strong> Enter <code className="text-purple-400 font-bold bg-white/[0.04] px-1 py-0.5 rounded font-mono">success@razorpay</code> to process a successful payment. Any other valid format will simulate a payment failure event.
                        </div>
                      </div>
                    )}

                    {/* QR Code and Simulator */}
                    <div className="flex flex-col items-center space-y-4 pt-2 border-t border-white/[0.04]">
                      <div className="p-3 bg-white rounded-2xl shadow-xl border border-white/10">
                        <img 
                          src={getQrCodeUrl()} 
                          alt="UPI Payment QR Code" 
                          className="w-[180px] h-[180px] object-contain"
                        />
                      </div>
                      <div className="text-center space-y-1">
                        <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest flex items-center gap-1 justify-center">
                          <QrCode size={12} /> Scan QR with any app
                        </span>
                        <p className="text-[9px] text-gray-500">Scan to pay exactly ₹10.00 to MerchantAI</p>
                      </div>

                      <button
                        onClick={handleSimulatePayment}
                        disabled={isPaying}
                        className="w-full py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 disabled:from-gray-700 disabled:to-gray-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-purple-500/20 disabled:shadow-none"
                      >
                        {isPaying ? (
                          <>
                            <span className="animate-spin border-2 border-white/20 border-t-white rounded-full w-3.5 h-3.5"></span>
                            Processing Demo Payment...
                          </>
                        ) : (
                          <>
                            Simulate Payment Success
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Card Payment Simulation */}
                {selectedMethod === 'card' && (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-gray-500 uppercase">Card Number</span>
                        <input
                          type="text"
                          placeholder="4111 1111 1111 1111"
                          readOnly
                          className="w-full bg-white/[0.02] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-gray-400 outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-gray-500 uppercase">Expiry</span>
                          <input
                            type="text"
                            placeholder="12 / 30"
                            readOnly
                            className="w-full bg-white/[0.02] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-gray-400 outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-gray-500 uppercase">CVV</span>
                          <input
                            type="password"
                            placeholder="***"
                            readOnly
                            className="w-full bg-white/[0.02] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-gray-400 outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleSimulatePayment}
                      disabled={isPaying}
                      className="w-full py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-purple-500/20"
                    >
                      {isPaying ? 'Processing...' : 'Pay ₹10.00 via Test Card'}
                    </button>
                  </div>
                )}

                {/* Netbanking Simulation */}
                {selectedMethod === 'netbanking' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      {['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank'].map((bank) => (
                        <button
                          key={bank}
                          onClick={handleSimulatePayment}
                          className="p-3 border border-white/[0.06] bg-white/[0.01] hover:bg-white/[0.04] rounded-xl text-xs text-gray-300 font-semibold text-center cursor-pointer transition-all"
                        >
                          {bank}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Razorpay Live redirect flow */
              <div className="glass-panel p-6 rounded-2xl space-y-6 text-center">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 mx-auto">
                  <CreditCard size={24} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-white">Razorpay Checkout</h3>
                  <p className="text-gray-400 text-xs max-w-xs mx-auto leading-relaxed">
                    You have selected the Live Sandbox Gateway. Proceed to open the Razorpay payment checkouts widget.
                  </p>
                </div>

                <a
                  href={campaign.paymentLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg shadow-blue-600/20"
                >
                  Proceed to Razorpay Checkout <ExternalLink size={14} />
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Pay;
