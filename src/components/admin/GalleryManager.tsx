import React, { useRef, useState } from 'react';
import { useData } from '../../context/DataContext';
import { Trash2, Edit, Plus, Image as ImageIcon, FolderInput, Eye, Loader2, Link as LinkIcon, UploadCloud } from 'lucide-react';
import { GalleryItem } from '../../types';

const detectMediaType = (url: string): GalleryItem['type'] => {
    const value = url.toLowerCase();
    if (value.includes('youtube.com') || value.includes('youtu.be')) return 'YOUTUBE';
    if (/\.(mp4|webm|mov|m4v)(\?|#|$)/.test(value)) return 'VIDEO';
    return 'IMAGE';
};

export const GalleryManager: React.FC = () => {
    const {
        gallery, galleryAlbums,
        addGalleryItem, addGalleryItems, updateGalleryItem, deleteGalleryItem,
        addGalleryAlbum, updateGalleryAlbum, deleteGalleryAlbum
    } = useData();

    const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage] = useState(1);
    const itemsPerPage = 10;
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [isAdding, setIsAdding] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<any>({});
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [externalUrls, setExternalUrls] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const currentAlbum = galleryAlbums.find((album) => album.id === selectedAlbumId);

    const uploadLocalFile = async (file: File) => {
        const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

        const response = await fetch('/api/uploads/gallery', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileName: file.name, dataUrl })
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || result.details || '本機上傳失敗');
        return result.url as string;
    };

    const handleBatchUpload = async () => {
        if (!selectedAlbumId || selectedFiles.length === 0) return;
        setIsUploading(true);
        try {
            const items: Omit<GalleryItem, 'id'>[] = [];
            for (const file of selectedFiles) {
                const url = await uploadLocalFile(file);
                items.push({
                    title: file.name.replace(/\.[^.]+$/, ''),
                    url,
                    type: file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE',
                    albumId: selectedAlbumId
                });
            }
            await addGalleryItems(items);
            setSelectedFiles([]);
            alert(`已上傳 ${items.length} 個檔案到本機並寫入資料庫`);
        } catch (error: any) {
            alert(error.message || '本機上傳失敗');
        } finally {
            setIsUploading(false);
        }
    };

    const handleExternalImport = async () => {
        if (!selectedAlbumId) return;
        const urls = externalUrls.split('\n').map((url) => url.trim()).filter((url) => /^https?:\/\//i.test(url));
        if (urls.length === 0) {
            alert('請貼上可公開瀏覽的網址，一行一個');
            return;
        }
        const items = urls.map((url, index) => ({
            title: `外部連結 ${index + 1}`,
            url,
            type: detectMediaType(url),
            albumId: selectedAlbumId
        }));
        await addGalleryItems(items);
        setExternalUrls('');
        alert(`已匯入 ${items.length} 筆外部連結`);
    };

    const handleDelete = async (id: string, isAlbum: boolean) => {
        if (isAlbum) {
            const count = gallery.filter((item) => item.albumId === id).length;
            if (count > 0) {
                alert(`這個相簿內還有 ${count} 筆內容，請先刪除相簿內的照片或影片。`);
                return;
            }
            if (confirm('確定要刪除這個相簿？')) await deleteGalleryAlbum(id);
            return;
        }
        if (confirm('確定要刪除這筆相簿內容？')) await deleteGalleryItem(id);
    };

    const handleBatchDelete = async () => {
        if (selectedItems.size === 0) return;
        if (!confirm(`確定要刪除選取的 ${selectedItems.size} 筆資料？`)) return;
        for (const id of Array.from(selectedItems)) {
            if (selectedAlbumId) await deleteGalleryItem(id);
            else await deleteGalleryAlbum(id);
        }
        setSelectedItems(new Set());
    };

    const filteredData = (selectedAlbumId
        ? gallery.filter((item) => item.albumId === selectedAlbumId)
        : galleryAlbums
    ).filter((item: any) => {
        const keyword = searchTerm.toLowerCase();
        return item.title?.toLowerCase().includes(keyword) || item.description?.toLowerCase().includes(keyword) || item.url?.toLowerCase().includes(keyword);
    });

    const paginatedItems = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedItems(e.target.checked ? new Set(filteredData.map((item) => item.id)) : new Set());
    };

    const handleSelectOne = (id: string) => {
        const next = new Set(selectedItems);
        next.has(id) ? next.delete(id) : next.add(id);
        setSelectedItems(next);
    };

    const handleSave = async () => {
        if (!editForm.title) {
            alert('請輸入標題');
            return;
        }
        setIsSaving(true);
        try {
            if (editingId) {
                if (selectedAlbumId) await updateGalleryItem(editingId, { ...editForm, type: detectMediaType(editForm.url || '') });
                else await updateGalleryAlbum(editingId, editForm);
            } else if (selectedAlbumId) {
                await addGalleryItem({ ...editForm, albumId: selectedAlbumId, type: detectMediaType(editForm.url || '') });
            } else {
                await addGalleryAlbum(editForm);
            }
            setIsAdding(false);
            setEditingId(null);
            setEditForm({});
        } catch (error: any) {
            alert(error.message || '儲存失敗');
        } finally {
            setIsSaving(false);
        }
    };

    const getPreviewUrl = (item: any) => {
        if (!selectedAlbumId) return item.coverImageUrl || 'https://placehold.co/100x100?text=No+Cover';
        if (item.type === 'YOUTUBE') {
            const match = item.url.match(/^.*(youtu.be\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
            return match?.[2]?.length === 11 ? `https://img.youtube.com/vi/${match[2]}/hqdefault.jpg` : item.url;
        }
        return item.url;
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    {selectedAlbumId ? (
                        <div className="flex items-center gap-2">
                            <button onClick={() => setSelectedAlbumId(null)} className="text-gray-400 hover:text-white">返回相簿</button>
                            <span className="text-gray-600">/</span>
                            <h2 className="text-2xl font-bold text-white">{currentAlbum?.title || '相簿內容'}</h2>
                        </div>
                    ) : (
                        <h2 className="text-2xl font-bold text-white">活動花絮（相簿管理）</h2>
                    )}
                </div>

                <div className="flex flex-wrap gap-2">
                    {selectedAlbumId && (
                        <button onClick={() => { setIsAdding(true); setEditForm({}); }} className="bg-mystic-gold text-black px-4 py-2 rounded font-bold hover:bg-yellow-500 flex items-center gap-2">
                            <Plus size={16} /> 新增連結
                        </button>
                    )}
                    {!selectedAlbumId && (
                        <button onClick={() => { setIsAdding(true); setEditForm({}); }} className="bg-mystic-gold text-black px-4 py-2 rounded font-bold hover:bg-yellow-500 flex items-center gap-2">
                            <Plus size={16} /> 建立相簿
                        </button>
                    )}
                    {selectedItems.size > 0 && (
                        <button onClick={handleBatchDelete} className="bg-red-900/80 text-white px-4 py-2 rounded hover:bg-red-800 flex items-center gap-2">
                            <Trash2 size={16} /> 刪除選取 ({selectedItems.size})
                        </button>
                    )}
                </div>
            </div>

            <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="搜尋相簿、標題或網址"
                className="w-full bg-black text-white p-3 border border-white/10 rounded"
            />

            {(isAdding || editingId) && (
                <div className="bg-mystic-charcoal p-6 border border-white/10 rounded mb-6">
                    <h3 className="text-white font-bold mb-4">{editingId ? '編輯資料' : selectedAlbumId ? '新增相簿內容' : '建立相簿'}</h3>
                    <div className="space-y-4">
                        {!selectedAlbumId && (
                            <>
                                <input placeholder="相簿名稱" value={editForm.title || ''} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className="w-full bg-black text-white p-2 border border-white/20 rounded" />
                                <textarea placeholder="相簿描述" value={editForm.description || ''} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="w-full bg-black text-white p-2 border border-white/20 rounded" />
                                <input placeholder="封面圖片網址" value={editForm.coverImageUrl || ''} onChange={(e) => setEditForm({ ...editForm, coverImageUrl: e.target.value })} className="w-full bg-black text-white p-2 border border-white/20 rounded" />
                            </>
                        )}

                        {selectedAlbumId && (
                            <>
                                <div className="border-2 border-dashed border-gray-600 rounded p-6 text-center"
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        if (e.dataTransfer.files) setSelectedFiles(Array.from(e.dataTransfer.files));
                                    }}
                                >
                                    <input type="file" multiple ref={fileInputRef} className="hidden" onChange={(e) => e.target.files && setSelectedFiles(Array.from(e.target.files))} />
                                    <UploadCloud className="mx-auto text-gray-500 mb-2" size={42} />
                                    <p className="text-gray-400 mb-4">本機上傳圖片或影片，會存到 uploads/gallery 並寫入資料庫。</p>
                                    <button onClick={() => fileInputRef.current?.click()} className="bg-gray-700 text-white px-4 py-2 rounded">選擇檔案</button>
                                    {selectedFiles.length > 0 && (
                                        <div className="mt-4 text-left">
                                            <h4 className="text-white font-bold px-2">已選擇 {selectedFiles.length} 個檔案</h4>
                                            <ul className="text-gray-400 text-sm list-disc pl-6 max-h-32 overflow-y-auto">
                                                {selectedFiles.map((file, index) => <li key={index}>{file.name}</li>)}
                                            </ul>
                                            <button onClick={handleBatchUpload} disabled={isUploading} className="mt-4 w-full bg-green-600 text-white py-2 rounded font-bold hover:bg-green-500 disabled:opacity-50">
                                                {isUploading ? <span className="flex items-center justify-center gap-2"><Loader2 className="animate-spin" size={16} /> 上傳中...</span> : '上傳到本機'}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="border border-white/10 rounded p-4 bg-black/30">
                                    <div className="flex items-center gap-2 text-white font-bold mb-3"><LinkIcon size={16} /> 外部網址匯入</div>
                                    <textarea
                                        value={externalUrls}
                                        onChange={(e) => setExternalUrls(e.target.value)}
                                        placeholder="貼上公開網址，一行一個。例如 YouTube、TikTok、Threads、IG、FB、Google 相簿、Apple 相簿或圖片/影片直連。"
                                        className="w-full min-h-28 bg-black text-white p-3 border border-white/20 rounded"
                                    />
                                    <button onClick={handleExternalImport} className="mt-3 bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-600">匯入外部連結</button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <input placeholder="標題" value={editForm.title || ''} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className="bg-black text-white p-2 border border-white/20 rounded" />
                                    <input placeholder="單筆網址" value={editForm.url || ''} onChange={(e) => setEditForm({ ...editForm, url: e.target.value })} className="bg-black text-white p-2 border border-white/20 rounded" />
                                </div>
                            </>
                        )}

                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={() => { setIsAdding(false); setEditingId(null); setSelectedFiles([]); setExternalUrls(''); }} className="px-4 py-2 rounded text-gray-400 hover:text-white">取消</button>
                            <button onClick={handleSave} disabled={isSaving} className="bg-mystic-gold text-black px-4 py-2 rounded font-bold disabled:opacity-50">{isSaving ? '儲存中...' : '儲存'}</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-mystic-charcoal rounded overflow-hidden border border-white/5 shadow-2xl">
                <table className="w-full text-left text-sm">
                    <thead className="bg-white/5 text-gray-400 uppercase tracking-widest text-[10px]">
                        <tr>
                            <th className="p-4 w-10"><input type="checkbox" checked={selectedItems.size === filteredData.length && filteredData.length > 0} onChange={handleSelectAll} /></th>
                            <th className="p-4">{selectedAlbumId ? '預覽' : '相簿名稱'}</th>
                            <th className="p-4">{selectedAlbumId ? '標題 / 網址' : '描述'}</th>
                            <th className="p-4 text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {paginatedItems.map((item: any) => (
                            <tr key={item.id} className={`hover:bg-white/5 ${selectedItems.has(item.id) ? 'bg-white/5' : ''}`}>
                                <td className="p-4"><input type="checkbox" checked={selectedItems.has(item.id)} onChange={() => handleSelectOne(item.id)} /></td>
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <img src={getPreviewUrl(item)} className="w-12 h-12 object-cover rounded shadow bg-black" onError={(e) => { e.currentTarget.src = 'https://placehold.co/100x100?text=Link'; }} />
                                        {!selectedAlbumId && <span className="font-bold text-white max-w-[220px] truncate">{item.title}</span>}
                                    </div>
                                </td>
                                <td className="p-4 text-gray-400 max-w-xs truncate">
                                    {selectedAlbumId ? <><span className="text-white">{item.title}</span><br /><span className="text-xs">{item.url}</span></> : item.description}
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        {selectedAlbumId ? (
                                            <>
                                                <button onClick={() => window.open(item.url, '_blank')} className="p-2 bg-gray-700 text-white rounded hover:bg-gray-600" title="預覽"><Eye size={16} /></button>
                                                <button onClick={() => { setEditingId(item.id); setEditForm({ ...item }); setIsAdding(true); }} className="p-2 bg-gray-800 text-gray-300 rounded" title="編輯"><Edit size={16} /></button>
                                                <button onClick={() => updateGalleryAlbum(selectedAlbumId, { coverImageUrl: item.url }).then(() => alert('已設為封面'))} className="p-2 bg-green-900/20 text-green-400 rounded hover:bg-green-900/40" title="設為封面"><ImageIcon size={16} /></button>
                                                <button onClick={() => handleDelete(item.id, false)} className="p-2 bg-red-900/20 text-red-400 rounded"><Trash2 size={16} /></button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => setSelectedAlbumId(item.id)} className="p-2 bg-blue-900/20 text-blue-400 rounded flex items-center gap-1"><FolderInput size={16} /> 進入</button>
                                                <button onClick={() => { setEditingId(item.id); setEditForm({ ...item }); setIsAdding(true); }} className="p-2 bg-gray-800 text-gray-400 rounded"><Edit size={16} /></button>
                                                <button onClick={() => handleDelete(item.id, true)} className="p-2 bg-red-900/20 text-red-400 rounded"><Trash2 size={16} /></button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
