
import React from 'react';
import { MapPin, Bus, Car, MessageCircle } from 'lucide-react';
import { useData } from '../context/DataContext';
import Container from './layout/Container';
import SectionHeader from './layout/SectionHeader';

const Contact: React.FC = () => {
    const { siteSettings } = useData();
    const [isMapColor, setIsMapColor] = React.useState(false);
    const timeoutRef = React.useRef<any>(null);

    // Construct map query based on address
    const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(siteSettings.address)}&t=&z=16&ie=UTF8&iwloc=&output=embed`;

    const handleInteractionStart = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsMapColor(true);
    };

    const handleInteractionEnd = () => {
        setIsMapColor(false);
    };

    const handleTouchInteraction = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsMapColor(true);
        // Revert after 10 seconds of no interaction
        timeoutRef.current = setTimeout(() => {
            setIsMapColor(false);
        }, 10000);
    };

    return (
        <section id="contact-info" className="py-24 bg-mystic-dark relative border-t border-mystic-gold/20">
            <Container>
                <div className="mb-12">
                    <SectionHeader
                        align="left"
                        eyebrow="Visit"
                        title="交通指引 & 聯絡"
                        description={`歡迎蒞臨${siteSettings.templeName}參香祈福，或透過線上方式與我們聯繫。`}
                        className="max-w-2xl"
                    />
                </div>
                <div className="flex flex-col lg:flex-row gap-12">

                    {/* Info */}
                    <div className="w-full lg:w-1/3 space-y-8">
                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <div className="w-12 h-12 rounded-2xl border border-white/10 bg-black/20 flex items-center justify-center text-mystic-gold shrink-0">
                                    <Car size={24} />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold mb-1">自行開車</h3>
                                    <p className="text-sm text-white/60 leading-relaxed">
                                        導航設定「{siteSettings.templeName}」或「{siteSettings.address}」即可抵達。
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="w-12 h-12 rounded-2xl border border-white/10 bg-black/20 flex items-center justify-center text-mystic-gold shrink-0">
                                    <Bus size={24} />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold mb-1">捷運/公車</h3>
                                    <p className="text-sm text-white/60 leading-relaxed">
                                        捷運輔大站下車，步行或轉乘公車至福營路附近。
                                    </p>
                                </div>
                            </div>

                            {/* Official Line Account */}
                            <div className="flex gap-4 p-5 border border-white/10 bg-black/20 rounded-2xl">
                                <div className="w-12 h-12 bg-green-500 flex items-center justify-center text-white shrink-0 rounded-full">
                                    <MessageCircle size={24} fill="white" />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold mb-1">官方 LINE 帳號</h3>
                                    <p className="text-sm text-white/65 leading-relaxed mb-3">
                                        加入好友，線上預約點燈、詢問科儀事宜、接收最新法會通知。
                                    </p>
                                    <a
                                        href={siteSettings.lineUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 text-xs font-semibold bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-full transition-colors tracking-[0.2em]"
                                    >
                                        <MessageCircle size={14} />
                                        立即加入好友
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Map */}
                    <div
                        className="w-full lg:w-2/3 h-[520px] bg-black/20 rounded-3xl overflow-hidden border border-white/10 relative group"
                        onMouseEnter={handleInteractionStart}
                        onMouseLeave={handleInteractionEnd}
                        onTouchStart={handleTouchInteraction}
                    >
                        {/* Embedded Google Map with Search Query for new address */}
                        <iframe
                            src={mapSrc}
                            width="100%"
                            height="100%"
                            style={{
                                border: 0,
                                filter: isMapColor ? 'none' : 'grayscale(100%) contrast(1.2) invert(90%) hue-rotate(180deg)',
                                transition: 'filter 0.5s ease'
                            }}
                            allowFullScreen={true}
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            className="transition-all duration-500" // Removed group-hover:filter-none as we control it via state
                        ></iframe>

                        <div className={`absolute bottom-4 left-4 bg-black/40 p-4 border border-white/10 backdrop-blur-sm transition-opacity duration-300 rounded-2xl ${isMapColor ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                            <div className="flex items-center gap-2 text-mystic-gold font-bold">
                                <MapPin size={16} />
                                {siteSettings.templeName}
                            </div>
                            <p className="text-xs text-white/60 mt-1">{siteSettings.address}</p>
                        </div>
                    </div>
                </div>
            </Container>
        </section>
    );
};

export default Contact;
