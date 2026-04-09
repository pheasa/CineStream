import React from 'react';
import { X, Facebook, Twitter, Send, MessageCircle, Copy, Check, Link as LinkIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url: string;
}

export default function ShareModal({ isOpen, onClose, title, url }: ShareModalProps) {
  const [copied, setCopied] = React.useState(false);

  const shareLinks = [
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-[#1877F2]',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    {
      name: 'Twitter',
      icon: Twitter,
      color: 'bg-[#1DA1F2]',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'bg-[#25D366]',
      href: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${title} ${url}`)}`,
    },
    {
      name: 'Telegram',
      icon: Send,
      color: 'bg-[#0088cc]',
      href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    },
  ];

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl"
          >
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Share Movie</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-4 gap-4">
                {shareLinks.map((platform) => (
                  <a
                    key={platform.name}
                    href={platform.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center space-y-2 group"
                  >
                    <div className={`w-12 h-12 ${platform.color} rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                      <platform.icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs text-slate-400 group-hover:text-white transition-colors">
                      {platform.name}
                    </span>
                  </a>
                ))}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Copy Link</label>
                <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-xl p-2">
                  <div className="flex-1 truncate text-sm text-slate-400 px-2">
                    {url}
                  </div>
                  <button
                    onClick={copyToClipboard}
                    className={`p-2 rounded-lg transition-all ${
                      copied 
                        ? 'bg-green-500 text-white' 
                        : 'bg-indigo-600 text-white hover:bg-indigo-500'
                    }`}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
