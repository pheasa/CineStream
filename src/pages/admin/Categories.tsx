import React from 'react';
import { categoryService } from '../../services/api';
import { Category } from '../../types';
import { Plus, Edit2, Trash2, Loader2, X } from 'lucide-react';

export default function Categories() {
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(null);
  const [name, setName] = React.useState('');

  const fetchCategories = () => {
    setLoading(true);
    categoryService.getAll()
      .then(setCategories)
      .finally(() => setLoading(false));
  };

  React.useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      if (editingCategory) {
        await categoryService.update(editingCategory.id, name);
      } else {
        await categoryService.create(name);
      }
      setName('');
      setEditingCategory(null);
      setIsModalOpen(false);
      fetchCategories();
    } catch (error) {
      console.error('Failed to save category:', error);
      alert('Failed to save category');
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this category? (Note: Cannot delete if movies exist in this category)')) {
      try {
        await categoryService.delete(id);
        fetchCategories();
      } catch (error: any) {
        alert(error.response?.data?.error || 'Failed to delete category');
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-black tracking-tight">Manage Categories</h1>
        <button
          onClick={() => {
            setEditingCategory(null);
            setName('');
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-600 rounded-lg font-medium hover:bg-indigo-500 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add Category</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between group">
              <span className="font-semibold text-slate-200">{cat.name}</span>
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEdit(cat)}
                  className="p-2 text-slate-400 hover:text-indigo-400 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(cat.id)}
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
              <h2 className="text-xl font-bold">{editingCategory ? 'Edit Category' : 'Add Category'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-800 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Category Name</label>
                <input
                  autoFocus
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. Action"
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
                  {editingCategory ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
