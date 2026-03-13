// ============================================
// 📁 File: frontend/src/pages/RoomsPage.jsx — Rooms Dashboard Page
// 👤 Author: User with AI
// 📝 Description: Main dashboard for room management in game club.
//    Shows room cards with live timers, session start/stop, room CRUD,
//    VIP (unlimited time) mode, bill receipt on session close.
// 📅 Created: 2026-03-12 05:51 (Tashkent Time)
// ============================================
// 📋 CHANGE LOG:
// 2026-03-13 01:53 (Tashkent) — Major rewrite:
//   - VIP = cheksiz vaqt (same price, not separate rate)
//   - Room edit/delete functionality added
//   - Time input: soat + daqiqa (not just hours)
//   - Bill receipt modal on session stop
//   - Payment: faqat naqd / karta
//   - Lucide React icons, redesigned room cards
// 2026-03-13 02:15 (Tashkent) — Fixed: API returns flat session fields,
//   transformed into nested active_session object in fetchRooms.
// 2026-03-13 03:20 (Tashkent) — v3.0 Premium Elite UI
// 2026-03-13 04:14 (Tashkent) — Bugs fixed:
//   - Context menu on right click (free rooms only before, now both)
//   - Modal rename Sessiya -> Xona
//   - Discount input 0 leading bug fixed
//   - ESC key closes all modals
//   - Gamepad2 / PowerOff icons
//   - Room creation vip_hourly_rate fix
// 2026-03-13 04:22 (Tashkent) — Layout & UX:
//   - Removed margin-left from .app-main (CSS fix)
//   - Removed yellow sidebar indicator ghost line (CSS)
//   - Room card text sizes improved
//   - Right-click on ALL rooms (busy rooms show Edit only)
//   - Mobile long-press support for context menu
// 2026-03-13 04:32 (Tashkent) — Product Modal & Stock Fixes:
//   - handleAddProduct now calls fetchProducts() to refresh stock counts in UI
//   - Native <select> replaced with custom styled dropdown component
//   - productDropdownOpen state added for custom dropdown toggle
// 2026-03-13 05:22 (Tashkent) — UI Polish:
//   - All native <select> elements replaced with CustomSelect component
//   - All 'Bekor' buttons renamed to 'Bekor qilish'
// ============================================

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatters';
import CustomSelect from '../components/CustomSelect';
import {
    Plus, Play, Square, ShoppingCart, Clock, Infinity, Monitor,
    Users, MoreVertical, Pencil, Trash2, X, Receipt,
    Banknote, CreditCard, Timer, Hourglass, CheckCircle2,
    Gamepad2, PowerOff, Shield
} from 'lucide-react';

