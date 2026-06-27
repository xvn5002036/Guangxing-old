import React from 'react';
import { useData } from '../context/DataContext';
import Container from './layout/Container';
import SectionHeader from './layout/SectionHeader';

const TempleHistory: React.FC = () => {
    const { siteSettings } = useData();

    return (
        <section id="history" className="py-24 relative overflow-hidden" style={{ background: '#0D1117' }}>
            <Container>

                {/* Section Header */}
                <div className="mb-16">
                    <SectionHeader
                        eyebrow="Heritage"
                        title="宮廟沿革"
                        description="從信仰、傳承到在地文化，記錄廣行宮一路走來的故事。"
                    />
                </div>

                <div className="flex flex-col lg:flex-row gap-16 items-start">

                    {/* Timeline / History Text */}
                    <div className="w-full lg:w-1/2 space-y-12">
                        <div className="relative pl-8 border-l border-mystic-gold/30">
                            <span className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-mystic-gold"></span>
                            <h3 className="text-xl sm:text-2xl font-semibold text-white mb-4 tracking-[0.08em]">{siteSettings.historyTitle1}</h3>
                            <p className="text-white/70 leading-relaxed text-justify">
                                {siteSettings.historyDesc1}
                            </p>
                        </div>
                        <div className="relative pl-8 border-l border-mystic-gold/30">
                            <span className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-mystic-gold"></span>
                            <h3 className="text-xl sm:text-2xl font-semibold text-white mb-4 tracking-[0.08em]">{siteSettings.historyTitle2}</h3>
                            <p className="text-white/70 leading-relaxed text-justify">
                                {siteSettings.historyDesc2}
                            </p>
                        </div>
                        <div className="relative pl-8 border-l border-mystic-gold/30">
                            <span className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-mystic-gold"></span>
                            <h3 className="text-xl sm:text-2xl font-semibold text-white mb-4 tracking-[0.08em]">{siteSettings.historyTitle3}</h3>
                            <p className="text-white/70 leading-relaxed text-justify">
                                {siteSettings.templeName}{siteSettings.historyDesc3}
                            </p>
                        </div>
                    </div>

                    {/* Architecture Visuals */}
                    <div className="w-full lg:w-1/2 grid grid-cols-2 gap-4">
                        <div className="space-y-4 mt-8">
                            <img src={siteSettings.historyImageRoof} className="w-full h-64 object-cover rounded-2xl border border-white/10 grayscale hover:grayscale-0 transition-all duration-700" alt="Temple Roof" />
                            <div className="rounded-2xl border border-white/10 bg-black/25 backdrop-blur p-5">
                                <h4 className="text-white font-semibold mb-1 tracking-[0.08em]">{siteSettings.historyRoofTitle}</h4>
                                <p className="text-sm text-white/60 leading-relaxed">{siteSettings.historyRoofDesc}</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="rounded-2xl border border-white/10 bg-black/25 backdrop-blur p-5">
                                <h4 className="text-white font-semibold mb-1 tracking-[0.08em]">{siteSettings.historyStoneTitle}</h4>
                                <p className="text-sm text-white/60 leading-relaxed">{siteSettings.historyStoneDesc}</p>
                            </div>
                            <img src={siteSettings.historyImageStone} className="w-full h-64 object-cover rounded-2xl border border-white/10 grayscale hover:grayscale-0 transition-all duration-700" alt="Stone Carving" />
                        </div>
                    </div>

                </div>
            </Container>
        </section>
    );
};

export default TempleHistory;