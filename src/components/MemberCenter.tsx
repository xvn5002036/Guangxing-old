import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { User, Package, Calendar, MapPin, LogOut, ChevronRight, Printer, BookOpen, Sparkles, User as UserIcon } from 'lucide-react';
import AuthModal from './AuthModal';
import ServiceModal from './ServiceModal';
import { MemberLibrary } from './MemberLibrary';
import BaziChartPanel from './BaziChartPanel';
import { ServiceItem } from '../types';
import { Solar, Lunar, EightChar } from 'lunar-javascript';
import { getShenShaForPillar } from '../utils/shenSha';
import { getChengGuWeight } from '../utils/chengGu';
import { calculateMingGe } from '../utils/baziPatterns';
import { SHEN_SHA_DESCRIPTIONS } from '../utils/shenShaDescriptions';
import { DI_SHI_DESCRIPTIONS, SHI_SHEN_DESCRIPTIONS, GENERAL_BAZI_DESCRIPTIONS } from '../utils/baziDescriptions';
import { toTC, toTCArray } from '../utils/chineseConversion';

interface MemberCenterProps {
    onBack: () => void;
    onNavigateToShop?: () => void;
}

const MemberCenter: React.FC<MemberCenterProps> = ({ onBack, onNavigateToShop }) => {
    const { user, userProfile, signOut, registrations, services } = useData();
    const [activeTab, setActiveTab] = useState<'PROFILE' | 'ORDERS' | 'SCRIPTURES' | 'FORTUNE' | 'BAZI'>('PROFILE');
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
    const [activeTooltip, setActiveTooltip] = useState<{ title: string; desc: string } | null>(null);

    const handleToggleTooltip = (title: string, desc: string, e: React.MouseEvent | React.TouchEvent) => {
        e.stopPropagation();
        if (activeTooltip?.title === title) {
            setActiveTooltip(null);
        } else {
            setActiveTooltip({ title, desc });
        }
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            // Dismiss tooltip if clicking outside of the tooltip trigger or content
            const target = e.target as HTMLElement;
            const isTrigger = target.closest('.tooltip-trigger');
            const isContent = target.closest('.tooltip-content');
            
            if (activeTooltip && !isTrigger && !isContent) {
                setActiveTooltip(null);
            }
        };
        
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, [activeTooltip]);

    // --- Zodiac & Tai Sui Logic ---
    const getZodiac = (year: number) => {
        const zodiacs = ['猴', '雞', '狗', '豬', '鼠', '牛', '虎', '兔', '龍', '蛇', '馬', '羊'];
        return zodiacs[year % 12];
    };

    const getTaiSuiStatus = (birthYear: number, targetYear: number) => {
        const zodiacIndex = birthYear % 12;
        const targetIndex = targetYear % 12; // 2026 = 10 (Horse)
        
        if (targetIndex === 10) {
            if (zodiacIndex === 10) return { status: '值太歲 / 刑太歲', description: '本命年且自刑，運勢起伏大，宜靜不宜動，注意情緒與健康。', severity: 'high' };
            if (zodiacIndex === 4) return { status: '沖太歲', description: '沖者動也，正沖流年，易有變動、奔波勞碌，慎防大耗。', severity: 'high' };
            if (zodiacIndex === 5) return { status: '害太歲', description: '害者陷害，易犯小人、被陷害或有溝通誤解。', severity: 'medium' };
            if (zodiacIndex === 7) return { status: '破太歲', description: '馬兔相破，易有突如其來的破壞、人際失和或小病痛。', severity: 'low' };
            if (zodiacIndex === 1) return { status: '破太歲', description: '運勢小破，需注意與人合作細節，避免財物損失。', severity: 'low' };
        }
        return null;
    };
    
    const currentYear = new Date().getFullYear();
    const birthYear = userProfile?.birthYear ? parseInt(userProfile.birthYear) : null;
    const myZodiac = birthYear ? getZodiac(birthYear) : '未知';
    const taiSuiInfo = birthYear ? getTaiSuiStatus(birthYear, currentYear) : null;

    const myOrders = registrations.filter(r =>
        (userProfile?.phone && r.phone === userProfile.phone) ||
        (r as any).userId === user?.id
    );
    const enabledServices = services.filter((service: ServiceItem) => service.fieldConfig?.memberFortuneRole || service.fieldConfig?.memberTaiSuiRecommended);
    const findMemberService = (role: string) => enabledServices.find((service: ServiceItem) => service.fieldConfig?.memberFortuneRole === role);
    const taiSuiService = services.find((service: ServiceItem) => service.fieldConfig?.memberTaiSuiRecommended) || findMemberService('taisui');
    const fortuneServices = [
        { label: '\u5b89\u592a\u6b72\u71c8', hint: '\u9069\u5408\u72af\u592a\u6b72\u8005', service: findMemberService('taisui') },
        { label: '\u5149\u660e\u71c8 / \u5e73\u5b89\u71c8', hint: '\u7167\u4eae\u524d\u7a0b', service: findMemberService('light') },
        { label: '\u5236\u89e3 / \u796d\u6539', hint: '\u6d88\u707d\u89e3\u5384', service: findMemberService('ritual') },
    ];

    const openServiceOrWarn = (service?: ServiceItem) => {
        if (!service) {
            alert('\u5f8c\u53f0\u5c1a\u672a\u6307\u5b9a\u6b64\u670d\u52d9\uff0c\u8acb\u5148\u5230\u5f8c\u53f0\u300c\u670d\u52d9\u9805\u76ee\u300d\u8a2d\u5b9a\u3002');
            return;
        }
        setSelectedService(service);
        setIsServiceModalOpen(true);
    };

    const handlePrintReceipt = (order: any) => {
        const printWindow = window.open('', '_blank', 'width=500,height=700');
        if (!printWindow) return;

        const today = new Date();
        const dateStr = `${today.getFullYear()}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getDate().toString().padStart(2, '0')}`;
        const timeStr = `${today.getHours().toString().padStart(2, '0')}:${today.getMinutes().toString().padStart(2, '0')}:${today.getSeconds().toString().padStart(2, '0')}`;

        const fullHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>收據預覽 - ${order.name}</title>
            <style>
                @page { size: auto; margin: 0mm; }
                body { font-family: 'Courier New', Courier, monospace; background-color: #555; margin: 0; padding: 20px; display: flex; flex-direction: column; align-items: center; min-height: 100vh; }
                .preview-container { background-color: white; width: 80mm; padding: 5mm; box-shadow: 0 10px 30px rgba(0,0,0,0.5); margin-bottom: 20px; position: relative; }
                .header { text-align: center; margin-bottom: 15px; }
                .title { font-size: 20px; font-weight: bold; letter-spacing: 2px; border-bottom: 2px solid #000; padding-bottom: 5px; display: inline-block; }
                .subtitle { font-size: 14px; margin-top: 5px; font-weight: bold; }
                .divider { border-top: 1px dashed #000; margin: 10px 0; }
                .info-row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 12px; }
                .table-header { display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; margin-bottom: 8px; border-bottom: 1px solid #000; padding-bottom: 2px; }
                .item-row { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 5px; font-weight: bold; }
                .total-section { text-align: right; margin-top: 15px; font-size: 20px; font-weight: bold; border-top: 2px solid #000; padding-top: 5px; }
                .footer { text-align: center; font-size: 11px; margin-top: 20px; color: #333; line-height: 1.4; }
                .note { border: 1px solid #000; padding: 5px; margin-bottom: 10px; font-size: 10px; }
                .actions-bar { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.8); padding: 10px 20px; border-radius: 50px; display: flex; gap: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.3); }
                .btn { padding: 8px 16px; border: none; border-radius: 20px; cursor: pointer; font-weight: bold; font-size: 14px; transition: transform 0.1s; }
                .btn:active { transform: scale(0.95); }
                .btn-print { background-color: #C5A059; color: black; }
                .btn-close { background-color: #444; color: white; }
                @media print { body { background-color: white; padding: 0; margin: 0; display: block; } .preview-container { width: 100%; max-width: none; box-shadow: none; margin: 0; padding: 0; } .no-print { display: none !important; } }
            </style>
        </head>
        <body>
            <div class="preview-container">
                <div class="header"><div class="title">新莊武壇廣行宮</div><div class="subtitle">各項服務收款收據</div></div>
                <div class="info-row"><span>單號：${order.id.substring(order.id.length - 6)}</span><span>機台：WEB-MBR</span></div>
                <div class="info-row"><span>日期：${dateStr}</span><span>時間：${timeStr}</span></div>
                <div class="info-row"><span>信眾：${order.name}</span><span>電話：${order.phone}</span></div>
                <div class="divider"></div>
                <div class="table-header"><span>項目名稱</span><span>金額</span></div>
                <div class="item-row"><span>${order.serviceTitle}</span><span>NT$ ${order.amount}</span></div>
                <div class="divider"></div>
                <div class="total-section">總計 NT$ ${order.amount}</div>
                <div class="info-row" style="margin-top: 10px;"><span>支付方式：</span><span>現金/轉帳</span></div>
                <div class="footer"><div class="note">此為宮廟內部收據<br/>僅供證明，不得作為兌獎或報稅憑證</div><p>感謝您的護持，功德無量。</p><p>經手人：(線上列印)</p></div>
            </div>
            <div class="actions-bar no-print"><button class="btn btn-print" onclick="window.print()">🖨️ 確認列印</button><button class="btn btn-close" onclick="window.close()">關閉視窗</button></div>
        </body>
        </html>
        `;

        printWindow.document.write(fullHtml);
        printWindow.document.close();
    };

    if (!user) {
        return (
            <div className="min-h-screen pt-32 pb-12 px-4 container mx-auto text-center">
                <h2 className="text-2xl font-bold text-white mb-4">請先登入</h2>
                <button onClick={onBack} className="text-mystic-gold hover:underline">返回首頁</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-12 bg-mystic-dark relative">
            <div className="container mx-auto px-4 md:px-6">

                {/* Header / Breadcrumb */}
                <div className="mb-8 flex items-center gap-2 text-sm text-gray-400">
                    <button onClick={onBack} className="hover:text-white transition-colors">首頁</button>
                    <ChevronRight size={14} />
                    <span className="text-mystic-gold">會員中心</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                    {/* Sidebar Navigation */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="bg-zinc-900 border border-white/5 rounded-lg p-6 text-center">
                            <div className="w-20 h-20 bg-mystic-gold/20 rounded-full flex items-center justify-center text-mystic-gold text-3xl font-bold mx-auto mb-4">
                                {userProfile?.fullName?.[0] || <UserIcon />}
                            </div>
                            <h2 className="text-xl font-bold text-white mb-1">{userProfile?.fullName || '會員'}</h2>
                            <p className="text-xs text-gray-500 mb-4">{user.email}</p>

                            <button
                                onClick={signOut}
                                className="w-full border border-red-900/50 text-red-400 hover:bg-red-900/20 py-2 rounded flex items-center justify-center gap-2 text-sm transition-colors"
                            >
                                <LogOut size={16} /> 登出帳號
                            </button>
                        </div>

                        <div className="bg-zinc-900 border border-white/5 rounded-lg overflow-hidden">
                            {(['PROFILE', 'ORDERS', 'SCRIPTURES', 'FORTUNE', 'BAZI'] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`w-full text-left p-4 flex items-center gap-3 transition-colors ${activeTab === tab ? 'bg-mystic-gold/10 text-mystic-gold border-l-2 border-mystic-gold' : 'text-gray-400 hover:bg-white/5'}`}
                                >
                                    {tab === 'PROFILE' && <UserIcon size={18} />}
                                    {tab === 'ORDERS' && <Package size={18} />}
                                    {tab === 'SCRIPTURES' && <BookOpen size={18} />}
                                    {tab === 'FORTUNE' && <Sparkles size={18} />}
                                    {tab === 'BAZI' && <BookOpen size={18} />}
                                    {tab === 'PROFILE' ? '個人資料' : tab === 'ORDERS' ? '祈福紀錄' : tab === 'SCRIPTURES' ? '我的經文庫' : tab === 'FORTUNE' ? '線上安太歲' : '我的八字命盤'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:col-span-3">
                        {activeTab === 'PROFILE' && (
                            <div className="bg-zinc-900 border border-white/5 rounded-lg p-6 md:p-8 animate-fade-in-up">
                                <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                        <UserIcon className="text-mystic-gold" size={20} />
                                        基本資料
                                    </h3>
                                    <button
                                        onClick={() => setIsEditProfileOpen(true)}
                                        className="text-xs border border-mystic-gold text-mystic-gold px-3 py-1.5 rounded hover:bg-mystic-gold hover:text-black transition-colors"
                                    >
                                        編輯資料
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-500">姓名</label>
                                        <div className="text-lg text-gray-200">{userProfile?.fullName || '-'}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-500">性別</label>
                                        <div className="text-lg text-gray-200 flex items-center gap-2">
                                            {userProfile?.gender === 'F' ? <><span className="text-pink-400">●</span> 女</> : <><span className="text-blue-400">●</span> 男</>}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-500">聯絡電話</label>
                                        <div className="text-lg text-gray-200">{userProfile?.phone || '-'}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-500">農曆生日</label>
                                        <div className="text-lg text-gray-200 flex items-center gap-2">
                                            <Calendar size={14} className="text-gray-600" />
                                            {userProfile?.birthYear ? `${userProfile.birthYear}年 ${userProfile.birthMonth}月 ${userProfile.birthDay}日 ${userProfile.birthHour}時` : '-'}
                                        </div>
                                    </div>
                                    <div className="space-y-1 md:col-span-2">
                                        <label className="text-xs text-gray-500">居住地址</label>
                                        <div className="text-lg text-gray-200 flex items-center gap-2">
                                            <MapPin size={14} className="text-gray-600" />
                                            {userProfile?.city ? `${userProfile.city}${userProfile.district}${userProfile.address}` : '-'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'ORDERS' && (
                            <div className="bg-zinc-900 border border-white/5 rounded-lg p-6 md:p-8 animate-fade-in-up">
                                <h3 className="text-xl font-bold text-white mb-6 pb-4 border-b border-white/10 flex items-center gap-2">
                                    <Package className="text-mystic-gold" size={20} />
                                    歷史祈福紀錄
                                </h3>
                                {myOrders.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500">
                                        <Package size={48} className="mx-auto mb-4 opacity-20" />
                                        <p>目前尚無祈福紀錄</p>
                                        <button onClick={onBack} className="mt-4 text-mystic-gold hover:underline text-sm">前往報名服務</button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {myOrders.map((order) => (
                                            <div key={order.id} className="bg-black/30 border border-white/5 rounded-lg p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-white/10 transition-colors">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-mystic-gold font-bold text-lg">{order.serviceTitle}</span>
                                                        <span className={`text-[10px] px-2 py-0.5 rounded border ${order.status === 'PAID' ? (order.isProcessed ? 'border-green-500/30 text-green-400 bg-green-500/10' : 'border-blue-500/30 text-blue-400 bg-blue-500/10') : 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10'}`}>
                                                            {order.status === 'PAID' ? (order.isProcessed ? '已圓滿' : '已付款/辦理中') : order.status === 'PENDING' ? '待付款/處理中' : '已取消'}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm text-gray-400">祈福對象：{order.name}</div>
                                                    <div className="text-xs text-gray-600 mt-1">{new Date(order.createdAt).toLocaleDateString()}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xl font-serif text-white mb-2">NT$ {order.amount}</div>
                                                    {order.isProcessed && (
                                                        <button onClick={() => handlePrintReceipt(order)} className="text-xs flex items-center gap-1 bg-mystic-gold/20 text-mystic-gold px-3 py-1.5 rounded hover:bg-mystic-gold hover:text-black transition-colors ml-auto"><Printer size={14} /> 列印收據</button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'SCRIPTURES' && user && (
                            <div className="animate-fade-in-up">
                                <MemberLibrary userId={user.id} onNavigateToShop={onNavigateToShop} />
                            </div>
                        )}

                        {activeTab === 'FORTUNE' && (
                            <div className="bg-zinc-900 border border-white/5 rounded-lg p-6 md:p-8 animate-fade-in-up">
                                <h3 className="text-xl font-bold text-white mb-6 pb-4 border-b border-white/10 flex items-center gap-2">
                                    <Sparkles className="text-mystic-gold" size={20} />
                                    我的流年運勢 ({currentYear}年)
                                </h3>
                                {!birthYear ? (
                                    <div className="text-center py-10">
                                        <div className="text-gray-400 mb-4">請先完善個人生日資料，以獲取準確運勢分析。</div>
                                        <button onClick={() => setIsEditProfileOpen(true)} className="bg-mystic-gold text-black px-6 py-2 rounded font-bold hover:bg-yellow-500 transition-colors">填寫生日資料</button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-6">
                                            <div className="bg-black/40 border border-white/10 rounded-xl p-6 relative overflow-hidden group hover:border-mystic-gold/30 transition-colors">
                                                <div className="absolute top-0 right-0 p-4 opacity-10 font-serif text-8xl font-bold text-white select-none">{myZodiac}</div>
                                                <div className="relative z-10">
                                                    <div className="text-gray-400 text-sm mb-1">您的生肖</div>
                                                    <div className="text-4xl font-bold text-white mb-4 flex items-center gap-3">{myZodiac}<span className="text-sm bg-white/10 px-2 py-1 rounded text-gray-300 font-normal">{birthYear}年生</span></div>
                                                    <div className="w-full h-px bg-white/10 my-4"></div>
                                                    <div className="text-gray-400 text-sm mb-1">流年運勢狀態</div>
                                                    {taiSuiInfo ? (
                                                        <div>
                                                            <div className={`text-3xl font-bold mb-2 ${taiSuiInfo.severity === 'high' ? 'text-red-500' : 'text-yellow-500'}`}>{taiSuiInfo.status}</div>
                                                            <p className="text-gray-300">{taiSuiInfo.description}</p>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <div className="text-3xl font-bold text-green-400 mb-2">運勢平穩</div>
                                                            <p className="text-gray-300">今年無沖犯太歲，運勢相對平穩，可多行善積德，增長福氣。</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {taiSuiInfo && (
                                                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 flex items-center justify-between gap-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-red-500/20 p-2 rounded-full text-red-400"><Sparkles size={20} /></div>
                                                        <div>
                                                            <div className="font-bold text-red-200">{taiSuiService?.title || '\u5efa\u8b70\u5b89\u592a\u6b72\u7948\u798f\u5316\u89e3\u6d41\u5e74\u715e\u6c23'}</div>
                                                            <div className="text-xs text-red-300/70">
                                                                {taiSuiService ? (taiSuiService.description || '\u4fdd\u4f51\u5e73\u5b89\u9806\u9042') : '\u5f8c\u53f0\u5c1a\u672a\u6307\u5b9a\u5b89\u592a\u6b72\u63a8\u85a6\u670d\u52d9'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => {
                                                        if (!userProfile?.fullName || !userProfile?.phone) {
                                                            alert('\u8acb\u5148\u88dc\u9f4a\u500b\u4eba\u8cc7\u6599\uff0c\u624d\u80fd\u5831\u540d\u670d\u52d9\u3002');
                                                            setIsEditProfileOpen(true);
                                                            return;
                                                        }
                                                        openServiceOrWarn(taiSuiService);
                                                    }} className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded text-sm font-bold transition-all whitespace-nowrap">
                                                        {taiSuiService ? `\u7acb\u5373\u5831\u540d (${taiSuiService.price || 0})` : '\u5f8c\u53f0\u5c1a\u672a\u6307\u5b9a'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-4">
                                            <h4 className="text-lg font-bold text-mystic-gold border-l-4 border-mystic-gold pl-3">{`\u672c\u5bae\u76f8\u95dc\u670d\u52d9`}</h4>
                                            <div className="grid grid-cols-1 gap-3">
                                                {fortuneServices.map((item) => (
                                                    <button
                                                        type="button"
                                                        key={item.label}
                                                        onClick={() => openServiceOrWarn(item.service)}
                                                        className={`bg-zinc-800 p-4 rounded transition-colors border border-transparent hover:border-white/10 flex justify-between items-center group text-left ${item.service ? 'hover:bg-zinc-700 cursor-pointer' : 'opacity-70 cursor-help'}`}
                                                    >
                                                        <div>
                                                            <div className="font-bold text-white mb-1 group-hover:text-mystic-gold transition-colors">{item.service?.title || item.label}</div>
                                                            <div className="text-xs text-gray-500">{item.service ? (item.service.description || item.hint) : '\u5f8c\u53f0\u5c1a\u672a\u6307\u5b9a\u6b64\u670d\u52d9'}</div>
                                                        </div>
                                                        <ChevronRight size={16} className="text-gray-600 group-hover:text-white" />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'BAZI' && (
                            <BaziChartPanel userProfile={userProfile} onEditProfile={() => setIsEditProfileOpen(true)} />
                        )}

                        {false && (
                            <div className="bg-zinc-900 border border-white/5 rounded-lg p-6 md:p-8 animate-fade-in-up">
                                <h3 className="text-xl font-bold text-white mb-6 pb-4 border-b border-white/10 flex items-center gap-2">
                                    <BookOpen className="text-mystic-gold" size={20} />
                                    八字命盤排盤
                                </h3>
                                {!userProfile?.birthYear ? (
                                    <div className="text-center py-10">
                                        <div className="text-gray-400 mb-4">請先完善個人生日資料，以獲取八字排盤。</div>
                                        <button onClick={() => setIsEditProfileOpen(true)} className="bg-mystic-gold text-black px-6 py-2 rounded font-bold hover:bg-yellow-500 transition-colors">填寫生日資料</button>
                                    </div>
                                ) : (
                                    <div>
                                        {(() => {
                                            try {
                                                let y = parseInt(userProfile.birthYear);
                                                if (y < 1000) y += 1911;
                                                const m = parseInt(userProfile.birthMonth);
                                                const d = parseInt(userProfile.birthDay);
                                                const hourMap: Record<string, number> = {
                                                    '子時':0,'丑時':2,'寅時':4,'卯時':6,'辰時':8,'巳時':10,'午時':12,'未時':14,'申時':16,'酉時':18,'戌時':20,'亥時':22
                                                };
                                                let h = 12;
                                                const hourStr = userProfile.birthHour || '';
                                                for (const key in hourMap) if (hourStr.startsWith(key.substring(0, 2))) { h = hourMap[key]; break; }

                                                const lunar = Lunar.fromYmd(y, m, d); 
                                                const solar = lunar.getSolar(); 
                                                const solarWithTime = Solar.fromYmdHms(solar.getYear(), solar.getMonth(), solar.getDay(), h, 0, 0);
                                                const baZi = Lunar.fromSolar(solarWithTime).getEightChar();

                                                const GAN = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
                                                const WUXING: Record<string, string> = {
                                                    '甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水',
                                                    '寅':'木','卯':'木','巳':'火','午':'火','辰':'土','戌':'土','丑':'土','未':'土','申':'金','酉':'金','亥':'水','子':'水'
                                                };
                                                const SHISHEN_MAP: Record<string, Record<string, string>> = {
                                                    '甲':{'甲':'比肩','乙':'劫財','丙':'食神','丁':'傷官','戊':'偏財','己':'正財','庚':'七殺','辛':'正官','壬':'偏印','癸':'正印'},
                                                    '乙':{'甲':'劫財','乙':'比肩','丙':'傷官','丁':'食神','戊':'正財','己':'偏財','庚':'正官','辛':'七殺','壬':'正印','癸':'偏印'},
                                                    '丙':{'甲':'偏印','乙':'正印','丙':'比肩','丁':'劫財','戊':'食神','己':'傷官','庚':'偏財','辛':'正財','壬':'七殺','癸':'正官'},
                                                    '丁':{'甲':'正印','乙':'偏印','丙':'劫財','丁':'比肩','戊':'傷官','己':'食神','庚':'正財','辛':'偏財','壬':'正官','癸':'七殺'},
                                                    '戊':{'甲':'七殺','乙':'正官','丙':'偏印','丁':'正印','戊':'比肩','己':'劫財','庚':'食神','辛':'傷官','壬':'偏財','癸':'正財'},
                                                    '己':{'甲':'正官','乙':'七殺','丙':'正印','丁':'偏印','戊':'劫財','己':'比肩','庚':'傷官','辛':'食神','壬':'正財','癸':'偏財'},
                                                    '庚':{'甲':'偏財','乙':'正財','丙':'七殺','丁':'正官','戊':'偏印','己':'正印','庚':'比肩','辛':'劫財','壬':'食神','癸':'傷官'},
                                                    '辛':{'甲':'正財','乙':'偏財','丙':'正官','丁':'七殺','戊':'正印','己':'偏印','庚':'劫財','辛':'比肩','壬':'傷官','癸':'食神'},
                                                    '壬':{'甲':'食神','乙':'傷官','丙':'偏財','丁':'正財','戊':'七殺','己':'正官','庚':'偏印','辛':'正印','壬':'比肩','癸':'劫財'},
                                                    '癸':{'甲':'傷官','乙':'食神','丙':'正財','丁':'偏財','戊':'正官','己':'七殺','庚':'正印','辛':'偏印','壬':'劫財','癸':'比肩'}
                                                };
                                                const getShiShen = (dm: string, t: string) => SHISHEN_MAP[dm]?.[t] || '';
                                                const getWuXing = (c: string) => WUXING[c] || '';
                                                
                                                const dayMaster = baZi.getDayGan();
                                                const counts: Record<string, number> = {'金':0,'木':0,'水':0,'火':0,'土':0};
                                                [baZi.getYearGan(), baZi.getYearZhi(), baZi.getMonthGan(), baZi.getMonthZhi(), baZi.getDayGan(), baZi.getDayZhi(), baZi.getTimeGan(), baZi.getTimeZhi()].forEach(c => counts[getWuXing(c)]++);

                                                const columns = [
                                                    { title:'年柱', gan:baZi.getYearGan(), zhi:baZi.getYearZhi(), zhuXing:toTC(getShiShen(dayMaster, baZi.getYearGan())), hidden:toTCArray(baZi.getYearHideGan() as string[]), diShi:toTC(baZi.getYearDiShi()), naYin:toTC(baZi.getYearNaYin()) },
                                                    { title:'月柱', gan:baZi.getMonthGan(), zhi:baZi.getMonthZhi(), zhuXing:toTC(getShiShen(dayMaster, baZi.getMonthGan())), hidden:toTCArray(baZi.getMonthHideGan() as string[]), diShi:toTC(baZi.getMonthDiShi()), naYin:toTC(baZi.getMonthNaYin()) },
                                                    { title:'日柱', gan:baZi.getDayGan(), zhi:baZi.getDayZhi(), zhuXing:'元男', hidden:toTCArray(baZi.getDayHideGan() as string[]), diShi:toTC(baZi.getDayDiShi()), naYin:toTC(baZi.getDayNaYin()) },
                                                    { title:'時柱', gan:baZi.getTimeGan(), zhi:baZi.getTimeZhi(), zhuXing:toTC(getShiShen(dayMaster, baZi.getTimeGan())), hidden:toTCArray(baZi.getTimeHideGan() as string[]), diShi:toTC(baZi.getTimeDiShi()), naYin:toTC(baZi.getTimeNaYin()) }
                                                ];
                                                
                                                const fullStems = [baZi.getYearGan(), baZi.getMonthGan(), baZi.getDayGan(), baZi.getTimeGan()];
                                                const fullBranches = [baZi.getYearZhi(), baZi.getMonthZhi(), baZi.getDayZhi(), baZi.getTimeZhi()];
                                                const gender = userProfile.gender === 'F' ? 'F' : 'M';
                                                const mingGe = toTC(calculateMingGe(dayMaster, baZi.getMonthZhi(), baZi.getMonthGan(), fullStems));

                                                return (
                                                    <div className="space-y-8 animate-fade-in-up">
                                                        <div className="bg-zinc-800/50 border border-yellow-500/30 rounded p-4 text-sm text-gray-300">
                                                            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-yellow-500 font-bold">農曆:</span> <span>{toTC(lunar.toString())}</span>
                                                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${gender === 'M' ? 'bg-blue-900/40 text-blue-300' : 'bg-pink-900/40 text-pink-300'}`}>{gender === 'M' ? '乾造' : '坤造'}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2"><span className="text-blue-400 font-bold">國曆:</span> <span>{solar.toString()}</span></div>
                                                            </div>
                                                            <div className="border-t border-white/10 mt-3 pt-3 flex justify-between items-center">
                                                                <div className="flex items-center gap-2"><span className="text-red-400 font-bold text-lg">命格:</span> <span className="text-white text-xl font-bold bg-red-900/30 px-3 py-1 rounded border border-red-500/30">{mingGe}</span></div>
                                                                <div className="text-[10px] text-gray-500">*排盤僅供參考</div>
                                                            </div>
                                                        </div>

                                                        <div className="overflow-x-auto rounded-lg border border-white/10">
                                                            <table className="w-full text-center border-collapse">
                                                                <thead><tr className="bg-zinc-800 text-mystic-gold"><th className="p-3 border border-white/10 w-20">宮位</th>{columns.map(c => <th key={c.title} className="p-3 border border-white/10 text-lg font-bold">{c.title}</th>)}</tr></thead>
                                                                <tbody className="bg-black/40 text-gray-200">
                                                                    <tr>
                                                                        <td className="p-3 border border-white/10 font-bold bg-zinc-900/50 tooltip-trigger cursor-pointer hover:text-mystic-gold" onClick={(e) => handleToggleTooltip('主星', GENERAL_BAZI_DESCRIPTIONS['主星'], e)}>主星</td>
                                                                        {columns.map((c, i) => {
                                                                            const val = c.zhuXing === '元男' ? '日主' : c.zhuXing;
                                                                            const desc = SHI_SHEN_DESCRIPTIONS[val] || '';
                                                                            return <td key={i} className="p-3 border border-white/10 font-bold text-red-400 tooltip-trigger cursor-pointer hover:bg-white/5" onClick={(e) => handleToggleTooltip(val, desc, e)}>{val}</td>;
                                                                        })}
                                                                    </tr>
                                                                    <tr><td className="p-3 border border-white/10 font-bold bg-zinc-900/50">天干</td>{columns.map((c, i) => <td key={i} className="p-3 border border-white/10 text-3xl font-serif font-bold" style={{ color: getWuXing(c.gan)==='火'?'#ff4d4f':getWuXing(c.gan)==='木'?'#52c41a':getWuXing(c.gan)==='金'?'#faad14':getWuXing(c.gan)==='水'?'#1890ff':'#d4b106' }}>{c.gan}</td>)}</tr>
                                                                    <tr><td className="p-3 border border-white/10 font-bold bg-zinc-900/50">地支</td>{columns.map((c, i) => <td key={i} className="p-3 border border-white/10 text-3xl font-serif font-bold" style={{ color: getWuXing(c.zhi)==='火'?'#ff4d4f':getWuXing(c.zhi)==='木'?'#52c41a':getWuXing(c.zhi)==='金'?'#faad14':getWuXing(c.zhi)==='水'?'#1890ff':'#d4b106' }}>{c.zhi}</td>)}</tr>
                                                                    <tr>
                                                                        <td className="p-3 border border-white/10 font-bold bg-zinc-900/50 tooltip-trigger cursor-pointer hover:text-mystic-gold" onClick={(e) => handleToggleTooltip('藏干', GENERAL_BAZI_DESCRIPTIONS['藏干'], e)}>藏干</td>
                                                                        {columns.map((c, i) => (
                                                                            <td key={i} className="p-3 border border-white/10 align-top h-24"><div className="flex flex-col gap-1 text-[10px] items-center justify-center h-full">
                                                                                {c.hidden.map((h, idx) => {
                                                                                    const ss = toTC(getShiShen(dayMaster, h));
                                                                                    const desc = SHI_SHEN_DESCRIPTIONS[ss] || '';
                                                                                    return <div key={idx} className="flex items-center gap-1"><span className={getWuXing(h)==='火'?'text-red-400':getWuXing(h)==='木'?'text-green-400':getWuXing(h)==='金'?'text-yellow-400':getWuXing(h)==='水'?'text-blue-400':'text-yellow-600'}>({h})</span><span className="text-gray-500 tooltip-trigger cursor-pointer hover:text-white" onClick={(e) => handleToggleTooltip(ss, desc, e)}>{ss}</span></div>;
                                                                                })}
                                                                            </div></td>
                                                                        ))}
                                                                    </tr>
                                                                    <tr>
                                                                        <td className="p-3 border border-white/10 font-bold bg-zinc-900/50 tooltip-trigger cursor-pointer hover:text-mystic-gold" onClick={(e) => handleToggleTooltip('地勢', GENERAL_BAZI_DESCRIPTIONS['地勢'], e)}>地勢</td>
                                                                        {columns.map((c, i) => <td key={i} className="p-3 border border-white/10 font-medium tooltip-trigger cursor-pointer hover:text-mystic-gold" onClick={(e) => handleToggleTooltip(c.diShi, DI_SHI_DESCRIPTIONS[c.diShi]||'', e)}>{c.diShi}</td>)}
                                                                    </tr>
                                                                    <tr>
                                                                        <td className="p-3 border border-white/10 font-bold bg-zinc-900/50 tooltip-trigger cursor-pointer hover:text-mystic-gold" onClick={(e) => handleToggleTooltip('納音', GENERAL_BAZI_DESCRIPTIONS['納音'], e)}>納音</td>
                                                                        {columns.map((c, i) => <td key={i} className="p-1 border border-white/10 text-[10px] text-gray-400 tooltip-trigger cursor-pointer" onClick={(e) => handleToggleTooltip('納音', GENERAL_BAZI_DESCRIPTIONS['納音'], e)}>{c.naYin}</td>)}
                                                                    </tr>
                                                                    <tr>
                                                                        <td className="p-3 border border-white/10 font-bold bg-zinc-900/50 h-32 align-middle"><div className="flex flex-col gap-2"><span>神煞</span><div className="text-[9px] text-gray-500 text-left pt-2 border-t border-white/5 space-y-1"><div>胎元: {toTC(baZi.getTaiYuan())}</div><div>命宮: {toTC(baZi.getMingGong())}</div><div>空亡: {toTC(baZi.getDayXunKong())}</div></div></div></td>
                                                                        {columns.map((c, i) => {
                                                                            const stars = toTCArray(getShenShaForPillar(c.zhi, c.gan, dayMaster, baZi.getYearGan(), baZi.getYearZhi(), baZi.getMonthZhi(), baZi.getDayZhi(), fullStems, fullBranches, gender, baZi.getYearNaYin(), baZi.getDayNaYin()));
                                                                            return <td key={i} className="p-2 border border-white/10 text-[11px] align-top"><div className="flex flex-col gap-1 items-center">{stars.map((s, idx) => <span key={idx} className="bg-white/5 px-1 py-0.5 rounded text-gray-300 w-full tooltip-trigger cursor-pointer hover:bg-white/10 transition-all" onClick={(e) => handleToggleTooltip(s, SHEN_SHA_DESCRIPTIONS[s]||'', e)}>{s}</span>)}{stars.length===0 && '-'}</div></td>;
                                                                        })}
                                                                    </tr>
                                                                </tbody>
                                                            </table>
                                                        </div>

                                                        <div className="bg-black/20 p-6 rounded-lg border border-white/5">
                                                            <div className="flex items-end justify-between h-48 gap-2 px-2">
                                                                {[{k:'木',c:'bg-green-600',l:'印'},{k:'火',c:'bg-red-600',l:'比'},{k:'土',c:'bg-yellow-700',l:'食'},{k:'金',c:'bg-yellow-500',l:'財'},{k:'水',c:'bg-blue-600',l:'官'}].map(el => {
                                                                    const count = counts[el.k];
                                                                    return <div key={el.k} className="flex flex-col items-center flex-1 h-full justify-end group"><div className="text-white font-bold mb-1 text-sm">{count}</div><div className="w-full bg-gray-800/50 rounded-t h-full flex flex-col justify-end"><div className={`w-full ${el.c} rounded-t transition-all`} style={{ height: `${Math.max(5, (count/8)*100)}%` }}></div></div><div className="mt-2 text-xs text-gray-400">{el.k}({el.l})</div></div>;
                                                                })}
                                                            </div>
                                                        </div>

                                                        {(() => {
                                                            const cg = getChengGuWeight(baZi.getYearGan()+baZi.getYearZhi(), lunar.getMonth(), lunar.getDay(), baZi.getTimeZhi());
                                                            return <div className="bg-zinc-800 border border-white/10 rounded-lg p-6 animate-fade-in-up">
                                                                <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5"><h4 className="text-xl font-bold text-mystic-gold">⚖️ 稱骨算命</h4><div className="text-3xl font-bold text-white bg-black/40 px-4 py-1 rounded border border-mystic-gold/20">{cg.totalWeight} 兩</div></div>
                                                                <div className="bg-mystic-gold/5 border border-mystic-gold/20 rounded-lg p-4"><p className="text-gray-200 leading-loose text-lg font-serif">{cg.poem}</p></div>
                                                            </div>;
                                                        })()}
                                                    </div>
                                                );
                                            } catch (e) {
                                                console.error(e);
                                                return <div className="text-red-400 p-8 text-center bg-red-900/10 rounded border border-red-500/20">八字計算錯誤，請檢查生日。</div>;
                                            }
                                        })()}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Tooltip Overlay - Fixed at root level of MemberCenter */}
            {activeTooltip && (
                <div 
                    className="fixed bottom-24 left-4 right-4 bg-zinc-900 border border-mystic-gold/50 rounded-lg p-5 shadow-2xl z-[100] animate-fade-in-up md:max-w-md md:left-auto md:right-8 tooltip-content"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex justify-between items-start mb-3">
                        <h5 className="text-mystic-gold font-bold flex items-center gap-2 text-lg"><BookOpen className="w-5 h-5" />{activeTooltip.title}</h5>
                        <button onClick={() => setActiveTooltip(null)} className="text-gray-500 hover:text-white p-1">✕</button>
                    </div>
                    <p className="text-gray-200 text-sm leading-relaxed">{activeTooltip.desc}</p>
                </div>
            )}

            <AuthModal isOpen={isEditProfileOpen} onClose={() => setIsEditProfileOpen(false)} />
            <ServiceModal 
                isOpen={isServiceModalOpen} 
                onClose={() => setIsServiceModalOpen(false)} 
                service={selectedService}
            />
        </div>
    );
};

export default MemberCenter;
