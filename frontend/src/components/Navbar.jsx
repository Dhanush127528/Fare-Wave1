import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { BusFront, Wallet, LogOut, User } from 'lucide-react';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuthStore();

  return (
    <nav className="fixed top-0 w-full z-50 glass-dark border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <BusFront className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                Fare Wave
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-800 border border-gray-700">
                  <Wallet className="h-4 w-4 text-secondary" />
                  <span className="font-medium text-sm">₹{user?.walletBalance || 0}</span>
                </div>
                <Link
                  to="/dashboard"
                  className="p-2 rounded-full hover:bg-gray-800 transition-colors"
                >
                  <User className="h-5 w-5 text-gray-300" />
                </Link>
                <button
                  onClick={logout}
                  className="p-2 rounded-full hover:bg-red-500/10 transition-colors group"
                >
                  <LogOut className="h-5 w-5 text-gray-400 group-hover:text-red-500" />
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                className="px-6 py-2 rounded-full bg-primary hover:bg-blue-600 text-white font-medium transition-all transform hover:scale-105 active:scale-95"
              >
                Login / Signup
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
