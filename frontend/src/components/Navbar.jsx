import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { LogOut, User } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);

  // Extract initials for avatar
  const getInitials = (name) => {
    if (!name) return 'M';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <nav className="flex justify-between items-center px-8 py-4 bg-[#08070f] border-b border-white/[0.04]">
      {/* Title */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">
          Enterprise Hub
        </h2>
      </div>

      {/* Profile & Logout */}
      <div className="flex items-center gap-6">
        {/* User profile */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500/20 to-purple-500/20 border border-purple-500/30 flex items-center justify-center text-xs font-bold text-blue-300">
            {getInitials(user?.name)}
          </div>
          <span className="text-sm font-medium text-gray-200">
            {user?.name || 'Admin'}
          </span>
        </div>

        {/* Divider */}
        <div className="h-4 w-px bg-white/10"></div>

        {/* Logout */}
        <button 
          onClick={logout} 
          className="px-3.5 py-1.5 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <LogOut size={13} />
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
