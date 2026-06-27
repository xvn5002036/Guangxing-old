import React from 'react';
import { useData } from '../context/DataContext';
import Container from './layout/Container';
import SectionHeader from './layout/SectionHeader';

const DeityInfo: React.FC = () => {
  const { siteSettings } = useData();

  return (
    <section id="about" className="py-24 relative overflow-hidden" style={{ background: '#080808' }}>
      <Container>
        <div className="mb-14">
          <SectionHeader
            eyebrow="The Legend"
            title={siteSettings.deityTitle}
            description="認識主祀神尊的典故與信仰核心，並了解重要聖誕與職司。"
          />
        </div>

        <div className="flex flex-col md:flex-row gap-12 lg:gap-16 items-center">
            
            {/* Image Section - UPDATED IMAGE (Detailed Dragon Robe / Statue Close-up) */}
            <div className="w-full md:w-1/2">
                <div className="relative group">
                    <div className="absolute inset-0 bg-mystic-gold blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity duration-1000"></div>
                    <div className="relative z-10 w-full h-[520px] md:h-[600px] overflow-hidden rounded-3xl border border-white/10 bg-black/20">
                        <img 
                            src={siteSettings.deityImage}
                            alt="Deity Statue Detail" 
                            className="w-full h-full object-cover grayscale brightness-50 contrast-125 group-hover:grayscale-0 group-hover:brightness-90 transition-all duration-[1.5s]"
                        />
                    </div>
                    {/* Decorative Frame Element */}
                    <div className="absolute -bottom-6 -right-6 w-32 h-32 border-b-2 border-r-2 border-mystic-gold/30 z-20 hidden md:block"></div>
                </div>
            </div>

            {/* Text Section */}
            <div className="w-full md:w-1/2 space-y-8">
                <div className="rounded-3xl border border-white/10 bg-black/20 backdrop-blur p-7">
                  <p className="text-white/70 leading-relaxed text-justify text-base sm:text-lg whitespace-pre-wrap">
                    {siteSettings.deityIntro}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-white/10 bg-black/25 p-6 hover:bg-white/[0.03] transition-colors">
                        <h4 className="text-white font-semibold mb-1 text-lg tracking-[0.08em]">{siteSettings.deityBirthday}</h4>
                        <p className="text-white/55 text-sm tracking-[0.15em]">{siteSettings.deityBirthdayLabel}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/25 p-6 hover:bg-white/[0.03] transition-colors">
                        <h4 className="text-white font-semibold mb-1 text-lg tracking-[0.08em]">{siteSettings.deityDuty}</h4>
                        <p className="text-white/55 text-sm tracking-[0.15em]">{siteSettings.deityDutyLabel}</p>
                    </div>
                </div>
            </div>

        </div>
      </Container>
    </section>
  );
};

export default DeityInfo;