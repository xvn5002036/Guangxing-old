import React, { useState, useEffect } from 'react';
import { Book, Download, Eye, Loader2, FileText, BookOpen, X, Printer, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import JSZip from 'jszip';
import { supabase, isSupabaseConfigured } from '../services/supabase';

interface PurchasedItem {
    id: string;
    createdAt: string;
    product: {
        id: string;
        title: string;
        author?: string;
        content?: string;
        description: string;
        fileType: string;
        previewUrl: string;
        attachments?: any[];
        price: number;
    }
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
                title="點擊複製"
                {...props}
            >
                {children}
                {isCopied && <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] bg-black text-white px-2 py-1 rounded shadow-lg animate-fade-in-up whitespace-nowrap z-50">已複製</span>}
            </code>
        );
    }

    return (
        <div className="relative group my-4 not-prose">
            <div className="absolute right-2 top-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                    onClick={handleCopy} 
                    className="p-1.5 rounded bg-gray-800/10 hover:bg-gray-800/20 text-gray-500 hover:text-black backdrop-blur-sm border border-gray-200"
                    title="複製程式碼"
                >
                    {isCopied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                </button>
            </div>
            <code className={`${className} block bg-gray-100 p-4 rounded-lg border border-gray-200 overflow-x-auto text-sm font-mono text-gray-800`} {...props}>
                {children}
            </code>
        </div>
    );
};

