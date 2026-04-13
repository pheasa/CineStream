import React from 'react';
import { metadataService } from '../../services/api';
import { Metadata } from '../../types';
import { Plus, Edit2, Trash2, Loader2, X, Filter } from 'lucide-react';

export default function MetadataPage() {
  const [metadata, setMetadata] = React.useState<Metadata[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<Metadata | null>(null);
  const [name, setName] = React.useState('');
  const [type, setType] = React.useState('language');
  const [filterType, setFilterType] = React.useState('all');

  const fetchMetadata = () => {
    setLoading(true);
    metadataService.getAll(filterType === 'all' ? undefined : filterType)
      .then(setMetadata)
      .finally(() => setLoading(false));
  };

  React.useEffect(() => {
    fetchMetadata();
  }, [filterType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !type.trim()) return;

    try {
      if (editingItem) {
        await metadataService.update(editingItem.id, type, name);
      } else {
        await metadataService.create(type, name);
      }
      setName('');
      setEditingItem(null);
      setIsModalOpen(false);
      fetchMetadata();
    } catch (error) {
      console.error('Failed to save metadata:', error);
      alert('Failed to save metadata');
    }
  };

  const handleEdit = (item: Metadata) => {
    setEditingItem(item);
    setName(item.name);
    setType(item.type);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await metadataService.delete(id);
        fetchMetadata();
      } catch (error: any) {
        alert(error.response?.data?.error || 'Failed to delete item');
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-black tracking-tight">Manage Metadata</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1">
            <Filter className="w-4 h-4 text-slate-500" />
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-sm"
            >
              <option value="all">All Types</option>
              <option value="category">Categories</option>
              <option value="language">Languages</option>
              <option value="country">Countries</option>
            </select>
          </div>
          <button
            onClick={() => {
              setEditingItem(null);
              setName('');
              setType('language');
              setIsModalOpen(true);
            }}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-600 rounded-lg font-medium hover:bg-indigo-500 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {metadata.map((item) => (
            <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between group">
              <div className="flex flex-col">
                <span className="font-semibold text-slate-200">{item.name}</span>
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{item.type}</span>
              </div>
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEdit(item)}
                  className="p-2 text-slate-400 hover:text-indigo-400 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 text-slate-400 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-xl font-bold">{editingItem ? 'Edit Item' : 'Add Item'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-800 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Type</label>
                <select
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="category">Category</option>
                  <option value="language">Language</option>
                  <option value="country">Country</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Name</label>
                <input
                  autoFocus
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. English or USA"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-end space-x-4 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium transition-colors"
                >
                  {editingItem ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
