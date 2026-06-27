
import React from 'react';
import { MapPin, Phone, Clock, MessageCircle, ChevronRight } from 'lucide-react';
import { useData } from '../context/DataContext';

interface FooterProps {
  onOpenAdmin?: () => void;
}

const Footer: React.FC<FooterProps> = ({ onOpenAdmin }) => {
  const { siteSettings } = useData();

  const quickLinks = [
    { label: '最新公告', href: '#news' },
    { label: '行事曆', href: '#calendar' },
    { label: '濟世服務', href: '#services' },
    { label: '線上燈牆', href: '#lighting-wall' },
    { label: '宮廟沿革', href: '#history' },
    { label: '活動花絮', href: '#gallery' },
  ];

  return (
    <footer id="contact-info" className="relative bg-[#080808] text-gray-500 border-t border-white/5 overflow-hidden">
      {/* Top decorative divider */}
      <div className="divider-gold" />

      {/* Background radial */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(197,160,89,0.04),transparent_60%)] pointer-events-none" />

      <div className="container mx-auto px-6 py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

          {/* Column 1: Logo & Description */}
          <div className="space-y-5 lg:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full border border-mystic-gold/30 bg-black/40 flex items-center justify-center shadow-gold">
                <span className="text-mystic-gold font-calligraphy text-2xl mt-1">池</span>
              </div>
              <div>
                <h3 className="text-base font-semibold text-white tracking-[0.18em]">{siteSettings.templeName}</h3>
                <p className="text-[10px] tracking-[0.3em] text-white/40">TRADITION · FAITH · CULTURE</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-gray-500 max-w-xs">
              承襲千年信仰，融合現代科技。在雲端，延續人與神之間的對話。
            </p>
            <a
              href={siteSettings.lineUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-900/20 text-green-400 rounded-lg border border-green-900/40 hover:bg-green-800/30 hover:text-green-300 transition-all duration-200 text-sm"
            >
              <MessageCircle size={15} />
              <span className="font-semibold tracking-wider">加入官方 LINE</span>
            </a>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-4">
            <h4 className="text-xs tracking-[0.4em] text-mystic-gold font-semibold uppercase mb-5">快速連結</h4>
            <ul className="space-y-2.5">
              {quickLinks.map(link => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-mystic-shine transition-colors duration-200 group"
                  >
                    <ChevronRight size={12} className="text-mystic-gold/40 group-hover:text-mystic-gold transition-colors" />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Contact Info */}
          <div className="space-y-4">
            <h4 className="text-xs tracking-[0.4em] text-mystic-gold font-semibold uppercase mb-5">聯絡資訊</h4>
            <div className="flex flex-col gap-4 text-sm">
              <div className="flex items-start gap-3">
                <MapPin size={15} className="text-mystic-gold mt-0.5 flex-shrink-0" />
                <span className="leading-relaxed">{siteSettings.address}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={15} className="text-mystic-gold flex-shrink-0" />
                <span>{siteSettings.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock size={15} className="text-mystic-gold flex-shrink-0" />
                <span>每日 05:00 – 21:00</span>
              </div>
            </div>
          </div>

          {/* Column 4: Copyright & Admin */}
          <div className="space-y-4 lg:text-right">
            <h4 className="text-xs tracking-[0.4em] text-mystic-gold font-semibold uppercase mb-5">關於本站</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              &copy; {new Date().getFullYear()} {siteSettings.templeName}.<br />
              All rights reserved.
            </p>
            <p className="text-xs text-gray-700 leading-relaxed max-w-[180px] ml-auto">
              本站資訊僅供參考，實際服務事項請洽廟方確認。
            </p>
            {onOpenAdmin && (
              <button
                onClick={onOpenAdmin}
                className="text-xs text-gray-700 hover:text-gray-500 transition-colors tracking-widest"
              >
                管理員後台
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="divider-gold" />
      <div className="py-4 text-center text-[11px] text-gray-700 tracking-[0.3em]">
        廣行宮 · 傳承信仰 · 守護平安
      </div>
    </footer>
  );
};

export default Footer;
