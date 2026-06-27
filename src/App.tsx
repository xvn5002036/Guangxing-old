import React, { useEffect, useState } from 'react';
import Header, { FrontPageKey } from './components/Header';
import Hero from './components/Hero';
import Almanac from './components/Almanac';
import TempleCalendar from './components/TempleCalendar';
import TempleHistory from './components/TempleHistory';
import Services from './components/Services';
import LightingWall from './components/LightingWall';
import Gallery from './components/Gallery';
import FAQ from './components/FAQ';
import News from './components/News';
import Contact from './components/Contact';
import Footer from './components/Footer';
import BackgroundEffects from './components/BackgroundEffects';
import AdminPanel from './components/AdminPanel';
import MemberCenter from './components/MemberCenter';
import { useData } from './context/DataContext';
import { ScriptureShop } from './components/ScriptureShop';
import MarqueeAnnouncement from './components/MarqueeAnnouncement';
import DonationModal from './components/DonationModal';
import Container from './components/layout/Container';

type View = 'FRONT' | 'MEMBER' | 'SHOP';

const PageShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <main className="relative z-10 flex-grow bg-mystic-dark">
    <div className="min-h-[calc(100vh-260px)]">
      {children}
    </div>
  </main>
);

const HomePage: React.FC<{ onOpenAdmin: () => void }> = ({ onOpenAdmin }) => (
  <>
    <Hero />
    <Almanac onOpenAdmin={onOpenAdmin} />
  </>
);

const HistoryPage: React.FC = () => (
  <div className="bg-[#080808]">
    <TempleHistory />
  </div>
);

const FaqPage: React.FC = () => (
  <div className="bg-[#080808]">
    <FAQ />
  </div>
);

const EmptyPageNotice: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <section className="py-24">
    <Container>
      <div className="rounded-2xl border border-white/10 bg-black/30 p-10 text-center">
        <h2 className="text-2xl font-bold text-mystic-gold mb-3">{title}</h2>
        <p className="text-white/60">{description}</p>
      </div>
    </Container>
  </section>
);

const App: React.FC = () => {
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [view, setView] = useState<View>('FRONT');
  const [page, setPage] = useState<FrontPageKey>('HOME');
  const [isDonationOpen, setIsDonationOpen] = useState(false);
  const { user } = useData();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [view, page, isAdminOpen]);

  const navigatePage = (nextPage: FrontPageKey) => {
    setView('FRONT');
    setPage(nextPage);
  };

  const navigateShop = () => {
    setView('SHOP');
    setPage('SHOP');
  };

  const renderFrontPage = () => {
    switch (page) {
      case 'HOME':
        return <HomePage onOpenAdmin={() => setIsAdminOpen(true)} />;
      case 'NEWS':
        return <News />;
      case 'CALENDAR':
        return <TempleCalendar />;
      case 'SERVICES':
        return <Services />;
      case 'LIGHTING':
        return <LightingWall />;
      case 'HISTORY':
        return <HistoryPage />;
      case 'GALLERY':
        return <Gallery />;
      case 'CONTACT':
        return <Contact />;
      case 'SHOP':
        return <ScriptureShop userId={user?.id} />;
      default:
        return (
          <EmptyPageNotice
            title="頁面準備中"
            description="此頁面尚未設定內容。"
          />
        );
    }
  };

  if (isAdminOpen) {
    return (
      <div className="min-h-screen bg-mystic-dark">
        <AdminPanel onClose={() => setIsAdminOpen(false)} />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen flex flex-col bg-mystic-dark relative">
        <BackgroundEffects />

        <div className="relative z-20">
          <Header
            onNavigateToMember={() => setView('MEMBER')}
            onNavigateToShop={navigateShop}
            onNavigateToHome={() => navigatePage('HOME')}
            onNavigatePage={navigatePage}
            currentView={view === 'SHOP' ? 'SHOP' : view === 'MEMBER' ? 'MEMBER' : 'HOME'}
            currentPage={page}
            onOpenAdmin={() => setIsAdminOpen(true)}
          />
          <MarqueeAnnouncement />
        </div>

        <PageShell>
          {view === 'MEMBER' ? (
            <MemberCenter onBack={() => navigatePage('HOME')} onNavigateToShop={navigateShop} />
          ) : view === 'SHOP' ? (
            <ScriptureShop userId={user?.id} />
          ) : (
            renderFrontPage()
          )}
        </PageShell>

        <Footer onOpenAdmin={() => setIsAdminOpen(true)} />
      </div>
      <DonationModal isOpen={isDonationOpen} onClose={() => setIsDonationOpen(false)} />
    </>
  );
};

export default App;
