
import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { supabase, isSupabaseConfigured } from '../services/supabase'; // Import Supabase Client
import { X, Plus, Trash2, Edit, Save, LogOut, Calendar, FileText, Briefcase, Loader2, Users, Info, Settings, Network, Layout, Home, Printer, Image, HelpCircle, BookOpen, ShoppingBag, Copy, Check } from 'lucide-react';
import { GalleryItem, Registration, DigitalProduct, ScriptureOrder, Notification } from '../types';
import { GalleryManager } from './admin/GalleryManager';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { Solar, Lunar } from 'lunar-javascript';


interface AdminPanelProps {
    onClose: () => void;
}

// Custom Code Component with Copy Functionality
const CodeBlock = ({ inline, className, children, ...props }: any) => {
    const [isCopied, setIsCopied] = useState(false);
    const text = String(children).replace(/\n$/, '');

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent triggering parent clicks
        navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    if (inline) {
        return (
            <code
                className={`${className} cursor-pointer hover:bg-mystic-gold/20 active:bg-mystic-gold/40 transition-colors rounded px-1 relative group`}
                onClick={handleCopy}
                title="點擊複製 (Click to Copy)"
                {...props}
            >
                {children}
                {isCopied && <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] bg-black text-white px-1 rounded animate-fade-in-up">已複製</span>}
            </code>
        );
    }

    return (
        <div className="relative group my-4">
            <div className="absolute right-2 top-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={handleCopy}
                    className="p-1.5 rounded bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white backdrop-blur-sm border border-white/10"
                    title="複製程式碼"
                >
                    {isCopied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                </button>
            </div>
            <code className={`${className} block bg-black/30 p-4 rounded-lg border border-white/5 overflow-x-auto`} {...props}>
                {children}
            </code>
        </div>
    );
};

const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
    const {
        news, addNews, updateNews, deleteNews,
        events, addEvent, updateEvent, deleteEvent,
        services, addService, updateService, deleteService,
        announcements, addAnnouncement, updateAnnouncement, deleteAnnouncement,
        gallery, galleryAlbums, addGalleryItem, addGalleryItems, updateGalleryItem, deleteGalleryItem,
        addGalleryAlbum, updateGalleryAlbum, deleteGalleryAlbum,
        registrations, updateRegistration, deleteRegistration,
        orgMembers, addOrgMember, updateOrgMember, deleteOrgMember,
        faqs, addFaq, updateFaq, deleteFaq,
        siteSettings, updateSiteSettings,
        scriptures, addScripture, updateScripture, deleteScripture, deleteScriptureWithOrders,
        scriptureOrders, fetchScriptureOrders, updateScriptureOrder, deleteScriptureOrder,
        notifications, markNotificationAsRead, deleteNotification,
        profiles, purchases, grantScriptureAccess, revokeScriptureAccess,
        resetData, signOut
    } = useData();

    const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'GENERAL' | 'NEWS' | 'EVENTS' | 'SERVICES' | 'GALLERY' | 'REGISTRATIONS' | 'ORG' | 'FAQS' | 'SCRIPTURES' | 'ORDERS' | 'MEMBERS' | 'ANNOUNCEMENTS'>('DASHBOARD');
    const [generalSubTab, setGeneralSubTab] = useState<'VISUAL' | 'CONFIG'>('VISUAL');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const { user, userProfile, fetchUserProfile } = useData(); // Get global user state

    // New local state to force UI update immediately after login verification
    const [forceDashboard, setForceDashboard] = useState(() => localStorage.getItem('guangxing_admin_session') === 'true');

    // Admin UI States
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<any>({});

    const [isAdding, setIsAdding] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Local Profiles State (Fetched on demand to avoid global sync overhead)
    const [adminProfiles, setAdminProfiles] = useState<any[]>([]);
    const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);

    // Local Purchases State (For Admin Modal)
    const [adminPurchases, setAdminPurchases] = useState<any[]>([]);
    const [isLoadingPurchases, setIsLoadingPurchases] = useState(false);

    // Mobile Menu State
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Ref for main content scrolling
    const mainContentRef = useRef<HTMLDivElement>(null);

    // Markdown Preview State
    const [previewMode, setPreviewMode] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Markdown Helper Function
    const handleInsert = (prefix: string, suffix: string = '') => {
        const textarea = textareaRef.current;
        if (!textarea) {
            setEditForm((prev: any) => ({ ...prev, content: (prev.content || '') + prefix + suffix }));
            return;
        }

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = editForm.content || '';
        const before = text.substring(0, start);
        const selection = text.substring(start, end);
        const after = text.substring(end);

        const newText = before + prefix + selection + suffix + after;

        setEditForm({ ...editForm, content: newText });

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + prefix.length, end + prefix.length);
        }, 0);
    };

    // Generic Delete Handler

    const handleDelete = async (type: 'NEWS' | 'EVENT' | 'SERVICE' | 'ORG' | 'FAQ' | 'REGISTRATION' | 'SCRIPTURE' | 'ORDER' | 'ANNOUNCEMENT', id: string) => {
        if (!window.confirm('確定要刪除此項目嗎？此動作無法復原。')) return;

        try {
            if (type === 'NEWS') await deleteNews(id);
            else if (type === 'EVENT') await deleteEvent(id);
            else if (type === 'SERVICE') await deleteService(id);

            else if (type === 'ORG') await deleteOrgMember(id);
            else if (type === 'FAQ') await deleteFaq(id);
            else if (type === 'ANNOUNCEMENT') await deleteAnnouncement(id);
            else if (type === 'REGISTRATION') await deleteRegistration(id);
            else if (type === 'SCRIPTURE') await deleteScripture(id);
            else if (type === 'ORDER') await deleteScriptureOrder(id);
        } catch (error: any) {
            console.error("Delete failed:", error);
            if (error.code === '23503') { // Foreign Key Violation
                let msg = '無法刪除：此項目已被其他資料引用。';
                if (type === 'SCRIPTURE') {
                    if (window.confirm('此商品已有訂單。是否要「連同所有訂單一併強制刪除」？\n(警告：相關購買記錄將會永久消失，此動作無法復原)')) {
                        try {
                            await deleteScriptureWithOrders(id);
                            alert('商品及其關聯訂單已強制刪除');
                            return; // Success, skip generic alert
                        } catch (forceError: any) {
                            alert(`強制刪除失敗：${forceError.message || '未知錯誤'}`);
                        }
                    } else {
                        msg = '無法刪除：已有訂單引用此商品。請先至「數位商品訂單」分頁刪除相關訂單後再試。';
                    }
                } else if (type === 'EVENT') {
                    msg = '無法刪除：已有使用者報名此活動。請先刪除報名清單後再試。';
                } else if (type === 'SERVICE') {
                    msg = '無法刪除：此服務已有報名記錄。請先處理報名資料再試。';
                }
                alert(msg);
            } else {
                alert(`刪除失敗：${error.message || '未知錯誤'}`);
            }
        }
    };

    // REGISTRATIONS Filter & Export Logic
    const [selectedEventFilter, setSelectedEventFilter] = useState<string>('ALL');

    const handleExportCSV = () => {
        let dataToExport: any[] = [];
        let filename = '';

        if (activeTab === 'REGISTRATIONS') {
            dataToExport = selectedEventFilter === 'ALL'
                ? registrations
                : registrations.filter(r => r.serviceTitle === selectedEventFilter);
            filename = `法會報名名單_${selectedEventFilter === 'ALL' ? '全部' : selectedEventFilter}`;
        } else if (activeTab === 'ORDERS') {
            dataToExport = scriptureOrders;
            filename = `數位商品訂單_${orderFilter}`;
        }

        if (dataToExport.length === 0) {
            alert('目前無資料可匯出');
            return;
        }

        let csvContent = '';

        if (activeTab === 'REGISTRATIONS') {
            const headers = ["報名編號", "日期", "活動/服務名稱", "信眾姓名", "性別", "電話", "農曆年", "農曆月", "農曆日", "農曆時", "地址", "金額", "狀態", "備註"];
            const rows = dataToExport.map(reg => [
                `'${reg.id.substring(reg.id.length - 6)}`,
                new Date(reg.createdAt).toLocaleDateString(),
                reg.serviceTitle,
                reg.name,
                reg.gender === 'F' ? '女' : '男',
                reg.phone,
                reg.birthYear || '',
                reg.birthMonth || '',
                reg.birthDay || '',
                reg.birthHour || '',
                `${reg.city}${reg.district}${reg.road || ''}${reg.addressDetail || ''}`,
                reg.amount,
                reg.isProcessed ? '已辦理' : '未辦理',
                reg.paymentMethod || ''
            ]);
            csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(","))].join("\n");
        } else if (activeTab === 'ORDERS') {
            const headers = ["訂單編號", "日期", "商品名稱", "金額", "購買人ID", "狀態", "交易序號"];
            const rows = dataToExport.map(ord => [
                `'${ord.id.substring(0, 8)}`,
                new Date(ord.createdAt || '').toLocaleDateString(),
                ord.product?.title || '未知商品',
                ord.amount,
                ord.userId,
                ord.status,
                ord.merchantTradeNo
            ]);
            csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(","))].join("\n");
        }

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Search State
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Batch Selection State
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

    const handleLogout = async () => {
        try {
            await signOut();
            localStorage.removeItem('guangxing_admin_session');
            setForceDashboard(false);
            onClose(); // Optional: close the panel after logout
        } catch (error) {
            console.error("Logout failed:", error);
            // Even if signOut fails, we should clear local state
            localStorage.removeItem('guangxing_admin_session');
            setForceDashboard(false);
            onClose();
        }
    };

    // Helper to get unique event titles for the filter dropdown
    const uniqueEventTitles = Array.from(new Set([
        ...events.map(e => e.title),
        ...services.map(s => s.title)
    ]));

    // Filter Logic for Orders
    const [orderFilter, setOrderFilter] = useState<'PENDING' | 'PAID'>('PENDING');

    // Generic Data Filtering Logic
    const activeListData = (() => {
        let data: any[] = [];
        switch (activeTab) {
            case 'REGISTRATIONS': data = registrations; break;
            case 'EVENTS': data = events.filter(e => e.type === 'FESTIVAL' || e.type === 'RITUAL'); break;
            case 'NEWS': data = news; break;
            case 'SERVICES': data = services; break;
            case 'ORG': data = orgMembers; break;
            case 'FAQS': data = faqs; break;
            case 'ANNOUNCEMENTS': data = announcements; break;
            case 'SCRIPTURES': data = scriptures; break;
            case 'GALLERY': data = galleryAlbums; break;
            case 'ORDERS':
                // Filter Orders based on status
                data = scriptureOrders.filter(o => o.status === orderFilter);
                break;
            default: data = [];
        }
        return data;
    })();


    const filteredActiveData = activeListData.filter(item => {
        // Special logic for Registrations (keep existing filters)
        if (activeTab === 'REGISTRATIONS') {
            const r = item as Registration;
            const matchesEvent = selectedEventFilter === 'ALL' || r.serviceTitle === selectedEventFilter;
            const matchesSearch = searchTerm === '' ||
                r.name.includes(searchTerm) ||
                r.phone.includes(searchTerm) ||
                (r.bankLastFive && r.bankLastFive.includes(searchTerm));
            return matchesEvent && matchesSearch;
        }

        // Generic logic for other types
        if (searchTerm === '') return true;
        const lowTerm = searchTerm.toLowerCase();

        // Helper to safe check strings
        const check = (val: any) => String(val || '').toLowerCase().includes(lowTerm);

        if (activeTab === 'EVENTS') {
            const i = item as any; // Type assertion for convenience
            return check(i.title) || check(i.date) || check(i.lunarDate);
        }
        if (activeTab === 'NEWS') return check((item as any).title) || check((item as any).date);
        if (activeTab === 'SERVICES') return check((item as any).title) || check((item as any).price);
        if (activeTab === 'ORG') return check((item as any).name) || check((item as any).title);
        if (activeTab === 'FAQS') return check((item as any).question) || check((item as any).answer);
        if (activeTab === 'ANNOUNCEMENTS') return check((item as any).content);
        if (activeTab === 'SCRIPTURES') return check((item as any).title) || check((item as any).description);
        if (activeTab === 'ORDERS') {
            const i = item as any;
            return check(i.product?.title) || check(i.merchantTradeNo) || check(i.userId);
        }

        return true;
    });

    // Dashboard Statistics Calculation
    const stats = {
        registrationRevenue: registrations.reduce((sum, reg) => sum + (reg.amount || 0), 0),
        orderRevenue: scriptureOrders.reduce((sum, ord) => sum + (ord.amount || 0), 0),
        totalRevenue: 0, // Calculated below
        ritualCount: registrations.length,
        digitalSalesCount: scriptureOrders.length,
        unprocessedCount: registrations.filter(r => !r.isProcessed).length,
        todayNewCount: registrations.filter(r => {
            const today = new Date();
            const regDate = new Date(r.createdAt);
            return regDate.toDateString() === today.toDateString();
        }).length + scriptureOrders.filter(o => {
            const today = new Date();
            const ordDate = new Date(o.createdAt);
            return ordDate.toDateString() === today.toDateString();
        }).length
    };
    stats.totalRevenue = stats.registrationRevenue + stats.orderRevenue;

    // Product Ranking
    const productSalesMap = new Map<string, { title: string; count: number; revenue: number }>();
    scriptureOrders.forEach(order => {
        if (order.status === 'PAID' && order.productId) {
            const current = productSalesMap.get(order.productId) || { title: order.product?.title || 'Unknown', count: 0, revenue: 0 };
            current.count += 1;
            current.revenue += order.amount;
            productSalesMap.set(order.productId, current);
        }
    });
    const topProducts = Array.from(productSalesMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    // Notifications Filtering
    const unreadNotifications = notifications.filter(n => !n.isRead).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Unified Recent Activity (Latest 10 items)
    const recentActivities = [
        ...registrations.map(r => ({ ...r, type: 'RITUAL' as const })),
        ...scriptureOrders.map(o => ({ ...o, type: 'PRODUCT' as const, name: userProfile?.id === o.userId ? (userProfile?.name || '會員') : '購買信眾', serviceTitle: o.product?.title || '數位商品' }))
    ]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10);


    // Pagination Logic
    const totalPages = Math.ceil(filteredActiveData.length / itemsPerPage);
    const paginatedItems = filteredActiveData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );
    // Backward compatibility for existing code using 'paginatedRegistrations'
    const paginatedRegistrations = activeTab === 'REGISTRATIONS' ? (paginatedItems as Registration[]) : [];

    // Batch Actions
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedItems(new Set(filteredActiveData.map(item => item.id!))); // Ensure ID exists
        } else {
            setSelectedItems(new Set());
        }
    };

    const handleSelectOne = (id: string) => {
        const newSet = new Set(selectedItems);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedItems(newSet);
    };



    const handleBatchDelete = async () => {
        if (selectedItems.size === 0) return;

        if (window.confirm(`確定要刪除選取的 ${selectedItems.size} 筆資料嗎？此動作無法復原。`)) {
            let successCount = 0;
            let failCount = 0;

            for (const id of Array.from(selectedItems)) {
                try {
                    // Switch dispatch based on activeTab
                    if (activeTab === 'REGISTRATIONS') await deleteRegistration(id);
                    else if (activeTab === 'EVENTS') await deleteEvent(id);
                    else if (activeTab === 'NEWS') await deleteNews(id);
                    else if (activeTab === 'SERVICES') await deleteService(id);
                    else if (activeTab === 'ORG') await deleteOrgMember(id);
                    else if (activeTab === 'FAQS') await deleteFaq(id);
                    else if (activeTab === 'ANNOUNCEMENTS') await deleteAnnouncement(id);
                    else if (activeTab === 'ORDERS') await deleteScriptureOrder(id);
                    else if (activeTab === 'SCRIPTURES') {
                        try {
                            await deleteScripture(id);
                        } catch (error: any) {
                            if (error.code === '23503') {
                                if (window.confirm(`商品 (ID: ${(id as string).substring(0, 8)}...) 已有訂單引用。是否要連同所有訂單一併強制刪除？`)) {
                                    await deleteScriptureWithOrders(id);
                                } else {
                                    throw error;
                                }
                            } else {
                                throw error;
                            }
                        }
                    }
                    // Albums are not batch deleted for safety usually, but we could add ALBUM here if needed

                    successCount++;
                } catch (error) {
                    console.error(`Failed to delete item ${id}:`, error);
                    failCount++;
                }
            }

            setSelectedItems(new Set());
            // Adjust page logic
            if (currentPage > 1 && paginatedItems.length === selectedItems.size && filteredActiveData.length === selectedItems.size) {
                setCurrentPage(prev => Math.max(1, prev - 1));
            }

            if (failCount > 0) {
                alert(`批次處理完成。成功刪除: ${successCount} 筆，失敗: ${failCount} 筆。\n\n提示：失敗原因通常是資料庫關聯限制（例如經文已有訂單，或活動已有報名）。請先刪除關聯資料後再重試。`);
            }
            else {
                alert('已完成批次刪除');
            }
        }
    };

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
        setSelectedItems(new Set());
    }, [selectedEventFilter, searchTerm, activeTab]);

    // Settings Form State
    const [settingsForm, setSettingsForm] = useState(siteSettings);

    // Local File Upload States
    // Local File Upload States
    // const fileInputRef = useRef<HTMLInputElement>(null); // Moved to GalleryManager


    // Initialize settings form when loading or switching tabs
    useEffect(() => {
        setSettingsForm({
            ...siteSettings,
            // Ensure nested objects are initialized if missing (fallback)
            configDonation: siteSettings.configDonation || { showBirth: false, showTime: false, showAddress: false, showIdNumber: false },
            configLight: siteSettings.configLight || { showBirth: true, showTime: true, showAddress: true, showIdNumber: false },
            configEvent: siteSettings.configEvent || { showBirth: true, showTime: false, showAddress: true, showIdNumber: true }
        });
    }, [siteSettings, activeTab]);

    // Fetch orders when tab is active
    useEffect(() => {
        if (activeTab === 'ORDERS') {
            fetchScriptureOrders();
        } else if (activeTab === 'MEMBERS') {
            const fetchProfiles = async () => {
                setIsLoadingProfiles(true);
                if (!isSupabaseConfigured()) {
                    try {
                        const response = await fetch('/api/profiles');
                        const data = await response.json();
                        if (!response.ok) throw new Error(data.error || data.details || '會員資料讀取失敗');
                        setAdminProfiles(data || []);
                    } catch (error) {
                        console.error('Error fetching local profiles:', error);
                        setAdminProfiles([]);
                    } finally {
                        setIsLoadingProfiles(false);
                    }
                    return;
                }

                // 1. Fetch Profiles
                const { data: profilesData, error: profilesError } = await supabase
                    .from('profiles')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (profilesError) {
                    console.error('Error fetching profiles:', profilesError);
                    setAdminProfiles([]); // Ensure empty state on error
                } else {
                    // 2. Fetch Purchase Counts (separately to avoid Join issues)
                    const { data: purchasesData, error: purchasesError } = await supabase
                        .from('purchases')
                        .select('user_id'); // Lightweight fetch

                    const purchaseCounts: Record<string, number> = {};
                    if (!purchasesError && purchasesData) {
                        purchasesData.forEach((p: any) => {
                            const uid = p.user_id || p.userId;
                            if (uid) purchaseCounts[uid] = (purchaseCounts[uid] || 0) + 1;
                        });
                    }

                    // Map snake_case to camelCase and add count
                    const mappedData = (profilesData || []).map((p: any) => ({
                        ...p,
                        fullName: p.full_name,
                        birthYear: p.birth_year,
                        birthMonth: p.birth_month,
                        birthDay: p.birth_day,
                        birthHour: p.birth_hour,
                        createdAt: p.created_at,
                        purchaseCount: purchaseCounts[p.id] || 0
                    }));
                    setAdminProfiles(mappedData);
                }
                setIsLoadingProfiles(false);
            };
            fetchProfiles();
        }
    }, [activeTab]);

    // Derived state for determining if we should show the dashboard
    // We trust the Context (isAdmin) OR our local override (forceDashboard)
    const isAdmin = (user && userProfile?.role === 'admin') || forceDashboard;

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoggingIn(true);
        setLoginError(null);
        console.log("Starting login process...", { email });

        try {
            if (!isSupabaseConfigured()) {
                const response = await fetch('/api/admin/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.error || result.details || 'Local admin login failed');
                localStorage.setItem('guangxing_admin_session', 'true');
                setForceDashboard(true);
                return;
            }

            // Create a timeout promise
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Login timed out')), 10000)
            );

            // Race the auth request against the timeout
            const { data, error } = await Promise.race([
                supabase.auth.signInWithPassword({ email, password }),
                timeoutPromise
            ]) as any;

            if (error) throw error;

            console.log("Supabase Auth Successful", data);
            // Auth successful, wait for DataContext to update userProfile and check role
            // We force a fetch here to ensure UI updates immediately
            await fetchUserProfile(data.user.id);

            // We can do a quick one-off check here to give immediate feedback
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', data.user.id)
                .maybeSingle();

            if (profileError || !profileData || profileData.role !== 'admin') {
                console.warn("Login denied: Profile check failed", { profileError, role: profileData?.role });

                let detail = '';
                if (profileError) detail = `資料庫錯誤: ${profileError.message} (${profileError.code})`;
                else if (!profileData) detail = '找不到會員資料或非管理員帳號';
                else detail = `角色權限: ${profileData.role || '無'} (需要: admin)`;

                await supabase.auth.signOut();
                throw new Error(`登入失敗 (檢查階段):\n${detail}`);
            } else {
                console.log("Login authorized! Role is admin.");
                // SUCCESS: Force local state to switch UI immediately
                localStorage.setItem('guangxing_admin_session', 'true');
                setForceDashboard(true);
            }

        } catch (err: any) {
            console.error("Login Error:", err);
            // Translate common errors
            let msg = err.message;
            if (msg === 'Invalid login credentials') msg = '帳號或密碼錯誤';
            else if (msg.includes('Login timed out')) msg = '登入連線逾時，請檢查網路';

            setLoginError(msg);

            // Only alert for non-credential errors to avoid annoyance
            if (msg !== '帳號或密碼錯誤' && !msg.includes('權限')) {
                alert(`登入發生意外錯誤：\n${msg}`);
            } else if (msg.includes('權限')) {
                alert(msg); // Alert for permission issues is helpful
            }

        } finally {
            setIsLoggingIn(false);
        }
    };

    const handleEdit = (item: any) => {
        setEditingId(item.id);

        let initialForm = { ...item };

        // Fix: Populate default fieldConfig for existing items if missing, 
        // ensuring the Admin UI reflects the actual defaults used by Frontend.
        if (!initialForm.fieldConfig) {
            const baseEventConfig = siteSettings?.configEvent || { showBirth: true, showTime: false, showAddress: true, showIdNumber: true, showGender: true };
            const baseLightConfig = siteSettings?.configLight || { showBirth: true, showTime: true, showAddress: true, showIdNumber: false };
            const baseDonationConfig = siteSettings?.configDonation || { showBirth: false, showTime: false, showAddress: false, showIdNumber: false };

            if (activeTab === 'EVENTS' || item.type === 'FESTIVAL' || item.type === 'RITUAL') {
                initialForm.fieldConfig = baseEventConfig;
            } else if (activeTab === 'SERVICES') {
                if (item.type === 'LIGHT' || item.title?.includes('燈')) {
                    initialForm.fieldConfig = baseLightConfig;
                } else if (item.type === 'DONATION' || item.title?.includes('隨喜') || item.title?.includes('捐獻')) {
                    initialForm.fieldConfig = baseDonationConfig;
                }
                // Default service fallback if needed
                if (!initialForm.fieldConfig) initialForm.fieldConfig = baseLightConfig;
            }
        }

        setEditForm(initialForm);
        setIsAdding(false);
        // Scroll the container, not the window
        if (mainContentRef.current) {
            mainContentRef.current.scrollTo({ top: 0, behavior: 'instant' });
        }
    };



    const handleSave = async () => {
        // Validation
        if (activeTab === 'ANNOUNCEMENTS') {
            if (!editForm.content) {
                alert('請填寫跑馬燈公告文字');
                return;
            }
        } else if (activeTab === 'FAQS') {
            if (!editForm.question || !editForm.answer) {
                alert('請填寫問與答');
                return;
            }
        } else if (!editForm.title && !editForm.name) {
            alert('請填寫標題或名稱');
            return;
        }

        setIsSaving(true);
        try {
            // Priority: Batch Upload to GitHub
            if (activeTab === 'GALLERY') {
                // GALLERY Logic should move to GalleryManager, skipping here in main
                // But wait, local handleSave is for "General" add, how to block?
                // The easiest way is to NOT call handleSave for GALLERY in main AdminPanel
            } else {
                // Regular Save Logic (URL or other tabs)
                let finalUrl = editForm.url || editForm.image || editForm.coverImageUrl;

                if (activeTab === 'NEWS') {
                    if (isAdding) await addNews(editForm); else await updateNews(editingId!, editForm);
                } else if (activeTab === 'EVENTS') {
                    if (isAdding) await addEvent(editForm);
                    else await updateEvent(editingId!, editForm);
                } else if (activeTab === 'SERVICES') {
                    if (isAdding) await addService(editForm); else await updateService(editingId!, editForm);
                } else if (activeTab === 'REGISTRATIONS') {
                    await updateRegistration(editingId!, editForm);
                } else if (activeTab === 'ORG') {
                    if (isAdding) await addOrgMember(editForm); else await updateOrgMember(editingId!, editForm);
                } else if (activeTab === 'FAQS') {
                    if (isAdding) await addFaq(editForm); else await updateFaq(editingId!, editForm);
                } else if (activeTab === 'ANNOUNCEMENTS') {
                    if (isAdding) await addAnnouncement(editForm); else await updateAnnouncement(editingId!, editForm);
                } else if (activeTab === 'SCRIPTURES') {
                    if (isAdding) await addScripture(editForm); else await updateScripture(editingId!, editForm);
                }
            }

            // Reset Form
            setEditingId(null);
            setIsAdding(false);
            setEditForm({});
        } catch (error: any) {
            console.error("Save failed:", error);
            let msg = error.message || '未知錯誤';
            if (msg.includes('field_config')) {
                msg = '資料庫架構尚未更新，缺少 "field_config" 欄位。';
            }
            alert(`儲存失敗：\n${msg}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveSettings = async () => {
        try {
            await updateSiteSettings(settingsForm);
            alert('網站設定已更新！');
        } catch (error) {
            console.error("Save settings error:", error);
            alert('儲存失敗，請檢查網路或權限');
        }
    };

    const handleToggleStatus = (reg: Registration) => {
        const nextProcessed = !reg.isProcessed;
        const service = services.find(s => s.id === reg.serviceId || s.title === reg.serviceTitle);
        const durationDays = Number(reg.lightDurationDays || service?.lightDurationDays || 30);

        if (nextProcessed) {
            const startDate = new Date();
            const expireDate = new Date(startDate);
            expireDate.setDate(expireDate.getDate() + Math.max(1, durationDays));
            updateRegistration(reg.id, {
                isProcessed: true,
                lightStartDate: startDate.toISOString(),
                lightExpireDate: expireDate.toISOString(),
                lightDurationDays: durationDays,
            });
        } else {
            updateRegistration(reg.id, {
                isProcessed: false,
                lightStartDate: undefined,
                lightExpireDate: undefined,
            });
        }
    };

    const handlePrintReceipt = (reg: Registration) => {
        const printWindow = window.open('', '_blank', 'width=500,height=700');
        if (!printWindow) return;

        const today = new Date();
        const dateStr = `${today.getFullYear()}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getDate().toString().padStart(2, '0')}`;
        const timeStr = `${today.getHours().toString().padStart(2, '0')}:${today.getMinutes().toString().padStart(2, '0')}:${today.getSeconds().toString().padStart(2, '0')}`;

        const fullHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>收據預覽 - ${reg.name}</title>
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
                <div class="info-row"><span>單號：${reg.id.substring(reg.id.length - 6)}</span><span>機台：POS-01</span></div>
                <div class="info-row"><span>日期：${dateStr}</span><span>時間：${timeStr}</span></div>
                <div class="info-row"><span>信眾：${reg.name}</span><span>電話：${reg.phone}</span></div>
                <div class="divider"></div>
                <div class="table-header"><span>項目名稱</span><span>金額</span></div>
                <div class="item-row"><span>${reg.serviceTitle}</span><span>NT$ ${reg.amount}</span></div>
                <div class="divider"></div>
                <div class="total-section">總計 NT$ ${reg.amount}</div>
                <div class="info-row" style="margin-top: 10px;"><span>支付方式：</span><span>現金/轉帳</span></div>
                <div class="footer"><div class="note">此為宮廟內部收據<br/>僅供證明，不得作為兌獎或報稅憑證</div><p>感謝您的護持，功德無量。</p><p>經手人：________________</p></div>
            </div>
            <div class="actions-bar no-print"><button class="btn btn-print" onclick="window.print()">🖨️ 確認列印</button><button class="btn btn-close" onclick="window.close()">關閉視窗</button></div>
        </body>
        </html>
      `;

        printWindow.document.write(fullHtml);
        printWindow.document.close();
    };





    if (!isAdmin) return (
        <div className="fixed inset-0 z-[100] bg-black">
            <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-white"><X size={32} /></button>
            <div className="flex flex-col items-center justify-center h-full">
                <div className="bg-mystic-charcoal p-8 rounded-sm border border-mystic-gold/30 w-full max-w-md shadow-2xl animate-fade-in-up">
                    <h2 className="text-2xl font-bold text-white mb-6 text-center tracking-widest">後台管理系統</h2>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="text-xs text-gray-500 uppercase block mb-1">管理員帳號 (Email)</label>
                            <input
                                type="email"
                                required
                                placeholder="admin@example.com"
                                className="w-full bg-black border border-white/10 p-3 text-white focus:border-mystic-gold outline-none"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 uppercase block mb-1">登入密碼</label>
                            <input
                                type="password"
                                required
                                placeholder="請輸入密碼"
                                className="w-full bg-black border border-white/10 p-3 text-white focus:border-mystic-gold outline-none"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                        </div>

                        {loginError && (
                            <div className="bg-red-900/20 border border-red-500/50 text-red-400 p-3 text-sm flex items-center gap-2 rounded">
                                <Info size={16} />
                                {loginError}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoggingIn}
                            className="w-full bg-mystic-gold text-black font-bold py-3 hover:bg-white transition-colors disabled:opacity-50 flex justify-center gap-2"
                        >
                            {isLoggingIn && <Loader2 className="animate-spin" size={20} />}
                            {isLoggingIn ? '驗證權限中...' : '登入系統'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col md:flex-row text-white font-sans h-screen overflow-hidden">

            {/* Mobile Header */}
            <div className="md:hidden sticky top-0 flex items-center justify-between p-4 bg-mystic-charcoal border-b border-white/10 z-[60] shadow-lg">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-5 bg-mystic-gold"></div>
                    <h2 className="text-lg font-bold text-white uppercase tracking-widest">後台管理</h2>
                </div>
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="text-white p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Layout size={24} />}
                </button>
            </div>

            {/* Mobile Backdrop */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            <div className={`
                fixed inset-y-0 left-0 z-[70] w-72 bg-mystic-charcoal border-r border-white/10 flex flex-col 
                transform transition-transform duration-300 ease-in-out shadow-2xl
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
                md:relative md:translate-x-0 md:inset-auto md:h-full md:w-64
            `}>
                <div className="p-6 border-b border-white/10 hidden md:block">
                    <h2 className="text-xl font-bold text-mystic-gold uppercase tracking-widest">Chi Fu CMS</h2>
                </div>
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {[
                        { id: 'DASHBOARD', icon: Layout, label: '總覽/儀表板' },
                        { id: 'GENERAL', icon: Settings, label: '一般設定' },
                        { id: 'ORG', icon: Network, label: '組織管理' },
                        { id: 'NEWS', icon: FileText, label: '最新消息' },
                        { id: 'EVENTS', icon: Calendar, label: '行事曆管理' },
                        { id: 'SERVICES', icon: Briefcase, label: '服務項目' },
                        { id: 'GALLERY', icon: Image, label: '活動花絮' },
                        { id: 'FAQS', icon: HelpCircle, label: '常見問題' },
                        { id: 'ANNOUNCEMENTS', icon: FileText, label: '跑馬燈公告' },
                        { id: 'REGISTRATIONS', icon: Users, label: '報名管理' },
                        { id: 'SCRIPTURES', icon: BookOpen, label: '道藏藏書管理' },
                        { id: 'ORDERS', icon: ShoppingBag, label: '道藏收藏訂單' },
                        { id: 'MEMBERS', icon: Users, label: '會員管理' }
                    ].map(tab => (
                        <button key={tab.id} onClick={() => {
                            setActiveTab(tab.id as any);
                            setEditingId(null);
                            setIsAdding(false);
                            // setShowGithubImport(false); // Removed
                            setIsMobileMenuOpen(false); // Close on selection
                        }} className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-bold transition-colors ${activeTab === tab.id ? 'bg-mystic-gold text-black' : 'text-gray-400 hover:bg-white/5'}`}>
                            <tab.icon size={18} /> {tab.label}
                        </button>
                    ))}
                </nav>
                <div className="p-4 border-t border-white/10 space-y-2 bg-mystic-charcoal">
                    <button onClick={onClose} className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-white hover:bg-white/5 rounded transition-colors text-xs"><Home size={14} /> 回首頁</button>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-900/20 rounded transition-colors font-bold"><LogOut size={18} /> 登出系統</button>
                </div>
            </div>

            <div ref={mainContentRef} className="flex-1 p-4 md:p-8 overflow-y-auto bg-black w-full pb-20 md:pb-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
                    <h2 className="text-xl md:text-2xl font-bold text-white border-l-4 border-mystic-gold pl-4 transition-all">
                        {activeTab === 'DASHBOARD' ? '後台管理總覽 (Dashboard)' :
                            activeTab === 'GENERAL' ? '一般網站設定 (圖片與文字)' :
                                activeTab === 'ORG' ? '宮廟組織人員管理' :
                                    activeTab === 'REGISTRATIONS' ? '信眾報名清單' :
                                        activeTab === 'NEWS' ? '最新消息管理' :
                                            activeTab === 'EVENTS' ? '行事曆管理' :
                                                activeTab === 'SERVICES' ? '服務項目設定' :
                                                    activeTab === 'FAQS' ? '常見問題管理' :
                                                        activeTab === 'SCRIPTURES' ? '數位商品管理 (經文/電子書)' :
                                                            activeTab === 'ANNOUNCEMENTS' ? '即時跑馬燈公告管理' :
                                                                activeTab === 'ORDERS' ? '數位商品訂單紀錄' :
                                                                    activeTab === 'MEMBERS' ? '會員資料與權限管理' : '活動花絮管理'}
                    </h2>
                    <div className="flex flex-wrap md:flex-nowrap w-full md:w-auto gap-3">
                        {activeTab !== 'REGISTRATIONS' && activeTab !== 'ORDERS' && activeTab !== 'GENERAL' && activeTab !== 'DASHBOARD' && activeTab !== 'GALLERY' && activeTab !== 'MEMBERS' && (
                            <button onClick={() => {
                                setEditingId(null);
                                setIsAdding(true);
                                const initialForm: any =
                                    activeTab === 'NEWS' ? { category: '公告' } :
                                        activeTab === 'ORG' ? { category: 'STAFF' } :
                                            activeTab === 'FAQS' ? {} :
                                                activeTab === 'ANNOUNCEMENTS' ? { is_active: true, priority: 0 } :
                                                    activeTab === 'SCRIPTURES' ? { file_type: 'PDF', category: '數位道藏' } :
                                                        activeTab === 'SERVICES' ? { type: 'LIGHT', price: 0, lightDurationDays: 30, fieldConfig: siteSettings.configLight } :
                                                            activeTab === 'EVENTS' ? { type: 'FESTIVAL', fieldConfig: siteSettings.configEvent } :
                                                                { type: 'FESTIVAL' };
                                setEditForm(initialForm);
                            }} className="w-full md:w-auto justify-center bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-green-600 font-bold transition-all shadow-lg active:scale-95">
                                <Plus size={18} /> {
                                    activeTab === 'SERVICES' ? '新增服務項目' :
                                        activeTab === 'EVENTS' ? '新增活動' :
                                            activeTab === 'NEWS' ? '新增消息' :
                                                activeTab === 'ANNOUNCEMENTS' ? '新增公告' :
                                                    activeTab === 'SCRIPTURES' ? '新增藏書' : '新增項目'
                                }
                            </button>
                        )}
                    </div>
                </div>

                {/* --- DASHBOARD TAB --- */}
                {activeTab === 'DASHBOARD' && (
                    <div className="space-y-8 animate-fade-in-up">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            <div className="bg-mystic-charcoal p-6 rounded-sm border border-white/10 relative overflow-hidden group hover:border-mystic-gold/50 transition-colors">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Users size={64} />
                                </div>
                                <h3 className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-2">總報名人數</h3>
                                <div className="text-3xl font-bold text-white">{stats.ritualCount} <span className="text-sm font-normal text-gray-500 italic">人</span></div>
                            </div>

                            <div className="bg-mystic-charcoal p-6 rounded-sm border border-white/10 relative overflow-hidden group hover:border-mystic-gold/50 transition-colors">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <ShoppingBag size={64} />
                                </div>
                                <h3 className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-2">道藏收藏總量</h3>
                                <div className="text-3xl font-bold text-white">{stats.digitalSalesCount} <span className="text-sm font-normal text-gray-500 italic">件</span></div>
                            </div>

                            <div className="bg-mystic-charcoal p-6 rounded-sm border border-white/10 relative overflow-hidden group hover:border-mystic-gold/50 transition-colors">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Calendar size={64} />
                                </div>
                                <h3 className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-2">今日新增動態</h3>
                                <div className="text-3xl font-bold text-mystic-gold">+{stats.todayNewCount}</div>
                            </div>

                            <div className="bg-mystic-charcoal p-6 rounded-sm border border-white/10 relative overflow-hidden group hover:border-mystic-gold/50 transition-colors">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Network size={64} />
                                </div>
                                <h3 className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-2">未辦理案件</h3>
                                <div className="text-3xl font-bold text-red-500">{stats.unprocessedCount} <span className="text-sm font-normal text-gray-500 italic">件</span></div>
                            </div>

                            {/* Revenue Breakdown */}
                            <div className="bg-mystic-charcoal p-6 rounded-sm border border-white/10 relative overflow-hidden group hover:border-mystic-gold/50 transition-colors md:col-span-2">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <h3 className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-2">法會報名總額</h3>
                                        <div className="text-2xl font-bold text-white">NT$ {stats.registrationRevenue.toLocaleString()}</div>
                                    </div>
                                    <div className="text-right">
                                        <h3 className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-2">道藏收藏總額</h3>
                                        <div className="text-2xl font-bold text-white">NT$ {stats.orderRevenue.toLocaleString()}</div>
                                    </div>
                                </div>
                                <div className="mt-4 h-2 bg-black rounded-full overflow-hidden flex">
                                    <div className="h-full bg-mystic-gold" style={{ width: `${(stats.registrationRevenue / (stats.totalRevenue || 1)) * 100}%` }}></div>
                                    <div className="h-full bg-white opacity-20" style={{ width: `${(stats.orderRevenue / (stats.totalRevenue || 1)) * 100}%` }}></div>
                                </div>
                            </div>

                            <div className="bg-mystic-charcoal p-6 rounded-sm border border-mystic-gold/30 shadow-[0_0_20px_rgba(197,160,89,0.1)] relative overflow-hidden group hover:border-mystic-gold transition-colors md:col-span-2">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Layout size={64} />
                                </div>
                                <h3 className="text-mystic-gold text-[10px] font-bold uppercase tracking-widest mb-2">全站累計總營收 (TOTAL REVENUE)</h3>
                                <div className="text-4xl font-bold text-mystic-gold">NT$ {stats.totalRevenue.toLocaleString()}</div>
                            </div>
                        </div>

                        {/* Row 2: Notifications & Top Products */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                            {/* Notifications */}
                            <div className="bg-black/40 border border-white/10 rounded-lg p-6">
                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <Info className="text-blue-400" /> 系統通知 ({unreadNotifications.length})
                                </h3>
                                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                                    {unreadNotifications.length === 0 ? (
                                        <p className="text-gray-500 text-sm">目前沒有未讀通知</p>
                                    ) : (
                                        unreadNotifications.map(notification => (
                                            <div key={notification.id} className="bg-white/5 p-3 rounded border border-white/5 flex justify-between items-start group hover:bg-white/10 transition-colors">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${notification.type === 'ORDER' ? 'bg-green-900 text-green-300' :
                                                            notification.type === 'ALERT' ? 'bg-red-900 text-red-300' : 'bg-blue-900 text-blue-300'
                                                            }`}>
                                                            {notification.type}
                                                        </span>
                                                        <span className="text-xs text-gray-500">{new Date(notification.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                    <h4 className="font-bold text-sm">{notification.title}</h4>
                                                    <p className="text-xs text-gray-400 mt-1">{notification.message}</p>
                                                </div>
                                                <button
                                                    onClick={() => markNotificationAsRead(notification.id)}
                                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/20 rounded text-gray-400 hover:text-white transition-all"
                                                    title="標示為已讀"
                                                >
                                                    <Check size={14} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Top Selling Products */}
                            <div className="bg-black/40 border border-white/10 rounded-lg p-6">
                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <ShoppingBag className="text-mystic-gold" /> 熱銷經文排行
                                </h3>
                                <div className="space-y-3">
                                    {topProducts.map((product, index) => (
                                        <div key={index} className="flex justify-between items-center bg-white/5 p-3 rounded border-l-4 border-mystic-gold">
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl font-bold text-gray-600 w-6 text-center">{index + 1}</span>
                                                <div>
                                                    <div className="font-bold">{product.title}</div>
                                                    <div className="text-xs text-gray-400">已售出 {product.count} 筆</div>
                                                </div>
                                            </div>
                                            <div className="text-mystic-gold font-bold">
                                                NT$ {product.revenue.toLocaleString()}
                                            </div>
                                        </div>
                                    ))}
                                    {topProducts.length === 0 && <p className="text-gray-500 text-sm">目前尚無銷售數據</p>}
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-mystic-charcoal border border-white/10 rounded-sm p-6">
                            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
                                <div className="w-1 h-6 bg-mystic-gold"></div>
                                全站最新動態
                                <span className="text-[10px] bg-white/5 text-gray-500 px-2 py-0.5 rounded-full font-normal tracking-widest uppercase ml-auto">顯示最近 10 筆</span>
                            </h3>
                            <div className="overflow-x-auto -mx-6 px-6">
                                <table className="w-full text-left text-sm min-w-[600px]">
                                    <thead className="bg-black/20 text-gray-400 uppercase tracking-widest text-[10px]">
                                        <tr>
                                            <th className="p-4 whitespace-nowrap">時間</th>
                                            <th className="p-4 whitespace-nowrap">類型</th>
                                            <th className="p-4 whitespace-nowrap">對象 / 項目</th>
                                            <th className="p-4 whitespace-nowrap">金額</th>
                                            <th className="p-4 text-right whitespace-nowrap">狀態</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {recentActivities.length > 0 ? recentActivities.map(item => (
                                            <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                                                <td className="p-4 text-gray-400 text-xs">{new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-widest ${item.type === 'RITUAL' ? 'bg-mystic-gold/10 text-mystic-gold border border-mystic-gold/20' : 'bg-blue-900/20 text-blue-400 border border-blue-900/30'}`}>
                                                        {item.type === 'RITUAL' ? '法會報名' : '商城訂單'}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="font-bold text-white">{(item as any).name || '購買者'}</div>
                                                    <div className="text-xs text-gray-500 mt-0.5">{(item as any).serviceTitle || '數位商品'}</div>
                                                </td>
                                                <td className="p-4 font-mono text-mystic-gold">NT$ {item.amount.toLocaleString()}</td>
                                                <td className="p-4 text-right">
                                                    {item.type === 'RITUAL' ? (
                                                        <span className={`px-2 py-1 rounded text-[10px] ${(item as any).isProcessed ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                                                            {(item as any).isProcessed ? '已辦理' : '未辦理'}
                                                        </span>
                                                    ) : (
                                                        <span className={`px-2 py-1 rounded text-[10px] ${(item as any).status === 'PAID' ? 'bg-green-900/30 text-green-400' : 'bg-blue-900/30 text-blue-400'}`}>
                                                            {(item as any).status === 'PAID' ? '已付款' : '待付款'}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={5} className="p-8 text-center text-gray-500">目前尚無任何動態</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-6 flex justify-center gap-4">
                                <button onClick={() => setActiveTab('REGISTRATIONS')} className="text-[10px] text-gray-500 hover:text-mystic-gold transition-all uppercase tracking-[0.2em]">
                                    → 查看報名紀錄
                                </button>
                                <div className="w-px h-3 bg-white/10"></div>
                                <button onClick={() => setActiveTab('ORDERS')} className="text-[10px] text-gray-500 hover:text-mystic-gold transition-all uppercase tracking-[0.2em]">
                                    → 查看商城訂單
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- GENERAL SETTINGS TAB --- */}
                {activeTab === 'GENERAL' && (
                    <div className="bg-mystic-charcoal p-4 md:p-8 border border-white/5 rounded-sm shadow-xl max-w-4xl animate-fade-in-up">
                        {/* ... (Existing General Settings Code) ... */}


                        <div className="space-y-8 animate-fade-in-up">
                            {/* Basic Info */}
                            <div>
                                <h4 className="text-sm text-mystic-gold font-bold mb-4 uppercase tracking-widest border-l-2 border-mystic-gold pl-2">宮廟基本資訊</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-500 uppercase">宮廟名稱</label>
                                        <input className="w-full bg-black border border-white/10 p-3 text-white focus:border-mystic-gold outline-none" value={settingsForm.templeName} onChange={e => setSettingsForm({ ...settingsForm, templeName: e.target.value })} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-500 uppercase">聯絡電話</label>
                                        <input className="w-full bg-black border border-white/10 p-3 text-white focus:border-mystic-gold outline-none" value={settingsForm.phone} onChange={e => setSettingsForm({ ...settingsForm, phone: e.target.value })} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-500 uppercase">地址</label>
                                        <input className="w-full bg-black border border-white/10 p-3 text-white focus:border-mystic-gold outline-none" value={settingsForm.address} onChange={e => setSettingsForm({ ...settingsForm, address: e.target.value })} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-green-500 uppercase font-bold">LINE 官方帳號連結</label>
                                        <input className="w-full bg-black border border-green-900/50 p-3 text-green-400 focus:border-green-500 outline-none" value={settingsForm.lineUrl} onChange={e => setSettingsForm({ ...settingsForm, lineUrl: e.target.value })} placeholder="https://line.me/..." />
                                    </div>
                                </div>
                            </div>

                            {/* Hero Section */}
                            <div>
                                <h4 className="text-sm text-mystic-gold font-bold mb-4 uppercase tracking-widest border-l-2 border-mystic-gold pl-2">首頁主視覺 (Hero)</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-500 uppercase">主標題</label>
                                        <input className="w-full bg-black border border-white/10 p-3 text-white focus:border-mystic-gold outline-none" value={settingsForm.heroTitle} onChange={e => setSettingsForm({ ...settingsForm, heroTitle: e.target.value })} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-500 uppercase">副標題</label>
                                        <input className="w-full bg-black border border-white/10 p-3 text-white focus:border-mystic-gold outline-none" value={settingsForm.heroSubtitle} onChange={e => setSettingsForm({ ...settingsForm, heroSubtitle: e.target.value })} />
                                    </div>
                                    <div className="space-y-1 md:col-span-2">
                                        <label className="text-xs text-gray-500 uppercase">背景圖片連結 (URL)</label>
                                        <input className="w-full bg-black border border-white/10 p-3 text-white focus:border-mystic-gold outline-none" value={settingsForm.heroImage} onChange={e => setSettingsForm({ ...settingsForm, heroImage: e.target.value })} />
                                    </div>
                                </div>
                            </div>

                            {/* Deity Info */}
                            <div>
                                <h4 className="text-sm text-mystic-gold font-bold mb-4 uppercase tracking-widest border-l-2 border-mystic-gold pl-2">神尊介紹 (Deity Info)</h4>
                                <div className="grid grid-cols-1 gap-6">
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-500 uppercase">神像圖片連結 (URL)</label>
                                        <input className="w-full bg-black border border-white/10 p-3 text-white focus:border-mystic-gold outline-none" value={settingsForm.deityImage} onChange={e => setSettingsForm({ ...settingsForm, deityImage: e.target.value })} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-500 uppercase">主標題</label>
                                        <input className="w-full bg-black border border-white/10 p-3 text-white focus:border-mystic-gold outline-none" value={settingsForm.deityTitle} onChange={e => setSettingsForm({ ...settingsForm, deityTitle: e.target.value })} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-500 uppercase">傳奇緣起 (介紹內文)</label>
                                        <textarea rows={6} className="w-full bg-black border border-white/10 p-3 text-white focus:border-mystic-gold outline-none resize-none" value={settingsForm.deityIntro} onChange={e => setSettingsForm({ ...settingsForm, deityIntro: e.target.value })} />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-1">
                                            <label className="text-xs text-gray-500 uppercase">方塊 1：聖誕日期</label>
                                            <input className="w-full bg-black border border-white/10 p-3 text-white focus:border-mystic-gold outline-none" value={settingsForm.deityBirthday} onChange={e => setSettingsForm({ ...settingsForm, deityBirthday: e.target.value })} placeholder="例如：農曆六月十八" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs text-gray-500 uppercase">方塊 1：說明標籤</label>
                                            <input className="w-full bg-black border border-white/10 p-3 text-white focus:border-mystic-gold outline-none" value={settingsForm.deityBirthdayLabel} onChange={e => setSettingsForm({ ...settingsForm, deityBirthdayLabel: e.target.value })} placeholder="例如：聖誕千秋" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs text-gray-500 uppercase">方塊 2：職責</label>
                                            <input className="w-full bg-black border border-white/10 p-3 text-white focus:border-mystic-gold outline-none" value={settingsForm.deityDuty} onChange={e => setSettingsForm({ ...settingsForm, deityDuty: e.target.value })} placeholder="例如：消災 · 解厄" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs text-gray-500 uppercase">方塊 2：說明標籤</label>
                                            <input className="w-full bg-black border border-white/10 p-3 text-white focus:border-mystic-gold outline-none" value={settingsForm.deityDutyLabel} onChange={e => setSettingsForm({ ...settingsForm, deityDutyLabel: e.target.value })} placeholder="例如：專司職責" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* History Images & Text */}
                            <div>
                                <h4 className="text-sm text-mystic-gold font-bold mb-4 uppercase tracking-widest border-l-2 border-mystic-gold pl-2">宮廟沿革設定 (History Section)</h4>

                                {/* Roof Section */}
                                <div className="mb-6 border border-white/5 p-4 rounded bg-black/20">
                                    <h5 className="text-xs font-bold text-gray-400 mb-3 border-b border-white/5 pb-2">宮廟主神資訊</h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs text-gray-500 uppercase">主神聖像 (URL)</label>
                                            <input className="w-full bg-black border border-white/10 p-3 text-white focus:border-mystic-gold outline-none" value={settingsForm.historyImageRoof} onChange={e => setSettingsForm({ ...settingsForm, historyImageRoof: e.target.value })} />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-xs text-gray-500 uppercase">標題</label>
                                                <input className="w-full bg-black border border-white/10 p-3 text-white focus:border-mystic-gold outline-none" value={settingsForm.historyRoofTitle} onChange={e => setSettingsForm({ ...settingsForm, historyRoofTitle: e.target.value })} />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs text-gray-500 uppercase">描述</label>
                                                <input className="w-full bg-black border border-white/10 p-3 text-white focus:border-mystic-gold outline-none" value={settingsForm.historyRoofDesc} onChange={e => setSettingsForm({ ...settingsForm, historyRoofDesc: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Stone Section */}
                                <div className="border border-white/5 p-4 rounded bg-black/20">
                                    <h5 className="text-xs font-bold text-gray-400 mb-3 border-b border-white/5 pb-2">區塊 2：龍柱石雕</h5>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs text-gray-500 uppercase">圖片連結</label>
                                            <input className="w-full bg-black border border-white/10 p-3 text-white focus:border-mystic-gold outline-none" value={settingsForm.historyImageStone} onChange={e => setSettingsForm({ ...settingsForm, historyImageStone: e.target.value })} />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-xs text-gray-500 uppercase">標題</label>
                                                <input className="w-full bg-black border border-white/10 p-3 text-white focus:border-mystic-gold outline-none" value={settingsForm.historyStoneTitle} onChange={e => setSettingsForm({ ...settingsForm, historyStoneTitle: e.target.value })} />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs text-gray-500 uppercase">描述</label>
                                                <input className="w-full bg-black border border-white/10 p-3 text-white focus:border-mystic-gold outline-none" value={settingsForm.historyStoneDesc} onChange={e => setSettingsForm({ ...settingsForm, historyStoneDesc: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Timeline Sections */}
                                <div className="mt-6 space-y-6">
                                    <div className="border border-white/5 p-4 rounded bg-black/20">
                                        <h5 className="text-xs font-bold text-gray-400 mb-3 border-b border-white/5 pb-2">沿革時間軸 1 (草創)</h5>
                                        <div className="space-y-4">
                                            <div className="space-y-1">
                                                <label className="text-xs text-gray-500 uppercase">標題</label>
                                                <input className="w-full bg-black border border-white/10 p-3 text-white focus:border-mystic-gold outline-none" value={settingsForm.historyTitle1} onChange={e => setSettingsForm({ ...settingsForm, historyTitle1: e.target.value })} />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs text-gray-500 uppercase">內容</label>
                                                <textarea rows={3} className="w-full bg-black border border-white/10 p-3 text-white focus:border-mystic-gold outline-none resize-none" value={settingsForm.historyDesc1} onChange={e => setSettingsForm({ ...settingsForm, historyDesc1: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border border-white/5 p-4 rounded bg-black/20">
                                        <h5 className="text-xs font-bold text-gray-400 mb-3 border-b border-white/5 pb-2">沿革時間軸 2 (建廟)</h5>
                                        <div className="space-y-4">
                                            <div className="space-y-1">
                                                <label className="text-xs text-gray-500 uppercase">標題</label>
                                                <input className="w-full bg-black border border-white/10 p-3 text-white focus:border-mystic-gold outline-none" value={settingsForm.historyTitle2} onChange={e => setSettingsForm({ ...settingsForm, historyTitle2: e.target.value })} />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs text-gray-500 uppercase">內容</label>
                                                <textarea rows={3} className="w-full bg-black border border-white/10 p-3 text-white focus:border-mystic-gold outline-none resize-none" value={settingsForm.historyDesc2} onChange={e => setSettingsForm({ ...settingsForm, historyDesc2: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border border-white/5 p-4 rounded bg-black/20">
                                        <h5 className="text-xs font-bold text-gray-400 mb-3 border-b border-white/5 pb-2">沿革時間軸 3 (現代)</h5>
                                        <div className="space-y-4">
                                            <div className="space-y-1">
                                                <label className="text-xs text-gray-500 uppercase">標題</label>
                                                <input className="w-full bg-black border border-white/10 p-3 text-white focus:border-mystic-gold outline-none" value={settingsForm.historyTitle3} onChange={e => setSettingsForm({ ...settingsForm, historyTitle3: e.target.value })} />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs text-gray-500 uppercase">內容</label>
                                                <textarea rows={3} className="w-full bg-black border border-white/10 p-3 text-white focus:border-mystic-gold outline-none resize-none" value={settingsForm.historyDesc3} onChange={e => setSettingsForm({ ...settingsForm, historyDesc3: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>




                        <div className="mt-8 pt-6 border-t border-white/10 flex justify-end">
                            <button onClick={handleSaveSettings} className="bg-mystic-gold text-black px-8 py-3 rounded-sm font-bold hover:bg-white transition-all shadow-lg flex items-center gap-2">
                                <Save size={18} /> 儲存所有設定
                            </button>
                        </div>
                    </div>
                )}

                {/* --- GALLERY TAB --- */}
                {activeTab === 'GALLERY' && <GalleryManager />}

                {/* --- OTHER TABS CONTENT --- */}
                {activeTab !== 'GENERAL' && activeTab !== 'GALLERY' && activeTab !== 'DASHBOARD' && (
                    <>


                        {/* Edit/Add Form */}
                        {(editingId || isAdding) && (
                            <div className="bg-mystic-charcoal p-4 md:p-6 mb-8 border border-mystic-gold/30 animate-fade-in-up rounded-sm shadow-xl">
                                <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-4"><Info size={20} className="text-mystic-gold" /><h3 className="text-lg font-bold text-white">{isAdding ? '新增內容' : '編輯內容'}</h3></div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {activeTab === 'REGISTRATIONS' ? (
                                        <>
                                            <div className="space-y-1"><label className="text-xs text-gray-500 uppercase tracking-widest">信眾姓名</label><input className="w-full bg-black border border-white/10 p-3 text-white focus:border-mystic-gold outline-none" value={editForm.name || ''} onChange={e => setEditForm({ ...editForm, name: e.target.value })} /></div>
                                            <div className="space-y-1"><label className="text-xs text-gray-500 uppercase tracking-widest">電話號碼</label><input className="w-full bg-black border border-white/10 p-3 text-white focus:border-mystic-gold outline-none" value={editForm.phone || ''} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} /></div>
                                            <div className="space-y-1"><label className="text-xs text-gray-500 uppercase tracking-widest">點燈開始日期</label><input type="date" className="w-full bg-black border border-white/10 p-3 text-white focus:border-mystic-gold outline-none" value={editForm.lightStartDate ? String(editForm.lightStartDate).slice(0, 10) : ''} onChange={e => setEditForm({ ...editForm, lightStartDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })} /></div>
                                            <div className="space-y-1"><label className="text-xs text-gray-500 uppercase tracking-widest">點燈到期日期</label><input type="date" className="w-full bg-black border border-white/10 p-3 text-white focus:border-mystic-gold outline-none" value={editForm.lightExpireDate ? String(editForm.lightExpireDate).slice(0, 10) : ''} onChange={e => setEditForm({ ...editForm, lightExpireDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })} /></div>
                                            <div className="space-y-1"><label className="text-xs text-gray-500 uppercase tracking-widest">點燈天數</label><input type="number" min="1" className="w-full bg-black border border-white/10 p-3 text-white focus:border-mystic-gold outline-none" value={editForm.lightDurationDays || ''} onChange={e => setEditForm({ ...editForm, lightDurationDays: Math.max(1, parseInt(e.target.value) || 1) })} /></div>
                                            <label className="flex items-center gap-2 text-white pt-7"><input type="checkbox" checked={!!editForm.isProcessed} onChange={e => setEditForm({ ...editForm, isProcessed: e.target.checked })} /> 已確認並亮燈</label>
                                        </>
                                    ) : activeTab === 'EVENTS' ? (
                                        <>
                                            <div className="space-y-1"><label className="text-xs text-gray-500 uppercase tracking-widest">活動標題</label><input className="w-full bg-black border border-white/10 p-3 text-white focus:border-mystic-gold outline-none" value={editForm.title || ''} onChange={e => setEditForm({ ...editForm, title: e.target.value })} /></div>
                                            
                                            {/* Date Selection Mode Toggle */}
                                            <div className="flex items-center gap-4 mb-2 col-span-1">
                                                <button 
                                                    onClick={() => setEditForm({ ...editForm, isRange: false, endDate: null, lunarEndDate: null })}
                                                    className={`px-3 py-1.5 text-xs font-bold rounded border transition-all ${!editForm.isRange ? 'bg-mystic-gold text-black border-mystic-gold' : 'text-gray-400 border-white/10 hover:bg-white/5'}`}
                                                >
                                                    單日活動
                                                </button>
                                                <button 
                                                    onClick={() => setEditForm({ ...editForm, isRange: true, endDate: editForm.endDate || editForm.date })}
                                                    className={`px-3 py-1.5 text-xs font-bold rounded border transition-all ${editForm.isRange ? 'bg-mystic-gold text-black border-mystic-gold' : 'text-gray-400 border-white/10 hover:bg-white/5'}`}
                                                >
                                                    連續多日 (範圍)
                                                </button>
                                            </div>

                                            <div className={`grid grid-cols-1 ${editForm.isRange ? 'md:grid-cols-2' : ''} gap-4 md:col-span-2`}>
                                                <div className="space-y-1">
                                                    <label className="text-xs text-gray-500 uppercase tracking-widest">{editForm.isRange ? '開始日期' : '日期'}</label>
                                                    <input 
                                                        type="date" 
                                                        className="w-full bg-black border border-white/10 p-3 text-white focus:border-mystic-gold outline-none" 
                                                        value={editForm.date ? editForm.date.replace(/\./g, '-') : ''} 
                                                        onChange={e => {
                                                            const newDate = e.target.value;
                                                            const solar = Solar.fromDate(new Date(newDate));
                                                            const lunar = solar.getLunar();
                                                            const lunarStr = `${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`;
                                                            
                                                            let updates: any = { 
                                                                date: newDate.replace(/-/g, '.'),
                                                                lunarDate: lunarStr
                                                            };
                                                            
                                                            // If it's a range and endDate is empty or before new startDate, sync them
                                                            if (editForm.isRange && (!editForm.endDate || editForm.endDate < newDate)) {
                                                                updates.endDate = newDate.replace(/-/g, '.');
                                                                updates.lunarEndDate = lunarStr;
                                                            }
                                                            
                                                            setEditForm({ ...editForm, ...updates });
                                                        }} 
                                                    />
                                                </div>

                                                {editForm.isRange && (
                                                    <div className="space-y-1">
                                                        <label className="text-xs text-gray-500 uppercase tracking-widest">結束日期</label>
                                                        <input 
                                                            type="date" 
                                                            className="w-full bg-black border border-white/10 p-3 text-white focus:border-mystic-gold outline-none" 
                                                            min={editForm.date ? editForm.date.replace(/\./g, '-') : ''}
                                                            value={editForm.endDate ? editForm.endDate.replace(/\./g, '-') : ''} 
                                                            onChange={e => {
                                                                const newDate = e.target.value;
                                                                const solar = Solar.fromDate(new Date(newDate));
                                                                const lunar = solar.getLunar();
                                                                const lunarStr = `${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`;
                                                                
                                                                setEditForm({ 
                                                                    ...editForm, 
                                                                    endDate: newDate.replace(/-/g, '.'),
                                                                    lunarEndDate: lunarStr
                                                                });
                                                            }} 
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            <div className={`grid grid-cols-1 ${editForm.isRange ? 'md:grid-cols-2' : ''} gap-4 md:col-span-2 shadow-inner bg-black/20 p-4 rounded border border-white/5`}>
                                                <div className="space-y-1">
                                                    <label className="text-xs text-gray-500 uppercase tracking-widest">{editForm.isRange ? '農曆開始' : '農曆日期'}</label>
                                                    <input className="w-full bg-black border border-white/10 p-3 text-white focus:border-mystic-gold outline-none" value={editForm.lunarDate || ''} onChange={e => setEditForm({ ...editForm, lunarDate: e.target.value })} placeholder="例如: 九月十五" />
                                                </div>
                                                {editForm.isRange && (
                                                    <div className="space-y-1">
                                                        <label className="text-xs text-gray-500 uppercase tracking-widest">農曆結束</label>
                                                        <input className="w-full bg-black border border-white/10 p-3 text-white focus:border-mystic-gold outline-none" value={editForm.lunarEndDate || ''} onChange={e => setEditForm({ ...editForm, lunarEndDate: e.target.value })} placeholder="例如: 九月十七" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-1"><label className="text-xs text-gray-500 uppercase tracking-widest">時間 (Time)</label><input type="time" className="w-full bg-black border border-white/10 p-3 text-white focus:border-mystic-gold outline-none" value={editForm.time || ''} onChange={e => setEditForm({ ...editForm, time: e.target.value })} /></div>
                                            <div className="space-y-1"><label className="text-xs text-gray-500 uppercase tracking-widest">類別</label><select className="w-full bg-black border border-white/10 p-3 text-white focus:border-mystic-gold outline-none" value={editForm.type || 'FESTIVAL'} onChange={e => setEditForm({ ...editForm, type: e.target.value })}><option value="FESTIVAL">慶典</option><option value="RITUAL">科儀</option><option value="SERVICE">服務</option></select></div>
                                            <div className="space-y-1 md:col-span-2"><label className="text-xs text-gray-500 uppercase tracking-widest">詳情</label><textarea rows={4} className="w-full bg-black border border-white/10 p-3 text-white focus:border-mystic-gold outline-none" value={editForm.description || ''} onChange={e => setEditForm({ ...editForm, description: e.target.value })} /></div>

                                            {/* Field Config for Events */}
                                            <div className="md:col-span-2 bg-black/40 p-4 border border-white/10 rounded">
                                                <h5 className="text-xs text-mystic-gold uppercase tracking-widest font-bold mb-3 border-b border-white/10 pb-2">表單欄位設定</h5>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    {[{ key: 'showBirth', label: '農曆生辰' }, { key: 'showTime', label: '出生時辰' }, { key: 'showAddress', label: '通訊地址' }, { key: 'showIdNumber', label: '身分證字號' }, { key: 'showGender', label: '顯示性別' }].map(field => {
                                                        const config = editForm.fieldConfig || {};
                                                        return (
                                                            <div key={field.key} className="flex flex-col gap-2">
                                                                <span className="text-xs text-gray-400">{field.label}</span>
                                                                <div
                                                                    onClick={() => setEditForm({ ...editForm, fieldConfig: { ...config, [field.key]: !config[field.key] } })}
                                                                    className={`w-10 h-6 rounded-full cursor-pointer transition-colors p-1 ${config[field.key] ? 'bg-green-600' : 'bg-gray-700'}`}
                                                                >
                                                                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${config[field.key] ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </>
                                    ) : activeTab === 'SERVICES' ? (
                                        <>
                                            <div className="space-y-1"><label className="text-xs text-gray-500 uppercase tracking-widest">服務名稱</label><input className="w-full bg-black border border-white/10 p-3 text-white" value={editForm.title || ''} onChange={e => setEditForm({ ...editForm, title: e.target.value })} /></div>
                                            <div className="space-y-1"><label className="text-xs text-gray-500 uppercase tracking-widest">價格</label><input className="w-full bg-black border border-white/10 p-3 text-white" type="number" value={editForm.price || ''} onChange={e => setEditForm({ ...editForm, price: parseInt(e.target.value) })} /></div>
                                            <div className="space-y-1"><label className="text-xs text-gray-500 uppercase tracking-widest">類別</label><select className="w-full bg-black border border-white/10 p-3 text-white focus:border-mystic-gold outline-none" value={editForm.type || 'LIGHT'} onChange={e => setEditForm({ ...editForm, type: e.target.value })}><option value="LIGHT">點燈 (Light)</option><option value="RITUAL">科儀 (Ritual)</option><option value="DONATION">捐獻 (Donation)</option></select></div>
                                            {(editForm.type || 'LIGHT') === 'LIGHT' && (
                                                <div className="space-y-1">
                                                    <label className="text-xs text-gray-500 uppercase tracking-widest">點燈有效天數</label>
                                                    <input className="w-full bg-black border border-white/10 p-3 text-white" type="number" min="1" value={editForm.lightDurationDays || 30} onChange={e => setEditForm({ ...editForm, lightDurationDays: Math.max(1, parseInt(e.target.value) || 30) })} />
                                                </div>
                                            )}

                                            {/* Field Config for Services */}
                                            <div className="md:col-span-2 bg-black/40 p-4 border border-white/10 rounded">
                                                <h5 className="text-xs text-mystic-gold uppercase tracking-widest font-bold mb-3 border-b border-white/10 pb-2">表單欄位設定</h5>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    {[{ key: 'showBirth', label: '農曆生辰' }, { key: 'showTime', label: '出生時辰' }, { key: 'showAddress', label: '通訊地址' }, { key: 'showIdNumber', label: '身分證字號' }, { key: 'showGender', label: '顯示性別' }].map(field => {
                                                        const config = editForm.fieldConfig || {};
                                                        return (
                                                            <div key={field.key} className="flex flex-col gap-2">
                                                                <span className="text-xs text-gray-400">{field.label}</span>
                                                                <div
                                                                    onClick={() => setEditForm({ ...editForm, fieldConfig: { ...config, [field.key]: !config[field.key] } })}
                                                                    className={`w-10 h-6 rounded-full cursor-pointer transition-colors p-1 ${config[field.key] ? 'bg-green-600' : 'bg-gray-700'}`}
                                                                >
                                                                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${config[field.key] ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            <div className="md:col-span-2 bg-black/40 p-4 border border-white/10 rounded">
                                                <h5 className="text-xs text-mystic-gold uppercase tracking-widest font-bold mb-3 border-b border-white/10 pb-2">{`\u6703\u54e1\u4e2d\u5fc3\u986f\u793a\u63a7\u5236`}</h5>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <label className="text-xs text-gray-500 uppercase tracking-widest">{`\u672c\u5bae\u76f8\u95dc\u670d\u52d9\u4f4d\u7f6e`}</label>
                                                        <select
                                                            className="w-full bg-black border border-white/10 p-3 text-white focus:border-mystic-gold outline-none"
                                                            value={editForm.fieldConfig?.memberFortuneRole || ''}
                                                            onChange={e => {
                                                                const config = editForm.fieldConfig || {};
                                                                setEditForm({ ...editForm, fieldConfig: { ...config, memberFortuneRole: e.target.value as any } });
                                                            }}
                                                        >
                                                            <option value="">{`\u4e0d\u986f\u793a\u5728\u6703\u54e1\u4e2d\u5fc3`}</option>
                                                            <option value="taisui">{`\u5b89\u592a\u6b72\u71c8`}</option>
                                                            <option value="light">{`\u5149\u660e\u71c8 / \u5e73\u5b89\u71c8`}</option>
                                                            <option value="ritual">{`\u5236\u89e3 / \u796d\u6539`}</option>
                                                        </select>
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        <span className="text-xs text-gray-400">{`\u4f5c\u70ba\u7d05\u8272\u5b89\u592a\u6b72\u63a8\u85a6\u5340\u584a`}</span>
                                                        <div
                                                            onClick={() => {
                                                                const config = editForm.fieldConfig || {};
                                                                setEditForm({ ...editForm, fieldConfig: { ...config, memberTaiSuiRecommended: !config.memberTaiSuiRecommended } });
                                                            }}
                                                            className={`w-10 h-6 rounded-full cursor-pointer transition-colors p-1 ${editForm.fieldConfig?.memberTaiSuiRecommended ? 'bg-green-600' : 'bg-gray-700'}`}
                                                        >
                                                            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${editForm.fieldConfig?.memberTaiSuiRecommended ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                                        </div>
                                                        <p className="text-xs text-gray-500">{`\u958b\u555f\u5f8c\uff0c\u6703\u54e1\u4e2d\u5fc3\u72af\u592a\u6b72\u6642\u6703\u7528\u6b64\u670d\u52d9\u986f\u793a\u7d05\u8272\u63a8\u85a6\u3002`}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    ) : activeTab === 'NEWS' ? (
                                        <>
                                            <div className="space-y-1 md:col-span-2"><label className="text-xs text-gray-500 uppercase tracking-widest">標題</label><input className="w-full bg-black border border-white/10 p-3 text-white focus:border-mystic-gold outline-none" value={editForm.title || ''} onChange={e => setEditForm({ ...editForm, title: e.target.value })} /></div>
                                            <div className="space-y-1"><label className="text-xs text-gray-500 uppercase tracking-widest">日期</label><input type="date" className="w-full bg-black border border-white/10 p-3 text-white focus:border-mystic-gold outline-none" value={editForm.date ? editForm.date.replace(/\./g, '-') : ''} onChange={e => setEditForm({ ...editForm, date: e.target.value.replace(/-/g, '.') })} /></div>
                                            <div className="space-y-1"><label className="text-xs text-gray-500 uppercase tracking-widest">分類</label><select className="w-full bg-black border border-white/10 p-3 text-white focus:border-mystic-gold outline-none" value={editForm.category || '公告'} onChange={e => setEditForm({ ...editForm, category: e.target.value })}><option value="公告">公告</option><option value="法會">法會</option><option value="慈善">慈善</option></select></div>
                                        </>
                                    ) : activeTab === 'ORG' ? (
                                        <>
                                            <div className="space-y-1"><label className="text-xs text-gray-500 uppercase tracking-widest">人員姓名</label><input className="w-full bg-black border border-white/10 p-3 text-white focus:border-mystic-gold outline-none" value={editForm.name || ''} onChange={e => setEditForm({ ...editForm, name: e.target.value })} /></div>
                                            <div className="space-y-1"><label className="text-xs text-gray-500 uppercase tracking-widest">職位名稱</label><input className="w-full bg-black border border-white/10 p-3 text-white focus:border-mystic-gold outline-none" value={editForm.title || ''} onChange={e => setEditForm({ ...editForm, title: e.target.value })} /></div>
                                            <div className="space-y-1"><label className="text-xs text-gray-500 uppercase tracking-widest">照片連結</label><input className="w-full bg-black border border-white/10 p-3 text-white focus:border-mystic-gold outline-none" value={editForm.image || ''} onChange={e => setEditForm({ ...editForm, image: e.target.value })} /></div>
                                            <div className="space-y-1"><label className="text-xs text-gray-500 uppercase tracking-widest">組織層級</label><select className="w-full bg-black border border-white/10 p-3 text-white focus:border-mystic-gold outline-none" value={editForm.category || 'STAFF'} onChange={e => setEditForm({ ...editForm, category: e.target.value })}><option value="LEADER">宮主 (第一層)</option><option value="EXECUTIVE">幹事/委員 (第二層)</option><option value="STAFF">執事/志工 (第三層)</option></select></div>
                                        </>
                                    ) : activeTab === 'FAQS' ? (
                                        <>
                                            <div className="space-y-1 md:col-span-2"><label className="text-xs text-gray-500 uppercase tracking-widest">問題 (Question)</label><input className="w-full bg-black border border-white/10 p-3 text-white focus:border-mystic-gold outline-none" value={editForm.question || ''} onChange={e => setEditForm({ ...editForm, question: e.target.value })} /></div>
                                            <div className="space-y-1 md:col-span-2"><label className="text-xs text-gray-500 uppercase tracking-widest">解答 (Answer)</label><textarea rows={5} className="w-full bg-black border border-white/10 p-3 text-white focus:border-mystic-gold outline-none" value={editForm.answer || ''} onChange={e => setEditForm({ ...editForm, answer: e.target.value })} /></div>
                                        </>
                                    ) : activeTab === 'ANNOUNCEMENTS' ? (
                                        <>
                                            <div className="space-y-1 md:col-span-2"><label className="text-xs text-gray-500 uppercase tracking-widest">跑馬燈公告文字</label><input className="w-full bg-black border border-white/10 p-3 text-white focus:border-mystic-gold outline-none" value={editForm.content || ''} onChange={e => setEditForm({ ...editForm, content: e.target.value })} /></div>
                                            <div className="space-y-1 md:col-span-2"><label className="text-xs text-gray-500 uppercase tracking-widest">連結網址 (選填)</label><input className="w-full bg-black border border-white/10 p-3 text-white focus:border-mystic-gold outline-none" placeholder="例如: https://mingle.com/" value={editForm.link || ''} onChange={e => setEditForm({ ...editForm, link: e.target.value })} /></div>
                                            <div className="space-y-1"><label className="text-xs text-gray-500 uppercase tracking-widest">排列優先度 (數字越大越前)</label><input type="number" className="w-full bg-black border border-white/10 p-3 text-white focus:border-mystic-gold outline-none" value={editForm.priority || 0} onChange={e => setEditForm({ ...editForm, priority: parseInt(e.target.value) || 0 })} /></div>
                                            <div className="space-y-1 flex items-center pt-6"><label className="flex items-center gap-2 text-white cursor-pointer"><input type="checkbox" className="w-5 h-5 bg-black border-white/10 text-mystic-gold focus:ring-mystic-gold" checked={editForm.is_active !== false} onChange={e => setEditForm({ ...editForm, is_active: e.target.checked })} />啟用此公告</label></div>
                                        </>
                                    ) : activeTab === 'SCRIPTURES' ? (
                                        <div className="md:col-span-2 space-y-8 bg-mystic-charcoal text-white p-8 rounded-lg border border-white/10 shadow-2xl">
                                            <div className="space-y-4">
                                                <div className="space-y-1">
                                                    <label className="text-xs text-gray-500 uppercase tracking-widest">標題 (必填)</label>
                                                    <input className="w-full bg-black border border-white/10 p-3 text-white focus:border-mystic-gold outline-none transition-all" value={editForm.title || ''} onChange={e => setEditForm({ ...editForm, title: e.target.value })} placeholder="輸入經文標題" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs text-gray-500 uppercase tracking-widest">作者 (選項)</label>
                                                    <input className="w-full bg-black border border-white/10 p-3 text-white focus:border-mystic-gold outline-none transition-all" value={editForm.author || ''} onChange={e => setEditForm({ ...editForm, author: e.target.value })} placeholder="輸入作者名稱" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs text-gray-500 uppercase tracking-widest">費用 (NT$)</label>
                                                    <input type="number" className="w-full bg-black border border-white/10 p-3 text-white focus:border-mystic-gold outline-none transition-all" value={editForm.price || 0} onChange={e => setEditForm({ ...editForm, price: parseInt(e.target.value) || 0 })} placeholder="請輸入金額 (0 表示免費)" />
                                                </div>

                                                {/* Tags Input */}
                                                <div className="space-y-1">
                                                    <label className="text-xs text-gray-500 uppercase tracking-widest">標籤 (以逗號分隔)</label>
                                                    <input
                                                        className="w-full bg-black border border-white/10 p-3 text-white focus:border-mystic-gold outline-none transition-all"
                                                        value={editForm.tags ? editForm.tags.join(', ') : ''}
                                                        onChange={e => setEditForm({ ...editForm, tags: e.target.value.split(/[,，]/).map((t: string) => t.trim()).filter(Boolean) })}
                                                        placeholder="例如: 經文, 祈福, 消災"
                                                    />
                                                </div>

                                                {/* Promotion Settings */}
                                                <div className="bg-black/20 p-4 rounded border border-white/5 space-y-4">
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            type="checkbox"
                                                            id="isLimitedTime"
                                                            className="w-4 h-4 rounded border-gray-600 bg-black text-mystic-gold focus:ring-mystic-gold cursor-pointer"
                                                            checked={editForm.isLimitedTime || false}
                                                            onChange={e => setEditForm({ ...editForm, isLimitedTime: e.target.checked })}
                                                        />
                                                        <label htmlFor="isLimitedTime" className="text-sm font-bold text-gray-300 select-none cursor-pointer">設定為限時商品</label>
                                                    </div>

                                                    {editForm.isLimitedTime && (
                                                        <div className="space-y-1 animate-fade-in">
                                                            <label className="text-xs text-mystic-gold uppercase tracking-widest">截止時間</label>
                                                            <input
                                                                type="datetime-local"
                                                                className="w-full bg-black border border-mystic-gold/50 p-3 text-white focus:border-mystic-gold outline-none"
                                                                value={editForm.promotionEndDate ? new Date(editForm.promotionEndDate).toISOString().slice(0, 16) : ''}
                                                                onChange={e => setEditForm({ ...editForm, promotionEndDate: new Date(e.target.value).toISOString() })}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs text-gray-500 uppercase tracking-widest">內文 (支援 Markdown 語法)</label>

                                                    {/* Markdown / Preview Toggle */}
                                                    <div className="flex gap-2 mb-2 border-b border-white/10">
                                                        <button
                                                            type="button"
                                                            onClick={() => setPreviewMode(false)}
                                                            className={`text-xs px-4 py-2 rounded-t font-bold transition-colors ${!previewMode ? 'bg-mystic-gold text-black' : 'text-gray-400 hover:text-white'}`}
                                                        >
                                                            編輯 (Markdown)
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setPreviewMode(true)}
                                                            className={`text-xs px-4 py-2 rounded-t font-bold transition-colors ${previewMode ? 'bg-mystic-gold text-black' : 'text-gray-400 hover:text-white'}`}
                                                        >
                                                            預覽結果
                                                        </button>
                                                    </div>

                                                    {!previewMode ? (
                                                        <div className="space-y-2">
                                                            {/* Markdown Toolbar */}
                                                            <div className="flex flex-wrap gap-2 text-[10px] text-gray-400 bg-white/5 p-3 rounded border border-white/10">
                                                                <div className="flex gap-1 pr-2 border-r border-white/10">
                                                                    <button type="button" onClick={() => handleInsert('# ', '')} className="hover:text-white px-2 py-1 rounded bg-black/40">標題1</button>
                                                                    <button type="button" onClick={() => handleInsert('## ', '')} className="hover:text-white px-2 py-1 rounded bg-black/40">標題2</button>
                                                                    <button type="button" onClick={() => handleInsert('### ', '')} className="hover:text-white px-2 py-1 rounded bg-black/40">標題3</button>
                                                                </div>
                                                                <div className="flex gap-1 pr-2 border-r border-white/10">
                                                                    <button type="button" onClick={() => handleInsert('**', '**')} className="hover:text-white px-2 py-1 rounded bg-black/40 font-bold">粗體</button>
                                                                    <button type="button" onClick={() => handleInsert('*', '*')} className="hover:text-white px-2 py-1 rounded bg-black/40 italic">斜體</button>
                                                                    <button type="button" onClick={() => handleInsert('~~', '~~')} className="hover:text-white px-2 py-1 rounded bg-black/40 line-through">刪除線</button>
                                                                </div>
                                                                <div className="flex gap-1 pr-2 border-r border-white/10">
                                                                    <button type="button" onClick={() => handleInsert('> ', '\n')} className="hover:text-white px-2 py-1 rounded bg-black/40">引用</button>
                                                                    <button type="button" onClick={() => handleInsert('`', '`')} className="hover:text-white px-2 py-1 rounded bg-black/40">代碼</button>
                                                                    <button type="button" onClick={() => handleInsert('```\n', '\n```')} className="hover:text-white px-2 py-1 rounded bg-black/40">區塊</button>
                                                                </div>
                                                                <div className="flex gap-1 pr-2 border-r border-white/10">
                                                                    <button type="button" onClick={() => handleInsert('- ', '\n')} className="hover:text-white px-2 py-1 rounded bg-black/40">列表</button>
                                                                    <button type="button" onClick={() => handleInsert('1. ', '\n')} className="hover:text-white px-2 py-1 rounded bg-black/40">編號</button>
                                                                    <button type="button" onClick={() => handleInsert('- [ ] ', '\n')} className="hover:text-white px-2 py-1 rounded bg-black/40">待辦</button>
                                                                </div>
                                                                <div className="flex gap-1">
                                                                    <button type="button" onClick={() => handleInsert('[標題](連結网址)', '')} className="hover:text-white px-2 py-1 rounded bg-black/40">連結</button>
                                                                    <button type="button" onClick={() => handleInsert('![](', ')')} className="hover:text-white px-2 py-1 rounded bg-black/40">圖片</button>
                                                                    <button type="button" onClick={() => handleInsert('---\n', '')} className="hover:text-white px-2 py-1 rounded bg-black/40">分隔線</button>
                                                                    <button type="button" onClick={() => handleInsert('| 標題1 | 標題2 |\n|---|---|\n| 內容1 | 內容2 |', '')} className="hover:text-white px-2 py-1 rounded bg-black/40">表格</button>
                                                                </div>
                                                            </div>
                                                            <textarea
                                                                ref={textareaRef}
                                                                id="scripture-content-editor"
                                                                rows={18}
                                                                className="w-full bg-black border border-white/10 p-4 text-white focus:border-mystic-gold outline-none transition-all font-mono text-sm leading-relaxed"
                                                                value={editForm.content || ''}
                                                                onChange={e => setEditForm({ ...editForm, content: e.target.value })}
                                                                placeholder="# 在此輸入標題&#10;您可以使用上方工具列快速插入語法...&#10;&#10;**粗體重點**&#10;> 這是引用區塊"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="w-full bg-white text-black p-8 rounded min-h-[400px] overflow-y-auto">
                                                            <article className="prose prose-lg max-w-none">
                                                                <ReactMarkdown
                                                                    rehypePlugins={[rehypeRaw]}
                                                                    components={{
                                                                        code: CodeBlock
                                                                    }}
                                                                >
                                                                    {editForm.content || '*無內容*'}
                                                                </ReactMarkdown>
                                                            </article>
                                                        </div>
                                                    )}
                                                    <p className="text-[10px] text-gray-500 mt-2">* 提示：支援 Markdown 語法，右側可切換預覽模式查看實際排版效果。</p>
                                                </div>
                                            </div>

                                            <div className="pt-6 border-t border-white/10">
                                                <h4 className="text-xs text-gray-500 uppercase tracking-widest mb-4">上傳圖片到經文</h4>
                                                <div className="flex flex-col gap-4 bg-black/40 p-6 rounded border border-white/5">
                                                    <div className="flex items-center gap-4">
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-mystic-gold/10 file:text-mystic-gold hover:file:bg-mystic-gold/20 cursor-pointer"
                                                            onChange={async (e) => {
                                                                const file = e.target.files?.[0];
                                                                if (!file) return;
                                                                try {
                                                                    const fileName = `${Date.now()}_${file.name}`;
                                                                    const { data, error } = await supabase.storage.from('scriptures').upload(`previews/${fileName}`, file);
                                                                    if (error) throw error;
                                                                    const { data: { publicUrl } } = supabase.storage.from('scriptures').getPublicUrl(data.path);
                                                                    const imgHtml = `\n<img src="${publicUrl}" alt="${file.name}" style="max-width: 100%; height: auto; display: block; margin: 10px auto;" />\n`;
                                                                    setEditForm({ ...editForm, content: (editForm.content || '') + imgHtml });
                                                                    alert('圖片上傳成功並已插入內文末端');
                                                                } catch (err: any) {
                                                                    alert(`上傳失敗: ${err.message}`);
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                    <p className="text-[10px] text-gray-500 italic">上傳成功後，會自動將圖片 HTML 插入到上方「內文」欄位的最末端。</p>
                                                </div>
                                            </div>

                                            <div className="pt-6 border-t border-white/10">
                                                <h4 className="text-xs text-gray-500 uppercase tracking-widest mb-4">附件管理</h4>
                                                <div className="space-y-4">
                                                    {(editForm.attachments || []).map((att: any, idx: number) => (
                                                        <div key={att.id || idx} className="flex items-center gap-3 bg-black/40 p-3 rounded border border-white/5">
                                                            <div className="flex-1">
                                                                <input className="w-full bg-transparent border-none text-sm font-bold text-white focus:ring-0" value={att.name} onChange={e => {
                                                                    const newAtts = [...(editForm.attachments || [])];
                                                                    newAtts[idx].name = e.target.value;
                                                                    setEditForm({ ...editForm, attachments: newAtts });
                                                                }} />
                                                                <div className="text-[10px] text-gray-500 truncate">{att.url}</div>
                                                            </div>
                                                            <button onClick={() => {
                                                                const newAtts = (editForm.attachments || []).filter((_: any, i: number) => i !== idx);
                                                                setEditForm({ ...editForm, attachments: newAtts });
                                                            }} className="text-red-400 hover:bg-red-400/10 p-2 rounded transition-colors"><Trash2 size={16} /></button>
                                                        </div>
                                                    ))}
                                                    <button
                                                        onClick={() => {
                                                            const fileInput = document.createElement('input');
                                                            fileInput.type = 'file';
                                                            fileInput.onchange = async (e: any) => {
                                                                const file = e.target.files?.[0];
                                                                if (!file) return;
                                                                try {
                                                                    const fileName = `${Date.now()}_${file.name}`;
                                                                    const { data, error } = await supabase.storage.from('scriptures').upload(`docs/${fileName}`, file);
                                                                    if (error) throw error;
                                                                    const { data: { publicUrl } } = supabase.storage.from('scriptures').getPublicUrl(data.path);
                                                                    const newAtt = { id: Date.now().toString(), name: file.name, url: publicUrl, type: file.type };
                                                                    setEditForm({ ...editForm, attachments: [...(editForm.attachments || []), newAtt] });
                                                                } catch (err: any) {
                                                                    alert(`上傳失敗: ${err.message}`);
                                                                }
                                                            };
                                                            fileInput.click();
                                                        }}
                                                        className="w-full py-3 border-2 border-dashed border-white/10 rounded-lg text-gray-500 font-bold hover:border-mystic-gold hover:text-mystic-gold transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <Plus size={18} /> 新增附件
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="space-y-1"><label className="text-xs text-gray-500 uppercase tracking-widest">標題/名稱</label><input className="w-full bg-black border border-white/10 p-3 text-white focus:border-mystic-gold outline-none" value={editForm.title || editForm.name || ''} onChange={e => setEditForm({ ...editForm, title: e.target.value })} /></div>
                                            <div className="space-y-1"><label className="text-xs text-gray-500 uppercase tracking-widest">連結/路徑</label><input className="w-full bg-black border border-white/10 p-3 text-white focus:border-mystic-gold outline-none" value={editForm.url || editForm.image || ''} onChange={e => setEditForm({ ...editForm, url: e.target.value })} /></div>
                                        </>
                                    )}
                                </div>
                                <div className="flex gap-3 mt-8 pt-6 border-t border-white/10">
                                    <button onClick={handleSave} disabled={isSaving} className="bg-mystic-gold text-black px-8 py-3 rounded-sm font-bold hover:bg-white transition-all shadow-lg disabled:opacity-50 flex items-center gap-2">
                                        {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                        儲存變更
                                    </button>
                                    <button onClick={() => { setEditingId(null); setIsAdding(false); setEditForm({}); }} className="bg-gray-800 text-white px-8 py-3 rounded-sm hover:bg-gray-700 transition-all">取消</button>
                                </div>
                            </div>
                        )}

                        {/* Data Table */}
                        {activeTab === 'REGISTRATIONS' && (
                            <div className="flex flex-col gap-4 mb-4 bg-white/5 p-4 rounded border border-white/10">
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                                        {/* Event Filter */}
                                        <div className="flex items-center gap-2 w-full md:w-auto">
                                            <label className="text-xs text-gray-400 uppercase font-bold whitespace-nowrap">篩選：</label>
                                            <select
                                                className="flex-1 md:flex-none bg-black border border-white/20 text-white text-sm p-2 rounded outline-none focus:border-mystic-gold"
                                                value={selectedEventFilter}
                                                onChange={(e) => setSelectedEventFilter(e.target.value)}
                                            >
                                                <option value="ALL">全部活動</option>
                                                {uniqueEventTitles.map(title => (
                                                    <option key={title} value={title}>{title}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Search Box */}
                                        <div className="relative w-full md:w-auto">
                                            <input
                                                type="text"
                                                placeholder="搜尋姓名/電話..."
                                                className="w-full md:w-48 bg-black border border-white/20 text-white text-sm p-2 pl-8 rounded outline-none focus:border-mystic-gold"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                            <Briefcase size={14} className="absolute left-2.5 top-3 text-gray-500" />
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                                        {selectedItems.size > 0 && (
                                            <button
                                                onClick={handleBatchDelete}
                                                className="flex-1 md:flex-none justify-center bg-red-900/80 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2 hover:bg-red-800 transition-colors animate-fade-in"
                                            >
                                                <Trash2 size={16} /> 刪除 ({selectedItems.size})
                                            </button>
                                        )}
                                        <button
                                            onClick={handleExportCSV}
                                            className="flex-1 md:flex-none justify-center bg-green-800 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2 hover:bg-green-700 transition-colors"
                                        >
                                            <FileText size={16} /> 匯出名單
                                        </button>
                                    </div>
                                </div>

                                {/* Bottom Row: Stats */}
                                <div className="text-xs text-gray-500 flex justify-between items-center bg-black/20 p-2 rounded">
                                    <span>顯示搜尋結果: {filteredActiveData.length} 筆資料 (共 {registrations.length} 筆)</span>
                                    <span>已選取: {selectedItems.size} 筆</span>
                                </div>
                            </div>
                        )}

                        {activeTab === 'REGISTRATIONS' && (
                            <div className="bg-mystic-charcoal rounded overflow-hidden border border-white/5 shadow-2xl flex flex-col min-h-[500px]">
                                <div className="flex-1 overflow-x-auto">
                                    <table className="w-full text-left text-sm min-w-[700px]">
                                        <thead className="bg-white/5 text-gray-400 uppercase tracking-widest text-[10px]">
                                            <tr>
                                                <th className="p-4 w-10">
                                                    <input
                                                        type="checkbox"
                                                        className="cursor-pointer"
                                                        checked={filteredActiveData.length > 0 && selectedItems.size === filteredActiveData.length}
                                                        onChange={handleSelectAll}
                                                    />
                                                </th>
                                                <th className="p-4 whitespace-nowrap">信眾項目</th>
                                                <th className="p-4 whitespace-nowrap">性別</th>
                                                <th className="p-4 whitespace-nowrap">金額</th>
                                                <th className="p-4 whitespace-nowrap">匯款末五碼</th>
                                                <th className="p-4 whitespace-nowrap">處理狀態</th>
                                                <th className="p-4 text-right whitespace-nowrap">操作</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {paginatedRegistrations.map(reg => (
                                                <tr key={reg.id} className={`hover:bg-white/5 ${selectedItems.has(reg.id) ? 'bg-white/5' : ''}`}>
                                                    <td className="p-4">
                                                        <input
                                                            type="checkbox"
                                                            className="cursor-pointer"
                                                            checked={selectedItems.has(reg.id)}
                                                            onChange={() => handleSelectOne(reg.id)}
                                                        />
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="font-bold text-white">{reg.name}</div>
                                                        <div className="text-xs text-gray-400">{reg.phone}</div>
                                                        <div className="text-xs text-mystic-gold">{reg.serviceTitle}</div>
                                                        {reg.isProcessed && reg.lightExpireDate && (
                                                            <div className="text-[10px] text-yellow-400 mt-1">點燈到期：{new Date(reg.lightExpireDate).toLocaleDateString('zh-TW')}</div>
                                                        )}
                                                    </td>
                                                    <td className="p-4">
                                                        {reg.gender === 'F' ? <span className="text-pink-400 font-bold">女</span> : <span className="text-blue-400 font-bold">男</span>}
                                                    </td>
                                                    <td className="p-4 text-mystic-gold font-bold">NT$ {reg.amount}</td>
                                                    <td className="p-4 text-gray-300 font-mono">{reg.bankLastFive || '-'}</td>
                                                    <td className="p-4"><button onClick={() => handleToggleStatus(reg)} className={`flex items-center gap-2 px-3 py-1 rounded-full border ${reg.isProcessed ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'}`}>{reg.isProcessed ? '已圓滿' : '未辦理'}</button></td>
                                                    <td className="p-4 text-right flex justify-end gap-2"><button onClick={() => handlePrintReceipt(reg)} className="p-2 bg-gray-700 rounded"><Printer size={16} /></button><button onClick={() => handleEdit(reg)} className="p-2 bg-blue-900/20 text-blue-400 rounded"><Edit size={16} /></button><button onClick={() => handleDelete('REGISTRATION', reg.id)} className="p-2 bg-red-900/20 text-red-400 rounded"><Trash2 size={16} /></button></td>

                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination Controls */}
                                <div className="p-4 bg-white/5 border-t border-white/5 flex justify-center items-center gap-4">
                                    <button
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        className="px-3 py-1 bg-gray-800 text-white rounded disabled:opacity-30 hover:bg-gray-700"
                                    >
                                        上一頁
                                    </button>
                                    <span className="text-sm text-gray-400">
                                        第 <span className="text-white font-bold">{currentPage}</span> / {totalPages || 1} 頁
                                    </span>
                                    <button
                                        disabled={currentPage >= totalPages}
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        className="px-3 py-1 bg-gray-800 text-white rounded disabled:opacity-30 hover:bg-gray-700"
                                    >
                                        下一頁
                                    </button>
                                </div>
                            </div>
                        )}
                        {/* Members Tab */}
                        {activeTab === 'MEMBERS' && (
                            <div className="bg-mystic-charcoal rounded overflow-hidden border border-white/5 shadow-2xl flex flex-col min-h-[500px]">
                                <div className="flex-1 overflow-x-auto">
                                    <table className="w-full text-left text-sm min-w-[700px]">
                                        <thead className="bg-white/5 text-gray-400 uppercase tracking-widest text-[10px]">
                                            <tr>
                                                <th className="p-4 whitespace-nowrap">會員資訊</th>
                                                <th className="p-4 whitespace-nowrap">性別</th>
                                                <th className="p-4 whitespace-nowrap">聯絡方式</th>
                                                <th className="p-4 whitespace-nowrap">加入時間</th>
                                                <th className="p-4 whitespace-nowrap">已擁有藏書</th>
                                                <th className="p-4 text-right whitespace-nowrap">操作</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {isLoadingProfiles ? (
                                                <tr><td colSpan={6} className="p-8 text-center text-gray-500"><Loader2 className="animate-spin inline mr-2" /> 載入會員資料中...</td></tr>
                                            ) : adminProfiles.map((profile: any) => {
                                                return (
                                                    <tr key={profile.id} className="hover:bg-white/5 transition-colors">
                                                        <td className="p-4">
                                                            <div className="font-bold text-white">{profile.fullName || '未設定姓名'}</div>
                                                            <div className="text-xs text-gray-500 font-mono">{profile.email}</div>
                                                        </td>
                                                        <td className="p-4">
                                                            {profile.gender === 'F' ? <span className="text-pink-400 font-bold">女</span> : <span className="text-blue-400 font-bold">男</span>}
                                                        </td>
                                                        <td className="p-4 text-gray-400">
                                                            <div>{profile.phone || '-'}</div>
                                                            <div className="text-[10px]">{profile.city}{profile.district}</div>
                                                        </td>
                                                        <td className="p-4 text-gray-400 text-xs">
                                                            {new Date(profile.createdAt).toLocaleDateString()}
                                                        </td>
                                                        <td className="p-4">
                                                            <span className="bg-mystic-gold/10 text-mystic-gold px-2 py-1 rounded text-xs border border-mystic-gold/20 font-bold">
                                                                {profile.purchaseCount || 0} 本
                                                            </span>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={async () => {
                                                                    setEditingId(profile.id);
                                                                    setEditForm({ ...profile });
                                                                    setIsAdding(true); // Reuse isAdding to show modal

                                                                    // Fetch purchases for this user locally
                                                                    setIsLoadingPurchases(true);
                                                                    if (!isSupabaseConfigured()) {
                                                                        try {
                                                                            const response = await fetch(`/api/purchases?userId=${encodeURIComponent(profile.id)}`);
                                                                            const data = await response.json();
                                                                            if (!response.ok) throw new Error(data.error || data.details || '權限資料讀取失敗');
                                                                            setAdminPurchases(data || []);
                                                                        } catch (error) {
                                                                            console.error("Error fetching local user purchases:", error);
                                                                            setAdminPurchases([]);
                                                                        }
                                                                    } else {
                                                                        const { data, error } = await supabase
                                                                            .from('purchases')
                                                                            .select('*, digital_products(title, price)')
                                                                            .eq('user_id', profile.id);

                                                                        if (error) {
                                                                            console.error("Error fetching user purchases:", error);
                                                                            setAdminPurchases([]);
                                                                        } else {
                                                                            // Map snake_case to camelCase
                                                                            const mappedData = (data || []).map((p: any) => ({
                                                                                id: p.id,
                                                                                userId: p.user_id,
                                                                                productId: p.product_id,
                                                                                orderId: p.order_id,
                                                                                createdAt: p.created_at,
                                                                                productTitle: p.digital_products?.title,
                                                                                productPrice: p.digital_products?.price
                                                                            }));
                                                                            setAdminPurchases(mappedData);
                                                                        }
                                                                    }
                                                                    setIsLoadingPurchases(false);
                                                                }}
                                                                className="bg-blue-900/40 text-blue-400 px-3 py-1.5 rounded hover:bg-blue-800/40 transition-colors text-xs flex items-center gap-1"
                                                            >
                                                                <Settings size={14} /> 管理權限
                                                            </button>
                                                            {profile.role !== 'admin' && (
                                                                <button
                                                                    onClick={async () => {
                                                                        if (!window.confirm(`確定要刪除會員「${profile.email}」嗎？\n此操作會一併刪除該會員的訂單、藏書權限、閱讀進度、筆記與報名資料，且無法復原。`)) return;
                                                                        try {
                                                                            if (!isSupabaseConfigured()) {
                                                                                const response = await fetch(`/api/profiles/${profile.id}`, { method: 'DELETE' });
                                                                                const result = await response.json().catch(() => ({}));
                                                                                if (!response.ok) throw new Error(result.error || result.details || '刪除會員失敗');
                                                                            } else {
                                                                                const { error } = await supabase.from('profiles').delete().eq('id', profile.id);
                                                                                if (error) throw error;
                                                                            }
                                                                            setAdminProfiles(prev => prev.filter((p: any) => p.id !== profile.id));
                                                                            alert('會員與相關資料已刪除');
                                                                        } catch (error: any) {
                                                                            alert(error.message || '刪除會員失敗');
                                                                        }
                                                                    }}
                                                                    className="bg-red-900/40 text-red-300 px-3 py-1.5 rounded hover:bg-red-800/40 transition-colors text-xs flex items-center gap-1"
                                                                >
                                                                    <Trash2 size={14} /> 刪除
                                                                </button>
                                                            )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {(!isLoadingProfiles && adminProfiles.length === 0) && (
                                                <tr><td colSpan={5} className="p-8 text-center text-gray-500">目前無會員資料</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Member Access Management Modal */}
                        {activeTab === 'MEMBERS' && isAdding && editingId && (
                            <div className="fixed inset-0 z-[80] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
                                <div className="bg-mystic-charcoal w-full max-w-2xl rounded-lg border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                                    <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/40">
                                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                            <Users className="text-mystic-gold" /> 管理會員權限
                                        </h3>
                                        <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="text-gray-400 hover:text-white"><X size={24} /></button>
                                    </div>
                                    <div className="p-6 overflow-y-auto">
                                        <div className="flex items-center gap-4 mb-6 bg-white/5 p-4 rounded border border-white/5">
                                            <div className="w-12 h-12 bg-mystic-gold/20 rounded-full flex items-center justify-center text-mystic-gold font-bold text-xl">
                                                {(editForm.fullName || 'U').charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-lg text-white">{editForm.fullName || '未設定姓名'}</div>
                                                <div className="text-sm text-gray-400">{editForm.email}</div>
                                                <div className="text-xs text-gray-500 mt-1">ID: {editForm.id}</div>
                                            </div>
                                        </div>

                                        <div className="mb-6">
                                            <h4 className="text-sm font-bold text-mystic-gold mb-3 uppercase tracking-widest border-b border-white/10 pb-2">已擁有的藏書權限</h4>
                                            <div className="space-y-2">
                                                {isLoadingPurchases ? (
                                                    <div className="text-center py-4 text-gray-500"><Loader2 className="animate-spin inline mr-2" /> 載入權限資料中...</div>
                                                ) : adminPurchases.length === 0 ? (
                                                    <p className="text-sm text-gray-500 italic py-2">目前沒有任何權限</p>
                                                ) : (
                                                    adminPurchases.map((p: any) => {
                                                        const product = scriptures.find(s => s.id === p.productId);
                                                        const displayTitle = p.productTitle || product?.title || '未知藏書';
                                                        return (
                                                            <div key={p.id} className="flex justify-between items-center bg-black/30 p-3 rounded border border-white/5 hover:border-white/10 transition-colors">
                                                                <div className="flex items-center gap-3">
                                                                    <BookOpen size={16} className="text-gray-500" />
                                                                    <span className="text-white font-bold">{displayTitle}</span>
                                                                </div>
                                                                <button
                                                                    onClick={async () => {
                                                                        if (window.confirm(`確定要移除「${displayTitle}」的閱讀權限嗎？`)) {
                                                                            try {
                                                                                await revokeScriptureAccess(editForm.id, p.productId || p.product_id);
                                                                                setAdminPurchases(prev => prev.filter(item => item.id !== p.id)); // Update local state

                                                                                // Update main Member list count locally
                                                                                setAdminProfiles(prev => prev.map(profile =>
                                                                                    profile.id === editForm.id
                                                                                        ? { ...profile, purchaseCount: Math.max(0, (profile.purchaseCount || 0) - 1) }
                                                                                        : profile
                                                                                ));

                                                                                alert('權限已移除');
                                                                            } catch (e: any) {
                                                                                alert('移除失敗: ' + e.message);
                                                                            }
                                                                        }
                                                                    }}
                                                                    className="text-red-400 hover:bg-red-900/20 p-2 rounded transition-colors text-xs flex items-center gap-1"
                                                                >
                                                                    <Trash2 size={14} /> 移除
                                                                </button>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>

                                        </div>

                                        <div>
                                            <h4 className="text-sm font-bold text-green-400 mb-3 uppercase tracking-widest border-b border-white/10 pb-2">手動新增權限</h4>
                                            <div className="flex gap-2">
                                                <select
                                                    className="flex-1 bg-black border border-white/20 text-white rounded p-2 outline-none focus:border-green-500"
                                                    id="scriptureSelect"
                                                >
                                                    <option value="">請選擇要授權的藏書...</option>
                                                    {scriptures
                                                        .filter(s => !adminPurchases.some((p: any) => (p.productId === s.id || p.product_id === s.id)))
                                                        .map(s => (
                                                            <option key={s.id} value={s.id}>{s.title} (${s.price})</option>
                                                        ))
                                                    }
                                                </select>
                                                <button
                                                    onClick={async () => {
                                                        const select = document.getElementById('scriptureSelect') as HTMLSelectElement;
                                                        const productId = select.value;
                                                        if (!productId) return alert('請選擇藏書');

                                                        try {
                                                            await grantScriptureAccess(editForm.id, productId);

                                                            // Find product details for immediate display
                                                            const product = scriptures.find(s => s.id === productId);

                                                            // Update local state immediately
                                                            const newPurchase = {
                                                                id: `temp_${Date.now()}`,
                                                                userId: editForm.id,
                                                                productId: productId,
                                                                createdAt: new Date().toISOString(),
                                                                productTitle: product?.title, // Add title for display
                                                                productPrice: product?.price
                                                            };
                                                            setAdminPurchases(prev => [...prev, newPurchase]);

                                                            // Update main Member list count locally
                                                            setAdminProfiles(prev => prev.map(profile =>
                                                                profile.id === editForm.id
                                                                    ? { ...profile, purchaseCount: (profile.purchaseCount || 0) + 1 }
                                                                    : profile
                                                            ));

                                                            alert('授權成功！');
                                                            select.value = '';
                                                        } catch (e: any) {
                                                            alert('授權失敗: ' + e.message);
                                                        }
                                                    }}
                                                    className="bg-green-700 text-white px-4 py-2 rounded font-bold hover:bg-green-600 transition-colors flex items-center gap-2"
                                                >
                                                    <Plus size={18} /> 授予權限
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-4 border-t border-white/10 bg-black/40 flex justify-end">
                                        <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="bg-gray-700 text-white px-6 py-2 rounded hover:bg-gray-600 transition-colors">關閉</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Shared Search & Actions for Non-Registration Tabs */}
                        {activeTab !== 'REGISTRATIONS' && activeTab !== 'MEMBERS' && (
                            <div className="flex flex-col gap-4 mb-4 bg-white/5 p-4 rounded border border-white/10">
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        {/* Search Box */}
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="搜尋關鍵字..."
                                                className="bg-black border border-white/20 text-white text-sm p-2 pl-8 rounded outline-none focus:border-mystic-gold w-48"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                            <Briefcase size={14} className="absolute left-2.5 top-3 text-gray-500" />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {activeTab === 'ORDERS' && (
                                            <div className="flex bg-black/40 rounded p-1 border border-white/10 mr-4">
                                                <button
                                                    onClick={() => { setOrderFilter('PENDING'); setCurrentPage(1); }}
                                                    className={`px-4 py-1.5 rounded text-xs font-bold transition-all ${orderFilter === 'PENDING' ? 'bg-mystic-gold text-black' : 'text-gray-400 hover:text-white'}`}
                                                >
                                                    未付款 (Pending)
                                                </button>
                                                <button
                                                    onClick={() => { setOrderFilter('PAID'); setCurrentPage(1); }}
                                                    className={`px-4 py-1.5 rounded text-xs font-bold transition-all ${orderFilter === 'PAID' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                                >
                                                    已完成 (Paid)
                                                </button>
                                            </div>
                                        )}
                                        {activeTab === 'ORDERS' && (
                                            <button
                                                onClick={handleExportCSV}
                                                className="bg-green-800 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2 hover:bg-green-700 transition-colors mr-2"
                                            >
                                                <FileText size={16} /> 匯出訂單
                                            </button>
                                        )}

                                        {selectedItems.size > 0 && (
                                            <button
                                                onClick={handleBatchDelete}
                                                className="bg-red-900/80 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2 hover:bg-red-800 transition-colors animate-fade-in"
                                            >
                                                <Trash2 size={16} /> 刪除選取 ({selectedItems.size})
                                            </button>
                                        )}
                                        {activeTab !== 'ORDERS' && (
                                            <button
                                                onClick={() => { setIsAdding(true); setEditingId(null); setEditForm({}); }}
                                                className="bg-mystic-gold text-black px-4 py-2 rounded text-sm font-bold flex items-center gap-2 hover:bg-white transition-colors"
                                            >
                                                <Plus size={16} /> 新增項目
                                            </button>
                                        )}
                                    </div>
                                </div>


                                <div className="text-xs text-gray-500 flex justify-between items-center bg-black/20 p-2 rounded">
                                    <span>顯示搜尋結果: {filteredActiveData.length} 筆資料 (共 {activeListData.length} 筆)</span>
                                    <span>已選取: {selectedItems.size} 筆</span>
                                </div>
                            </div>
                        )}

                        {/* Shared Table for Non-Registration Tabs */}
                        {activeTab !== 'REGISTRATIONS' && activeTab !== 'MEMBERS' && (
                            <div className="bg-mystic-charcoal rounded overflow-hidden border border-white/5 shadow-2xl flex flex-col min-h-[500px]">
                                <div className="flex-1 overflow-x-auto">
                                    <table className="w-full text-left text-sm min-w-[650px]">
                                        <thead className="bg-white/5 text-gray-400 uppercase tracking-widest text-[10px]">
                                            <tr>
                                                <th className="p-4 w-10">
                                                    <input
                                                        type="checkbox"
                                                        className="cursor-pointer"
                                                        checked={filteredActiveData.length > 0 && selectedItems.size === filteredActiveData.length}
                                                        onChange={handleSelectAll}
                                                    />
                                                </th>
                                                {activeTab === 'ORG' ? <th className="p-4 whitespace-nowrap">內容</th> : <th className="p-4 whitespace-nowrap">標題/名稱</th>}
                                                <th className="p-4 whitespace-nowrap">詳細資訊</th>
                                                <th className="p-4 text-right whitespace-nowrap">操作</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {activeTab === 'EVENTS' && paginatedItems.map((item: any) => (
                                                <tr key={item.id} className={`hover:bg-white/5 ${selectedItems.has(item.id) ? 'bg-white/5' : ''}`}>
                                                    <td className="p-4"><input type="checkbox" className="cursor-pointer" checked={selectedItems.has(item.id)} onChange={() => handleSelectOne(item.id)} /></td>
                                                    <td className="p-4 text-white font-bold">{item.title}</td>
                                                    <td className="p-4 text-gray-400">
                                                        <div className="mb-1">{item.date} ({item.lunarDate})</div>
                                                        <div className="flex gap-1">
                                                            {item.fieldConfig?.showBirth && <span className="text-[10px] bg-green-900/40 text-green-400 px-1.5 py-0.5 rounded border border-green-500/30">生辰</span>}
                                                            {item.fieldConfig?.showTime && <span className="text-[10px] bg-purple-900/40 text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/30">時辰</span>}
                                                            {item.fieldConfig?.showAddress && <span className="text-[10px] bg-blue-900/40 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/30">地址</span>}
                                                            {item.fieldConfig?.showIdNumber && <span className="text-[10px] bg-red-900/40 text-red-400 px-1.5 py-0.5 rounded border border-red-500/30">身分證</span>}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-right flex justify-end gap-2"><button onClick={() => handleEdit(item)} className="p-2 bg-blue-900/20 text-blue-400 rounded"><Edit size={16} /></button><button onClick={() => handleDelete('EVENT', item.id)} className="p-2 bg-red-900/20 text-red-400 rounded"><Trash2 size={16} /></button></td>
                                                </tr>
                                            ))}
                                            {activeTab === 'NEWS' && paginatedItems.map((item: any) => (
                                                <tr key={item.id} className={`hover:bg-white/5 ${selectedItems.has(item.id) ? 'bg-white/5' : ''}`}>
                                                    <td className="p-4"><input type="checkbox" className="cursor-pointer" checked={selectedItems.has(item.id)} onChange={() => handleSelectOne(item.id)} /></td>
                                                    <td className="p-4 text-white font-bold">{item.title}</td><td className="p-4 text-gray-400">{item.date}</td><td className="p-4 text-right flex justify-end gap-2"><button onClick={() => handleEdit(item)} className="p-2 bg-blue-900/20 text-blue-400 rounded"><Edit size={16} /></button><button onClick={() => handleDelete('NEWS', item.id)} className="p-2 bg-red-900/20 text-red-400 rounded"><Trash2 size={16} /></button></td></tr>
                                            ))}
                                            {activeTab === 'ANNOUNCEMENTS' && paginatedItems.map((item: any) => (
                                                <tr key={item.id} className={`hover:bg-white/5 ${selectedItems.has(item.id) ? 'bg-white/5' : ''}`}>
                                                    <td className="p-4"><input type="checkbox" className="cursor-pointer" checked={selectedItems.has(item.id)} onChange={() => handleSelectOne(item.id)} /></td>
                                                    <td className="p-4 text-white font-bold">{item.content}</td>
                                                    <td className="p-4 text-gray-400">
                                                        <div className="flex items-center gap-3">
                                                            <span>排序: {item.priority || 0}</span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs">狀態:</span>
                                                                <button
                                                                    onClick={async () => {
                                                                        const currentStatus = item.is_active !== false && item.isActive !== false;
                                                                        try {
                                                                            await updateAnnouncement(item.id, { is_active: !currentStatus });
                                                                        } catch (err: any) {
                                                                            alert('切換狀態失敗: ' + err.message);
                                                                        }
                                                                    }}
                                                                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${(item.is_active !== false && item.isActive !== false) ? 'bg-green-600' : 'bg-gray-700'}`}
                                                                    role="switch"
                                                                    aria-checked={item.is_active !== false && item.isActive !== false}
                                                                >
                                                                    <span aria-hidden="true" className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${(item.is_active !== false && item.isActive !== false) ? 'translate-x-2' : '-translate-x-2'}`} />
                                                                </button>
                                                                <span className={`text-xs ml-1 ${(item.is_active !== false && item.isActive !== false) ? 'text-green-400' : 'text-gray-500'}`}>{(item.is_active !== false && item.isActive !== false) ? '啟用中' : '已停用'}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-right flex justify-end gap-2"><button onClick={() => handleEdit(item)} className="p-2 bg-blue-900/20 text-blue-400 rounded"><Edit size={16} /></button><button onClick={() => handleDelete('ANNOUNCEMENT', item.id)} className="p-2 bg-red-900/20 text-red-400 rounded"><Trash2 size={16} /></button></td>
                                                </tr>
                                            ))}
                                            {activeTab === 'SERVICES' && paginatedItems.map((item: any) => (
                                                <tr key={item.id} className={`hover:bg-white/5 ${selectedItems.has(item.id) ? 'bg-white/5' : ''}`}>
                                                    <td className="p-4"><input type="checkbox" className="cursor-pointer" checked={selectedItems.has(item.id)} onChange={() => handleSelectOne(item.id)} /></td>
                                                    <td className="p-4 text-white font-bold">{item.title}</td>
                                                    <td className="p-4 text-gray-400">
                                                        <div className="mb-1">${item.price}</div>
                                                        {item.type === 'LIGHT' && (
                                                            <div className="mb-2 text-xs text-mystic-gold">點燈 {item.lightDurationDays || 30} 天</div>
                                                        )}
                                                        <div className="flex gap-1">
                                                            {item.fieldConfig?.showBirth && <span className="text-[10px] bg-green-900/40 text-green-400 px-1.5 py-0.5 rounded border border-green-500/30">生辰</span>}
                                                            {item.fieldConfig?.showTime && <span className="text-[10px] bg-purple-900/40 text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/30">時辰</span>}
                                                            {item.fieldConfig?.showAddress && <span className="text-[10px] bg-blue-900/40 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/30">地址</span>}
                                                            {item.fieldConfig?.showIdNumber && <span className="text-[10px] bg-red-900/40 text-red-400 px-1.5 py-0.5 rounded border border-red-500/30">身分證</span>}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-right flex justify-end gap-2"><button onClick={() => handleEdit(item)} className="p-2 bg-blue-900/20 text-blue-400 rounded"><Edit size={16} /></button><button onClick={() => handleDelete('SERVICE', item.id)} className="p-2 bg-red-900/20 text-red-400 rounded"><Trash2 size={16} /></button></td>
                                                </tr>
                                            ))}
                                            {activeTab === 'ORG' && paginatedItems.map((item: any) => (
                                                <tr key={item.id} className={`hover:bg-white/5 ${selectedItems.has(item.id) ? 'bg-white/5' : ''}`}>
                                                    <td className="p-4"><input type="checkbox" className="cursor-pointer" checked={selectedItems.has(item.id)} onChange={() => handleSelectOne(item.id)} /></td>
                                                    <td className="p-4 flex gap-4"><img src={item.image} className="w-10 h-10 object-cover rounded-full" /><div><div className="font-bold text-white">{item.name}</div><div className="text-xs text-gray-400">{item.title}</div></div></td><td className="p-4 text-gray-400"><span className={`px-2 py-1 rounded text-xs border ${item.category === 'LEADER' ? 'border-mystic-gold text-mystic-gold' : item.category === 'EXECUTIVE' ? 'border-blue-500 text-blue-400' : 'border-gray-500 text-gray-400'}`}>{item.category === 'LEADER' ? '宮主' : item.category === 'EXECUTIVE' ? '幹事/委員' : '執事/志工'}</span></td><td className="p-4 text-right flex justify-end gap-2"><button onClick={() => handleEdit(item)} className="p-2 bg-blue-900/20 text-blue-400 rounded"><Edit size={16} /></button><button onClick={() => handleDelete('ORG', item.id)} className="p-2 bg-red-900/20 text-red-400 rounded"><Trash2 size={16} /></button></td></tr>
                                            ))}
                                            {activeTab === 'FAQS' && paginatedItems.map((item: any) => (
                                                <tr key={item.id} className={`hover:bg-white/5 ${selectedItems.has(item.id) ? 'bg-white/5' : ''}`}>
                                                    <td className="p-4"><input type="checkbox" className="cursor-pointer" checked={selectedItems.has(item.id)} onChange={() => handleSelectOne(item.id)} /></td>
                                                    <td className="p-4 text-white font-bold">{item.question}</td><td className="p-4 text-gray-400 line-clamp-1">{item.answer.substring(0, 50)}...</td><td className="p-4 text-right flex justify-end gap-2"><button onClick={() => handleEdit(item)} className="p-2 bg-blue-900/20 text-blue-400 rounded"><Edit size={16} /></button><button onClick={() => handleDelete('FAQ', item.id)} className="p-2 bg-red-900/20 text-red-400 rounded"><Trash2 size={16} /></button></td></tr>
                                            ))}
                                            {activeTab === 'SCRIPTURES' && paginatedItems.map((item: any) => (
                                                <tr key={item.id} className={`hover:bg-white/5 ${selectedItems.has(item.id) ? 'bg-white/5' : ''}`}>
                                                    <td className="p-4"><input type="checkbox" className="cursor-pointer" checked={selectedItems.has(item.id)} onChange={() => handleSelectOne(item.id)} /></td>
                                                    <td className="p-4 flex gap-4">
                                                        <div className="w-10 h-10 bg-mystic-charcoal rounded flex items-center justify-center border border-white/10">
                                                            {item.previewUrl ? (
                                                                <img src={item.previewUrl} alt={item.title} className="w-full h-full object-cover rounded" />
                                                            ) : (
                                                                <BookOpen size={20} className="text-mystic-gold" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-white">{item.title}</div>
                                                            <div className="text-xs text-gray-400">作者: {item.author || '未註記'}</div>
                                                            <div className="mt-1 flex gap-2">
                                                                <span className="text-[10px] bg-mystic-gold/10 text-mystic-gold px-1.5 py-0.5 rounded border border-mystic-gold/30">{item.category || '道藏藏書'}</span>
                                                                {item.attachments && item.attachments.length > 0 && (
                                                                    <span className="text-[10px] bg-blue-900/40 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/30">附件: {item.attachments.length}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-gray-400">
                                                        <div className="text-xs line-clamp-2 max-w-[250px]">{item.content ? '已建立內文 (HTML)' : '無內文'}</div>
                                                        <div className="text-[10px] text-gray-500 font-mono mt-1">ID: {item.id.substring(0, 8)}</div>
                                                    </td>
                                                    <td className="p-4 text-right flex justify-end gap-2">
                                                        <button onClick={() => handleEdit(item)} className="p-2 bg-blue-900/20 text-blue-400 rounded"><Edit size={16} /></button>
                                                        <button onClick={() => handleDelete('SCRIPTURE', item.id)} className="p-2 bg-red-900/20 text-red-400 rounded"><Trash2 size={16} /></button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {activeTab === 'ORDERS' && (paginatedItems as any[]).map((order: any) => (
                                                <tr key={order.id} className={`hover:bg-white/5 ${selectedItems.has(order.id) ? 'bg-white/5' : ''}`}>
                                                    <td className="p-4">
                                                        <input
                                                            type="checkbox"
                                                            className="cursor-pointer"
                                                            checked={selectedItems.has(order.id)}
                                                            onChange={() => handleSelectOne(order.id)}
                                                        />
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="font-bold text-white">{order.product?.title || '未知商品'}</div>
                                                        <div className="text-[10px] text-gray-500 font-mono">
                                                            {order.merchantTradeNo && order.merchantTradeNo.startsWith('BANK_')
                                                                ? <span className="text-mystic-gold font-bold">匯款末五碼: {order.merchantTradeNo.split('_')[1]}</span>
                                                                : order.merchantTradeNo}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-gray-400">
                                                        <div className="flex flex-col">
                                                            <span className="text-white">NT$ {order.amount}</span>
                                                            <span className={`text-[10px] ${order.status === 'PAID' ? 'text-green-400' : 'text-red-400'}`}>
                                                                {order.status === 'PAID' ? '\u5df2\u5b8c\u6210' : '\u672a\u4ed8\u6b3e'}
                                                            </span>
                                                            <button
                                                                onClick={async () => {
                                                                    const newStatus = order.status === 'PAID' ? 'PENDING' : 'PAID';
                                                                    const confirmMsg = newStatus === 'PAID'
                                                                        ? `\u78ba\u5b9a\u8981\u78ba\u8a8d\u6b64\u8a02\u55ae\u5df2\u4ed8\u6b3e\u55ce\uff1f\n\u5c07\u81ea\u52d5\u70ba\u6703\u54e1 ${order.userId.substring(0, 4)}... \u958b\u901a\u95b1\u8b80\u6b0a\u9650\u3002`
                                                                        : `\u78ba\u5b9a\u8981\u5c07\u6b64\u8a02\u55ae\u8a2d\u70ba\u672a\u4ed8\u6b3e\u55ce\uff1f\n\u5c07\u540c\u6b65\u79fb\u9664\u6703\u54e1\u95b1\u8b80\u6b0a\u9650\u3002`;

                                                                    if (window.confirm(confirmMsg)) {
                                                                        try {
                                                                            await updateScriptureOrder(order.id, { status: newStatus });
                                                                            alert(newStatus === 'PAID' ? '\u5df2\u78ba\u8a8d\u4ed8\u6b3e\uff0c\u6703\u54e1\u95b1\u8b80\u6b0a\u9650\u5df2\u958b\u901a\u3002' : '\u5df2\u8a2d\u70ba\u672a\u4ed8\u6b3e\uff0c\u6703\u54e1\u95b1\u8b80\u6b0a\u9650\u5df2\u79fb\u9664\u3002');
                                                                        } catch (err: any) {
                                                                            console.error(err);
                                                                            alert(`\u64cd\u4f5c\u5931\u6557\uff1a${err.message}`);
                                                                        }
                                                                    }
                                                                }}
                                                                className={`mt-1 text-[10px] px-2 py-0.5 rounded border ${order.status === 'PAID' ? 'border-red-500/50 text-red-400 hover:bg-red-500/10' : 'border-green-500/50 text-green-400 hover:bg-green-500/10'} transition-all`}
                                                            >
                                                                {order.status === 'PAID' ? '設為未付款 (移除權限)' : '手動確認付款 (開通權限)'}
                                                            </button>
                                                            <span className="text-[10px]">{new Date(order.createdAt).toLocaleDateString()}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-right flex justify-end items-center gap-4">
                                                        <div className="text-[10px] text-gray-600">UserID: {order.userId.substring(0, 8)}...</div>
                                                        <button
                                                            onClick={() => handleDelete('ORDER', order.id)}
                                                            className="p-2 bg-red-900/20 text-red-400 rounded hover:bg-red-900/40 transition-colors"
                                                            title="刪除此訂單"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination Controls */}
                                <div className="p-4 bg-white/5 border-t border-white/5 flex justify-center items-center gap-4">
                                    <button
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        className="px-3 py-1 bg-gray-800 text-white rounded disabled:opacity-30 hover:bg-gray-700"
                                    >
                                        上一頁
                                    </button>
                                    <span className="text-sm text-gray-400">
                                        第 <span className="text-white font-bold">{currentPage}</span> / {totalPages || 1} 頁
                                    </span>
                                    <button
                                        disabled={currentPage >= totalPages}
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        className="px-3 py-1 bg-gray-800 text-white rounded disabled:opacity-30 hover:bg-gray-700"
                                    >
                                        下一頁
                                    </button>
                                </div>
                            </div>
                        )}
                        {((activeTab === 'EVENTS' || activeTab === 'NEWS' || activeTab === 'SERVICES' || activeTab === 'ORG' || activeTab === 'FAQS') && paginatedItems.length === 0) && <div className="p-12 text-center text-gray-600">目前暫無資料</div>}
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminPanel;
