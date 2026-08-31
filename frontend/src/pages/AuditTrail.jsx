import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { FileText, Calendar, ShieldCheck, ShieldAlert, CheckCircle, HelpCircle } from 'lucide-react';

const AuditTrail = () => {
  const { user } = useContext(AuthContext);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { data } = await axios.get('http://localhost:5000/api/ai/actions', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setLogs(data);
      } catch (error) {
        console.error('Failed to fetch action audit trail logs:', error);
      }
      setLoading(false);
    };
    fetchLogs();
  }, [user]);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'EXECUTED':
      case 'APPROVED':
        return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'BLOCKED':
        return 'text-red-400 bg-red-500/10 border-red-500/30 font-bold';
      case 'REJECTED':
        return 'text-gray-400 bg-white/[0.04] border-white/[0.08]';
      case 'FAILED':
        return 'text-red-300 bg-red-600/15 border-red-500/20';
      default:
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    }
  };

  const getDecisionIcon = (decision) => {
    switch (decision) {
      case 'APPROVED':
        return <ShieldCheck size={18} className="text-green-400" />;
      case 'BLOCKED':
        return <ShieldAlert size={18} className="text-red-400 animate-pulse" />;
      case 'REJECTED':
        return <ShieldCheck size={18} className="text-gray-400" />;
      default:
        return <HelpCircle size={18} className="text-yellow-400" />;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <FileText className="text-purple-400" /> AI Action Audit Trail
        </h1>
        <p className="text-gray-400 text-sm mt-1">Audit log of growth agent recommendations, safety policy evaluations, and merchant approvals</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <span className="animate-spin border-2 border-white/20 border-t-white rounded-full w-8 h-8"></span>
        </div>
      ) : logs.length === 0 ? (
        <div className="glass-panel p-10 rounded-2xl text-center">
          <p className="text-gray-400 mb-2 font-medium">No actions audited yet</p>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            Decisions on AI insights will show up here as audit trail logs.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => (
            <div key={log._id} className="glass-panel p-6 rounded-2xl relative overflow-hidden transition-all hover:border-purple-500/10">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getStatusStyle(log.status)}`}>
                      {log.status}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 bg-white/[0.04] border border-white/[0.06] text-gray-300 rounded uppercase tracking-wider">
                      {log.actionType}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] text-gray-400 font-medium">
                      Decision: {getDecisionIcon(log.merchantDecision)} <span className="font-bold text-gray-200">{log.merchantDecision}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-xs text-gray-400 block font-bold uppercase tracking-wider">AI Recommendation Context</span>
                    <p className="text-gray-300 text-xs italic">"{log.aiRecommendation || 'No suggestion context logged.'}"</p>
                  </div>

                  <div className="pt-2 border-t border-white/[0.04] space-y-1">
                    <span className="text-xs text-gray-400 block font-bold uppercase tracking-wider">Execution / Validation Result</span>
                    <p className="text-white text-sm font-medium">{log.result}</p>
                  </div>
                </div>

                <div className="flex md:flex-col items-end justify-between shrink-0 text-right w-full md:w-auto border-t md:border-t-0 border-white/[0.04] pt-3 md:pt-0">
                  <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                    <Calendar size={13} />
                    {new Date(log.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AuditTrail;
