
import React, { useState, useEffect, useMemo } from 'react';
import { X, CreditCard, CheckCircle, AlertTriangle, Search, User, Phone, MapPin, Calendar, Trash2, Edit, RefreshCw, ChevronDown, Landmark, ChevronLeft } from 'lucide-react';
import { ServiceItem, Registration, TAIWAN_ADDRESS_DATA, COMMON_ROADS, LUNAR_HOURS, FieldConfig } from '../types';
import { useData } from '../context/DataContext';
import { supabase } from '../services/supabase';

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: ServiceItem | null;
  initialEventTitle?: string;
}

const ServiceModal: React.FC<ServiceModalProps> = ({ isOpen, onClose, service, initialEventTitle }) => {
  const { addRegistration, getRegistrationsByPhone, updateRegistration, deleteRegistration, userProfile, user, siteSettings } = useData();

  const [mode, setMode] = useState<'REGISTER' | 'LOOKUP'>('REGISTER');
  const [step, setStep] = useState(1);
  const [lookupPhone, setLookupPhone] = useState('');
  const [foundRegistrations, setFoundRegistrations] = useState<Registration[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Payment States
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'ATM' | null>(null);
  const [cardInfo, setCardInfo] = useState({ number: '', exp: '', cvc: '', holder: '' });
  const [atmLast5, setAtmLast5] = useState('');

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    gender: 'M',
    phone: '',
    birthYear: '民國70',
    birthMonth: '1',
    birthDay: '1',
    birthHour: '吉時 (不限)',
    city: '台北市',
    district: '中正區',
    road: '',
    isManualRoad: false,
    addressDetail: '',
    idNumber: '', // New field
    amount: service?.price || 600
  });

  // Determine current field config
  const currentConfig = useMemo(() => {
    // 1. Determine fallback base from siteSettings
    let baseConfig: FieldConfig = { showBirth: true, showTime: false, showAddress: true, showIdNumber: true, showGender: true }; // Absolute default

    if (initialEventTitle || service?.type === 'RITUAL' || (service as any)?.date) {
      baseConfig = siteSettings?.configEvent || baseConfig;
    } else if (service?.type === 'DONATION' || service?.title?.includes('隨喜') || service?.title?.includes('捐獻')) {
      baseConfig = siteSettings?.configDonation || baseConfig;
    } else if (service?.type === 'LIGHT' || service?.title?.includes('燈')) {
      baseConfig = siteSettings?.configLight || baseConfig;
    }

    // 2. Merge with per-item config if available
    // Ensure we handle cases where fieldConfig might be an empty object or missing fields
    if (service?.fieldConfig && Object.keys(service.fieldConfig).length > 0) {
      return { ...baseConfig, ...service.fieldConfig };
    }

    return baseConfig;
  }, [service, siteSettings, initialEventTitle]);

  // Dynamic lists based on selections
  const cityList = useMemo(() => Object.keys(TAIWAN_ADDRESS_DATA), []);
  const districtList = useMemo(() => TAIWAN_ADDRESS_DATA[formData.city] || [], [formData.city]);
  const roadList = useMemo(() => COMMON_ROADS[formData.district] || [], [formData.district]);

  useEffect(() => {
    if (service) {
      setFormData(prev => ({ ...prev, amount: service.price || 600 }));
    }
  }, [service]);

  // Auto-fill from User Profile
  useEffect(() => {
    if (isOpen && userProfile && mode === 'REGISTER' && !formData.id) {
      // Normalize Data Formats

      // Year: "1987" -> "民國76"
      let normalizedYear = userProfile.birthYear || formData.birthYear;
      if (userProfile.birthYear) {
        const y = parseInt(userProfile.birthYear);
        if (!isNaN(y) && y > 1911) {
          normalizedYear = `民國${y - 1911}`;
        }
      }

      // Month/Day: "05" -> "5"
      const normalizedMonth = userProfile.birthMonth ? String(parseInt(userProfile.birthMonth)) : formData.birthMonth;
      const normalizedDay = userProfile.birthDay ? String(parseInt(userProfile.birthDay)) : formData.birthDay;

      setFormData(prev => ({
        ...prev,
        name: userProfile.fullName || prev.name,
        gender: userProfile.gender || prev.gender, // Auto-fill gender
        phone: userProfile.phone || prev.phone,
        birthYear: normalizedYear,
        birthMonth: normalizedMonth,
        birthDay: normalizedDay,
        birthHour: userProfile.birthHour || prev.birthHour,
        city: userProfile.city || prev.city,
        district: userProfile.district || prev.district,
        addressDetail: userProfile.address || prev.addressDetail,
      }));
    }
  }, [isOpen, userProfile, mode, formData.id]);

  // Reset district when city changes
  const handleCityChange = (city: string) => {
    const districts = TAIWAN_ADDRESS_DATA[city] || [];
    setFormData(prev => ({
      ...prev,
      city,
      district: districts[0] || '',
      road: '',
      isManualRoad: (COMMON_ROADS[districts[0]] || []).length === 0
    }));
  };

  // Reset road when district changes
  const handleDistrictChange = (district: string) => {
    const roads = COMMON_ROADS[district] || [];
    setFormData(prev => ({
      ...prev,
      district,
      road: '',
      isManualRoad: roads.length === 0
    }));
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const payload = {
        name: formData.name,
        gender: formData.gender,
        phone: formData.phone,
        birthYear: formData.birthYear,
        birthMonth: formData.birthMonth,
        birthDay: formData.birthDay,
        birthHour: formData.birthHour,
        city: formData.city,
        district: formData.district,
        road: formData.road,
        addressDetail: formData.addressDetail,
        idNumber: formData.idNumber,
        amount: formData.amount,
        paymentMethod: 'ATM_TRANSFER',
        paymentDetails: `ATM 末五碼 ${atmLast5}`,
        bankLastFive: atmLast5,
        userId: user?.id, // Link to current user
      };

      if (formData.id) {
        // Update existing
        updateRegistration(formData.id, payload);
      } else {
        // Add new
        // CRITICAL FIX: If it's an event registration, force serviceId to 'EVENT'
        // This ensures DataContext.tsx maps it to null, avoiding Foreign Key violation on 'services' table
        const registrationServiceId = initialEventTitle ? 'EVENT' : (service?.id || 'EVENT');
        
        await addRegistration({
          serviceId: registrationServiceId,
          lightDurationDays: service?.type === 'LIGHT' ? (service.lightDurationDays || 30) : undefined,
          serviceTitle: initialEventTitle || service?.title || '未知服務',
          ...payload,
          status: 'PAID'
        });
      }
      setStep(3);
    } catch (err: any) {
      console.error("Payment/Registration failed:", err);
      alert(`報名失敗：${err.message || '未知錯誤'}\n請檢查網路連線或稍後再試。`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLookup = async () => {
    setIsProcessing(true);
    try {
      // Direct query to Supabase to ensure we get the latest data even if not subscribed
      const { data, error } = await supabase
        .from('registrations')
        .select('*')
        .eq('phone', lookupPhone)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to match Application Registration type if needed (e.g. snake_case to camelCase)
      // Since we are using "any" casting in DataContext, we might need manual mapping or ensure type compatibility
      // For now, assuming the returned data structure matches what the component expects or is compatible enough.
      // Actually, let's map it safely to be sure.
      const mappedResults: Registration[] = (data || []).map((r: any) => ({
        id: r.id,
        serviceId: r.service_id,
        serviceTitle: r.service_title,
        name: r.name,
        phone: r.phone,
        birthYear: r.birth_year,
        birthMonth: r.birth_month,
        birthDay: r.birth_day,
        birthHour: r.birth_hour,
        city: r.city,
        district: r.district,
        road: r.road,
        addressDetail: r.address_detail,
        amount: r.amount,
        status: r.status,
        isProcessed: r.is_processed,
        paymentMethod: r.payment_method,
        paymentDetails: r.payment_details,
        createdAt: r.created_at
      }));

      setFoundRegistrations(mappedResults);
      if (mappedResults.length === 0) alert('查無此電話之報名紀錄');
    } catch (e) {
      console.error("Lookup failed:", e);
      alert('查詢失敗，請稍後再試');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEdit = (reg: Registration) => {
    setFormData({
      id: reg.id,
      name: reg.name,
      gender: reg.gender || 'M',
      phone: reg.phone,
      birthYear: reg.birthYear,
      birthMonth: reg.birthMonth,
      birthDay: reg.birthDay,
      birthHour: reg.birthHour,
      city: reg.city,
      district: reg.district,
      road: reg.road,
      isManualRoad: true,
      addressDetail: reg.addressDetail,
      idNumber: reg.idNumber || '',
      amount: reg.amount
    });
    setMode('REGISTER');
    setStep(1);
    setPaymentMethod(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('確定要取消此報名紀錄嗎？')) {
      deleteRegistration(id);
      setFoundRegistrations(prev => prev.filter(r => r.id !== id));
    }
  };

  const reset = () => {
    setStep(1);
    setMode('REGISTER');
    setPaymentMethod(null);
    setCardInfo({ number: '', exp: '', cvc: '', holder: '' });
    setAtmLast5('');
    setFormData({
      id: '',
      name: '',
      gender: 'M',
      phone: '',
      birthYear: '民國70',
      birthMonth: '1',
      birthDay: '1',
      birthHour: '吉時 (不限)',
      city: '台北市',
      district: '中正區',
      road: '',
      isManualRoad: false,
      addressDetail: '',
      idNumber: '',
      amount: service?.price || 600
    });
    onClose();
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const title = initialEventTitle ? `報名：${initialEventTitle}` : service?.title || '線上服務';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={reset}></div>

      <div className="relative bg-mystic-charcoal border border-mystic-gold/30 w-full max-w-2xl shadow-2xl overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-black/50 p-6 flex justify-between items-center border-b border-white/5 shrink-0">
          <h3 className="text-xl font-bold text-white font-serif tracking-widest">
            {mode === 'REGISTER' ? (formData.id ? `修改：${title}` : title) : '查詢報名紀錄'}
          </h3>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMode(mode === 'REGISTER' ? 'LOOKUP' : 'REGISTER')}
              className="text-xs text-mystic-gold border border-mystic-gold/30 px-3 py-1 rounded hover:bg-mystic-gold hover:text-black transition-all flex items-center gap-1"
            >
              {mode === 'REGISTER' ? <Search size={12} /> : <User size={12} />}
              {mode === 'REGISTER' ? '查詢/修改紀錄' : '返回報名'}
            </button>
            <button onClick={reset} className="text-gray-400 hover:text-white"><X /></button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
          {mode === 'REGISTER' ? (
            <>
              {step === 1 && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* 姓名與電話 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-400 text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                        <User size={14} className="text-mystic-gold" /> 信眾姓名
                      </label>
                      <input required type="text" className="w-full bg-black/40 border border-white/10 p-3 text-white focus:border-mystic-gold outline-none rounded-sm"
                        value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="請輸入姓名" />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Phone size={14} className="text-mystic-gold" /> 聯絡電話
                      </label>
                      <input required type="tel" className="w-full bg-black/40 border border-white/10 p-3 text-white focus:border-mystic-gold outline-none rounded-sm"
                        value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="09XX-XXXXXX" />
                    </div>
                  </div>
                  
                  {/* Gender Selection */}
                  {currentConfig.showGender && (
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="block text-gray-400 text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                            <User size={14} className="text-mystic-gold" /> 性別
                          </label>
                          <div className="flex gap-4 items-center h-[46px]">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input 
                                type="radio" 
                                name="form_gender" 
                                value="M" 
                                checked={formData.gender === 'M'} 
                                onChange={e => setFormData({...formData, gender: e.target.value})}
                                className="accent-mystic-gold w-4 h-4"
                              />
                              <span className="text-white">男 (乾造)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input 
                                type="radio" 
                                name="form_gender" 
                                value="F" 
                                checked={formData.gender === 'F' || formData.gender === 'female'} 
                                onChange={e => setFormData({...formData, gender: e.target.value})}
                                className="accent-mystic-gold w-4 h-4"
                              />
                              <span className="text-white">女 (坤造)</span>
                            </label>
                          </div>
                      </div>
                    </div>
                  )}

                  {/* ID Number */}
                  {currentConfig.showIdNumber && (
                    <div>
                      <label className="block text-gray-400 text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                        <User size={14} className="text-mystic-gold" /> 身分證字號
                      </label>
                      <input required type="text" className="w-full bg-black/40 border border-white/10 p-3 text-white focus:border-mystic-gold outline-none rounded-sm"
                        value={formData.idNumber} onChange={e => setFormData({ ...formData, idNumber: e.target.value })} placeholder="請輸入身分證字號" />
                    </div>
                  )}


                  {/* 農曆生辰選單 */}
                  {currentConfig.showBirth && (
                    <div>
                      <label className="block text-gray-400 text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Calendar size={14} className="text-mystic-gold" /> 農曆生辰
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <select className="bg-black border border-white/10 p-2 text-white outline-none focus:border-mystic-gold cursor-pointer" value={formData.birthYear} onChange={e => setFormData({ ...formData, birthYear: e.target.value })}>
                          {Array.from({ length: 100 }, (_, i) => 114 - i).map(y => (
                            <option key={y} value={`民國${y}`}>民國{y}年</option>
                          ))}
                        </select>
                        <select className="bg-black border border-white/10 p-2 text-white outline-none focus:border-mystic-gold cursor-pointer" value={formData.birthMonth} onChange={e => setFormData({ ...formData, birthMonth: e.target.value })}>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                            <option key={m} value={m}>{m}月</option>
                          ))}
                        </select>
                        <select className="bg-black border border-white/10 p-2 text-white outline-none focus:border-mystic-gold cursor-pointer" value={formData.birthDay} onChange={e => setFormData({ ...formData, birthDay: e.target.value })}>
                          {Array.from({ length: 30 }, (_, i) => i + 1).map(d => (
                            <option key={d} value={d}>{d}日</option>
                          ))}
                        </select>
                        {currentConfig.showTime && (
                          <select className="bg-black border border-white/10 p-2 text-white outline-none focus:border-mystic-gold cursor-pointer" value={formData.birthHour} onChange={e => setFormData({ ...formData, birthHour: e.target.value })}>
                            {LUNAR_HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                          </select>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 通訊地址選單 - 三級聯動 */}
                  {currentConfig.showAddress && (
                    <div>
                      <label className="block text-gray-400 text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                        <MapPin size={14} className="text-mystic-gold" /> 通訊地址
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                        {/* 縣市 */}
                        <select
                          className="bg-black border border-white/10 p-2 text-white outline-none focus:border-mystic-gold cursor-pointer"
                          value={formData.city}
                          onChange={e => handleCityChange(e.target.value)}
                        >
                          {cityList.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>

                        {/* 鄉鎮市區 */}
                        <select
                          className="bg-black border border-white/10 p-2 text-white outline-none focus:border-mystic-gold cursor-pointer"
                          value={formData.district}
                          onChange={e => handleDistrictChange(e.target.value)}
                        >
                          {districtList.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>

                        {/* 路/街 選擇器 */}
                        {!formData.isManualRoad ? (
                          <div className="relative">
                            <select
                              className="w-full bg-black border border-white/10 p-2 text-white outline-none focus:border-mystic-gold cursor-pointer pr-8"
                              value={formData.road}
                              onChange={e => {
                                if (e.target.value === "__manual__") {
                                  setFormData({ ...formData, isManualRoad: true, road: '' });
                                } else {
                                  setFormData({ ...formData, road: e.target.value });
                                }
                              }}
                            >
                              <option value="" disabled>選擇路街</option>
                              {roadList.map(r => <option key={r} value={r}>{r}</option>)}
                              <option value="__manual__">+ 其他路街 (手寫)</option>
                            </select>
                          </div>
                        ) : (
                          <div className="flex gap-1">
                            <input
                              required
                              className="flex-1 bg-black border border-white/10 p-2 text-white outline-none focus:border-mystic-gold"
                              placeholder="請輸入路/街名"
                              value={formData.road}
                              onChange={e => setFormData({ ...formData, road: e.target.value })}
                            />
                            {roadList.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, isManualRoad: false })}
                                className="px-2 bg-gray-800 text-xs text-gray-400 hover:text-white"
                              >
                                返回列表
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      {/* 詳細門牌 */}
                      <input
                        required
                        className="w-full bg-black border border-white/10 p-2 text-white outline-none focus:border-mystic-gold"
                        placeholder="詳細門牌號碼、樓層 (例如：10號2樓)"
                        value={formData.addressDetail}
                        onChange={e => setFormData({ ...formData, addressDetail: e.target.value })}
                      />
                    </div>
                  )}

                  <div className="bg-black/20 p-4 border-l-4 border-mystic-gold flex justify-between items-center">
                    <span className="text-gray-400">合計緣金</span>
                    {service?.type === 'DONATION' || service?.title?.includes('隨喜') || service?.title?.includes('捐獻') ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-mystic-gold">NT$</span>
                        <input
                          type="number"
                          min="1"
                          required
                          className="w-32 bg-black border border-white/20 p-2 text-xl font-bold text-mystic-gold outline-none text-right focus:border-mystic-gold"
                          value={formData.amount}
                          onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    ) : (
                      <span className="text-2xl font-bold text-mystic-gold">NT$ {formData.amount}</span>
                    )}
                  </div>

                  <button type="submit" className="w-full py-4 bg-mystic-gold text-black font-bold tracking-widest hover:bg-white transition-colors shadow-lg">
                    {formData.id ? '確認修改內容' : '下一步：選擇支付方式'}
                  </button>
                </form>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  {/* Payment Method Selection */}
                  <div className="text-center mb-6">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <button onClick={() => { setStep(1); setPaymentMethod(null); }} className="text-gray-500 hover:text-white flex items-center gap-1 text-sm absolute left-6">
                        <ChevronLeft size={16} /> 返回
                      </button>
                      <span className="text-gray-300">應付金額</span>
                    </div>
                    <div className="text-4xl font-bold text-mystic-gold font-serif">NT$ {formData.amount}</div>
                  </div>

                  {!paymentMethod ? (
                    <div className="flex justify-center">
                      <button
                        onClick={() => setPaymentMethod('ATM')}
                        className="w-full max-w-sm p-6 bg-black/40 border border-white/10 hover:border-mystic-gold hover:bg-mystic-gold/10 transition-all group flex flex-col items-center gap-3"
                      >
                        <Landmark size={32} className="text-gray-400 group-hover:text-mystic-gold" />
                        <span className="font-bold text-white group-hover:text-mystic-gold">ATM 轉帳護持</span>
                        <span className="text-xs text-gray-500">實體/網路銀行轉帳</span>
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleProcessPayment} className="animate-fade-in">
                      {paymentMethod === 'CARD' ? (
                        <div className="space-y-4 bg-black/40 p-6 border border-white/10 rounded-sm">
                          <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                            <h4 className="text-white font-bold flex items-center gap-2"><CreditCard size={18} /> 信用卡資訊</h4>
                            <div className="flex gap-2">
                              <div className="w-8 h-5 bg-gray-700 rounded"></div>
                              <div className="w-8 h-5 bg-gray-700 rounded"></div>
                            </div>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 block mb-1">卡號</label>
                            <input required type="text" placeholder="0000 0000 0000 0000" maxLength={19}
                              className="w-full bg-black border border-white/10 p-3 text-white focus:border-mystic-gold outline-none tracking-widest"
                              value={cardInfo.number} onChange={e => setCardInfo({ ...cardInfo, number: formatCardNumber(e.target.value) })}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs text-gray-500 block mb-1">有效期限 (MM/YY)</label>
                              <input required type="text" placeholder="MM/YY" maxLength={5}
                                className="w-full bg-black border border-white/10 p-3 text-white focus:border-mystic-gold outline-none text-center"
                                value={cardInfo.exp} onChange={e => setCardInfo({ ...cardInfo, exp: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 block mb-1">安全碼 (CVC)</label>
                              <input required type="password" placeholder="123" maxLength={3}
                                className="w-full bg-black border border-white/10 p-3 text-white focus:border-mystic-gold outline-none text-center"
                                value={cardInfo.cvc} onChange={e => setCardInfo({ ...cardInfo, cvc: e.target.value })}
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 block mb-1">持卡人姓名</label>
                            <input required type="text" placeholder="NAME ON CARD"
                              className="w-full bg-black border border-white/10 p-3 text-white focus:border-mystic-gold outline-none uppercase"
                              value={cardInfo.holder} onChange={e => setCardInfo({ ...cardInfo, holder: e.target.value })}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-6 bg-black/40 p-6 border border-white/10 rounded-sm">
                          <h4 className="text-white font-bold flex items-center gap-2 border-b border-white/5 pb-2"><Landmark size={18} /> 匯款資訊</h4>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-400">銀行代號</span>
                              <span className="text-white font-mono">808 (玉山銀行)</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-400">匯款帳號</span>
                              <span className="text-mystic-gold font-mono font-bold text-lg">1234-5678-90123</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-400">戶名</span>
                              <span className="text-white">新莊武壇廣行宮</span>
                            </div>
                          </div>
                          <div className="border-t border-white/10 pt-4">
                            <label className="text-xs text-gray-500 block mb-2">請輸入您轉帳帳號的後五碼</label>
                            <input required type="text" placeholder="例如：54321" maxLength={5}
                              className="w-full bg-black border border-white/10 p-3 text-white focus:border-mystic-gold outline-none text-center tracking-widest text-lg font-bold"
                              value={atmLast5} onChange={e => setAtmLast5(e.target.value.replace(/[^0-9]/g, ''))}
                            />
                          </div>
                        </div>
                      )}

                      <div className="mt-6 flex flex-col gap-3">
                        <button
                          type="submit"
                          disabled={isProcessing}
                          className="w-full py-4 bg-mystic-gold text-black font-bold tracking-widest hover:bg-white transition-colors shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isProcessing ? <RefreshCw className="animate-spin" size={20} /> : (paymentMethod === 'CARD' ? '確認支付' : '已完成轉帳，送出資料')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod(null)}
                          disabled={isProcessing}
                          className="w-full py-3 text-gray-400 hover:text-white transition-colors text-sm"
                        >
                          更換支付方式
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="text-center py-12 animate-fade-in-up">
                  <div className="w-20 h-20 bg-green-900/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={40} />
                  </div>
                  <h4 className="text-2xl font-bold text-white mb-2">{formData.id ? '修改成功' : '功德圓滿'}</h4>
                  <p className="text-gray-400 mb-8 max-w-xs mx-auto leading-relaxed">
                    感謝您的護持！<br />
                    {paymentMethod === 'ATM' ? '對帳完成後，系統將自動寄發確認簡訊。' : '刷卡成功，疏文已紀錄於系統。'}
                    <br />祝您闔家平安。
                  </p>
                  <button onClick={reset} className="px-8 py-3 bg-mystic-gold text-black font-bold tracking-widest hover:bg-white transition-colors">
                    關閉視窗
                  </button>
                </div>
              )}
            </>
          ) : (
            /* LOOKUP MODE */
            <div className="space-y-6 min-h-[400px]">
              <div className="flex gap-2">
                <input
                  type="tel"
                  className="flex-1 bg-black/40 border border-white/10 p-3 text-white focus:border-mystic-gold outline-none"
                  placeholder="輸入手機號碼查詢紀錄"
                  value={lookupPhone}
                  onChange={e => setLookupPhone(e.target.value)}
                />
                <button onClick={handleLookup} className="bg-mystic-gold text-black px-6 py-3 font-bold">查詢</button>
              </div>

              <div className="space-y-4">
                {foundRegistrations.length > 0 ? (
                  foundRegistrations.map(reg => (
                    <div key={reg.id} className="bg-black/30 border border-white/5 p-4 rounded flex justify-between items-center group">
                      <div>
                        <div className="text-mystic-gold font-bold mb-1">{reg.serviceTitle}</div>
                        <div className="text-sm text-gray-400">
                          信眾：{reg.name} | 金額：${reg.amount}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">報名時間：{new Date(reg.createdAt).toLocaleString()}</div>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(reg)} className="p-2 bg-blue-900/20 text-blue-400 hover:bg-blue-900/40 rounded"><Edit size={16} /></button>
                        <button onClick={() => handleDelete(reg.id)} className="p-2 bg-red-900/20 text-red-400 hover:bg-red-900/40 rounded"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-600 py-12">
                    <Search size={48} className="mx-auto mb-4 opacity-10" />
                    <p>請輸入電話號碼以檢視歷史報名資料</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div >
  );
};

export default ServiceModal;
