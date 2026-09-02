import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import { Megaphone, Calendar, Copy, Check, Info, Sparkles, UserCheck, BarChart3, Smartphone, CreditCard, Landmark, QrCode, ChevronLeft, ChevronRight, X, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Campaigns = () => {
  const { user } = useContext(AuthContext);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [activeTab, setActiveTab] = useState('revenue');
  const campaignsPerPage = 6;

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const { data } = await axios.get('/api/campaigns', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setCampaigns(data);
      } catch (error) {
        console.error('Failed to fetch campaigns:', error);
      }
      setLoading(false);
    };
    fetchCampaigns();
  }, [user]);

  const handleCopyLink = (link) => {
    navigator.clipboard.writeText(link);
    toast.success('📋 Payment link copied to clipboard!');
  };

  // Helper to determine target audience label
  const getAudienceLabel = (type) => {
    switch (type) {
      case 'SALES_TREND':
      case 'WEEKDAY_BOOST':
        return 'Weekday Checkout Shoppers';
      case 'PRODUCT_BUNDLE':
        return 'Co-purchase Cart Shoppers';
      case 'SLOW_MOVING':
        return 'Cold Leads / Idle Cohorts';
      case 'CUSTOMER_SEGMENT':
        return 'Repeat Buying Customers';
      default:
        return 'All Active Customers';
    }
  };

  // Pagination computations
  const totalPages = Math.ceil(campaigns.length / campaignsPerPage);
  const currentCampaigns = campaigns.slice(
    (currentPage - 1) * campaignsPerPage,
    currentPage * campaignsPerPage
  );

  return (
    <div className="space-y-8">
      {/* Header and Title */}
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Megaphone className="text-purple-400" /> Active Campaigns
          </h1>
          <p className="text-gray-400 text-sm mt-1">Manage launched promotions and check simulated performance analytics</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-xl text-xs font-semibold">
          <Info size={14} className="shrink-0" />
          <span>Demo Checkout Mode Active</span>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="glass-panel p-6 rounded-2xl space-y-5 animate-pulse border border-white/[0.02]">
              <div className="flex justify-between">
                <div className="w-16 h-5 bg-white/10 rounded"></div>
                <div className="w-24 h-4 bg-white/10 rounded"></div>
              </div>
              <div className="space-y-2">
                <div className="w-3/4 h-6 bg-white/10 rounded"></div>
                <div className="w-1/2 h-4 bg-white/10 rounded"></div>
              </div>
              <div className="h-12 bg-white/5 rounded-xl border border-white/[0.02]"></div>
              <div className="h-20 bg-white/5 rounded-xl border border-white/[0.02]"></div>
              <div className="grid grid-cols-2 gap-2">
                <div className="h-9 bg-white/5 rounded-xl border border-white/[0.02]"></div>
                <div className="h-9 bg-white/5 rounded-xl border border-white/[0.02]"></div>
              </div>
            </div>
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center border border-white/[0.04] bg-[#0d0c15]/60 rounded-2xl p-12 text-center min-h-[400px] space-y-4 max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Megaphone size={28} />
          </div>
          <h2 className="text-xl font-bold text-white">Create your first campaign</h2>
          <p className="text-gray-400 text-sm leading-relaxed max-w-md">
            Campaigns let you target customers with specific promotions based on sales trends, slow-moving items, or product bundles. Launch your first one today!
          </p>
          <Link
            to="/dashboard"
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-purple-600/30 active:scale-[0.98] inline-block"
          >
            Go to Dashboard & Detect Campaigns
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentCampaigns.map((campaign) => (
            <div key={campaign._id} className="glass-panel glass-panel-hover p-6 rounded-2xl flex flex-col justify-between space-y-5">
              <div className="space-y-4">
                {/* Status and Dates */}
                <div className="flex justify-between items-center">
                  <span className="px-2.5 py-0.5 bg-green-500/15 text-green-400 text-[10px] font-bold rounded border border-green-500/20 uppercase tracking-wider">
                    {campaign.status}
                  </span>
                  <span className="text-gray-500 text-xs flex items-center gap-1">
                    <Calendar size={12} /> {new Date(campaign.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                {/* Title and Promo value */}
                <div>
                  <h3 className="text-lg font-bold text-white leading-snug">{campaign.title}</h3>
                  <div className="flex gap-2 items-center mt-1.5 flex-wrap">
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-yellow-500/10 text-yellow-400 rounded border border-yellow-500/20">
                      {campaign.discount}
                    </span>
                    <span className="text-[10px] font-medium bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded text-gray-300">
                      {campaign.type}
                    </span>
                  </div>
                </div>

                {/* AI / Merchant Badges */}
                <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-b border-white/[0.04] py-2.5">
                  <div className="flex items-center gap-1.5 text-purple-300 font-semibold">
                    <Sparkles size={11} className="text-purple-400" />
                    AI Generated: Yes
                  </div>
                  <div className="flex items-center gap-1.5 text-blue-300 font-semibold">
                    <UserCheck size={11} className="text-blue-400" />
                    Approved: Yes
                  </div>
                  <div className="col-span-2 text-gray-400 mt-1 font-medium">
                    Audience: <span className="text-gray-200 font-semibold">{getAudienceLabel(campaign.type)}</span>
                  </div>
                  <div className="col-span-2 text-gray-400 font-medium">
                    Created By: <span className="text-gray-200 font-semibold">MerchantAI Agent</span>
                  </div>
                </div>

                {/* Marketing Copy text */}
                {campaign.marketingCopy && (
                  <p className="text-gray-300 text-xs italic bg-white/[0.01] border border-white/[0.04] p-3 rounded-xl leading-relaxed">
                    "{campaign.marketingCopy}"
                  </p>
                )}

                 {/* Performance indicators */}
                <div className="bg-purple-600/5 border border-purple-500/10 p-3.5 rounded-xl space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
                      <BarChart3 size={11} /> Simulated Performance
                    </span>
                    <button
                      onClick={() => setSelectedCampaign(campaign)}
                      className="text-[9px] font-extrabold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer flex items-center gap-0.5"
                    >
                      View Lift Analytics <TrendingUp size={10} />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <span className="text-[9px] text-gray-500 block uppercase font-semibold">Orders</span>
                      <span className="text-sm font-bold text-white">{campaign.ordersCount || 0}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-500 block uppercase font-semibold">Conv. Rate</span>
                      <span className="text-sm font-bold text-white">{campaign.conversionRate || 0}%</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-500 block uppercase font-semibold">Revenue</span>
                      <span className="text-sm font-bold text-green-400">₹{(campaign.actualRevenue || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Razorpay Checkout Options */}
              {campaign.paymentLink && (
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center text-[10px] font-bold text-purple-400 tracking-wider uppercase">
                    <span>💳 Razorpay Checkout Options</span>
                    <span className="text-gray-500 text-[9px] font-semibold lowercase italic">Sandbox Test Mode</span>
                  </div>
                  
                  {/* Grid of Payment Methods */}
                  <div className="grid grid-cols-2 gap-2">
                    <Link 
                      to={`/pay/${campaign._id}`}
                      className="flex items-center gap-2 px-3 py-2 bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] hover:border-purple-500/30 rounded-xl text-xs font-semibold text-gray-300 hover:text-white transition-all cursor-pointer"
                    >
                      <Smartphone size={14} className="text-purple-400" />
                      <span>UPI Pay</span>
                    </Link>
                    <Link 
                      to={`/pay/${campaign._id}`}
                      className="flex items-center gap-2 px-3 py-2 bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] hover:border-purple-500/30 rounded-xl text-xs font-semibold text-gray-300 hover:text-white transition-all cursor-pointer"
                    >
                      <CreditCard size={14} className="text-blue-400" />
                      <span>Card Pay</span>
                    </Link>
                    <Link 
                      to={`/pay/${campaign._id}`}
                      className="flex items-center gap-2 px-3 py-2 bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] hover:border-purple-500/30 rounded-xl text-xs font-semibold text-gray-300 hover:text-white transition-all cursor-pointer"
                    >
                      <Landmark size={14} className="text-green-400" />
                      <span>Netbanking</span>
                    </Link>
                    <Link 
                      to={`/pay/${campaign._id}`}
                      className="flex items-center gap-2 px-3 py-2 bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] hover:border-purple-500/30 rounded-xl text-xs font-semibold text-gray-300 hover:text-white transition-all cursor-pointer"
                    >
                      <QrCode size={14} className="text-yellow-400" />
                      <span>Scan QR</span>
                    </Link>
                  </div>

                  {/* Copy Link fallback */}
                  <div className="flex gap-2 items-center bg-white/[0.01] border border-white/[0.04] p-1.5 rounded-xl">
                    <span className="text-[10px] text-gray-500 pl-2 truncate flex-1 font-mono">{campaign.paymentLink}</span>
                    <button 
                      onClick={() => handleCopyLink(campaign.paymentLink)}
                      className="px-2.5 py-1 bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 hover:text-white rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Copy size={10} /> Copy URL
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 pt-8">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`p-2 rounded-xl border transition-all ${
                  currentPage === 1
                    ? 'border-white/[0.04] text-gray-600 cursor-not-allowed'
                    : 'border-white/[0.08] text-white hover:bg-white/[0.04] cursor-pointer'
                }`}
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs text-gray-400">
                Page <strong className="text-white">{currentPage}</strong> of <strong className="text-white">{totalPages}</strong>
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-xl border transition-all ${
                  currentPage === totalPages
                    ? 'border-white/[0.04] text-gray-600 cursor-not-allowed'
                    : 'border-white/[0.08] text-white hover:bg-white/[0.04] cursor-pointer'
                }`}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Analytics Modal */}
      {selectedCampaign && (
        <div className="fixed inset-0 bg-[#06050c]/80 backdrop-blur-md flex justify-center items-center z-50 p-4">
          <div className="bg-[#12111d] border border-white/[0.08] p-6 rounded-2xl w-full max-w-2xl shadow-2xl relative space-y-6">
            
            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <BarChart3 size={20} className="text-purple-400" />
                    Campaign Analytics: {selectedCampaign.title}
                  </h3>
                  <span className="px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded text-[9px] font-bold uppercase tracking-wider">
                    Demo Campaign Performance
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Comparative telemetry showing 30-day baseline vs active campaign lift
                </p>
              </div>
              <button 
                onClick={() => setSelectedCampaign(null)}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Metric Selector Tabs */}
            <div className="flex border-b border-white/[0.06] pb-px">
              {['revenue', 'sales', 'conversion'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                    activeTab === tab
                      ? 'border-purple-500 text-purple-400'
                      : 'border-transparent text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Performance Stats Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/[0.02] border border-white/[0.06] p-4 rounded-xl space-y-1">
                <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-bold">Revenue Lift</span>
                <span className="text-lg font-bold text-green-400 flex items-center gap-1">
                  +{((((selectedCampaign.afterStats?.revenue || 11000) - (selectedCampaign.beforeStats?.revenue || 8500)) / (selectedCampaign.beforeStats?.revenue || 8500)) * 100).toFixed(0)}%
                </span>
              </div>
              
              <div className="bg-white/[0.02] border border-white/[0.06] p-4 rounded-xl space-y-1">
                <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-bold">Redemption Count</span>
                <span className="text-lg font-bold text-white">
                  {selectedCampaign.redemptionCount || 15}
                </span>
              </div>

              <div className="bg-white/[0.02] border border-white/[0.06] p-4 rounded-xl space-y-1">
                <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-bold">Estimated ROI</span>
                <span className="text-lg font-bold text-purple-400">
                  +{selectedCampaign.estimatedROI || 29}%
                </span>
              </div>
            </div>

            {/* Recharts Container */}
            <div className="p-4 bg-white/[0.01] border border-white/[0.04] rounded-xl">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={[
                  {
                    name: '30-Day Before',
                    value: activeTab === 'revenue' 
                      ? (selectedCampaign.beforeStats?.revenue || 8500)
                      : activeTab === 'sales'
                        ? (selectedCampaign.beforeStats?.salesCount || 50)
                        : (selectedCampaign.beforeStats?.conversionRate || 2.1),
                    fill: '#6366f1'
                  },
                  {
                    name: 'Active Campaign',
                    value: activeTab === 'revenue' 
                      ? (selectedCampaign.afterStats?.revenue || 11000)
                      : activeTab === 'sales'
                        ? (selectedCampaign.afterStats?.salesCount || 65)
                        : (selectedCampaign.afterStats?.conversionRate || 2.8),
                    fill: '#a855f7'
                  }
                ]} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} tickLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ background: '#12111d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Footer / Summary description */}
            <div className="flex gap-2 items-start text-xs text-gray-400 bg-white/[0.01] border border-white/[0.04] p-3.5 rounded-xl leading-relaxed">
              <TrendingUp size={16} className="text-green-400 shrink-0 mt-0.5" />
              <span>
                Based on persistent campaign checkout telemetry, the conversion rate jumped from{' '}
                <strong className="text-white">{(selectedCampaign.beforeStats?.conversionRate || 2.1)}%</strong> to{' '}
                <strong className="text-white">{(selectedCampaign.afterStats?.conversionRate || 2.8)}%</strong>, generating a net ROI of{' '}
                <strong className="text-purple-400">+{selectedCampaign.estimatedROI || 29}%</strong>.
              </span>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Campaigns;
