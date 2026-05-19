"use client";

import React, { useState, useRef } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    IconButton,
    Avatar,
    Box,
    Typography,
    TextField,
    Grid,
    CircularProgress,
    Alert,
    Snackbar,
    MenuItem,
    Chip,
    Card,
    Divider,
    InputAdornment,
    Tooltip,
    Autocomplete,
    Radio,
    RadioGroup,
    FormControlLabel,
    FormControl,
    Checkbox,
    GlobalStyles
} from "@mui/material";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import {
    Trash2,
    Plus,
    Pencil,
    ShoppingCart,
    Calendar,
    User,
    Search,
    Save,
    X as XIcon,
    Eye,
    Printer,
    BookText,
    Ruler,
    MessageCircle,
    ScanLine,
} from "lucide-react";

const BOOKING_STATUSES = [
    { value: "PENDING", label: "Pending", color: "#f59e0b" },
    { value: "MEASUREMENT_TAKEN", label: "Measurement Taken", color: "#3b82f6" },
    { value: "CUTTING", label: "Cutting", color: "#8b5cf6" },
    { value: "STITCHING", label: "Stitching", color: "#ec4899" },
    { value: "TRIAL", label: "Trial", color: "#06b6d4" },
    { value: "READY", label: "Ready", color: "#10b981" },
    { value: "DELIVERED", label: "Delivered", color: "#059669" },
    { value: "CANCELLED", label: "Cancelled", color: "#ef4444" }
];

// ─── Shared print header ─────────────────────────────────────────────────────
function PrintHeader() {
    return (
        <div style={{ borderBottom: '3px solid #1a1a2e', paddingBottom: 10, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <img src="/logo.png" alt="Logo" style={{ width: 72, height: 72, objectFit: 'contain' }} />
                <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: 1, color: '#1a1a2e', textTransform: 'uppercase' }}>
                        Grace Cloth and Tailors
                    </div>
                    <div style={{ fontSize: 12, color: '#555', marginTop: 2, fontStyle: 'italic' }}>
                        Where Style Meets Perfection
                    </div>
                    <div style={{ fontSize: 12, marginTop: 4, color: '#222' }}>
                        📞 03006284318 &nbsp;|&nbsp; 03186284318
                    </div>
                    <div style={{ fontSize: 11, color: '#444', marginTop: 2 }}>
                        Basement of Faazal Plaza, Dhulyan Chowk Dinga
                    </div>
                </div>
            </div>
        </div>
    );
}


