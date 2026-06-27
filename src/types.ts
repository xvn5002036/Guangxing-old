
export interface NavItem {
  label: string;
  href: string;
}

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  iconName: string;
  price: number;
  type: 'LIGHT' | 'DONATION' | 'RITUAL';
  lightDurationDays?: number;
  fieldConfig?: FieldConfig; // Per-item configuration
}

export interface Registration {
  id: string;
  serviceId: string;
  serviceTitle: string;
  name: string;
  phone: string;
  birthYear: string;
  birthMonth: string;
  birthDay: string;
  birthHour: string;
  city: string;
  district: string;
  road: string;
  addressDetail: string;
  gender?: string; // M or F
  amount: number;
  status: 'PAID' | 'PENDING' | 'CANCELLED';
  isProcessed?: boolean; // New field for administrative handling status
  lightStartDate?: string;
  lightExpireDate?: string;
  lightDurationDays?: number;
  createdAt: string;
  paymentMethod?: string;
  paymentDetails?: string;
  bankLastFive?: string;
  idNumber?: string; // New field for ID Card Number
  userId?: string; // Optional because old records won't have it
}

export enum LoadingState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export enum MoonBlockResult {
  NONE = 'NONE',
  SHENG_JIAO = 'SHENG_JIAO',
  XIAO_JIAO = 'XIAO_JIAO',
  YIN_JIAO = 'YIN_JIAO'
}

export interface NewsItem {
  id: string;
  date: string;
  title: string;
  category: string;
}

export interface TempleEvent {
  id: string;
  date: string;
  endDate?: string; // Optional end date for ranges
  lunarDate: string;
  lunarEndDate?: string; // Optional lunar end date for ranges
  title: string;
  description: string;
  time: string;
  type: 'FESTIVAL' | 'RITUAL' | 'SERVICE';
  fieldConfig?: FieldConfig; // Per-item configuration
}

export interface GalleryAlbum {
  id: string;
  title: string;
  description?: string;
  coverImageUrl?: string;
  eventDate?: string;
  createdAt?: string;
  photoCount?: number; // Optional derived field
}

export interface GalleryItem {
  id: string;
  type: 'IMAGE' | 'VIDEO' | 'YOUTUBE';
  url: string;
  title: string;
  albumId?: string;
}

export type OrgCategory = 'LEADER' | 'EXECUTIVE' | 'STAFF';

export interface OrgMember {
  id: string;
  name: string;
  title: string;
  image: string;
  category: OrgCategory;
  order?: number;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface FieldConfig {
  showBirth: boolean;
  showTime: boolean;
  showAddress: boolean;
  showIdNumber: boolean;
  showGender?: boolean;
  memberFortuneRole?: 'taisui' | 'light' | 'ritual' | '';
  memberTaiSuiRecommended?: boolean;
}

export interface SiteSettings {
  templeName: string;
  address: string;
  phone: string;
  lineUrl: string; // New field for LINE Official Account Link

  // Hero Section
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string; // URL

  // Deity Section
  deityImage: string; // URL
  deityTitle: string;
  deityIntro: string; // Long text
  deityBirthday: string;
  deityBirthdayLabel: string;
  deityDuty: string;
  deityDutyLabel: string;

  // History Section Images & Text
  historyImageRoof: string; // URL
  historyRoofTitle: string;
  historyRoofDesc: string;

  historyImageStone: string; // URL
  historyStoneTitle: string;
  historyStoneDesc: string;

  // Timeline Content (The large descriptions on the left)
  historyTitle1: string;
  historyDesc1: string;
  historyTitle2: string;
  historyDesc2: string;
  historyTitle3: string;
  historyDesc3: string;

