
import { useNavigate } from 'react-router-dom';
import { Brain } from 'lucide-react';
import { useUserStore } from '../store/userStore';
import { authService } from '../shared/services/auth.service';

const Navbar = ({ onNavClick }: { onNavClick: any }) => {
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);

  console.log('Navbar user:', user);
  return (
    <nav className="w-full bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-7 h-7 text-blue-600" />
          <h1 className="text-xl font-semibold text-gray-900">MindQuestor</h1>
        </div>
        {!user && <div className="flex gap-3">
          <button
            onClick={() => navigate('/login')}
            className="px-5 py-2 text-gray-700 font-medium hover:text-gray-900 transition"
          >
            Login
          </button>
          <button
            onClick={() => navigate('/register')}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Sign Up
          </button>
        </div>}
        {user && <div className="flex gap-3">
          <button
            onClick={() => {
              authService.logout();
              useUserStore.getState().setUser(null);
              navigate('/login');
            }}
            className="px-5 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>}
      </div>
    </nav>
  );
};

export default Navbar;