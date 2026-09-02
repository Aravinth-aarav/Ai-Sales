import { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  Database, 
  Upload, 
  FileSpreadsheet, 
  Download, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw,
  Sparkles
} from 'lucide-react';

const DataImportSection = ({ onSuccess }) => {
  const { user } = useContext(AuthContext);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [loadingImport, setLoadingImport] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [showErrorLog, setShowErrorLog] = useState(false);

  // Handle Seeding Demo Data
  const handleLoadDemo = async () => {
    setLoadingDemo(true);
    try {
      await axios.post('/api/analytics/demo/load', {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      toast.success('🎉 Demo data successfully initialized!');
      setImportResult(null);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      toast.error('Failed to load demo data.');
    } finally {
      setLoadingDemo(false);
    }
  };

  // Handle CSV File Selection & Upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please select a valid .csv file.');
      return;
    }

    setLoadingImport(true);
    setImportResult(null);
    setShowErrorLog(false);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await axios.post('/api/data/import', formData, {
        headers: { 
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setImportResult(data);
      if (data.skipped > 0) {
        toast.success(`✅ ${data.imported} rows imported, ${data.skipped} skipped`);
      } else {
        toast.success(`🎉 ${data.imported} rows imported successfully!`);
      }

      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      const message = err.response?.data?.message || 'Failed to process CSV file import.';
      toast.error(message);
    } finally {
      setLoadingImport(false);
      e.target.value = ''; // Reset input
    }
  };

  // Handle Sample CSV Download
  const handleDownloadSample = () => {
    window.open('/api/data/sample-csv', '_blank');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
            <Database size={18} className="text-purple-400" /> Data Management System
          </h3>
          <p className="text-gray-400 text-xs mt-0.5">Quick start with seed data or upload real merchant sales via CSV</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left Card: Load Demo Data */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between space-y-4 border border-blue-500/20 bg-blue-500/[0.02]">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="px-2.5 py-0.5 bg-blue-500/15 text-blue-400 text-[10px] font-bold rounded border border-blue-500/20 uppercase tracking-wider">
                Quick-Start / Testing
              </span>
              <Sparkles size={16} className="text-blue-400" />
            </div>
            <h4 className="text-sm font-bold text-white">Load Demo Dataset</h4>
            <p className="text-gray-400 text-xs leading-relaxed">
              Instantly seed mock merchant catalog with 15 products and 500+ sales transactions to test AI analytics.
            </p>
          </div>

          <button
            onClick={handleLoadDemo}
            disabled={loadingDemo}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 active:scale-[0.98]"
          >
            {loadingDemo ? (
              <>
                <RefreshCw size={14} className="animate-spin" /> Loading Demo Data...
              </>
            ) : (
              <>
                <Database size={14} /> Load Demo Data
              </>
            )}
          </button>
        </div>

        {/* Right Card: Import Real Data (CSV) */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between space-y-4 border border-purple-500/20 bg-purple-500/[0.02]">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="px-2.5 py-0.5 bg-purple-500/15 text-purple-400 text-[10px] font-bold rounded border border-purple-500/20 uppercase tracking-wider">
                Production / CSV Import
              </span>
              <FileSpreadsheet size={16} className="text-purple-400" />
            </div>
            <h4 className="text-sm font-bold text-white">Import Real Data (CSV)</h4>
            <p className="text-gray-400 text-xs leading-relaxed font-mono bg-white/[0.02] border border-white/[0.04] p-2 rounded-lg">
              CSV format: <span className="text-purple-300">productName, price, quantity, date</span>
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex gap-2">
              <button
                onClick={handleDownloadSample}
                className="flex-1 py-2 px-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-gray-300 hover:text-white font-bold text-[11px] rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download size={13} className="text-purple-400" /> Download Sample CSV
              </button>

              <label className="flex-1 py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-purple-600/20 active:scale-[0.98]">
                {loadingImport ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" /> Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={13} /> Select CSV File
                  </>
                )}
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  disabled={loadingImport}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Skipped Rows Log Collapsible */}
      {importResult && importResult.skipped > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-xs space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-amber-300 font-bold">
              <AlertTriangle size={15} />
              <span>⚠️ {importResult.skipped} row(s) skipped due to validation errors</span>
            </div>
            <button
              onClick={() => setShowErrorLog(!showErrorLog)}
              className="text-amber-400 hover:text-amber-200 font-semibold flex items-center gap-1 text-[11px] cursor-pointer"
            >
              {showErrorLog ? 'Hide Errors' : 'View Error Log'} {showErrorLog ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          {showErrorLog && (
            <div className="bg-black/30 border border-amber-500/15 p-3 rounded-xl max-h-40 overflow-y-auto space-y-1 font-mono text-[11px] text-amber-200/90">
              {importResult.errors.map((err, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="text-amber-500">•</span>
                  <span>{err}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DataImportSection;
