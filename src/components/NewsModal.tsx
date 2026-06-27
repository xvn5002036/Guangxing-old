import React from 'react';
import { X, Calendar, Tag } from 'lucide-react';
import { useData } from '../context/DataContext';

interface NewsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NewsModal: React.FC<NewsModalProps> = ({ isOpen, onClose }) => {
  const { news } = useData();

  if (!isOpen) return null;

  // Sort by date descending
  const sortedNews = [...news].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative bg-mystic-charcoal border border-mystic-gold/30 w-full max-w-4xl h-[80vh] shadow-2xl overflow-hidden animate-fade-in-up flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/5 bg-black/40">
            <h3 className="text-2xl font-bold text-white tracking-widest font-serif">宮廟快訊總覽</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                <X size={24} />
            </button>
        </div>
        
        {/* Content */}
        <div className="overflow-y-auto p-6 md:p-8 custom-scrollbar">
            <div className="space-y-4">
                {sortedNews.map((item) => (
                    <div key={item.id} className="group flex flex-col md:flex-row gap-4 p-6 border border-white/5 hover:border-mystic-gold/30 bg-black/20 hover:bg-white/5 transition-all rounded-sm">
                        <div className="md:w-48 flex flex-col gap-2 shrink-0">
                             <span className={`inline-block w-fit px-2 py-1 text-[10px] border rounded ${
                                 item.category === '法會' ? 'border-red-500/50 text-red-400' :
                                 item.category === '公告' ? 'border-mystic-gold/50 text-mystic-gold' :
                                 'border-blue-500/50 text-blue-400'
                             }`}>
                                 {item.category}
                             </span>
                             <div className="flex items-center gap-2 text-gray-500 text-sm">
                                 <Calendar size={14} />
                                 {item.date}
                             </div>
                        </div>
                        <div className="flex-1">
                            <h4 className="text-lg font-bold text-white group-hover:text-mystic-gold transition-colors mb-2">
                                {item.title}
                            </h4>
                        </div>
                    </div>
                ))}
                {sortedNews.length === 0 && (
                    <div className="text-center text-gray-500 py-12 flex flex-col items-center">
                        <Tag size={48} className="mb-4 opacity-20" />
                        <p>目前尚無任何公告紀錄</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default NewsModal;