// ============================================
// 📁 File: frontend/src/pages/RoomsPage.jsx — Rooms Dashboard Page
// 👤 Author: User with AI
// 📝 Description: Main dashboard for room management in game club.
//    Shows room cards with live timers, session start/stop, room CRUD,
//    VIP (unlimited time) mode, bill receipt on session close.
// 📅 Created: 2026-03-12 05:51 (Tashkent Time)
// ============================================
// 📋 CHANGE LOG:
// 2026-03-24 17:15 (Tashkent) — 📱 Mobile responsiveness: Replaced desktop tooltip context menu with an Apple/Telegram Action Sheet for mobile screens.
// 2026-03-21 12:08 (Tashkent) — V6.0 Apple/Telegram UI Redesign:
//    - Inherited global CSS variables for tighter room cards and paddings.
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
// 2026-03-21 12:15 (Tashkent) — V6.1 Bug Fixes:
//   - Added `autoFocus` to main modal inputs for quick `Enter` submits
//   - Replaced native number input with custom +/- buttons
//   - Cleaned up console_type options (kept only PS3, PS4, PS5)
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
    Gamepad2, PowerOff, Shield, CalendarPlus, CalendarClock, CalendarX2,
    ArrowUpDown, GripVertical, Check
} from 'lucide-react';

// Helpers for Date logic
const getTodayDate = () => {
    // using local time string to prevent timezone offset bugs
    const date = new Date();
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().split('T')[0];
};

const getDefaultBookingTimes = () => {
    const now = new Date();
    if (now.getMinutes() > 0) now.setHours(now.getHours() + 1);
    const from_time = String(now.getHours() % 24).padStart(2, '0') + ':00';
    now.setHours(now.getHours() + 1);
    const until_time = String(now.getHours() % 24).padStart(2, '0') + ':00';
    return { from_time, until_time };
};

const getTomorrowDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().split('T')[0];
};

const getDayAfterTomorrowDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 2);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().split('T')[0];
};

const formatReservationDate = (isoString) => {
    const dStr = isoString.split('T')[0];
    if (dStr === getTodayDate()) return 'Bugun';
    if (dStr === getTomorrowDate()) return 'Ertaga';
    if (dStr === getDayAfterTomorrowDate()) return 'Indinga';
    return new Date(isoString).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit' }).replace(/\//g, '.');
};

