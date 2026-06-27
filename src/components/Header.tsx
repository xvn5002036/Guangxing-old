import React, { useEffect, useState } from 'react';
import AuthModal from './AuthModal';
import { User, LogIn, Menu, X, Lock } from 'lucide-react';
import { useData } from '../context/DataContext';

export type FrontPageKey =
  | 'HOME'
  | 'NEWS'
  | 'CALENDAR'
  | 'SERVICES'
  | 'LIGHTING'
  | 'HISTORY'
  | 'GALLERY'
  | 'SHOP'
  | 'CONTACT';

const navItems: Array<{ label: string; page: FrontPageKey }> = [
  { label: '\u9996\u9801', page: 'HOME' },
  { label: '\u6700\u65b0\u516c\u544a', page: 'NEWS' },
  { label: '\u884c\u4e8b\u66c6', page: 'CALENDAR' },
  { label: '\u6fdf\u4e16\u670d\u52d9', page: 'SERVICES' },
  { label: '\u7dda\u4e0a\u9ede\u71c8', page: 'LIGHTING' },
  { label: '\u5bae\u5edf\u6cbf\u9769', page: 'HISTORY' },
  { label: '\u6d3b\u52d5\u82b1\u7d6e', page: 'GALLERY' },
  { label: '\u6578\u4f4d\u5546\u57ce', page: 'SHOP' },
  { label: '\u4ea4\u901a\u6307\u5f15', page: 'CONTACT' },
];

interface HeaderProps {
  onNavigateToMember: () => void;
  onNavigateToShop: () => void;
  onNavigateToHome?: () => void;
  onNavigatePage?: (page: FrontPageKey) => void;
  currentView?: 'HOME' | 'MEMBER' | 'SHOP';
  currentPage?: FrontPageKey;
  onOpenAdmin?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  onNavigateToMember,
  onNavigateToShop,
  onNavigateToHome,
  onNavigatePage,
  currentPage = 'HOME',
  onOpenAdmin,
}) => {
  const { siteSettings, user } = useData();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen || isAuthOpen ? 'hidden' : 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen, isAuthOpen]);

  const handlePageClick = (page: FrontPageKey) => {
    setIsMenuOpen(false);
    if (page === 'SHOP') {
      onNavigateToShop();
      return;
    }
    if (onNavigatePage) {
      onNavigatePage(page);
      return;
    }
    if (onNavigateToHome) onNavigateToHome();
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-mystic-dark/95 backdrop-blur-xl border-b border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.45)]">
        <div className="mx-auto w-full max-w-none px-4 sm:px-6 2xl:px-8 py-3">
          <div className="flex justify-between items-center gap-3 xl:gap-4">
            <button
              type="button"
              onClick={() => handlePageClick('HOME')}
              className="flex min-w-0 items-center gap-3 group text-left shrink-0"
            >
              <div className="w-10 h-10 border rounded-full flex items-center justify-center bg-black/50 border-white/10">
                <span className="text-mystic-gold font-calligraphy text-2xl group-hover:text-white mt-1">{'\u6c60'}</span>
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-[15px] sm:text-base font-semibold tracking-[0.16em] text-gray-100">
                  {siteSettings.templeName}
                </span>
                <span className="hidden sm:block truncate text-xs tracking-[0.28em] 2xl:tracking-[0.35em] text-white/50">
                  TRADITION · FAITH · CULTURE
                </span>
              </div>
            </button>

            <nav className="hidden lg:flex flex-1 min-w-0 items-center justify-center gap-0 overflow-hidden">
              {navItems.map((item) => (
                <button
                  key={item.page}
                  type="button"
                  onClick={() => handlePageClick(item.page)}
                  className={`relative px-1.5 xl:px-2 2xl:px-2.5 py-2 text-[10px] xl:text-[11px] 2xl:text-xs font-bold tracking-[0.03em] xl:tracking-[0.06em] 2xl:tracking-[0.1em] transition-all duration-200 group whitespace-nowrap ${
                    currentPage === item.page ? 'text-mystic-gold' : 'text-white/80 hover:text-mystic-shine'
                  }`}
                >
                  {item.label}
                  <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-px bg-mystic-gold transition-all duration-300 ${currentPage === item.page ? 'w-2/3' : 'w-0 group-hover:w-2/3'}`} />
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-2 2xl:gap-3 shrink-0">
              <button
                onClick={() => {
                  if (user) onNavigateToMember();
                  else setIsAuthOpen(true);
                }}
                className="relative z-[70] flex items-center gap-2 text-xs tracking-[0.12em] 2xl:tracking-[0.2em] font-semibold py-2.5 px-3 2xl:px-4 border rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10 transition-all"
              >
                {user ? <User size={14} /> : <LogIn size={14} />}
                <span className="hidden xl:inline">{user ? '\u6703\u54e1\u4e2d\u5fc3' : '\u767b\u5165'}</span>
              </button>

              <button
                onClick={onOpenAdmin}
                className="hidden md:flex items-center gap-2 text-xs tracking-[0.2em] font-semibold py-2.5 px-3 2xl:px-4 border rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10 transition-all"
                title="\u5f8c\u53f0\u7ba1\u7406"
              >
                <Lock size={14} />
              </button>

              <button
                className="lg:hidden transition-colors relative z-[70] rounded-full border border-white/10 bg-black/20 p-2.5 text-white hover:bg-white/10"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label={isMenuOpen ? '\u95dc\u9589\u9078\u55ae' : '\u958b\u555f\u9078\u55ae'}
              >
                {isMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>

        {isMenuOpen && (
          <div className="fixed inset-0 w-screen h-screen bg-mystic-dark/95 z-[60] flex flex-col items-center backdrop-blur-2xl animate-fade-in overflow-y-auto pb-16 pt-24">
            <div className="w-full max-w-md px-6">
              <div className="rounded-2xl border border-white/10 bg-black/30 shadow-[0_20px_60px_rgba(0,0,0,0.55)] overflow-hidden">
                {navItems.map((item) => (
                  <button
                    key={item.page}
                    className={`block text-[clamp(1rem,4.5vw,1.35rem)] py-4 tracking-[0.25em] transition-colors border-b border-white/10 w-full text-center cursor-pointer font-medium ${
                      currentPage === item.page ? 'text-mystic-gold bg-white/5' : 'text-gray-100 hover:bg-white/5'
                    }`}
                    onClick={() => handlePageClick(item.page)}
                  >
                    {item.label}
                  </button>
                ))}

                <div className="px-5 pt-5 pb-3">
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      if (user) onNavigateToMember();
                      else setIsAuthOpen(true);
                    }}
                    className="relative w-full overflow-hidden group rounded-2xl py-4 font-semibold tracking-[0.28em] text-sm transition-all duration-300 text-black bg-mystic-gold hover:bg-mystic-shine"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {user ? <User size={15} /> : <LogIn size={15} />}
                      {user ? '\u6703\u54e1\u4e2d\u5fc3' : '\u6703\u54e1\u767b\u5165 / \u8a3b\u518a'}
                    </span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    if (onOpenAdmin) onOpenAdmin();
                  }}
                  className="w-full pb-5 text-center text-white/40 text-xs tracking-[0.3em] hover:text-white/70 transition-colors"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Lock size={12} />
                    <span>{'\u5f8c\u53f0\u7ba1\u7406'}</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
};

export default Header;
