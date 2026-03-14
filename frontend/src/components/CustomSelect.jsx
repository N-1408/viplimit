// ============================================
// 📁 File: frontend/src/components/CustomSelect.jsx — Custom Styled Dropdown
// 👤 Author: User with AI
// 📝 Description: A reusable, fully styled dropdown that replaces native HTML
//    <select> elements. Matches the premium glassmorphism design system of
//    VipLimit. Uses position:fixed + getBoundingClientRect so it renders above
//    any parent with overflow:hidden (e.g. modals). Supports ESC, click-outside.
// 📅 Created: 2026-03-13 05:22 (Tashkent Time)
// ============================================
// 📋 CHANGE LOG:
// 2026-03-13 06:09 (Tashkent) — Fixed: dropdown now uses position:fixed with
//    getBoundingClientRect so it is not clipped by modal overflow:hidden.
//    Also auto-flips to open upward if not enough space below on screen.
// ============================================

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * 🎨 CustomSelect — Premium Glassmorphism Dropdown (Portal-based)
 *
 * @param {string|number} value       — currently selected value
 * @param {Function}      onChange    — called with the selected option's value
 * @param {Array}         options     — [{ value, label }]
 * @param {string}        placeholder — text when nothing selected
 * @param {boolean}       disabled    — disables interaction
 * @param {object}        style       — extra wrapper container styles
 */
export default function CustomSelect({ value, onChange, options = [], placeholder = 'Tanlang...', disabled = false, style = {} }) {
    const [open, setOpen] = useState(false);
    // 📐 Track position of the trigger button for the fixed portal
    const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0, openUpward: false });
    const triggerRef = useRef(null);

    // 🖱️ Close on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (triggerRef.current && !triggerRef.current.closest('[data-custom-select]')?.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // ⌨️ Close on Escape key + Body Scroll Lock (with shift compensation)
    useEffect(() => {
        const handleKey = (e) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('keydown', handleKey);

        if (open) {
            const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
            document.body.style.overflow = 'hidden';
            if (scrollbarWidth > 0) {
                document.body.style.paddingRight = `${scrollbarWidth}px`;
            }
        } else {
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        }

        return () => {
            document.removeEventListener('keydown', handleKey);
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        };
    }, [open]);

    // 📐 Compute dropdown position from trigger rect — called on open
    const handleToggle = () => {
        if (disabled) return;
        if (!open && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const dropHeight = Math.min(options.length * 44 + 8, 240);
            // 🔄 Flip upward if not enough space below
            const openUpward = spaceBelow < dropHeight && rect.top > dropHeight;
            setDropPos({
                top: openUpward ? rect.top - dropHeight - 4 : rect.bottom + 6,
                left: rect.left,
                width: rect.width,
                openUpward,
            });
        }
        setOpen(o => !o);
    };

    // 🔡 Find the label of current selected option
    const selected = options.find(o => String(o.value) === String(value));

    // 📋 The floating dropdown list — rendered via portal to escape overflow:hidden
    const dropdown = open && (
        <div
            data-custom-select-portal
            style={{
                position: 'fixed',
                top: dropPos.top,
                left: dropPos.left,
                width: dropPos.width,
                zIndex: 9999,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-glass)',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 16px 48px rgba(0,0,0,0.7), 0 4px 16px rgba(0,0,0,0.4)',
                backdropFilter: 'blur(40px)',
                WebkitBackdropFilter: 'blur(40px)',
                maxHeight: 240,
                overflowY: 'auto',
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(255,255,255,0.1) transparent',
            }}
            onMouseDown={e => e.stopPropagation()}
        >
            {options.map((opt) => {
                const isActive = String(opt.value) === String(value);
                return (
                    <div
                        key={opt.value}
                        onMouseDown={(e) => {
                            e.preventDefault();
                            onChange(opt.value);
                            setOpen(false);
                        }}
                        style={{
                            padding: '11px 16px',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            background: isActive ? 'rgba(255,214,10,0.08)' : 'transparent',
                            borderLeft: isActive ? '3px solid var(--accent-primary)' : '3px solid transparent',
                            color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                            fontWeight: isActive ? 600 : 400,
                            userSelect: 'none',
                        }}
                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                    >
                        {/* ✅ Checkmark icon for selected */}
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                            style={{ opacity: isActive ? 1 : 0, flexShrink: 0, transition: 'opacity 0.15s' }}>
                            <path d="M2.5 7L5.5 10L11.5 4" stroke="var(--accent-primary)"
                                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {opt.label}
                    </div>
                );
            })}
        </div>
    );

    return (
        <div data-custom-select style={{ position: 'relative', ...style }}>
            {/* 🔽 Trigger button */}
            <button
                ref={triggerRef}
                type="button"
                disabled={disabled}
                onClick={handleToggle}
                style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'var(--bg-input)',
                    border: `1px solid ${open ? 'rgba(255,214,10,0.5)' : 'var(--border-glass)'}`,
                    borderRadius: 'var(--radius-md)',
                    color: selected ? 'var(--text-primary)' : 'var(--text-muted)',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    fontSize: '0.9rem',
                    textAlign: 'left',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    boxShadow: open ? '0 0 0 2px rgba(255,214,10,0.15)' : 'none',
                    opacity: disabled ? 0.5 : 1,
                    userSelect: 'none',
                }}
            >
                <span>{selected ? selected.label : placeholder}</span>
                {/* 🔺 Animated chevron */}
                <svg
                    width="12" height="12" viewBox="0 0 12 12" fill="none"
                    style={{
                        opacity: 0.5,
                        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                        flexShrink: 0,
                        marginLeft: 8,
                    }}
                >
                    <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5"
                        strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>

            {/* 🚀 Render dropdown via portal to escape overflow:hidden parents */}
            {typeof document !== 'undefined' && createPortal(dropdown, document.body)}
        </div>
    );
}
