import React, { useState } from 'react';
import { Sun, Moon, Briefcase, HeartHandshake, Gift, FileText } from 'lucide-react';
import { ServiceItem } from '../types';
import ServiceModal from './ServiceModal';
import { useData } from '../context/DataContext';
import Container from './layout/Container';
import SectionHeader from './layout/SectionHeader';

const IconMap: Record<string, React.FC<any>> = {
    Sun, Moon, Briefcase, HeartHandshake, Gift, FileText
};

const Services: React.FC = () => {
  const { services } = useData();
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);

  return (
    <section id="services" className="py-24 relative overflow-hidden" style={{ background: '#080808' }}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(197,160,89,0.05),transparent_60%)] pointer-events-none" />
      <Container>
        <div className="mb-16">
          <SectionHeader
            eyebrow="Services"
            title="濟世服務 & 線上點燈"
            description="將傳統信仰服務以更便利的方式呈現，同時保留儀式感與莊重氛圍。"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {services.map((service) => {
                const Icon = IconMap[service.iconName] || Gift;
                return (
                    <button 
                        key={service.id} 
                        onClick={() => setSelectedService(service)}
                        className="text-left group relative p-7 rounded-2xl bg-black/30 border border-white/10 hover:border-mystic-gold/40 hover:bg-white/[0.03] transition-all duration-300 overflow-hidden flex flex-col h-full"
                        style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}
                    >
                        {/* Hover Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-br from-mystic-gold/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                        <div className="relative z-10 flex-grow">
                            <div className="w-14 h-14 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center mb-6 group-hover:border-mystic-gold/50 group-hover:text-mystic-gold text-white/50 transition-all duration-300">
                                <Icon size={22} />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2 tracking-[0.12em]">{service.title}</h3>
                            <div className="text-mystic-gold font-serif mb-4 text-sm tracking-[0.08em]">
                                {service.type === 'DONATION' ? '隨喜功德' : `緣金 NT$ ${service.price}`}
                            </div>
                            <p className="text-white/55 text-sm leading-relaxed group-hover:text-white/80 transition-colors">
                                {service.description}
                            </p>
                        </div>
                        <div className="relative z-10 mt-6 pt-4 border-t border-white/10 w-full text-center text-xs text-white/40 group-hover:text-mystic-shine tracking-[0.35em] transition-colors">
                            立即辦理
                        </div>
                    </button>
                )
            })}
        </div>

        <ServiceModal 
            isOpen={!!selectedService} 
            onClose={() => setSelectedService(null)} 
            service={selectedService} 
        />
      </Container>
    </section>
  );
};

export default Services;