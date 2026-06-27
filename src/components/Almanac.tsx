import React, { useEffect, useState } from 'react';
import { CheckCircle2, Compass, Sparkles, XCircle } from 'lucide-react';
import { Solar } from 'lunar-javascript';
import { toTC, toTCArray } from '../utils/chineseConversion';

interface AlmanacProps {
  onOpenAdmin?: () => void;
}

const Almanac: React.FC<AlmanacProps> = ({ onOpenAdmin }) => {
  const today = new Date();
  const solar = Solar.fromDate(today);
  const lunar = solar.getLunar();
  const [windada, setWindada] = useState<any>(null);
  
  const dateStr = today.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' });
  const lunarDate = toTC(`農曆 ${lunar.getMonthInChinese()}月 ${lunar.getDayInChinese()}`);
  const suiCi = toTC(`歲次 ${lunar.getYearInGanZhi()}年 ${lunar.getMonthInGanZhi()}月 ${lunar.getDayInGanZhi()}日`);

  useEffect(() => {
    const params = new URLSearchParams({
      year: String(today.getFullYear()),
      month: String(today.getMonth() + 1),
      day: String(today.getDate()),
    });
    fetch(`/api/almanac?${params.toString()}`)
      .then((response) => response.ok ? response.json() : Promise.reject(response))
      .then(setWindada)
      .catch(() => setWindada(null));
  }, []);

  const goodActivities = windada?.yi?.length ? windada.yi : toTCArray(lunar.getDayYi(2));
  const badActivities = windada?.ji?.length ? windada.ji : toTCArray(lunar.getDayJi(2));

  const daySha = toTC(lunar.getDaySha());
  const dayChong = windada?.chongSha ? windada.chongSha : toTC(`沖 ${lunar.getDayChongDesc()}，煞${lunar.getDaySha()}`);
  const luckyHours = windada?.luckyHours || toTC(lunar.getTimes()
    .filter(t => t.getTianShenLuck() === '吉')
    .map(t => t.getZhi() + '時')
    .join(' '));
  const auspiciousGods = windada?.auspiciousGods?.length ? windada.auspiciousGods : toTCArray(lunar.getDayJiShen());
  const inauspiciousGods = windada?.inauspiciousGods?.length ? windada.inauspiciousGods : toTCArray(lunar.getDayXiongSha());
  const pengZu = windada?.pengZu || toTC(`${lunar.getPengZuGan()}；${lunar.getPengZuZhi()}`);
  const positions = [
    { label: '喜神', value: windada?.xi || toTC(lunar.getDayPositionXiDesc()) },
    { label: '福神', value: windada?.fu || toTC(lunar.getDayPositionFuDesc()) },
    { label: '財神', value: windada?.cai || toTC(lunar.getDayPositionCaiDesc()) },
  ];
  const detailItems = [
    { label: '胎神', value: windada?.taiShen || toTC(lunar.getDayPositionTai()) },
    { label: '九宮', value: windada?.ninePalace || '無' },
    { label: '星宿', value: windada?.twentyEightMansion || toTC(`${lunar.getXiu()}宿・${lunar.getXiuLuck()}`) },
    { label: '十二建星', value: windada?.twelveOfficer || toTC(`${lunar.getDayTianShen()}・${lunar.getDayTianShenLuck()}`) },
    { label: '歲煞', value: windada?.suiSha || daySha },
    { label: '金符', value: windada?.jinFu || '無' },
    { label: '週堂', value: windada?.zhouTang || '無' },
    { label: '彭祖百忌', value: pengZu },
  ];

  const renderTerms = (items: string[]) => (
    <div className="flex flex-wrap gap-x-3 gap-y-2">
      {items.length ? items.map(act => (
        <span key={act} className="text-sm leading-6 text-gray-300">{act}</span>
      )) : <span className="text-sm text-gray-500">無</span>}
    </div>
  );

  return (
    <section id="almanac" className="relative z-20 mx-auto w-full max-w-7xl scroll-mt-28 px-4 sm:px-6 pt-28 pb-10">
      <div className="bg-mystic-charcoal/95 border-t-4 border-mystic-gold shadow-2xl rounded-sm p-5 md:p-7">
        <div className="mb-5 flex flex-col gap-2 border-b border-white/10 pb-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.28em] text-mystic-gold">
              <Sparkles className="h-4 w-4" />
              今日農民曆
            </div>
            <p className="mt-2 text-xs text-gray-500">資料依每日西曆日期即時計算，年份更新後會自動帶入新年度。</p>
          </div>
          <div className="text-xs text-gray-500">以 {today.getFullYear()} 年農民曆演算</div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_1.45fr]">

        {/* Date Display */}
        <div className="flex flex-col gap-5 border-b border-white/10 pb-6 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6">
          <div className="flex items-center gap-5">
          <div className="text-center bg-white/5 p-4 rounded-lg border border-white/10">
            <span className="block text-4xl font-bold text-mystic-gold font-serif">{today.getDate()}</span>
            <span className="block text-xs text-gray-400 uppercase tracking-widest">{today.getMonth() + 1}月</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-white leading-tight">{dateStr}</h3>
              <p className="text-mystic-gold font-medium">{windada?.lunarDate ? `農曆 ${windada.lunarDate}` : lunarDate}</p>
              <p className="text-gray-500 text-xs">{windada?.ganZhi || suiCi}</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded border border-orange-500/20 bg-orange-950/20 p-3">
              <div className="mb-1 flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] text-orange-300">
                <Compass className="h-3.5 w-3.5" />
                每日沖煞
              </div>
              <div className="text-sm text-gray-200">{dayChong}</div>
            </div>
            <div className="rounded border border-green-500/20 bg-green-950/20 p-3">
              <div className="mb-1 text-[11px] font-bold tracking-[0.2em] text-green-300">每日吉時</div>
              <div className="text-sm leading-6 text-gray-200">{luckyHours || '無'}</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {positions.map(item => (
              <div key={item.label} className="rounded border border-white/10 bg-white/[0.03] px-3 py-2 text-center">
                <div className="text-[10px] tracking-[0.22em] text-gray-500">{item.label}</div>
                <div className="mt-1 text-sm font-semibold text-mystic-gold">{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Yi / Ji */}
        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
          <div className="bg-green-900/10 border border-green-900/30 rounded p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-green-800 text-green-100 text-xs px-2 py-1 rounded font-bold">宜</div>
              <CheckCircle2 className="w-4 h-4 text-green-700" />
            </div>
            {renderTerms(goodActivities)}
          </div>
          <div className="bg-red-900/10 border border-red-900/30 rounded p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-red-900 text-red-100 text-xs px-2 py-1 rounded font-bold">忌</div>
              <XCircle className="w-4 h-4 text-red-800" />
            </div>
            {renderTerms(badActivities)}
          </div>
        </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded border border-mystic-gold/20 bg-black/20 p-4">
              <div className="mb-2 text-xs font-bold tracking-[0.25em] text-mystic-gold">吉神宜趨</div>
              {renderTerms(auspiciousGods)}
            </div>
            <div className="rounded border border-red-900/30 bg-black/20 p-4">
              <div className="mb-2 text-xs font-bold tracking-[0.25em] text-red-300">凶煞宜忌</div>
              {renderTerms(inauspiciousGods)}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {detailItems.map(item => (
              <div key={item.label} className="rounded border border-white/10 bg-white/[0.03] p-3">
                <div className="mb-1 text-[10px] font-bold tracking-[0.22em] text-gray-500">{item.label}</div>
                <div className="text-sm leading-6 text-gray-200">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
        </div>
      </div>
    </section>
  );
};

export default Almanac;
