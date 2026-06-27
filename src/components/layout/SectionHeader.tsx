import React from 'react';

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  className?: string;
};

const SectionHeader: React.FC<SectionHeaderProps> = ({
  eyebrow,
  title,
  description,
  align = 'center',
  className = '',
}) => {
  const alignClass = align === 'left' ? 'text-left items-start' : 'text-center items-center';

  return (
    <div className={`flex flex-col ${alignClass} ${className}`.trim()}>
      {eyebrow ? (
        <div className="inline-flex items-center gap-3">
          <span className="h-px w-8 bg-gradient-to-r from-transparent to-mystic-gold/60" />
          <span className="text-[10px] tracking-[0.45em] text-mystic-gold font-semibold uppercase">
            {eyebrow}
          </span>
          <span className="h-px w-8 bg-gradient-to-l from-transparent to-mystic-gold/60" />
        </div>
      ) : null}

      <h2 className="mt-5 text-[clamp(1.85rem,4.5vw,2.75rem)] font-semibold tracking-[0.14em] leading-tight text-gold-gradient">
        {title}
      </h2>

      {description ? (
        <p className="mt-4 max-w-2xl text-white/65 leading-relaxed text-[0.95rem]">
          {description}
        </p>
      ) : null}

      {/* Decorative divider */}
      <div className={`mt-7 flex items-center gap-2 ${align === 'center' ? 'self-center' : 'self-start'}`}>
        <div className="h-px w-12 bg-gradient-to-r from-transparent via-mystic-gold/50 to-mystic-gold/20" />
        <div className="w-1.5 h-1.5 rounded-full bg-mystic-gold/70 ring-2 ring-mystic-gold/20" />
        <div className="h-px w-12 bg-gradient-to-l from-transparent via-mystic-gold/50 to-mystic-gold/20" />
      </div>
    </div>
  );
};

export default SectionHeader;

