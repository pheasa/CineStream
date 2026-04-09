import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '../lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const showMax = 5;
    
    if (totalPages <= showMax) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, start + showMax - 1);
      
      if (end === totalPages) {
        start = Math.max(1, end - showMax + 1);
      }
      
      for (let i = start; i <= end; i++) pages.push(i);
    }
    
    return pages;
  };

  return (
    <div className={cn("flex items-center justify-center space-x-2 py-8", className)}>
      <button
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-indigo-500 disabled:opacity-50 disabled:hover:border-slate-800 disabled:hover:text-slate-400 transition-all"
        title="First Page"
      >
        <ChevronsLeft className="w-5 h-5" />
      </button>
      
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-indigo-500 disabled:opacity-50 disabled:hover:border-slate-800 disabled:hover:text-slate-400 transition-all"
        title="Previous Page"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div className="flex items-center space-x-1">
        {getPageNumbers().map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={cn(
              "w-10 h-10 rounded-lg border font-bold transition-all",
              currentPage === page
                ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-indigo-500"
            )}
          >
            {page}
          </button>
        ))}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-indigo-500 disabled:opacity-50 disabled:hover:border-slate-800 disabled:hover:text-slate-400 transition-all"
        title="Next Page"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
      
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-indigo-500 disabled:opacity-50 disabled:hover:border-slate-800 disabled:hover:text-slate-400 transition-all"
        title="Last Page"
      >
        <ChevronsRight className="w-5 h-5" />
      </button>
    </div>
  );
}
