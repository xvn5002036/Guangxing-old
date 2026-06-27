import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import NewsModal from './NewsModal';
import Container from './layout/Container';
import SectionHeader from './layout/SectionHeader';
import { ArrowRight } from 'lucide-react';

const categoryStyle: Record<string, string> = {
  '法會': 'bg-red-900/30 border-red-700/40 text-red-400',
  '公告': 'bg-mystic-gold/10 border-mystic-gold/40 text-mystic-gold',
};
const defaultCategoryStyle = 'bg-blue-900/20 border-blue-700/40 text-blue-400';

const News: React.FC = () => {
  const { news } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const sortedNews = [...news].sort((a, b) => b.date.localeCompare(a.date));
  const latestNews = sortedNews.slice(0, 3);

  return (
    <section id="news" className="py-24 relative overflow-hidden" style={{ background: '#0D1117' }}>
      {/* Subtle bg accent */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(197,160,89,0.04),transparent_60%)] pointer-events-none" />

      <Container>
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-14">
          <SectionHeader
            align="left"
            eyebrow="Updates"
            title="宮廟快訊"
            description="最新公告、法會資訊與活動消息，第一時間掌握。"
            className="md:max-w-xl"
          />
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-mystic-gold/25 bg-mystic-gold/5 px-5 py-3 text-sm tracking-[0.18em] text-mystic-gold hover:bg-mystic-gold/10 hover:border-mystic-gold/50 transition-all duration-200 self-start md:self-auto"
          >
            查看更多
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {latestNews.length > 0 ? (
            latestNews.map((item, index) => (
              <div
                key={item.id || index}
                className="group relative rounded-2xl overflow-hidden border border-white/10 bg-black/30 hover:border-mystic-gold/30 transition-all duration-300 cursor-pointer flex flex-col"
                style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}
                onClick={() => setIsModalOpen(true)}
                role="button"
                tabIndex={0}
              >
                {/* Top category bar */}
                <div className={`h-1 w-full ${
                  item.category === '法會' ? 'bg-gradient-to-r from-red-800 to-red-600' :
                  item.category === '公告' ? 'bg-gradient-to-r from-mystic-gold/60 to-mystic-shine/60' :
                  'bg-gradient-to-r from-blue-800 to-blue-600'
                }`} />

                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex justify-between items-center mb-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium tracking-[0.1em] ${categoryStyle[item.category] || defaultCategoryStyle}`}>
                      {item.category}
                    </span>
                    <span className="text-xs text-white/40 font-sans tracking-[0.12em]">{item.date}</span>
                  </div>
                  <h3 className="text-base font-semibold text-white/90 group-hover:text-mystic-shine transition-colors line-clamp-2 min-h-[3rem] tracking-[0.06em] leading-snug flex-grow">
                    {item.title}
                  </h3>
                  <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
                    <span className="text-xs text-white/35 tracking-[0.25em]">點擊查看詳情</span>
                    <ArrowRight size={12} className="text-mystic-gold/40 group-hover:text-mystic-gold group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center text-white/40 py-14 border border-white/10 border-dashed rounded-3xl bg-black/10">
              目前尚無最新公告
            </div>
          )}
        </div>

        <NewsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </Container>
    </section>
  );
};

export default News;
