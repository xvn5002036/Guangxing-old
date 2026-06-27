import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Plus, Minus } from 'lucide-react';
import Container from './layout/Container';
import SectionHeader from './layout/SectionHeader';

const FAQ: React.FC = () => {
  const { faqs } = useData();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-24 bg-black">
      <Container className="max-w-3xl">
        <div className="mb-12">
          <SectionHeader
            eyebrow="FAQ"
            title="常見問題"
            description="整理最常被詢問的問題，協助你更快速完成報名與參拜安排。"
          />
        </div>

        <div className="space-y-4">
          {faqs.map((item, index) => (
            <div key={index} className="border border-white/10 rounded-2xl overflow-hidden bg-black/25 backdrop-blur">
              <button
                className="w-full flex items-center justify-between p-6 text-left hover:bg-white/5 transition-colors"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className="text-base sm:text-lg font-semibold text-white/90 tracking-[0.06em]">{item.question}</span>
                {openIndex === index ? <Minus className="text-mystic-gold" /> : <Plus className="text-gray-500" />}
              </button>
              <div className={`overflow-hidden transition-all duration-300 ${openIndex === index ? 'max-h-40 p-6 pt-0' : 'max-h-0'}`}>
                <p className="text-white/65 leading-relaxed border-t border-white/10 pt-4">
                  {item.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};

export default FAQ;