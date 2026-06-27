import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { NewsItem, TempleEvent, ServiceItem, GalleryItem, GalleryAlbum, Registration, SiteSettings, OrgMember, FAQItem, DigitalProduct, ScriptureOrder, Notification, Announcement } from '../types';
import { supabase, isSupabaseConfigured } from '../services/supabase';

// Helper to get formatted date for current month
const getRelativeDate = (day: number) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${month}-${d}`;
};

const INITIAL_NEWS: NewsItem[] = [
    { id: 'n1', date: '2024.03.15', title: '【公告】觀世音菩薩出家紀念日法會籌備中', category: '法會' },
    { id: 'n2', date: '2024.03.01', title: '【活動】本宮年度平安燈、太歲燈開放線上受理', category: '公告' },
    { id: 'n3', date: '2024.02.15', title: '【公益】護國宮春季救濟物資發放活動圓滿', category: '慈善' },
];

const INITIAL_EVENTS: TempleEvent[] = [
    { id: 'e1', date: getRelativeDate(2), lunarDate: '初二', title: '池府王爺巡禮', description: '例行性巡視各庄頭，保佑四境平安。', time: '09:00', type: 'FESTIVAL' },
    { id: 'e2', date: getRelativeDate(15), lunarDate: '十五', title: '補運科儀', description: '月中固定補運，為信眾消災解厄。', time: '14:00', type: 'RITUAL' },
    { id: 'e3', date: getRelativeDate(28), lunarDate: '廿八', title: '平安祈福法會', description: '月底總結祈福，感謝神恩庇佑。', time: '08:00', type: 'FESTIVAL' },
];

const INITIAL_SERVICES: ServiceItem[] = [
    { id: 's1', title: "太歲燈", description: "祈求流年平安，消災解厄，化解沖犯太歲之厄運。", iconName: "Sun", price: 600, type: 'LIGHT' },
    { id: 's2', title: "光明燈", description: "照亮元辰，增長智慧，祈求前途光明，學業事業順利。", iconName: "Moon", price: 600, type: 'LIGHT' },
    { id: 's3', title: "補財庫", description: "填補財庫缺漏，增強財運，守住財富，生意興隆。", iconName: "Briefcase", price: 1200, type: 'RITUAL' },
    { id: 's4', title: "收驚祭改", description: "針對受驚嚇、運勢低落者，透過科儀安定心神，去除霉運。", iconName: "HeartHandshake", price: 300, type: 'RITUAL' },
    { id: 's5', title: "隨喜捐獻", description: "護持宮廟建設，廣結善緣，功德無量。", iconName: "Gift", price: 100, type: 'DONATION' }
];

const INITIAL_ORG: OrgMember[] = [
    { id: 'o1', name: '陳天賜', title: '宮主', category: 'LEADER', image: 'https://images.unsplash.com/photo-1542596594-649edbc13630?q=80&w=300&auto=format&fit=crop' },
    { id: 'o2', name: '林旺財', title: '總幹事', category: 'EXECUTIVE', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop' },
    { id: 'o3', name: '張修德', title: '祭典組長', category: 'EXECUTIVE', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=300&auto=format&fit=crop' },
    { id: 'o4', name: '王淑芬', title: '財務長', category: 'EXECUTIVE', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=300&auto=format&fit=crop' },
    { id: 'o5', name: '李阿土', title: '庶務執事', category: 'STAFF', image: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?q=80&w=300&auto=format&fit=crop' },
    { id: 'o6', name: '吳美玲', title: '接待志工', category: 'STAFF', image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=300&auto=format&fit=crop' },
    { id: 'o7', name: '劉金龍', title: '護轎組', category: 'STAFF', image: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=300&auto=format&fit=crop' },
];

const INITIAL_FAQS: FAQItem[] = [
    { id: 'f1', question: '請問參拜的順序為何？', answer: '請先至天公爐參拜玉皇上帝，再入正殿參拜主神池府王爺，隨後參拜龍邊（左側）陪祀神明，最後參拜虎邊（右側）陪祀神明。' },
    { id: 'f2', question: '如何辦理點燈服務？', answer: '您可以使用本網站的「線上服務」進行登記與繳費，或親臨本宮服務台辦理。每盞燈位均有神明庇佑，名額有限。' },
    { id: 'f3', question: '擲筊求籤有什麼禁忌嗎？', answer: '請示前請先洗手淨心，清楚稟報姓名、生辰、住址與所求之事。一事一籤，切勿一事多求。若遇笑筊或陰筊，請重新誠心稟報。' },
    { id: 'f4', question: '還願的方式有哪些？', answer: '依據您當時許願的內容為主。一般可準備鮮花素果、添香油錢、或協助宮廟事務志工。' },
];

const DEFAULT_SETTINGS: SiteSettings = {
    templeName: '新莊武壇廣行宮',
    address: '242新北市新莊區福營路500號',
    phone: '(02) 2345-6789',
    lineUrl: 'https://line.me/ti/p/@temple_demo',
    heroTitle: '代天巡狩',
    heroSubtitle: '威靈顯赫 · 廣行濟世',
    heroImage: 'https://images.unsplash.com/photo-1592388796690-3482d8d8091e?q=80&w=2600&auto=format&fit=crop',
    deityImage: 'https://images.unsplash.com/photo-1616401776943-41c0f04df518?q=80&w=2000&auto=format&fit=crop',
    deityTitle: '傳奇緣起',
    deityIntro: '池府王爺，諱夢彪，唐朝名將。性格剛正，愛民如子。傳說王爺於夢中見瘟神奉玉帝旨意降災，欲於井中投毒。王爺不忍百姓受難，毅然奪藥吞服，捨身救民。毒發之時，面色黝黑，雙目暴突。玉帝感其大德，敕封「代天巡狩」，專司驅瘟除疫。今人所見王爺金身之黑面怒目，實乃慈悲之至極。',
    deityBirthday: '農曆六月十八',
    deityBirthdayLabel: '聖誕千秋',
    deityDuty: '消災 · 解厄',
    deityDutyLabel: '專司職責',
    historyImageRoof: 'https://images.unsplash.com/photo-1542649761-0af3759b9e6f?q=80&w=1000&auto=format&fit=crop',
    historyRoofTitle: '燕尾脊',
    historyRoofDesc: '象徵尊貴地位，飛簷翹角，氣勢非凡。',
    historyImageStone: 'https://images.unsplash.com/photo-1596545753969-583d73b3eb38?q=80&w=1000&auto=format&fit=crop',
    historyStoneTitle: '龍柱石雕',
    historyStoneDesc: '匠師精雕細琢，雙龍搶珠，栩栩如生。',
    historyTitle1: '草創時期 (清乾隆年間)',
    historyDesc1: '本宮源起於清乾隆年間，先民渡海來台，為求平安渡過黑水溝，隨身奉請池府王爺金身。初時僅以茅草搭建簡易神壇供奉，然神威顯赫，庇佑庄頭五穀豐登，信眾日增。',
    historyTitle2: '建廟大業 (民國六十年)',
    historyDesc2: '隨著地方繁榮，舊壇已不敷使用。地方仕紳與信眾集資購地，依循古法地理勘輿，擇定現址動土興建。歷時三年，大殿巍峨聳立，燕尾飛簷，剪黏交趾，展現傳統工藝之美。',
    historyTitle3: '現代弘法 (今日)',
    historyDesc3: '不僅是信仰中心，更致力於公益慈善與文化傳承。引入數位科技，設立線上祭祀平台，讓傳統信仰跨越時空，繼續守護每一位虔誠的靈魂。',

    // Default Field Configs
    configDonation: {
        showBirth: false,
        showTime: false,
        showAddress: false,
        showIdNumber: false
    },
    configLight: {
        showBirth: true,
        showTime: true,
        showAddress: true,
        showIdNumber: false
    },
    configEvent: {
        showBirth: true,
        showTime: false,
        showAddress: true,
        showIdNumber: true
    }
};

interface DataContextType {
    news: NewsItem[];
    events: TempleEvent[];
    services: ServiceItem[];
    gallery: GalleryItem[];
    galleryAlbums: GalleryAlbum[];
    registrations: Registration[];
    orgMembers: OrgMember[];
    faqs: FAQItem[];
    siteSettings: SiteSettings;

    // Members & Access
    profiles: any[]; // Using any to avoid import cycles or complex type mapping
    purchases: any[];
    grantScriptureAccess: (userId: string, productId: string) => Promise<void>;
    revokeScriptureAccess: (userId: string, productId: string) => Promise<void>;

    // Auth
    user: any;
    userProfile: any; // Using any to avoid import cycles or complex type mapping
    signOut: () => Promise<void>;
    fetchUserProfile: (userId: string) => Promise<void>;
    signInLocal: (email: string, password: string) => Promise<void>;
    registerLocal: (email: string, password: string) => Promise<void>;

    addNews: (item: Omit<NewsItem, 'id'>) => void;
    updateNews: (id: string, item: Partial<NewsItem>) => void;
    deleteNews: (id: string) => void;

    addEvent: (item: Omit<TempleEvent, 'id'>) => void;
    updateEvent: (id: string, item: Partial<TempleEvent>) => void;
    deleteEvent: (id: string) => void;

    addService: (item: Omit<ServiceItem, 'id'>) => void;
    updateService: (id: string, item: Partial<ServiceItem>) => void;
    deleteService: (id: string) => void;

    addGalleryItem: (item: Omit<GalleryItem, 'id'>) => Promise<void>;
    addGalleryItems: (items: Omit<GalleryItem, 'id'>[]) => Promise<void>;
    updateGalleryItem: (id: string, item: Partial<GalleryItem>) => Promise<void>;
    deleteGalleryItem: (id: string) => Promise<void>;

    addGalleryAlbum: (album: Omit<GalleryAlbum, 'id'>) => Promise<void>;
    updateGalleryAlbum: (id: string, album: Partial<GalleryAlbum>) => Promise<void>;
    deleteGalleryAlbum: (id: string) => Promise<void>;

    addOrgMember: (item: Omit<OrgMember, 'id'>) => void;
    updateOrgMember: (id: string, item: Partial<OrgMember>) => void;

    deleteOrgMember: (id: string) => void;

    addFaq: (item: Omit<FAQItem, 'id'>) => void;
    updateFaq: (id: string, item: Partial<FAQItem>) => void;
    deleteFaq: (id: string) => void;

    addRegistration: (reg: Omit<Registration, 'id' | 'createdAt'>) => void;
    updateRegistration: (id: string, reg: Partial<Registration>) => void;
    deleteRegistration: (id: string) => void;
    getRegistrationsByPhone: (phone: string) => Registration[];

    updateSiteSettings: (settings: Partial<SiteSettings>) => void;

    // Scriptures
    scriptures: DigitalProduct[];
    scriptureOrders: ScriptureOrder[];
    addScripture: (item: Omit<DigitalProduct, 'id' | 'createdAt'>) => Promise<void>;
    updateScripture: (id: string, item: Partial<DigitalProduct>) => Promise<void>;
    deleteScripture: (id: string) => Promise<void>;
    deleteScriptureWithOrders: (id: string) => Promise<void>;
    fetchScriptureOrders: () => Promise<void>;
    updateScriptureOrder: (id: string, updates: Partial<ScriptureOrder>) => Promise<void>;
    deleteScriptureOrder: (id: string) => Promise<void>;

    // Notifications
    notifications: Notification[];
    markNotificationAsRead: (id: string) => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;

    // Announcements
    announcements: Announcement[];
    addAnnouncement: (item: Omit<Announcement, 'id' | 'created_at'>) => Promise<void>;
    updateAnnouncement: (id: string, item: Partial<Announcement>) => Promise<void>;
    deleteAnnouncement: (id: string) => Promise<void>;

    resetData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [events, setEvents] = useState<TempleEvent[]>([]);
    const [services, setServices] = useState<ServiceItem[]>([]);
    const [gallery, setGallery] = useState<GalleryItem[]>([]);
    const [orgMembers, setOrgMembers] = useState<OrgMember[]>([]);
    const [faqs, setFaqs] = useState<FAQItem[]>([]);
    const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [galleryAlbums, setGalleryAlbums] = useState<GalleryAlbum[]>([]);
    const [scriptures, setScriptures] = useState<DigitalProduct[]>([]);
    const [scriptureOrders, setScriptureOrders] = useState<ScriptureOrder[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);

    // Member Management State
    const [profiles, setProfiles] = useState<any[]>([]);
    const [purchases, setPurchases] = useState<any[]>([]);

    // === SUPABASE SYNCHRONIZATION ===

    // Helper to fetch and subscribe to a table
    const syncTable = <T extends { id: string }>(
        tableName: string,
        setter: React.Dispatch<React.SetStateAction<T[]>>,
        orderByCol: string = 'created_at',
        ascending: boolean = false,
        initialData?: T[]
    ) => {
        if (!isSupabaseConfigured()) {
            const localTables: Record<string, string> = {
                news: 'news',
                events: 'events',
                services: 'services',
                gallery: 'gallery',
                gallery_albums: 'gallery_albums',
                registrations: 'registrations',
                org_members: 'org_members',
                faqs: 'faqs',
            };
            const url = tableName === 'digital_products'
                ? '/api/products'
                : localTables[tableName]
                    ? `/api/content/${localTables[tableName]}`
                    : null;
            if (url) {
                fetch(url)
                    .then((response) => response.ok ? response.json() : Promise.reject(response))
                    .then((data) => setter(data as any))
                    .catch(() => setter([] as any));
                return () => { };
            }
            setter([] as any);
            return () => { };
        }

        const fetchData = async () => {
            try {
                const { data, error } = await supabase
                    .from(tableName)
                    .select('*')
                    .order(orderByCol, { ascending });

                if (error) {
                    // Ignore AbortError and known network interruptions
                    if (error.message?.includes('AbortError') || error.details?.includes('AbortError') || error.code === '20') {
                        return;
                    }
                    console.error(`Error fetching ${tableName}:`, error);
                    return;
                }

                if (data) {
                    // Auto-map snake_case to camelCase keys
                    const toCamel = (s: string) => s.replace(/(_\w)/g, k => k[1].toUpperCase());
                    const mapKeys = (o: any) => {
                        const newO: any = {};
                        for (const key in o) {
                            newO[toCamel(key)] = o[key];
                        }
                        return newO;
                    };

                    const mappedData = data.map(mapKeys);
                    setter(mappedData as any);
                }
            } catch (err: any) {
                // Ignore AbortError which just means the component unmounted or network was cancelled
                if (err.name === 'AbortError' || err.message?.includes('Fail to fetch') || err.status === 406) {
                    return;
                }
                console.error(`Unexpected error in ${tableName} sync:`, err);
            }
        };

        fetchData();

        const channel = supabase
            .channel(`${tableName}_changes`)
            .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, () => {
                fetchData(); // Simplest strategy: refetch on any change
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    };

    // 1. Sync Site Settings
    useEffect(() => {
        if (!isSupabaseConfigured()) {
            fetch('/api/site-settings')
                .then((response) => response.ok ? response.json() : Promise.reject(response))
                .then((data) => {
                    if (data) setSiteSettings({ ...DEFAULT_SETTINGS, ...data });
                })
                .catch(() => setSiteSettings(DEFAULT_SETTINGS));
            return;
        }

        // Settings is a single row table usually, or we query key-value. 
        // Schema says 'site_settings' table usually with one row.
        const fetchSettings = async () => {
            try {
                const { data, error } = await supabase.from('site_settings').select('*').maybeSingle();
                if (error) {
                    // Ignore AbortError
                    if (error.message?.includes('AbortError') || error.details?.includes('AbortError') || error.code === '20') {
                        return;
                    }
                    console.error("Error fetching settings:", error);
                    return;
                }

                if (data) {
                    // Need to map snake_case to camelCase manually here because Settings has many fields
                    const mappedSettings: SiteSettings = {
                        templeName: data.temple_name || DEFAULT_SETTINGS.templeName,
                        address: data.address || DEFAULT_SETTINGS.address,
                        phone: data.phone || DEFAULT_SETTINGS.phone,
                        lineUrl: data.line_url || DEFAULT_SETTINGS.lineUrl,
                        heroTitle: data.hero_title || DEFAULT_SETTINGS.heroTitle,
                        heroSubtitle: data.hero_subtitle || DEFAULT_SETTINGS.heroSubtitle,
                        heroImage: data.hero_image || DEFAULT_SETTINGS.heroImage,
                        deityImage: data.deity_image || DEFAULT_SETTINGS.deityImage,
                        deityTitle: data.deity_title || DEFAULT_SETTINGS.deityTitle,
                        deityIntro: data.deity_intro || DEFAULT_SETTINGS.deityIntro,
                        deityBirthday: data.deity_birthday || DEFAULT_SETTINGS.deityBirthday,
                        deityBirthdayLabel: data.deity_birthday_label || DEFAULT_SETTINGS.deityBirthdayLabel,
                        deityDuty: data.deity_duty || DEFAULT_SETTINGS.deityDuty,
                        deityDutyLabel: data.deity_duty_label || DEFAULT_SETTINGS.deityDutyLabel,
                        historyImageRoof: data.history_image_roof || DEFAULT_SETTINGS.historyImageRoof,
                        historyRoofTitle: data.history_roof_title || DEFAULT_SETTINGS.historyRoofTitle,
                        historyRoofDesc: data.history_roof_desc || DEFAULT_SETTINGS.historyRoofDesc,
                        historyImageStone: data.history_image_stone || DEFAULT_SETTINGS.historyImageStone,
                        historyStoneTitle: data.history_stone_title || DEFAULT_SETTINGS.historyStoneTitle,
                        historyStoneDesc: data.history_stone_desc || DEFAULT_SETTINGS.historyStoneDesc,
                        historyTitle1: data.history_title1 || DEFAULT_SETTINGS.historyTitle1,
                        historyDesc1: data.history_desc1 || DEFAULT_SETTINGS.historyDesc1,
                        historyTitle2: data.history_title2 || DEFAULT_SETTINGS.historyTitle2,
                        historyDesc2: data.history_desc2 || DEFAULT_SETTINGS.historyDesc2,
                        historyTitle3: data.history_title3 || DEFAULT_SETTINGS.historyTitle3,
                        historyDesc3: data.history_desc3 || DEFAULT_SETTINGS.historyDesc3,

                        // New Form Configs (Assuming JSONB or similar structure in DB, or we just rely on defaults for now if DB not updated)
                        configDonation: data.config_donation || DEFAULT_SETTINGS.configDonation,
                        configLight: data.config_light || DEFAULT_SETTINGS.configLight,
                        configEvent: data.config_event || DEFAULT_SETTINGS.configEvent,
                    };
                    setSiteSettings(mappedSettings);
                }
            } catch (e: any) {
                if (e.name === 'AbortError' || e.message?.includes('AbortError')) return;
                console.error("Critical error fetching settings:", e);
            }
        };

        fetchSettings();
        // Subscribe to settings changes
        const channel = supabase.channel('settings_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, fetchSettings)
            .subscribe();

        return () => { supabase.removeChannel(channel); }
    }, []);

    // 2. Sync Collections
    useEffect(() => syncTable('news', setNews, 'date', false), []);
    useEffect(() => syncTable('events', setEvents, 'date', true), []);
    useEffect(() => syncTable('services', setServices, 'created_at', false), []);
    useEffect(() => syncTable('gallery', setGallery, 'created_at', false), []);
    useEffect(() => syncTable('org_members', setOrgMembers, 'order', true), []); // Assuming 'order' column exists
    useEffect(() => syncTable('registrations', setRegistrations, 'created_at', false), []);
    useEffect(() => syncTable('faqs', setFaqs, 'created_at', false), []);
    useEffect(() => syncTable('gallery_albums', setGalleryAlbums, 'created_at', false), []);
    useEffect(() => syncTable('digital_products', setScriptures, 'created_at', false), []);
    useEffect(() => syncTable('notifications', setNotifications, 'created_at', false), []);
    useEffect(() => syncTable('announcements', setAnnouncements, 'created_at', false), []);
    // useEffect(() => syncTable('profiles', setProfiles, 'created_at', false), []);
    // useEffect(() => syncTable('purchases', setPurchases, 'created_at', false), []);

    // Notification Actions
    const markNotificationAsRead = async (id: string) => {
        if (isSupabaseConfigured()) {
            await supabase.from('notifications').update({ is_read: true }).eq('id', id);
        } else {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        }
    };

    const deleteNotification = async (id: string) => {
        if (isSupabaseConfigured()) {
            await supabase.from('notifications').delete().eq('id', id);
        } else {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }
    };


    // === ACTIONS ===
    const localCreate = async (table: string, item: any) => {
        const response = await fetch(`/api/content/${table}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || result.details || '新增失敗');
        return result;
    };

    const localUpdate = async (table: string, id: string, item: any) => {
        const response = await fetch(`/api/content/${table}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || result.details || '更新失敗');
        return result;
    };

    const localDelete = async (table: string, id: string) => {
        const response = await fetch(`/api/content/${table}/${id}`, { method: 'DELETE' });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || result.details || '刪除失敗');
    };

    const addNews = async (item: Omit<NewsItem, 'id'>) => {
        if (isSupabaseConfigured()) {
            const { error } = await supabase.from('news').insert([item]);
            if (error) console.error("Error adding news:", error);
        } else {
            const newItem = await localCreate('news', item);
            setNews(prev => [newItem, ...prev]);
        }
    };
    const updateNews = async (id: string, item: Partial<NewsItem>) => {
        if (isSupabaseConfigured()) {
            await supabase.from('news').update(item).eq('id', id);
        } else {
            await localUpdate('news', id, item);
            setNews(prev => prev.map(n => n.id === id ? { ...n, ...item } : n));
        }
    };
    const deleteNews = async (id: string) => {
        if (isSupabaseConfigured()) {
            const { error } = await supabase.from('news').delete().eq('id', id);
            if (error) throw error;
        } else {
            await localDelete('news', id);
        }
        setNews(prev => prev.filter(item => item.id !== id));
    };

    const addEvent = async (item: Omit<TempleEvent, 'id'>) => {
        if (isSupabaseConfigured()) {
            const dbItem: any = { ...item };

            if ('lunarDate' in item) {
                if (item.lunarDate) dbItem.lunar_date = item.lunarDate;
                delete dbItem.lunarDate;
            }

            if ('endDate' in item) {
                if (item.endDate) dbItem.end_date = item.endDate;
                delete dbItem.endDate;
            }

            if ('lunarEndDate' in item) {
                if (item.lunarEndDate) dbItem.lunar_end_date = item.lunarEndDate;
                delete dbItem.lunarEndDate;
            }

            if (item.fieldConfig) {
                dbItem.field_config = item.fieldConfig;
                delete dbItem.fieldConfig;
            }

            // Strip autogenerated or UI-only fields
            delete dbItem.id;
            delete dbItem.createdAt;
            delete dbItem.updatedAt;
            delete dbItem.isRange;

            const { error } = await supabase.from('events').insert([dbItem]);
            if (error) {
                console.error("Supabase add event error:", error);
                throw error;
            }
        } else {
            const newItem = await localCreate('events', item);
            setEvents(prev => [...prev, newItem].sort((a, b) => a.date.localeCompare(b.date)));
        }
    };
    const updateEvent = async (id: string, item: Partial<TempleEvent>) => {
        if (isSupabaseConfigured()) {
            const dbItem: any = { ...item };
            if ('lunarDate' in item) {
                if (item.lunarDate !== undefined) dbItem.lunar_date = item.lunarDate;
                delete dbItem.lunarDate;
            }
            if ('endDate' in item) {
                if (item.endDate !== undefined) dbItem.end_date = item.endDate;
                delete dbItem.endDate;
            }
            if ('lunarEndDate' in item) {
                if (item.lunarEndDate !== undefined) dbItem.lunar_end_date = item.lunarEndDate;
                delete dbItem.lunarEndDate;
            }
            if (item.fieldConfig) {
                dbItem.field_config = item.fieldConfig;
                delete dbItem.fieldConfig;
            }
            // Strip fields that shouldn't be updated or cause schema errors
            delete dbItem.id;
            delete dbItem.createdAt;
            delete dbItem.updatedAt;
            delete dbItem.isRange;
            const { error } = await supabase.from('events').update(dbItem).eq('id', id);
            if (error) {
                console.error("Supabase update event error:", error);
                throw error;
            }
        } else {
            await localUpdate('events', id, item);
            setEvents(prev => prev.map(e => e.id === id ? { ...e, ...item } : e));
        }
    };
    const deleteEvent = async (id: string) => {
        if (isSupabaseConfigured()) {
            const { error } = await supabase.from('events').delete().eq('id', id);
            if (error) throw error;
        } else {
            await localDelete('events', id);
        }
        setEvents(prev => prev.filter(item => item.id !== id));
    };

    const addService = async (item: Omit<ServiceItem, 'id'>) => {
        if (isSupabaseConfigured()) {
            const dbItem: any = {};
            const toSnake = (s: string) => s.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

            for (const key in item) {
                if (Object.prototype.hasOwnProperty.call(item, key)) {
                    const snakeKey = toSnake(key);
                    // Explicitly handle fieldConfig as JSONB
                    if (key === 'fieldConfig') {
                        dbItem.field_config = (item as any)[key];
                    } else if (key === 'iconName') {
                        dbItem.icon_name = (item as any)[key];
                    } else if (!['id', 'createdAt', 'updatedAt'].includes(key)) {
                        dbItem[snakeKey] = (item as any)[key];
                    }
                }
            }

            const { error } = await supabase.from('services').insert([dbItem]);
            if (error) {
                console.error("Supabase add service error:", error);
                throw error;
            }
        } else {
            const newItem = await localCreate('services', item);
            setServices(prev => [...prev, newItem]);
        }
    };
    const updateService = async (id: string, item: Partial<ServiceItem>) => {
        if (isSupabaseConfigured()) {
            const dbItem: any = { ...item };
            if ('iconName' in item) {
                if (item.iconName !== undefined) dbItem.icon_name = item.iconName;
                delete dbItem.iconName;
            }
            if (item.fieldConfig) {
                dbItem.field_config = item.fieldConfig;
                delete dbItem.fieldConfig;
            }
            if ((item as any).lightDurationDays !== undefined) {
                dbItem.light_duration_days = (item as any).lightDurationDays;
                delete dbItem.lightDurationDays;
            }
            // Strip fields that shouldn't be updated
            delete dbItem.id;
            delete dbItem.createdAt;
            delete dbItem.updatedAt;
            const { error } = await supabase.from('services').update(dbItem).eq('id', id);
            if (error) {
                console.error("Supabase update service error:", error);
                throw error;
            }
        } else {
            await localUpdate('services', id, item);
            setServices(prev => prev.map(s => s.id === id ? { ...s, ...item } : s));
        }
    };
    const deleteService = async (id: string) => {
        if (isSupabaseConfigured()) {
            const { error } = await supabase.from('services').delete().eq('id', id);
            if (error) throw error;
        } else {
            await localDelete('services', id);
        }
        setServices(prev => prev.filter(item => item.id !== id));
    };

    const toGalleryDbItem = (item: any) => {
        const dbItem: any = {};
        if (item.title !== undefined) dbItem.title = item.title;
        if (item.url !== undefined) dbItem.url = item.url;
        if (item.type !== undefined) dbItem.type = item.type;
        if (item.albumId !== undefined || item.album_id !== undefined) {
            dbItem.album_id = item.albumId !== undefined ? item.albumId : item.album_id;
        }
        return dbItem;
    };

    const addGalleryItem = async (item: Omit<GalleryItem, 'id'>) => {
        if (isSupabaseConfigured()) {
            const dbItem = toGalleryDbItem(item);
            const { error } = await supabase.from('gallery').insert([dbItem]);
            if (error) throw error;
        } else {
            const newItem = await localCreate('gallery', item);
            setGallery(prev => [...prev, newItem]);
        }
    };
    const addGalleryItems = async (items: Omit<GalleryItem, 'id'>[]) => {
        if (isSupabaseConfigured()) {
            const dbItems = items.map(item => toGalleryDbItem(item));
            const { error } = await supabase.from('gallery').insert(dbItems);
            if (error) throw error;
        } else {
            const newItems = [];
            for (const item of items) {
                newItems.push(await localCreate('gallery', item));
            }
            setGallery(prev => [...prev, ...newItems]);
        }
    };
    const updateGalleryItem = async (id: string, item: Partial<GalleryItem>) => {
        if (isSupabaseConfigured()) {
            const dbItem = toGalleryDbItem(item);
            const { error } = await supabase.from('gallery').update(dbItem).eq('id', id);
            if (error) throw error;
        } else {
            await localUpdate('gallery', id, item);
            setGallery(prev => prev.map(g => g.id === id ? { ...g, ...item } : g));
        }
    };
    const deleteGalleryItem = async (id: string) => {
        if (isSupabaseConfigured()) {
            const { error } = await supabase.from('gallery').delete().eq('id', id);
            if (error) throw error;
        } else {
            await localDelete('gallery', id);
        }
        setGallery(prev => prev.filter(item => item.id !== id));
    };

    const addGalleryAlbum = async (album: Omit<GalleryAlbum, 'id'>) => {
        // Optimistic Update: Add to UI immediately with temporary ID
        const tempId = `temp_${Date.now()}`;
        const optimisticAlbum: GalleryAlbum = {
            id: tempId,
            title: album.title,
            description: album.description,
            coverImageUrl: album.coverImageUrl,
            eventDate: album.eventDate
        };
        setGalleryAlbums(prev => [optimisticAlbum, ...prev]);

        if (isSupabaseConfigured()) {
            // Sanitize: Only include allowed fields to prevent 400 Bad Request
            const dbAlbum: any = {
                title: album.title,
                description: album.description || null
            };

            if (album.coverImageUrl) {
                dbAlbum.cover_image_url = album.coverImageUrl;
            }
            if (album.eventDate) {
                dbAlbum.event_date = album.eventDate;
            }

            const { data, error } = await supabase.from('gallery_albums').insert([dbAlbum]).select().single();

            if (error) {
                console.error("Error creating album:", error);
                // Rollback on error
                setGalleryAlbums(prev => prev.filter(a => a.id !== tempId));
                alert(`建立相簿失敗: ${error.message}`);
                throw error;
            } else if (data) {
                // Replace temporary ID with real ID from database
                setGalleryAlbums(prev => prev.map(a => a.id === tempId ? { ...a, id: data.id } : a));
            }
        } else {
            try {
                const newAlbum = await localCreate('gallery_albums', album);
                setGalleryAlbums(prev => prev.map(a => a.id === tempId ? newAlbum : a));
            } catch (error) {
                setGalleryAlbums(prev => prev.filter(a => a.id !== tempId));
                throw error;
            }
        }
    };

    const updateGalleryAlbum = async (id: string, album: Partial<GalleryAlbum>) => {
        // Optimistic Update: Update UI immediately
        setGalleryAlbums(prev => prev.map(a => a.id === id ? { ...a, ...album } : a));

        if (isSupabaseConfigured()) {
            const dbAlbum: any = { ...album };
            if (album.coverImageUrl) {
                dbAlbum.cover_image_url = album.coverImageUrl;
                delete dbAlbum.coverImageUrl;
            }
            if (album.eventDate) {
                dbAlbum.event_date = album.eventDate;
                delete dbAlbum.eventDate;
            }
            // Remove derived fields
            delete dbAlbum.photoCount;
            const { error } = await supabase.from('gallery_albums').update(dbAlbum).eq('id', id);
            if (error) {
                console.error("Supabase update album error:", error);
                throw error;
            }
        } else {
            await localUpdate('gallery_albums', id, album);
        }
    };

    const deleteGalleryAlbum = async (id: string) => {
        // Optimistic Update: Remove from UI immediately
        const albumToDelete = galleryAlbums.find(a => a.id === id);
        setGalleryAlbums(prev => prev.filter(a => a.id !== id));

        if (isSupabaseConfigured()) {
            try {
                // Manual Cascade: Delete items in the album first
                const { error: itemsError } = await supabase.from('gallery').delete().eq('album_id', id);
                if (itemsError) throw itemsError;

                // Then delete the album
                const { error } = await supabase.from('gallery_albums').delete().eq('id', id);
                if (error) throw error;
            } catch (error: any) {
                console.error("Error deleting album:", error);
                // Rollback
                if (albumToDelete) {
                    setGalleryAlbums(prev => [...prev, albumToDelete]);
                }
                alert(`刪除失敗: ${error.message}`);
            }
        } else {
            await localDelete('gallery_albums', id);
            setGallery(prev => prev.filter(item => item.albumId !== id));
        }
    };

    const addOrgMember = async (item: Omit<OrgMember, 'id'>) => {
        if (isSupabaseConfigured()) {
            await supabase.from('org_members').insert([item]);
        } else {
            const newItem = await localCreate('org_members', item);
            setOrgMembers(prev => [...prev, newItem]);
        }
    };
    const updateOrgMember = async (id: string, item: Partial<OrgMember>) => {
        if (isSupabaseConfigured()) {
            await supabase.from('org_members').update(item).eq('id', id);
        } else {
            await localUpdate('org_members', id, item);
            setOrgMembers(prev => prev.map(m => m.id === id ? { ...m, ...item } : m));
        }
    };
    const deleteOrgMember = async (id: string) => {
        if (isSupabaseConfigured()) {
            const { error } = await supabase.from('org_members').delete().eq('id', id);
            if (error) throw error;
        } else {
            await localDelete('org_members', id);
        }
        setOrgMembers(prev => prev.filter(item => item.id !== id));
    };


    const addFaq = async (item: Omit<FAQItem, 'id'>) => {
        if (isSupabaseConfigured()) {
            await supabase.from('faqs').insert([item]);
        } else {
            const newItem = await localCreate('faqs', item);
            setFaqs(prev => [...prev, newItem]);
        }
    };
    const updateFaq = async (id: string, item: Partial<FAQItem>) => {
        if (isSupabaseConfigured()) {
            await supabase.from('faqs').update(item).eq('id', id);
        } else {
            await localUpdate('faqs', id, item);
            setFaqs(prev => prev.map(f => f.id === id ? { ...f, ...item } : f));
        }
    };
    const deleteFaq = async (id: string) => {
        if (isSupabaseConfigured()) {
            const { error } = await supabase.from('faqs').delete().eq('id', id);
            if (error) throw error;
        } else {
            await localDelete('faqs', id);
        }
        setFaqs(prev => prev.filter(item => item.id !== id));
    };

    const addAnnouncement = async (item: Omit<Announcement, 'id' | 'created_at'>) => {
        let finalItem: any = { ...item };
        // Ensure both camelCase and snake_case are present for internal consistency
        if (finalItem.is_active !== undefined) finalItem.isActive = finalItem.is_active;
        if (finalItem.isActive !== undefined) finalItem.is_active = finalItem.isActive;

        if (isSupabaseConfigured()) {
            const dbItem: any = { ...item };
            delete dbItem.id;
            delete dbItem.createdAt;
            delete dbItem.created_at;
            delete dbItem.isActive; // Remove camelCase before DB save

            const { data, error } = await supabase.from('announcements').insert([dbItem]).select().single();
            if (error) throw error;
            if (data) finalItem = { ...finalItem, id: data.id, created_at: data.created_at };
        } else {
            finalItem.id = `local_${Date.now()}`;
        }
        setAnnouncements(prev => [finalItem, ...prev]);
    };

    const updateAnnouncement = async (id: string, item: Partial<Announcement> & { isActive?: boolean }) => {
        // Map camelCase to snake_case if needed
        const updates: any = { ...item };
        if (updates.isActive !== undefined) updates.is_active = updates.isActive;
        if (updates.is_active !== undefined) updates.isActive = updates.is_active;

        // Optimistic UI update
        setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));

        if (isSupabaseConfigured()) {
            const dbItem: any = { ...updates };
            delete dbItem.id;
            delete dbItem.createdAt;
            delete dbItem.created_at;
            delete dbItem.isActive; // Remove camelCase before DB save

            const { error } = await supabase.from('announcements').update(dbItem).eq('id', id);
            if (error) {
                console.error('Update announcement failed', error);
                throw error;
            }
        }
    };

    const deleteAnnouncement = async (id: string) => {
        // Optimistic UI update
        setAnnouncements(prev => prev.filter(item => item.id !== id));

        if (isSupabaseConfigured()) {
            const { error } = await supabase.from('announcements').delete().eq('id', id);
            if (error) throw error;
        }
    };

    const addRegistration = async (reg: Omit<Registration, 'id' | 'createdAt'>) => {
        const newReg = {
            ...reg,
            status: 'PAID' as const,
            is_processed: false
        };
        if (isSupabaseConfigured()) {
            // Helper to check if string is a valid UUID
            const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

            // Map camelCase to snake_case
            const dbReg = {
                // EXTREME SAFETY FIX: Only use serviceId if it's a valid UUID. 
                // Any other value (like 'EVENT', 's1', or empty) is forced to null to avoid Foreign Key violation.
                service_id: (newReg.serviceId && isUuid(newReg.serviceId)) ? newReg.serviceId : null,
                service_title: newReg.serviceTitle,
                name: newReg.name,
                phone: newReg.phone,
                birth_year: newReg.birthYear,
                birth_month: newReg.birthMonth,
                birth_day: newReg.birthDay,
                birth_hour: newReg.birthHour,
                city: newReg.city,
                district: newReg.district,
                road: newReg.road,
                address_detail: newReg.addressDetail,
                id_number: newReg.idNumber,
                amount: newReg.amount,
                status: newReg.status,
                is_processed: newReg.isProcessed,
                light_start_date: newReg.lightStartDate,
                light_expire_date: newReg.lightExpireDate,
                light_duration_days: newReg.lightDurationDays,
                payment_method: newReg.paymentMethod,
                payment_details: newReg.paymentDetails,
                bank_last_five: newReg.bankLastFive,
                user_id: newReg.userId
            };
            const { error } = await supabase.from("registrations").insert([dbReg]);
            if (error) {
                console.error("Error adding registration:", error);
                throw error; // Throw error so UI knows it failed
            } else {
                // Success: Create a System Notification for Admins
                const notif = {
                    type: 'ORDER',
                    title: '新報名通知',
                    message: `${newReg.name} 已報名：${newReg.serviceTitle} ($${newReg.amount})`,
                    is_read: false,
                    link: 'REGISTRATIONS' // Internal link for AdminPanel tab
                };
                await supabase.from('notifications').insert([notif]);

                // LINE Notify Integration (Fire and Forget)
                const apiBase = '';

                fetch(`${apiBase}/api/line-notify`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: `\n[新報名通知]\n信眾：${newReg.name}\n項目：${newReg.serviceTitle}\n金額：$${newReg.amount}` })
                }).catch(err => console.warn('Failed to send LINE notification:', err));
            }
        } else {
            const localReg = await localCreate('registrations', { ...newReg, isProcessed: false });
            setRegistrations(prev => [localReg, ...prev]);
            console.log("Demo Mode: Registration added locally", localReg);
        }
    };
    const updateRegistration = async (id: string, reg: Partial<Registration>) => {
        if (isSupabaseConfigured()) {
            // This mapping is tedious, simplistic check
            const dbReg: any = { ...reg };
            if (reg.isProcessed !== undefined) { dbReg.is_processed = reg.isProcessed; delete dbReg.isProcessed; }
            if (reg.lightStartDate !== undefined) { dbReg.light_start_date = reg.lightStartDate; delete dbReg.lightStartDate; }
            if (reg.lightExpireDate !== undefined) { dbReg.light_expire_date = reg.lightExpireDate; delete dbReg.lightExpireDate; }
            if (reg.lightDurationDays !== undefined) { dbReg.light_duration_days = reg.lightDurationDays; delete dbReg.lightDurationDays; }
            // ... add other mappings if editable
            await supabase.from("registrations").update(dbReg).eq('id', id);
        } else {
            await localUpdate('registrations', id, reg);
            setRegistrations(prev => prev.map(r => r.id === id ? { ...r, ...reg } : r));
        }
    };
    const deleteRegistration = async (id: string) => {
        if (isSupabaseConfigured()) {
            const { error } = await supabase.from("registrations").delete().eq('id', id);
            if (error) throw error;
        } else {
            await localDelete('registrations', id);
        }
        setRegistrations(prev => prev.filter(r => r.id !== id));
    };

    const getRegistrationsByPhone = (phone: string) => registrations.filter(r => r.phone === phone);

    // CRITICAL: Update Site Settings
    const updateSiteSettings = async (newSettings: Partial<SiteSettings>) => {
        if (isSupabaseConfigured()) {
            const dbSettings: any = {};
            // Map keys
            if (newSettings.templeName) dbSettings.temple_name = newSettings.templeName;
            // ... (We should technically map all of them, but user likely updates one by one or few)
            // For robustness, let's map all provided keys
            const map = {
                templeName: 'temple_name', address: 'address', phone: 'phone', lineUrl: 'line_url',
                heroTitle: 'hero_title', heroSubtitle: 'hero_subtitle', heroImage: 'hero_image',
                deityImage: 'deity_image', deityTitle: 'deity_title', deityIntro: 'deity_intro',
                deityBirthday: 'deity_birthday', deityBirthdayLabel: 'deity_birthday_label',
                deityDuty: 'deity_duty', deityDutyLabel: 'deity_duty_label',
                historyImageRoof: 'history_image_roof', historyRoofTitle: 'history_roof_title',
                historyRoofDesc: 'history_roof_desc', historyImageStone: 'history_image_stone',
                historyStoneTitle: 'history_stone_title', historyStoneDesc: 'history_stone_desc',
                historyTitle1: 'history_title1', historyDesc1: 'history_desc1',
                historyTitle2: 'history_title2', historyDesc2: 'history_desc2',
                historyTitle3: 'history_title3', historyDesc3: 'history_desc3',
                configDonation: 'config_donation', configLight: 'config_light', configEvent: 'config_event'
            };
            Object.entries(newSettings).forEach(([k, v]) => {
                if ((map as any)[k]) dbSettings[(map as any)[k]] = v;
            });

            // We assume there is only one row, so we update the first one or a known ID?
            // Usually site_settings table should have a singleton row. 
            // We will try to update where 'id' is not null (unsafe) or just upsert if we knew the ID.
            // Let's fetch the ID first if we don't have it, or just update all rows (hacky but works for singleton)

            // Perform robust Upsert: Check if row exists, then Update or Insert
            const { data: existing, error: fetchError } = await supabase.from('site_settings').select('id').maybeSingle();

            let error;
            if (existing) {
                const { error: updateError } = await supabase.from('site_settings').update(dbSettings).eq('id', existing.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase.from('site_settings').insert([dbSettings]);
                error = insertError;
            }

            if (error) {
                console.error("Supabase update settings error:", error);
                throw error;
            }
        } else {
            const response = await fetch('/api/site-settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSettings)
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(result.error || result.details || '一般設定更新失敗');
            setSiteSettings(prev => ({ ...prev, ...result }));
        }
    };

    const addScripture = async (item: Omit<DigitalProduct, 'id' | 'createdAt'>) => {
        if (isSupabaseConfigured()) {
            const dbItem: any = {
                title: item.title,
                author: item.author || '',
                content: item.content || '',
                description: item.description || '',
                price: item.price || 0,
                file_type: item.fileType || 'HTML',
                file_path: item.filePath || '',
                preview_url: item.previewUrl || '',
                category: item.category || '道藏藏書',
                attachments: item.attachments || [],
                tags: item.tags || [],
                is_limited_time: item.isLimitedTime || false,
                promotion_end_date: item.promotionEndDate || null
            };
            const { error } = await supabase.from('digital_products').insert([dbItem]);
            if (error) throw error;
        } else {
            const response = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item)
            });
            const newItem = await response.json();
            if (!response.ok) throw new Error(newItem.error || newItem.details || '新增藏書失敗');
            setScriptures(prev => [newItem, ...prev]);
        }
    };

    const updateScripture = async (id: string, item: Partial<DigitalProduct>) => {
        if (isSupabaseConfigured()) {
            const dbItem: any = {};
            if (item.title !== undefined) dbItem.title = item.title;
            if (item.author !== undefined) dbItem.author = item.author;
            if (item.content !== undefined) dbItem.content = item.content;
            if (item.description !== undefined) dbItem.description = item.description;
            if (item.price !== undefined) dbItem.price = item.price;
            if (item.fileType !== undefined) dbItem.file_type = item.fileType;
            if (item.filePath !== undefined) dbItem.file_path = item.filePath;
            if (item.previewUrl !== undefined) dbItem.preview_url = item.previewUrl;
            if (item.category !== undefined) dbItem.category = item.category;
            if (item.tags !== undefined) dbItem.tags = item.tags;
            if (item.isLimitedTime !== undefined) dbItem.is_limited_time = item.isLimitedTime;
            if (item.promotionEndDate !== undefined) dbItem.promotion_end_date = item.promotionEndDate;
            if (item.attachments !== undefined) dbItem.attachments = item.attachments;

            const { error } = await supabase.from('digital_products').update(dbItem).eq('id', id);
            if (error) throw error;
        } else {
            const response = await fetch(`/api/products/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item)
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(result.error || result.details || '更新藏書失敗');
            setScriptures(prev => prev.map(s => s.id === id ? { ...s, ...item } : s));
        }
    };

    const deleteScripture = async (id: string) => {
        // Use Backend API for robust deletion (handles FK and RLS issues)
        const response = await fetch(`/api/products/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
                    console.error("Failed to parse error JSON:", e);
                    // Try to get text, or default to status text
                    const text = await response.text().catch(() => '');
                    throw new Error(`Server Error (${response.status}): ${text || response.statusText}`);
                }
                const err: any = new Error(errorData.details || errorData.error || '刪除失敗');
                if (errorData.code) err.code = errorData.code;
                throw err;
            }
        }

        // Update local state immediately for fast UI
        setScriptures(prev => prev.filter(s => s.id !== id));
    };

    const deleteScriptureWithOrders = async (id: string) => {
        // The Backend API already handles order cleanup, so we can use the same endpoint
        const response = await fetch(`/api/products/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            const errorData = await response.json();
            const err: any = new Error(errorData.details || errorData.error || '強制刪除失敗');
            if (errorData.code) err.code = errorData.code;
            throw err;
        }

        // Update local state for both products and orders
        setScriptureOrders(prev => prev.filter(o => o.productId !== id));
        setScriptures(prev => prev.filter(s => s.id !== id));
    };

    const fetchScriptureOrders = async () => {
        if (isSupabaseConfigured()) {
            const { data, error } = await supabase
                .from('orders')
                .select('*, product:digital_products!product_id(*)')
                .order('created_at', { ascending: false });

            if (!error && data) {
                // Map snake_case to camelCase
                const mapped = data.map((o: any) => ({
                    id: o.id,
                    userId: o.user_id,
                    productId: o.product_id,
                    amount: o.amount,
                    status: o.status,
                    merchantTradeNo: o.merchant_trade_no,
                    paymentDate: o.payment_date,
                    paymentType: o.payment_type,
                    createdAt: o.created_at,
                    product: o.product ? {
                        id: o.product.id,
                        title: o.product.title,
                        description: o.product.description,
                        price: o.product.price,
                        fileType: o.product.file_type,
                        filePath: o.product.file_path,
                        previewUrl: o.product.preview_url,
                        category: o.product.category,
                        createdAt: o.product.created_at
                    } : undefined
                }));
                setScriptureOrders(mapped);
            }
        } else {
            const response = await fetch('/api/orders');
            const result = await response.json().catch(() => []);
            if (!response.ok) throw new Error(result.error || result.details || '載入本機訂單失敗');
            setScriptureOrders(result);
        }
    };

    const deleteScriptureOrder = async (id: string) => {
        if (isSupabaseConfigured()) {
            const { error, count } = await supabase
                .from('orders')
                .delete()
                .eq('id', id);

            if (error) {
                console.error("Error deleting order:", error);
                throw error;
            }
        } else {
            const response = await fetch(`/api/orders/${id}`, { method: 'DELETE' });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(result.error || result.details || '刪除訂單失敗');
        }

        // Update local state immediately for fast UI
        setScriptureOrders(prev => prev.filter(o => o.id !== id));
    };

    const updateScriptureOrder = async (id: string, updates: Partial<ScriptureOrder>) => {
        if (isSupabaseConfigured()) {
            const dbUpdates: any = { ...updates };
            if (updates.userId) { dbUpdates.user_id = updates.userId; delete dbUpdates.userId; }
            if (updates.productId) { dbUpdates.product_id = updates.productId; delete dbUpdates.productId; }
            if (updates.merchantTradeNo) { dbUpdates.merchant_trade_no = updates.merchantTradeNo; delete dbUpdates.merchantTradeNo; }

            // If manually setting to PAID, add payment info
            if (updates.status === 'PAID') {
                dbUpdates.payment_date = new Date().toISOString();
                dbUpdates.payment_type = 'MANUAL';
            }

            const { error, count } = await supabase
                .from('orders')
                .update(dbUpdates)
                .eq('id', id)
                .select(); // Ensure we get return value to check RLS

            if (error) {
                console.error("Order update failed:", error);
                throw error;
            }

            // If count is 0, it means RLS prevented update or ID not found
            if (count === 0) {
                console.warn("Order update returned 0 rows affected. RLS may be blocking.");
            }


            // FULFILLMENT LOGIC: If status changed to PAID, grant access
            if (updates.status === 'PAID') {
                const order = scriptureOrders.find(o => o.id === id);
                if (order) {
                    const { error: fulfillError } = await supabase
                        .from('purchases')
                        .upsert({
                            user_id: order.userId,
                            product_id: order.productId,
                            order_id: id
                        }, { onConflict: 'user_id,product_id' });

                    if (fulfillError) {
                        console.error("Fulfillment failed:", fulfillError);
                        alert(`【發貨失敗】\n原因：${fulfillError.message}\n詳情：${fulfillError.details || '無'}\n請確認 SQL 腳本 fix_rls.sql 已執行。`);
                    }
                }
            }

            // Refetch to ensure consistency
            await fetchScriptureOrders();
        } else {
            const response = await fetch(`/api/orders/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(result.error || result.details || '更新訂單失敗');
            await fetchScriptureOrders();
        }
    };

    const resetData = async () => {
        if (window.confirm('確定要重置所有資料嗎？(警告：此操作不可逆)')) {
            if (isSupabaseConfigured()) {
                alert('Supabase 重置功能尚未實作 (需刪除所有資料表內容並重新插入)');
                // Implementing full DB reset via client is dangerous and complex without admin role
            } else {
                // Local Reset
                setSiteSettings(DEFAULT_SETTINGS);
                setNews(INITIAL_NEWS);
                setEvents(INITIAL_EVENTS);
                setServices(INITIAL_SERVICES);

                setOrgMembers(INITIAL_ORG);
                setFaqs(INITIAL_FAQS);
                setRegistrations([]);
                setGallery([]);
                alert('已重置預設資料 (演示模式)');
            }
        }
    };

    // Grant Access Logic
    const grantScriptureAccess = async (userId: string, productId: string) => {
        console.log(`Granting access: User ${userId}, Product ${productId}`);
        if (isSupabaseConfigured()) {
            // Upsert to avoid duplicates. Use select to get the inserted/returned row for state update.
            const { data, error } = await supabase.from('purchases').upsert({
                user_id: userId,
                product_id: productId,
                order_id: null // Manual grant
            }, { onConflict: 'user_id,product_id' }).select().single();

            if (error) {
                console.error("Grant access error:", error);
                throw error;
            }

            // Immediate state update
            if (data) {
                // Map snake_case to camelCase for local consistency if needed, 
                // but existing syncTable maps to camelCase automatically.
                // We should match the format used by syncTable (which maps keys).
                // Let's manually reconstruct it or check syncTable mapping.
                // syncTable uses a helper: const toCamel = (s: string) => s.replace(/(_\w)/g, k => k[1].toUpperCase());

                const toCamel = (s: string) => s.replace(/(_\w)/g, k => k[1].toUpperCase());
                const mapKeys = (o: any) => {
                    const newO: any = {};
                    for (const key in o) {
                        newO[toCamel(key)] = o[key];
                    }
                    return newO;
                };

                const mappedPurchase = mapKeys(data);
                setPurchases(prev => {
                    // Avoid duplicates in state
                    if (prev.some(p => p.id === mappedPurchase.id)) return prev;
                    return [...prev, mappedPurchase];
                });
            }
        } else {
            const response = await fetch('/api/purchases', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, productId })
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(result.error || result.details || '開通藏書權限失敗');
            setPurchases(prev => [...prev, { id: `local_p_${Date.now()}`, userId, productId, createdAt: new Date().toISOString() }]);
        }
    };

    const revokeScriptureAccess = async (userId: string, productId: string) => {
        console.log(`Revoking access: User ${userId}, Product ${productId}`);
        if (isSupabaseConfigured()) {
            const { error } = await supabase.from('purchases').delete().match({ user_id: userId, product_id: productId });
            if (error) {
                console.error("Revoke access error:", error);
                throw error;
            }
            // Immediate state update: Remove from local state
            setPurchases(prev => prev.filter(p => !((p.userId === userId || p.user_id === userId) && (p.productId === productId || p.product_id === productId))));
        } else {
            const response = await fetch(`/api/purchases?userId=${encodeURIComponent(userId)}&productId=${encodeURIComponent(productId)}`, { method: 'DELETE' });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(result.error || result.details || '移除藏書權限失敗');
            setPurchases(prev => prev.filter(p => !((p.userId === userId || p.user_id === userId) && (p.productId === productId || p.product_id === productId))));
        }
    };

    // === AUTHENTICATION ===
    const [user, setUser] = useState<any>(null); // Supabase User
    const [userProfile, setUserProfile] = useState<any>(null); // Should be UserProfile type, but use any to avoid mismatches for agile dev

    // Check Auth State
    useEffect(() => {
        if (!isSupabaseConfigured()) {
            const savedUser = localStorage.getItem('guangxing_local_user');
            if (savedUser) {
                try {
                    const parsedUser = JSON.parse(savedUser);
                    setUser(parsedUser);
                    fetchUserProfile(parsedUser.id);
                } catch {
                    localStorage.removeItem('guangxing_local_user');
                }
            }
            return;
        }

        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchUserProfile(session.user.id);
            }
        });

        // Listen for changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {

            // Optimization: Avoid re-rendering if user ID hasn't changed (prevents loops on TOKEN_REFRESHED)
            setUser(prevUser => {
                if (session?.user?.id === prevUser?.id) return prevUser;
                console.log(`Auth State Changed: ${event} -> updating user state`);
                return session?.user ?? null;
            });

            // Optimization: Only fetch profile on sign-in or initial session to avoid 429 loops
            if (session?.user) {
                if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
                    fetchUserProfile(session.user.id);
                }
            } else {
                setUserProfile(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchUserProfile = async (userId: string) => {
        if (!isSupabaseConfigured()) {
            const response = await fetch(`/api/profiles/${userId}`);
            if (!response.ok) return;
            const profile = await response.json();
            setUserProfile(profile);
            return;
        }
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

        if (error) {
            if (error.message?.includes('AbortError') || error.details?.includes('AbortError') || error.code === '20') {
                return;
            }
            console.error('Error fetching profile:', error);
        } else if (!data) {
            // User exists in Auth but has no profile row yet (e.g. strict RLS or trigger delay)
            console.log('User has no profile data yet.');
            setUserProfile(null);

        } else if (data) {
            // Map snake_case to camelCase
            const profile: any = {
                id: data.id,
                email: data.email,
                fullName: data.full_name,
                phone: data.phone,
                birthYear: data.birth_year,
                birthMonth: data.birth_month,
                birthDay: data.birth_day,
                birthHour: data.birth_hour,
                city: data.city,
                district: data.district,
                address: data.address,
                gender: data.gender,
                role: data.role,
                createdAt: data.created_at
            };
            setUserProfile(profile);
        }
    };

    const signOut = async () => {
        try {
            if (isSupabaseConfigured()) {
                await supabase.auth.signOut();
            } else {
                localStorage.removeItem('guangxing_local_user');
            }
        } catch (error) {
            console.error("Supabase signOut error:", error);
        } finally {
            setUser(null);
            setUserProfile(null);
        }
    };

    const signInLocal = async (email: string, password: string) => {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || result.details || '登入失敗');

        localStorage.setItem('guangxing_local_user', JSON.stringify(result.user));
        setUser(result.user);
        setUserProfile(result.user);
    };

    const registerLocal = async (email: string, password: string) => {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || result.details || '註冊失敗');

        localStorage.setItem('guangxing_local_user', JSON.stringify(result.user));
        setUser(result.user);
        setUserProfile(result.user);
    };


    return (
        <DataContext.Provider value={{
            news, events, services, gallery, registrations, orgMembers, faqs, siteSettings, announcements,
            // Auth
            user, userProfile, signOut, fetchUserProfile, signInLocal, registerLocal,
            addNews, updateNews, deleteNews,
            addEvent, updateEvent, deleteEvent,
            addService, updateService, deleteService,
            addGalleryItem, addGalleryItems, updateGalleryItem, deleteGalleryItem,
            addGalleryAlbum, updateGalleryAlbum, deleteGalleryAlbum,
            galleryAlbums,
            addOrgMember, updateOrgMember, deleteOrgMember,
            addFaq, updateFaq, deleteFaq,
            addAnnouncement, updateAnnouncement, deleteAnnouncement,
            addRegistration, updateRegistration, deleteRegistration, getRegistrationsByPhone,

            updateSiteSettings,

            // Members & Access
            profiles, purchases, grantScriptureAccess, revokeScriptureAccess,

            scriptures, scriptureOrders, addScripture, updateScripture, deleteScripture, deleteScriptureWithOrders, fetchScriptureOrders, updateScriptureOrder, deleteScriptureOrder,
            notifications, markNotificationAsRead, deleteNotification,
            resetData
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) throw new Error('useData must be used within a DataProvider');
    return context;
};
