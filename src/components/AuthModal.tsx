import React, { useState, useEffect } from 'react';
import { X, User, Lock, Mail, Phone, Calendar, MapPin, LogOut } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../services/supabase';
import { useData } from '../context/DataContext';
import { TAIWAN_ADDRESS_DATA, LUNAR_HOURS } from '../types';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type AuthMode = 'LOGIN' | 'REGISTER' | 'PROFILE';

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
    const { user, userProfile, signOut, fetchUserProfile, signInLocal, registerLocal } = useData();
    const [mode, setMode] = useState<AuthMode>('LOGIN');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Profile State
    const [profileData, setProfileData] = useState({
        fullName: '',
        phone: '',
        birthYear: '',
        birthMonth: '',
        birthDay: '',
        birthHour: '',
        city: '',
        district: '',
        address: '',
        gender: 'M' // Default to Male if not specified
    });

    useEffect(() => {
        if (isOpen) {
            setError(null);
            if (user) {
                setMode('PROFILE');
                if (userProfile) {
                    setProfileData({
                        fullName: userProfile.fullName || '',
                        phone: userProfile.phone || '',
                        birthYear: userProfile.birthYear || '',
                        birthMonth: userProfile.birthMonth || '',
                        birthDay: userProfile.birthDay || '',
                        birthHour: userProfile.birthHour || '',
                        city: userProfile.city || '',
                        district: userProfile.district || '',
                        address: userProfile.address || '',
                        gender: userProfile.gender || 'M'
                    });
                }
            } else {
                setMode('LOGIN');
            }
        }
    }, [isOpen, user, userProfile]);

    if (!isOpen) return null;

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (mode === 'LOGIN') {
                if (isSupabaseConfigured()) {
                    const { error } = await supabase.auth.signInWithPassword({
                        email,
                        password,
                    });
                    if (error) throw error;
                } else {
                    await signInLocal(email, password);
                    onClose();
                }
                // Success handled by auth state listener
            } else if (mode === 'REGISTER') {
                if (isSupabaseConfigured()) {
                    const { error } = await supabase.auth.signUp({
                        email,
                        password,
                    });
                    if (error) throw error;
                    alert('註冊成功！請檢查信箱驗證或直接登入。');
                    setMode('LOGIN');
                } else {
                    await registerLocal(email, password);
                    alert('註冊成功，已自動登入。');
                    onClose();
                }
            }
        } catch (err: any) {
            console.error("Auth Error:", err);
            let msg = err.message || '發生錯誤';

            // Translate common Supabase errors
            if (msg.includes('Invalid login credentials')) msg = '帳號或密碼錯誤';
            if (msg.includes('Email not confirmed')) msg = '信箱尚未驗證，請檢查收件匣或垃圾郵件';
            if (msg.includes('User already registered')) msg = '此信箱已被註冊';
            if (msg.includes('Password should be at least')) msg = '密碼長度需至少 6 碼';
            if (msg.includes('email rate limit exceeded')) msg = '驗證信寄送太頻繁，請稍後再試 (或使用無痕視窗測試)';
            if (msg.includes('Too many requests')) msg = '請求次數過多，請稍後再試';

            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);
        try {
            const updates = {
                id: user.id,
                full_name: profileData.fullName,
                phone: profileData.phone,
                birth_year: profileData.birthYear,
                birth_month: profileData.birthMonth,
                birth_day: profileData.birthDay,
                birth_hour: profileData.birthHour,
                city: profileData.city,
                district: profileData.district,
                address: profileData.address,
                gender: profileData.gender,
                updated_at: new Date(),
            };

            if (isSupabaseConfigured()) {
                const { error } = await supabase.from('profiles').upsert(updates);
                if (error) throw error;
            } else {
                const response = await fetch(`/api/profiles/${user.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(profileData)
                });
                const result = await response.json().catch(() => ({}));
                if (!response.ok) throw new Error(result.error || result.details || '個人資料更新失敗');
            }

            await fetchUserProfile(user.id);
            alert('個人資料已更新');
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const years = Array.from({ length: 100 }, (_, i) => String(new Date().getFullYear() - i));
    const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
    const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

            <div className="bg-zinc-900 border border-mystic-gold/30 w-full max-w-md rounded-lg shadow-2xl relative overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/40">
                    <h3 className="text-xl font-bold text-mystic-gold">
                        {mode === 'LOGIN' && '會員登入'}
                        {mode === 'REGISTER' && '註冊帳號'}
                        {mode === 'PROFILE' && '會員中心'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                {/* Body - Scrollable */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {error && (
                        <div className="bg-red-900/30 border border-red-500/50 text-red-200 p-3 rounded mb-4 text-sm">
                            {error}
                        </div>
                    )}

                    {(mode === 'LOGIN' || mode === 'REGISTER') && (
                        <form onSubmit={handleAuth} className="space-y-4">
                            <div>
                                <label className="block text-gray-400 text-xs mb-1">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 text-gray-500 w-4 h-4" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="w-full bg-black/50 border border-white/10 rounded pl-10 pr-4 py-2.5 text-white focus:border-mystic-gold outline-none"
                                        placeholder="user@example.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-400 text-xs mb-1">密碼</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 text-gray-500 w-4 h-4" />
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="w-full bg-black/50 border border-white/10 rounded pl-10 pr-4 py-2.5 text-white focus:border-mystic-gold outline-none"
                                        placeholder="••••••••"
                                        minLength={6}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-mystic-red hover:bg-red-800 text-white font-bold py-3 rounded transition-colors"
                            >
                                {loading ? '處理中...' : (mode === 'LOGIN' ? '登入' : '註冊')}
                            </button>

                            <div className="text-center text-sm text-gray-400 mt-4">
                                {mode === 'LOGIN' ? (
                                    <>
                                        還沒有帳號？{' '}
                                        <button type="button" onClick={() => setMode('REGISTER')} className="text-mystic-gold hover:underline">
                                            立即註冊
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        已有帳號？{' '}
                                        <button type="button" onClick={() => setMode('LOGIN')} className="text-mystic-gold hover:underline">
                                            返回登入
                                        </button>
                                    </>
                                )}
                            </div>
                        </form>
                    )}

                    {mode === 'PROFILE' && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 pb-4 border-b border-white/10">
                                <div className="w-16 h-16 bg-mystic-gold/20 rounded-full flex items-center justify-center text-mystic-gold text-2xl font-bold">
                                    {profileData.fullName?.[0] || <User />}
                                </div>
                                <div>
                                    <div className="font-bold text-lg text-white">{profileData.fullName || '新會員'}</div>
                                    <div className="text-sm text-gray-400">{user?.email}</div>
                                </div>
                            </div>

                            <form onSubmit={handleUpdateProfile} className="space-y-4">
                                <h4 className="text-mystic-gold text-sm font-bold border-l-2 border-mystic-gold pl-2">
                                    基本資料 (用於快速報名)
                                </h4>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-1">
                                        <label className="text-xs text-gray-500 block mb-1">姓名</label>
                                        <input
                                            type="text"
                                            value={profileData.fullName}
                                            onChange={e => setProfileData({ ...profileData, fullName: e.target.value })}
                                            className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-white"
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="text-xs text-gray-500 block mb-1">電話</label>
                                        <input
                                            type="tel"
                                            value={profileData.phone}
                                            onChange={e => setProfileData({ ...profileData, phone: e.target.value })}
                                            className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-white"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">性別</label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer bg-black/30 px-4 py-2 rounded border border-white/10 hover:border-mystic-gold/50 transition-colors flex-1">
                                            <input
                                                type="radio"
                                                name="gender"
                                                value="M"
                                                checked={profileData.gender === 'M'}
                                                onChange={e => setProfileData({ ...profileData, gender: e.target.value })}
                                                className="accent-mystic-gold"
                                            />
                                            <span className="text-white text-sm">男</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer bg-black/30 px-4 py-2 rounded border border-white/10 hover:border-mystic-gold/50 transition-colors flex-1">
                                            <input
                                                type="radio"
                                                name="gender"
                                                value="F"
                                                checked={profileData.gender === 'F'}
                                                onChange={e => setProfileData({ ...profileData, gender: e.target.value })}
                                                className="accent-mystic-gold"
                                            />
                                            <span className="text-white text-sm">女</span>
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">出生日期 (農曆)</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        <select
                                            value={profileData.birthYear}
                                            onChange={e => setProfileData({ ...profileData, birthYear: e.target.value })}
                                            className="bg-black/30 border border-white/10 rounded px-2 py-2 text-white text-sm"
                                        >
                                            <option value="">年</option>
                                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                                        </select>
                                        <select
                                            value={profileData.birthMonth}
                                            onChange={e => setProfileData({ ...profileData, birthMonth: e.target.value })}
                                            className="bg-black/30 border border-white/10 rounded px-2 py-2 text-white text-sm"
                                        >
                                            <option value="">月</option>
                                            {months.map(m => <option key={m} value={m}>{m}</option>)}
                                        </select>
                                        <select
                                            value={profileData.birthDay}
                                            onChange={e => setProfileData({ ...profileData, birthDay: e.target.value })}
                                            className="bg-black/30 border border-white/10 rounded px-2 py-2 text-white text-sm"
                                        >
                                            <option value="">日</option>
                                            {days.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                        <select
                                            value={profileData.birthHour}
                                            onChange={e => setProfileData({ ...profileData, birthHour: e.target.value })}
                                            className="bg-black/30 border border-white/10 rounded px-2 py-2 text-white text-sm"
                                        >
                                            <option value="">時</option>
                                            {LUNAR_HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">居住地址</label>
                                    <div className="grid grid-cols-2 gap-2 mb-2">
                                        <select
                                            value={profileData.city}
                                            onChange={e => setProfileData({ ...profileData, city: e.target.value, district: '' })}
                                            className="bg-black/30 border border-white/10 rounded px-3 py-2 text-white"
                                        >
                                            <option value="">縣市</option>
                                            {Object.keys(TAIWAN_ADDRESS_DATA).map(city => (
                                                <option key={city} value={city}>{city}</option>
                                            ))}
                                        </select>
                                        <select
                                            value={profileData.district}
                                            onChange={e => setProfileData({ ...profileData, district: e.target.value })}
                                            className="bg-black/30 border border-white/10 rounded px-3 py-2 text-white"
                                        >
                                            <option value="">區域</option>
                                            {profileData.city && TAIWAN_ADDRESS_DATA[profileData.city]?.map(area => (
                                                <option key={area} value={area}>{area}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <input
                                        type="text"
                                        value={profileData.address}
                                        onChange={e => setProfileData({ ...profileData, address: e.target.value })}
                                        placeholder="詳細地址 (路/街/巷/號/樓)"
                                        className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-white"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-mystic-gold hover:bg-yellow-600 text-black font-bold py-3 rounded transition-colors mt-2"
                                >
                                    {loading ? '更新中...' : '儲存個人資料'}
                                </button>
                            </form>

                            {/* Change Password Section */}
                            {isSupabaseConfigured() && (
                            <div className="pt-6 border-t border-white/10">
                                <h4 className="text-mystic-gold text-sm font-bold border-l-2 border-mystic-gold pl-2 mb-4">
                                    變更密碼
                                </h4>
                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    const form = e.target as HTMLFormElement;
                                    const newPassword = (form.elements.namedItem('newPassword') as HTMLInputElement).value;

                                    if (newPassword.length < 6) {
                                        setError('密碼長度需至少 6 碼');
                                        return;
                                    }

                                    setLoading(true);
                                    try {
                                        const { error } = await supabase.auth.updateUser({ password: newPassword });
                                        if (error) {
                                            // Handle 422 Unprocessable Entity (Weak password or same as old)
                                            if (error.status === 422) {
                                                throw new Error('新密碼不能與舊密碼相同，或密碼強度不足 (請嘗試英數混合)');
                                            }
                                            throw error;
                                        }
                                        alert('密碼已變更！下次登入請使用新密碼。');
                                        form.reset();
                                    } catch (err: any) {
                                        let msg = err.message;
                                        if (msg.includes('New password should be different')) msg = '新密碼不能與舊密碼相同';
                                        setError(msg);
                                    } finally {
                                        setLoading(false);
                                    }
                                }} className="space-y-4">
                                    <div>
                                        <label className="text-xs text-gray-500 block mb-1">新密碼</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-2.5 text-gray-500 w-4 h-4" />
                                            <input
                                                name="newPassword"
                                                type="password"
                                                required
                                                minLength={6}
                                                placeholder="請輸入新密碼"
                                                className="w-full bg-black/30 border border-white/10 rounded pl-10 pr-4 py-2 text-white outline-none focus:border-mystic-gold"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 rounded transition-colors text-sm"
                                    >
                                        變更密碼
                                    </button>
                                </form>
                            </div>
                            )}

                            <button
                                onClick={() => {
                                    signOut();
                                    onClose();
                                }}
                                className="w-full border border-red-900/50 text-red-400 hover:bg-red-900/20 py-2 rounded flex items-center justify-center gap-2 text-sm"
                            >
                                <LogOut size={16} /> 登出
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuthModal;
