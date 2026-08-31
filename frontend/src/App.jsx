import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { useContext } from 'react';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Campaigns from './pages/Campaigns';
import OpportunityHistory from './pages/OpportunityHistory';
import AuditTrail from './pages/AuditTrail';
import AdminPanel from './pages/AdminPanel';
import Pay from './pages/Pay';
import LandingPage from './pages/LandingPage';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

const ProtectedRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/login" />;
  return (
    <div className="flex h-screen bg-[#06050c] text-white overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-8 bg-[#06050c]">
          {children}
        </main>
      </div>
    </div>
  );
};

import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <AuthProvider>
      <Toaster 
        position="top-right" 
        toastOptions={{ 
          style: { 
            background: '#12111d', 
            color: '#fff', 
            border: '1px solid rgba(255,255,255,0.08)',
            fontSize: '12px',
            fontFamily: 'Segoe UI, system-ui'
          } 
        }} 
      />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/campaigns" element={<ProtectedRoute><Campaigns /></ProtectedRoute>} />
          <Route path="/opportunities" element={<ProtectedRoute><OpportunityHistory /></ProtectedRoute>} />
          <Route path="/audit-logs" element={<ProtectedRoute><AuditTrail /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
          <Route path="/pay/:id" element={<ProtectedRoute><Pay /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
