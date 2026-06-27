import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import Container from './layout/Container';
import SectionHeader from './layout/SectionHeader';

const VirtualTour: React.FC = () => {
  const [currentImage, setCurrentImage] = useState(0);

  const getFallbackDataUrl = (title: string) => {
    const safeTitle = title.replace(/[<>&"]/g, '');
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400">
        <defs>
          <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#0b0b0b"/>
            <stop offset="1" stop-color="#1a1a1a"/>
          </linearGradient>
          <radialGradient id="glow" cx="25%" cy="30%" r="65%">
            <stop offset="0" stop-color="rgba(197,160,89,0.35)"/>
            <stop offset="1" stop-color="rgba(197,160,89,0)"/>
          </radialGradient>
        </defs>
        <rect width="800" height="400" fill="url(#bg)"/>
        <rect width="800" height="400" fill="url(#glow)"/>
        <rect x="28" y="28" width="744" height="344" rx="24" fill="rgba(0,0,0,0.25)" stroke="rgba(255,255,255,0.10)"/>
        <text x="60" y="110" fill="rgba(255,255,255,0.92)" font-family="Inter, 'Noto Serif TC', system-ui, -apple-system, Segoe UI, sans-serif" font-size="36" font-weight="700" letter-spacing="2">${safeTitle}</text>
        <text x="60" y="160" fill="rgba(255,255,255,0.55)" font-family="Inter, 'Noto Serif TC', system-ui, -apple-system, Segoe UI, sans-serif" font-size="16" letter-spacing="4">IMAGE NOT FOUND</text>
        <text x="60" y="320" fill="rgba(255,255,255,0.55)" font-family="Inter, 'Noto Serif TC', system-ui, -apple-system, Segoe UI, sans-serif" font-size="14">請將圖片放到 public/assets/images/</text>
      </svg>
    `;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  };

  const images = [
    {
      src: '/assets/images/temple-exterior.jpg',
      alt: '宮廟外觀',
      title: '莊嚴外觀',
      description: '傳統宮廟建築，融合現代設計元素'
    },
    {
      src: '/assets/images/temple-interior.jpg',
      alt: '宮廟內部',
      title: '神聖內殿',
      description: '供奉神明的神聖空間，充滿虔敬氛圍'
    },
    {
      src: '/assets/images/temple-altar.jpg',
      alt: '祭壇',
      title: '祭祀祭壇',
      description: '精心布置的祭祀空間，彰顯文化傳統'
    }
  ];

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <section className="py-20 bg-mystic-dark">
      <Container>
        <div className="mb-12">
          <SectionHeader
            eyebrow="Experience"
            title="虛擬宮廟導覽"
            description="透過精美圖片探索宮廟每個角落，先感受氛圍，再安排參拜行程。"
          />
        </div>

        <div className="relative max-w-4xl mx-auto animate-fade-in-scale">
          <div className="relative h-96 bg-black/40 rounded-3xl overflow-hidden border border-white/10 shadow-[0_30px_90px_rgba(0,0,0,0.65)]">
            <img
              src={images[currentImage].src}
              alt={images[currentImage].alt}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = getFallbackDataUrl(images[currentImage].title);
              }}
            />

            {/* Navigation buttons */}
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2.5 rounded-full border border-white/10 backdrop-blur transition-colors"
              aria-label="上一張"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2.5 rounded-full border border-white/10 backdrop-blur transition-colors"
              aria-label="下一張"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Image info overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/85 to-transparent p-6">
              <div className="flex items-center gap-2 text-white/70 text-xs tracking-[0.25em] mb-2">
                <Eye className="w-4 h-4" />
                TOUR
              </div>
              <h3 className="text-white text-xl font-semibold mb-2 tracking-[0.12em]">{images[currentImage].title}</h3>
              <p className="text-white/70 leading-relaxed">{images[currentImage].description}</p>
            </div>
          </div>

          {/* Image indicators */}
          <div className="flex justify-center mt-4 space-x-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImage(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentImage ? 'bg-mystic-gold' : 'bg-gray-600'
                }`}
                aria-label={`切換到第 ${index + 1} 張`}
              />
            ))}
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-white/55">使用箭頭按鈕或指示器切換圖片</p>
        </div>
      </Container>
    </section>
  );
};

export default VirtualTour;