function RoomsPage() {
    const { hasRole } = useAuth();
    const [rooms, setRooms] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tick, setTick] = useState(0);

    // 📋 Modal states
    const [showRoomModal, setShowRoomModal] = useState(false);
    const [showStartModal, setShowStartModal] = useState(false);
    const [showStopModal, setShowStopModal] = useState(false);
    const [showProductModal, setShowProductModal] = useState(false);
    const [showBillModal, setShowBillModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null); // room to delete
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [productDropdownOpen, setProductDropdownOpen] = useState(false);
    const [contextMenu, setContextMenu] = useState({ roomId: null, room: null, isBusy: false, x: 0, y: 0 });

    // 📱 Long press timer ref for mobile
    const longPressTimer = useRef(null);

    // Handle global click to close context menu and Esc key
    useEffect(() => {
        const handleClick = () => {
            setContextMenu({ roomId: null, room: null, isBusy: false, x: 0, y: 0 });
            setProductDropdownOpen(false);
        };
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setShowRoomModal(false);
                setShowStartModal(false);
                setShowStopModal(false);
                setShowProductModal(false);
                setShowBillModal(false);
                setShowDeleteConfirm(null); // Close delete confirm modal
                setContextMenu({ roomId: null, room: null, isBusy: false, x: 0, y: 0 });
            }
        };
        document.addEventListener('click', handleClick);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('click', handleClick);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    // 📝 Form state
    const [editRoom, setEditRoom] = useState(null);
    // const [selectedRoom, setSelectedRoom] = useState(null); // Moved to modal states
    const [billData, setBillData] = useState(null);

    const [roomForm, setRoomForm] = useState({
        name: '', console_type: 'PS5', capacity: 4,
        hourly_rate: '', max_players: 4
    });
    const [sessionForm, setSessionForm] = useState({
        is_vip: false, hours: 1, minutes: 0
    });
    const [stopForm, setStopForm] = useState({
        payment_method: 'cash', discount_amount: 0, discount_reason: ''
    });
    const [productForm, setProductForm] = useState({ product_id: '', quantity: 1 });

    // ⏱️ Live timer tick (every second)
    useEffect(() => {
        const timer = setInterval(() => setTick(t => t + 1), 1000);
        return () => clearInterval(timer);
    }, []);

    // 📋 Fetch rooms
    const fetchRooms = async () => {
        try {
            const res = await api.get('/rooms');
            // 🔄 Transform flat API fields into nested active_session object
            const transformed = res.data.map(room => {
                const hasSession = room.active_session_id != null;
                return {
                    ...room,
                    active_session: hasSession ? {
                        id: room.active_session_id,
                        start_time: room.session_start,
                        is_vip: room.session_is_vip,
                        is_unlimited: room.session_is_unlimited,
                        scheduled_end: room.session_scheduled_end,
                        products_amount: room.session_products_amount
                    } : null
                };
            });
            setRooms(transformed);
        } catch (err) {
            console.error('Rooms fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    // 📋 Fetch products
    const fetchProducts = async () => {
        try {
            const res = await api.get('/products');
            setProducts(res.data);
        } catch (err) { /* silent */ }
    };

    useEffect(() => { fetchRooms(); fetchProducts(); }, []);

    // ⏱️ Format live timer from start_time
    const getLiveTimer = (startTime) => {
        if (!startTime) return '--:--:--';
        const diff = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000);
        const h = Math.floor(diff / 3600);
        const m = Math.floor((diff % 3600) / 60);
        const s = diff % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    // ⏳ Get remaining time
    const getRemaining = (scheduledEnd) => {
        if (!scheduledEnd) return null;
        const diff = Math.floor((new Date(scheduledEnd).getTime() - Date.now()) / 1000);
        if (diff <= 0) return { text: "Vaqt tugadi!", expired: true };
        const h = Math.floor(diff / 3600);
        const m = Math.floor((diff % 3600) / 60);
        const s = diff % 60;
        return { text: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`, expired: false };
    };

    // ➕ Create or ✏️ Update room
    const handleRoomSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...roomForm, vip_hourly_rate: roomForm.hourly_rate };
            if (editRoom) {
                await api.put(`/rooms/${editRoom.id}`, payload);
            } else {
                await api.post('/rooms', payload);
            }
            setShowRoomModal(false);
            setEditRoom(null);
            fetchRooms();
        } catch (err) {
            alert(err.response?.data?.error || 'Xatolik');
        }
    };



    // ▶️ Start session
    const handleStartSession = async (e) => {
        e.preventDefault();
        const totalMinutes = (parseInt(sessionForm.hours) || 0) * 60 + (parseInt(sessionForm.minutes) || 0);
        try {
            await api.post('/sessions/start', {
                room_id: selectedRoom.id,
                is_vip: sessionForm.is_vip,
                duration_minutes: sessionForm.is_vip ? null : totalMinutes
            });
            setShowStartModal(false);
            fetchRooms();
        } catch (err) {
            alert(err.response?.data?.error || 'Xatolik');
        }
    };

    // ⏹️ Stop session  
    const handleStopSession = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post(`/sessions/${selectedRoom.active_session?.id}/stop`, stopForm);
            setShowStopModal(false);
            setBillData(res.data.bill);
            setShowBillModal(true);
            fetchRooms();
        } catch (err) {
            alert(err.response?.data?.error || 'Xatolik');
        }
    };

    // 🛒 Add product to session — also refreshes product list to update stock counts
    const handleAddProduct = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/sessions/${selectedRoom.active_session?.id}/products`, productForm);
            setShowProductModal(false);
            setProductDropdownOpen(false);
            // 🔄 Refresh BOTH rooms (session product totals) AND products (stock counts)
            fetchRooms();
            fetchProducts();
        } catch (err) {
            alert(err.response?.data?.error || 'Xatolik');
        }
    };

    // ✏️ Open edit room
    // 🗑️ Delete room
    const handleDeleteRoom = async () => {
        if (!showDeleteConfirm) return;
        const room = showDeleteConfirm;

        try {
            await api.delete(`/rooms/${room.id}`);
            setShowDeleteConfirm(null);
            fetchRooms(); // Refresh list
        } catch (err) {
            console.error('Room delete error:', err);
            alert(`Xonani o'chirishda xatolik yuz berdi: ${err.response?.data?.error || err.message}`);
        }
    };

    const openEditRoom = (room) => {
        setEditRoom(room);
        setRoomForm({
            name: room.name,
            console_type: room.console_type,
            capacity: room.capacity,
            hourly_rate: room.hourly_rate,
            max_players: room.max_players
        });
        setContextMenu({ roomId: null, room: null, isBusy: false, x: 0, y: 0 });
        setShowRoomModal(true);
    };

    if (loading) return <div className="flex-center" style={{ height: '50vh' }}><p className="text-muted">Yuklanmoqda...</p></div>;

    const freeCount = rooms.filter(r => r.status === 'free').length;
    const busyCount = rooms.filter(r => r.status === 'busy').length;

    return (
        <div className="animate-fade-in">
            {/* 📋 Page Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title"><Monitor size={24} /> Xonalar</h1>
                    <p className="page-subtitle">{freeCount} ta bo'sh · {busyCount} ta band</p>
                </div>
                {hasRole('manager', 'owner') && (
                    <button className="btn btn-primary" onClick={() => {
                        setEditRoom(null);
                        setRoomForm({ name: '', console_type: 'PS5', capacity: 4, hourly_rate: '', max_players: 4 });
                        setShowRoomModal(true);
                    }}>
                        <Plus size={18} /> Yangi xona
                    </button>
                )}
            </div>

            {/* 🎮 Room Cards Grid */}
            <div className="grid-rooms">
                {rooms.map(room => {
                    const session = room.active_session;
                    const isBusy = room.status === 'busy' && session;
                    const isVip = session?.is_vip || session?.is_unlimited;
                    const remaining = isBusy && session.scheduled_end ? getRemaining(session.scheduled_end) : null;
                    const cardClass = isBusy ? (isVip ? 'vip' : 'busy') : room.status === 'maintenance' ? 'maintenance' : 'free';

                    return (
                        <div key={room.id} className={`card room-card ${cardClass}`}
                            onContextMenu={(e) => {
                                if (hasRole('manager', 'owner')) {
                                    e.preventDefault();
                                    // Use absolute client coordinates for perfect precision
                                    setContextMenu({ roomId: room.id, room: room, isBusy: !!isBusy, x: e.clientX, y: e.clientY });
                                }
                            }}
                            onTouchStart={(e) => {
                                if (hasRole('manager', 'owner')) {
                                    const touch = e.touches[0];
                                    longPressTimer.current = setTimeout(() => {
                                        setContextMenu({ roomId: room.id, room: room, isBusy: !!isBusy, x: touch.clientX, y: touch.clientY });
                                    }, 600);
                                }
                            }}
                            onTouchEnd={() => { clearTimeout(longPressTimer.current); }}
                            onTouchCancel={() => { clearTimeout(longPressTimer.current); }}
                        >
                            <div className="room-card-gradient" />

                            <div className="room-card-body">
                                <div className="room-card-header">
                                    <div>
                                        <div className="room-card-name">{room.name}</div>
                                        <div className="room-card-meta">
                                            <Monitor size={13} /> {room.console_type}
                                            <span>·</span>
                                            <Users size={13} /> {room.capacity}
                                        </div>
                                    </div>
                                    <div className="flex gap-8">
                                        {isVip && (
                                            <div className="badge vip">
                                                <span className="badge-dot"></span> VIP
                                            </div>
                                        )}
                                        {!isVip && isBusy && (
                                            <div className="badge busy">
                                                <span className="badge-dot"></span> BAND
                                            </div>
                                        )}
                                        {room.status === 'maintenance' && (
                                            <div className="badge maintenance">
                                                <span className="badge-dot"></span> TEXNIK
                                            </div>
                                        )}
                                        {room.status === 'free' && (
                                            <div className="badge free">
                                                <span className="badge-dot"></span> BO'SH
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* ⏱️ Timer or idle */}
                                {isBusy ? (
                                    <>
                                        <div className="room-card-timer active">{getLiveTimer(session.start_time)}</div>
                                        {remaining && (
                                            <div className={`room-card-remaining ${remaining.expired ? 'expired' : ''}`}>
                                                <Hourglass size={13} />
                                                Qoldi: {remaining.text}
                                            </div>
                                        )}
                                        {isVip && (
                                            <div className="room-card-remaining">
                                                <Infinity size={15} /> Cheksiz rejim
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="room-card-timer idle">Kutilmoqda</div>
                                )}

                                <div className="room-card-price">
                                    {formatCurrency(room.hourly_rate)}/soat
                                </div>

                                {/* Context menu replaced by global right-click menu */}
                            </div>

                            {/* 🎮 Action buttons */}
                            <div className="room-card-actions">
                                {!isBusy && room.status === 'free' && (
                                    <button className="btn btn-success" style={{ width: '100%' }} onClick={() => {
                                        setSelectedRoom(room);
                                        setSessionForm({ is_vip: false, hours: 1, minutes: 0 });
                                        setShowStartModal(true);
                                    }}>
                                        <Gamepad2 size={16} /> Ochish
                                    </button>
                                )}
                                {isBusy && (
                                    <>
                                        <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => {
                                            setSelectedRoom(room);
                                            setStopForm({ payment_method: 'cash', discount_amount: 0, discount_reason: '' });
                                            setShowStopModal(true);
                                        }}>
                                            <PowerOff size={16} /> Yopish
                                        </button>
                                        <button className="btn btn-primary" style={{ padding: '0 16px' }} onClick={() => {
                                            setSelectedRoom(room);
                                            setProductForm({ product_id: '', quantity: 1 });
                                            setShowProductModal(true);
                                        }}>
                                            <ShoppingCart size={16} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {rooms.length === 0 && (
                <div className="text-center mt-24">
                    <p className="text-muted" style={{ fontSize: '1.1rem' }}>Hali xona qo'shilmagan</p>
                </div>
            )}

            {/* 🖱️ Context Menu (Portal-based for perfect precision) */}
            {contextMenu.roomId && typeof document !== 'undefined' && createPortal(
                (() => {
                    const MENU_W = 180;
                    const MENU_H = contextMenu.isBusy ? 80 : 96;
                    const x = (contextMenu.x + MENU_W > window.innerWidth) ? contextMenu.x - MENU_W : contextMenu.x;
                    const y = (contextMenu.y + MENU_H > window.innerHeight) ? contextMenu.y - MENU_H : contextMenu.y;
                    return (
                        <div style={{
                            position: 'fixed', top: y, left: x,
                            background: 'var(--bg-elevated)', border: '1px solid var(--border-glass)',
                            borderRadius: 'var(--radius-md)', padding: '6px', zIndex: 10000,
                            minWidth: MENU_W, boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                            backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)'
                        }}
                            onClick={(e) => e.stopPropagation()}
                            onContextMenu={(e) => e.preventDefault()}
                        >
                            {/* Tahrirlash/O'chirish logic */}
                            {contextMenu.isBusy ? (
                                <div style={{ padding: '10px 12px', fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                                    <div style={{ color: 'var(--accent-primary)', marginBottom: '4px' }}><Shield size={16} /></div>
                                    Xona band, tahrirlash uchun avval sessiyani yoping
                                </div>
                            ) : (
                                <>
                                    <button className="btn btn-ghost btn-sm w-full" style={{ justifyContent: 'flex-start', marginBottom: '4px' }}
                                        onClick={() => { openEditRoom(contextMenu.room); setContextMenu({ roomId: null, room: null, isBusy: false, x: 0, y: 0 }); }}>
                                        <Pencil size={14} /> Tahrirlash
                                    </button>
                                    <button className="btn btn-ghost btn-sm w-full" style={{ justifyContent: 'flex-start', color: 'var(--accent-danger)' }}
                                        onClick={() => {
                                            setShowDeleteConfirm(contextMenu.room);
                                            setContextMenu({ roomId: null, room: null, isBusy: false, x: 0, y: 0 });
                                        }}>
                                        <Trash2 size={14} /> O'chirish
                                    </button>
                                </>
                            )}
                        </div>
                    );
                })(),
                document.body
            )}

            {/* ➕✏️ Room Modal (Create/Edit) */}
            {showRoomModal && (
                <div className="modal-overlay" onClick={() => setShowRoomModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                {editRoom ? <><Pencil size={18} /> Xonani tahrirlash</> : <><Plus size={18} /> Yangi xona</>}
                            </h3>
                            <button className="modal-close" onClick={() => setShowRoomModal(false)}><X size={16} /></button>
                        </div>
                        <form onSubmit={handleRoomSubmit}>
                            <div className="form-group">
                                <label className="form-label">Xona nomi</label>
                                <input type="text" className="form-input" placeholder="Room 1" required
                                    value={roomForm.name} onChange={e => setRoomForm({ ...roomForm, name: e.target.value })} />
                            </div>
                            <div className="grid-2">
                                <div className="form-group">
                                    <label className="form-label">Console</label>
                                    <CustomSelect
                                        value={roomForm.console_type}
                                        onChange={v => setRoomForm({ ...roomForm, console_type: v })}
                                        options={[
                                            { value: 'PS3', label: 'PS3' },
                                            { value: 'PS4', label: 'PS4' },
                                            { value: 'PS4 Pro', label: 'PS4 Pro' },
                                            { value: 'PS5', label: 'PS5' },
                                            { value: 'PS5 Pro', label: 'PS5 Pro' },
                                            { value: 'Xbox', label: 'Xbox' },
                                        ]}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Sig'im</label>
                                    <input type="number" className="form-input" min="1" max="20"
                                        value={roomForm.capacity} onChange={e => setRoomForm({ ...roomForm, capacity: parseInt(e.target.value) })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Soatlik narx (so'm)</label>
                                <input type="number" className="form-input" placeholder="25000" required
                                    value={roomForm.hourly_rate} onChange={e => setRoomForm({ ...roomForm, hourly_rate: e.target.value })} />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowRoomModal(false)}>Bekor qilish</button>
                                <button type="submit" className="btn btn-primary">
                                    {editRoom ? <><Pencil size={16} /> Saqlash</> : <><Plus size={16} /> Qo'shish</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ▶️ Start Session Modal */}
            {showStartModal && selectedRoom && (
                <div className="modal-overlay" onClick={() => setShowStartModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title"><Gamepad2 size={18} /> Xona — {selectedRoom.name}</h3>
                            <button className="modal-close" onClick={() => setShowStartModal(false)}><X size={16} /></button>
                        </div>
                        <form onSubmit={handleStartSession}>
                            {/* Mode selector: Oddiy or VIP */}
                            <label className="form-label">Rejim tanlang</label>
                            <div className="mode-selector">
                                <div className={`mode-option ${!sessionForm.is_vip ? 'selected' : ''}`}
                                    onClick={() => setSessionForm({ ...sessionForm, is_vip: false })}>
                                    <span className="mode-option-icon"><Timer size={24} /></span>
                                    <span className="mode-option-label" style={{ fontSize: '1rem', fontWeight: 'bold' }}>Soatlik</span>
                                </div>
                                <div className={`mode-option ${sessionForm.is_vip ? 'selected' : ''}`}
                                    onClick={() => setSessionForm({ ...sessionForm, is_vip: true })}>
                                    <span className="mode-option-icon"><Infinity size={24} /></span>
                                    <span className="mode-option-label" style={{ fontSize: '1rem', fontWeight: 'bold' }}>VIP</span>
                                </div>
                            </div>

                            {/* Time inputs (only for Oddiy mode) */}
                            <div style={{ minHeight: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                {!sessionForm.is_vip ? (
                                    <div className="grid-2 animate-fade-in" style={{ animationDuration: '0.2s' }}>
                                        <div className="form-group">
                                            <label className="form-label">Soat</label>
                                            <input type="number" className="form-input" min="0" max="24"
                                                value={sessionForm.hours} onChange={e => setSessionForm({ ...sessionForm, hours: parseInt(e.target.value) || 0 })} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Daqiqa</label>
                                            <CustomSelect
                                                value={sessionForm.minutes}
                                                onChange={v => setSessionForm({ ...sessionForm, minutes: parseInt(v) })}
                                                options={[
                                                    { value: 0, label: '00 daqiqa' },
                                                    { value: 15, label: '15 daqiqa' },
                                                    { value: 30, label: '30 daqiqa' },
                                                    { value: 45, label: '45 daqiqa' },
                                                ]}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="animate-fade-in" style={{ padding: '12px', background: 'rgba(255,214,10,0.05)', borderRadius: 'var(--radius-md)', border: '1px dashed rgba(255,214,10,0.3)', textAlign: 'center' }}>
                                        <div style={{ color: 'var(--accent-primary)', fontWeight: '600', marginBottom: '4px' }}>
                                            <Infinity size={20} /> VIP REJIM
                                        </div>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Vaqt cheklovi yo'q, sessiya faqat qo'lda to'xtatiladi</p>
                                    </div>
                                )}
                            </div>
                            <div className="text-muted mt-16" style={{ fontSize: '0.82rem' }}>
                                Narx: {formatCurrency(selectedRoom.hourly_rate)}/soat
                                {sessionForm.is_vip && ' · Cheksiz'}
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowStartModal(false)}>Bekor qilish</button>
                                <button type="submit" className="btn btn-success">
                                    <Gamepad2 size={16} /> Boshlash
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ⏹️ Stop Session Modal */}
            {showStopModal && selectedRoom && (
                <div className="modal-overlay" onClick={() => setShowStopModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title"><PowerOff size={18} /> Yopish — {selectedRoom.name}</h3>
                            <button className="modal-close" onClick={() => setShowStopModal(false)}><X size={16} /></button>
                        </div>
                        <form onSubmit={handleStopSession}>
                            <label className="form-label">To'lov turi</label>
                            <div className="mode-selector mb-16">
                                <div className={`mode-option ${stopForm.payment_method === 'cash' ? 'selected' : ''}`}
                                    onClick={() => setStopForm({ ...stopForm, payment_method: 'cash' })}>
                                    <span className="mode-option-icon"><Banknote size={22} /></span>
                                    <span className="mode-option-label">Naqd</span>
                                </div>
                                <div className={`mode-option ${stopForm.payment_method === 'card' ? 'selected' : ''}`}
                                    onClick={() => setStopForm({ ...stopForm, payment_method: 'card' })}>
                                    <span className="mode-option-icon"><CreditCard size={22} /></span>
                                    <span className="mode-option-label">Karta</span>
                                </div>
                            </div>

                            <div className="grid-2">
                                <div className="form-group">
                                    <label className="form-label">Chegirma (so'm)</label>
                                    <input type="number" className="form-input" min="0" placeholder="0"
                                        value={stopForm.discount_amount === 0 ? '' : stopForm.discount_amount}
                                        onChange={e => setStopForm({ ...stopForm, discount_amount: e.target.value === '' ? 0 : parseInt(e.target.value) })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Sababi</label>
                                    <input type="text" className="form-input" placeholder="Ixtiyoriy"
                                        value={stopForm.discount_reason}
                                        onChange={e => setStopForm({ ...stopForm, discount_reason: e.target.value })} />
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowStopModal(false)}>Bekor qilish</button>
                                <button type="submit" className="btn btn-danger">
                                    <PowerOff size={16} /> Yopish va hisoblash
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 🧾 Bill Receipt Modal */}
            {showBillModal && billData && (
                <div className="modal-overlay" onClick={() => setShowBillModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
                        <div className="modal-header">
                            <h3 className="modal-title"><Receipt size={18} /> Chek</h3>
                            <button className="modal-close" onClick={() => setShowBillModal(false)}><X size={16} /></button>
                        </div>

                        <div className="bill-receipt">
                            <div className="bill-receipt-header">
                                <h3>{billData.room_name}</h3>
                                <p>{billData.console_type} · {billData.mode}</p>
                            </div>
                            <div className="bill-receipt-body">
                                {/* Time info */}
                                <div className="bill-row header"><span>Vaqt ma'lumotlari</span></div>
                                <div className="bill-row">
                                    <span className="bill-label">Boshlanish</span>
                                    <span className="bill-value">{new Date(billData.start_time).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div className="bill-row">
                                    <span className="bill-label">Tugash</span>
                                    <span className="bill-value">{new Date(billData.end_time).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div className="bill-row">
                                    <span className="bill-label">Davomiylik</span>
                                    <span className="bill-value">
                                        {Math.floor(billData.duration_minutes / 60)} soat {billData.duration_minutes % 60} daqiqa
                                    </span>
                                </div>

                                <hr className="bill-divider" />

                                {/* Costs */}
                                <div className="bill-row header"><span>Narxlar</span></div>
                                <div className="bill-row">
                                    <span className="bill-label">Vaqt narxi ({formatCurrency(billData.hourly_rate)}/soat)</span>
                                    <span className="bill-value">{formatCurrency(billData.time_amount)}</span>
                                </div>

                                {/* Products */}
                                {billData.products && billData.products.length > 0 && (
                                    <>
                                        <hr className="bill-divider" />
                                        <div className="bill-row header"><span>Mahsulotlar</span></div>
                                        {billData.products.map((p, i) => (
                                            <div key={i} className="bill-product-item">
                                                <span>{p.name} x{p.quantity}</span>
                                                <span>{formatCurrency(p.subtotal)}</span>
                                            </div>
                                        ))}
                                        <div className="bill-row" style={{ fontWeight: 600 }}>
                                            <span className="bill-label">Mahsulotlar jami</span>
                                            <span className="bill-value">{formatCurrency(billData.products_amount)}</span>
                                        </div>
                                    </>
                                )}

                                {/* Discount */}
                                {billData.discount_amount > 0 && (
                                    <div className="bill-row" style={{ color: 'var(--accent-success)' }}>
                                        <span>Chegirma {billData.discount_reason && `(${billData.discount_reason})`}</span>
                                        <span>-{formatCurrency(billData.discount_amount)}</span>
                                    </div>
                                )}

                                <hr className="bill-divider" />

                                {/* Total */}
                                <div className="bill-row total">
                                    <span>JAMI</span>
                                    <span className="bill-value">{formatCurrency(billData.total_amount)}</span>
                                </div>
                            </div>
                            <div className="bill-status">
                                <CheckCircle2 size={16} />
                                {billData.payment_method === 'cash' ? 'Naqd' : 'Karta'} orqali to'langan
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button className="btn btn-primary" onClick={() => setShowBillModal(false)}>Yopish</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 🛒 Add Product Modal */}
            {showProductModal && selectedRoom && (
                <div className="modal-overlay" onClick={() => setShowProductModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title"><ShoppingCart size={18} /> Mahsulot — {selectedRoom.name}</h3>
                            <button className="modal-close" onClick={() => setShowProductModal(false)}><X size={16} /></button>
                        </div>
                        <form onSubmit={handleAddProduct}>
                            <div className="form-group">
                                <label className="form-label">Mahsulot</label>

                                {/* 🎨 Custom styled dropdown replaces native <select> */}
                                <div style={{ position: 'relative' }}>
                                    <button type="button"
                                        onClick={(e) => { e.stopPropagation(); setProductDropdownOpen(o => !o); }}
                                        style={{
                                            width: '100%', padding: '12px 16px',
                                            background: 'var(--bg-input)', border: '1px solid var(--border-glass)',
                                            borderRadius: 'var(--radius-md)', color: productForm.product_id ? 'var(--text-primary)' : 'var(--text-muted)',
                                            cursor: 'pointer', fontSize: '0.9rem', textAlign: 'left',
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            transition: 'border-color 0.2s'
                                        }}
                                    >
                                        <span>
                                            {productForm.product_id
                                                ? (() => { const p = products.find(x => String(x.id) === String(productForm.product_id)); return p ? `${p.name} — ${formatCurrency(p.sell_price)}` : 'Tanlang...'; })()
                                                : 'Tanlang...'}
                                        </span>
                                        <span style={{ opacity: 0.5, fontSize: '0.75rem' }}>{productDropdownOpen ? '▲' : '▼'}</span>
                                    </button>

                                    {productDropdownOpen && (
                                        <div
                                            onClick={e => e.stopPropagation()}
                                            style={{
                                                position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 200,
                                                background: 'var(--bg-elevated)', border: '1px solid var(--border-glass)',
                                                borderRadius: 'var(--radius-md)', overflow: 'hidden',
                                                backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)',
                                                boxShadow: 'var(--shadow-lg)', maxHeight: 220, overflowY: 'auto'
                                            }}
                                        >
                                            {products.filter(p => p.quantity > 0 && p.is_active).length === 0 && (
                                                <div style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Mavjud mahsulot yo'q</div>
                                            )}
                                            {products.filter(p => p.quantity > 0 && p.is_active).map(p => (
                                                <div key={p.id}
                                                    onClick={() => {
                                                        setProductForm({ ...productForm, product_id: p.id });
                                                        setProductDropdownOpen(false);
                                                    }}
                                                    style={{
                                                        padding: '11px 16px', cursor: 'pointer', fontSize: '0.9rem',
                                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                        background: String(productForm.product_id) === String(p.id) ? 'rgba(255,214,10,0.1)' : 'transparent',
                                                        borderLeft: String(productForm.product_id) === String(p.id) ? '3px solid var(--accent-primary)' : '3px solid transparent',
                                                        transition: 'background 0.15s'
                                                    }}
                                                    onMouseEnter={e => { if (String(productForm.product_id) !== String(p.id)) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                                                    onMouseLeave={e => { if (String(productForm.product_id) !== String(p.id)) e.currentTarget.style.background = 'transparent'; }}
                                                >
                                                    <span>
                                                        <span style={{ fontWeight: 600 }}>{p.name}</span>
                                                        <span style={{ color: 'var(--text-muted)', marginLeft: 8, fontSize: '0.8rem' }}>{p.category}</span>
                                                    </span>
                                                    <span style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                                        <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>{formatCurrency(p.sell_price)}</span>
                                                        <span style={{
                                                            fontSize: '0.75rem', padding: '2px 8px',
                                                            background: p.quantity <= (p.low_stock_threshold || 5) ? 'var(--accent-danger-soft)' : 'var(--accent-success-soft)',
                                                            color: p.quantity <= (p.low_stock_threshold || 5) ? 'var(--accent-danger)' : 'var(--accent-success)',
                                                            borderRadius: 6, fontWeight: 600
                                                        }}>{p.quantity} ta</span>
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Soni</label>
                                <input type="number" className="form-input" min="1"
                                    max={productForm.product_id ? (products.find(p => String(p.id) === String(productForm.product_id))?.quantity || 999) : 999}
                                    required
                                    value={productForm.quantity}
                                    onChange={e => setProductForm({ ...productForm, quantity: parseInt(e.target.value) || 1 })} />
                                {productForm.product_id && (() => {
                                    const p = products.find(x => String(x.id) === String(productForm.product_id));
                                    return p && productForm.quantity > p.quantity ? (
                                        <p style={{ color: 'var(--accent-danger)', fontSize: '0.8rem', marginTop: 6 }}>⚠️ Qoldiq: {p.quantity} ta dan ko'p kirita olmaysiz</p>
                                    ) : null;
                                })()}
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowProductModal(false)}>Bekor qilish</button>
                                <button type="submit" className="btn btn-primary"
                                    disabled={!productForm.product_id}>
                                    <ShoppingCart size={16} /> Qo'shish
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* 🗑️ Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
                    <div className="modal" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
                        <div className="text-center" style={{ padding: '20px 0' }}>
                            <div style={{ color: 'var(--accent-danger)', marginBottom: '16px' }}>
                                <Trash2 size={48} strokeWidth={1.5} />
                            </div>
                            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Xonani o'chirish</h3>
                            <p className="text-muted">
                                Rostdan ham <b>{showDeleteConfirm.name}</b> xonasini o'chirib tashlamoqchimisiz?
                                <br />Bu amalni ortga qaytarib bo'lmaydi.
                            </p>
                        </div>
                        <div className="flex gap-12 mt-24">
                            <button className="btn btn-secondary w-full" onClick={() => setShowDeleteConfirm(null)}>
                                Bekor qilish
                            </button>
                            <button className="btn btn-danger w-full" onClick={handleDeleteRoom}>
                                Ha, o'chirish
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default RoomsPage;
