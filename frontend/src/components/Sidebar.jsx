import { useContext, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Megaphone, Sparkles, History, FileText, Database, RotateCcw, Settings } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

const Sidebar = () => {
  const { user } = useContext(AuthContext);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);

  const links = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'Campaigns', path: '/campaigns', icon: <Megaphone size={18} /> },
    { name: 'Opportunity History', path: '/opportunities', icon: <History size={18} /> },
    { name: 'AI Audit Trail', path: '/audit-logs', icon: <FileText size={18} /> },
  ];

  if (user?.role === 'Admin') {
    links.push({ name: 'Admin Panel', path: '/admin', icon: <Settings size={18} /> });
  }

  const handleLoadDemo = async () => {
    if (!window.confirm('This will overwrite your existing sales, products, and campaign data. Proceed?')) return;
    setLoadingDemo(true);
    try {
      await axios.post('http://localhost:5000/api/analytics/demo/load', {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      alert('Demo data loaded successfully!');
      // Clear localStorage insight so fresh ones can be generated based on new data
      localStorage.removeItem('ai_insight');
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Failed to load demo data.');
    }
    setLoadingDemo(false);
  };

  const handleResetWorkspace = async () => {
    if (!window.confirm('Are you sure you want to wipe your store database?')) return;
    setLoadingReset(true);
    try {
      await axios.post('http://localhost:5000/api/analytics/demo/reset', {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      alert('Workspace cleared.');
      localStorage.removeItem('ai_insight');
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Failed to reset workspace.');
    }
    setLoadingReset(false);
  };

  return (
    <div className="w-64 bg-[#08070f] border-r border-white/[0.04] p-5 flex flex-col justify-between h-screen">
      <div>
        {/* Sidebar Brand Header */}
        <div className="mb-8 px-2 flex items-center gap-2">
          <div className="p-2 bg-gradient-to-tr from-blue-500/10 to-purple-500/10 rounded-xl border border-white/5">
            <Sparkles size={18} className="text-purple-400" />
          </div>
          <h1 className="text-xl font-extrabold text-white tracking-wide">
            Merchant<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">AI</span>
          </h1>
        </div>

        {/* Navigation Links */}
        <ul className="space-y-1.5">
          {links.map((link) => (
            <li key={link.name}>
              <NavLink
                to={link.path}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-300 font-medium ${
                    isActive 
                      ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-300 border-l-2 border-blue-500 shadow-md shadow-blue-500/5' 
                      : 'text-gray-400 hover:bg-white/[0.02] hover:text-white border-l-2 border-transparent'
                  }`
                }
              >
                {link.icon}
                <span className="text-xs">{link.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>

      {/* Demo Actions Controller */}
      <div className="space-y-4">
        <div className="p-4 bg-white/[0.01] border border-white/[0.04] rounded-xl space-y-2.5">
          <span className="text-[10px] text-gray-500 uppercase tracking-widest block font-bold text-center">Demo Controller</span>
          
          <button 
            onClick={handleLoadDemo}
            disabled={loadingDemo}
            className="w-full py-2 bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-blue-300 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Database size={13} />
            {loadingDemo ? 'Loading...' : 'Load Demo Data'}
          </button>

          <button 
            onClick={handleResetWorkspace}
            disabled={loadingReset}
            className="w-full py-2 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 text-red-400 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RotateCcw size={13} />
            {loadingReset ? 'Resetting...' : 'Reset Workspace'}
          </button>
        </div>

        <div className="px-4 py-2 text-center">
          <span className="text-[9px] text-gray-500 uppercase tracking-widest block font-bold">Commerce Assistant</span>
          <span className="text-[10px] text-gray-400 mt-0.5 block font-medium">v1.2.0 (Active)</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