// ─── Booking List Print ───────────────────────────────────────────────────────
function BookingListPrint({ bookings, dateFrom, dateTo }) {
    const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '—';
    const ITEM_STATUS_COLORS = { PENDING: '#f59e0b', READY: '#10b981', DELIVERED: '#059669', CANCELLED: '#ef4444' };
    const totalAmount = bookings.reduce((s, b) => s + parseFloat(b.totalAmount || 0), 0);
    const totalAdvance = bookings.reduce((s, b) => s + parseFloat(b.advanceAmount || 0), 0);
    const totalRemaining = bookings.reduce((s, b) => s + parseFloat(b.remainingAmount || 0), 0);

    return (
        <div style={{ fontFamily: 'Arial, sans-serif', color: '#000', width: '100%', boxSizing: 'border-box', fontSize: 11 }}>
            <PrintHeader />
            <div style={{ textAlign: 'center', margin: '8px 0', fontSize: 14, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#1a1a2e' }}>
                Booking List Report
            </div>
            {(dateFrom || dateTo) && (
                <div style={{ textAlign: 'center', fontSize: 11, color: '#555', marginBottom: 8 }}>
                    Period: {dateFrom ? fmt(dateFrom) : '—'} &nbsp;to&nbsp; {dateTo ? fmt(dateTo) : '—'}
                </div>
            )}
            <div style={{ textAlign: 'center', fontSize: 11, color: '#555', marginBottom: 10 }}>
                Total Bookings: <strong>{bookings.length}</strong>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                <thead>
                    <tr style={{ backgroundColor: '#1a1a2e', color: 'white' }}>
                        <th style={{ border: '1px solid #555', padding: '4px 6px', textAlign: 'left', width: 28 }}>#</th>
                        <th style={{ border: '1px solid #555', padding: '4px 6px', textAlign: 'left' }}>Customer</th>
                        <th style={{ border: '1px solid #555', padding: '4px 6px', textAlign: 'left', width: 60 }}>Date</th>
                        <th style={{ border: '1px solid #555', padding: '4px 6px', textAlign: 'left', width: 60 }}>Delivery</th>
                        <th style={{ border: '1px solid #555', padding: '4px 6px', textAlign: 'left' }}>Tailor</th>
                        <th style={{ border: '1px solid #555', padding: '4px 6px', textAlign: 'left' }}>Suits / Qty</th>
                    </tr>
                </thead>
                <tbody>
                    {bookings.map((booking, idx) => {
                        const tailorNames = (booking.staff || []).filter(s => s.role === 'TAILOR').map(s => s.customer?.name).join(', ');
                        const totalQty = (booking.items || []).reduce((s, i) => s + (i.quantity || 1), 0);
                        return (
                            <tr key={booking.id} style={{ backgroundColor: idx % 2 === 0 ? '#f9f9f9' : 'white' }}>
                                <td style={{ border: '1px solid #ddd', padding: '3px 6px', fontWeight: 700, color: '#7c3aed' }}>#{booking.id}</td>
                                <td style={{ border: '1px solid #ddd', padding: '3px 6px' }}>
                                    <div style={{ fontWeight: 700 }}>{booking.customer?.name}</div>
                                    {booking.customer?.phone && <div style={{ color: '#555' }}>{booking.customer.phone}</div>}
                                </td>
                                <td style={{ border: '1px solid #ddd', padding: '3px 6px' }}>{fmt(booking.bookingDate)}</td>
                                <td style={{ border: '1px solid #ddd', padding: '3px 6px' }}>{fmt(booking.deliveryDate)}</td>
                                <td style={{ border: '1px solid #ddd', padding: '3px 6px' }}>{tailorNames || '—'}</td>
                                <td style={{ border: '1px solid #ddd', padding: '3px 6px' }}>
                                    {(booking.items || []).length} suits / {totalQty} pcs
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
                <tfoot>
                    <tr style={{ backgroundColor: '#1a1a2e', color: 'white', fontWeight: 700 }}>
                        <td colSpan={6} style={{ border: '1px solid #555', padding: '4px 6px', textAlign: 'right' }}>TOTAL ({bookings.length} bookings)</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}

// ─── Customer Bill ────────────────────────────────────────────────────────────
function CustomerBill({ booking }) {
    if (!booking) return null;
    const billingCust = booking.billingCustomer || booking.customer;
    const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '—';

    const suitDetailLabel = {
        cuffType: 'Cuff Style',
        pohnchaType: 'Bottom Style',
        gheraType: 'Daman',
        galaType: 'Collar / Gala',
        pocketType: 'Pocket',
        shalwarType: 'Shalwar Type',
    };
    const suitDetailValue = (item) => {
        const rows = [];
        if (item.cuffType) rows.push(['Cuff', item.cuffType === 'single' ? 'Single' : item.cuffType === 'double folding' ? 'Double Folding' : 'Open Sleeve']);
        if (item.pohnchaType) rows.push(['Bottom', item.pohnchaType === 'saada' ? 'Simple' : item.pohnchaType === 'jaali' ? 'Net (Jaali)' : item.pohnchaType === 'karhaai' ? 'Embroidery' : 'Net + Embroidery']);
        if (item.gheraType) rows.push(['Daman', item.gheraType === 'seedha' ? 'Straight' : 'Round']);
        if (item.galaType) rows.push([`Collar`, `${item.galaType === 'ban' ? 'Ban' : 'Collar'}${item.galaSize ? ` (${item.galaSize}")` : ''}`]);
        if (item.pocketType) rows.push(['Pocket', item.pocketType === 'single' ? 'Single' : 'Double']);
        if (item.hasFrontPockets) rows.push(['Front Pockets', 'Yes']);
        if (item.hasShalwarPocket) rows.push(['Shalwar Pocket', 'Yes']);
        if (item.shalwarType) rows.push(['Shalwar', item.shalwarType === 'pajama' ? 'Pajama' : 'Shalwar']);
        if (item.itemNote) rows.push(['Note', item.itemNote]);
        return rows;
    };

    const tdStyle = { border: '1px solid #ccc', padding: '5px 8px', fontSize: 12 };
    const thStyle = { ...tdStyle, backgroundColor: '#1a1a2e', color: 'white', fontWeight: 700 };

    return (
        <div style={{ fontFamily: 'Arial, sans-serif', color: '#000', width: '100%', boxSizing: 'border-box' }}>
            <PrintHeader />

            {/* Title */}
            <div style={{ textAlign: 'center', margin: '8px 0', fontSize: 15, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#1a1a2e' }}>
                Customer Bill / Invoice
            </div>

            {/* Customer + Booking info row */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
                <tbody>
                    <tr>
                        <td style={{ border: '1px solid #ddd', padding: '8px 12px', verticalAlign: 'top', width: '50%' }}>
                            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#555', marginBottom: 4 }}>Customer Details</div>
                            <div style={{ fontSize: 13, fontWeight: 700 }}>{booking.customer?.name}</div>
                            {(booking.customer?.code || booking.customer?.id) && (
                                <div style={{ fontSize: 12, color: '#555' }}>ID: {booking.customer.code || booking.customer.id}</div>
                            )}
                            <div style={{ fontSize: 12 }}>Ph: {booking.customer?.phone || '—'}</div>
                            <div style={{ fontSize: 12 }}>{booking.customer?.address || '—'}</div>
                            {billingCust?.id !== booking.customer?.id && (
                                <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>Billing: {billingCust?.name}</div>
                            )}
                        </td>
                        <td style={{ border: '1px solid #ddd', padding: '8px 12px', verticalAlign: 'top', width: '50%' }}>
                            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#555', marginBottom: 4 }}>Booking Details</div>
                            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                                <tbody>
                                    <tr>
                                        <td style={{ fontSize: 12, fontWeight: 600, paddingBottom: 2, width: 80 }}>Bill No:</td>
                                        <td style={{ fontSize: 12, paddingBottom: 2 }}>#{booking.bookingNumber || booking.id}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ fontSize: 12, fontWeight: 600, paddingBottom: 2 }}>Date:</td>
                                        <td style={{ fontSize: 12, paddingBottom: 2 }}>{fmt(booking.bookingDate)}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ fontSize: 12, fontWeight: 600, paddingBottom: 2 }}>Delivery:</td>
                                        <td style={{ fontSize: 12, paddingBottom: 2 }}>{fmt(booking.deliveryDate)}</td>
                                    </tr>
                                    {booking.trialDate && (
                                        <tr>
                                            <td style={{ fontSize: 12, fontWeight: 600 }}>Trial:</td>
                                            <td style={{ fontSize: 12 }}>{fmt(booking.trialDate)}</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* Stitching Items Table */}
            {(() => {
                const stitchItems = (booking.items || []).filter(item => (item.selectedOptions || []).length > 0);
                const prodItems = (booking.items || []).filter(item => (item.selectedOptions || []).length === 0 && item.productId);
                return (
                    <>
                        {stitchItems.length > 0 && (
                            <>
                                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#555', marginBottom: 4 }}>Stitching Services</div>
                                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 8 }}>
                                    <thead>
                                        <tr>
                                            <th style={{ ...thStyle, width: 28, textAlign: 'center' }}>#</th>
                                            <th style={thStyle}>Description</th>
                                            <th style={{ ...thStyle, width: 36, textAlign: 'center' }}>Qty</th>
                                            <th style={{ ...thStyle, width: 80, textAlign: 'right' }}>Unit Price</th>
                                            <th style={{ ...thStyle, width: 80, textAlign: 'right' }}>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stitchItems.map((item, idx) => {
                                            const unitPr = item.quantity > 1 ? parseFloat(item.totalPrice) / item.quantity : parseFloat(item.totalPrice);
                                            return (
                                                <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#fafafa' : 'white' }}>
                                                    <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700 }}>{idx + 1}</td>
                                                    <td style={tdStyle}>
                                                        {item.product?.name && <span style={{ fontWeight: 700 }}>{item.product.name} — </span>}
                                                        {(item.selectedOptions || []).map(so => so.stitchingOption?.name).filter(Boolean).join(', ')}
                                                    </td>
                                                    <td style={{ ...tdStyle, textAlign: 'center' }}>{item.quantity || 1}</td>
                                                    <td style={{ ...tdStyle, textAlign: 'right' }}>Rs.{unitPr.toLocaleString()}</td>
                                                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>Rs.{parseFloat(item.totalPrice).toLocaleString()}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </>
                        )}
                        {prodItems.length > 0 && (
                            <>
                                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#555', marginBottom: 4, marginTop: stitchItems.length > 0 ? 8 : 0 }}>Products / Accessories</div>
                                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 8 }}>
                                    <thead>
                                        <tr>
                                            <th style={{ ...thStyle, width: 28, textAlign: 'center' }}>#</th>
                                            <th style={thStyle}>Product</th>
                                            <th style={{ ...thStyle, width: 36, textAlign: 'center' }}>Qty</th>
                                            <th style={{ ...thStyle, width: 80, textAlign: 'right' }}>Unit Price</th>
                                            <th style={{ ...thStyle, width: 60, textAlign: 'right' }}>Disc</th>
                                            <th style={{ ...thStyle, width: 80, textAlign: 'right' }}>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {prodItems.map((item, idx) => (
                                            <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#fafafa' : 'white' }}>
                                                <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700 }}>{idx + 1}</td>
                                                <td style={{ ...tdStyle, fontWeight: 700 }}>{item.product?.name || '—'}</td>
                                                <td style={{ ...tdStyle, textAlign: 'center' }}>{item.quantity || 1}</td>
                                                <td style={{ ...tdStyle, textAlign: 'right' }}>Rs.{parseFloat(item.unitPrice).toLocaleString()}</td>
                                                <td style={{ ...tdStyle, textAlign: 'right' }}>{parseFloat(item.discount) > 0 ? `Rs.${parseFloat(item.discount).toLocaleString()}` : '—'}</td>
                                                <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>Rs.{parseFloat(item.totalPrice).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </>
                        )}
                    </>
                );
            })()}

            {/* Suit Details — single string per suit row, right after items table */}
            {(booking.items || []).some(item => suitDetailValue(item).length > 0) && (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 8 }}>
                    <thead>
                        <tr>
                            <th style={{ ...thStyle, width: 28, textAlign: 'center' }}>#</th>
                            <th style={thStyle}>Suit Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(booking.items || []).map((item, idx) => {
                            const details = suitDetailValue(item);
                            if (details.length === 0) return null;
                            const detailStr = details.map(([label, val]) => `${label}: ${val}`).join('  |  ');
                            return (
                                <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#fafafa' : 'white' }}>
                                    <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700 }}>{idx + 1}</td>
                                    <td style={{ ...tdStyle, fontSize: 11 }}>{detailStr}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}

            {/* Totals */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                <table style={{ borderCollapse: 'collapse', width: '45%' }}>
                    <tbody>
                        <tr>
                            <td style={{ ...tdStyle, fontWeight: 600 }}>Total Amount</td>
                            <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>Rs.{parseFloat(booking.totalAmount).toLocaleString()}</td>
                        </tr>
                        <tr>
                            <td style={{ ...tdStyle, fontWeight: 600 }}>Advance Paid</td>
                            <td style={{ ...tdStyle, textAlign: 'right', color: '#059669', fontWeight: 700 }}>Rs.{parseFloat(booking.advanceAmount).toLocaleString()}</td>
                        </tr>
                        <tr style={{ backgroundColor: '#fff3f3' }}>
                            <td style={{ ...tdStyle, fontWeight: 700, fontSize: 13 }}>Balance Due</td>
                            <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 900, fontSize: 13, color: '#dc2626' }}>Rs.{parseFloat(booking.remainingAmount).toLocaleString()}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Booking note */}
            {booking.notes && (
                <div style={{ border: '1px dashed #aaa', borderRadius: 4, padding: '5px 10px', marginBottom: 10, fontSize: 12 }}>
                    <strong>Note:</strong> {booking.notes}
                </div>
            )}

        </div>
    );
}

// ─── Tailor Ticket ────────────────────────────────────────────────────────────
function TailorTicket({ booking, measurements }) {
    if (!booking) return null;
    const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '—';
    const tailors = (booking.staff || []).filter(s => s.role === 'TAILOR').map(s => s.customer?.name).join(', ');
    const cutters = (booking.staff || []).filter(s => s.role === 'CUTTER').map(s => s.customer?.name).join(', ');

    const cell = { border: '1px solid #000', padding: '8px 10px', fontSize: 15 };

    const getMeasureRows = (src) => [
        ['Lambai',   src?.qameez_lambai],
        ['Bazoo',    src?.bazoo],
        ['Teera',    src?.teera],
        ['Galla',    src?.galaa],
        ['Chatti',   src?.chaati],
        ['Kamar',    src?.kamar_around],
        ['Ghera',    src?.gheera],
        ['Shalwar',  src?.shalwar_lambai],
        ['Poncha',   src?.puhncha],
        ['Kaf',      src?.kaf],
        ['Kandha',   src?.kandha],
        ['Hip',      src?.hip_around],
        ['S. Ghera', src?.shalwar_gheera],
        ['Chaati A', src?.chaati_around],
    ];

    const getStitchingBoxes = (item) => {
        const boxes = [];
        if (item.galaType)     boxes.push(item.galaType === 'ban' ? `Gala: Ban${item.galaSize ? ` ${item.galaSize}"` : ''}` : `Gala: Collar${item.galaSize ? ` ${item.galaSize}"` : ''}`);
        if (item.cuffType)     boxes.push(item.cuffType === 'single' ? 'Cuff: Single' : item.cuffType === 'double folding' ? 'Cuff: Double' : 'Cuff: Open');
        if (item.pohnchaType)  boxes.push(`Poncha: ${item.pohnchaType === 'saada' ? 'Saada' : item.pohnchaType === 'jaali' ? 'Jaali' : item.pohnchaType === 'karhaai' ? 'Karhai' : 'J+K'}`);
        if (item.gheraType)    boxes.push(`Ghera: ${item.gheraType === 'seedha' ? 'Seedha' : 'Gol'}`);
        if (item.pocketType)   boxes.push(`Pocket: ${item.pocketType === 'single' ? 'Single' : 'Double'}`);
        if (item.shalwarType)  boxes.push(`Shalwar: ${item.shalwarType === 'pajama' ? 'Pajama' : 'Shalwar'}`);
        if (item.hasFrontPockets)  boxes.push('Front Pockets');
        if (item.hasShalwarPocket) boxes.push('Shalwar Pocket');
        (item.selectedOptions || []).forEach(so => { if (so.stitchingOption?.name) boxes.push(so.stitchingOption.name); });
        return boxes;
    };

    return (
        <div style={{ fontFamily: 'Arial, sans-serif', color: '#000', width: '100%', boxSizing: 'border-box' }}>
            <PrintHeader />

            {/* Title */}
            <div style={{ textAlign: 'center', margin: '6px 0', fontSize: 14, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: '#1a1a2e' }}>
                Tailor Order Ticket &nbsp;|&nbsp; بکنگ پرچی
            </div>

            {/* Info bar */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 8, fontSize: 15, border: '1px solid #000' }}>
                <tbody>
                    <tr>
                        <td style={{ ...cell, fontWeight: 700, width: '15%' }}>Customer:</td>
                        <td style={{ ...cell, fontWeight: 700, width: '25%', fontSize: 13 }}>{booking.customer?.name}</td>
                        <td style={{ ...cell, fontWeight: 700, width: '12%' }}>Booking #:</td>
                        <td style={{ ...cell, width: '18%', fontWeight: 800, color: '#1a1a2e' }}>{booking.bookingNumber || booking.id}</td>
                        <td style={{ ...cell, fontWeight: 700, width: '10%' }}>Date:</td>
                        <td style={{ ...cell, width: '20%' }}>{fmt(booking.bookingDate)}</td>
                    </tr>
                    <tr>
                        <td style={{ ...cell, fontWeight: 700 }}>Tailor:</td>
                        <td style={{ ...cell }}>{tailors || '—'}</td>
                        <td style={{ ...cell, fontWeight: 700 }}>Cutter:</td>
                        <td style={{ ...cell }}>{cutters || '—'}</td>
                        <td style={{ ...cell, fontWeight: 700 }}>Delivery:</td>
                        <td style={{ ...cell }}>{fmt(booking.deliveryDate)}</td>
                    </tr>
                </tbody>
            </table>

            {/* Per-suit block */}
            {(booking.items || []).map((item, idx) => {
                const hasItemMeasure = item.qameez_lambai || item.bazoo || item.teera || item.galaa || item.chaati;
                const src = hasItemMeasure ? item : measurements;
                const measureRows = getMeasureRows(src);
                const stitchBoxes = getStitchingBoxes(item);
                // pad stitching boxes to at least 8 rows so the column has height
                const STITCH_ROWS = Math.max(stitchBoxes.length, 8);

                return (
                    <div key={idx} style={{ border: '1px solid #000', marginBottom: 10, pageBreakInside: 'avoid', breakInside: 'avoid' }}>

                        {/* Suit header row */}
                        <div style={{ backgroundColor: '#1a1a2e', color: '#fff', padding: '3px 8px', fontWeight: 700, fontSize: 12, display: 'flex', justifyContent: 'space-between' }}>
                            <span>Suit {idx + 1}{item.product?.name ? ` — ${item.product.name}` : ''}</span>
                            <span>Qty: {item.quantity || 1}</span>
                        </div>

                        {/* 3-column body */}
                        <div style={{ display: 'flex', alignItems: 'stretch' }}>

                            {/* ── Measurements column ── */}
                            <div style={{ flex: '0 0 42%', borderRight: '1px solid #000' }}>
                                <div style={{ backgroundColor: '#f0f0f0', padding: '4px 8px', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #000' }}>
                                    Measurements — پیمائش
                                </div>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <tbody>
                                        {measureRows.map(([label, val], i) => (
                                            <tr key={i}>
                                                <td style={{ padding: '8px 10px', fontSize: 15, fontWeight: 600, borderBottom: '1px solid #ddd', width: '45%', whiteSpace: 'nowrap' }}>
                                                    {label}:
                                                </td>
                                                <td style={{ padding: '8px 8px', fontSize: 15, borderBottom: '1px solid #ddd', borderLeft: '1px solid #000' }}>
                                                    <span style={{
                                                        display: 'inline-block',
                                                        minWidth: 60,
                                                        fontWeight: 700,
                                                        textDecoration: val ? 'underline' : 'none',
                                                        textDecorationStyle: 'solid',
                                                    }}>
                                                        {val || ''}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* ── Stitching options column ── */}
                            <div style={{ flex: '0 0 30%', borderRight: '1px solid #000' }}>
                                <div style={{ backgroundColor: '#f0f0f0', padding: '4px 8px', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #000' }}>
                                    Stitching Details
                                </div>
                                {Array.from({ length: STITCH_ROWS }, (_, i) => (
                                    <div key={i} style={{
                                        border: '1px solid #000',
                                        margin: '4px 5px',
                                        padding: '8px 9px',
                                        fontSize: 15,
                                        minHeight: 36,
                                        fontWeight: stitchBoxes[i] ? 600 : 400,
                                    }}>
                                        {stitchBoxes[i] || ''}
                                    </div>
                                ))}
                            </div>

                            {/* ── Notes column ── */}
                            <div style={{ flex: 1 }}>
                                <div style={{ backgroundColor: '#f0f0f0', padding: '4px 8px', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #000' }}>
                                    Notes
                                </div>
                                <div style={{
                                    border: '1px solid #000',
                                    margin: '5px',
                                    padding: '8px 10px',
                                    fontSize: 15,
                                    minHeight: 120,
                                    fontWeight: 600,
                                    lineHeight: 1.6,
                                    whiteSpace: 'pre-wrap',
                                }}>
                                    {item.itemNote || ''}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* Booking-level note */}
            {booking.notes && (
                <div style={{ border: '1px solid #000', padding: '4px 8px', fontSize: 11, marginTop: 4 }}>
                    <strong>Order Note:</strong> {booking.notes}
                </div>
            )}
        </div>
    );
}

export default function BookingManagementClient({ initialBookings, customers, products, employees, stitchingOptions: initialStitchingOptions }) {
    const stitchingOptions = initialStitchingOptions || [];
    const [bookings, setBookings] = useState(Array.isArray(initialBookings) ? initialBookings : []);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterCustomerId, setFilterCustomerId] = useState(null);
    const [filterDateFrom, setFilterDateFrom] = useState("");
    const [filterDateTo, setFilterDateTo] = useState("");
    const [filterDeliveryFrom, setFilterDeliveryFrom] = useState("");
    const [filterDeliveryTo, setFilterDeliveryTo] = useState("");
    const [filterItemStatus, setFilterItemStatus] = useState("");
    const [filterMeasurementNo, setFilterMeasurementNo] = useState("");
    const [sortBy, setSortBy] = useState("bookingDate_desc");
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    // View Modal State
    const [viewOpen, setViewOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [editingBookingId, setEditingBookingId] = useState(null);
    const [printBooking, setPrintBooking] = useState(null);
    const [printType, setPrintType] = useState("BILL"); // 'BILL' or 'STITCHING'
    const [printDialogOpen, setPrintDialogOpen] = useState(false);
    const [customerMeasurements, setCustomerMeasurements] = useState(null);
    const [tempPrintBooking, setTempPrintBooking] = useState(null);

    // Bulk select state
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [isBulkPrint, setIsBulkPrint] = useState(false);
    const [bulkPrintBookings, setBulkPrintBookings] = useState([]);

    // List print state
    const [printListBookings, setPrintListBookings] = useState([]);

    const handlePrintList = () => {
        const prev = document.title;
        document.title = '';
        setPrintListBookings([]);
        setTimeout(() => {
            setPrintListBookings(filteredBookings);
            setTimeout(() => {
                window.print();
                document.title = prev;
                setTimeout(() => setPrintListBookings([]), 1000);
            }, 400);
        }, 50);
    };

    // Inline staff edit state
    const [staffEditOpen, setStaffEditOpen] = useState(false);
    const [staffEditBooking, setStaffEditBooking] = useState(null);
    const [staffEditTailorIds, setStaffEditTailorIds] = useState([]);
    const [staffEditCutterIds, setStaffEditCutterIds] = useState([]);

    const triggerPrint = React.useCallback(() => {
        const prev = document.title;
        document.title = '';
        setTimeout(() => {
            window.print();
            document.title = prev;
        }, 500);
    }, []);

    // Effect to trigger print when printBooking is set
    React.useEffect(() => {
        if (printBooking) {
            const timer = setTimeout(() => triggerPrint(), 400);
            return () => clearTimeout(timer);
        }
    }, [printBooking, triggerPrint]);

    // Measurement field keys shared between cart items and measurement records
    const MEASUREMENT_KEYS = [
        "qameez_lambai", "bazoo", "teera", "galaa", "chaati",
        "gheera", "kaf", "kandha", "chaati_around", "kamar_around",
        "hip_around", "shalwar_lambai", "puhncha", "shalwar_gheera",
    ];

    const applyMeasurementToItem = (item, measurement) => ({
        ...item,
        ...Object.fromEntries(MEASUREMENT_KEYS.map(k => [k, measurement?.[k] ?? item[k] ?? ""])),
    });

    // Fetch measurements when needed; returns the record for immediate use
    const fetchMeasurements = async (customerId) => {
        try {
            const res = await fetch(`/api/measurements?customerId=${customerId}`);
            if (res.ok) {
                const data = await res.json();
                const measurement = data.length > 0 ? data[0] : null;
                setCustomerMeasurements(measurement);
                return measurement;
            }
        } catch (error) {
            console.error("Failed to fetch measurements", error);
        }
        return null;
    };

    const handlePrintClick = (booking) => {
        setTempPrintBooking(booking);
        setPrintDialogOpen(true);
    };

    const handlePrintConfirm = async (type) => {
        setPrintDialogOpen(false);

        // Always reset first so useEffect fires even for the same booking
        setPrintBooking(null);
        setBulkPrintBookings([]);

        if (isBulkPrint) {
            const selected = filteredBookings.filter(b => selectedIds.has(b.id));
            setIsBulkPrint(false);
            setPrintType(type);
            setTimeout(() => {
                setBulkPrintBookings(selected);
                setTimeout(() => triggerPrint(), 300);
            }, 50);
            return;
        }

        if (type === 'STITCHING' && tempPrintBooking?.customerId) {
            await fetchMeasurements(tempPrintBooking.customerId);
        }

        setPrintType(type);
        setTimeout(() => {
            setPrintBooking(tempPrintBooking);
        }, 50);
    };


    // Form data
    const [formData, setFormData] = useState({
        customerId: "",
        customerCode: "",
        customerName: "",
        customerAddress: "",
        customerPhone: "",
        billingCustomerId: "",
        sameBilling: true,
        bookingType: "STITCHING",
        bookingDate: "",
        returnDate: "",
        deliveryDate: "",
        trialDate: "",
        tailorIds: [],
        cutterIds: [],
        advanceAmount: "",
        notes: ""
    });

    // Set today's date client-side only to avoid SSR hydration mismatch
    React.useEffect(() => {
        setFormData(prev => ({
            ...prev,
            bookingDate: new Date().toISOString().split('T')[0]
        }));
    }, []);

    // Cart items for the grid
    const [cartItems, setCartItems] = useState([
        {
            selectedOptionIds: [], unitPrice: 0, quantity: 1, totalPrice: 0,
            bookingType: "STITCHING",
            isStitching: true,
            itemStatus: "PENDING", itemNote: "",
            cuffType: "", pohnchaType: "", gheraType: "", galaType: "", galaSize: "",
            pocketType: "", shalwarType: "", hasShalwarPocket: false, hasFrontPockets: false,
            qameez_lambai: "", bazoo: "", teera: "", galaa: "", chaati: "",
            gheera: "", kaf: "", kandha: "", chaati_around: "", kamar_around: "",
            hip_around: "", shalwar_lambai: "", puhncha: "", shalwar_gheera: "",
        }
    ]);

    // Store previous stitching details for reuse
    const [previousStitchingDetails, setPreviousStitchingDetails] = useState(null);

    // Product items added to the bill (non-stitching)
    const [productItems, setProductItems] = useState([]);

    // Barcode scanner for product items
    const [scanCode, setScanCode] = useState("");
    const [scanStatus, setScanStatus] = useState(null);
    const scanRef = useRef(null);


    // Filter staff customers by accountCategory name (case-insensitive)
    const tailors = (employees || []).filter(e => e.accountCategory?.name?.toLowerCase() === "tailor");
    const cutters = (employees || []).filter(e => e.accountCategory?.name?.toLowerCase() === "cutter");

    const handleCustomerChange = async (customerId) => {
        const customer = (customers || []).find(c => c.id === parseInt(customerId));
        if (customer) {
            setFormData(prev => ({
                ...prev,
                customerId: customer.id,
                customerCode: customer.code || "",
                customerName: customer.name,
                customerAddress: customer.address || "",
                customerPhone: customer.phone || ""
            }));
            // Fetch saved measurements and pre-fill any stitching cart items
            const measurement = await fetchMeasurements(customer.id);
            if (measurement) {
                setCartItems(prev => prev.map(item =>
                    item.isStitching ? applyMeasurementToItem(item, measurement) : item
                ));
            }
        }
    };

    const handleProductChange = (index, productId) => {
        const newItems = [...cartItems];
        if (!productId) {
            newItems[index] = { ...newItems[index], productId: "", productName: "" };
            setCartItems(newItems);
            return;
        }
        const product = (products || []).find(p => p.id === parseInt(productId));
        if (product) {
            const baseItem = {
                ...newItems[index],
                productId: product.id,
                productName: product.name,
                bookingType: "STITCHING",
                isStitching: true,
                isCollapsed: false,
            };
            newItems[index] = customerMeasurements
                ? applyMeasurementToItem(baseItem, customerMeasurements)
                : baseItem;
            setCartItems(newItems);
        }
    };

    const calculateItemTotal = (item, opts) => {
        const options = opts || stitchingOptions;
        const unitPrice = (item.selectedOptionIds || []).reduce((sum, id) => {
            const opt = options.find(o => o.id === id);
            return sum + (opt ? parseFloat(opt.price) : 0);
        }, 0);
        return unitPrice * (parseInt(item.quantity) || 1);
    };

    const calculateUnitPrice = (item, opts) => {
        const options = opts || stitchingOptions;
        return (item.selectedOptionIds || []).reduce((sum, id) => {
            const opt = options.find(o => o.id === id);
            return sum + (opt ? parseFloat(opt.price) : 0);
        }, 0);
    };

    const handleToggleStitchingOption = (itemIndex, optionId) => {
        const newItems = [...cartItems];
        const item = newItems[itemIndex];
        const ids = item.selectedOptionIds || [];
        const exists = ids.includes(optionId);
        item.selectedOptionIds = exists ? ids.filter(id => id !== optionId) : [...ids, optionId];
        item.unitPrice = calculateUnitPrice(item, stitchingOptions);
        item.totalPrice = item.unitPrice * (parseInt(item.quantity) || 1);
        setCartItems(newItems);
    };

    const handleQuantityChange = (itemIndex, qty) => {
        const newItems = [...cartItems];
        const item = newItems[itemIndex];
        item.quantity = Math.max(1, parseInt(qty) || 1);
        item.totalPrice = calculateUnitPrice(item, stitchingOptions) * item.quantity;
        setCartItems(newItems);
    };

    const handleAddRow = () => {
        const newId = cartItems.length > 0 ? Math.max(...cartItems.map(i => i.id || 0)) + 1 : 1;
        setCartItems([
            ...cartItems,
            {
                id: newId,
                productId: "", productName: "",
                selectedOptionIds: [], unitPrice: 0, quantity: 1, totalPrice: 0,
                bookingType: "STITCHING", isStitching: true, isCollapsed: false,
                itemStatus: "PENDING", itemNote: "",
                cuffType: "", pohnchaType: "", gheraType: "", galaType: "", galaSize: "",
                pocketType: "", shalwarType: "", hasShalwarPocket: false, hasFrontPockets: false,
                qameez_lambai: "", bazoo: "", teera: "", galaa: "", chaati: "",
                gheera: "", kaf: "", kandha: "", chaati_around: "", kamar_around: "",
                hip_around: "", shalwar_lambai: "", puhncha: "", shalwar_gheera: "",
            }
        ]);
    };

    const handleRemoveRow = (index) => {
        if (cartItems.length > 1) {
            setCartItems(cartItems.filter((_, i) => i !== index));
        }
    };

    const handleAddProductItem = () => {
        setProductItems(prev => [...prev, { id: Date.now(), productId: null, productName: "", quantity: 1, unitPrice: 0, discount: 0, totalPrice: 0 }]);
    };

    const addProductToItems = (product) => {
        setProductItems(prev => {
            const existing = prev.find(i => i.productId === product.id);
            if (existing) {
                return prev.map(i => {
                    if (i.productId !== product.id) return i;
                    const qty = i.quantity + 1;
                    return { ...i, quantity: qty, totalPrice: qty * parseFloat(i.unitPrice) * (1 - parseFloat(i.discount || 0) / 100) };
                });
            }
            const price = parseFloat(product.unitPrice || 0);
            return [...prev, { id: Date.now(), productId: product.id, productName: product.name, quantity: 1, unitPrice: price, discount: 0, totalPrice: price }];
        });
        setScanStatus({ type: "success", msg: `Added: ${product.name}` });
        setTimeout(() => setScanStatus(null), 2500);
    };

    const handleBookingScan = (raw) => {
        const code = (raw || "").trim();
        if (!code) return;
        const q = code.toLowerCase();
        const product = (products || []).find(p =>
            (p.sku || "").toLowerCase() === q ||
            (p.barcode || "").toLowerCase() === q
        );
        setScanCode("");
        if (product) {
            addProductToItems(product);
        } else {
            setScanStatus({ type: "error", msg: `No product found for "${code}"` });
            setTimeout(() => setScanStatus(null), 2500);
        }
        setTimeout(() => scanRef.current?.focus(), 50);
    };

    const handleRemoveProductItem = (index) => {
        setProductItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleProductSelect = (index, product) => {
        setProductItems(prev => {
            const next = [...prev];
            if (!product) {
                next[index] = { ...next[index], productId: null, productName: "", unitPrice: 0, totalPrice: 0 };
            } else {
                const qty = parseFloat(next[index].quantity) || 1;
                const price = parseFloat(product.unitPrice || 0);
                const disc = parseFloat(next[index].discount) || 0;
                next[index] = { ...next[index], productId: product.id, productName: product.name, unitPrice: price, totalPrice: Math.max(0, qty * price - disc) };
            }
            return next;
        });
    };

    const handleProductItemChange = (index, field, value) => {
        setProductItems(prev => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            const qty = parseFloat(field === 'quantity' ? value : next[index].quantity) || 1;
            const price = parseFloat(field === 'unitPrice' ? value : next[index].unitPrice) || 0;
            const disc = parseFloat(field === 'discount' ? value : next[index].discount) || 0;
            next[index].totalPrice = Math.max(0, qty * price - disc);
            return next;
        });
    };

    const stitchingTotal = cartItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    const productTotal = productItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    const totalAmount = stitchingTotal + productTotal;
    const advanceAmount = parseFloat(formData.advanceAmount) || 0;
    const balanceAmount = totalAmount - advanceAmount;

    const handleSubmit = async () => {
        setLoading(true);
        setError("");

        const validItems = cartItems.filter(item => (item.selectedOptionIds || []).length > 0);
        const validProductItems = productItems.filter(p => p.productId);

        if (!formData.customerId) {
            setError("Please select a customer");
            setLoading(false);
            return;
        }

        if (validItems.length === 0 && validProductItems.length === 0) {
            setError("Please select at least one stitching option or add a product");
            setLoading(false);
            return;
        }

        try {
            const payload = {
                customerId: formData.customerId,
                billingCustomerId: (!formData.sameBilling && formData.billingCustomerId) ? formData.billingCustomerId : null,
                bookingType: formData.bookingType,
                bookingDate: formData.bookingDate,
                returnDate: formData.returnDate || null,
                deliveryDate: formData.deliveryDate || null,
                trialDate: formData.trialDate || null,
                tailorIds: formData.tailorIds || [],
                cutterIds: formData.cutterIds || [],
                totalAmount,
                advanceAmount,
                remainingAmount: balanceAmount,
                notes: formData.notes,
                items: [
                    ...validItems.map(item => ({
                        productId: item.productId || null,
                        quantity: parseInt(item.quantity) || 1,
                        unitPrice: item.unitPrice || 0,
                        discount: 0,
                        totalPrice: item.totalPrice,
                        selectedOptionIds: item.selectedOptionIds || [],
                        itemStatus: item.itemStatus || "PENDING",
                        itemNote: item.itemNote || null,
                        cuffType: item.cuffType,
                        pohnchaType: item.pohnchaType,
                        gheraType: item.gheraType,
                        galaType: item.galaType,
                        galaSize: item.galaSize,
                        pocketType: item.pocketType,
                        shalwarType: item.shalwarType,
                        hasShalwarPocket: item.hasShalwarPocket,
                        hasFrontPockets: item.hasFrontPockets,
                        qameez_lambai: item.qameez_lambai,
                        bazoo: item.bazoo,
                        teera: item.teera,
                        galaa: item.galaa,
                        chaati: item.chaati,
                        gheera: item.gheera,
                        kaf: item.kaf,
                        kandha: item.kandha,
                        chaati_around: item.chaati_around,
                        kamar_around: item.kamar_around,
                        hip_around: item.hip_around,
                        shalwar_lambai: item.shalwar_lambai,
                        puhncha: item.puhncha,
                        shalwar_gheera: item.shalwar_gheera,
                    })),
                    ...validProductItems.map(item => ({
                        productId: item.productId,
                        quantity: parseInt(item.quantity) || 1,
                        unitPrice: parseFloat(item.unitPrice) || 0,
                        discount: parseFloat(item.discount) || 0,
                        totalPrice: parseFloat(item.totalPrice) || 0,
                        selectedOptionIds: [],
                    })),
                ]
            };

            const isEdit = !!editingBookingId;
            const response = await fetch("/api/bookings", {
                method: isEdit ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(isEdit ? { id: editingBookingId, ...payload } : payload),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || (isEdit ? "Failed to update booking" : "Failed to create booking"));
            }

            const refreshRes = await fetch("/api/bookings");
            const refreshed = await refreshRes.json();
            setBookings(Array.isArray(refreshed) ? refreshed : []);

            setSuccessMessage(isEdit ? "Booking updated successfully!" : "Booking created successfully!");
            setShowForm(false);
            resetForm();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (booking) => {
        setEditingBookingId(booking.id);
        setFormData({
            customerId: booking.customerId || "",
            customerCode: booking.customer?.code || "",
            customerName: booking.customer?.name || "",
            customerAddress: booking.customer?.address || "",
            customerPhone: booking.customer?.phone || "",
            billingCustomerId: booking.billingCustomerId || "",
            sameBilling: !booking.billingCustomerId,
            bookingType: booking.bookingType || "STITCHING",
            bookingDate: booking.bookingDate ? booking.bookingDate.slice(0, 10) : "",
            returnDate: booking.returnDate ? booking.returnDate.slice(0, 10) : "",
            deliveryDate: booking.deliveryDate ? booking.deliveryDate.slice(0, 10) : "",
            trialDate: booking.trialDate ? booking.trialDate.slice(0, 10) : "",
            tailorIds: (booking.staff || []).filter(s => s.role === 'TAILOR').map(s => s.customerId),
            cutterIds: (booking.staff || []).filter(s => s.role === 'CUTTER').map(s => s.customerId),
            advanceAmount: booking.advanceAmount ? String(parseFloat(booking.advanceAmount)) : "",
            notes: booking.notes || "",
        });
        const stitchingBookingItems = (booking.items || []).filter(item => (item.selectedOptions || []).length > 0);
        const productBookingItems = (booking.items || []).filter(item => (item.selectedOptions || []).length === 0 && item.productId);
        setCartItems(stitchingBookingItems.length > 0 ? stitchingBookingItems.map((item, i) => ({
            id: i + 1,
            productId: item.productId || "",
            productName: item.product?.name || "",
            selectedOptionIds: (item.selectedOptions || []).map(so => so.stitchingOptionId),
            unitPrice: parseFloat(item.unitPrice) || 0,
            quantity: item.quantity || 1,
            totalPrice: parseFloat(item.totalPrice) || 0,
            bookingType: booking.bookingType || "STITCHING",
            isStitching: true,
            isCollapsed: true,
            itemStatus: item.itemStatus || "PENDING",
            itemNote: item.itemNote || "",
            cuffType: item.cuffType || "",
            pohnchaType: item.pohnchaType || "",
            gheraType: item.gheraType || "",
            galaType: item.galaType || "",
            galaSize: item.galaSize || "",
            pocketType: item.pocketType || "",
            shalwarType: item.shalwarType || "",
            hasShalwarPocket: item.hasShalwarPocket || false,
            hasFrontPockets: item.hasFrontPockets || false,
            qameez_lambai: item.qameez_lambai || "",
            bazoo: item.bazoo || "",
            teera: item.teera || "",
            galaa: item.galaa || "",
            chaati: item.chaati || "",
            gheera: item.gheera || "",
            kaf: item.kaf || "",
            kandha: item.kandha || "",
            chaati_around: item.chaati_around || "",
            kamar_around: item.kamar_around || "",
            hip_around: item.hip_around || "",
            shalwar_lambai: item.shalwar_lambai || "",
            puhncha: item.puhncha || "",
            shalwar_gheera: item.shalwar_gheera || "",
        })) : [{
            id: 1, productId: "", productName: "",
            selectedOptionIds: [], unitPrice: 0, quantity: 1, totalPrice: 0,
            bookingType: "STITCHING", isStitching: true, isCollapsed: false,
            itemStatus: "PENDING", itemNote: "",
            cuffType: "", pohnchaType: "", gheraType: "", galaType: "", galaSize: "",
            pocketType: "", shalwarType: "", hasShalwarPocket: false, hasFrontPockets: false,
            qameez_lambai: "", bazoo: "", teera: "", galaa: "", chaati: "",
            gheera: "", kaf: "", kandha: "", chaati_around: "", kamar_around: "",
            hip_around: "", shalwar_lambai: "", puhncha: "", shalwar_gheera: "",
        }]);
        setProductItems(productBookingItems.map((item, i) => ({
            id: i + 1,
            productId: item.productId,
            productName: item.product?.name || "",
            quantity: item.quantity || 1,
            unitPrice: parseFloat(item.unitPrice) || 0,
            discount: parseFloat(item.discount) || 0,
            totalPrice: parseFloat(item.totalPrice) || 0,
        })));
        setShowForm(true);
    };

    const resetForm = () => {
        setEditingBookingId(null);
        setFormData({
            customerId: "",
            customerCode: "",
            customerName: "",
            customerAddress: "",
            customerPhone: "",
            billingCustomerId: "",
            sameBilling: true,
            bookingType: "STITCHING",
            bookingDate: new Date().toISOString().split('T')[0],
            returnDate: "",
            deliveryDate: "",
            trialDate: "",
            tailorIds: [],
            cutterIds: [],
            advanceAmount: "",
            notes: "",
            // Stitching Details
            cuffType: "",
            pohnchaType: "",
            gheraType: "",
            galaType: "",
            galaSize: "",
            pocketType: "",
            shalwarType: "",
            hasShalwarPocket: false,
            hasFrontPockets: false
        });
        setCartItems([
            {
                id: 1, productId: "", productName: "",
                selectedOptionIds: [], unitPrice: 0, quantity: 1, totalPrice: 0,
                bookingType: "STITCHING", isStitching: true, isCollapsed: false,
                itemStatus: "PENDING", itemNote: "",
                cuffType: "", pohnchaType: "", gheraType: "", galaType: "", galaSize: "",
                pocketType: "", shalwarType: "", hasShalwarPocket: false, hasFrontPockets: false,
                qameez_lambai: "", bazoo: "", teera: "", galaa: "", chaati: "",
                gheera: "", kaf: "", kandha: "", chaati_around: "", kamar_around: "",
                hip_around: "", shalwar_lambai: "", puhncha: "", shalwar_gheera: "",
            }
        ]);
        setProductItems([]);
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this booking?")) return;

        try {
            const response = await fetch(`/api/bookings?id=${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to delete");
            }

            setBookings(prev => prev.filter(b => b.id !== id));
            setSuccessMessage("Booking deleted successfully!");
        } catch (err) {
            alert(err.message);
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            const response = await fetch("/api/bookings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, status: newStatus }),
            });

            if (!response.ok) {
                throw new Error("Failed to update status");
            }

            const refreshRes = await fetch("/api/bookings");
            const refreshed = await refreshRes.json();
            setBookings(Array.isArray(refreshed) ? refreshed : []);

            setSuccessMessage("Status updated successfully!");
        } catch (err) {
            alert(err.message);
        }
    };

    const handleViewBooking = (booking) => {
        setSelectedBooking(booking);
        setViewOpen(true);
    };

    const handleOpenStaffEdit = (booking) => {
        setStaffEditBooking(booking);
        const tailors = (booking.staff || []).filter(s => s.role === "TAILOR").map(s => s.customer);
        const cutters = (booking.staff || []).filter(s => s.role === "CUTTER").map(s => s.customer);
        setStaffEditTailorIds(tailors);
        setStaffEditCutterIds(cutters);
        setStaffEditOpen(true);
    };

    const handleStaffEditSave = async () => {
        if (!staffEditBooking) return;
        try {
            const response = await fetch("/api/bookings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: staffEditBooking.id,
                    tailorIds: staffEditTailorIds.map(e => e.id),
                    cutterIds: staffEditCutterIds.map(e => e.id),
                }),
            });
            if (!response.ok) throw new Error("Failed to update staff");
            const refreshRes = await fetch("/api/bookings");
            const refreshed = await refreshRes.json();
            setBookings(Array.isArray(refreshed) ? refreshed : []);
            setStaffEditOpen(false);
            setSuccessMessage("Staff updated successfully!");
        } catch (err) {
            alert(err.message);
        }
    };

    const handleBulkPrintClick = () => {
        if (selectedIds.size === 0) return;
        setIsBulkPrint(true);
        setTempPrintBooking(null);
        setPrintDialogOpen(true);
    };

    const handleToggleSelect = (id) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const handleSelectAll = (checked) => {
        if (checked) setSelectedIds(new Set(filteredBookings.map(b => b.id)));
        else setSelectedIds(new Set());
    };

    const filteredBookings = (bookings || []).filter(b => {
        const q = (searchQuery || "").toLowerCase();
        const matchesSearch = !q ||
            (b.customer?.name || "").toLowerCase().includes(q) ||
            (b.customer?.phone || "").toLowerCase().includes(q) ||
            (b.customer?.address || "").toLowerCase().includes(q) ||
            (b.customer?.measurementNo || "").toLowerCase().includes(q) ||
            (b.id || "").toString().includes(q) ||
            (b.bookingNumber || "").toLowerCase().includes(q);

        const matchesCustomer = !filterCustomerId || b.customerId === filterCustomerId;

        const bDate = b.bookingDate ? b.bookingDate.slice(0, 10) : "";
        const matchesFrom = !filterDateFrom || bDate >= filterDateFrom;
        const matchesTo   = !filterDateTo   || bDate <= filterDateTo;

        const dDate = b.deliveryDate ? b.deliveryDate.slice(0, 10) : "";
        const matchesDeliveryFrom = !filterDeliveryFrom || dDate >= filterDeliveryFrom;
        const matchesDeliveryTo   = !filterDeliveryTo   || dDate <= filterDeliveryTo;

        const matchesItemStatus = !filterItemStatus ||
            (b.items || []).some(item => (item.itemStatus || "PENDING") === filterItemStatus);

        const matchesMeasurementNo = !filterMeasurementNo ||
            (b.customer?.measurementNo || "").toLowerCase().includes(filterMeasurementNo.toLowerCase());

        return matchesSearch && matchesCustomer && matchesFrom && matchesTo && matchesDeliveryFrom && matchesDeliveryTo && matchesItemStatus && matchesMeasurementNo;
    }).sort((a, b) => {
        if (sortBy === "bookingNo_asc") {
            return (parseInt(a.bookingNumber) || a.id) - (parseInt(b.bookingNumber) || b.id);
        }
        if (sortBy === "bookingNo_desc") {
            return (parseInt(b.bookingNumber) || b.id) - (parseInt(a.bookingNumber) || a.id);
        }
        if (sortBy === "deliveryDate_desc") {
            const da = a.deliveryDate ? new Date(a.deliveryDate) : null;
            const db = b.deliveryDate ? new Date(b.deliveryDate) : null;
            if (!da && !db) return 0;
            if (!da) return 1;
            if (!db) return -1;
            return db - da;
        }
        if (sortBy === "deliveryDate_asc") {
            const da = a.deliveryDate ? new Date(a.deliveryDate) : null;
            const db = b.deliveryDate ? new Date(b.deliveryDate) : null;
            if (!da && !db) return 0;
            if (!da) return 1;
            if (!db) return -1;
            return da - db;
        }
        // default: bookingDate_desc
        const da = a.bookingDate ? new Date(a.bookingDate) : new Date(0);
        const db = b.bookingDate ? new Date(b.bookingDate) : new Date(0);
        return db - da;
    });

    const filteredSuitCount = filteredBookings.reduce((sum, b) =>
        sum + (b.items || []).filter(i => !i.productId).reduce((s, i) => s + (parseInt(i.quantity) || 1), 0), 0);

    const getStatusColor = (status) => {
        const statusObj = BOOKING_STATUSES.find(s => s.value === status);
        return statusObj?.color || "#6b7280";
    };

    // --- replaced full-page form with Dialog below ---
    const FIELD_SX = {
        '& .MuiOutlinedInput-root': {
            bgcolor: 'white',
            borderRadius: 2,
            '& fieldset': { borderColor: '#e5e7eb' },
            '&:hover fieldset': { borderColor: '#8b5cf6' },
            '&.Mui-focused fieldset': { borderColor: '#8b5cf6', borderWidth: 2 },
        }
    };
    const DISABLED_SX = { '& .MuiOutlinedInput-root': { bgcolor: '#f3f4f6', borderRadius: 2 } };

    const formDialog = (
        <Dialog
            open={showForm}
            onClose={() => !loading && setShowForm(false)}
            maxWidth="xl"
            fullWidth
            PaperProps={{ sx: { borderRadius: 3, maxHeight: '95vh' } }}
        >
            <DialogTitle sx={{
                fontWeight: 700, borderBottom: '1px solid', borderColor: 'divider', pt: 2.5, pb: 2,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'linear-gradient(135deg, #f8fafc 0%, #f0f4ff 100%)'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ p: 1, bgcolor: '#8b5cf6', borderRadius: 1.5, display: 'flex' }}>
                        <ShoppingCart size={18} color="white" />
                    </Box>
                    <Typography variant="h6" fontWeight={700}>{editingBookingId ? `Edit Booking #${editingBookingId}` : 'Sales Order / Booking'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="outlined" color="inherit" startIcon={<XIcon size={16} />} onClick={() => { setShowForm(false); resetForm(); }} disabled={loading}
                        sx={{ borderRadius: 2, textTransform: 'none', borderColor: '#d1d5db', color: '#374151' }}>Cancel</Button>
                    <Button variant="contained" startIcon={<Save size={16} />} onClick={handleSubmit} disabled={loading}
                        sx={{ borderRadius: 2, textTransform: 'none', bgcolor: '#8b5cf6', '&:hover': { bgcolor: '#7c3aed' } }}>
                        {loading ? <CircularProgress size={18} color="inherit" /> : (editingBookingId ? 'Update Booking' : 'Save Booking')}
                    </Button>
                </Box>
            </DialogTitle>
            <DialogContent sx={{ p: 3, pt: '24px !important' }}>
                {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

                <Box>
                    {/* ── Row 1: 4 equal header fields ── */}
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid size={{ xs: 6, md: 3 }}>
                            <TextField fullWidth size="small" label="Serial Number" value="Auto Generated" disabled sx={DISABLED_SX} />
                        </Grid>
                        <Grid size={{ xs: 6, md: 3 }}>
                            <TextField fullWidth size="small" label="Booking Date" type="date" name="bookingDate" required
                                value={formData.bookingDate}
                                onChange={(e) => setFormData({ ...formData, bookingDate: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                                InputProps={{ startAdornment: <InputAdornment position="start"><Calendar size={16} color="#9ca3af" /></InputAdornment> }}
                                sx={FIELD_SX} />
                        </Grid>
                        <Grid size={{ xs: 6, md: 3 }}>
                            <TextField fullWidth size="small" label="Order Reference" value="Auto" disabled sx={DISABLED_SX} />
                        </Grid>
                        <Grid size={{ xs: 6, md: 3 }}>
                            <TextField fullWidth size="small" label="Delivery Date" type="date" name="deliveryDate" required
                                value={formData.deliveryDate}
                                onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                                InputProps={{ startAdornment: <InputAdornment position="start"><Calendar size={16} color="#9ca3af" /></InputAdornment> }}
                                sx={FIELD_SX} />
                        </Grid>
                    </Grid>

                    {/* ── Customer Information Card (full-width) ── */}
                    <Card variant="outlined" sx={{ mb: 2, borderRadius: 2, border: '1px solid #e5e7eb', overflow: 'visible' }}>
                        <Box sx={{ px: 2.5, pt: 2, pb: 0.5, display: 'flex', alignItems: 'center', gap: 1.5, borderLeft: '4px solid #8b5cf6' }}>
                            <User size={16} color="#8b5cf6" />
                            <Typography variant="subtitle2" fontWeight={700} color="#1f2937">Customer Information</Typography>
                        </Box>
                        <Box sx={{ p: 2 }}>
                            <Grid container spacing={2}>
                                {/* Customer autocomplete — full width */}
                                <Grid size={{ xs: 12 }}>
                                    <Autocomplete
                                        options={customers || []}
                                        getOptionLabel={(option) => option.name || ""}
                                        filterOptions={(options, { inputValue }) => {
                                            const q = (inputValue || "").toLowerCase().trim();
                                            if (!q) return options;
                                            return options.filter(c =>
                                                (c.name || "").toLowerCase().includes(q) ||
                                                (c.measurementNo || "").toLowerCase().includes(q) ||
                                                (c.phone || "").toLowerCase().includes(q) ||
                                                (c.address || "").toLowerCase().includes(q)
                                            );
                                        }}
                                        value={(customers || []).find(c => c.id === formData.customerId) || null}
                                        onChange={(event, newValue) => { handleCustomerChange(newValue ? newValue.id : ""); }}
                                        renderOption={(props, option) => {
                                            const { key, ...rest } = props;
                                            return (
                                                <li key={key} {...rest}>
                                                    <Box sx={{ py: 0.3 }}>
                                                        <Typography variant="body2" fontWeight={600}>{option.name}</Typography>
                                                        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 0.2 }}>
                                                            {option.phone && <Typography variant="caption" color="text.secondary">{option.phone}</Typography>}
                                                            {option.measurementNo && <Typography variant="caption" sx={{ color: '#7c3aed', fontWeight: 600 }}>M# {option.measurementNo}</Typography>}
                                                            {option.address && <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>{option.address}</Typography>}
                                                        </Box>
                                                    </Box>
                                                </li>
                                            );
                                        }}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="Select Customer"
                                                size="small"
                                                fullWidth
                                                required
                                                InputProps={{
                                                    ...params.InputProps,
                                                    startAdornment: (
                                                        <><InputAdornment position="start"><User size={16} color="#9ca3af" /></InputAdornment>{params.InputProps.startAdornment}</>
                                                    ),
                                                }}
                                                sx={{ minWidth: 300, ...FIELD_SX }}
                                            />
                                        )}
                                    />
                                </Grid>
                                {/* Name */}
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <TextField fullWidth size="small" label="Name" value={formData.customerName}
                                        disabled placeholder="Auto-filled" sx={DISABLED_SX} />
                                </Grid>
                                {/* Phone */}
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <TextField fullWidth size="small" label="Phone Number" value={formData.customerPhone}
                                        disabled placeholder="+92 300 1234567"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Typography sx={{ fontSize: '0.9rem', lineHeight: 1 }}>🇵🇰</Typography>
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={DISABLED_SX} />
                                </Grid>
                                {/* Address */}
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <TextField fullWidth size="small" label="Address" value={formData.customerAddress}
                                        disabled placeholder="Auto-filled" sx={DISABLED_SX} />
                                </Grid>
                                {/* Billing Account toggle */}
                                <Grid size={{ xs: 12 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                        <Checkbox
                                            size="small"
                                            checked={formData.sameBilling}
                                            onChange={(e) => setFormData(prev => ({ ...prev, sameBilling: e.target.checked, billingCustomerId: "" }))}
                                            sx={{ color: '#8b5cf6', '&.Mui-checked': { color: '#7c3aed' }, p: 0.5 }}
                                        />
                                        <Typography variant="body2" color="#374151">Billing account same as booking customer</Typography>
                                    </Box>
                                </Grid>
                                {!formData.sameBilling && (
                                    <Grid size={{ xs: 12 }}>
                                        <Autocomplete
                                            options={customers || []}
                                            getOptionLabel={(option) => option.name || ""}
                                            value={(customers || []).find(c => c.id === formData.billingCustomerId) || null}
                                            onChange={(_, newValue) => setFormData(prev => ({ ...prev, billingCustomerId: newValue ? newValue.id : "" }))}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label="Billing Account *"
                                                    size="small"
                                                    fullWidth
                                                    required
                                                    placeholder="Select who will be billed"
                                                    sx={FIELD_SX}
                                                />
                                            )}
                                        />
                                    </Grid>
                                )}
                            </Grid>
                        </Box>
                    </Card>

                    {/* ── Items Table ── */}
                    <Box sx={{ mb: 2 }}>
                        <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1.5, borderLeft: '4px solid #8b5cf6', pl: 1.5 }}>
                            <Typography variant="subtitle2" fontWeight={700} color="#1f2937">Book Suit</Typography>
                        </Box>
                        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#f3f4f6' }}>
                                        <TableCell sx={{ fontWeight: 700, color: '#374151', width: 40 }}>#</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: '#374151' }}>Stitching Options</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: '#374151', width: 110 }}>Total (Rs.)</TableCell>
                                        <TableCell sx={{ width: 40 }} />
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {cartItems.map((item, index) => (
                                        <React.Fragment key={index}>
                                            <TableRow sx={{ '&:hover': { bgcolor: '#f9fafb' }, transition: 'background-color 0.15s', '& td, & th': { borderBottom: item.bookingType === 'STITCHING' && !item.isCollapsed ? 'none' : undefined } }}>
                                                <TableCell sx={{ color: '#6b7280', fontWeight: 600, verticalAlign: 'top', pt: 1.5 }}>{index + 1}</TableCell>
                                                <TableCell sx={{ verticalAlign: 'top', pt: 1 }}>
                                                    {stitchingOptions.length === 0 ? (
                                                        <Typography variant="caption" color="text.disabled">
                                                            No stitching options defined. Add them in Stitching Option Pricing.
                                                        </Typography>
                                                    ) : (
                                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                            {stitchingOptions.map(opt => {
                                                                const checked = (item.selectedOptionIds || []).includes(opt.id);
                                                                return (
                                                                    <FormControlLabel
                                                                        key={opt.id}
                                                                        control={
                                                                            <Checkbox
                                                                                size="small"
                                                                                checked={checked}
                                                                                onChange={() => handleToggleStitchingOption(index, opt.id)}
                                                                                sx={{ color: '#8b5cf6', '&.Mui-checked': { color: '#7c3aed' }, p: 0.5 }}
                                                                            />
                                                                        }
                                                                        label={
                                                                            <Typography variant="caption" sx={{ fontWeight: checked ? 700 : 400, color: checked ? '#7c3aed' : '#374151' }}>
                                                                                {opt.name} <span style={{ color: '#059669', fontWeight: 600 }}>Rs.{parseFloat(opt.price).toLocaleString()}</span>
                                                                            </Typography>
                                                                        }
                                                                        sx={{ m: 0, border: '1px solid', borderColor: checked ? '#c4b5fd' : '#e5e7eb', borderRadius: 1.5, px: 1, py: 0.3, bgcolor: checked ? '#f5f3ff' : 'white' }}
                                                                    />
                                                                );
                                                            })}
                                                        </Box>
                                                    )}
                                                    {/* Quantity & per-unit price */}
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                                        <Typography variant="caption" color="text.secondary">Qty:</Typography>
                                                        <TextField
                                                            size="small"
                                                            type="number"
                                                            value={item.quantity || 1}
                                                            onChange={(e) => handleQuantityChange(index, e.target.value)}
                                                            inputProps={{ min: 1, style: { textAlign: 'center', padding: '4px 8px', width: 50 } }}
                                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: 'white', fontSize: '0.85rem' } }}
                                                        />
                                                        {(item.quantity || 1) > 1 && (
                                                            <Typography variant="caption" color="text.secondary">
                                                                Rs.{(calculateUnitPrice(item)).toLocaleString()} × {item.quantity} =&nbsp;
                                                                <strong style={{ color: '#059669' }}>Rs.{(item.totalPrice || 0).toLocaleString()}</strong>
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                    {/* Item Status & Note */}
                                                    <Box sx={{ display: 'flex', gap: 1.5, mt: 1, alignItems: 'flex-start' }}>
                                                        <TextField
                                                            select
                                                            size="small"
                                                            label="Suit Status"
                                                            value={item.itemStatus || "PENDING"}
                                                            onChange={(e) => {
                                                                const ni = [...cartItems];
                                                                ni[index].itemStatus = e.target.value;
                                                                setCartItems(ni);
                                                            }}
                                                            sx={{ width: 150, '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: 'white', fontSize: '0.8rem' } }}
                                                        >
                                                            {[
                                                                { value: "PENDING", label: "Pending", color: "#f59e0b" },
                                                                { value: "READY", label: "Ready", color: "#10b981" },
                                                                { value: "DELIVERED", label: "Delivered", color: "#059669" },
                                                                { value: "CANCELLED", label: "Cancelled", color: "#ef4444" },
                                                            ].map(s => (
                                                                <MenuItem key={s.value} value={s.value}>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                                                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: s.color, flexShrink: 0 }} />
                                                                        <span>{s.label}</span>
                                                                    </Box>
                                                                </MenuItem>
                                                            ))}
                                                        </TextField>
                                                        <TextField
                                                            size="small"
                                                            label="Note"
                                                            multiline
                                                            minRows={1}
                                                            maxRows={4}
                                                            value={item.itemNote || ""}
                                                            onChange={(e) => {
                                                                const ni = [...cartItems];
                                                                ni[index].itemNote = e.target.value;
                                                                setCartItems(ni);
                                                            }}
                                                            placeholder="Add a note for this suit..."
                                                            sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: 'white', fontSize: '0.8rem' } }}
                                                        />
                                                    </Box>
                                                </TableCell>
                                                <TableCell sx={{ verticalAlign: 'top', pt: 1.5 }}>
                                                    <Typography variant="body1" sx={{ fontWeight: 800, color: '#059669' }}>
                                                        Rs.&nbsp;{(parseFloat(item.totalPrice) || 0).toLocaleString()}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell sx={{ verticalAlign: 'top', pt: 1.5 }}>
                                                    <Tooltip title="Remove item">
                                                        <span>
                                                            <IconButton size="small" color="error" onClick={() => handleRemoveRow(index)} disabled={cartItems.length === 1}>
                                                                <Trash2 size={15} />
                                                            </IconButton>
                                                        </span>
                                                    </Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        </React.Fragment>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <Button startIcon={<Plus size={15} />} onClick={handleAddRow} size="small"
                            sx={{ mt: 1, textTransform: 'none', color: '#8b5cf6', fontWeight: 600 }}>
                            Add New Item
                        </Button>
                    </Box>

                    {/* ── Products / Accessories ── */}
                    <Box sx={{ mb: 2 }}>
                        <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '4px solid #f59e0b', pl: 1.5 }}>
                            <Typography variant="subtitle2" fontWeight={700} color="#1f2937">Products / Accessories</Typography>
                            <Button startIcon={<Plus size={15} />} onClick={handleAddProductItem} size="small"
                                sx={{ textTransform: 'none', color: '#f59e0b', fontWeight: 600 }}>
                                Add Product
                            </Button>
                        </Box>

                        {/* Barcode scanner / product name filter */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                            <Autocomplete
                                freeSolo
                                size="small"
                                options={products || []}
                                getOptionLabel={(o) => typeof o === 'string' ? o : `${o.name}${o.sku ? ` [${o.sku}]` : ''}`}
                                filterOptions={(options, { inputValue }) => {
                                    const q = (inputValue || '').toLowerCase().trim();
                                    if (!q) return [];
                                    return options.filter(p =>
                                        (p.name || '').toLowerCase().includes(q) ||
                                        (p.sku || '').toLowerCase().includes(q) ||
                                        (p.barcode || '').toLowerCase().includes(q)
                                    ).slice(0, 10);
                                }}
                                inputValue={scanCode}
                                onInputChange={(_, val, reason) => { if (reason !== 'reset') setScanCode(val); }}
                                onChange={(_, value) => {
                                    if (!value) return;
                                    if (typeof value === 'object') {
                                        addProductToItems(value);
                                        setScanCode('');
                                        setTimeout(() => scanRef.current?.focus(), 50);
                                    } else {
                                        handleBookingScan(value);
                                    }
                                }}
                                renderOption={(props, option) => {
                                    const { key, ...rest } = props;
                                    return (
                                        <li key={key} {...rest}>
                                            <Box>
                                                <Typography variant="body2" fontWeight={600}>{option.name}</Typography>
                                                {option.sku && <Typography variant="caption" color="text.secondary">SKU: {option.sku}</Typography>}
                                            </Box>
                                        </li>
                                    );
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        inputRef={scanRef}
                                        size="small"
                                        placeholder="Scan barcode or type product name..."
                                        autoComplete="off"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && scanCode.trim()) {
                                                handleBookingScan(scanCode);
                                            }
                                        }}
                                        InputProps={{
                                            ...params.InputProps,
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <ScanLine size={16} color="#f59e0b" />
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2,
                                                bgcolor: 'white',
                                                '& fieldset': { borderColor: '#f59e0b', borderWidth: 1.5 },
                                                '&:hover fieldset': { borderColor: '#d97706' },
                                                '&.Mui-focused fieldset': { borderColor: '#d97706', borderWidth: 2 },
                                            },
                                        }}
                                    />
                                )}
                                sx={{ width: 340 }}
                            />
                            {scanStatus && (
                                <Alert severity={scanStatus.type} sx={{ py: 0, px: 1.5, borderRadius: 2, fontSize: '0.8rem' }} variant="filled">
                                    {scanStatus.msg}
                                </Alert>
                            )}
                        </Box>

                        {productItems.length > 0 && (
                            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: '#fef3c7' }}>
                                            <TableCell sx={{ fontWeight: 700, color: '#374151', width: 40 }}>#</TableCell>
                                            <TableCell sx={{ fontWeight: 700, color: '#374151' }}>Product</TableCell>
                                            <TableCell sx={{ fontWeight: 700, color: '#374151', width: 80 }}>Qty</TableCell>
                                            <TableCell sx={{ fontWeight: 700, color: '#374151', width: 110 }}>Unit Price</TableCell>
                                            <TableCell sx={{ fontWeight: 700, color: '#374151', width: 110 }}>Discount</TableCell>
                                            <TableCell sx={{ fontWeight: 700, color: '#374151', width: 110 }}>Total</TableCell>
                                            <TableCell sx={{ width: 40 }} />
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {productItems.map((item, index) => (
                                            <TableRow key={item.id} sx={{ '&:hover': { bgcolor: '#fffbeb' } }}>
                                                <TableCell sx={{ color: '#6b7280', fontWeight: 600 }}>{index + 1}</TableCell>
                                                <TableCell>
                                                    <Autocomplete
                                                        options={products || []}
                                                        getOptionLabel={(o) => `${o.name}${o.sku ? ` (${o.sku})` : ''}` || ""}
                                                        value={(products || []).find(p => p.id === item.productId) || null}
                                                        onChange={(_, nv) => handleProductSelect(index, nv)}
                                                        size="small"
                                                        renderInput={(params) => (
                                                            <TextField {...params} size="small" placeholder="Select product"
                                                                sx={{ minWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: 'white' } }} />
                                                        )}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <TextField type="number" size="small" value={item.quantity}
                                                        onChange={(e) => handleProductItemChange(index, 'quantity', e.target.value)}
                                                        inputProps={{ min: 1, style: { textAlign: 'center', padding: '4px 8px', width: 50 } }}
                                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: 'white' } }} />
                                                </TableCell>
                                                <TableCell>
                                                    <TextField type="number" size="small" value={item.unitPrice}
                                                        onChange={(e) => handleProductItemChange(index, 'unitPrice', e.target.value)}
                                                        inputProps={{ min: 0, style: { width: 80 } }}
                                                        InputProps={{ startAdornment: <InputAdornment position="start">Rs.</InputAdornment> }}
                                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: 'white' } }} />
                                                </TableCell>
                                                <TableCell>
                                                    <TextField type="number" size="small" value={item.discount}
                                                        onChange={(e) => handleProductItemChange(index, 'discount', e.target.value)}
                                                        inputProps={{ min: 0, style: { width: 70 } }}
                                                        InputProps={{ startAdornment: <InputAdornment position="start">Rs.</InputAdornment> }}
                                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: 'white' } }} />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={800} color="#f59e0b">
                                                        Rs.{parseFloat(item.totalPrice || 0).toLocaleString()}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <IconButton size="small" color="error" onClick={() => handleRemoveProductItem(index)}>
                                                        <Trash2 size={15} />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </Box>

                    {/* ── Staff Assignment (multi-select) ── */}
                    <Card variant="outlined" sx={{ mb: 2, borderRadius: 2, border: '1px solid #e5e7eb' }}>
                        <Box sx={{ px: 2.5, pt: 2, pb: 0.5, display: 'flex', alignItems: 'center', gap: 1.5, borderLeft: '4px solid #f59e0b' }}>
                            <Typography variant="subtitle2" fontWeight={700} color="#1f2937">Staff Assignment</Typography>
                            <Typography variant="caption" color="text.secondary">(select one or more)</Typography>
                        </Box>
                        <Box sx={{ p: 2 }}>
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Autocomplete
                                        multiple
                                        options={tailors || []}
                                        getOptionLabel={(option) => option.name || ""}
                                        value={(tailors || []).filter(t => (formData.tailorIds || []).includes(t.id))}
                                        onChange={(event, newValue) => { setFormData({ ...formData, tailorIds: newValue.map(v => v.id) }); }}
                                        renderTags={(value, getTagProps) =>
                                            value.map((option, index) => {
                                                const { key, ...tagProps } = getTagProps({ index });
                                                return <Chip key={key} label={option.name} size="small" {...tagProps} sx={{ bgcolor: '#f5f3ff', color: '#7c3aed' }} />;
                                            })
                                        }
                                        renderInput={(params) => (
                                            <TextField {...params} label="Tailor(s)" size="small" fullWidth sx={FIELD_SX}
                                                helperText={`${(formData.tailorIds || []).length} selected`} />
                                        )}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Autocomplete
                                        multiple
                                        options={cutters || []}
                                        getOptionLabel={(option) => option.name || ""}
                                        value={(cutters || []).filter(c => (formData.cutterIds || []).includes(c.id))}
                                        onChange={(event, newValue) => { setFormData({ ...formData, cutterIds: newValue.map(v => v.id) }); }}
                                        renderTags={(value, getTagProps) =>
                                            value.map((option, index) => {
                                                const { key, ...tagProps } = getTagProps({ index });
                                                return <Chip key={key} label={option.name} size="small" {...tagProps} sx={{ bgcolor: '#fef3c7', color: '#92400e' }} />;
                                            })
                                        }
                                        renderInput={(params) => (
                                            <TextField {...params} label="Cutter(s)" size="small" fullWidth sx={FIELD_SX}
                                                helperText={`${(formData.cutterIds || []).length} selected`} />
                                        )}
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                    </Card>

                    {/* ── Notes + Totals ── */}
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField fullWidth size="small" label="Remarks / Notes" name="notes"
                                multiline rows={4} value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                sx={FIELD_SX} />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Card variant="outlined" sx={{ p: 2, bgcolor: '#f0fdf4', borderRadius: 2 }}>
                                {/* Total row */}
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, pb: 1.5, borderBottom: '1px solid #d1fae5' }}>
                                    <Typography variant="body2" fontWeight={600} color="text.secondary">Total Amount</Typography>
                                    <Typography variant="h6" fontWeight={800} color="#059669">Rs.&nbsp;{totalAmount.toFixed(0)}</Typography>
                                </Box>
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 6 }}>
                                        <TextField fullWidth size="small" label="Advance Amount" required
                                            value={formData.advanceAmount}
                                            onChange={(e) => setFormData({ ...formData, advanceAmount: e.target.value })}
                                            InputProps={{ startAdornment: <InputAdornment position="start">Rs.</InputAdornment> }}
                                            sx={FIELD_SX} />
                                    </Grid>
                                    <Grid size={{ xs: 6 }}>
                                        <TextField fullWidth size="small" label="Remaining Amount" value={balanceAmount.toFixed(0)} disabled
                                            InputProps={{ startAdornment: <InputAdornment position="start">Rs.</InputAdornment> }}
                                            sx={{ '& .MuiOutlinedInput-root': { bgcolor: balanceAmount > 0 ? '#fee2e2' : '#f0fdf4', borderRadius: 2, '& .MuiInputBase-input': { fontWeight: 800, color: balanceAmount > 0 ? '#b91c1c' : '#059669', textAlign: 'center' } } }} />
                                    </Grid>
                                </Grid>
                            </Card>
                        </Grid>
                    </Grid>
                </Box>
            </DialogContent>
        </Dialog>
    );
    // --- end formDialog ---

    return (
        <Box sx={{ width: '100%', p: 3 }}>
            {formDialog}

            {/* ── Page Header ── */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{
                        p: 1.5, borderRadius: 2,
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 14px rgba(139,92,246,0.35)'
                    }}>
                        <ShoppingCart size={22} color="white" />
                    </Box>
                    <Box>
                        <Typography variant="h5" fontWeight={700} sx={{ color: '#1e293b', lineHeight: 1.2 }}>Bookings</Typography>
                        <Typography variant="body2" color="text.secondary">Manage all sales orders and bookings</Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                        label={`${filteredBookings.length} booking${filteredBookings.length !== 1 ? 's' : ''}`}
                        sx={{ bgcolor: '#f5f3ff', color: '#7c3aed', fontWeight: 600, borderRadius: 2 }}
                    />
                    <Chip
                        label={`${filteredSuitCount} suit${filteredSuitCount !== 1 ? 's' : ''}`}
                        sx={{ bgcolor: '#cffafe', color: '#0e7490', fontWeight: 600, borderRadius: 2 }}
                    />
                </Box>
            </Box>

            {/* ── Action Bar ── */}
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                <TextField
                    placeholder="Name, phone, city, M#…"
                    variant="outlined"
                    size="small"
                    sx={{ width: 240, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'white' } }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{ startAdornment: (<InputAdornment position="start"><Search size={16} /></InputAdornment>) }}
                />
                <TextField
                    label="Booking From"
                    type="date"
                    size="small"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ width: 155, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'white' } }}
                />
                <TextField
                    label="Booking To"
                    type="date"
                    size="small"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ width: 155, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'white' } }}
                />
                <TextField
                    label="Delivery From"
                    type="date"
                    size="small"
                    value={filterDeliveryFrom}
                    onChange={(e) => setFilterDeliveryFrom(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ width: 155, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'white' } }}
                />
                <TextField
                    label="Delivery To"
                    type="date"
                    size="small"
                    value={filterDeliveryTo}
                    onChange={(e) => setFilterDeliveryTo(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ width: 155, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'white' } }}
                />
                <TextField
                    select
                    label="Suit Status"
                    size="small"
                    value={filterItemStatus}
                    onChange={(e) => setFilterItemStatus(e.target.value)}
                    sx={{ width: 150, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'white' } }}
                >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="PENDING">Pending</MenuItem>
                    <MenuItem value="READY">Ready</MenuItem>
                    <MenuItem value="DELIVERED">Delivered</MenuItem>
                    <MenuItem value="CANCELLED">Cancelled</MenuItem>
                </TextField>
                <TextField
                    label="Measurement No"
                    size="small"
                    value={filterMeasurementNo}
                    onChange={(e) => setFilterMeasurementNo(e.target.value)}
                    placeholder="e.g. M-001"
                    sx={{ width: 155, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'white' } }}
                />
                <TextField
                    select
                    label="Sort By"
                    size="small"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    sx={{ width: 190, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'white' } }}
                >
                    <MenuItem value="bookingDate_desc">Recent Booking Date</MenuItem>
                    <MenuItem value="deliveryDate_desc">Recent Delivery Date</MenuItem>
                    <MenuItem value="deliveryDate_asc">Earliest Delivery Date</MenuItem>
                    <MenuItem value="bookingNo_desc">Booking No (High → Low)</MenuItem>
                    <MenuItem value="bookingNo_asc">Booking No (Low → High)</MenuItem>
                </TextField>
                <Autocomplete
                    options={customers || []}
                    getOptionLabel={(option) => option.name || ""}
                    filterOptions={(options, { inputValue }) => {
                        const q = (inputValue || "").toLowerCase().trim();
                        if (!q) return options;
                        return options.filter(c =>
                            (c.name || "").toLowerCase().includes(q) ||
                            (c.measurementNo || "").toLowerCase().includes(q) ||
                            (c.phone || "").toLowerCase().includes(q) ||
                            (c.address || "").toLowerCase().includes(q)
                        );
                    }}
                    value={(customers || []).find(c => c.id === filterCustomerId) || null}
                    onChange={(_, newValue) => setFilterCustomerId(newValue ? newValue.id : null)}
                    size="small"
                    sx={{ width: 260, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'white' } }}
                    renderOption={(props, option) => {
                        const { key, ...rest } = props;
                        return (
                            <li key={key} {...rest}>
                                <Box sx={{ py: 0.3 }}>
                                    <Typography variant="body2" fontWeight={600}>{option.name}</Typography>
                                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 0.2 }}>
                                        {option.phone && <Typography variant="caption" color="text.secondary">{option.phone}</Typography>}
                                        {option.measurementNo && <Typography variant="caption" sx={{ color: '#7c3aed', fontWeight: 600 }}>M# {option.measurementNo}</Typography>}
                                        {option.address && <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>{option.address}</Typography>}
                                    </Box>
                                </Box>
                            </li>
                        );
                    }}
                    renderInput={(params) => <TextField {...params} label="Customer" />}
                />
                {(filterDateFrom || filterDateTo || filterDeliveryFrom || filterDeliveryTo || filterCustomerId || filterItemStatus || filterMeasurementNo) && (
                    <Button
                        size="small"
                        variant="outlined"
                        onClick={() => { setFilterDateFrom(""); setFilterDateTo(""); setFilterDeliveryFrom(""); setFilterDeliveryTo(""); setFilterCustomerId(null); setFilterItemStatus(""); setFilterMeasurementNo(""); }}
                        sx={{ borderRadius: 2, textTransform: 'none', borderColor: '#d1d5db', color: '#6b7280', whiteSpace: 'nowrap' }}
                    >
                        Clear
                    </Button>
                )}
                <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                    <Button
                        variant="outlined"
                        startIcon={<Printer size={18} />}
                        onClick={handlePrintList}
                        sx={{ borderRadius: 2, textTransform: 'none', whiteSpace: 'nowrap', borderColor: '#0ea5e9', color: '#0ea5e9' }}
                    >
                        Print List ({filteredBookings.length})
                    </Button>
                    {selectedIds.size > 0 && (
                        <Button
                            variant="outlined"
                            startIcon={<Printer size={18} />}
                            onClick={handleBulkPrintClick}
                            sx={{ borderRadius: 2, textTransform: 'none', whiteSpace: 'nowrap', borderColor: '#8b5cf6', color: '#8b5cf6' }}
                        >
                            Print Selected ({selectedIds.size})
                        </Button>
                    )}
                    <Button
                        variant="contained"
                        startIcon={<Plus size={18} />}
                        onClick={() => setShowForm(true)}
                        sx={{
                            borderRadius: 2, textTransform: 'none', px: 3, whiteSpace: 'nowrap',
                            background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                            boxShadow: '0 4px 14px rgba(139,92,246,0.35)',
                            '&:hover': { background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)' }
                        }}
                    >
                        New Booking
                    </Button>
                </Box>
            </Box>

            <TableContainer component={Card} elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                <Table sx={{ minWidth: 650 }}>
                    <TableHead>
                        <TableRow sx={{ bgcolor: '#f8fafc' }}>
                            <TableCell padding="checkbox">
                                <Checkbox
                                    size="small"
                                    checked={filteredBookings.length > 0 && filteredBookings.every(b => selectedIds.has(b.id))}
                                    indeterminate={selectedIds.size > 0 && !filteredBookings.every(b => selectedIds.has(b.id))}
                                    onChange={(e) => handleSelectAll(e.target.checked)}
                                />
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#374151' }}>#</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#374151' }}>Book Date</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#374151' }}>Customer</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#374151' }}>Tailor</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#374151' }}>Cutter</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#374151' }}>Delivery</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#374151' }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#374151' }} align="right">Amount</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#374151' }} align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredBookings.length > 0 ? (
                            filteredBookings.map((booking) => (
                                <TableRow key={booking.id} sx={{ '&:hover': { bgcolor: '#f9fafb' }, transition: 'background-color 0.15s', bgcolor: selectedIds.has(booking.id) ? '#f5f3ff' : 'inherit' }}>
                                    {/* Checkbox */}
                                    <TableCell padding="checkbox">
                                        <Checkbox size="small" checked={selectedIds.has(booking.id)} onChange={() => handleToggleSelect(booking.id)} />
                                    </TableCell>
                                    {/* # Booking No */}
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700, color: '#7c3aed' }}>
                                            #{booking.bookingNumber || booking.id}
                                        </Typography>
                                        <Chip
                                            label={booking.bookingType === 'SUIT' ? 'Readymade' : 'Stitching'}
                                            size="small"
                                            sx={{
                                                mt: 0.5, height: 18, fontSize: '0.65rem', borderRadius: 1,
                                                bgcolor: booking.bookingType === 'SUIT' ? '#dbeafe' : '#fef3c7',
                                                color: booking.bookingType === 'SUIT' ? '#1e40af' : '#92400e'
                                            }}
                                        />
                                    </TableCell>
                                    {/* Book Date */}
                                    <TableCell>
                                        <Typography variant="body2">{new Date(booking.bookingDate).toLocaleDateString('en-GB')}</Typography>
                                        {booking.returnDate && (
                                            <Typography variant="caption" color="primary" sx={{ display: 'block' }}>Return: {new Date(booking.returnDate).toLocaleDateString('en-GB')}</Typography>
                                        )}
                                    </TableCell>
                                    {/* Customer */}
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Avatar variant="rounded" sx={{
                                                width: 34, height: 34, fontSize: '0.85rem', fontWeight: 700,
                                                background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                                                color: 'white', borderRadius: 1.5,
                                            }}>
                                                {(booking.customer?.name || '?')[0].toUpperCase()}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>{booking.customer?.name}</Typography>
                                                <Typography variant="caption" color="text.secondary">{booking.customer?.phone}</Typography>
                                                {booking.customer?.measurementNo && (
                                                    <Typography variant="caption" sx={{ display: 'block', color: '#059669', fontWeight: 600 }}>
                                                        M# {booking.customer.measurementNo}
                                                    </Typography>
                                                )}
                                                {booking.billingCustomer && booking.billingCustomer.id !== booking.customerId && (
                                                    <Typography variant="caption" sx={{ display: 'block', color: '#8b5cf6', fontWeight: 600 }}>
                                                        Bill: {booking.billingCustomer.name}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    {/* Tailor */}
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                                            <Box sx={{ flex: 1 }}>
                                                {(booking.staff || []).filter(s => s.role === "TAILOR").length > 0 ? (
                                                    (booking.staff || []).filter(s => s.role === "TAILOR").map(s => (
                                                        <Chip key={s.id} label={s.customer?.name} size="small" sx={{ mb: 0.3, mr: 0.3, bgcolor: '#f5f3ff', color: '#7c3aed', height: 20, fontSize: '0.7rem' }} />
                                                    ))
                                                ) : (
                                                    <Typography variant="caption" color="text.disabled">—</Typography>
                                                )}
                                            </Box>
                                            <Tooltip title="Edit Staff">
                                                <IconButton size="small" sx={{ color: '#9ca3af', p: 0.25 }} onClick={() => handleOpenStaffEdit(booking)}>
                                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </TableCell>
                                    {/* Cutter */}
                                    <TableCell>
                                        {(booking.staff || []).filter(s => s.role === "CUTTER").length > 0 ? (
                                            (booking.staff || []).filter(s => s.role === "CUTTER").map(s => (
                                                <Chip key={s.id} label={s.customer?.name} size="small" sx={{ mb: 0.3, mr: 0.3, bgcolor: '#fef3c7', color: '#92400e', height: 20, fontSize: '0.7rem' }} />
                                            ))
                                        ) : (
                                            <Typography variant="caption" color="text.disabled">—</Typography>
                                        )}
                                    </TableCell>
                                    {/* Delivery */}
                                    <TableCell>
                                        <Typography variant="body2">
                                            {booking.deliveryDate ? new Date(booking.deliveryDate).toLocaleDateString('en-GB') : '—'}
                                        </Typography>
                                    </TableCell>
                                    {/* Status */}
                                    <TableCell>
                                        <TextField
                                            select size="small" value={booking.status}
                                            onChange={(e) => handleStatusUpdate(booking.id, e.target.value)}
                                            sx={{
                                                minWidth: 155,
                                                '& .MuiOutlinedInput-root': {
                                                    bgcolor: getStatusColor(booking.status) + '18',
                                                    borderRadius: 2, fontWeight: 600, fontSize: '0.78rem',
                                                    color: getStatusColor(booking.status),
                                                    '& fieldset': { borderColor: getStatusColor(booking.status) + '60' },
                                                }
                                            }}
                                        >
                                            {BOOKING_STATUSES.map((s) => (
                                                <MenuItem key={s.value} value={s.value} sx={{ fontSize: '0.82rem' }}>{s.label}</MenuItem>
                                            ))}
                                        </TextField>
                                    </TableCell>
                                    {/* Amount */}
                                    <TableCell align="right">
                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>Rs.&nbsp;{parseFloat(booking.totalAmount).toFixed(0)}</Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Adv: Rs.&nbsp;{parseFloat(booking.advanceAmount).toFixed(0)}</Typography>
                                        <Typography variant="caption" sx={{ display: 'block', color: '#dc2626', fontWeight: 600 }}>Rem: Rs.&nbsp;{parseFloat(booking.remainingAmount).toFixed(0)}</Typography>
                                    </TableCell>
                                    {/* Actions */}
                                    <TableCell align="right">
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                                            <Tooltip title="View Details">
                                                <IconButton size="small" sx={{ color: '#3b82f6' }} onClick={() => handleViewBooking(booking)}><Eye size={17} /></IconButton>
                                            </Tooltip>
                                            <Tooltip title="Edit Booking">
                                                <IconButton size="small" sx={{ color: '#f59e0b' }} onClick={() => handleEdit(booking)}><Pencil size={17} /></IconButton>
                                            </Tooltip>
                                            <Tooltip title="Print">
                                                <IconButton size="small" color="primary" onClick={() => handlePrintClick(booking)}><Printer size={17} /></IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete Booking">
                                                <IconButton size="small" color="error" onClick={() => handleDelete(booking.id)}><Trash2 size={17} /></IconButton>
                                            </Tooltip>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={11} align="center" sx={{ py: 8 }}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
                                        <ShoppingCart size={40} style={{ opacity: 0.25 }} />
                                        <Typography color="text.secondary" fontWeight={500}>No bookings found.</Typography>
                                        <Typography variant="caption" color="text.disabled">Try adjusting your search or create a new booking.</Typography>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* ── Inline Staff Edit Dialog ── */}
            <Dialog open={staffEditOpen} onClose={() => setStaffEditOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}>
                    <Box>
                        <Typography variant="h6" fontWeight={700}>Edit Staff — Booking #{staffEditBooking?.id}</Typography>
                        <Typography variant="caption" color="text.secondary">You can assign multiple tailors and multiple cutters</Typography>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ pt: '20px !important' }}>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12 }}>
                            <Autocomplete
                                multiple
                                options={tailors || []}
                                getOptionLabel={(option) => option.name || ""}
                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                value={staffEditTailorIds}
                                onChange={(_, newValue) => setStaffEditTailorIds(newValue)}
                                renderTags={(value, getTagProps) =>
                                    value.map((option, index) => {
                                        const { key, ...tagProps } = getTagProps({ index });
                                        return <Chip key={key} label={option.name} size="small" {...tagProps} sx={{ bgcolor: '#f5f3ff', color: '#7c3aed' }} />;
                                    })
                                }
                                renderInput={(params) => <TextField {...params} label="Tailor(s)" size="small" fullWidth
                                    helperText={`${staffEditTailorIds.length} tailor(s) assigned`} />}
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <Autocomplete
                                multiple
                                options={cutters || []}
                                getOptionLabel={(option) => option.name || ""}
                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                value={staffEditCutterIds}
                                onChange={(_, newValue) => setStaffEditCutterIds(newValue)}
                                renderTags={(value, getTagProps) =>
                                    value.map((option, index) => {
                                        const { key, ...tagProps } = getTagProps({ index });
                                        return <Chip key={key} label={option.name} size="small" {...tagProps} sx={{ bgcolor: '#fef3c7', color: '#92400e' }} />;
                                    })
                                }
                                renderInput={(params) => <TextField {...params} label="Cutter(s)" size="small" fullWidth
                                    helperText={`${staffEditCutterIds.length} cutter(s) assigned`} />}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setStaffEditOpen(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
                    <Button variant="contained" onClick={handleStaffEditSave}
                        sx={{ textTransform: 'none', bgcolor: '#8b5cf6', '&:hover': { bgcolor: '#7c3aed' } }}>
                        Save Staff
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Print type picker dialog */}
            <Dialog open={printDialogOpen} onClose={() => setPrintDialogOpen(false)} maxWidth="xs" fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}>Select Print Option</DialogTitle>
                <DialogContent sx={{ pt: '20px !important' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Button variant="outlined" size="large" startIcon={<BookText />}
                            onClick={() => handlePrintConfirm('BILL')}
                            sx={{ justifyContent: 'flex-start', py: 1.5, borderRadius: 2, textTransform: 'none' }}>
                            Print Bill / Invoice
                        </Button>
                        <Button variant="outlined" size="large" startIcon={<Ruler />}
                            onClick={() => handlePrintConfirm('STITCHING')}
                            sx={{ justifyContent: 'flex-start', py: 1.5, borderRadius: 2, textTransform: 'none' }}>
                            Print Stitching Details
                        </Button>
                    </Box>
                </DialogContent>
            </Dialog>

            <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="md" fullWidth dir="rtl">
                <DialogTitle sx={{ bgcolor: '#8b5cf6', color: 'white', py: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" fontWeight="bold" className="font-urdu">بکنگ کی تفصیلات</Typography>
                        <IconButton onClick={() => setViewOpen(false)} sx={{ color: 'white' }}>
                            <XIcon size={20} />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ p: 3 }}>
                    {selectedBooking && (
                        <Box sx={{ mt: 2 }}>
                            <Grid container spacing={3}>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Card variant="outlined" sx={{ p: 2 }}>
                                        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }} className="font-urdu">گاہک کی معلومات</Typography>
                                        <Typography variant="body2" sx={{ mb: 0.5 }}><strong>نام:</strong> {selectedBooking.customer?.name}</Typography>
                                        <Typography variant="body2" sx={{ mb: 0.5 }}><strong>فون:</strong> {selectedBooking.customer?.phone}</Typography>
                                        <Typography variant="body2" sx={{ mb: 0.5 }}><strong>پتہ:</strong> {selectedBooking.customer?.address}</Typography>
                                        {selectedBooking.billingCustomer && selectedBooking.billingCustomer.id !== selectedBooking.customerId && (
                                            <Box sx={{ mt: 1, pt: 1, borderTop: '1px dashed #e5e7eb' }}>
                                                <Typography variant="caption" color="#8b5cf6" fontWeight={700}>Billing Account</Typography>
                                                <Typography variant="body2"><strong>Name:</strong> {selectedBooking.billingCustomer.name}</Typography>
                                                <Typography variant="body2"><strong>Phone:</strong> {selectedBooking.billingCustomer.phone}</Typography>
                                            </Box>
                                        )}
                                    </Card>
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Card variant="outlined" sx={{ p: 2 }}>
                                        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }} className="font-urdu">آرڈر کی معلومات</Typography>
                                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                                            <strong>بکنگ نمبر:</strong> {selectedBooking.id}
                                        </Typography>
                                        <Typography variant="body2" sx={{ mb: 0.5 }}><strong>تاریخ بکنگ:</strong> {new Date(selectedBooking.bookingDate).toLocaleDateString('en-GB')}</Typography>
                                        <Typography variant="body2" sx={{ mb: 0.5 }}><strong>ڈیلیوری کی تاریخ:</strong> {selectedBooking.deliveryDate ? new Date(selectedBooking.deliveryDate).toLocaleDateString('en-GB') : '-'}</Typography>
                                        <Typography variant="body2"><strong>ٹرائل کی تاریخ:</strong> {selectedBooking.trialDate ? new Date(selectedBooking.trialDate).toLocaleDateString('en-GB') : '-'}</Typography>
                                    </Card>
                                </Grid>
                            </Grid>

                            <Grid container spacing={3} sx={{ mt: 1 }}>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Card variant="outlined" sx={{ p: 2 }}>
                                        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }} className="font-urdu">درزی کی تفصیلات</Typography>
                                        {selectedBooking.tailor ? (
                                            <Box>
                                                <Typography variant="body2"><strong>نام:</strong> {selectedBooking.tailor.name}</Typography>
                                                <Typography variant="body2" color="textSecondary"><strong>عہدہ:</strong> {selectedBooking.tailor.role}</Typography>
                                            </Box>
                                        ) : (
                                            <Typography variant="body2" color="textSecondary">درزی منتخب نہیں ہے</Typography>
                                        )}
                                    </Card>
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Card variant="outlined" sx={{ p: 2 }}>
                                        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>Cutter Details</Typography>
                                        {selectedBooking.cutter ? (
                                            <Box>
                                                <Typography variant="body2"><strong>Name:</strong> {selectedBooking.cutter.name}</Typography>
                                                <Typography variant="body2" color="textSecondary"><strong>Role:</strong> {selectedBooking.cutter.role}</Typography>
                                            </Box>
                                        ) : (
                                            <Typography variant="body2" color="textSecondary">No Cutter Selected</Typography>
                                        )}
                                    </Card>
                                </Grid>
                            </Grid>

                            <Divider sx={{ my: 3 }}><Typography>Products / Items</Typography></Divider>
                            <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                    <TableHead sx={{ bgcolor: '#f9fafb' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Stitching Options</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600 }}>Total</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {selectedBooking.items?.map((item, idx) => {
                                            const statusColors = { PENDING: "#f59e0b", READY: "#10b981", DELIVERED: "#059669", CANCELLED: "#ef4444" };
                                            const sc = statusColors[item.itemStatus || "PENDING"] || "#6b7280";
                                            return (
                                            <TableRow key={idx}>
                                                <TableCell sx={{ fontWeight: 600, verticalAlign: 'top' }}>{item.product?.name}</TableCell>
                                                <TableCell>
                                                    {(item.selectedOptions || []).length > 0 ? (
                                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                            {item.selectedOptions.map(so => (
                                                                <Chip key={so.id} size="small"
                                                                    label={`${so.stitchingOption?.name} – Rs.${parseFloat(so.price).toLocaleString()}`}
                                                                    sx={{ bgcolor: '#f5f3ff', color: '#7c3aed', fontSize: '0.7rem', height: 20 }} />
                                                            ))}
                                                        </Box>
                                                    ) : (
                                                        <Typography variant="caption" color="text.disabled">No options</Typography>
                                                    )}
                                                    {item.itemNote && (
                                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontStyle: 'italic' }}>
                                                            Note: {item.itemNote}
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Chip size="small" label={item.itemStatus || "PENDING"}
                                                        sx={{ bgcolor: sc + '22', color: sc, fontWeight: 700, fontSize: '0.7rem', height: 20 }} />
                                                </TableCell>
                                                <TableCell align="right">Rs. {parseFloat(item.totalPrice).toFixed(0)}</TableCell>
                                            </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 2 }}>
                                <Box sx={{ width: 250 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2">Total Amount:</Typography>
                                        <Typography variant="body2" fontWeight="bold">Rs. {parseFloat(selectedBooking.totalAmount).toFixed(2)}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2">Advance:</Typography>
                                        <Typography variant="body2" fontWeight="bold">Rs. {parseFloat(selectedBooking.advanceAmount).toFixed(2)}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #ddd', pt: 1 }}>
                                        <Typography variant="body2">Remaining:</Typography>
                                        <Typography variant="body2" fontWeight="bold" color="error">Rs. {parseFloat(selectedBooking.remainingAmount).toFixed(2)}</Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setViewOpen(false)} variant="outlined" sx={{ color: '#8b5cf6', borderColor: '#8b5cf6' }}>Close</Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={!!error || !!successMessage}
                autoHideDuration={6000}
                onClose={() => { setError(''); setSuccessMessage(''); }}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={error ? 'error' : 'success'} variant="filled" sx={{ borderRadius: 2 }}
                    onClose={() => { setError(''); setSuccessMessage(''); }}>
                    {error || successMessage}
                </Alert>
            </Snackbar>

            {/* ═══════════════════════════════════════════════
                PRINT LAYOUTS — hidden on screen, shown on print
            ═══════════════════════════════════════════════ */}
            {(printBooking || bulkPrintBookings.length > 0 || printListBookings.length > 0) && (
                <div id="printable-section" style={{ display: 'none' }}>
                    {/* Single booking print */}
                    {printBooking && (
                        <div className="print-page">
                            {printType === 'BILL'
                                ? <CustomerBill booking={printBooking} />
                                : <TailorTicket booking={printBooking} measurements={customerMeasurements} />
                            }
                        </div>
                    )}
                    {/* Bulk print */}
                    {bulkPrintBookings.length > 0 && bulkPrintBookings.map((bk) => (
                        <div key={bk.id} className="print-page">
                            {printType === 'BILL'
                                ? <CustomerBill booking={bk} />
                                : <TailorTicket booking={bk} measurements={null} />
                            }
                        </div>
                    ))}
                    {/* List print */}
                    {printListBookings.length > 0 && (
                        <div className="print-page">
                            <BookingListPrint
                                bookings={printListBookings}
                                dateFrom={filterDateFrom || filterDeliveryFrom || null}
                                dateTo={filterDateTo || filterDeliveryTo || null}
                            />
                        </div>
                    )}
                </div>
            )}

            <GlobalStyles styles={{
                '@media print': {
                    '@page': { size: 'A4 portrait', margin: '10mm', marginTop: '0mm', marginBottom: '0mm' },
                    'html, body': { margin: '0 !important', padding: '0 !important', height: 'auto !important', overflow: 'visible !important' },
                    'body *': { visibility: 'hidden' },
                    '#printable-section': {
                        display: 'block !important',
                        visibility: 'visible',
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        width: '100%',
                        backgroundColor: 'white',
                    },
                    '#printable-section *': { visibility: 'visible' },
                    '#printable-section .print-page': {
                        pageBreakAfter: 'always',
                        breakAfter: 'page',
                        pageBreakInside: 'avoid',
                        width: '100%',
                    },
                    '#printable-section .print-page:last-child': {
                        pageBreakAfter: 'auto',
                        breakAfter: 'auto',
                    },
                    '#printable-section table': {
                        tableLayout: 'fixed',
                        width: '100% !important',
                        wordBreak: 'break-word',
                    },
                    '#printable-section td, #printable-section th': {
                        overflow: 'hidden',
                        wordBreak: 'break-word',
                    },
                },
            }} />

        </Box >
    );
}
