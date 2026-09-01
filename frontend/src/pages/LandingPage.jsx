import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Sparkles, CreditCard, BarChart3, Settings, ArrowRight, Layers, Zap } from 'lucide-react';

const LandingPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleCTA = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-[#06050c] text-white flex flex-col justify-between selection:bg-purple-600/30 selection:text-white">
      {/* Top Header/Navigation */}
      <header className="w-full max-w-7xl mx-auto px-6 py-5 flex justify-between items-center border-b border-white/[0.04] z-10 relative">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-extrabold shadow-lg shadow-purple-600/30">
            M
          </div>
          <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
            MerchantAI
          </span>
        </div>
        <div>
          {user ? (
            <Link
              to="/dashboard"
              className="px-4 py-2 bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/30 hover:border-purple-500/50 rounded-xl text-xs font-bold text-purple-300 transition-all cursor-pointer"
            >
              Go to Workspace
            </Link>
          ) : (
            <Link
              to="/login"
              className="px-4 py-2 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-white/[0.15] rounded-xl text-xs font-bold text-white transition-all cursor-pointer"
            >
              Merchant Login
            </Link>
          )}
        </div>
      </header>

      {/* Main Hero & Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 md:py-20 space-y-24">
        {/* Hero Section */}
        <section className="relative flex flex-col items-center text-center space-y-6 max-w-3xl mx-auto py-8">
          {/* Subtle background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-purple-600/10 rounded-full blur-[80px] pointer-events-none"></div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-[10px] font-bold text-purple-300 uppercase tracking-wider">
            <Sparkles size={11} className="text-yellow-400" /> Razorpay Buildathon Submission
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] text-white">
            AI-Powered Campaigns for{' '}
            <span className="bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
              Smarter Merchants
            </span>
          </h1>

          <p className="text-gray-400 text-sm sm:text-base max-w-xl leading-relaxed">
            Autonomous growth analysis that scans your store transactions, uncovers leaks, generates safety-tested discounts, and issues instant Razorpay checkout links.
          </p>

          <button
            onClick={handleCTA}
            className="px-6 py-3.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 active:scale-[0.98] rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow-xl shadow-purple-500/20 flex items-center gap-1.5"
          >
            {user ? 'Open Workspace' : 'Get Started'} <ArrowRight size={14} />
          </button>
        </section>

        {/* Features Grid */}
        <section className="space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-white">Powerful Commerce Intelligence</h2>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Everything you need to shift from passive dashboards to proactive growth marketing.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 */}
            <div className="bg-white/[0.01] hover:bg-white/[0.02] border border-white/[0.04] hover:border-purple-500/20 p-6 rounded-2xl transition-all space-y-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Sparkles size={18} />
              </div>
              <h3 className="text-sm font-bold text-white">AI Suggestion Loops</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Aggregates order records to detect cold inventory or customer retention leaks and suggests targeted solutions.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white/[0.01] hover:bg-white/[0.02] border border-white/[0.04] hover:border-purple-500/20 p-6 rounded-2xl transition-all space-y-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <CreditCard size={18} />
              </div>
              <h3 className="text-sm font-bold text-white">Razorpay Smart Links</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Programmatically issues live sandbox checkout URLs pre-configured with the merchant's exact campaign settings.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white/[0.01] hover:bg-white/[0.02] border border-white/[0.04] hover:border-purple-500/20 p-6 rounded-2xl transition-all space-y-4">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
                <BarChart3 size={18} />
              </div>
              <h3 className="text-sm font-bold text-white">Before/After Analytics</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Measures pre-promotion performance baselines against active campaign lifts using visual graphs.
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-white/[0.01] hover:bg-white/[0.02] border border-white/[0.04] hover:border-purple-500/20 p-6 rounded-2xl transition-all space-y-4">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400">
                <Settings size={18} />
              </div>
              <h3 className="text-sm font-bold text-white">Admin Control Panel</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Oversees safety guardrails, reviews action audit logs, cleans old logs, and manages active merchant tenants.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-white">How It Works</h2>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Launch high-conversion campaign campaigns in under 30 seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto relative">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center space-y-3 px-3 z-10 relative">
              <div className="w-12 h-12 rounded-full bg-white/[0.02] border border-white/[0.08] flex items-center justify-center text-xs font-extrabold text-white shadow-lg">
                1
              </div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">1. Add Your Data</h3>
              <p className="text-xs text-gray-500 leading-relaxed max-w-[200px]">
                Import product catalogs and checkout transaction logs with one click.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center space-y-3 px-3 z-10 relative">
              <div className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-xs font-extrabold text-purple-400 shadow-lg">
                2
              </div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">2. AI Detects Opportunity</h3>
              <p className="text-xs text-gray-500 leading-relaxed max-w-[200px]">
                Gemini reviews sales metrics, highlights opportunities, and formulates copy.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center space-y-3 px-3 z-10 relative">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-xs font-extrabold text-blue-400 shadow-lg">
                3
              </div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">3. Approve & Launch</h3>
              <p className="text-xs text-gray-500 leading-relaxed max-w-[200px]">
                Passes policy checks and publishes instant checkout links for shoppers.
              </p>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col items-center text-center space-y-3 px-3 z-10 relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-xs font-extrabold text-white shadow-lg shadow-purple-600/20">
                4
              </div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">4. Measure Impact</h3>
              <p className="text-xs text-gray-500 leading-relaxed max-w-[200px]">
                Track pre vs post performance baselines, conversion rates, and ROI lift.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Simple Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-white/[0.04] text-xs text-gray-500">
        <div>
          <span className="font-bold text-gray-400">MerchantAI</span> &copy; 2026. Built for Razorpay Buildathon.
        </div>
        <div className="flex gap-4">
          <a href="#" className="hover:text-white transition-colors">About</a>
          <a href="#" className="hover:text-white transition-colors">Contact</a>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
