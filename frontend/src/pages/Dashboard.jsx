import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import InsightCard from '../components/InsightCard';
import DataImportSection from '../components/DataImportSection';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Sparkles, DollarSign, ShoppingBag, TrendingUp, RefreshCw, Layers, Calendar, BarChart3, AlertCircle, Megaphone, CheckCircle, IndianRupee } from 'lucide-react';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [sales, setSales] = useState([]);
  const [loadingSeed, setLoadingSeed] = useState(false);
  
  // Dashboard Metrics state
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalTransactions: 0,
    averageOrderValue: 0,
    revenueGrowthPercentage: 0,
    bestSellingProduct: 'Loading...',
    activeCampaignsCount: 0,
    aiOpportunitiesCount: 0,
    estimatedRevenueOpportunity: 0,
    beforevsAfter: { beforeRevenue: 0, afterRevenue: 0, liftPercentage: 0 }
  });

  // Summary Cards State
  const [summary, setSummary] = useState({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalRevenue: 0,
    totalPaymentsReceived: 0
  });
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  // Cached AI insight retrieval with expiration check
  const [insightResult, setInsightResult] = useState(() => {
    try {
      const cached = localStorage.getItem('ai_insight_v2');
      if (cached) {
        const parsed = JSON.parse(cached);
        const ageMs = Date.now() - parsed.timestamp;
        // 1 hour TTL (3600000 ms)
        if (ageMs < 3600000) {
          return parsed.data;
        } else {
          localStorage.removeItem('ai_insight_v2');
        }
      }
    } catch (e) {
      console.error('Failed to parse cached insight:', e);
    }
    return null;
  });

  const [loadingInsight, setLoadingInsight] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0); // 0: Idle, 1: Sales analysis, 2: Opportunity detection, 3: Guardrail check
  const [insightError, setInsightError] = useState('');
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  // Fetch metrics & sales data
  const fetchData = async () => {
    setLoadingMetrics(true);
    setLoadingSummary(true);
    setFetchError(false);
    try {
      // 1. Fetch sales list for chart
      const { data: salesData } = await axios.get('/api/sales', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setSales(salesData);

      // 2. Fetch aggregated dashboard metrics
      const { data: metricsData } = await axios.get('/api/analytics/dashboard', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setMetrics(metricsData);

      // 3. Fetch summary cards data
      const { data: summaryData } = await axios.get('/api/dashboard/summary', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setSummary(summaryData);
    } catch (error) {
      console.error('Failed to retrieve analytics dashboard metrics:', error);
      setFetchError(true);
    }
    setLoadingMetrics(false);
    setLoadingSummary(false);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Loading animation sequencer
  useEffect(() => {
    let timer;
    if (loadingInsight) {
      setLoadingStep(1);
      timer = setInterval(() => {
        setLoadingStep(prev => {
          if (prev >= 3) {
            clearInterval(timer);
            return prev;
          }
          return prev + 1;
        });
      }, 1200);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(timer);
  }, [loadingInsight]);

  const handleGetInsight = async () => {
    setLoadingInsight(true);
    setInsightError('');
    try {
      const { data } = await axios.get('/api/ai/insights', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      
      setInsightResult(data);
      // Cache with current timestamp
      localStorage.setItem('ai_insight_v2', JSON.stringify({
        data,
        timestamp: Date.now()
      }));

      // Refresh metrics counts
      fetchData();
    } catch (error) {
      setInsightError(error.response?.data?.message || 'Gemini AI service failed. Please try again.');
    }
    setLoadingInsight(false);
  };

  const handleCloseInsight = () => {
    setInsightResult(null);
    localStorage.removeItem('ai_insight_v2');
    fetchData(); // reload dashboard metrics count
  };

  const handleSeedDemo = async () => {
    setLoadingSeed(true);
    try {
      await axios.post('/api/analytics/demo/load', {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      toast.success('🎉 Demo data successfully initialized! Welcome to MerchantAI.');
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to load onboarding sample data.');
    }
    setLoadingSeed(false);
  };

  const chartData = sales.reduce((acc, sale) => {
    const date = new Date(sale.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const existing = acc.find(item => item.date === date);
    if (existing) {
      existing.revenue += sale.revenue;
    } else {
      acc.push({ date, revenue: sale.revenue });
    }
    return acc;
  }, []).reverse().slice(-10); // display last 10 days for clarity

  // Full-page Error State
  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 border border-red-500/20">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-bold text-white">Failed to load workspace telemetry</h2>
        <p className="text-gray-400 text-sm max-w-sm leading-relaxed">
          The server encountered an error retrieving your store insights or campaign states. Please verify the server is running.
        </p>
        <button 
          onClick={fetchData}
          className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 active:scale-[0.98] text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-lg shadow-purple-600/20"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  // Dashboard Empty State for First-Time Users
  if (sales.length === 0 && !loadingMetrics && !loadingSummary) {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">MerchantAI Workspace</h1>
            <p className="text-gray-400 text-sm mt-1">Autonomous growth analysis and agentic campaign execution dashboard</p>
          </div>
        </div>

        {/* Designed Empty State with Dual Data Input System */}
        <div className="border border-white/[0.04] bg-[#0d0c15]/60 rounded-2xl p-8 space-y-6">
          <div className="text-center space-y-2 max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mx-auto">
              <Sparkles size={26} className="animate-pulse" />
            </div>
            <h2 className="text-xl font-bold text-white">No campaigns yet!</h2>
            <p className="text-gray-400 text-xs leading-relaxed">
              Your growth campaign dashboard is currently empty. To see how MerchantAI automatically scans sales telemetry, validates promotional safety, and launches campaign checkouts, seed demo data or import your real merchant sales CSV.
            </p>
          </div>

          <DataImportSection onSuccess={fetchData} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">MerchantAI Workspace</h1>
          <p className="text-gray-400 text-sm mt-1">Autonomous growth analysis and agentic campaign execution dashboard</p>
        </div>
        <button 
          onClick={fetchData}
          disabled={loadingMetrics}
          className="px-4 py-2 border border-white/[0.08] hover:bg-white/[0.03] text-gray-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={13} className={loadingMetrics ? 'animate-spin' : ''} />
          Sync Dashboard Data
        </button>
      </div>

      {/* Onboarding Welcome Banner */}
      {sales.length === 0 && !loadingMetrics && (
        <div className="glass-panel p-8 rounded-2xl border border-purple-500/20 bg-gradient-to-r from-purple-950/10 via-indigo-950/5 to-transparent flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-xl font-bold text-white flex items-center justify-center md:justify-start gap-2">
              <Sparkles size={20} className="text-purple-400" /> Welcome to MerchantAI!
            </h2>
            <p className="text-gray-400 text-sm max-w-xl leading-relaxed">
              It looks like your workspace is empty. To see how MerchantAI scans transactional data and generates safety-validated Razorpay checkout links, initialize the sandbox with sample store telemetry.
            </p>
          </div>
          <button
            onClick={handleSeedDemo}
            disabled={loadingSeed}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 active:scale-[0.98] rounded-xl text-white font-bold transition-all cursor-pointer shadow-lg shadow-purple-600/30 shrink-0"
          >
            {loadingSeed ? 'Seeding sandbox...' : 'Load Sample Data'}
          </button>
        </div>
      )}

      {/* 4 Summary Cards Grid */}
      {loadingSummary ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-panel p-5 rounded-2xl animate-pulse space-y-3 border border-white/[0.02]">
              <div className="flex justify-between items-center">
                <div className="h-3 w-16 bg-white/10 rounded"></div>
                <div className="w-7 h-7 bg-white/10 rounded-lg"></div>
              </div>
              <div className="h-6 w-24 bg-white/10 rounded"></div>
              <div className="h-2 w-12 bg-white/10 rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Campaigns */}
          <div className="glass-panel p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between min-h-[120px] border border-white/[0.04]">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Campaigns</span>
              <div className="p-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl">
                <Megaphone size={14} />
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <span className="text-2xl font-extrabold text-white block">
                {summary.totalCampaigns}
              </span>
              <span className="text-[10px] text-green-400 font-medium">
                ↑ 8% vs last month
              </span>
            </div>
          </div>

          {/* Active Campaigns */}
          <div className="glass-panel p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between min-h-[120px] border border-white/[0.04]">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Active Campaigns</span>
              <div className="p-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl">
                <CheckCircle size={14} />
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <span className="text-2xl font-extrabold text-white block">
                {summary.activeCampaigns}
              </span>
              <span className="text-[10px] text-purple-300 font-medium">
                Running live now
              </span>
            </div>
          </div>

          {/* Total Revenue */}
          <div className="glass-panel p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between min-h-[120px] border border-white/[0.04]">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Revenue</span>
              <div className="p-2 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl">
                <TrendingUp size={14} />
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <span className="text-2xl font-extrabold text-white block">
                ₹{summary.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0 })}
              </span>
              <span className="text-[10px] text-green-400 font-medium">
                ↑ 12% vs last week
              </span>
            </div>
          </div>

          {/* Payments Received */}
          <div className="glass-panel p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between min-h-[120px] border border-white/[0.04]">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Payments Received</span>
              <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-xl">
                <IndianRupee size={14} />
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <span className="text-2xl font-extrabold text-white block">
                ₹{summary.totalPaymentsReceived.toLocaleString(undefined, { minimumFractionDigits: 0 })}
              </span>
              <span className="text-[10px] text-gray-400 font-medium">
                Verified checkout sum
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Revenue */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden flex items-center justify-between border border-white/[0.04]">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Revenue</span>
            <span className="text-2xl font-extrabold text-white block">
              ₹{metrics.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0 })}
            </span>
          </div>
          <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl">
            <DollarSign size={20} />
          </div>
        </div>

        {/* Total Transactions */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden flex items-center justify-between border border-white/[0.04]">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Transactions</span>
            <span className="text-2xl font-extrabold text-white block">{metrics.totalTransactions}</span>
          </div>
          <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl">
            <ShoppingBag size={20} />
          </div>
        </div>

        {/* Average Order Value */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden flex items-center justify-between border border-white/[0.04]">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Avg Order Value</span>
            <span className="text-2xl font-extrabold text-white block">
              ₹{metrics.averageOrderValue.toLocaleString(undefined, { minimumFractionDigits: 0 })}
            </span>
          </div>
          <div className="p-2.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-xl">
            <TrendingUp size={20} />
          </div>
        </div>

        {/* Growth Indicator */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden flex items-center justify-between border border-white/[0.04]">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Revenue Growth</span>
            <span className="text-2xl font-extrabold text-green-400 block">+{metrics.revenueGrowthPercentage}%</span>
          </div>
          <div className="p-2.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl">
            <BarChart3 size={20} />
          </div>
        </div>
      </div>

      {/* Second Row Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="glass-panel px-5 py-4 rounded-xl flex items-center gap-3 border border-white/[0.04]">
          <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-ping"></div>
          <span className="text-xs text-gray-400">Active Campaigns: <strong className="text-white font-bold ml-1">{metrics.activeCampaignsCount}</strong></span>
        </div>
        <div className="glass-panel px-5 py-4 rounded-xl flex items-center gap-3 border border-white/[0.04]">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
          <span className="text-xs text-gray-400">Best Seller: <strong className="text-white font-bold ml-1">{metrics.bestSellingProduct}</strong></span>
        </div>
        <div className="glass-panel px-5 py-4 rounded-xl flex items-center gap-3 border border-white/[0.04]">
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
          <span className="text-xs text-gray-400">Pending AI Actions: <strong className="text-white font-bold ml-1">{metrics.aiOpportunitiesCount}</strong></span>
        </div>
      </div>

      {/* Main Grid: Charts & Growth Assistant */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch">
        
        {/* Analytics & Before/After performance */}
        <div className="xl:col-span-2 space-y-6 flex flex-col">
          {/* Revenue chart */}
          <div className="glass-panel p-6 rounded-2xl flex-1 flex flex-col justify-between min-h-[340px] border border-white/[0.04]">
            <div>
              <h2 className="text-lg font-bold text-white">Daily Revenue Flow</h2>
              <p className="text-xs text-gray-400 mt-0.5 mb-2">Recent daily store checkout totals</p>
            </div>
            <div className="flex-1 min-h-[220px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="date" stroke="#9CA3AF" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9CA3AF" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(11, 10, 25, 0.95)', 
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '11px'
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#8b5cf6" 
                    strokeWidth={2.5} 
                    dot={{ r: 4, stroke: '#06050c', strokeWidth: 1.5, fill: '#8b5cf6' }} 
                    activeDot={{ r: 6 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Before vs After Campaign lift tracker */}
          <div className="glass-panel p-6 rounded-2xl border border-white/[0.04]">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-md font-bold text-white">Campaign Performance Tracking</h3>
                <span className="text-[10px] bg-purple-500/10 border border-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                  Simulation Measurement Mode
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold block">Total Revenue Lift</span>
                <span className="text-lg font-extrabold text-green-400">+{metrics.beforevsAfter.liftPercentage}%</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/[0.01] border border-white/[0.04] p-4 rounded-xl text-center">
                <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Estimated Baseline Revenue</span>
                <span className="text-xl font-extrabold text-gray-300">
                  ₹{metrics.beforevsAfter.beforeRevenue.toLocaleString()}
                </span>
              </div>
              <div className="bg-white/[0.01] border border-purple-500/10 p-4 rounded-xl text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-8 h-8 bg-purple-500/5 rounded-full blur-md"></div>
                <span className="text-[10px] text-purple-400 uppercase font-bold block mb-1">Actual Measured Revenue</span>
                <span className="text-xl font-extrabold text-purple-300">
                  ₹{metrics.beforevsAfter.afterRevenue.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Growth Agent container */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden min-h-[400px] border border-white/[0.04]">
          {/* Neon Glow backdrop */}
          <div className="absolute -top-20 -right-20 w-44 h-44 bg-purple-600/10 rounded-full blur-[80px] pointer-events-none"></div>

          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles size={18} className="text-purple-400" /> AI Growth Agent
            </h2>
            <p className="text-gray-400 text-xs mt-1.5 leading-relaxed">
              Analyzes transaction logs to uncover sales trends, product co-purchases, or slow-moving stock, proposing validation-tested checkout promotions.
            </p>
          </div>

          {/* Dynamic AI Loading experience & InsightCard wrapper */}
          <div className="my-6 flex-1 flex flex-col justify-center">
            {loadingInsight ? (
              <div className="p-6 bg-white/[0.01] border border-white/[0.04] rounded-2xl space-y-4 text-center">
                <div className="relative w-12 h-12 mx-auto">
                  <div className="absolute inset-0 rounded-full border-2 border-purple-500/10"></div>
                  <div className="absolute inset-0 rounded-full border-2 border-t-purple-400 animate-spin"></div>
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-purple-300">🤖 AI Agent running...</h4>
                  <div className="text-[11px] text-gray-400 space-y-1">
                    <p className={loadingStep >= 1 ? 'text-gray-200' : 'opacity-40'}>
                      • Aggregating sales metrics...
                    </p>
                    <p className={loadingStep >= 2 ? 'text-gray-200' : 'opacity-40'}>
                      • Detecting store opportunities...
                    </p>
                    <p className={loadingStep >= 3 ? 'text-gray-200' : 'opacity-40'}>
                      • Validating policy safety guardrails...
                    </p>
                  </div>
                </div>
              </div>
            ) : insightError ? (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs flex gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <div>
                  <h4 className="font-bold text-[9px] uppercase tracking-wider mb-0.5">Analysis Failed</h4>
                  <p>{insightError}</p>
                </div>
              </div>
            ) : insightResult ? (
              <InsightCard 
                insightResult={insightResult} 
                user={user} 
                onApprove={fetchData}
                onClose={handleCloseInsight} 
              />
            ) : sales.length === 0 ? (
              <div className="text-center py-6 space-y-3">
                <BarChart3 className="text-gray-600 w-12 h-12 mx-auto" />
                <p className="text-xs text-gray-400 max-w-[220px] mx-auto leading-relaxed">
                  Add some sales data first, so AI can analyze it and suggest campaigns.
                </p>
                <button
                  onClick={handleSeedDemo}
                  disabled={loadingSeed}
                  className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  Seed Demo Data
                </button>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-xs text-gray-500 max-w-[200px] mx-auto leading-relaxed">
                  No cached recommendations. Click below to execute a real-time data scan.
                </p>
              </div>
            )}
          </div>

          {/* Action triggers */}
          {!insightResult && !loadingInsight && sales.length > 0 && (
            <button 
              onClick={handleGetInsight} 
              className="w-full py-3.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 active:scale-[0.98] rounded-xl text-white font-bold transition-all flex justify-center items-center gap-2 cursor-pointer shadow-lg shadow-purple-500/10"
            >
              <Sparkles size={14} /> Detect Opportunities
            </button>
          )}

          {insightResult && !loadingInsight && (
            <button 
              onClick={handleGetInsight} 
              className="w-full py-2 border border-purple-500/20 hover:bg-purple-500/5 text-purple-300 rounded-xl text-xs font-bold transition-all flex justify-center items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={12} /> Force Refresh Insight
            </button>
          )}
        </div>
      </div>

      {/* Data Management System */}
      <div className="pt-4 border-t border-white/[0.04]">
        <DataImportSection onSuccess={fetchData} />
      </div>
    </div>
  );
};

export default Dashboard;
