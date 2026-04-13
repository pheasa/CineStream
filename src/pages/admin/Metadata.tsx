import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { metadataService } from '../../services/api';
import { Metadata } from '../../types';
import { Plus, Edit2, Trash2, Loader2, X, Filter, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';
import { QueryParams, FilterValues, DEFAULT_PAGINATION, MetadataTypes } from '../../constants';

export default function MetadataPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [metadata, setMetadata] = React.useState<Metadata[]>([]);
  const [totalItems, setTotalItems] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<Metadata | null>(null);
  const [name, setName] = React.useState('');
  const [type, setType] = React.useState<MetadataTypes>(MetadataTypes.LANGUAGE);

  // Initialize state from URL
  const [filterType, setFilterType] = React.useState(searchParams.get(QueryParams.TYPE) || FilterValues.ALL);
  const [searchTerm, setSearchTerm] = React.useState(searchParams.get(QueryParams.QUERY) || '');
  const [currentPage, setCurrentPage] = React.useState(Number(searchParams.get(QueryParams.PAGE)) || DEFAULT_PAGINATION.PAGE);
  const [itemsPerPage, setItemsPerPage] = React.useState(Number(searchParams.get(QueryParams.LIMIT)) || DEFAULT_PAGINATION.LIMIT);

  const debouncedSearchTerm = useDebounce(searchTerm, 800);

  // Update URL when state changes
  React.useEffect(() => {
    const params: URLSearchParams = new URLSearchParams(searchParams);
    
    if (debouncedSearchTerm) params.set(QueryParams.QUERY, debouncedSearchTerm);
    else params.delete(QueryParams.QUERY);

    if (filterType !== FilterValues.ALL) params.set(QueryParams.TYPE, filterType);
    else params.delete(QueryParams.TYPE);

    if (currentPage > DEFAULT_PAGINATION.PAGE) params.set(QueryParams.PAGE, currentPage.toString());
    else params.delete(QueryParams.PAGE);

    if (itemsPerPage !== DEFAULT_PAGINATION.LIMIT) params.set(QueryParams.LIMIT, itemsPerPage.toString());
    else params.delete(QueryParams.LIMIT);

    setSearchParams(params, { replace: true });
  }, [debouncedSearchTerm, filterType, currentPage, itemsPerPage]);

  // Handle ID from URL for editing
  React.useEffect(() => {
    const id = searchParams.get(QueryParams.ID);
    if (id) {
      const numericId = Number(id);
      const item = metadata.find(m => m.id === numericId);
      if (item) {
        handleEdit(item);
      } else {
        // If not in current list, we don't have a direct getById for metadata in api.ts
        // but we can search for it by setting the search term or just wait for it to be fetched
        // For metadata, it's usually a small list, so we might just wait or clear it if not found
        // Let's try to find it in the current list first.
      }
    } else {
      // If id param exists but is empty, remove it
      if (searchParams.has(QueryParams.ID)) {
        const params = new URLSearchParams(searchParams);
        params.delete(QueryParams.ID);
        setSearchParams(params, { replace: true });
      }
      setIsModalOpen(false);
      setEditingItem(null);
      setName('');
    }
  }, [searchParams.get(QueryParams.ID), metadata]);

  const fetchMetadata = () => {
    setLoading(true);
    metadataService.getAll({
      page: currentPage,
      limit: itemsPerPage,
      search: debouncedSearchTerm,
      type: filterType
    })
      .then(res => {
        setMetadata(res.data);
        setTotalItems(res.total);
      })
      .finally(() => setLoading(false));
  };

  React.useEffect(() => {
    fetchMetadata();
  }, [currentPage, itemsPerPage, filterType, debouncedSearchTerm]);

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [filterType, debouncedSearchTerm, itemsPerPage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !type.trim()) return;

    try {
      if (editingItem) {
        await metadataService.update(editingItem.id, type, name);
      } else {
        await metadataService.create(type, name);
      }
      
      // Clear ID from URL and close modal
      const params = new URLSearchParams(searchParams);
      params.delete(QueryParams.ID);
      setSearchParams(params);
      
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
    setType(item.type as MetadataTypes);
    setIsModalOpen(true);

    // Update URL if not already there
    if (searchParams.get(QueryParams.ID) !== item.id.toString()) {
      const params = new URLSearchParams(searchParams);
      params.set(QueryParams.ID, item.id.toString());
      setSearchParams(params);
    }
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
        <button
          onClick={() => {
            setEditingItem(null);
            setName('');
            setType(MetadataTypes.LANGUAGE);
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-600 rounded-lg font-medium hover:bg-indigo-500 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add Item</span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder="Search metadata..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
          <Filter className="w-5 h-5 text-slate-500" />
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-sm font-medium"
          >
            <option value={FilterValues.ALL}>All Types</option>
            <option value={MetadataTypes.CATEGORY}>Categories</option>
            <option value={MetadataTypes.LANGUAGE}>Languages</option>
            <option value={MetadataTypes.COUNTRY}>Countries</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-800/50">
                  <th className="px-6 py-4 text-xs uppercase tracking-wider font-bold text-slate-500">ID</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-wider font-bold text-slate-500">Name</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-wider font-bold text-slate-500">Type</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-wider font-bold text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {metadata.length > 0 ? (
                  metadata.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition-colors group">
                      <td className="px-6 py-4 text-sm text-slate-500 font-mono">#{item.id}</td>
                      <td className="px-6 py-4 font-medium text-slate-200">{item.name}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider ${
                          item.type === 'category' ? 'bg-blue-500/10 text-blue-400' :
                          item.type === 'language' ? 'bg-purple-500/10 text-purple-400' :
                          'bg-emerald-500/10 text-emerald-400'
                        }`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-2 text-slate-400 hover:text-indigo-400 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-slate-400 hover:text-rose-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                      No metadata found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between bg-slate-800/20 gap-4">
            <div className="flex items-center space-x-4">
              <p className="text-sm text-slate-500">
                Showing <span className="font-medium text-slate-300">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-slate-300">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of <span className="font-medium text-slate-300">{totalItems}</span> items
              </p>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="bg-slate-900 border border-slate-800 rounded-lg text-xs px-2 py-1 focus:ring-0"
              >
                {[10, 25, 50, 100].map(size => (
                  <option key={size} value={size}>{size} per page</option>
                ))}
              </select>
            </div>
            
            {totalPages > 1 && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center space-x-1">
                  {/* Simple pagination logic for many pages */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = i + 1;
                    if (totalPages > 5 && currentPage > 3) {
                      pageNum = currentPage - 3 + i + 1;
                      if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === pageNum ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-400'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-xl font-bold">{editingItem ? 'Edit Item' : 'Add Item'}</h2>
              <button 
                onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  params.delete('id');
                  setSearchParams(params);
                  setIsModalOpen(false);
                }} 
                className="p-2 hover:bg-slate-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Type</label>
                <select
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={type}
                  onChange={(e) => setType(e.target.value as MetadataTypes)}
                >
                  <option value={MetadataTypes.CATEGORY}>Category</option>
                  <option value={MetadataTypes.LANGUAGE}>Language</option>
                  <option value={MetadataTypes.COUNTRY}>Country</option>
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
                  onClick={() => {
                    const params = new URLSearchParams(searchParams);
                    params.delete(QueryParams.ID);
                    setSearchParams(params);
                    setIsModalOpen(false);
                  }}
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
