
import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { ChevronLeft, ChevronRight, Search, Sparkles } from 'lucide-react';
import Container from './layout/Container';
import SectionHeader from './layout/SectionHeader';

const ITEMS_PER_PAGE = 10;

const LightingWall: React.FC = () => {
    const { registrations, services, siteSettings } = useData();
    const [currentPage, setCurrentPage] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');

    // 1. Identify which services are of type 'LIGHT'
    const lightServiceIds = useMemo(() => {
        return services.filter(s => s.type === 'LIGHT').map(s => s.id);
    }, [services]);

    // 2. Filter registrations that are (1) for lights and (2) PROCESSED by admin
    const activeLights = useMemo(() => {
        const now = Date.now();
        return registrations.filter(r =>
            lightServiceIds.includes(r.serviceId) &&
            r.isProcessed === true &&
            (!r.lightExpireDate || new Date(r.lightExpireDate).getTime() >= now)
        );
    }, [registrations, lightServiceIds]);

    // Search filter
    const filteredLights = useMemo(() => {
        if (!searchTerm) return activeLights;
        return activeLights.filter(l => l.name.includes(searchTerm) || l.phone.includes(searchTerm));
    }, [activeLights, searchTerm]);

    // Pagination Logic
    const totalPages = Math.ceil(Math.max(filteredLights.length, 1) / ITEMS_PER_PAGE);

    // Get current page items
    const currentItems = useMemo(() => {
        const start = currentPage * ITEMS_PER_PAGE;
        // We always want to show placeholders if fewer than 10 items, or just the items?
        // Let's grab the actual items first
        const items = filteredLights.slice(start, start + ITEMS_PER_PAGE);

        // Fill the rest with "Empty/Available" slots to maintain the "Wall" look of 10 units
        const filledItems = [...items];
        while (filledItems.length < ITEMS_PER_PAGE) {
            filledItems.push(null as any);
        }
        return filledItems;
    }, [filteredLights, currentPage]);

    const handlePrev = () => setCurrentPage(p => Math.max(0, p - 1));
    const handleNext = () => setCurrentPage(p => Math.min(totalPages - 1, p + 1));

    // Determine if the Deity should glow (if there are any lights on this page)
    const isDeityGlowing = currentItems.some(item => item !== null);

    return (
        <section id="lighting-wall" className="py-24 relative overflow-hidden border-t border-white/5" style={{ background: '#0D1117' }}>
            {/* Background Texture */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(197,160,89,0.10),transparent_55%),radial-gradient(circle_at_70%_80%,rgba(255,215,0,0.08),transparent_60%)] opacity-100"></div>

            <Container className="relative z-10">
                <div className="mb-12">
                    <SectionHeader
                        eyebrow="Blessing Wall"
                        title="線上光明燈牆"
                        description="每一盞燈，都是一份虔誠的祈願。當您完成報名並經廟方受理後，您的名字將在此點亮，受神光普照。"
                    />
                </div>

                {/* Search & Stats */}
                <div className="flex flex-col md:flex-row justify-between items-center max-w-5xl mx-auto mb-8 gap-4">
                    <div className="text-mystic-gold font-semibold border border-white/10 px-5 py-3 rounded-full bg-black/30 text-sm tracking-[0.12em]">
                        目前點燈信眾：{activeLights.length} 位
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        <input
                            type="text"
                            placeholder="搜尋信眾姓名..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(0); }}
                            className="pl-10 pr-4 py-3 bg-black/30 border border-white/10 rounded-full text-white text-sm focus:border-mystic-gold outline-none w-64"
                        />
                    </div>
                </div>

                {/* THE WALL CONTAINER */}
                <div className="max-w-6xl mx-auto relative">

                    {/* Pagination Controls - Absolute on desktop */}
                    <button
                        onClick={handlePrev}
                        disabled={currentPage === 0}
                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 z-20 p-3 rounded-full bg-mystic-charcoal border border-mystic-gold/30 text-mystic-gold hover:bg-mystic-gold hover:text-black transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft size={32} />
                    </button>
                    <button
                        onClick={handleNext}
                        disabled={currentPage >= totalPages - 1}
                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 z-20 p-3 rounded-full bg-mystic-charcoal border border-mystic-gold/30 text-mystic-gold hover:bg-mystic-gold hover:text-black transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <ChevronRight size={32} />
                    </button>

                    {/* Main Display Area */}
                    <div className="bg-black/25 border border-white/10 rounded-3xl p-6 md:p-12 shadow-[0_30px_90px_rgba(0,0,0,0.7)] relative overflow-hidden min-h-[600px] flex flex-col items-center">

                        {/* 1. THE DEITY (Top Center) */}
                        {/* 1. THE DEITY (Top Center) */}
                        <div className="relative mb-16 group z-20">
                            {/* Divine Light / Halo Background */}
                            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] w-[300px] h-[300px] rounded-full transition-all duration-1000 ${isDeityGlowing ? 'bg-gradient-radial from-yellow-400/30 via-yellow-600/10 to-transparent blur-3xl opacity-100' : 'bg-transparent opacity-0'}`}></div>

                            {/* Deity Image Frame - Arch Shape */}
                            <div className={`relative w-48 h-64 md:w-56 md:h-72 mx-auto rounded-t-full border-[3px] ${isDeityGlowing ? 'border-yellow-500/80 shadow-[0_0_50px_rgba(255,215,0,0.5)]' : 'border-white/10'} overflow-hidden bg-gradient-to-b from-gray-900 to-black transition-all duration-1000 transform group-hover:scale-105`}>

                        {/* Subtle pattern overlay (no external asset) */}
                                <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.06),transparent_35%),radial-gradient(circle_at_70%_60%,rgba(255,255,255,0.04),transparent_40%)]"></div>

                                {(() => {
                                    // 邏輯：如果資料庫中有設定圖片且不是預設的 Unsplash 連結，則使用它
                                    // 否則，使用我們剛剛上傳的本地圖片 /assets/images/deity.jpg
                                    const isDefaultUnsplash = siteSettings.deityImage?.includes('images.unsplash.com');
                                    const imgSrc = (siteSettings.deityImage && !isDefaultUnsplash) 
                                        ? siteSettings.deityImage 
                                        : "/assets/images/deity.jpg";
                                    
                                    return (
                                        <img
                                            src={imgSrc}
                                            alt={siteSettings.deityTitle || "Main Deity"}
                                            className={`w-full h-full object-cover object-[50%_30%] transition-all duration-1000 ${isDeityGlowing ? 'brightness-110 contrast-110 saturate-110 scale-135 shadow-[0_0_30px_rgba(255,215,0,0.3)]' : 'brightness-90 scale-120'}`}
                                        />
                                    );
                                })()}

                                {/* Inner Shine Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent"></div>
                            </div>

                            {/* Altar Base / Nameplate */}
                            <div className="relative -mt-4 mx-auto w-64 md:w-72">
                                {/* Base Decoration */}
                                <div className="absolute inset-x-4 top-0 h-1 bg-yellow-600/50 blur-[2px]"></div>
                                <div className="bg-gradient-to-b from-yellow-950 via-red-950 to-black border-t-2 border-yellow-700/80 rounded-sm shadow-xl py-2 px-4 relative overflow-hidden">
                                    {/* Gold Speckles (no external asset) */}
                                    <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_15%_35%,rgba(197,160,89,0.35),transparent_20%),radial-gradient(circle_at_55%_20%,rgba(197,160,89,0.25),transparent_18%),radial-gradient(circle_at_80%_55%,rgba(197,160,89,0.22),transparent_22%)]"></div>

                                    <div className="relative text-center">
                                        <div className="text-[10px] text-yellow-500/80 tracking-[0.5em] mb-0.5 uppercase">Main Deity</div>
                                        <h3 className="text-xl font-bold text-white font-serif tracking-widest drop-shadow-md">
                                            {siteSettings.templeName}
                                        </h3>
                                    </div>
                                </div>
                                {/* Shadow below base */}
                                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-4/5 h-4 bg-black/50 blur-xl"></div>
                            </div>
                        </div>

                        {/* 2. THE LIGHTS GRID (10 Units) */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-8 w-full relative z-10">
                            {currentItems.map((light, index) => (
                                <div key={index} className="flex flex-col items-center">
                                    {/* The Lamp Object */}
                                    <div className={`relative w-full aspect-[3/4] rounded-t-full border-2 transition-all duration-700 flex flex-col items-center justify-end overflow-hidden group
                                ${light
                                            ? 'bg-gradient-to-b from-yellow-950/80 via-red-950/50 to-black border-yellow-500/80 shadow-[0_0_15px_rgba(255,165,0,0.3)]'
                                            : 'bg-black/40 border-gray-800/50'
                                        }`}
                                    >
                                        {/* Background Deity Image for all lamps */}
                                        <div className="absolute inset-0 z-0">
                                            {(() => {
                                                const isDefaultUnsplash = siteSettings.deityImage?.includes('images.unsplash.com');
                                                const imgSrc = (siteSettings.deityImage && !isDefaultUnsplash) 
                                                    ? siteSettings.deityImage 
                                                    : "/assets/images/deity.jpg";
                                                
                                                return (
                                                    <img
                                                        src={imgSrc}
                                                        alt="Deity Base"
                                                        className={`w-full h-full object-cover object-[50%_35%] transition-all duration-1000 ${light ? 'brightness-110 saturate-110' : 'brightness-[0.4] opacity-80'}`}
                                                    />
                                                );
                                            })()}
                                            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                                        </div>

                                        {/* Light Source (Top) */}
                                        {light && (
                                            <div className="absolute top-4 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_12px_4px_rgba(255,255,0,0.8)] animate-pulse z-20"></div>
                                        )}

                                        {/* Inner Glow */}
                                        {light && (
                                            <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/10 to-transparent z-10"></div>
                                        )}

                                        {/* Name Tag (Vertical) */}
                                        <div className="relative z-20 py-4 w-full text-center">
                                            {light ? (
                                                <div className="flex flex-col items-center gap-0.5">
                                                    <span className="text-[9px] text-yellow-500/80 tracking-widest">{light.serviceTitle.substring(0, 2)}</span>
                                                    <div className="w-4 h-[1px] bg-yellow-500/30 my-0.5"></div>
                                                    <div className="text-lg md:text-xl font-bold text-white writing-vertical-rl font-serif tracking-widest drop-shadow-[0_1px_3px_rgba(0,0,0,1)]">
                                                        {light.name}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center h-full opacity-40">
                                                    <div className="text-base text-gray-500 font-serif writing-vertical-rl tracking-widest">
                                                        平安
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Number Tag */}
                                    <div className={`mt-2 text-[10px] tracking-widest ${light ? 'text-yellow-500' : 'text-gray-700'}`}>
                                        NO. {(currentPage * ITEMS_PER_PAGE) + index + 1}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Page Indicator */}
                        <div className="mt-12 flex items-center gap-2">
                            {Array.from({ length: totalPages }).map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i)}
                                    className={`w-2 h-2 rounded-full transition-all ${i === currentPage ? 'bg-mystic-gold w-6' : 'bg-gray-700 hover:bg-gray-500'}`}
                                />
                            ))}
                        </div>

                    </div>
                </div>

                {/* CTA */}
                <div className="text-center mt-12">
                    <a href="#services" className="inline-flex items-center gap-2 px-8 py-3 bg-mystic-red text-white font-semibold tracking-[0.25em] rounded-xl hover:bg-red-800 transition-colors shadow-lg">
                        <Sparkles size={18} />
                        我也要點燈
                    </a>
                </div>

            </Container>
        </section>
    );
};

export default LightingWall;