  // Form Configuration Per Category
  configDonation: FieldConfig;
  configLight: FieldConfig;
  configEvent: FieldConfig;
}

export interface UserProfile {
  id: string; // references auth.users.id
  email: string;
  fullName: string;
  phone: string;
  birthYear: string;
  birthMonth: string;
  birthDay: string;
  birthHour: string;
  city: string;
  district: string;
  address: string;
  gender?: string;
  createdAt: string;
}

// Constants for selectors
export const LUNAR_HOURS = ["子時 (23-01)", "丑時 (01-03)", "寅時 (03-05)", "卯時 (05-07)", "辰時 (07-09)", "巳時 (09-11)", "午時 (11-13)", "未時 (13-15)", "申時 (15-17)", "酉時 (17-19)", "戌時 (19-21)", "亥時 (21-23)", "吉時 (不限)"];

export const TAIWAN_ADDRESS_DATA: Record<string, string[]> = {
  "台北市": ["中正區", "大同區", "中山區", "松山區", "大安區", "萬華區", "信義區", "士林區", "北投區", "內湖區", "南港區", "文山區"],
  "新北市": ["板橋區", "三重區", "中和區", "永和區", "新莊區", "新店區", "樹林區", "鶯歌區", "三峽區", "淡水區", "汐止區", "瑞芳區", "土城區", "蘆洲區", "五股區", "泰山區", "林口區", "深坑區", "石碇區", "坪林區", "三芝區", "石門區", "八里區", "平溪區", "雙溪區", "貢寮區", "金山區", "萬里區", "烏來區"],
  "桃園市": ["桃園區", "中壢區", "大溪區", "楊梅區", "蘆竹區", "大園區", "龜山區", "八德區", "龍潭區", "平鎮區", "新屋區", "觀音區", "復興區"],
  "台中市": ["中區", "東區", "南區", "西區", "北區", "北屯區", "西屯區", "南屯區", "太平區", "大里區", "霧峰區", "烏日區", "豐原區", "后里區", "石岡區", "東勢區", "和平區", "新社區", "潭子區", "大雅區", "神岡區", "大肚區", "沙鹿區", "龍井區", "梧棲區", "清水區", "大甲區", "外埔區", "大安區"],
  "台南市": ["中西區", "東區", "南區", "北區", "安平區", "安南區", "永康區", "歸仁區", "新化區", "左鎮區", "玉井區", "楠西區", "南化區", "仁德區", "關廟區", "龍崎區", "官田區", "麻豆區", "佳里區", "西港區", "七股區", "將軍區", "學甲區", "北門區", "新營區", "後壁區", "白河區", "東山區", "六甲區", "下營區", "柳營區", "鹽水區", "善化區", "大內區", "山上區", "新市區", "安定區"],
  "高雄市": ["新興區", "前金區", "苓雅區", "鹽埕區", "鼓山區", "旗津區", "前鎮區", "三民區", "楠梓區", "小港區", "左營區", "仁武區", "大社區", "岡山區", "路竹區", "阿蓮區", "田寮區", "燕巢區", "橋頭區", "梓官區", "彌陀區", "永安區", "湖內區", "鳳山區", "大寮區", "林園區", "鳥松區", "大樹區", "旗山區", "美濃區", "六龜區", "內門區", "杉林區", "甲仙區", "桃源區", "那瑪夏區", "茂林區", "茄萣區"],
  "彰化縣": ["彰化市", "鹿港鎮", "和美鎮", "線西鄉", "伸港鄉", "福興鄉", "秀水鄉", "花壇鄉", "芬園鄉", "員林市", "溪湖鎮", "田中鎮", "大村鄉", "埔鹽鄉", "埔心鄉", "永靖鄉", "社頭鄉", "二水鄉", "北斗鎮", "二林鎮", "田尾鄉", "埤頭鄉", "芳苑鄉", "大城鄉", "竹塘鄉", "溪州鄉"],
  "嘉義市": ["東區", "西區"],
  "新竹市": ["東區", "北區", "香山區"],
  "基隆市": ["仁愛區", "信義區", "中正區", "中山區", "安樂區", "暖暖區", "七堵區"],
  "屏東縣": ["屏東市", "潮州鎮", "東港鎮", "恆春鎮", "萬丹鄉", "長治鄉", "麟洛鄉", "九如鄉", "里港鄉", "高樹鄉", "鹽埔鄉", "內埔鄉", "竹田鄉", "萬巒鄉", "內埔鄉", "新埤鄉", "枋寮鄉", "新園鄉", "崁頂鄉", "林邊鄉", "南州鄉", "佳冬鄉", "琉球鄉", "車城鄉", "滿州鄉", "枋山鄉", "三地門鄉", "霧臺鄉", "瑪家鄉", "泰武鄉", "來義鄉", "春日鄉", "獅子鄉", "牡丹鄉"],
  "宜蘭縣": ["宜蘭市", "羅東鎮", "蘇澳鎮", "頭城鎮", "礁溪鄉", "壯圍鄉", "員山鄉", "冬山鄉", "五結鄉", "三星鄉", "大同鄉", "南澳鄉"],
  "花蓮縣": ["花蓮市", "鳳林鎮", "玉里鎮", "新城鄉", "吉安鄉", "壽豐鄉", "光復鄉", "豐濱鄉", "瑞穗鄉", "富里鄉", "秀林鄉", "萬榮鄉", "卓溪鄉"],
  "台東縣": ["台東市", "成功鎮", "關山鎮", "卑南鄉", "大武鄉", "太麻里鄉", "東河鄉", "長濱鄉", "鹿野鄉", "池上鄉", "綠島鄉", "延平鄉", "海端鄉", "達仁鄉", "金峰鄉", "蘭嶼鄉"]
};

export const COMMON_ROADS: Record<string, string[]> = {
  "信義區": ["信義路", "忠孝東路", "仁愛路", "和平東路", "基隆路", "松山路", "松德路", "莊敬路", "虎林街", "永吉路"],
  "中正區": ["中山南路", "重慶南路", "羅斯福路", "愛國東路", "延平南路", "凱達格蘭大道", "中華路"],
  "彰化市": ["中山路", "曉陽路", "中正路", "彰美路", "彰南路", "金馬路", "民族路", "華山路"],
  "西屯區": ["台灣大道", "黎明路", "文心路", "市政路", "福科路", "西屯路", "河南路"],
  "板橋區": ["文化路", "中山路", "民生路", "縣民大道", "南雅南路", "重慶路", "四川路"]
};

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
}

export interface DigitalProduct {
  id: string;
  title: string;
  author?: string;
  content?: string;
  description: string;
  price: number;
  fileType: string;
  filePath: string;
  previewUrl: string;
  category: string;
  attachments?: Attachment[];
  tags?: string[];
  isLimitedTime?: boolean;
  promotionEndDate?: string;
  createdAt?: string;
}

export interface ScriptureOrder {
  id: string;
  userId: string;
  productId: string;
  amount: number;
  status: 'PAID' | 'PENDING' | 'FAILED';
  merchantTradeNo: string;
  paymentDate?: string;
  paymentType?: string;
  createdAt?: string;
  product?: DigitalProduct;
}

export interface Notification {
  id: string;
  type: 'ORDER' | 'SYSTEM' | 'ALERT';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export interface Announcement {
  id: string;
  content: string;
  is_active: boolean;
  priority: number;
  link?: string;
  created_at?: string;
}
