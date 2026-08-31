import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { 
  Settings, 
  Megaphone, 
  Users, 
  History, 
  Trash2, 
  Calendar, 
  Sparkles, 
  Check, 
  ShieldAlert, 
  UserCheck,
  Search,
  CheckCircle,
  XCircle
} from 'lucide-react';

const AdminPanel = () => {
  const { user } = useContext(AuthContext);

  if (user?.role !== 'Admin') {
    return (
      <div className="glass-panel p-8 rounded-2xl border border-red-500/20 text-center space-y-4 max-w-md mx-auto mt-20">
        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 mx-auto">
          <ShieldAlert size={24} />
        </div>
        <h2 className="text-xl font-bold text-white">Access Denied</h2>
        <p className="text-gray-400 text-sm leading-relaxed">
          The page you are trying to view is restricted to administrators. You do not have permissions to view this dashboard.
        </p>
        <a
          href="/"
          className="inline-block px-4 py-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-xl text-xs font-bold text-white transition-all cursor-pointer"
        >
          Return to Dashboard
        </a>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState('campaigns');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data States
  const [campaigns, setCampaigns] = useState([]);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [message, setMessage] = useState(null);

  // Load Admin Data
  const loadData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${user.token}` };
      
      const [campaignsRes, usersRes, auditRes] = await Promise.all([
        axios.get('http://localhost:5000/api/campaigns', { headers }),
        axios.get('http://localhost:5000/api/auth/users', { headers }),
        axios.get('http://localhost:5000/api/ai/actions', { headers })
      ]);

      setCampaigns(campaignsRes.data);
      setUsers(usersRes.data);
      setAuditLogs(auditRes.data);
    } catch (error) {
      console.error('Failed to retrieve administrative data:', error);
      showNotification('error', 'Error loading administrative records.');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const showNotification = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  // Safe Deletion Handlers
  const handleDeleteCampaign = async (id, title) => {
    if (!window.confirm(`⚠️ WARNING: Are you sure you want to permanently delete the campaign "${title}"?\nThis action cannot be undone.`)) {
      return;
    }
    try {
      await axios.delete(`http://localhost:5000/api/campaigns/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setCampaigns(campaigns.filter(c => c._id !== id));
      showNotification('success', `Campaign "${title}" deleted successfully.`);
    } catch (error) {
      console.error('Campaign delete failed:', error);
      showNotification('error', 'Failed to delete campaign.');
    }
  };

  const handleDeleteUser = async (id, name, email) => {
    if (id === user._id) {
      showNotification('error', 'Security Policy: You cannot delete your own active administrator session.');
      return;
    }
    if (!window.confirm(`⚠️ WARNING: Are you sure you want to delete user "${name}" (${email})?\nThis will block their dashboard access.`)) {
      return;
    }
    try {
      await axios.delete(`http://localhost:5000/api/auth/users/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setUsers(users.filter(u => u._id !== id));
      showNotification('success', `User "${name}" deleted successfully.`);
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Failed to delete user.';
      console.error('User delete failed:', error);
      showNotification('error', errMsg);
    }
  };

  const handleDeleteAuditLog = async (id, index) => {
    if (!window.confirm(`Are you sure you want to delete audit log entry #${index + 1}?`)) {
      return;
    }
    try {
      await axios.delete(`http://localhost:5000/api/ai/actions/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setAuditLogs(auditLogs.filter(log => log._id !== id));
      showNotification('success', 'Audit log deleted successfully.');
    } catch (error) {
      console.error('Audit delete failed:', error);
      showNotification('error', 'Failed to delete audit log.');
    }
  };

  // Filters
  const filteredCampaigns = campaigns.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.discount.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.shopName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAuditLogs = auditLogs.filter(log => 
    (log.aiRecommendation && log.aiRecommendation.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (log.status && log.status.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (log.result && log.result.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Settings className="text-purple-400 animate-spin-slow" /> Administrator Panel
          </h1>
          <p className="text-gray-400 text-sm mt-1">Manage, audit, and clean campaigns, users, and safety ledger files</p>
        </div>
      </div>

      {/* Floating Status Notification */}
      {message && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold shadow-2xl transition-all duration-300 animate-bounce ${
          message.type === 'success' 
            ? 'bg-green-500/10 border-green-500/20 text-green-400' 
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {message.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Control Tabs & Search */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-white/[0.02] border border-white/[0.04] p-3 rounded-2xl">
        <div className="flex gap-2 flex-wrap">
          <button 
            onClick={() => { setActiveTab('campaigns'); setSearchQuery(''); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'campaigns' 
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' 
                : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Megaphone size={14} /> Campaigns ({campaigns.length})
          </button>
          <button 
            onClick={() => { setActiveTab('users'); setSearchQuery(''); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'users' 
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' 
                : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Users size={14} /> Users ({users.length})
          </button>
          <button 
            onClick={() => { setActiveTab('audit'); setSearchQuery(''); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'audit' 
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' 
                : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <History size={14} /> Audit Trail ({auditLogs.length})
          </button>
        </div>
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-2.5 text-gray-500" size={16} />
          <input 
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/[0.01] border border-white/[0.06] rounded-xl text-xs text-white placeholder-gray-500 outline-none focus:border-purple-500 transition-all"
          />
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <span className="animate-spin border-2 border-white/20 border-t-white rounded-full w-8 h-8"></span>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden border border-white/[0.04]">
          {/* Campaigns Tab Table */}
          {activeTab === 'campaigns' && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.01] text-gray-400 font-bold uppercase tracking-wider">
                    <th className="p-4">Title</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Discount</th>
                    <th className="p-4 text-center">Orders</th>
                    <th className="p-4">Est. Revenue</th>
                    <th className="p-4">Launched</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] text-gray-300">
                  {filteredCampaigns.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-gray-500">No campaigns match your query.</td>
                    </tr>
                  ) : (
                    filteredCampaigns.map((c) => (
                      <tr key={c._id} className="hover:bg-white/[0.01] transition-colors">
                        <td className="p-4 font-bold text-white max-w-xs truncate">{c.title}</td>
                        <td className="p-4">
                          <span className="bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 rounded text-[10px] font-semibold text-gray-300">
                            {c.type}
                          </span>
                        </td>
                        <td className="p-4 font-semibold text-yellow-400">{c.discount}</td>
                        <td className="p-4 text-center font-semibold">{c.ordersCount || 0}</td>
                        <td className="p-4 font-semibold text-green-400">₹{(c.actualRevenue || 0).toLocaleString()}</td>
                        <td className="p-4 text-gray-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => handleDeleteCampaign(c._id, c.title)}
                            className="p-1.5 bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 hover:border-red-500/40 text-red-400 hover:text-red-300 rounded-lg transition-all cursor-pointer inline-flex items-center gap-1.5 font-bold"
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Users Tab Table */}
          {activeTab === 'users' && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.01] text-gray-400 font-bold uppercase tracking-wider">
                    <th className="p-4">Full Name</th>
                    <th className="p-4">Email Address</th>
                    <th className="p-4">Merchant Shop Name</th>
                    <th className="p-4">Date Joined</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] text-gray-300">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-gray-500">No users match your query.</td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u._id} className="hover:bg-white/[0.01] transition-colors">
                        <td className="p-4 font-bold text-white flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-[10px]">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          {u.name}
                        </td>
                        <td className="p-4 font-mono">{u.email}</td>
                        <td className="p-4 font-semibold text-gray-200">{u.shopName}</td>
                        <td className="p-4 text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => handleDeleteUser(u._id, u.name, u.email)}
                            disabled={u._id === user._id}
                            className={`p-1.5 rounded-lg transition-all inline-flex items-center gap-1.5 font-bold ${
                              u._id === user._id 
                                ? 'bg-white/[0.02] text-gray-600 border border-white/[0.04] cursor-not-allowed' 
                                : 'bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 hover:border-red-500/40 text-red-400 hover:text-red-300 cursor-pointer'
                            }`}
                          >
                            <Trash2 size={13} /> {u._id === user._id ? 'You' : 'Delete'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Audit Trail Tab Table */}
          {activeTab === 'audit' && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.01] text-gray-400 font-bold uppercase tracking-wider">
                    <th className="p-4 w-[40px]">#</th>
                    <th className="p-4">Action Status</th>
                    <th className="p-4 w-[250px]">Proposed Recommendation</th>
                    <th className="p-4">Safety Remarks</th>
                    <th className="p-4">Decision Date</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] text-gray-300">
                  {filteredAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-gray-500">No logs match your query.</td>
                    </tr>
                  ) : (
                    filteredAuditLogs.map((log, index) => (
                      <tr key={log._id} className="hover:bg-white/[0.01] transition-colors">
                        <td className="p-4 text-gray-600 font-mono font-semibold">{index + 1}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider ${
                            log.status === 'BLOCKED' 
                              ? 'text-red-400 bg-red-500/10 border-red-500/30' 
                              : 'text-green-400 bg-green-500/10 border-green-500/20'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="p-4 italic text-gray-400 truncate max-w-xs">"{log.aiRecommendation}"</td>
                        <td className="p-4 font-medium text-gray-200">{log.result}</td>
                        <td className="p-4 text-gray-500">{new Date(log.createdAt).toLocaleDateString()}</td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => handleDeleteAuditLog(log._id, index)}
                            className="p-1.5 bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 hover:border-red-500/40 text-red-400 hover:text-red-300 rounded-lg transition-all cursor-pointer inline-flex items-center gap-1.5 font-bold"
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
