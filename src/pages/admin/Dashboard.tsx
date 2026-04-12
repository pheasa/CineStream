import React from 'react';
import { Link } from 'react-router-dom';
import { statsService } from '../../services/api';
import { Stats } from '../../types';
import { Film, Tag, Globe, ArrowRight, Plus } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    statsService.get()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const cards = [
    { 
      title: 'Total Movies', 
      value: stats?.movies || 0, 
      icon: Film, 
      color: 'text-blue-500', 
      bg: 'bg-blue-500/10',
      href: '/admin/movies'
    },
    { 
      title: 'Metadata Items', 
      value: stats?.metadata || 0, 
      icon: Tag, 
      color: 'text-purple-500', 
      bg: 'bg-purple-500/10',
      href: '/admin/metadata'
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-black tracking-tight">Admin Dashboard</h1>
        <Link
          to="/admin/movies"
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 rounded-lg font-medium hover:bg-indigo-500 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add New Movie</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((card) => (
          <div key={card.title} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className={`p-3 rounded-xl ${card.bg}`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
              <span className="text-4xl font-black">{card.value}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">{card.title}</span>
              <Link to={card.href} className="text-indigo-400 hover:text-indigo-300 transition-colors">
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6">
          <h2 className="text-xl font-bold">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link to="/admin/movies" className="p-4 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors border border-slate-700">
              <h3 className="font-semibold mb-1">Manage Movies</h3>
              <p className="text-xs text-slate-500">Add, edit or remove movies from the library.</p>
            </Link>
            <Link to="/admin/metadata" className="p-4 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors border border-slate-700">
              <h3 className="font-semibold mb-1">Manage Metadata</h3>
              <p className="text-xs text-slate-500">Manage categories, languages and countries.</p>
            </Link>
            <Link to="/" className="p-4 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors border border-slate-700">
              <h3 className="font-semibold mb-1">View Website</h3>
              <p className="text-xs text-slate-500">See how the site looks for visitors.</p>
            </Link>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center">
            <Film className="w-8 h-8 text-indigo-500" />
          </div>
          <h2 className="text-xl font-bold">Welcome back, Admin</h2>
          <p className="text-slate-400 max-w-xs">
            Use the sidebar or the quick links to manage your movie streaming platform.
          </p>
        </div>
      </div>
    </div>
  );
}