export const MemberLibrary: React.FC<{ userId: string; onNavigateToShop?: () => void }> = ({ userId, onNavigateToShop }) => {
    const [purchases, setPurchases] = useState<PurchasedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [readingContent, setReadingContent] = useState<string | null>(null);
    const [readingTitle, setReadingTitle] = useState('');
    const [readingProductId, setReadingProductId] = useState<string | null>(null);
    const [viewingAttachments, setViewingAttachments] = useState<any[] | null>(null);
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchLibrary();
    }, [userId]);

    useEffect(() => {
        const refresh = () => fetchLibrary();
        window.addEventListener('focus', refresh);
        document.addEventListener('visibilitychange', refresh);
        return () => {
            window.removeEventListener('focus', refresh);
            document.removeEventListener('visibilitychange', refresh);
        };
    }, [userId]);

    const handlePrintReceipt = (item: PurchasedItem) => {
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                <head>
                    <title>電子收據 - ${item.product.title}</title>
                    <style>
                        body { font-family: "Noto Serif TC", serif; padding: 40px; color: #333; }
                        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
                        .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
                        .subtitle { font-size: 14px; color: #666; }
                        .info { margin-bottom: 30px; }
                        .row { display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px dashed #ddd; padding-bottom: 5px; }
                        .total { font-size: 20px; font-weight: bold; text-align: right; margin-top: 20px; border-top: 2px solid #333; padding-top: 10px; }
                        .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #888; }
                        .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 80px; opacity: 0.1; font-weight: bold; color: green; border: 5px solid green; padding: 20px; }
                    </style>
                </head>
                <body>
                    <div class="watermark">PAID</div>
                    <div class="header">
                        <div class="title">新莊武壇廣行宮 - 電子收據</div>
                        <div class="subtitle">Guangxing Palace Digital Library Receipt</div>
                    </div>
                    
                    <div class="info">
                        <div class="row"><span>收據編號 (Order No.)</span> <span>${item.id.split('-')[0].toUpperCase()}</span></div>
                        <div class="row"><span>日期 (Date)</span> <span>${new Date(item.createdAt).toLocaleDateString()}</span></div>
                        <div class="row"><span>會員 ID (User ID)</span> <span>${userId.split('-')[0]}***</span></div>
                    </div>

                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                        <tr style="background: #f5f5f5; text-align: left;">
                            <th style="padding: 10px;">項目 (Item)</th>
                            <th style="padding: 10px; text-align: right;">金額 (Amount)</th>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.product.title}</td>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">NT$ ${item.product.price.toLocaleString()}</td>
                        </tr>
                    </table>

                    <div class="total">
                        總計 Total: NT$ ${item.product.price.toLocaleString()}
                    </div>

                    <div class="footer">
                        感謝您的請購，功德無量。<br/>
                        此為電子憑證，僅供個人留存查閱，非正式稅務發票。
                    </div>
                </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }
    };

    const fetchLibrary = async () => {
        try {
            if (!isSupabaseConfigured()) {
                const response = await fetch(`/api/my-library?userId=${encodeURIComponent(userId)}`);
                if (!response.ok) throw new Error((await response.json()).details || 'Failed to load local library');
                setPurchases(await response.json());
                return;
            }
            // 直接從 Supabase 獲取以確保最即時且正確的資料架構
            const { data, error } = await supabase
                .from('purchases')
                .select(`
                    id,
                    created_at,
                    order_id,
                    product:digital_products!product_id (*),
                    order:orders!order_id (status)
                `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                // Filter: Must have valid product AND if order exists, it must be PAID
                const validItems = data.filter((item: any) => {
                    if (!item.product) return false;
                    // Strict check: If order info is present, it MUST be PAID.
                    // If no order info (e.g. gifted or legacy), we show it (or optionally hide it, but user complained about Unpaid Orders showing).
                    if (item.order && item.order.status !== 'PAID') return false; 
                    return true;
                });

                const mapped = validItems.map((item: any) => ({
                    id: item.id,
                    createdAt: item.created_at,
                    product: {
                        id: item.product.id,
                        title: item.product.title,
                        author: item.product.author,
                        content: item.product.content,
                        description: item.product.description,
                        fileType: item.product.file_type,
                        previewUrl: item.product.preview_url,
                        attachments: item.product.attachments,
                        price: item.product.price || 0
                    }
                }));
                
                setPurchases(mapped as PurchasedItem[]);
            }
        } catch (error: any) {
            console.error('Error fetching library:', error);
            alert(`讀取圖庫失敗：${error.message}\n請確認 SQL 腳本 fix_rls.sql 已執行。`);
        } finally {
            setLoading(false);
        }
    };

    // Bookmark Logic
    const saveProgress = async (scrollTop: number) => {
        if (!userId || !readingProductId) return;
        try {
            await supabase.from('bookmarks').upsert({
                user_id: userId,
                product_id: readingProductId,
                progress: { scrollTop }
            }, { onConflict: 'user_id, product_id' });
        } catch (err) {
            console.error('Save progress error:', err);
        }
    };

    // Debounce Save (Ref)
    const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const scrollTop = e.currentTarget.scrollTop;
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        
        saveTimeoutRef.current = setTimeout(() => {
            saveProgress(scrollTop);
        }, 1000); // Save after 1 second of inactivity
    };

    const handleRead = async (item: PurchasedItem) => {
        if (item.product.content) {
            setReadingContent(item.product.content);
            setReadingTitle(item.product.title);
            setReadingProductId(item.product.id);

            // Fetch previous progress
            try {
                const { data } = await supabase
                    .from('bookmarks')
                    .select('progress')
                    .eq('user_id', userId)
                    .eq('product_id', item.product.id)
                    .single();
                
                if (data && data.progress && (data.progress as any).scrollTop) {
                    // Small delay to allow render
                    setTimeout(() => {
                        if (scrollContainerRef.current) {
                            scrollContainerRef.current.scrollTop = (data.progress as any).scrollTop;
                        }
                    }, 100);
                }
            } catch (err) {
                // No bookmark found is fine
            }
            // Fetch Notes
            fetchNotes(item.product.id);

        } else {
            alert('此經文尚未建立數位內容，請洽詢宮廟管理員。');
        }
    };

    // Notes Logic
    interface Note {
        id: string;
        content: string;
        created_at: string;
    }
    const [notes, setNotes] = useState<Note[]>([]);
    const [showNotes, setShowNotes] = useState(false);
    const [newNote, setNewNote] = useState('');

    const fetchNotes = async (productId: string) => {
        const { data } = await supabase
            .from('notes')
            .select('*')
            .eq('user_id', userId)
            .eq('product_id', productId)
            .order('created_at', { ascending: false });
        
        if (data) setNotes(data);
    };

    const handleAddNote = async () => {
        if (!newNote.trim() || !readingProductId) return;
        
        const { data, error } = await supabase
            .from('notes')
            .insert({
                user_id: userId,
                product_id: readingProductId,
                content: newNote
            })
            .select()
            .single();

        if (data) {
            setNotes([data, ...notes]);
            setNewNote('');
        }
    };

    const handleDeleteNote = async (id: string) => {
        if (!confirm('確定刪除此筆記？')) return;
        await supabase.from('notes').delete().eq('id', id);
        setNotes(notes.filter(n => n.id !== id));
    };

    const handleDownload = (attachments: any[]) => {
        if (attachments && attachments.length > 0) {
            setViewingAttachments(attachments);
        } else {
            alert('此經文目前沒有可下載的附件檔案。');
        }
    };

    const handlePrintContent = () => {
        if (!readingContent) return;
        
        const printWindow = window.open('', '_blank', 'width=800,height=900');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                <head>
                    <title>${readingTitle}</title>
                    <style>
                        @page { size: auto; margin: 0mm; }
                        body { margin: 20mm; font-family: "Noto Serif TC", serif; line-height: 2; background-color: white !important; color: black !important; }
                        h1 { text-align: center; font-size: 24pt; margin-bottom: 40px; padding-top: 20px; color: black !important; }
                        p { margin-bottom: 20px; text-align: justify; color: black !important; }
                        .footer { margin-top: 50px; text-align: center; font-size: 10pt; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
                    </style>
                </head>
                <body>
                    <h1>${readingTitle}</h1>
                    ${readingContent}
                    <div class="footer">新莊武壇廣行宮 - 道藏圖書館<br/>僅供個人修持研讀</div>
                </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }
    };

    const handleDownloadEpub = async () => {
        if (!readingContent) return;
        
        try {
            const zip = new JSZip();
            
            // 1. mimetype (must be first, uncompressed)
            zip.file("mimetype", "application/epub+zip", { compression: "STORE" });
            
            // 2. META-INF/container.xml
            zip.folder("META-INF")?.file("container.xml", `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`);

            // 3. OEBPS Folder
            const oebps = zip.folder("OEBPS");
            
            // Generate a unique ID
            const uuid = 'urn:uuid:' + Math.random().toString(36).substring(2, 15);
            
            // content.xhtml
            const xhtmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="zh-TW">
<head>
  <title>${readingTitle}</title>
  <style>
    body { font-family: "Noto Serif TC", serif; line-height: 1.8; padding: 1em; }
    h1 { text-align: center; margin-bottom: 2em; color: #333; }
    p { margin-bottom: 1em; text-align: justify; }
    img { max-width: 100%; height: auto; display: block; margin: 1em auto; }
  </style>
</head>
<body>
  <h1>${readingTitle}</h1>
  ${readingContent}
  <div style="margin-top: 50px; text-align: center; font-size: 0.8em; color: gray;">
    <p>廣行宮道藏圖書館 數位典藏</p>
  </div>
</body>
</html>`;
            oebps?.file("content.xhtml", xhtmlContent);

            // content.opf
            oebps?.file("content.opf", `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookID" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:title>${readingTitle}</dc:title>
    <dc:language>zh-TW</dc:language>
    <dc:identifier id="BookID" opf:scheme="UUID">${uuid}</dc:identifier>
    <dc:creator>廣行宮道藏圖書館</dc:creator>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="content" href="content.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine toc="ncx">
    <itemref idref="content"/>
  </spine>
</package>`);

            // toc.ncx (Navigation Control Structure)
            oebps?.file("toc.ncx", `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${uuid}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle>
    <text>${readingTitle}</text>
  </docTitle>
  <navMap>
    <navPoint id="navPoint-1" playOrder="1">
      <navLabel>
        <text>${readingTitle}</text>
      </navLabel>
      <content src="content.xhtml"/>
    </navPoint>
  </navMap>
</ncx>`);

            // Generate ZIP
            const blob = await zip.generateAsync({ type: "blob", mimeType: "application/epub+zip" });
            
            // Download
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${readingTitle}.epub`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error("EPUB Generation Error:", error);
            alert("EPUB 檔案生成失敗，請稍後再試或使用線上研讀。");
        }
    };


    if (loading) return (
        <div className="flex justify-center p-20">
            <Loader2 className="animate-spin text-mystic-gold" size={40} />
        </div>
    );

    return (
        <div className="p-6 bg-black min-h-screen text-white">
            <div className="max-w-6xl mx-auto">
                <header className="mb-10 border-b border-mystic-gold/30 pb-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-widest text-white uppercase mb-2">個人道藏圖庫</h1>
                        <p className="text-gray-400">已購買並開通閱讀權限之道藏經典</p>
                    </div>
                </header>

                {purchases.length === 0 ? (
                    <div className="text-center py-20 bg-mystic-charcoal rounded-sm border border-dashed border-white/10">
                        <Book size={64} className="mx-auto text-gray-600 mb-4" />
                        <p className="text-gray-400">您尚未收藏任何道藏經典</p>
                        <button onClick={onNavigateToShop} className="mt-4 text-mystic-gold border border-mystic-gold px-6 py-2 hover:bg-mystic-gold hover:text-black transition-all">
                            前往圖書館
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {purchases.map((item) => (
                            <div key={item.id} className="bg-mystic-charcoal border border-white/10 p-6 rounded-sm group hover:border-mystic-gold/50 transition-all shadow-xl">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-black rounded-lg group-hover:scale-110 transition-transform">
                                        <BookOpen className="text-mystic-gold" />
                                    </div>
                                    <span className="text-[10px] bg-white/5 px-2 py-1 text-gray-500 uppercase font-mono">
                                        ID: {item.product.id.substring(0, 8)}
                                    </span>
                                </div>
                                
                                <h3 className="text-xl font-bold mb-1 text-white group-hover:text-mystic-gold transition-colors">
                                    {item.product.title}
                                </h3>
                                <div className="text-xs text-gray-400 mb-3 italic">作者: {item.product.author || '佚名'}</div>
                                <p className="text-gray-500 text-sm mb-6 line-clamp-2 h-10">
                                    {item.product.description}
                                </p>

                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => handleRead(item)}
                                        className="flex-1 bg-mystic-gold text-black font-bold py-2 rounded-sm flex items-center justify-center gap-2 hover:bg-white transition-colors text-sm"
                                    >
                                        <Eye size={16} /> 線上研讀
                                    </button>
                                    <button 
                                        onClick={() => handleDownload(item.product.attachments || [])}
                                        className="w-12 bg-zinc-800 text-white font-bold py-2 rounded-sm flex items-center justify-center hover:bg-zinc-700 transition-colors"
                                        title="下載附件"
                                    >
                                        <Download size={16} />
                                    </button>
                                </div>
                                <div className="mt-4 text-[10px] text-gray-600 flex justify-between items-center">
                                    <div className="flex flex-col">
                                        <span>購得日期: {new Date(item.createdAt).toLocaleDateString()}</span>
                                        <span className="text-green-500 font-bold uppercase">永久授權</span>
                                    </div>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handlePrintReceipt(item); }}
                                        className="text-gray-500 hover:text-white border border-gray-700 px-2 py-1 rounded hover:bg-gray-700 transition-all flex items-center gap-1"
                                        title="下載電子收據"
                                    >
                                        <FileText size={12} /> 收據
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* HTML Content Viewer Modal */}
                {readingContent && (
                    <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col p-4 animate-fade-in">
                        <div className="flex justify-between items-center mb-4 px-2 container mx-auto">
                            <h2 className="text-xl font-bold text-mystic-gold flex items-center gap-3">
                                <BookOpen size={24} /> {readingTitle} - 在線研讀
                            </h2>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setShowNotes(!showNotes)}
                                    className={`p-2 px-3 rounded transition-all text-sm font-bold flex items-center gap-2 border ${showNotes ? 'bg-mystic-gold text-black border-mystic-gold' : 'bg-mystic-gold/10 text-mystic-gold border-mystic-gold/30 hover:bg-mystic-gold/20'}`}
                                >
                                    <FileText size={16} /> 我的筆記
                                </button>
                                <button
                                    onClick={handleDownloadEpub}
                                    className="bg-green-600/20 text-green-400 p-2 px-3 rounded hover:bg-green-600 hover:text-white transition-all text-sm font-bold flex items-center gap-2 border border-green-600/30"
                                >
                                    <Download size={16} /> 下載 EPUB
                                </button>
                                <button
                                    onClick={handlePrintContent}
                                    className="bg-gray-600/20 text-gray-300 p-2 px-3 rounded hover:bg-gray-600 hover:text-white transition-all text-sm font-bold flex items-center gap-2 border border-gray-600/30"
                                >
                                    <Printer size={16} /> 列印
                                </button>
                                <button 
                                    onClick={() => setReadingContent(null)}
                                    className="bg-red-500/20 text-red-500 p-2 px-3 rounded hover:bg-red-500 hover:text-white transition-all text-sm font-bold flex items-center gap-2 border border-red-500/30"
                                >
                                    <X size={16} /> 結束研讀
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex flex-1 container mx-auto overflow-hidden gap-4">
                            {/* Main Reading Area */}
                            <div 
                                ref={scrollContainerRef}
                                onScroll={handleScroll}
                                className="flex-1 bg-mystic-charcoal rounded-lg overflow-y-auto shadow-2xl p-8 md:p-12 border border-white/10"
                            >
                                <article 
                                    className="prose prose-lg prose-invert max-w-none text-gray-300 selection:bg-mystic-gold/30"
                                >
                                    <ReactMarkdown 
                                        rehypePlugins={[rehypeRaw]}
                                        components={{
                                            code: CodeBlock,
                                            h1: ({node, ...props}) => <h1 className="text-mystic-gold" {...props} />,
                                            h2: ({node, ...props}) => <h2 className="text-white border-b border-mystic-gold/20 pb-2" {...props} />,
                                            h3: ({node, ...props}) => <h3 className="text-white" {...props} />,
                                            strong: ({node, ...props}) => <strong className="text-white" {...props} />,
                                            blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-mystic-gold pl-4 italic text-gray-400" {...props} />,
                                            a: ({node, ...props}) => <a className="text-mystic-gold hover:underline" {...props} />
                                        }}
                                    >
                                        {readingContent}
                                    </ReactMarkdown>
                                </article>
                            </div>

                            {/* Notes Sidebar */}
                            {showNotes && (
                                <div className="w-80 bg-[#1a1a1a] border-l border-white/10 flex flex-col animate-slide-in-right rounded-lg overflow-hidden">
                                    <div className="p-4 bg-black/50 border-b border-white/10 font-bold text-white flex justify-between items-center">
                                        <span>隨手筆記</span>
                                        <span className="text-xs text-gray-500">{notes.length} 則</span>
                                    </div>
                                    
                                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                        {notes.length === 0 ? (
                                            <div className="text-center text-gray-500 py-10 text-sm">
                                                尚無筆記，記錄您的心得吧！
                                            </div>
                                        ) : (
                                            notes.map(note => (
                                                <div key={note.id} className="bg-mystic-charcoal p-3 rounded border border-white/5 group relative hover:border-mystic-gold/30 transition-all">
                                                    <p className="text-gray-300 text-sm whitespace-pre-wrap">{note.content}</p>
                                                    <div className="mt-2 text-[10px] text-gray-600 flex justify-between">
                                                        <span>{new Date(note.created_at).toLocaleDateString()}</span>
                                                        <button 
                                                            onClick={() => handleDeleteNote(note.id)}
                                                            className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
                                                        >
                                                            刪除
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    <div className="p-4 bg-black/50 border-t border-white/10 space-y-2">
                                        <textarea
                                            value={newNote}
                                            onChange={(e) => setNewNote(e.target.value)}
                                            placeholder="輸入筆記..."
                                            className="w-full bg-mystic-charcoal border border-white/10 rounded p-2 text-sm text-white focus:border-mystic-gold outline-none h-24 resize-none"
                                        />
                                        <button
                                            onClick={handleAddNote}
                                            disabled={!newNote.trim()}
                                            className="w-full bg-mystic-gold text-black font-bold py-2 rounded text-sm hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            新增筆記
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="py-4 text-center text-[10px] text-gray-500">
                            廣行宮道藏圖書館 - 此為數位資產，僅供本宮信眾修持，嚴禁轉載與商業用途。
                        </div>
                    </div>
                )}

                {/* Attachments List Modal */}
                {viewingAttachments && (
                    <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4">
                        <div className="bg-mystic-charcoal border border-white/10 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Download className="text-mystic-gold" /> 下載經文附件
                                </h3>
                                <button onClick={() => setViewingAttachments(null)} className="text-gray-400 hover:text-white"><X size={24} /></button>
                            </div>
                            
                            {viewingAttachments.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">目前尚無附件</div>
                            ) : (
                                <div className="space-y-3">
                                    {viewingAttachments.map((att: any, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-lg group hover:border-mystic-gold/30 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-mystic-gold/10 rounded">
                                                    <FileText size={20} className="text-mystic-gold" />
                                                </div>
                                                <div>
                                                    <div className="text-white font-bold group-hover:text-mystic-gold transition-colors">{att.name}</div>
                                                    <div className="text-[10px] text-gray-500 uppercase">{att.type || '檔案'}</div>
                                                </div>
                                            </div>
                                            <a 
                                                href={att.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="bg-zinc-800 p-2 rounded-full hover:bg-mystic-gold hover:text-black transition-all"
                                            >
                                                <Download size={18} />
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            <button 
                                onClick={() => setViewingAttachments(null)}
                                className="w-full mt-6 bg-mystic-gold/10 text-mystic-gold font-bold py-3 rounded hover:bg-mystic-gold hover:text-black transition-all"
                            >
                                關閉視窗
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
