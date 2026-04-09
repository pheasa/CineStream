import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Film, Ghost, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center space-y-8 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative"
      >
        <div className="text-[10rem] md:text-[15rem] font-black text-slate-900 select-none leading-none">
          404
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Ghost className="w-24 h-24 md:w-32 md:h-32 text-indigo-500 animate-bounce" />
        </div>
      </motion.div>

      <div className="space-y-4 max-w-md">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight">Lost in Space?</h1>
        <p className="text-slate-500 text-lg">
          The page you're looking for has drifted away into another dimension or never existed in the first place.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Link
          to="/"
          className="flex items-center space-x-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-bold transition-all transform hover:scale-105 shadow-lg shadow-indigo-500/20"
        >
          <Home className="w-5 h-5" />
          <span>Back to Home</span>
        </Link>
        <button
          onClick={() => window.history.back()}
          className="flex items-center space-x-2 px-8 py-4 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 rounded-full font-bold transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Go Back</span>
        </button>
      </div>

      <div className="pt-12 flex items-center space-x-2 text-slate-600">
        <Film className="w-5 h-5" />
        <span className="text-sm font-medium uppercase tracking-widest">CineStream</span>
      </div>
    </div>
  );
}
