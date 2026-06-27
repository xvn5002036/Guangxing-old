import React, { useState, useEffect } from 'react';
import { ShoppingCart, BookOpen, CheckCircle2, Loader2, Info, Search, Timer, Tag } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../services/supabase';

import { useData } from '../context/DataContext';
import { DigitalProduct } from '../types';

export const ScriptureShop: React.FC<{ userId?: string }> = ({ userId }) => {
    const { scriptures: products } = useData();
    const [myPurchasedIds, setMyPurchasedIds] = useState<Set<string>>(new Set());
    const [myPendingIds, setMyPendingIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [activeCategory, setActiveCategory] = useState<string>('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [recommendations, setRecommendations] = useState<DigitalProduct[]>([]);

    useEffect(() => {
        if (products.length > 0) {
            setRecommendations([...products].sort(() => 0.5 - Math.random()).slice(0, 3));
        }
    }, [products]);

    useEffect(() => {
        const fetchLibrary = async () => {
            if (!userId) {
                setMyPurchasedIds(new Set());
                setMyPendingIds(new Set());
                return;
            }
            try {
                if (!isSupabaseConfigured()) {
                    const response = await fetch(`/api/my-library?userId=${encodeURIComponent(userId)}`);
                    if (response.ok) {
                        const library = await response.json();
                        setMyPurchasedIds(new Set(library.map((item: any) => item.product?.id).filter(Boolean)));
                    }
                    const orderResponse = await fetch('/api/orders');
                    if (orderResponse.ok) {
                        const orders = await orderResponse.json();
                        setMyPendingIds(new Set(orders.filter((order: any) => order.userId === userId && order.status === 'PENDING').map((order: any) => order.productId)));
                    }
                    return;
                }

                // 1. Fetch Purchases (Paid)
                const { data: purchases } = await supabase
                    .from('purchases')
                    .select('product_id')
                    .eq('user_id', userId);
                
                if (purchases) {
                    setMyPurchasedIds(new Set(purchases.map((item: any) => item.product_id)));
                }

                // 2. Fetch Pending Orders
                const { data: orders } = await supabase
                    .from('orders')
                    .select('product_id')
                    .eq('user_id', userId)
                    .eq('status', 'PENDING');

                if (orders) {
                    setMyPendingIds(new Set(orders.map((item: any) => item.product_id)));
                }

            } catch (error) {
                console.error('Fetch Library Error:', error);
            }
        };

        fetchLibrary();

        // Realtime Subscription for "Immediate Auto-Refresh"
        if (userId) {
            if (!isSupabaseConfigured()) return;

            const subscription = supabase
                .channel('shop_updates')
                .on('postgres_changes', { 
                    event: 'INSERT', 
                    schema: 'public', 
                    table: 'purchases',
                    filter: `user_id=eq.${userId}`
                }, (payload) => {
                    setMyPurchasedIds(prev => {
                        const next = new Set(prev);
                        next.add(payload.new.product_id);
                        return next;
                    });
                    setMyPendingIds(prev => {
                        const next = new Set(prev);
                        next.delete(payload.new.product_id);
                        return next;
                    });
                })
                .subscribe();

            return () => {
                supabase.removeChannel(subscription);
            };
        }
    }, [userId]);

    const [showBankModal, setShowBankModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<DigitalProduct | null>(null);

    // Bank Details
    const BANK_INFO = {
        bankName: '000 測試銀行',
        branch: '測試分行',
        accountNumber: '1234-5678-9012',
        accountName: '新莊武壇廣行宮'
    };

    if (loading) return (
        <div className="flex justify-center p-20">
            <Loader2 className="animate-spin text-mystic-gold" size={40} />
        </div>
    );

    const handleBuy = async (product: DigitalProduct) => {
        if (!userId) {
            alert('請先登入會員再進行請購');
            return;
        }

        if (myPurchasedIds.has(product.id)) {
            alert('您已收藏此經典，無需重複請購。');
            return;
        }

        if (myPendingIds.has(product.id)) {
            alert('您已送出申請，管理員審核中。\n請勿重複提交，以免影響作業流程。');
            return;
        }

        if (product.price === 0) {
            if (!confirm(`確認免費收藏「${product.title}」？`)) return;

            setLoading(true);
            try {
                if (!isSupabaseConfigured()) {
                    const response = await fetch('/api/manual-order', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userId,
                            productId: product.id,
                            amount: 0,
                            status: 'PAID',
                            paymentType: 'FREE',
                            merchantTradeNo: `FREE_${Date.now()}`
                        })
                    });
                    if (!response.ok) throw new Error((await response.json()).details || 'Local order failed');
                    const newSet = new Set(myPurchasedIds);
                    newSet.add(product.id);
                    setMyPurchasedIds(newSet);
                    alert('已成功加入你的書庫。');
                    return;
                }

                // A. Create Order (PAID)
                const { data: orderData, error: orderError } = await supabase.from('orders').insert({
                    user_id: userId,
                    product_id: product.id,
                    amount: 0,
                    status: 'PAID',
                    payment_type: 'FREE',
                    merchant_trade_no: `FREE_${Date.now()}`
                }).select().single();

                if (orderError) throw orderError;

                // B. Grant Access (Insert Purchase)
                const { error: purchaseError } = await supabase.from('purchases').insert({
                    user_id: userId,
                    product_id: product.id,
                    order_id: orderData.id
                });
                
                if (purchaseError && purchaseError.code !== '23505') throw purchaseError;

                const newSet = new Set(myPurchasedIds);
                newSet.add(product.id);
                setMyPurchasedIds(newSet);

                alert('收藏成功！您可以立即開始閱讀。');
            } catch (err: any) {
                console.error(err);
                alert('收藏失敗，請稍後再試：' + err.message);
            } finally {
                setLoading(false);
            }
            return;
        }

        setSelectedProduct(product);
        setShowBankModal(true);
    };

    // Filter Logic
    const filteredProducts = products.filter(p => {
        const matchesCategory = activeCategory === 'ALL' || p.category === activeCategory;
        const matchesSearch = !searchTerm || 
            p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.author && p.author.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (p.tags && p.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="p-6 bg-black min-h-screen text-white relative">
            <div className="max-w-6xl mx-auto">
                <header className="mb-12 text-center">
                    <h1 className="text-4xl font-bold tracking-[0.3em] text-mystic-gold uppercase mb-4">道藏經圖書館</h1>
                    <div className="w-24 h-1 bg-mystic-gold mx-auto mb-6"></div>
                    <p className="text-gray-400 max-w-2xl mx-auto italic">
                        「道可道，非常道。」—— 歡迎進入廣行宮道藏圖書館。此處收錄歷代珍貴道藏經典與數位電子書，僅限會員收藏與恭敬研讀。
                    </p>
                </header>

                {/* Search Bar */}
                <div className="max-w-md mx-auto mb-8 relative animate-fade-in-up">
                    <input 
                        type="text" 
                        placeholder="搜尋經文、作者或標籤..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-mystic-charcoal border border-white/20 rounded-full py-3 px-12 text-white focus:border-mystic-gold outline-none shadow-lg text-center transition-all focus:bg-black placeholder-gray-600"
                    />
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
                </div>

                {/* Category Filters */}
                <div className="flex justify-center flex-wrap gap-4 mb-12">
                    {['ALL', '數位道藏', '精選電子書', '法會手冊'].map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-6 py-2 rounded-full text-sm font-bold tracking-widest transition-all border ${
                                activeCategory === cat 
                                ? 'bg-mystic-gold text-black border-mystic-gold' 
                                : 'text-gray-400 border-white/10 hover:border-mystic-gold/50'
                            }`}
                        >
                            {cat === 'ALL' ? '全館藏書' : cat}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredProducts.map((product) => {
                        const isPurchased = myPurchasedIds.has(product.id);
                        const isPending = myPendingIds.has(product.id);
                        
                        return (
                            <div key={product.id} className="relative group bg-mystic-charcoal/50 border border-white/5 overflow-hidden rounded-sm hover:border-mystic-gold/40 transition-all duration-500">
                                {/* Preview Image / Icon Placeholder */}
                                <div className="aspect-[4/3] bg-black relative flex items-center justify-center overflow-hidden">
                                    {product.previewUrl ? (
                                        <img src={product.previewUrl} alt={product.title} className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-mystic-gold/20">
                                            <BookOpen size={64} strokeWidth={1} />
                                            <span className="mt-4 text-[10px] tracking-[0.3em] uppercase">Digital Collection</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-mystic-charcoal to-transparent"></div>
                                    <div className="absolute top-4 left-4 bg-black/80 border border-mystic-gold/30 px-3 py-1 text-[10px] text-mystic-gold font-bold tracking-widest uppercase">
                                        {product.fileType}
                                    </div>

                                    {/* Limited Time Badge */}
                                    {product.isLimitedTime && product.promotionEndDate && new Date(product.promotionEndDate) > new Date() && (
                                        <div className="absolute top-4 right-4 bg-red-900/90 border border-red-500/50 px-3 py-1 text-[10px] text-red-200 font-bold tracking-widest uppercase flex items-center gap-1 shadow-lg z-10 rounded">
                                            <Timer size={12} /> {new Date(product.promotionEndDate).toLocaleDateString()} 截止
                                        </div>
                                    )}
                                </div>

                                <div className="p-6 relative">
                                    <div className="mb-2 flex flex-wrap gap-2">
                                        <span className="text-xs text-mystic-gold font-bold uppercase tracking-widest opacity-70">
                                            {product.category || '道藏經典'}
                                        </span>
                                        {/* Tags Display */}
                                        {product.tags && product.tags.map(tag => (
                                            <span key={tag} className="text-[10px] bg-white/10 text-gray-400 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                                <Tag size={8} /> {tag}
                                            </span>
                                        ))}
                                    </div>

                                    <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-mystic-gold transition-colors">{product.title}</h3>
                                    <p className="text-gray-500 text-sm mb-6 leading-relaxed line-clamp-2">
                                        {product.description || '本道藏經文已進行數位化修復，適配手機、平板與電腦閱讀。收藏後可永久於個人圖庫中研讀。'}
                                    </p>

                                    <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/5">
                                        <div className="text-2xl font-bold text-mystic-gold">
                                            <span className="text-sm font-normal mr-1">NT$</span>
                                            {product.price.toLocaleString()}
                                        </div>
                                        
                                        {isPurchased ? (
                                            <button 
                                                disabled
                                                className="bg-green-900/20 text-green-400 border border-green-900/50 px-6 py-2 rounded-sm flex items-center gap-2 font-bold opacity-80 cursor-not-allowed"
                                            >
                                                <CheckCircle2 size={18} /> 已開通
                                            </button>
                                        ) : isPending ? (
                                            <button 
                                                disabled
                                                className="bg-yellow-900/20 text-yellow-400 border border-yellow-900/50 px-6 py-2 rounded-sm flex items-center gap-2 font-bold cursor-not-allowed"
                                            >
                                                <Loader2 size={18} className="animate-spin" /> 申請中
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => handleBuy(product)}
                                                className="bg-mystic-gold text-black px-6 py-2 rounded-sm flex items-center gap-2 font-bold hover:bg-white transition-all active:scale-95"
                                            >
                                                <ShoppingCart size={18} />
                                                請購收藏
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {isPurchased && (
                                    <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px] pointer-events-none"></div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Recommendations Section */}
                {recommendations.length > 0 && (
                    <div className="mt-20 border-t border-white/10 pt-12 animate-fade-in">
                        <h3 className="text-2xl font-bold text-center mb-8 tracking-widest text-gray-400 uppercase">
                            — 猜你喜歡 —
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {recommendations.map(product => (
                                <div key={product.id} 
                                    onClick={() => {
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                        setSelectedProduct(product); // Optional
                                    }}
                                    className="bg-white/5 p-4 rounded border border-white/5 hover:border-mystic-gold/30 cursor-pointer transition-all group"
                                >
                                    <div className="aspect-video bg-black mb-4 overflow-hidden rounded-sm relative">
                                        {product.previewUrl ? (
                                            <img src={product.previewUrl} className="w-full h-full object-cover opacity-50 group-hover:opacity-80 transition-opacity" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-600">
                                                <BookOpen size={24} />
                                            </div>
                                        )}
                                        {product.isLimitedTime && (
                                            <div className="absolute top-2 right-2 bg-red-900/80 text-white text-[10px] px-2 py-0.5 rounded">限時</div>
                                        )}
                                    </div>
                                    <h4 className="font-bold text-white group-hover:text-mystic-gold transition-colors truncate">{product.title}</h4>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-xs text-gray-500">{product.category}</span>
                                        <span className="text-sm text-mystic-gold font-mono">NT$ {product.price}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mt-20 p-8 bg-mystic-charcoal/30 border border-white/5 rounded-sm">
                    <div className="flex items-start gap-4">
                        <div className="bg-mystic-gold/10 p-3 rounded-full">
                            <Info className="text-mystic-gold" />
                        </div>
                        <div>
                            <h4 className="text-lg font-bold text-white mb-2">圖書館收藏與閱讀須知</h4>
                            <ul className="text-sm text-gray-500 space-y-2 list-disc pl-4">
                                <li>所有道藏商品均為數位電子版本 (PDF/EPUB)，一經收藏開通權限，恕不接受退款。</li>
                                <li>收藏之經典將永久保存於您的「會員中心 - 個人道藏圖庫」中。</li>
                                <li>為尊重版權與信仰，內容僅供個人修持觀閱，請勿將檔案私自散布、轉發或用於商業用途。</li>
                                <li>系統設有防重複機制，每位會員僅需收藏一次即可永久擁有閱讀權限。</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bank Transfer Modal */}
            {showBankModal && selectedProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-mystic-charcoal border border-mystic-gold/30 rounded-lg p-8 max-w-md w-full shadow-2xl relative">
                        <button 
                            onClick={() => setShowBankModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >
                            ✕
                        </button>
                        
                        <h3 className="text-2xl font-bold text-mystic-gold mb-6 text-center border-b border-white/10 pb-4">
                            匯款資訊
                        </h3>

                        <div className="space-y-6">
                            <div className="text-center">
                                <p className="text-gray-400 text-sm mb-2">您即將請購</p>
                                <p className="text-xl font-bold text-white mb-1">{selectedProduct.title}</p>
                                <p className="text-2xl text-mystic-gold font-bold">NT$ {selectedProduct.price.toLocaleString()}</p>
                            </div>

                            <div className="bg-black/40 p-6 rounded-md border border-white/5 space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">銀行代碼</span>
                                    <span className="text-white font-mono">{BANK_INFO.bankName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">銀行帳號</span>
                                    <span className="text-white font-mono tracking-wider">{BANK_INFO.accountNumber}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">戶名</span>
                                    <span className="text-white">{BANK_INFO.accountName}</span>
                                </div>
                            </div>

                            {/* Payment Report Form */}
                             <form 
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    const form = e.target as HTMLFormElement;
                                    const lastFive = (form.elements.namedItem('lastFive') as HTMLInputElement).value;
                                    
                                    if (!lastFive || lastFive.length !== 5) {
                                        alert('請輸入正確的帳號末五碼');
                                        return;
                                    }

                                    try {
                                        if (!isSupabaseConfigured()) {
                                            const response = await fetch('/api/manual-order', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    userId,
                                                    productId: selectedProduct.id,
                                                    amount: selectedProduct.price,
                                                    status: 'PENDING',
                                                    paymentType: 'BANK_TRANSFER',
                                                    merchantTradeNo: `BANK_${lastFive}_${Date.now()}`
                                                })
                                            });
                                            if (!response.ok) throw new Error((await response.json()).details || 'Local order failed');
                                            const newPending = new Set(myPendingIds);
                                            newPending.add(selectedProduct.id);
                                            setMyPendingIds(newPending);
                                            alert('已建立銀行轉帳訂單，請等待管理員確認。');
                                            setShowBankModal(false);
                                            return;
                                        }

                                        // Create Order directly (RLS allows insert own)
                                        const { error } = await supabase.from('orders').insert({
                                            user_id: userId,
                                            product_id: selectedProduct.id,
                                            amount: selectedProduct.price,
                                            status: 'PENDING',
                                            payment_type: 'BANK_TRANSFER',
                                            merchant_trade_no: `BANK_${lastFive}_${Date.now()}` // Store Last 5 here
                                        });

                                        if (error) throw error;

                                        // Update local pending state immediately
                                        const newPending = new Set(myPendingIds);
                                        newPending.add(selectedProduct.id);
                                        setMyPendingIds(newPending);

                                        alert('已送出匯款通知！\n管理員確認後將自動開通權限，請稍候。');
                                        setShowBankModal(false);
                                    } catch (err: any) {
                                        console.error(err);
                                        alert('送出失敗：' + err.message);
                                    }
                                }}
                                className="space-y-4 pt-4 border-t border-white/10"
                            >
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">匯款後請輸入「帳號末五碼」</label>
                                    <input 
                                        name="lastFive"
                                        type="text" 
                                        maxLength={5}
                                        placeholder="例如：12345"
                                        className="w-full bg-black border border-white/20 rounded p-3 text-white focus:border-mystic-gold outline-none text-center tracking-widest font-mono"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full bg-mystic-gold text-black font-bold py-3 rounded hover:bg-white transition-colors"
                                >
                                    已匯款，送出申請
                                </button>
                            </form>

                            <div className="bg-mystic-gold/10 p-4 rounded text-sm text-mystic-gold/80 border border-mystic-gold/20 space-y-1">
                                <p className="font-bold mb-1">交易流程：</p>
                                <p>1. 先依上方帳號完成匯款。</p>
                                <p>2. 在此輸入匯款帳號末五碼並送出申請。</p>
                                <p>3. 後台確認付款後，經文會自動開通到會員中心的「我的經文庫」。</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
