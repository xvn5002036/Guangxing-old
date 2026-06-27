
import React from 'react';
import { useData } from '../context/DataContext';
import { OrgMember } from '../types';
import Container from './layout/Container';
import SectionHeader from './layout/SectionHeader';

const getFallbackDataUrl = (title: string) => {
  const safeTitle = title.replace(/[<>&"]/g, '');
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#0b0b0b"/>
          <stop offset="1" stop-color="#1a1a1a"/>
        </linearGradient>
        <radialGradient id="glow" cx="30%" cy="20%" r="70%">
          <stop offset="0" stop-color="rgba(197,160,89,0.28)"/>
          <stop offset="1" stop-color="rgba(197,160,89,0)"/>
        </radialGradient>
      </defs>
      <rect width="300" height="400" fill="url(#bg)"/>
      <rect width="300" height="400" fill="url(#glow)"/>
      <rect x="16" y="16" width="268" height="368" rx="18" fill="rgba(0,0,0,0.25)" stroke="rgba(255,255,255,0.10)"/>
      <text x="28" y="70" fill="rgba(255,255,255,0.9)" font-family="Inter, 'Noto Serif TC', system-ui, -apple-system, Segoe UI, sans-serif" font-size="16" font-weight="700" letter-spacing="2">${safeTitle}</text>
      <text x="28" y="96" fill="rgba(255,255,255,0.5)" font-family="Inter, 'Noto Serif TC', system-ui, -apple-system, Segoe UI, sans-serif" font-size="11" letter-spacing="3">NO IMAGE</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

const OrgCard: React.FC<{ member: OrgMember; isLeader?: boolean }> = ({ member, isLeader = false }) => (
    <div className={`relative group flex flex-col items-center transition-transform hover:-translate-y-2 duration-300 ${isLeader ? 'z-10' : ''}`}>
        {/* Card Border & Glow */}
        <div className={`relative overflow-hidden rounded-sm border-2 ${isLeader ? 'w-48 h-64 border-mystic-gold shadow-[0_0_30px_rgba(197,160,89,0.3)]' : 'w-36 h-48 border-gray-700 hover:border-mystic-gold/50 shadow-lg'} bg-mystic-charcoal transition-all`}>
            {/* Image */}
            <img 
                src={member.image || getFallbackDataUrl(`${member.title} ${member.name}`)} 
                alt={member.name}
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
            />
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90"></div>
            
            {/* Text Info */}
            <div className="absolute bottom-0 left-0 right-0 p-3 text-center">
                <div className={`font-serif font-bold text-mystic-gold ${isLeader ? 'text-xl mb-1' : 'text-sm mb-0.5'}`}>
                    {member.title}
                </div>
                <div className={`font-bold text-white tracking-widest ${isLeader ? 'text-2xl' : 'text-lg'}`}>
                    {member.name}
                </div>
            </div>
        </div>
        {/* Decorative elements for Leader */}
        {isLeader && (
            <>
               <div className="absolute -top-3 -right-3 w-8 h-8 border-t-2 border-r-2 border-mystic-gold"></div>
               <div className="absolute -bottom-3 -left-3 w-8 h-8 border-b-2 border-l-2 border-mystic-gold"></div>
            </>
        )}
    </div>
);

const Organization: React.FC = () => {
  const { orgMembers } = useData();

  // Categorize members
  const leaders = orgMembers.filter(m => m.category === 'LEADER');
  const executives = orgMembers.filter(m => m.category === 'EXECUTIVE');
  const staff = orgMembers.filter(m => m.category === 'STAFF');

  return (
    <section id="organization" className="py-24 relative overflow-hidden border-t border-white/5" style={{ background: '#080808' }}>
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-mystic-gold/50 to-transparent"></div>
      
      <Container>
        <div className="mb-16">
          <SectionHeader
            eyebrow="Structure"
            title="組織架構"
            description="透明、清晰的分工與傳承，讓宮務運作更穩健。"
          />
        </div>

        <div className="flex flex-col items-center max-w-6xl mx-auto">
            
            {/* LEVEL 1: LEADERS (宮主) */}
            <div className="relative flex flex-col items-center mb-16">
                <div className="flex gap-8 flex-wrap justify-center relative z-10">
                    {leaders.map(member => (
                        <OrgCard key={member.id} member={member} isLeader={true} />
                    ))}
                    {leaders.length === 0 && <div className="text-gray-500 italic">暫無宮主資料</div>}
                </div>
                {/* Vertical Line Down */}
                {leaders.length > 0 && (executives.length > 0 || staff.length > 0) && (
                    <div className="h-12 w-0.5 bg-mystic-gold/30 mt-4"></div>
                )}
            </div>

            {/* LEVEL 2: EXECUTIVES (幹事) */}
            {executives.length > 0 && (
                <div className="w-full flex flex-col items-center mb-16 relative">
                    {/* Horizontal Connector Bar */}
                    <div className="w-[80%] h-px bg-mystic-gold/30 absolute -top-4 hidden md:block"></div>
                    
                    {/* Vertical Lines connecting to bar (Desktop) */}
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-px h-4 bg-mystic-gold/30 hidden md:block"></div>

                    <div className="flex flex-wrap justify-center gap-8 md:gap-12 relative z-10 pt-4 md:pt-0">
                        {executives.map((member, idx) => (
                             <div key={member.id} className="flex flex-col items-center relative">
                                 {/* Vertical Line Up to Bar (Desktop) */}
                                 <div className="absolute -top-4 w-px h-4 bg-mystic-gold/30 hidden md:block"></div>
                                 <OrgCard member={member} />
                             </div>
                        ))}
                    </div>

                    {/* Vertical Line Down to Next Level */}
                    {staff.length > 0 && (
                        <div className="h-12 w-0.5 bg-mystic-gold/30 mt-8"></div>
                    )}
                </div>
            )}

            {/* LEVEL 3: STAFF (執事/志工) */}
            {staff.length > 0 && (
                 <div className="w-full flex flex-col items-center relative">
                    {/* Horizontal Connector Bar */}
                    <div className="w-[80%] max-w-4xl h-px bg-mystic-gold/20 absolute -top-4 hidden md:block"></div>
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-px h-4 bg-mystic-gold/20 hidden md:block"></div>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 md:gap-8 pt-4 md:pt-0">
                         {staff.map(member => (
                             <div key={member.id} className="flex flex-col items-center relative">
                                 <div className="absolute -top-4 w-px h-4 bg-mystic-gold/20 hidden md:block"></div>
                                 <OrgCard member={member} />
                             </div>
                         ))}
                    </div>
                 </div>
            )}

        </div>
      </Container>
    </section>
  );
};

export default Organization;