const baseTimeOptions = [];
for (let h = 0; h < 24; h++) {
    const hour = h.toString().padStart(2, '0');
    baseTimeOptions.push({ value: `${hour}:00`, label: `${hour}:00` });
    baseTimeOptions.push({ value: `${hour}:30`, label: `${hour}:30` });
}

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
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null); // room to delete
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [contextMenu, setContextMenu] = useState({ roomId: null, room: null, isBusy: false, x: 0, y: 0 });

    // 📱 Long press timer ref for mobile
    const longPressTimer = useRef(null);

    // 🔄 Reorder mode state
    const [reorderMode, setReorderMode] = useState(false);
    const [draggedIdx, setDraggedIdx] = useState(null);
    const [reorderRooms, setReorderRooms] = useState([]);
    const [savingOrder, setSavingOrder] = useState(false);
    // 🔗 Ref to always have latest reorderRooms (avoids stale closure in keydown)
    const reorderRoomsRef = useRef([]);
    useEffect(() => { reorderRoomsRef.current = reorderRooms; }, [reorderRooms]);

    // 🔄 Save reorder function (shared between Enter key, button click)
    const saveReorder = async () => {
        const currentOrder = reorderRoomsRef.current;
        if (!currentOrder.length) return;
        setSavingOrder(true);
        try {
            const order = currentOrder.map((r, i) => ({ id: r.id, sort_order: i }));
            await api.put('/rooms/reorder', { order });
            setRooms([...currentOrder]);
            setReorderMode(false);
            setReorderRooms([]);
        } catch (err) {
            console.error('Reorder error:', err);
        } finally {
            setSavingOrder(false);
        }
    };

    // Handle global click to close context menu and Esc key
    useEffect(() => {
        const handleClick = () => {
            setContextMenu({ roomId: null, room: null, isBusy: false, x: 0, y: 0 });
        };
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                // 🔄 If in reorder mode, exit it first
                if (reorderMode) {
                    setReorderMode(false);
                    setReorderRooms([]);
                    return;
                }
                setShowRoomModal(false);
                setShowStartModal(false);
                setShowStopModal(false);
                setShowProductModal(false);
                setShowBillModal(false);
                setShowBookingModal(false);
                setShowDeleteConfirm(null);
                setContextMenu({ roomId: null, room: null, isBusy: false, x: 0, y: 0 });
            }
            // ⌨️ Enter saves reorder
            if (e.key === 'Enter' && reorderMode && !savingOrder) {
                e.preventDefault();
                saveReorder();
            }
        };
        document.addEventListener('click', handleClick);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('click', handleClick);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [reorderMode, savingOrder]);

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
    const [bookingForm, setBookingForm] = useState({
        customer_phone: '',
        date: getTodayDate(),
        ...getDefaultBookingTimes()
    });
    const [phoneTouched, setPhoneTouched] = useState(false);

    const getAvailableTimeOptions = (dateStr) => {
        if (dateStr !== getTodayDate()) {
            return baseTimeOptions;
        }
        const now = new Date();
        const currHour = now.getHours();
        const currMin = now.getMinutes();

        return baseTimeOptions.filter(opt => {
            const [h, m] = opt.value.split(':').map(Number);
            if (h > currHour) return true;
            if (h === currHour && m >= currMin) return true;
            return false;
        });
    };

    const availableTimeOptions = getAvailableTimeOptions(bookingForm.date);

    useEffect(() => {
        if (showBookingModal && availableTimeOptions.length > 0) {
            // Update from_time only if the currently selected one is no longer available
            // Note: we don't aggressively reset it to availableTimeOptions[0] if the user manually changes date
            // The user requested that until_time also adjusts.
        }
    }, [bookingForm.date, showBookingModal, availableTimeOptions]);

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

    // 🟢 Submit Room form
    const handleRoomSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            const payload = { ...roomForm, vip_hourly_rate: roomForm.hourly_rate };
            if (editRoom) {
                await api.put(`/rooms/${editRoom.id}`, payload);
            } else {
                await api.post('/rooms', payload);
            }
            setShowRoomModal(false);
            setEditRoom(null);
            await fetchRooms();
        } catch (err) {
            alert(err.response?.data?.error || 'Xatolik');
        } finally { setIsSubmitting(false); }
    };



    // ▶️ Start session
    const handleStartSession = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        const totalMinutes = (parseInt(sessionForm.hours) || 0) * 60 + (parseInt(sessionForm.minutes) || 0);
        try {
            await api.post('/sessions/start', {
                room_id: selectedRoom.id,
                is_vip: sessionForm.is_vip,
                duration_minutes: sessionForm.is_vip ? null : totalMinutes
            });
            setShowStartModal(false);
            await fetchRooms();
        } catch (err) {
            alert(err.response?.data?.error || 'Xatolik');
        } finally { setIsSubmitting(false); }
    };

    // ⏹️ Stop session  
    const handleStopSession = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            const res = await api.post(`/sessions/${selectedRoom.active_session?.id}/stop`, stopForm);
            setShowStopModal(false);
            setBillData(res.data.bill);
            setShowBillModal(true);
            await fetchRooms();
        } catch (err) {
            alert(err.response?.data?.error || 'Xatolik');
        } finally { setIsSubmitting(false); }
    };

    // 🛒 Add product to session — also refreshes product list to update stock counts
    const handleAddProduct = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await api.post(`/sessions/${selectedRoom.active_session?.id}/products`, productForm);
            setShowProductModal(false);
            // 🔄 Refresh BOTH rooms (session product totals) AND products (stock counts)
            await fetchRooms();
            await fetchProducts();
        } catch (err) {
            alert(err.response?.data?.error || 'Xatolik');
        } finally { setIsSubmitting(false); }
    };

    // 🗓️ Book Room
    const handleBookRoom = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            if (bookingForm.customer_phone.length !== 9 || !bookingForm.from_time) {
                return;
            }

            // Fix Timezone Bug string formatting: Send exact Local Time layout "YYYY-MM-DD HH:mm:00"
            const reserved_from = `${bookingForm.date} ${bookingForm.from_time}:00`;

            // If empty, auto-extend to 12 hours
            let reserved_until;
            if (bookingForm.until_time) {
                reserved_until = `${bookingForm.date} ${bookingForm.until_time}:00`;
            } else {
                const dt = new Date(`${bookingForm.date}T${bookingForm.from_time}:00`);
                dt.setHours(dt.getHours() + 12);
                const mm = dt.getMonth() + 1;
                const dd = dt.getDate();
                const yy = dt.getFullYear();
                const hh = dt.getHours().toString().padStart(2, '0');
                const min = dt.getMinutes().toString().padStart(2, '0');
                reserved_until = `${yy}-${mm.toString().padStart(2, '0')}-${dd.toString().padStart(2, '0')} ${hh}:${min}:00`;
            }

            const phoneStr = '+998 ' + bookingForm.customer_phone;
            await api.post('/reservations', {
                room_id: selectedRoom.id,
                customer_name: phoneStr,
                customer_phone: phoneStr,
                reserved_from,
                reserved_until,
                notes: !bookingForm.until_time ? 'VIP' : undefined
            });
            setShowBookingModal(false);
            await fetchRooms();
        } catch (err) {
            alert(err.response?.data?.error || 'Xatolik');
        } finally { setIsSubmitting(false); }
    };

    const handleCancelReservation = async (reservationId) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await api.put(`/reservations/${reservationId}/cancel`);
            await fetchRooms();
        } catch (err) {
            alert(err.response?.data?.error || "Xatolik yuz berdi");
        } finally { setIsSubmitting(false); }
    };

    // ✏️ Open edit room
    // 🗑️ Delete room
    const handleDeleteRoom = async () => {
        if (!showDeleteConfirm || isSubmitting) return;
        setIsSubmitting(true);
        const room = showDeleteConfirm;

        try {
            await api.delete(`/rooms/${room.id}`);
            setShowDeleteConfirm(null);
            await fetchRooms(); // Refresh list
        } catch (err) {
            console.error('Room delete error:', err);
            alert(`Xonani o'chirishda xatolik yuz berdi: ${err.response?.data?.error || err.message}`);
        } finally { setIsSubmitting(false); }
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
                    reorderMode ? (
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                <ArrowUpDown size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                                Xonalarni sudrab joyini almashtiring
                            </span>
                            <button className="btn btn-ghost" onClick={() => {
                                setReorderMode(false);
                                setReorderRooms([]);
                            }}>Bekor qilish</button>
                            <button className="btn btn-primary" disabled={savingOrder} onClick={saveReorder}>
                                <Check size={16} /> {savingOrder ? 'Saqlanmoqda...' : 'Saqlash'}
                            </button>
                        </div>
                    ) : (
                        <button className="btn btn-primary" onClick={() => {
                            setEditRoom(null);
                            setRoomForm({ name: '', console_type: 'PS5', capacity: 4, hourly_rate: '', max_players: 4 });
                            setShowRoomModal(true);
                        }}>
                            <Plus size={18} /> Yangi xona
                        </button>
                    )
                )}
            </div>

            {/* 🎮 Room Cards Grid */}
            <div className="grid-rooms">
                {(reorderMode ? reorderRooms : rooms).map((room, roomIdx) => {
                    const session = room.active_session;
                    const isBusy = room.status === 'busy' && session;
                    const isVip = session?.is_vip || session?.is_unlimited;
                    const remaining = isBusy && session.scheduled_end ? getRemaining(session.scheduled_end) : null;
                    const cardClass = isBusy ? (isVip ? 'vip' : 'busy') : room.status === 'maintenance' ? 'maintenance' : 'free';

                    return (
                        <div key={room.id} className={`card room-card ${cardClass}${reorderMode ? ' reorder-wiggle' : ''}`}
                            draggable={reorderMode}
                            onDragStart={reorderMode ? (e) => {
                                setDraggedIdx(reorderMode ? reorderRooms.findIndex(r => r.id === room.id) : null);
                                e.dataTransfer.effectAllowed = 'move';
                            } : undefined}
                            onDragOver={reorderMode ? (e) => {
                                e.preventDefault();
                                e.dataTransfer.dropEffect = 'move';
                            } : undefined}
                            onDrop={reorderMode ? (e) => {
                                e.preventDefault();
                                const targetIdx = reorderRooms.findIndex(r => r.id === room.id);
                                if (draggedIdx !== null && draggedIdx !== targetIdx) {
                                    const updated = [...reorderRooms];
                                    const [moved] = updated.splice(draggedIdx, 1);
                                    updated.splice(targetIdx, 0, moved);
                                    setReorderRooms(updated);
                                }
                                setDraggedIdx(null);
                            } : undefined}
                            onDragEnd={reorderMode ? () => setDraggedIdx(null) : undefined}
                            style={reorderMode ? { cursor: 'grab', opacity: draggedIdx === (reorderRooms.findIndex(r => r.id === room.id)) ? 0.5 : 1 } : {}}
                            onContextMenu={reorderMode ? (e) => e.preventDefault() : (e) => {
                                if (hasRole('manager', 'owner')) {
                                    e.preventDefault();
                                    setContextMenu({ roomId: room.id, room: room, isBusy: !!isBusy, x: e.clientX, y: e.clientY });
                                }
                            }}
                            onTouchStart={(e) => {
                                if (!reorderMode && hasRole('manager', 'owner')) {
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
                                            room.reservation_id ? (
                                                <div className="badge" style={{ background: 'rgba(255,165,0,0.15)', color: '#ffa500', border: '1px solid rgba(255,165,0,0.3)' }}>
                                                    <span className="badge-dot" style={{ background: '#ffa500' }}></span> BRON
                                                </div>
                                            ) : (
                                                <div className="badge free">
                                                    <span className="badge-dot"></span> BO'SH
                                                </div>
                                            )
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

                            {/* 🎮 Action buttons — hidden during reorder mode */}
                            {!reorderMode && <div className="room-card-actions">
                                {!isBusy && room.status === 'free' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                                        <button className="btn btn-success w-full" onClick={() => {
                                            setSelectedRoom(room);
                                            setSessionForm({ is_vip: false, hours: 1, minutes: 0 });
                                            setShowStartModal(true);
                                        }}>
                                            <Gamepad2 size={16} /> Ochish
                                        </button>

                                        {room.reservation_id ? (
                                            <div style={{
                                                width: '100%',
                                                minHeight: '44px',
                                                background: 'rgba(255,165,0,0.08)',
                                                border: '1px solid rgba(255,165,0,0.2)',
                                                borderRadius: 'var(--radius-md)',
                                                color: '#ffa500',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                padding: '4px 8px',
                                                gap: '2px'
                                            }}>
                                                <div style={{ fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.3px', display: 'flex', alignItems: 'center', gap: 6, lineHeight: 1.2 }}>
                                                    <CalendarClock size={14} /> {formatReservationDate(room.reservation_from)}, {new Date(room.reservation_from).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })} - {room.reservation_notes === 'VIP' ? 'VIP' : new Date(room.reservation_until).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                                {room.reservation_phone ? (
                                                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff', marginTop: '2px', letterSpacing: '0.5px' }}>{room.reservation_phone}</div>
                                                ) : null}
                                            </div>
                                        ) : (
                                            <button className="btn w-full" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-glass)', color: 'var(--text-secondary)' }} onClick={() => {
                                                setSelectedRoom(room);
                                                setBookingForm({ customer_phone: '', date: getTodayDate(), ...getDefaultBookingTimes() });
                                                setPhoneTouched(false);
                                                setShowBookingModal(true);
                                            }}>
                                                <CalendarPlus size={16} /> Band qilish
                                            </button>
                                        )}
                                    </div>
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
                            </div>}
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
                    const isMobile = window.innerWidth <= 768;

                    // Reusable menu items to ensure consistency between Desktop and Mobile
                    const menuItems = contextMenu.isBusy ? (
                        <div style={{ padding: '10px 12px', fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                            <div style={{ color: 'var(--accent-primary)', marginBottom: '4px' }}><Shield size={16} /></div>
                            Xona band, tahrirlash uchun avval sessiyani yoping
                        </div>
                    ) : (
                        <>
                            <button className="btn btn-ghost btn-sm w-full" style={{ justifyContent: 'flex-start', marginBottom: '4px', fontSize: isMobile ? '0.95rem' : '0.85rem', padding: isMobile ? '12px' : '6px 12px' }}
                                onClick={() => { openEditRoom(contextMenu.room); setContextMenu({ roomId: null, room: null, isBusy: false, x: 0, y: 0 }); }}>
                                <Pencil size={18} /> Tahrirlash
                            </button>
                            <button className="btn btn-ghost btn-sm w-full" style={{ justifyContent: 'flex-start', color: 'var(--accent-danger)', marginBottom: '4px', fontSize: isMobile ? '0.95rem' : '0.85rem', padding: isMobile ? '12px' : '6px 12px' }}
                                onClick={() => {
                                    setShowDeleteConfirm(contextMenu.room);
                                    setContextMenu({ roomId: null, room: null, isBusy: false, x: 0, y: 0 });
                                }}>
                                <Trash2 size={18} /> O'chirish
                            </button>

                            <div style={{ height: '1px', background: 'var(--border-glass)', margin: '4px 0' }} />

                            {contextMenu.room.reservation_id ? (
                                <button className="btn btn-ghost btn-sm w-full" style={{ justifyContent: 'flex-start', color: '#ffa500', marginBottom: '4px', fontSize: isMobile ? '0.95rem' : '0.85rem', padding: isMobile ? '12px' : '6px 12px' }}
                                    onClick={() => {
                                        handleCancelReservation(contextMenu.room.reservation_id);
                                        setContextMenu({ roomId: null, room: null, isBusy: false, x: 0, y: 0 });
                                    }}>
                                    <CalendarX2 size={18} /> Bronni bekor qilish
                                </button>
                            ) : (
                                <button className="btn btn-ghost btn-sm w-full" style={{ justifyContent: 'flex-start', color: 'var(--text-primary)', marginBottom: '4px', fontSize: isMobile ? '0.95rem' : '0.85rem', padding: isMobile ? '12px' : '6px 12px' }}
                                    onClick={() => {
                                        setSelectedRoom(contextMenu.room);
                                        setBookingForm({ customer_phone: '', date: getTodayDate(), ...getDefaultBookingTimes() });
                                        setPhoneTouched(false);
                                        setShowBookingModal(true);
                                        setContextMenu({ roomId: null, room: null, isBusy: false, x: 0, y: 0 });
                                    }}>
                                    <CalendarPlus size={18} /> Band qilish
                                </button>
                            )}

                            <button className="btn btn-ghost btn-sm w-full" style={{ justifyContent: 'flex-start', color: 'var(--text-secondary)', fontSize: isMobile ? '0.95rem' : '0.85rem', padding: isMobile ? '12px' : '6px 12px' }}
                                onClick={() => {
                                    setReorderMode(true);
                                    setReorderRooms([...rooms]);
                                    setContextMenu({ roomId: null, room: null, isBusy: false, x: 0, y: 0 });
                                }}>
                                <ArrowUpDown size={18} /> Tartiblash
                            </button>
                        </>
                    );

                    if (isMobile) {
                        return (
                            <div className="action-sheet-overlay" onClick={() => setContextMenu({ roomId: null, room: null, isBusy: false, x: 0, y: 0 })}>
                                <div className="action-sheet" onClick={(e) => e.stopPropagation()}>
                                    <div className="action-sheet-handle"></div>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 600, textAlign: 'center', marginBottom: '16px', color: 'var(--text-primary)' }}>
                                        {contextMenu.room?.name || 'Xona'}
                                    </h3>
                                    {menuItems}
                                </div>
                            </div>
                        );
                    }

                    // Desktop mode
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
                            {menuItems}
                        </div>
                    );
                })(),
                document.body
            )}

            {/* ➕✏️ Room Modal (Create/Edit) */}
            {showRoomModal && createPortal(
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
                                <input type="text" className="form-input" placeholder="Room 1" required autoFocus
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
                                            { value: 'PS5', label: 'PS5' },
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
                </div>,
                document.body
            )}

            {/* ▶️ Start Session Modal */}
            {showStartModal && selectedRoom && createPortal(
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
                                            <input type="number" className="form-input" min="0" max="24" autoFocus
                                                placeholder="0"
                                                value={sessionForm.hours === 0 ? '' : sessionForm.hours}
                                                onChange={e => {
                                                    let val = e.target.value;
                                                    setSessionForm({ ...sessionForm, hours: val === '' ? 0 : parseInt(val, 10) });
                                                }} />
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
                </div>,
                document.body
            )}

            {/* ⏹️ Stop Session Modal */}
            {showStopModal && selectedRoom && createPortal(
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

                            <div className={stopForm.discount_amount > 0 ? "grid-2" : ""}>
                                <div className="form-group">
                                    <label className="form-label">Chegirma (so'm)</label>
                                    <input type="number" className="form-input" min="0" placeholder="0" autoFocus
                                        value={stopForm.discount_amount || ''}
                                        onChange={e => setStopForm({ ...stopForm, discount_amount: e.target.value === '' ? 0 : parseInt(e.target.value) })} />
                                </div>
                                {stopForm.discount_amount > 0 && (
                                    <div className="form-group animate-fade-in">
                                        <label className="form-label">Chegirma sababi</label>
                                        <input type="text" className="form-input" placeholder="Ixtiyoriy"
                                            value={stopForm.discount_reason}
                                            onChange={e => setStopForm({ ...stopForm, discount_reason: e.target.value })} />
                                    </div>
                                )}
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowStopModal(false)}>Bekor qilish</button>
                                <button type="submit" className="btn btn-danger">
                                    <PowerOff size={16} /> Yopish va hisoblash
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* 🧾 Bill Receipt Modal */}
            {showBillModal && billData && createPortal(
                <div className="modal-overlay" onClick={() => setShowBillModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
                        <div className="modal-header">
                            <h3 className="modal-title"><Receipt size={18} /> Chek</h3>
                            <button className="modal-close" onClick={() => setShowBillModal(false)}><X size={16} /></button>
                        </div>

                        <div className="bill-receipt" style={{ margin: '16px -20px 0 -20px', borderLeft: 'none', borderRight: 'none', borderRadius: 0 }}>
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
                </div>,
                document.body
            )}

            {/* 🛒 Add Product Modal */}
            {showProductModal && selectedRoom && createPortal(
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
                                <CustomSelect
                                    value={productForm.product_id}
                                    onChange={v => setProductForm({ ...productForm, product_id: v })}
                                    options={products.filter(p => p.quantity > 0 && p.is_active).map(p => ({
                                        value: p.id,
                                        label: (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
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
                                        )
                                    }))}
                                    placeholder="Tanlang..."
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Soni</label>
                                <div className="flex gap-8">
                                    <button type="button" className="btn btn-secondary" style={{ padding: '0 16px', background: 'var(--bg-elevated)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)' }} onClick={() => setProductForm({ ...productForm, quantity: Math.max(1, (productForm.quantity || 1) - 1) })}>-</button>
                                    <input type="number" className="form-input text-center" min="1"
                                        max={productForm.product_id ? (products.find(p => String(p.id) === String(productForm.product_id))?.quantity || 999) : 999}
                                        required
                                        value={productForm.quantity === '' ? '' : productForm.quantity}
                                        onChange={e => {
                                            const val = e.target.value;
                                            setProductForm({ ...productForm, quantity: val === '' ? '' : parseInt(val) });
                                        }} />
                                    <button type="button" className="btn btn-secondary" style={{ padding: '0 16px', background: 'var(--bg-elevated)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)' }} onClick={() => {
                                        const maxQty = productForm.product_id ? (products.find(p => String(p.id) === String(productForm.product_id))?.quantity || 999) : 999;
                                        setProductForm({ ...productForm, quantity: Math.min(maxQty, (productForm.quantity || 1) + 1) });
                                    }}>+</button>
                                </div>
                                {productForm.product_id && (() => {
                                    const p = products.find(x => String(x.id) === String(productForm.product_id));
                                    return p && productForm.quantity > p.quantity ? (
                                        <p style={{ color: 'var(--accent-danger)', fontSize: '0.8rem', marginTop: 6 }}>⚠️ Qoldiq: {p.quantity} ta dan ko'p kirita olmaysiz</p>
                                    ) : null;
                                })()}
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowProductModal(false)} disabled={isSubmitting}>Bekor qilish</button>
                                <button type="submit" className="btn btn-primary"
                                    disabled={!productForm.product_id || isSubmitting}>
                                    <ShoppingCart size={16} /> {isSubmitting ? 'Qo\'shilmoqda...' : "Qo'shish"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
            {/* 🗑️ Delete Confirmation Modal */}
            {showDeleteConfirm && createPortal(
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
                </div>,
                document.body
            )}

            {/* 🗓️ Modals: BRON QILISH */}
            {showBookingModal && selectedRoom && createPortal(
                <div className="modal-overlay" onClick={() => setShowBookingModal(false)}>
                    <div className="modal animate-scale-up" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
                        <div className="modal-header">
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#ffa500' }}>
                                <CalendarPlus size={20} /> Xonani band qilish — {selectedRoom.name}
                            </h3>
                            <button className="btn btn-ghost" onClick={() => setShowBookingModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleBookRoom}>
                            <div className="form-group">
                                <label className="form-label">Telefon raqami</label>
                                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.95rem', paddingLeft: '12px' }}>+998</span>
                                    <input type="text" className="form-input" placeholder="901234567" required autoFocus
                                        style={{ border: 'none', background: 'transparent', boxShadow: 'none' }}
                                        value={bookingForm.customer_phone}
                                        maxLength={9}
                                        onBlur={() => setPhoneTouched(true)}
                                        onChange={e => {
                                            const val = e.target.value.replace(/[^0-9]/g, '');
                                            setBookingForm({ ...bookingForm, customer_phone: val.substring(0, 9) });
                                        }} />
                                </div>
                                {phoneTouched && bookingForm.customer_phone.length > 0 && bookingForm.customer_phone.length < 9 && (
                                    <div style={{ color: 'var(--accent-danger)', fontSize: '0.8rem', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        ⚠️ Raqam to'liq emas (9 ta raqam bo'lishi kerak)
                                    </div>
                                )}
                            </div>
                            <div className="form-group mb-24">
                                <label className="form-label">Sana</label>
                                <div className="flex p-4" style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                                    <button type="button"
                                        style={{
                                            flex: 1, padding: '10px 0', fontSize: '0.95rem', fontWeight: 600,
                                            borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                                            background: bookingForm.date === getTodayDate() ? 'var(--accent-primary)' : 'transparent',
                                            color: bookingForm.date === getTodayDate() ? '#000' : 'var(--text-secondary)',
                                            boxShadow: bookingForm.date === getTodayDate() ? '0 2px 8px rgba(255, 214, 10, 0.3)' : 'none'
                                        }}
                                        onClick={() => setBookingForm({ ...bookingForm, date: getTodayDate() })}>
                                        Bugun
                                    </button>
                                    <button type="button"
                                        style={{
                                            flex: 1, padding: '10px 0', fontSize: '0.95rem', fontWeight: 600,
                                            borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                                            background: bookingForm.date === getTomorrowDate() ? 'var(--accent-primary)' : 'transparent',
                                            color: bookingForm.date === getTomorrowDate() ? '#000' : 'var(--text-secondary)',
                                            boxShadow: bookingForm.date === getTomorrowDate() ? '0 2px 8px rgba(255, 214, 10, 0.3)' : 'none'
                                        }}
                                        onClick={() => setBookingForm({ ...bookingForm, date: getTomorrowDate() })}>
                                        Ertaga
                                    </button>
                                    <button type="button"
                                        style={{
                                            flex: 1, padding: '10px 0', fontSize: '0.95rem', fontWeight: 600,
                                            borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                                            background: bookingForm.date === getDayAfterTomorrowDate() ? 'var(--accent-primary)' : 'transparent',
                                            color: bookingForm.date === getDayAfterTomorrowDate() ? '#000' : 'var(--text-secondary)',
                                            boxShadow: bookingForm.date === getDayAfterTomorrowDate() ? '0 2px 8px rgba(255, 214, 10, 0.3)' : 'none'
                                        }}
                                        onClick={() => setBookingForm({ ...bookingForm, date: getDayAfterTomorrowDate() })}>
                                        Indinga
                                    </button>
                                </div>
                            </div>

                            <div className="grid-2 gap-16">
                                <div className="form-group" style={{ zIndex: 10 }}>
                                    <label className="form-label">Qachondan</label>
                                    <CustomSelect
                                        value={bookingForm.from_time}
                                        onChange={v => setBookingForm({ ...bookingForm, from_time: v })}
                                        options={availableTimeOptions}
                                    />
                                </div>
                                <div className="form-group" style={{ zIndex: 9 }}>
                                    <label className="form-label">Qachongacha</label>
                                    <CustomSelect
                                        value={bookingForm.until_time}
                                        onChange={v => setBookingForm({ ...bookingForm, until_time: v })}
                                        options={[{ value: '', label: 'VIP (Cheksiz)' }, ...baseTimeOptions]}
                                    />
                                </div>
                            </div>

                            <div className="modal-actions mt-24">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowBookingModal(false)}>Bekor qilish</button>
                                <button type="submit" className="btn" disabled={bookingForm.customer_phone.length !== 9} style={{ background: bookingForm.customer_phone.length === 9 ? 'rgba(255,165,0,0.15)' : 'var(--bg-elevated)', color: bookingForm.customer_phone.length === 9 ? '#ffa500' : 'var(--text-muted)', border: bookingForm.customer_phone.length === 9 ? '1px solid rgba(255,165,0,0.3)' : '1px solid var(--border-subtle)', cursor: bookingForm.customer_phone.length === 9 ? 'pointer' : 'not-allowed' }}>
                                    <CheckCircle2 size={16} /> Band qilish
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

        </div>
    );
}

export default RoomsPage;
