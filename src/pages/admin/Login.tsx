import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Film, AlertCircle } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const adminUsername = import.meta.env.VITE_ADMIN_USERNAME || 'pheasa';
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'pheasa';
    
    // Simple demo auth
    if (username === adminUsername && password === adminPassword) {
      localStorage.setItem('admin_auth', 'true');
      navigate('/admin');
    } else {
      setError('Invalid username or password.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-8 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-4">
            <Film className="w-8 h-8 text-indigo-500" />
          </div>
          <h1 className="text-3xl font-black tracking-tight">Admin Access</h1>
          <p className="text-slate-500">Please enter your credentials to continue</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder="Username"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="password"
                placeholder="Password"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-rose-500 text-sm mt-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-indigo-500/20 mt-4"
          >
            Login to Dashboard
          </button>
        </form>

        <div className="text-center">
          <p className="text-xs text-slate-600">
            Demo credentials: <strong>{import.meta.env.VITE_ADMIN_USERNAME || 'pheasa'}</strong> / <strong>{import.meta.env.VITE_ADMIN_PASSWORD || 'pheasa'}</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
