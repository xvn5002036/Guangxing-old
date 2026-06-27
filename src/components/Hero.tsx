import React from 'react';
import { ChevronDown } from 'lucide-react';
import { useData } from '../context/DataContext';

const Hero: React.FC = () => {
  const { siteSettings } = useData();

  return (
    <section id="home" className="relative min-h-[92vh] w-full overflow-hidden bg-black flex items-center">
      {/* Background Video/Image with Ken Burns effect - UPDATED IMAGE (Dark, Dramatic Temple Roof/Smoke) */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-50 animate-ken-burns"
        style={{ backgroundImage: `url("${siteSettings.heroImage}")` }}
      ></div>

      {/* Dynamic Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/35 to-mystic-dark"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(197,160,89,0.18),transparent_55%),radial-gradient(circle_at_80%_30%,rgba(255,215,0,0.10),transparent_50%)]"></div>

      {/* Main Content */}
      <div className="relative z-10 w-full pt-24 pb-24">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-black/30 px-4 py-2 text-xs tracking-[0.35em] text-white/80 backdrop-blur animate-fade-in">
                <span className="text-mystic-gold font-semibold">廣行宮</span>
                <span className="h-3 w-px bg-white/15" />
                <span>TRADITION · FAITH · CULTURE</span>
              </div>

              <h1 className="mt-6 text-[clamp(2.75rem,7vw,5.5rem)] font-bold text-white tracking-[0.18em] drop-shadow-[0_10px_30px_rgba(0,0,0,0.7)] font-calligraphy leading-[1.05] animate-fade-in-up">
                {siteSettings.heroTitle}
              </h1>

              <p className="mt-6 text-white/80 text-base sm:text-lg leading-relaxed max-w-2xl animate-fade-in-up">
                {siteSettings.heroSubtitle}
              </p>

              <div className="mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center animate-fade-in-up">
                <a
                  href="#services"
                  className="inline-flex items-center justify-center rounded-xl bg-mystic-gold text-black font-semibold px-6 py-3.5 shadow-[0_20px_50px_rgba(197,160,89,0.25)] hover:bg-mystic-gold/90 transition-colors"
                >
                  探索服務
                </a>
                <a
                  href="#history"
                  className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-black/20 text-white font-semibold px-6 py-3.5 hover:bg-white/5 transition-colors"
                >
                  認識沿革
                </a>
                <a
                  href="#contact"
                  className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-black/10 text-white/80 font-semibold px-6 py-3.5 hover:text-white hover:bg-white/5 transition-colors"
                >
                  交通指引
                </a>
              </div>

              <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl">
                <div className="rounded-2xl border border-white/10 bg-black/25 backdrop-blur px-5 py-4">
                  <div className="text-xs tracking-[0.3em] text-white/60">即時資訊</div>
                  <div className="mt-2 text-white font-semibold">活動 · 行事曆</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/25 backdrop-blur px-5 py-4">
                  <div className="text-xs tracking-[0.3em] text-white/60">線上服務</div>
                  <div className="mt-2 text-white font-semibold">點燈 · 祈福</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/25 backdrop-blur px-5 py-4">
                  <div className="text-xs tracking-[0.3em] text-white/60">文化體驗</div>
                  <div className="mt-2 text-white font-semibold">導覽 · 典藏</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="relative">
                <div className="absolute -inset-6 bg-[radial-gradient(circle_at_30%_20%,rgba(197,160,89,0.30),transparent_55%)] blur-2xl" />
                <div className="relative rounded-3xl border border-white/10 bg-black/35 backdrop-blur p-6 shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl border border-white/10 bg-black/30 flex items-center justify-center">
                      <span className="text-mystic-gold font-calligraphy text-2xl mt-1">池</span>
                    </div>
                    <div>
                      <div className="text-white font-semibold tracking-[0.12em]">今日祈願</div>
                      <div className="text-white/60 text-sm">心誠則靈 · 平安順遂</div>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <a
                      href="#lighting-wall"
                      className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 hover:bg-white/5 transition-colors"
                    >
                      <div className="text-xs tracking-[0.3em] text-white/60">線上</div>
                      <div className="mt-1 text-white font-semibold">點燈祈福</div>
                    </a>
                    <a
                      href="#calendar"
                      className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 hover:bg-white/5 transition-colors"
                    >
                      <div className="text-xs tracking-[0.3em] text-white/60">查看</div>
                      <div className="mt-1 text-white font-semibold">行事曆</div>
                    </a>
                    <a
                      href="#news"
                      className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 hover:bg-white/5 transition-colors"
                    >
                      <div className="text-xs tracking-[0.3em] text-white/60">最新</div>
                      <div className="mt-1 text-white font-semibold">公告消息</div>
                    </a>
                    <a
                      href="#gallery"
                      className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 hover:bg-white/5 transition-colors"
                    >
                      <div className="text-xs tracking-[0.3em] text-white/60">典藏</div>
                      <div className="mt-1 text-white font-semibold">活動花絮</div>
                    </a>
                  </div>

                  <div className="mt-6 text-xs text-white/55 leading-relaxed">
                    建議在桌機瀏覽以獲得完整沉浸體驗；手機也已最佳化操作與閱讀。
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <ChevronDown className="w-8 h-8 text-mystic-gold" />
      </div>
    </section>
  );
};

export default Hero;