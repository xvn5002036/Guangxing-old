import React, { useEffect, useState } from 'react';
import { useData } from '../context/DataContext';
import { PlayCircle, X, ChevronLeft, ChevronRight, Youtube, ExternalLink } from 'lucide-react';
import { GalleryItem } from '../types';
import Container from './layout/Container';
import SectionHeader from './layout/SectionHeader';

const Gallery: React.FC = () => {
    const { gallery, galleryAlbums } = useData();
    const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
    const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);

    const getYouTubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const isDirectImage = (url: string) => /\.(jpg|jpeg|png|gif|webp|avif|svg)(\?|#|$)/i.test(url) || url.includes('images.unsplash.com');
    const isExternalCard = (item: GalleryItem) => item.type === 'IMAGE' && !isDirectImage(item.url);

    const filteredGallery = selectedAlbumId
        ? gallery.filter(item => item.albumId === selectedAlbumId)
        : [];

    const handlePrev = (e: React.MouseEvent | KeyboardEvent) => {
        e.stopPropagation();
        if (!selectedItem || filteredGallery.length === 0) return;
        const currentIndex = filteredGallery.findIndex(item => item.id === selectedItem.id);
        const prevIndex = (currentIndex - 1 + filteredGallery.length) % filteredGallery.length;
        setSelectedItem(filteredGallery[prevIndex]);
    };

    const handleNext = (e: React.MouseEvent | KeyboardEvent) => {
        e.stopPropagation();
        if (!selectedItem || filteredGallery.length === 0) return;
        const currentIndex = filteredGallery.findIndex(item => item.id === selectedItem.id);
        const nextIndex = (currentIndex + 1) % filteredGallery.length;
        setSelectedItem(filteredGallery[nextIndex]);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setSelectedItem(null);
            if (!selectedItem) return;
            if (e.key === 'ArrowLeft') handlePrev(e);
            if (e.key === 'ArrowRight') handleNext(e);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedItem, filteredGallery]);

    const renderThumb = (item: GalleryItem) => {
        const youtubeId = item.type === 'YOUTUBE' ? getYouTubeId(item.url) : null;
        if (isExternalCard(item)) {
            return (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-black/60 text-white/70 p-5 text-center">
                    <ExternalLink size={36} className="text-mystic-gold" />
                    <span className="text-sm break-all line-clamp-3">{item.url}</span>
                </div>
            );
        }
        if (item.type === 'VIDEO') {
            return (
                <video
                    src={item.url}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                    muted
                    loop
                    playsInline
                    onMouseOver={e => e.currentTarget.play()}
                    onMouseOut={e => e.currentTarget.pause()}
                />
            );
        }
        return (
            <img
                src={youtubeId ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : item.url}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100"
            />
        );
    };

    return (
        <section id="gallery" className="py-24 relative overflow-hidden" style={{ background: '#0D1117' }}>
            <Container>
                <div className="mb-16">
                    <SectionHeader
                        eyebrow="Gallery"
                        title="活動花絮"
                        description="廟務活動、法會紀錄與公開相簿連結。"
                    />
                    {selectedAlbumId && (
                        <button
                            onClick={() => setSelectedAlbumId(null)}
                            className="mt-6 text-white/70 hover:text-white flex items-center justify-center gap-2 mx-auto transition-colors"
                        >
                            <ChevronLeft size={16} /> 返回相簿
                        </button>
                    )}
                </div>

                {!selectedAlbumId && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {galleryAlbums.length > 0 ? galleryAlbums.map((album) => (
                            <div key={album.id} onClick={() => setSelectedAlbumId(album.id)} className="group cursor-pointer">
                                <div className="aspect-[4/3] overflow-hidden rounded-3xl border border-white/10 bg-black/30 relative mb-4 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
                                    <img
                                        src={album.coverImageUrl || 'https://images.unsplash.com/photo-1592388796690-3482d8d8091e?q=80&w=1000&auto=format&fit=crop'}
                                        alt={album.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                                    />
                                    <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors duration-300" />
                                </div>
                                <h3 className="text-lg font-semibold text-white/90 group-hover:text-mystic-gold transition-colors text-center tracking-[0.12em]">{album.title}</h3>
                                <p className="text-white/55 text-sm text-center mt-2 line-clamp-2 leading-relaxed">{album.description}</p>
                                <div className="text-xs text-white/45 text-center mt-3 tracking-[0.35em] group-hover:text-white/70 transition-colors">查看相簿</div>
                            </div>
                        )) : (
                            <div className="col-span-full text-center text-white/50 py-12 border border-white/10 border-dashed rounded-3xl bg-black/20">
                                目前沒有相簿資料
                            </div>
                        )}
                    </div>
                )}

                {selectedAlbumId && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
                        {filteredGallery.length > 0 ? filteredGallery.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => setSelectedItem(item)}
                                className="group relative aspect-[4/3] overflow-hidden rounded-2xl cursor-pointer border border-white/10 bg-black/30 hover:bg-white/[0.03] transition-colors"
                            >
                                {renderThumb(item)}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 z-10">
                                    <span className="text-white font-bold tracking-widest text-lg translate-y-4 group-hover:translate-y-0 transition-transform duration-300">{item.title}</span>
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    {item.type === 'VIDEO' && (
                                        <div className="w-12 h-12 rounded-full bg-black/50 border border-white/20 flex items-center justify-center group-hover:bg-mystic-gold/80 transition-colors">
                                            <PlayCircle className="text-white group-hover:text-black" size={24} />
                                        </div>
                                    )}
                                    {item.type === 'YOUTUBE' && (
                                        <div className="w-12 h-12 rounded-full bg-red-600/80 border border-white/20 flex items-center justify-center group-hover:bg-red-600 transition-colors">
                                            <Youtube className="text-white" size={24} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-full text-center text-white/50 py-12 border border-white/10 border-dashed rounded-3xl bg-black/20">
                                這個相簿目前沒有內容
                            </div>
                        )}
                    </div>
                )}
            </Container>

            {selectedItem && (
                <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in" onClick={() => setSelectedItem(null)}>
                    <button className="absolute top-6 right-6 text-gray-400 hover:text-white hover:rotate-90 transition-all duration-300 z-50 p-2" onClick={() => setSelectedItem(null)}>
                        <X size={40} />
                    </button>

                    {filteredGallery.length > 1 && (
                        <>
                            <button className="absolute left-4 md:left-10 text-gray-400 hover:text-white hover:bg-white/10 p-4 rounded-full transition-all z-50 group" onClick={handlePrev}>
                                <ChevronLeft size={48} className="group-hover:-translate-x-1 transition-transform" />
                            </button>
                            <button className="absolute right-4 md:right-10 text-gray-400 hover:text-white hover:bg-white/10 p-4 rounded-full transition-all z-50 group" onClick={handleNext}>
                                <ChevronRight size={48} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </>
                    )}

                    <div className="relative max-w-7xl w-full max-h-[90vh] flex flex-col items-center justify-center" onClick={e => e.stopPropagation()}>
                        <div className="relative w-full flex justify-center items-center" style={{ height: '80vh' }}>
                            {selectedItem.type === 'VIDEO' ? (
                                <video src={selectedItem.url} controls autoPlay className="max-w-full max-h-full object-contain shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 rounded-sm" />
                            ) : selectedItem.type === 'YOUTUBE' ? (
                                <iframe
                                    width="100%"
                                    height="100%"
                                    src={`https://www.youtube.com/embed/${getYouTubeId(selectedItem.url)}?autoplay=1&rel=0`}
                                    title="YouTube video player"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="w-full h-full max-w-5xl aspect-video shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 rounded-sm"
                                />
                            ) : isExternalCard(selectedItem) ? (
                                <div className="w-full max-w-3xl min-h-[320px] rounded-sm border border-white/10 bg-black/70 flex flex-col items-center justify-center gap-5 p-8 text-center">
                                    <ExternalLink size={48} className="text-mystic-gold" />
                                    <p className="text-white/70 max-w-xl">這是外部平台連結，部分平台不允許直接嵌入網站，請點擊開啟查看。</p>
                                    <a href={selectedItem.url} target="_blank" rel="noreferrer" className="bg-mystic-gold text-black px-5 py-3 rounded font-bold hover:bg-yellow-500">
                                        開啟外部連結
                                    </a>
                                </div>
                            ) : (
                                <img src={selectedItem.url} alt={selectedItem.title} className="max-w-full max-h-full object-contain shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 rounded-sm" />
                            )}
                        </div>

                        <div className="mt-6 text-center animate-fade-in-up">
                            <h3 className="text-2xl font-bold text-white tracking-widest mb-2 font-serif">{selectedItem.title}</h3>
                            <div className="flex items-center justify-center gap-2 text-xs text-mystic-gold uppercase tracking-[0.2em]">
                                <span className="w-8 h-[1px] bg-mystic-gold/50" />
                                {selectedItem.type === 'VIDEO' ? 'Video' : selectedItem.type === 'YOUTUBE' ? 'YouTube' : isExternalCard(selectedItem) ? 'External Link' : 'Image'} Gallery
                                <span className="w-8 h-[1px] bg-mystic-gold/50" />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default Gallery;
