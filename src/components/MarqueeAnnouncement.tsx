import React from 'react';
import { Megaphone } from 'lucide-react';
import { useData } from '../context/DataContext';

const MarqueeAnnouncement: React.FC = () => {
  const { announcements: allAnnouncements } = useData();

  const activeAnnouncements = allAnnouncements
    .filter((a) => (a as any).is_active !== false && (a as any).isActive !== false)
    .sort((a, b) => {
      if ((b.priority || 0) !== (a.priority || 0)) return (b.priority || 0) - (a.priority || 0);
      const timeB = new Date((b as any).created_at || (b as any).createdAt || 0).getTime();
      const timeA = new Date((a as any).created_at || (a as any).createdAt || 0).getTime();
      return timeB - timeA;
    });

  if (activeAnnouncements.length === 0) return null;

  return (
    <div className="relative w-full bg-mystic-charcoal border-b border-mystic-gold/30 text-mystic-paper py-2 overflow-hidden z-40 shadow-[0_4px_20px_rgba(0,0,0,0.45)]">
      <div className="container mx-auto px-4 flex items-center">
        <div className="flex-shrink-0 text-mystic-gold mr-4 flex items-center">
          <Megaphone className="h-5 w-5 mr-1 animate-pulse" />
          <span className="font-bold text-sm tracking-widest whitespace-nowrap">{`\u8dd1\u99ac\u71c8\u516c\u544a`}</span>
        </div>
        <div className="overflow-hidden flex-grow group min-w-0">
          <div className="whitespace-nowrap inline-block animate-marquee group-hover:[animation-play-state:paused] text-sm md:text-base pl-[100%]">
            <span className="pr-10 flex items-center gap-4">
              {activeAnnouncements.map((announcement, index) => (
                <span key={announcement.id} className="flex items-center gap-4">
                  {announcement.link ? (
                    <a
                      href={announcement.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-mystic-gold no-underline transition-colors cursor-pointer"
                    >
                      {announcement.content}
                    </a>
                  ) : (
                    <span className="cursor-default">{announcement.content}</span>
                  )}
                  {index < activeAnnouncements.length - 1 && (
                    <span className="text-mystic-gold/50 text-xs cursor-default">◆</span>
                  )}
                </span>
              ))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarqueeAnnouncement;
