"use client";

import React, { useState, useRef } from "react";
import { useSession } from "next-auth/react";
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
    { value: "READY", label: "Ready", color: "#10b981" },
    { value: "COMPLETED", label: "Completed", color: "#059669" },
    { value: "RETURNED", label: "Returned", color: "#ef4444" },
    { value: "PARTIALLY_DELIVERED", label: "Partially Delivered", color: "#8b5cf6" },
    { value: "PAID", label: "Paid", color: "#10b981" },
    { value: "TRANSFERRED_TO_LEDGER", label: "Transferred To Ledger", color: "#3b82f6" }
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
    const ITEM_STATUS_COLORS = { PENDING: '#f59e0b', READY: '#10b981', COMPLETED: '#059669', RETURNED: '#ef4444', DELIVERED: '#059669', CANCELLED: '#ef4444' };
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
                        <th style={{ border: '1px solid #555', padding: '4px 6px', textAlign: 'left', width: '10%' }}>Booking No</th>
                        <th style={{ border: '1px solid #555', padding: '4px 6px', textAlign: 'left', width: '12%' }}>Customer Name</th>
                        <th style={{ border: '1px solid #555', padding: '4px 6px', textAlign: 'left', width: '15%' }}>Address</th>
                        <th style={{ border: '1px solid #555', padding: '4px 6px', textAlign: 'left', width: '10%' }}>Measurement No</th>
                        <th style={{ border: '1px solid #555', padding: '4px 6px', textAlign: 'left', width: '9%' }}>Booking Date</th>
                        <th style={{ border: '1px solid #555', padding: '4px 6px', textAlign: 'left', width: '9%' }}>Delivery Date</th>
                        <th style={{ border: '1px solid #555', padding: '4px 6px', textAlign: 'left', width: '10%' }}>Tailor Name</th>
                        <th style={{ border: '1px solid #555', padding: '4px 6px', textAlign: 'left', width: '10%' }}>Suit Qty</th>
                        <th style={{ border: '1px solid #555', padding: '4px 6px', textAlign: 'left', width: '15%' }}>Notes</th>
                    </tr>
                </thead>
                <tbody>
                    {bookings.map((booking, idx) => {
                        const tailorNames = (booking.staff || []).filter(s => s.role === 'TAILOR').map(s => s.customer?.name).join(', ');
                        const totalQty = (booking.items || []).filter(i => !i.productId).reduce((s, i) => s + (parseFloat(i.quantity) || 1), 0);
                        return (
                            <tr key={booking.id} style={{ backgroundColor: idx % 2 === 0 ? '#f9f9f9' : 'white' }}>
                                <td style={{ border: '1px solid #ddd', padding: '3px 6px', fontWeight: 700, color: '#7c3aed' }}>#{booking.bookingNumber || booking.id}</td>
                                <td style={{ border: '1px solid #ddd', padding: '3px 6px', fontWeight: 600 }}>{booking.customer?.name || '—'}</td>
                                <td style={{ border: '1px solid #ddd', padding: '3px 6px' }}>{booking.customer?.address || '—'}</td>
                                <td style={{ border: '1px solid #ddd', padding: '3px 6px' }}>{booking.customer?.measurementNo || '—'}</td>
                                <td style={{ border: '1px solid #ddd', padding: '3px 6px' }}>{fmt(booking.bookingDate)}</td>
                                <td style={{ border: '1px solid #ddd', padding: '3px 6px' }}>{fmt(booking.deliveryDate)}</td>
                                <td style={{ border: '1px solid #ddd', padding: '3px 6px' }}>{tailorNames || '—'}</td>
                                <td style={{ border: '1px solid #ddd', padding: '3px 6px' }}>
                                    {totalQty}
                                </td>
                                <td style={{ border: '1px solid #ddd', padding: '3px 6px', fontSize: '9px' }}>
                                    {booking.notes || '—'}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
                <tfoot>
                    <tr style={{ backgroundColor: '#1a1a2e', color: 'white', fontWeight: 700 }}>
                        <td colSpan={9} style={{ border: '1px solid #555', padding: '4px 6px', textAlign: 'right' }}>TOTAL ({bookings.length} bookings)</td>
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

    return (
        <div style={{ fontFamily: 'Arial, sans-serif', color: '#000', width: '100%', boxSizing: 'border-box' }}>
            {/* Dynamic printing styles handled by GlobalStyles below */}

            {/* Custom POS Header */}
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <img src="/logo.png" alt="Logo" style={{ width: '45px', height: '45px', objectFit: 'contain' }} />
                    <div style={{ fontSize: '15px', fontWeight: '900', letterSpacing: '0.5px', color: '#000', textTransform: 'uppercase' }}>
                        Grace Cloth and Tailors
                    </div>
                    <div style={{ fontSize: '9px', color: '#555', fontStyle: 'italic', marginTop: '-2px' }}>
                        Where Style Meets Perfection
                    </div>
                    <div style={{ fontSize: '10px', fontWeight: '600', color: '#000', marginTop: '2px' }}>
                        📞 03006284318 | 03186284318
                    </div>
                    <div style={{ fontSize: '9px', color: '#333' }}>
                        Basement of Faazal Plaza, Dhulyan Chowk Dinga
                    </div>
                </div>
                <div style={{ borderBottom: '1px dashed #000', margin: '8px 0 6px 0' }} />
                <div style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Customer Bill / Invoice
                </div>
                <div style={{ borderBottom: '1px dashed #000', margin: '6px 0 8px 0' }} />
            </div>

            {/* Booking & Customer details */}
            <div style={{ fontSize: '10px', lineHeight: '1.4', marginBottom: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                        <tr>
                            <td style={{ padding: '2px 0', verticalAlign: 'top', width: '45%', fontWeight: '600' }}>Bill No:</td>
                            <td style={{ padding: '2px 0', verticalAlign: 'top', textAlign: 'right' }}>#{booking.bookingNumber || booking.id}</td>
                        </tr>
                        <tr>
                            <td style={{ padding: '2px 0', verticalAlign: 'top', fontWeight: '600' }}>Booking Date:</td>
                            <td style={{ padding: '2px 0', verticalAlign: 'top', textAlign: 'right' }}>{fmt(booking.bookingDate)}</td>
                        </tr>
                        <tr>
                            <td style={{ padding: '2px 0', verticalAlign: 'top', fontWeight: '600' }}>Delivery Date:</td>
                            <td style={{ padding: '2px 0', verticalAlign: 'top', textAlign: 'right' }}>{fmt(booking.deliveryDate)}</td>
                        </tr>
                        {booking.trialDate && (
                            <tr>
                                <td style={{ padding: '2px 0', verticalAlign: 'top', fontWeight: '600' }}>Trial Date:</td>
                                <td style={{ padding: '2px 0', verticalAlign: 'top', textAlign: 'right' }}>{fmt(booking.trialDate)}</td>
                            </tr>
                        )}
                        <tr style={{ borderTop: '1px dotted #ccc' }}>
                            <td style={{ padding: '4px 0 2px 0', verticalAlign: 'top', fontWeight: 'bold', fontSize: '12px' }}>Customer:</td>
                            <td style={{ padding: '4px 0 2px 0', verticalAlign: 'top', textAlign: 'right', fontWeight: 'bold', fontSize: '13px' }}>{booking.customer?.name}</td>
                        </tr>
                        {booking.customer?.phone && (
                            <tr>
                                <td style={{ padding: '2px 0', verticalAlign: 'top', fontWeight: '600' }}>Phone:</td>
                                <td style={{ padding: '2px 0', verticalAlign: 'top', textAlign: 'right' }}>{booking.customer.phone}</td>
                            </tr>
                        )}
                        <tr>
                            <td style={{ padding: '2px 0', verticalAlign: 'top', fontWeight: 'bold', fontSize: '12px' }}>Address:</td>
                            <td style={{ padding: '2px 0', verticalAlign: 'top', textAlign: 'right', fontWeight: 'bold', fontSize: '13px' }}>{booking.customer?.address || '—'}</td>
                        </tr>
                        {booking.customer?.measurementNo && (
                            <tr>
                                <td style={{ padding: '2px 0', verticalAlign: 'top', fontWeight: '600' }}>Measurement No:</td>
                                <td style={{ padding: '2px 0', verticalAlign: 'top', textAlign: 'right' }}>{booking.customer.measurementNo}</td>
                            </tr>
                        )}
                        {billingCust?.id !== booking.customer?.id && (
                            <tr>
                                <td style={{ padding: '2px 0', verticalAlign: 'top', fontWeight: '600' }}>Billing Party:</td>
                                <td style={{ padding: '2px 0', verticalAlign: 'top', textAlign: 'right' }}>{billingCust?.name}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
                <div style={{ borderBottom: '1px dashed #000', margin: '6px 0' }} />
            </div>

            {/* Items Section */}
            {(() => {
                const stitchItems = (booking.items || []).filter(item => (item.selectedOptions || []).length > 0);
                const prodItems = (booking.items || []).filter(item => (item.selectedOptions || []).length === 0 && item.productId);
                const allItems = [...stitchItems, ...prodItems];
                
                if (allItems.length === 0) return null;

                return (
                    <div style={{ marginBottom: '8px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px dashed #000' }}>
                                    <th style={{ textAlign: 'left', padding: '4px 0', fontSize: '10px', fontWeight: 'bold' }}>Description</th>
                                    <th style={{ textAlign: 'center', padding: '4px 0', fontSize: '10px', fontWeight: 'bold', width: '30px' }}>Qty</th>
                                    <th style={{ textAlign: 'right', padding: '4px 0', fontSize: '10px', fontWeight: 'bold', width: '70px' }}>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allItems.map((item, idx) => {
                                    const isStitch = (item.selectedOptions || []).length > 0;
                                    const unitPr = isStitch
                                        ? (item.quantity > 1 ? parseFloat(item.totalPrice || 0) / item.quantity : parseFloat(item.totalPrice || 0))
                                        : parseFloat(item.unitPrice || 0);
                                    
                                    const isWskot = item.stitchingType === "WAISTCOAT" || (!item.qameez_lambai && item.wskot_lambai);
                                    const itemType = isWskot ? "Waistcoat" : "Suit";
                                    const description = isStitch
                                        ? <>
                                            <strong style={{ display: 'block' }}>{itemType} {item.product?.name ? `(${item.product.name})` : ''}</strong>
                                            <span style={{ fontSize: '9px', color: '#444' }}>
                                                {(item.selectedOptions || []).map(so => so.stitchingOption?.name).filter(Boolean).join(', ')}
                                            </span>
                                          </>
                                        : <strong>{item.product?.name || 'Product'}</strong>;
                                    
                                    return (
                                        <tr key={idx} style={{ borderBottom: '1px dotted #ddd' }}>
                                            <td style={{ padding: '6px 0', fontSize: '10px', verticalAlign: 'top', lineHeight: '1.3' }}>
                                                {description}
                                                {item.quantity > 1 && (
                                                    <div style={{ fontSize: '9px', color: '#666' }}>
                                                        {item.quantity} x Rs. {unitPr.toLocaleString()}
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ padding: '6px 0', fontSize: '10px', verticalAlign: 'top', textAlign: 'center' }}>
                                                {item.quantity || 1}
                                            </td>
                                            <td style={{ padding: '6px 0', fontSize: '10px', verticalAlign: 'top', textAlign: 'right', fontWeight: 'bold' }}>
                                                Rs. {parseFloat(item.totalPrice || 0).toLocaleString()}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                );
            })()}

            {/* Suit Details Section */}
            {(() => {
                const itemsWithDetails = (booking.items || []).filter(item => suitDetailValue(item).length > 0);
                if (itemsWithDetails.length === 0) return null;

                return (
                    <div style={{ marginTop: '8px', marginBottom: '8px' }}>
                        <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>
                            Order Details:
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <tbody>
                                {itemsWithDetails.map((item, idx) => {
                                    const details = suitDetailValue(item);
                                    const isWskot = item.stitchingType === "WAISTCOAT" || (!item.qameez_lambai && item.wskot_lambai);
                                    const itemType = isWskot ? "Waistcoat" : "Suit";
                                    return (
                                        <tr key={idx} style={{ borderBottom: '1px dotted #ccc' }}>
                                            <td style={{ padding: '4px 0', fontSize: '9px', lineHeight: '1.4' }}>
                                                <span style={{ fontWeight: 'bold' }}>{itemType} #{idx + 1}: </span>
                                                {details.map(([label, val]) => `${label}: ${val}`).join('  |  ')}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                );
            })()}

            {/* Totals Section */}
            {(() => {
                const totalDiscount = (booking.items || []).reduce((sum, item) => sum + parseFloat(item.discount || 0), 0);
                const netTotal = parseFloat(booking.totalAmount || 0);
                const rawTotal = netTotal + totalDiscount;
                
                return (
                    <div style={{ marginTop: '8px', marginBottom: '8px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <tbody>
                                <tr style={{ borderTop: '1px dashed #000' }}>
                                    <td style={{ padding: '4px 0', fontSize: '10px', fontWeight: '600' }}>Total Amount:</td>
                                    <td style={{ padding: '4px 0', fontSize: '10px', textAlign: 'right', fontWeight: 'bold' }}>
                                        Rs. {rawTotal.toLocaleString()}
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '4px 0', fontSize: '10px', fontWeight: '600' }}>Discount Amount:</td>
                                    <td style={{ padding: '4px 0', fontSize: '10px', textAlign: 'right', fontWeight: 'bold', color: '#dc2626' }}>
                                        Rs. {totalDiscount.toLocaleString()}
                                    </td>
                                </tr>
                                <tr style={{ borderTop: '1px dotted #ccc' }}>
                                    <td style={{ padding: '4px 0', fontSize: '10px', fontWeight: '600' }}>Net Total:</td>
                                    <td style={{ padding: '4px 0', fontSize: '10px', textAlign: 'right', fontWeight: 'bold' }}>
                                        Rs. {netTotal.toLocaleString()}
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '4px 0', fontSize: '10px', fontWeight: '600' }}>Advance Amount:</td>
                                    <td style={{ padding: '4px 0', fontSize: '10px', textAlign: 'right', color: '#059669', fontWeight: 'bold' }}>
                                        Rs. {parseFloat(booking.advanceAmount || 0).toLocaleString()}
                                    </td>
                                </tr>
                                <tr style={{ borderTop: '1px dashed #000', borderBottom: '1px solid #000', fontWeight: 'bold' }}>
                                    <td style={{ padding: '6px 0', fontSize: '11px' }}>Remaining Balance:</td>
                                    <td style={{ padding: '6px 0', fontSize: '11px', textAlign: 'right', color: '#dc2626' }}>
                                        Rs. {parseFloat(booking.remainingAmount || 0).toLocaleString()}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                );
            })()}

            {/* Booking Note */}
            {booking.notes && (
                <div style={{ border: '1px dotted #aaa', borderRadius: '4px', padding: '4px 6px', margin: '8px 0', fontSize: '9px', lineHeight: '1.3' }}>
                    <strong>Note:</strong> {booking.notes}
                </div>
            )}

            {/* Footer */}
            <div style={{ textAlign: 'center', marginTop: '12px', marginBottom: '6px', fontSize: '9px', color: '#555' }}>
                <div style={{ borderBottom: '1px dashed #000', marginBottom: '6px' }} />
                <div>Thank you for choosing Grace Cloth and Tailors!</div>
            </div>

        </div>
    );
}

// ─── Merged Customer Bill ──────────────────────────────────────────────────────
function MergedCustomerBill({ bookings }) {
    if (!bookings || bookings.length === 0) return null;
    
    // Sort bookings by bookingNumber or id for consistent layout
    const sortedBookings = [...bookings].sort((a, b) => {
        const numA = parseInt(a.bookingNumber?.replace(/-/g, '')) || a.id;
        const numB = parseInt(b.bookingNumber?.replace(/-/g, '')) || b.id;
        return numA - numB;
    });

    const firstBooking = sortedBookings[0];
    const allSameCustomer = sortedBookings.every(b => b.customerId === firstBooking.customerId);
    const customer = allSameCustomer ? firstBooking.customer : null;

    const firstBillingCust = firstBooking.billingCustomer || firstBooking.customer;
    const allSameBillingCustomer = sortedBookings.every(b => {
        const bc = b.billingCustomer || b.customer;
        return bc?.id === firstBillingCust?.id;
    });
    const billingCust = allSameBillingCustomer ? firstBillingCust : null;

    const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '—';
    const billNumbers = sortedBookings.map(b => `#${b.bookingNumber || b.id}`).join(', ');
    const bookingDates = [...new Set(sortedBookings.map(b => fmt(b.bookingDate)))].join(', ');
    const deliveryDates = [...new Set(sortedBookings.map(b => fmt(b.deliveryDate)))].join(', ');
    const trialDates = [...new Set(sortedBookings.filter(b => b.trialDate).map(b => fmt(b.trialDate)))].join(', ');

    const notesList = sortedBookings.filter(b => b.notes).map(b => `[#${b.bookingNumber || b.id}]: ${b.notes}`);

    const totalAmount = sortedBookings.reduce((sum, b) => sum + parseFloat(b.totalAmount || 0), 0);
    const advanceAmount = sortedBookings.reduce((sum, b) => sum + parseFloat(b.advanceAmount || 0), 0);
    const remainingAmount = sortedBookings.reduce((sum, b) => sum + parseFloat(b.remainingAmount || 0), 0);

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

    return (
        <div style={{ fontFamily: 'Arial, sans-serif', color: '#000', width: '100%', boxSizing: 'border-box' }}>
            {/* Custom POS Header */}
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <img src="/logo.png" alt="Logo" style={{ width: '45px', height: '45px', objectFit: 'contain' }} />
                    <div style={{ fontSize: '15px', fontWeight: '900', letterSpacing: '0.5px', color: '#000', textTransform: 'uppercase' }}>
                        Grace Cloth and Tailors
                    </div>
                    <div style={{ fontSize: '9px', color: '#555', fontStyle: 'italic', marginTop: '-2px' }}>
                        Where Style Meets Perfection
                    </div>
                    <div style={{ fontSize: '10px', fontWeight: '600', color: '#000', marginTop: '2px' }}>
                        📞 03006284318 | 03186284318
                    </div>
                    <div style={{ fontSize: '9px', color: '#333' }}>
                        Basement of Faazal Plaza, Dhulyan Chowk Dinga
                    </div>
                </div>
                <div style={{ borderBottom: '1px dashed #000', margin: '8px 0 6px 0' }} />
                <div style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Merged Customer Bill
                </div>
                <div style={{ borderBottom: '1px dashed #000', margin: '6px 0 8px 0' }} />
            </div>

            {/* Booking & Customer details */}
            <div style={{ fontSize: '10px', lineHeight: '1.4', marginBottom: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                        {sortedBookings.map((b, idx) => {
                            const bc = b.customer || {};
                            return (
                                <tr key={b.id} style={{ borderBottom: idx < sortedBookings.length - 1 ? '1px dotted #ccc' : 'none' }}>
                                    <td style={{ padding: '4px 0', verticalAlign: 'top' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '11px' }}>
                                            <span>Bill No: #{b.bookingNumber || b.id}</span>
                                            <span style={{ fontSize: '10px', fontWeight: 'normal', color: '#555' }}>
                                                Bk Date: {fmt(b.bookingDate)} | Del: {fmt(b.deliveryDate)}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '2px' }}>
                                            <strong>Customer:</strong>
                                            <span style={{ fontWeight: 'bold', fontSize: '13px', textAlign: 'right' }}>
                                                {bc.name || '—'} {bc.phone ? ` (${bc.phone})` : ''}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#333' }}>
                                            <strong>Address:</strong>
                                            <span style={{ fontWeight: 'bold', fontSize: '13px', textAlign: 'right' }}>
                                                {bc.address || '—'} {bc.measurementNo ? ` | M#: ${bc.measurementNo}` : ''}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                <div style={{ borderBottom: '1px dashed #000', margin: '6px 0' }} />
            </div>

            {/* Items Section */}
            <div style={{ marginBottom: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px dashed #000' }}>
                            <th style={{ textAlign: 'left', padding: '4px 0', fontSize: '10px', fontWeight: 'bold' }}>Description</th>
                            <th style={{ textAlign: 'center', padding: '4px 0', fontSize: '10px', fontWeight: 'bold', width: '30px' }}>Qty</th>
                            <th style={{ textAlign: 'right', padding: '4px 0', fontSize: '10px', fontWeight: 'bold', width: '70px' }}>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedBookings.map((booking) => {
                            const stitchItems = (booking.items || []).filter(item => (item.selectedOptions || []).length > 0);
                            const prodItems = (booking.items || []).filter(item => (item.selectedOptions || []).length === 0 && item.productId);
                            const allItems = [...stitchItems, ...prodItems];
                            
                            return allItems.map((item, idx) => {
                                const isStitch = (item.selectedOptions || []).length > 0;
                                const unitPr = isStitch
                                    ? (item.quantity > 1 ? parseFloat(item.totalPrice || 0) / item.quantity : parseFloat(item.totalPrice || 0))
                                    : parseFloat(item.unitPrice || 0);
                                
                                const isWskot = item.stitchingType === "WAISTCOAT" || (!item.qameez_lambai && item.wskot_lambai);
                                const itemType = isWskot ? "Waistcoat" : "Suit";
                                const description = isStitch
                                    ? <>
                                        <strong style={{ display: 'block' }}>{itemType} {item.product?.name ? `(${item.product.name})` : ''}</strong>
                                        <span style={{ fontSize: '9px', color: '#444' }}>
                                            {(item.selectedOptions || []).map(so => so.stitchingOption?.name).filter(Boolean).join(', ')}
                                        </span>
                                      </>
                                    : <strong>{item.product?.name || 'Product'}</strong>;
                                
                                return (
                                    <tr key={`${booking.id}-${idx}`} style={{ borderBottom: '1px dotted #ddd' }}>
                                        <td style={{ padding: '6px 0', fontSize: '10px', verticalAlign: 'top', lineHeight: '1.3' }}>
                                            {description}
                                            <div style={{ fontSize: '9px', color: '#7c3aed', fontWeight: 600 }}>
                                                Bill: #{booking.bookingNumber || booking.id}
                                            </div>
                                            {item.quantity > 1 && (
                                                <div style={{ fontSize: '9px', color: '#666' }}>
                                                    {item.quantity} x Rs. {unitPr.toLocaleString()}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '6px 0', fontSize: '10px', verticalAlign: 'top', textAlign: 'center' }}>
                                            {item.quantity || 1}
                                        </td>
                                        <td style={{ padding: '6px 0', fontSize: '10px', verticalAlign: 'top', textAlign: 'right', fontWeight: 'bold' }}>
                                            Rs. {parseFloat(item.totalPrice || 0).toLocaleString()}
                                        </td>
                                    </tr>
                                );
                            });
                        })}
                    </tbody>
                </table>
            </div>

            {/* Suit Details Section */}
            {(() => {
                const itemsWithDetails = sortedBookings.flatMap((booking) => 
                    (booking.items || [])
                        .filter(item => suitDetailValue(item).length > 0)
                        .map(item => ({ booking, item }))
                );
                
                if (itemsWithDetails.length === 0) return null;

                return (
                    <div style={{ marginTop: '8px', marginBottom: '8px' }}>
                        <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>
                            Order Details:
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <tbody>
                                {itemsWithDetails.map(({ booking, item }, idx) => {
                                    const details = suitDetailValue(item);
                                    const isWskot = item.stitchingType === "WAISTCOAT" || (!item.qameez_lambai && item.wskot_lambai);
                                    const itemType = isWskot ? "Waistcoat" : "Suit";
                                    return (
                                        <tr key={idx} style={{ borderBottom: '1px dotted #ccc' }}>
                                            <td style={{ padding: '4px 0', fontSize: '9px', lineHeight: '1.4' }}>
                                                <span style={{ fontWeight: 'bold' }}>{itemType} #{idx + 1} (Bill #{booking.bookingNumber || booking.id}): </span>
                                                {details.map(([label, val]) => `${label}: ${val}`).join('  |  ')}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                );
            })()}

            {/* Totals Section */}
            {(() => {
                const totalDiscount = sortedBookings.reduce((sum, b) => {
                    return sum + (b.items || []).reduce((s, item) => s + parseFloat(item.discount || 0), 0);
                }, 0);
                const netTotal = totalAmount;
                const rawTotal = netTotal + totalDiscount;
                
                return (
                    <div style={{ marginTop: '8px', marginBottom: '8px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <tbody>
                                <tr style={{ borderTop: '1px dashed #000' }}>
                                    <td style={{ padding: '4px 0', fontSize: '10px', fontWeight: '600' }}>Total Amount:</td>
                                    <td style={{ padding: '4px 0', fontSize: '10px', textAlign: 'right', fontWeight: 'bold' }}>
                                        Rs. {rawTotal.toLocaleString()}
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '4px 0', fontSize: '10px', fontWeight: '600' }}>Discount Amount:</td>
                                    <td style={{ padding: '4px 0', fontSize: '10px', textAlign: 'right', fontWeight: 'bold', color: '#dc2626' }}>
                                        Rs. {totalDiscount.toLocaleString()}
                                    </td>
                                </tr>
                                <tr style={{ borderTop: '1px dotted #ccc' }}>
                                    <td style={{ padding: '4px 0', fontSize: '10px', fontWeight: '600' }}>Net Total:</td>
                                    <td style={{ padding: '4px 0', fontSize: '10px', textAlign: 'right', fontWeight: 'bold' }}>
                                        Rs. {netTotal.toLocaleString()}
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '4px 0', fontSize: '10px', fontWeight: '600' }}>Advance Amount:</td>
                                    <td style={{ padding: '4px 0', fontSize: '10px', textAlign: 'right', color: '#059669', fontWeight: 'bold' }}>
                                        Rs. {advanceAmount.toLocaleString()}
                                    </td>
                                </tr>
                                <tr style={{ borderTop: '1px dashed #000', borderBottom: '1px solid #000', fontWeight: 'bold' }}>
                                    <td style={{ padding: '6px 0', fontSize: '11px' }}>Remaining Balance:</td>
                                    <td style={{ padding: '6px 0', fontSize: '11px', textAlign: 'right', color: '#dc2626' }}>
                                        Rs. {remainingAmount.toLocaleString()}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                );
            })()}

            {/* Booking Notes */}
            {notesList.length > 0 && (
                <div style={{ border: '1px dotted #aaa', borderRadius: '4px', padding: '4px 6px', margin: '8px 0', fontSize: '9px', lineHeight: '1.3' }}>
                    <strong>Notes:</strong>
                    {notesList.map((n, i) => (
                        <div key={i} style={{ marginTop: i > 0 ? '4px' : '0' }}>{n}</div>
                    ))}
                </div>
            )}

            {/* Footer */}
            <div style={{ textAlign: 'center', marginTop: '12px', marginBottom: '6px', fontSize: '9px', color: '#555' }}>
                <div style={{ borderBottom: '1px dashed #000', marginBottom: '6px' }} />
                <div>Thank you for choosing Grace Cloth and Tailors!</div>
            </div>

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

    const getMeasureRows = (src, isWskot) => {
        if (isWskot) {
            return [
                ['واسکٹ لمبائی', src?.wskot_lambai],
                ['تیرہ', src?.wskot_teera],
                ['گلا', src?.wskot_gala],
                ['چھاتی', src?.wskot_chaati],
                ['کمر', src?.wskot_kamar],
                ['ہپ', src?.wskot_hip],
            ];
        }
        return [
            ['قمیض', src?.qameez_lambai],
            ['تیرہ', src?.teera],
            ['بازو', src?.bazoo],
            ['گلا', src?.galaa],
            ['چھاتی گرد', src?.chaati_around],
            ['گھیرا گرد', src?.gehra_gird],
            ['شلوار لمبائی', src?.shalwar_lambai],
            ['پہنچہ', src?.puhncha],
            ['شلوار گھیرا', src?.shalwar_gheera],
            ['ہپ گرد', src?.hip_around],
        ];
    };

    const getStitchingBoxes = (item) => {
        const boxes = [];
        if (item.galaType) boxes.push(item.galaType === 'ban' ? `Gala: Ban${item.galaSize ? ` ${item.galaSize}"` : ''}` : `Gala: Collar${item.galaSize ? ` ${item.galaSize}"` : ''}`);
        if (item.cuffType) boxes.push(item.cuffType === 'single' ? 'Cuff: Single' : item.cuffType === 'double folding' ? 'Cuff: Double' : 'Cuff: Open');
        if (item.pohnchaType) boxes.push(`Poncha: ${item.pohnchaType === 'saada' ? 'Saada' : item.pohnchaType === 'jaali' ? 'Jaali' : item.pohnchaType === 'karhaai' ? 'Karhai' : 'J+K'}`);
        if (item.gheraType) boxes.push(`Ghera: ${item.gheraType === 'seedha' ? 'Seedha' : 'Gol'}`);
        if (item.pocketType) boxes.push(`Pocket: ${item.pocketType === 'single' ? 'Single' : 'Double'}`);
        if (item.shalwarType) boxes.push(`Shalwar: ${item.shalwarType === 'pajama' ? 'Pajama' : 'Shalwar'}`);
        if (item.hasFrontPockets) boxes.push('Front Pockets');
        if (item.hasShalwarPocket) boxes.push('Shalwar Pocket');
        (item.selectedOptions || []).forEach(so => { if (so.stitchingOption?.name) boxes.push(so.stitchingOption.name); });
        return boxes;
    };

    return (
        <div style={{ fontFamily: 'Arial, sans-serif', color: '#000', width: '100%', boxSizing: 'border-box' }}>
            <PrintHeader />

            {/* Title */}
            <div style={{ textAlign: 'center', margin: '6px 0', fontSize: 14, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: '#1a1a2e' }}>
                Stitching Details &nbsp;|&nbsp; بکنگ پرچی
            </div>

            {/* Info bar */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 8, fontSize: 15, border: '1px solid #000' }}>
                <tbody>
                    <tr>
                        <td style={{ ...cell, fontWeight: 700, width: '13%' }}>Customer:</td>
                        <td style={{ ...cell, fontWeight: 700, width: '22%', fontSize: 13 }}>{booking.customer?.name}</td>
                        <td style={{ ...cell, fontWeight: 700, width: '11%' }}>Meas. No:</td>
                        <td style={{ ...cell, fontWeight: 700, width: '14%' }}>{booking.customer?.measurementNo || '—'}</td>
                        <td style={{ ...cell, fontWeight: 700, width: '10%' }}>Booking #:</td>
                        <td style={{ ...cell, width: '15%', fontWeight: 800, color: '#1a1a2e' }}>{booking.bookingNumber || booking.id}</td>
                        <td style={{ ...cell, fontWeight: 700, width: '7%' }}>Date:</td>
                        <td style={{ ...cell, width: '8%' }}>{fmt(booking.bookingDate)}</td>
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

            {/* Per-suit block — first stitching item only */}
            {(() => {
                const stitchingItems = (booking.items || []).filter(item => !item.productId);
                const totalSuitsQty = stitchingItems.reduce((sum, item) => sum + (parseFloat(item.quantity) || 1), 0);
                return stitchingItems.slice(0, 1).map((item, idx) => {
                    const isWskot = item.stitchingType === "WAISTCOAT" || (!item.qameez_lambai && item.wskot_lambai);
                    const src = measurements && Object.keys(measurements).length > 0 ? measurements : item;
                    const measureRows = getMeasureRows(src, isWskot);

                    return (
                        <div key={idx} style={{ border: '1px solid #000', marginBottom: 10, pageBreakInside: 'avoid', breakInside: 'avoid' }}>

                            {/* Suit header row */}
                            <div style={{ backgroundColor: '#1a1a2e', color: '#fff', padding: '3px 8px', fontWeight: 700, fontSize: 12, display: 'flex', justifyContent: 'space-between' }}>
                                <span>{isWskot ? 'Waistcoat' : 'Suit'} {idx + 1}{item.product?.name ? ` — ${item.product.name}` : ''}</span>
                                <span>Qty: {totalSuitsQty > 3 ? totalSuitsQty : (item.quantity || 1)}</span>
                            </div>

                        {/* 3-column body */}
                        <div style={{ display: 'flex', alignItems: 'stretch' }}>

                            {/* ── Notes column ── */}
                            <div style={{ flex: 1, borderRight: '1px solid #000' }}>
                                <div style={{ backgroundColor: '#f0f0f0', padding: '4px 8px', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #000' }}>
                                    Notes
                                </div>
                                <div style={{
                                    border: '1px solid #000',
                                    margin: '5px',
                                    padding: '8px 10px',
                                    fontSize: 15,
                                    minHeight: 150,
                                    fontWeight: 600,
                                    lineHeight: 1.6,
                                    whiteSpace: 'pre-wrap',
                                }}>
                                    {item.itemNote || ''}
                                </div>
                                {measurements?.notes && (
                                    <div style={{
                                        borderTop: '1px dashed #999',
                                        margin: '0 5px 5px 5px',
                                        padding: '6px 10px',
                                        fontSize: 13,
                                        fontWeight: 600,
                                        lineHeight: 1.5,
                                        whiteSpace: 'pre-wrap',
                                        color: '#333',
                                    }}>
                                        <span style={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>Meas. Notes: </span>
                                        {measurements.notes}
                                    </div>
                                )}
                            </div>

                            {/* ── Stitching options column ── */}
                            <div style={{ flex: '0 0 30%', borderRight: '1px solid #000', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ backgroundColor: '#f0f0f0', padding: '4px 8px', fontSize: 13, fontWeight: 700, borderBottom: '1px solid #000', fontFamily: "'Alvi Lahori Nastaleeq', 'Alvi Nastaleeq', 'Noto Nastaliq Urdu', Urdu, sans-serif" }}>
                                        کندھا، چھاتی، کمر، گھیرا، کف (بائیں طرف)
                                    </div>
                                    {!isWskot && (
                                        <table style={{ width: '100%', borderCollapse: 'collapse', borderTop: '1px solid #000' }}>
                                            <tbody>
                                                {[
                                                    ['کندھا', src?.kandha],
                                                    ['چھاتی', src?.chaati],
                                                    ['کمر', src?.kamar_around],
                                                    ['گھیرا', src?.gheera],
                                                    ['کف', src?.kaf],
                                                ].map(([label, val], i) => (
                                                    <tr key={i}>
                                                        <td style={{ padding: '16px 8px', fontSize: 15, borderBottom: '1px solid #ddd', textAlign: 'left', verticalAlign: 'middle' }}>
                                                            {val || ''}
                                                        </td>
                                                        <td style={{ padding: '16px 10px', fontSize: 15, fontWeight: 600, borderBottom: '1px solid #ddd', borderLeft: '1px solid #000', width: '45%', whiteSpace: 'nowrap', textAlign: 'right', verticalAlign: 'middle', fontFamily: "'Alvi Lahori Nastaleeq', 'Alvi Nastaleeq', 'Noto Nastaliq Urdu', Urdu, sans-serif" }}>
                                                            {label}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                    <div style={{ padding: '4px' }}>
                                        {(() => {
                                            const options = getStitchingBoxes(item);
                                            return Array.from({ length: Math.max(5, options.length) }, (_, i) => {
                                                const val = options[i] || '';
                                                return (
                                                    <div key={i} style={{
                                                        border: '1px solid #000',
                                                        margin: '3px 0',
                                                        padding: '6px 8px',
                                                        fontSize: 12,
                                                        minHeight: 30,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        fontWeight: val ? 700 : 400,
                                                        backgroundColor: val ? '#f9fafb' : 'transparent',
                                                    }}>
                                                        {val}
                                                    </div>
                                                );
                                            });
                                        })()}
                                    </div>
                                </div>
                                {/* ── Pockets sub-section for Suit ── */}
                                {!isWskot && (
                                    <div style={{ borderTop: '1px solid #000', padding: 6, backgroundColor: '#fcfcfc' }}>
                                        <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 11, marginBottom: 4, color: '#333' }}>جیب (POCKETS)</div>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: 10, border: '1px solid #000' }}>
                                            <thead>
                                                <tr style={{ backgroundColor: '#f0f0f0' }}>
                                                    <th style={{ border: '1px solid #000', padding: 2, fontWeight: 700, width: '33.33%' }}>F</th>
                                                    <th style={{ border: '1px solid #000', padding: 2, fontWeight: 700, width: '33.33%' }}>Side</th>
                                                    <th style={{ border: '1px solid #000', padding: 2, fontWeight: 700, width: '33.33%' }}>Shalwar</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td style={{ border: '1px solid #000', padding: 4, height: 24, fontWeight: 700, fontSize: 11 }}>{src?.front_pocket || ''}</td>
                                                    <td style={{ border: '1px solid #000', padding: 4, height: 24, fontWeight: 700, fontSize: 11 }}>{src?.side_pocket || ''}</td>
                                                    <td style={{ border: '1px solid #000', padding: 4, height: 24, fontWeight: 700, fontSize: 11 }}>{src?.shalwar_pocket || ''}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* ── Measurements column ── */}
                            <div style={{ flex: '0 0 42%', borderRight: 'none' }}>
                                <div style={{ backgroundColor: '#f0f0f0', padding: '4px 8px', fontSize: 13, fontWeight: 700, borderBottom: '1px solid #000', fontFamily: "'Alvi Lahori Nastaleeq', 'Alvi Nastaleeq', 'Noto Nastaliq Urdu', Urdu, sans-serif" }}>
                                    قمیض (دائیں طرف)
                                </div>
                                <table style={{ width: '100%', borderCollapse: 'collapse', borderTop: '1px solid #000' }}>
                                    <tbody>
                                        {measureRows.map(([label, val], i) => (
                                            <tr key={i}>
                                                <td style={{ padding: '16px 8px', fontSize: 15, borderBottom: '1px solid #ddd', textAlign: 'left', verticalAlign: 'middle' }}>
                                                    {val || ''}
                                                </td>
                                                <td style={{ padding: '16px 10px', fontSize: 15, fontWeight: 600, borderBottom: '1px solid #ddd', borderLeft: '1px solid #000', width: '45%', whiteSpace: 'nowrap', textAlign: 'right', verticalAlign: 'middle', fontFamily: "'Alvi Lahori Nastaleeq', 'Alvi Nastaleeq', 'Noto Nastaliq Urdu', Urdu, sans-serif" }}>
                                                    {label}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );
            })})()}

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
    const { data: session } = useSession();
    const isAdmin = session?.user?.role === "ADMIN";
    const stitchingOptions = initialStitchingOptions || [];
    
    // Helper to merge initial customers with any customer references inside the bookings list
    const getInitialCustomerOptions = () => {
        const customerMap = new Map();
        if (Array.isArray(customers)) {
            customers.forEach(c => {
                if (c && c.id) customerMap.set(c.id, c);
            });
        }
        if (Array.isArray(initialBookings)) {
            initialBookings.forEach(b => {
                if (b.customer && b.customer.id) {
                    customerMap.set(b.customer.id, b.customer);
                }
                if (b.billingCustomer && b.billingCustomer.id) {
                    customerMap.set(b.billingCustomer.id, b.billingCustomer);
                }
            });
        }
        return Array.from(customerMap.values());
    };

    const [customerOptions, setCustomerOptions] = useState(getInitialCustomerOptions);
    const [customerSearchInput, setCustomerSearchInput] = useState("");
    const [searchingCustomers, setSearchingCustomers] = useState(false);
    const [customerSearchFilters, setCustomerSearchFilters] = useState({
        name: "",
        fatherName: "",
        phone: "",
        address: "",
        measurementNo: ""
    });
    const [showCustomerGrid, setShowCustomerGrid] = useState(false);

    const filteredCustomers = (customerOptions || []).filter(c => {
        if (!c) return false;
        const matchName = !customerSearchFilters.name || (c.name || "").toLowerCase().includes(customerSearchFilters.name.toLowerCase());
        const matchFather = !customerSearchFilters.fatherName || (c.fatherName || "").toLowerCase().includes(customerSearchFilters.fatherName.toLowerCase());
        const matchPhone = !customerSearchFilters.phone || (c.phone || "").toLowerCase().includes(customerSearchFilters.phone.toLowerCase());
        const matchAddress = !customerSearchFilters.address || (c.address || "").toLowerCase().includes(customerSearchFilters.address.toLowerCase());
        const matchMeas = !customerSearchFilters.measurementNo || (c.measurementNo || "").toLowerCase().includes(customerSearchFilters.measurementNo.toLowerCase());
        return matchName && matchFather && matchPhone && matchAddress && matchMeas;
    });

    const hasActiveSearch = Object.values(customerSearchFilters).some(val => val.trim() !== "");

    const handleSearchCustomers = async (query) => {
        if (!query.trim()) return;
        try {
            setSearchingCustomers(true);
            const res = await fetch(`/api/customers?search=${encodeURIComponent(query)}&limit=100`);
            if (res.ok) {
                const data = await res.json();
                const fetched = data.customers || [];
                
                setCustomerOptions(prev => {
                    const map = new Map(prev.map(c => [c.id, c]));
                    fetched.forEach(c => {
                        if (c && c.id) map.set(c.id, c);
                    });
                    return Array.from(map.values());
                });
            }
        } catch (err) {
            console.error("Failed to search customers:", err);
        } finally {
            setSearchingCustomers(false);
        }
    };

    React.useEffect(() => {
        if (!customerSearchInput.trim()) return;
        const timer = setTimeout(() => {
            handleSearchCustomers(customerSearchInput);
        }, 300);
        return () => clearTimeout(timer);
    }, [customerSearchInput]);

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

    // Payment Modal State
    const [payDialogOpen, setPayDialogOpen] = useState(false);
    const [payBooking, setPayBooking] = useState(null);
    const [payReceived, setPayReceived] = useState("");
    const [paying, setPaying] = useState(false);

    const handleOpenPayDialog = (booking) => {
        setPayBooking(booking);
        setPayReceived(parseFloat(booking.remainingAmount || 0).toString());
        setPayDialogOpen(true);
    };

    // Checkout Wizard State
    const [checkoutOpen, setCheckoutOpen] = useState(false);
    const [checkoutBooking, setCheckoutBooking] = useState(null);
    const [checkoutStep, setCheckoutStep] = useState(1);
    const [checkoutQuantities, setCheckoutQuantities] = useState({});
    const [checkoutDiscount, setCheckoutDiscount] = useState("");
    const [checkoutCashReceived, setCheckoutCashReceived] = useState("");

    const handleOpenCheckout = (booking) => {
        setCheckoutBooking(booking);
        setCheckoutStep(1);
        setCheckoutDiscount("");
        setCheckoutCashReceived("");
        
        // Initialize checkout quantities to all remaining undelivered quantities
        const initialQuants = {};
        (booking.items || []).forEach(item => {
            if (item.itemStatus !== "DELIVERED") {
                initialQuants[item.id] = parseFloat(item.quantity) || 1;
            }
        });
        setCheckoutQuantities(initialQuants);
        setCheckoutOpen(true);
    };

    const handleCheckoutSubmit = async () => {
        if (!checkoutBooking) return;
        setPaying(true);
        setError("");
        try {
            const itemsToDeliver = Object.entries(checkoutQuantities).map(([itemId, qty]) => ({
                itemId: parseInt(itemId),
                quantityToDeliver: parseFloat(qty) || 0
            }));

            const response = await fetch("/api/bookings/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    bookingId: checkoutBooking.id,
                    itemsToDeliver,
                    discount: parseFloat(checkoutDiscount) || 0,
                    cashReceived: parseFloat(checkoutCashReceived) || 0
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Failed to process checkout");
            }

            const refreshRes = await fetch("/api/bookings");
            const refreshed = await refreshRes.json();
            setBookings(Array.isArray(refreshed) ? refreshed : []);

            setSuccessMessage("Checkout processed successfully!");
            setCheckoutOpen(false);
        } catch (err) {
            setError(err.message);
        } finally {
            setPaying(false);
        }
    };

    const handlePaySubmit = async (workflow) => {
        if (!payBooking) return;
        setPaying(true);
        setError("");
        try {
            const amount = parseFloat(payReceived) || 0;
            if (amount < 0) {
                throw new Error("Payment amount cannot be negative");
            }
            if (workflow === "FULL_PAY" && amount < parseFloat(payBooking.remainingAmount)) {
                throw new Error("Full pay requires paying the entire remaining amount");
            }

            const res = await fetch("/api/bookings/pay", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    bookingId: payBooking.id,
                    paymentAmount: amount,
                    workflow
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to process payment");
            }

            // Refresh bookings
            const refreshRes = await fetch("/api/bookings");
            const refreshed = await refreshRes.json();
            setBookings(Array.isArray(refreshed) ? refreshed : []);

            setSuccessMessage("Payment processed successfully!");
            setPayDialogOpen(false);
        } catch (err) {
            setError(err.message);
        } finally {
            setPaying(false);
        }
    };

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


    const handlePrintList = () => {
        const bookings = filteredBookings;
        if (bookings.length === 0) return;
        const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '—';
        const dateFrom = filterDateFrom || filterDeliveryFrom || null;
        const dateTo = filterDateTo || filterDeliveryTo || null;

        const totalSuitsSum = bookings.reduce((sum, booking) => {
            const qty = (booking.items || []).filter(i => !i.productId).reduce((s, i) => s + (parseFloat(i.quantity) || 1), 0);
            return sum + qty;
        }, 0);

        const rowsHtml = bookings.map((booking, idx) => {
            const tailorNames = (booking.staff || []).filter(s => s.role === 'TAILOR').map(s => s.customer?.name).join(', ');
            const totalQty = (booking.items || []).filter(i => !i.productId).reduce((s, i) => s + (parseFloat(i.quantity) || 1), 0);
            const bg = idx % 2 === 0 ? '#f9f9f9' : '#ffffff';
            return `<tr style="background:${bg}">
                <td style="border:1px solid #ddd;padding:4px 6px;font-weight:700;color:#7c3aed">#${booking.bookingNumber || booking.id}</td>
                <td style="border:1px solid #ddd;padding:4px 6px;font-weight:600">${booking.customer?.name || '—'}</td>
                <td style="border:1px solid #ddd;padding:4px 6px">${booking.customer?.address || '—'}</td>
                <td style="border:1px solid #ddd;padding:4px 6px">${booking.customer?.measurementNo || '—'}</td>
                <td style="border:1px solid #ddd;padding:4px 6px">${fmt(booking.bookingDate)}</td>
                <td style="border:1px solid #ddd;padding:4px 6px">${fmt(booking.deliveryDate)}</td>
                <td style="border:1px solid #ddd;padding:4px 6px">${tailorNames || '—'}</td>
                <td style="border:1px solid #ddd;padding:4px 6px">${totalQty}</td>
                <td style="border:1px solid #ddd;padding:4px 6px;font-size:10px">${booking.notes || '—'}</td>
            </tr>`;
        }).join('');

        const periodHtml = (dateFrom || dateTo)
            ? `<div style="text-align:center;font-size:11px;color:#555;margin-bottom:6px">Period: ${dateFrom ? fmt(dateFrom) : '—'} to ${dateTo ? fmt(dateTo) : '—'}</div>`
            : '';

        const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Booking List Report</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,sans-serif;color:#000;padding:12px;font-size:11px}
.hdr{border-bottom:3px solid #1a1a2e;padding-bottom:8px;margin-bottom:10px;display:flex;align-items:center;gap:12px}
.hdr img{width:56px;height:56px;object-fit:contain}
.hdr-text{flex:1;text-align:center}
.hdr-text h1{font-size:20px;font-weight:900;letter-spacing:1px;color:#1a1a2e;text-transform:uppercase}
.hdr-text .tagline{font-size:11px;color:#555;font-style:italic;margin-top:2px}
.hdr-text .phone{font-size:11px;color:#222;margin-top:3px}
.hdr-text .address{font-size:10px;color:#444;margin-top:2px}
table{width:100%;border-collapse:collapse}
thead tr{background:#1a1a2e;color:#fff}
th{border:1px solid #555;padding:5px 6px;text-align:left}
tfoot tr{background:#1a1a2e;color:#fff;font-weight:700}
tfoot td{border:1px solid #555;padding:5px 6px;text-align:right}
@media print{body{padding:0}@page{size:A4 portrait;margin:10mm}}
</style>
</head>
<body>
<div class="hdr">
    <img src="/logo.png" alt="Logo"/>
    <div class="hdr-text">
        <h1>Grace Cloth and Tailors</h1>
        <div class="tagline">Where Style Meets Perfection</div>
        <div class="phone">📞 03006284318 &nbsp;|&nbsp; 03186284318</div>
        <div class="address">Basement of Faazal Plaza, Dhulyan Chowk Dinga</div>
    </div>
</div>
<div style="text-align:center;font-size:14px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#1a1a2e;margin:8px 0">Booking List Report</div>
${periodHtml}
<div style="text-align:center;font-size:11px;color:#555;margin-bottom:10px">Total Bookings: <strong>${bookings.length}</strong></div>
<table>
    <thead>
        <tr>
            <th style="width:10%">Booking No</th>
            <th style="width:12%">Customer Name</th>
            <th style="width:15%">Address</th>
            <th style="width:10%">Measurement No</th>
            <th style="width:9%">Booking Date</th>
            <th style="width:9%">Delivery Date</th>
            <th style="width:10%">Tailor Name</th>
            <th style="width:10%">Suit Qty</th>
            <th style="width:15%">Notes</th>
        </tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
    <tfoot>
        <tr style="background:#1a1a2e;color:#fff;font-weight:700;">
            <td colspan="7" style="border:1px solid #555;padding:5px 6px;text-align:right;">TOTAL (${bookings.length} bookings):</td>
            <td style="border:1px solid #555;padding:5px 6px;text-align:left;">${totalSuitsSum}</td>
            <td style="border:1px solid #555;padding:5px 6px;"></td>
        </tr>
    </tfoot>
</table>
<script>window.onload=()=>{window.print()}<\/script>
</body>
</html>`;

        const win = window.open('', '_blank');
        win.document.write(html);
        win.document.close();
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
    const SUIT_MEASUREMENT_KEYS = [
        "qameez_lambai", "bazoo", "teera", "galaa", "chaati",
        "gheera", "kaf", "gehra_gird", "kandha", "chaati_around", "kamar_around",
        "hip_around", "shalwar_lambai", "puhncha", "shalwar_gheera",
        "front_pocket", "side_pocket", "shalwar_pocket"
    ];

    const WAISTCOAT_MEASUREMENT_KEYS = [
        "wskot_lambai", "wskot_teera", "wskot_gala", "wskot_chaati", "wskot_kamar", "wskot_hip"
    ];

    const MEASUREMENT_KEYS = [...SUIT_MEASUREMENT_KEYS, ...WAISTCOAT_MEASUREMENT_KEYS];

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

    const openStitchingTicketWindow = (bookingOrBookings, measurements) => {
        const bookingList = Array.isArray(bookingOrBookings) ? bookingOrBookings : [bookingOrBookings];
        if (bookingList.length === 0) return;

        const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '—';

        const buildBookingHtml = (booking, meas) => {
            const tailors = (booking.staff || []).filter(s => s.role === 'TAILOR').map(s => s.customer?.name).join(', ');
            const cutters = (booking.staff || []).filter(s => s.role === 'CUTTER').map(s => s.customer?.name).join(', ');
            const stitchingItems = (booking.items || []).filter(item => !item.productId);

            const getStitchingBoxes = (item) => {
                const boxes = [];
                if (item.galaType) boxes.push(item.galaType === 'ban' ? `Gala: Ban${item.galaSize ? ` ${item.galaSize}"` : ''}` : `Gala: Collar${item.galaSize ? ` ${item.galaSize}"` : ''}`);
                if (item.cuffType) boxes.push(item.cuffType === 'single' ? 'Cuff: Single' : item.cuffType === 'double folding' ? 'Cuff: Double' : 'Cuff: Open');
                if (item.pohnchaType) boxes.push(`Poncha: ${item.pohnchaType === 'saada' ? 'Saada' : item.pohnchaType === 'jaali' ? 'Jaali' : item.pohnchaType === 'karhaai' ? 'Karhai' : 'J+K'}`);
                if (item.gheraType) boxes.push(`Ghera: ${item.gheraType === 'seedha' ? 'Seedha' : 'Gol'}`);
                if (item.pocketType) boxes.push(`Pocket: ${item.pocketType === 'single' ? 'Single' : 'Double'}`);
                if (item.shalwarType) boxes.push(`Shalwar: ${item.shalwarType === 'pajama' ? 'Pajama' : 'Shalwar'}`);
                if (item.hasFrontPockets) boxes.push('Front Pockets');
                if (item.hasShalwarPocket) boxes.push('Shalwar Pocket');
                (item.selectedOptions || []).forEach(so => { if (so.stitchingOption?.name) boxes.push(so.stitchingOption.name); });
                return boxes;
            };

            const totalSuitsQty = stitchingItems.reduce((sum, item) => sum + (parseFloat(item.quantity) || 1), 0);

            const itemsHtml = stitchingItems.slice(0, 1).map((item, idx) => {
                const isWskot = item.stitchingType === "WAISTCOAT" || (!item.qameez_lambai && item.wskot_lambai);
                const src = meas && Object.keys(meas).length > 0 ? meas : item;

                const measureFields = isWskot ? [
                    ['واسکٹ لمبائی', 'wskot_lambai'],
                    ['تیرہ', 'wskot_teera'],
                    ['گلا', 'wskot_gala'],
                    ['چھاتی', 'wskot_chaati'],
                    ['کمر', 'wskot_kamar'],
                    ['ہپ', 'wskot_hip'],
                ] : [
                    ['قمیض', 'qameez_lambai'],
                    ['تیرہ', 'teera'],
                    ['بازو', 'bazoo'],
                    ['گلا', 'galaa'],
                    ['چھاتی گرد', 'chaati_around'],
                    ['گھیرا گرد', 'gehra_gird'],
                    ['شلوار لمبائی', 'shalwar_lambai'],
                    ['پہنچہ', 'puhncha'],
                    ['شلوار گھیرا', 'shalwar_gheera'],
                    ['ہپ گرد', 'hip_around'],
                ];

                const measureRowsHtml = measureFields.map(([label, key]) => {
                    const val = src[key];
                    return `<tr>
                        <td class="mv" style="border-left:none;text-align:left;">${val ? `<span class="ul">${val}</span>` : ''}</td>
                        <td class="ml" style="border-left:1px solid #000;text-align:right;">${label}</td>
                    </tr>`;
                }).join('');

                const stitchFields = isWskot ? [] : [
                    ['کندھا', 'kandha'],
                    ['چھاتی', 'chaati'],
                    ['کمر', 'kamar_around'],
                    ['گھیرا', 'gheera'],
                    ['کف', 'kaf'],
                ];

                const stitchRowsHtml = stitchFields.map(([label, key]) => {
                    const val = src[key];
                    return `<tr>
                        <td class="mv" style="border-left:none;text-align:left;">${val ? `<span class="ul">${val}</span>` : ''}</td>
                        <td class="ml" style="border-left:1px solid #000;text-align:right;">${label}</td>
                    </tr>`;
                }).join('');

                const options = getStitchingBoxes(item);
                const boxesHtml = Array.from({ length: Math.max(5, options.length) }, (_, i) => {
                    const val = options[i] || '';
                    return `<div class="sbox" style="border:1px solid #000;margin:3px 0;padding:6px;min-height:30px;font-size:12px;display:flex;align-items:center;padding-left:8px;font-weight:${val ? '700' : '400'};background:${val ? '#f9fafb' : 'transparent'};">${val}</div>`;
                }).join('');

                return `
                <div class="suit" style="margin-top:10px;">
                    <div class="suit-hdr">
                        <span>${isWskot ? 'Waistcoat' : 'Suit'} ${idx + 1}${item.product?.name ? ` — ${item.product.name}` : ''}</span>
                        <span>Qty: ${totalSuitsQty > 3 ? totalSuitsQty : (item.quantity || 1)}</span>
                    </div>
                    <div class="suit-body">
                        <div class="col-notes" style="border-right:1px solid #000;">
                            <div class="col-hdr">Notes</div>
                            <div class="nbox">${item.itemNote || ''}</div>
                            ${meas?.notes ? `<div class="meas-note"><span class="meas-note-label">Meas. Notes: </span>${meas.notes}</div>` : ''}
                        </div>
                        <div class="col-stitch" style="display:flex;flex-direction:column;justify-content:space-between;border-right:1px solid #000;">
                            <div>
                                <div class="col-hdr">کندھا، چھاتی، کمر، گھیرا، کف (بائیں طرف)</div>
                                <table class="mt"><tbody>${stitchRowsHtml}</tbody></table>
                                <div style="padding:4px;">
                                    ${boxesHtml}
                                </div>
                            </div>
                            ${!isWskot ? `
                            <div class="pockets-section" style="border-top:1px solid #000;padding:6px;background:#fcfcfc;">
                                <div style="text-align:center;font-weight:700;font-size:11px;margin-bottom:4px;color:#333;">جیب (POCKETS)</div>
                                <table style="width:100%;border-collapse:collapse;text-align:center;font-size:10px;border:1px solid #000;">
                                    <thead>
                                        <tr style="background:#f0f0f0;">
                                            <th style="border:1px solid #000;padding:2px;font-weight:700;width:33.33%;">F</th>
                                            <th style="border:1px solid #000;padding:2px;font-weight:700;width:33.33%;">Side</th>
                                            <th style="border:1px solid #000;padding:2px;font-weight:700;width:33.33%;">Shalwar</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td style="border:1px solid #000;padding:4px;height:24px;font-weight:700;font-size:11px;">${src.front_pocket || ''}</td>
                                            <td style="border:1px solid #000;padding:4px;height:24px;font-weight:700;font-size:11px;">${src.side_pocket || ''}</td>
                                            <td style="border:1px solid #000;padding:4px;height:24px;font-weight:700;font-size:11px;">${src.shalwar_pocket || ''}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            ` : ''}
                        </div>
                        <div class="col-meas" style="border-right:none;">
                            <div>
                                <div class="col-hdr">قمیض (دائیں طرف)</div>
                                <table class="mt"><tbody>${measureRowsHtml}</tbody></table>
                            </div>
                        </div>
                    </div>
                </div>`;
            }).join('');

            const orderNoteHtml = booking.notes
                ? `<div class="order-note"><strong>Order Note:</strong> ${booking.notes}</div>`
                : `<div class="order-note"><strong>Order Note:</strong></div>`;

            return `
            <div class="booking-page">
                <div class="hdr">
                    <img src="/logo.png" alt="Logo"/>
                    <div class="hdr-text">
                        <h1>Grace Cloth and Tailors</h1>
                        <div class="tagline">Where Style Meets Perfection</div>
                        <div class="phone">📞 03006284318 &nbsp;|&nbsp; 03186284318</div>
                        <div class="address">Basement of Faazal Plaza, Dhulyan Chowk Dinga</div>
                    </div>
                </div>
                <div class="title">Stitching Details &nbsp;|&nbsp; بکنگ پرچی</div>
                <table class="info-table">
                    <tbody>
                        <tr>
                            <td style="font-weight:700;width:13%">Customer:</td>
                            <td style="font-weight:700;width:22%">${booking.customer?.name || ''}</td>
                            <td style="font-weight:700;width:11%">Meas. No:</td>
                            <td style="font-weight:700;width:14%">${booking.customer?.measurementNo || '—'}</td>
                            <td style="font-weight:700;width:10%">Booking #:</td>
                            <td style="font-weight:800;color:#1a1a2e;width:15%">${booking.bookingNumber || booking.id}</td>
                            <td style="font-weight:700;width:7%">Date:</td>
                            <td style="width:8%">${fmt(booking.bookingDate)}</td>
                        </tr>
                        <tr>
                            <td style="font-weight:700">Tailor:</td>
                            <td colspan="2">${tailors || '—'}</td>
                            <td style="font-weight:700">Cutter:</td>
                            <td colspan="2">${cutters || '—'}</td>
                            <td style="font-weight:700">Delivery:</td>
                            <td>${fmt(booking.deliveryDate)}</td>
                        </tr>
                        <tr>
                            <td style="font-weight:700">Address:</td>
                            <td colspan="7">${booking.customer?.address || '—'}</td>
                        </tr>
                    </tbody>
                </table>
                ${itemsHtml}
                ${orderNoteHtml}
            </div>`;
        };

        const title = bookingList.length === 1
            ? `Tailor Ticket — ${bookingList[0].bookingNumber || bookingList[0].id}`
            : `Tailor Tickets — ${bookingList.length} Bookings`;

        const allBookingsHtml = bookingList.map(b => buildBookingHtml(b, measurements)).join('');

        const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>${title}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,sans-serif;color:#000;padding:12px;font-size:13px}
.hdr{border-bottom:3px solid #1a1a2e;padding-bottom:8px;margin-bottom:10px;display:flex;align-items:center;gap:12px}
.hdr img{width:64px;width:64px;object-fit:contain}
.hdr-text{flex:1;text-align:center}
.hdr-text h1{font-size:20px;font-weight:900;letter-spacing:1px;color:#1a1a2e;text-transform:uppercase}
.hdr-text .tagline{font-size:11px;color:#555;font-style:italic;margin-top:2px}
.hdr-text .phone{font-size:11px;color:#222;margin-top:3px}
.hdr-text .address{font-size:10px;color:#444;margin-top:2px}
.title{text-align:center;font-size:13px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#1a1a2e;margin:6px 0 10px}
.info-table{width:100%;border-collapse:collapse;font-size:13px;border:1px solid #000;margin-bottom:8px}
.info-table td{border:1px solid #000;padding:6px 8px}
.booking-page{
    page-break-after:always;
    break-after:page;
    page-break-inside:avoid;
    width:100%;
    margin-bottom:30px;
}
.booking-page:last-child{
    page-break-after:auto;
    break-after:auto;
}
.suit{border:1px solid #000;margin-bottom:8px;page-break-inside:avoid;break-inside:avoid}
.suit-hdr{background:#1a1a2e;color:#fff;padding:4px 8px;font-weight:700;font-size:12px;display:flex;justify-content:space-between}
.suit-body{display:flex}
.col-meas{flex:0 0 42%;border-right:1px solid #000;display:flex;flex-direction:column;justify-content:space-between}
.col-stitch{flex:0 0 30%;border-right:1px solid #000;display:flex;flex-direction:column;justify-content:space-between}
.col-notes{flex:1}
.col-hdr{background:#f0f0f0;padding:5px 8px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid #000;font-family:'Alvi Lahori Nastaleeq', 'Alvi Nastaleeq', 'Noto Nastaliq Urdu', Urdu, sans-serif}
.mt{width:100%;border-collapse:collapse;border-top:1px solid #000}
.ml{padding:16px 8px;font-size:14px;font-weight:600;border-bottom:1px solid #ddd;width:44%;white-space:nowrap;vertical-align:middle;font-family:'Alvi Lahori Nastaleeq', 'Alvi Nastaleeq', 'Noto Nastaliq Urdu', Urdu, sans-serif}
.mv{padding:16px 6px;font-size:14px;border-bottom:1px solid #ddd;border-left:1px solid #000;vertical-align:middle}
.ul{display:inline-block;min-width:50px;font-weight:700;text-decoration:none}
.sbox{border:1px solid #000;margin:4px 5px;padding:10px 8px;min-height:42px}
.nbox{border:1px solid #000;margin:5px;padding:8px;min-height:140px;font-size:13px;white-space:pre-wrap}
.order-note{border:1px solid #000;padding:5px 8px;font-size:11px;margin-top:4px}
@media print{
    body{padding:0}
    @page{size:A4 portrait;margin:10mm}
}
</style>
</head>
<body>
${allBookingsHtml}
<script>window.onload=()=>{window.print()}<\/script>
</body>
</html>`;

        const win = window.open('', '_blank');
        win.document.write(html);
        win.document.close();
    };

    const handlePrintConfirm = async (type) => {
        setPrintDialogOpen(false);

        // Always reset first so useEffect fires even for the same booking
        setPrintBooking(null);
        setBulkPrintBookings([]);

        if (isBulkPrint) {
            const selected = filteredBookings.filter(b => selectedIds.has(b.id));
            setIsBulkPrint(false);
            if (type === 'STITCHING') {
                openStitchingTicketWindow(selected, null);
                return;
            }
            setPrintType(type);
            setTimeout(() => {
                setBulkPrintBookings(selected);
                setTimeout(() => triggerPrint(), 300);
            }, 50);
            return;
        }

        if (type === 'STITCHING') {
            const measurements = tempPrintBooking?.customerId
                ? await fetchMeasurements(tempPrintBooking.customerId)
                : null;
            openStitchingTicketWindow(tempPrintBooking, measurements);
            return;
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
        notes: "",
        discount: ""
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
            stitchingType: "SUIT",
            itemStatus: "PENDING", itemNote: "",
            cuffType: "", pohnchaType: "", gheraType: "", galaType: "", galaSize: "",
            pocketType: "", shalwarType: "", hasShalwarPocket: false, hasFrontPockets: false,
            qameez_lambai: "", bazoo: "", teera: "", galaa: "", chaati: "",
            gheera: "", kaf: "", gehra_gird: "", kandha: "", chaati_around: "", kamar_around: "",
            hip_around: "", shalwar_lambai: "", puhncha: "", shalwar_gheera: "",
            wskot_lambai: "", wskot_teera: "", wskot_gala: "", wskot_chaati: "",
            wskot_kamar: "", wskot_hip: "",
            front_pocket: "", side_pocket: "", shalwar_pocket: "",
        }
    ]);

    // Store previous stitching details for reuse
    const [previousStitchingDetails, setPreviousStitchingDetails] = useState(null);

    // Product items added to the bill (non-stitching)
    const [productItems, setProductItems] = useState([]);
    const selectedCust = (customerOptions || []).find(c => c.id === formData.customerId) || null;

    const filterCustomerOptions = (options, { inputValue }) => {
        const q = (inputValue || "").toLowerCase().trim();
        if (!q) return options;
        return options.filter(c => {
            if (!c) return false;
            return (
                (c.name || "").toLowerCase().includes(q) ||
                (c.fatherName || "").toLowerCase().includes(q) ||
                (c.phone || "").toLowerCase().includes(q) ||
                (c.address || "").toLowerCase().includes(q) ||
                (c.measurementNo || "").toLowerCase().includes(q)
            );
        });
    };

    // Barcode scanner for product items
    const [scanCode, setScanCode] = useState("");
    const [scanStatus, setScanStatus] = useState(null);
    const scanRef = useRef(null);


    // Filter staff customers by accountCategory name (case-insensitive)
    const tailors = (employees || []).filter(e => e.accountCategory?.name?.toLowerCase() === "tailor");
    const cutters = (employees || []).filter(e => e.accountCategory?.name?.toLowerCase() === "cutter");

    const handleCustomerChange = async (customerId) => {
        if (!customerId) {
            setFormData(prev => ({
                ...prev,
                customerId: "",
                customerCode: "",
                customerName: "",
                customerAddress: "",
                customerPhone: ""
            }));
            setCustomerMeasurements(null);
            return;
        }
        const customer = (customerOptions || []).find(c => c.id === parseInt(customerId));
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

    const handleFilterChange = (field, value) => {
        const updatedFilters = { ...customerSearchFilters, [field]: value };
        setCustomerSearchFilters(updatedFilters);
        
        const isAnyFieldActive = Object.values(updatedFilters).some(v => v.trim() !== "");
        if (!isAnyFieldActive) {
            handleCustomerChange("");
            setShowCustomerGrid(false);
        } else {
            setShowCustomerGrid(true);
            setCustomerSearchInput(value);
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
        return unitPrice * (parseFloat(item.quantity) || 1);
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
        item.totalPrice = item.unitPrice * (parseFloat(item.quantity) || 1);
        setCartItems(newItems);
    };

    const handleQuantityChange = (itemIndex, qty) => {
        const newItems = [...cartItems];
        const item = newItems[itemIndex];
        item.quantity = qty;
        const parsedQty = parseFloat(qty) || 1;
        item.totalPrice = calculateUnitPrice(item, stitchingOptions) * parsedQty;
        setCartItems(newItems);
    };

    const handleStitchingTypeChange = (itemIndex, type) => {
        const newItems = [...cartItems];
        newItems[itemIndex].stitchingType = type;
        if (customerMeasurements) {
            const keysToCopy = type === "WAISTCOAT" ? WAISTCOAT_MEASUREMENT_KEYS : SUIT_MEASUREMENT_KEYS;
            keysToCopy.forEach(k => {
                newItems[itemIndex][k] = customerMeasurements[k] ?? "";
            });
        }
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
                stitchingType: "SUIT",
                itemStatus: "PENDING", itemNote: "",
                cuffType: "", pohnchaType: "", gheraType: "", galaType: "", galaSize: "",
                pocketType: "", shalwarType: "", hasShalwarPocket: false, hasFrontPockets: false,
                qameez_lambai: "", bazoo: "", teera: "", galaa: "", chaati: "",
                gheera: "", kaf: "", gehra_gird: "", kandha: "", chaati_around: "", kamar_around: "",
                hip_around: "", shalwar_lambai: "", puhncha: "", shalwar_gheera: "",
                wskot_lambai: "", wskot_teera: "", wskot_gala: "", wskot_chaati: "",
                wskot_kamar: "", wskot_hip: "",
                front_pocket: "", side_pocket: "", shalwar_pocket: "",
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
                    return { ...i, quantity: qty, totalPrice: qty * parseFloat(i.unitPrice) };
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
                next[index] = { ...next[index], productId: product.id, productName: product.name, unitPrice: price, totalPrice: qty * price };
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
            next[index].totalPrice = qty * price;
            return next;
        });
    };

    // Calculate subtotals
    const stitchingSubtotal = cartItems.reduce((sum, item) => sum + (parseFloat(item.unitPrice || 0) * (parseFloat(item.quantity) || 1)), 0);
    const productSubtotal = productItems.reduce((sum, item) => sum + (parseFloat(item.unitPrice || 0) * (parseFloat(item.quantity) || 1)), 0);
    const totalSubtotal = stitchingSubtotal + productSubtotal;

    // Apply global discount: if products are involved, cap discount at productSubtotal, otherwise cap at stitchingSubtotal
    const hasProductsInUI = productItems.some(p => p.productId);
    const targetSubtotal = hasProductsInUI ? productSubtotal : stitchingSubtotal;
    const globalDiscountInput = parseFloat(formData.discount) || 0;
    const appliedDiscount = Math.min(globalDiscountInput, targetSubtotal);

    const totalAmount = Math.max(0, totalSubtotal - appliedDiscount);
    const advanceAmount = parseFloat(formData.advanceAmount) || 0;
    const balanceAmount = totalAmount - advanceAmount;

    const handleSubmit = async () => {
        setLoading(true);
        setError("");

        // In edit mode include all stitching items; in create mode only those with selectedOptionIds
        const validItems = editingBookingId
            ? cartItems.filter(item => item.isStitching)
            : cartItems.filter(item => (item.selectedOptionIds || []).length > 0);
        const validProductItems = productItems.filter(p => p.productId);

        if (!formData.customerId) {
            setError("Please select a customer");
            setLoading(false);
            return;
        }

        if (validItems.length === 0 && validProductItems.length === 0) {
            setError("Please add at least one stitching suit or product");
            setLoading(false);
            return;
        }

        try {
            const subStitching = validItems.reduce((sum, item) => sum + (parseFloat(item.unitPrice || 0) * (parseFloat(item.quantity) || 1)), 0);
            const subProduct = validProductItems.reduce((sum, item) => sum + (parseFloat(item.unitPrice || 0) * (parseFloat(item.quantity) || 1)), 0);

            const hasProducts = validProductItems.length > 0;
            const discountTargets = hasProducts ? [...validProductItems] : [...validItems];
            const nonDiscountTargets = hasProducts ? [...validItems] : [];

            const targetSubtotal = discountTargets.reduce((sum, item) => sum + (parseFloat(item.unitPrice || 0) * (parseFloat(item.quantity) || 1)), 0);
            const discountInput = parseFloat(formData.discount) || 0;
            const submitDiscount = Math.min(discountInput, targetSubtotal);

            let remainingDiscount = submitDiscount;
            let remainingSubtotal = targetSubtotal;

            const processedDiscountTargets = discountTargets.map((item, idx, arr) => {
                const itemSub = parseFloat(item.unitPrice || 0) * (parseFloat(item.quantity) || 1);
                let itemDisc = 0;
                
                if (submitDiscount > 0 && remainingSubtotal > 0) {
                    if (idx === arr.length - 1) {
                        itemDisc = remainingDiscount;
                    } else {
                        itemDisc = Math.round((remainingDiscount * itemSub / remainingSubtotal) * 100) / 100;
                        remainingDiscount -= itemDisc;
                        remainingSubtotal -= itemSub;
                    }
                }

                return {
                    ...item,
                    discount: itemDisc,
                    totalPrice: Math.max(0, itemSub - itemDisc)
                };
            });

            const processedNonDiscountTargets = nonDiscountTargets.map(item => {
                const itemSub = parseFloat(item.unitPrice || 0) * (parseFloat(item.quantity) || 1);
                return {
                    ...item,
                    discount: 0,
                    totalPrice: itemSub
                };
            });

            const finalStitchingItems = hasProducts ? processedNonDiscountTargets : processedDiscountTargets;
            const finalProductItems = hasProducts ? processedDiscountTargets : [];

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
                    ...finalStitchingItems.map(item => ({
                        productId: item.productId || null,
                        quantity: parseFloat(item.quantity) || 1,
                        unitPrice: item.unitPrice || 0,
                        discount: item.discount || 0,
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
                        gehra_gird: item.gehra_gird,
                        kandha: item.kandha,
                        chaati_around: item.chaati_around,
                        kamar_around: item.kamar_around,
                        hip_around: item.hip_around,
                        shalwar_lambai: item.shalwar_lambai,
                        puhncha: item.puhncha,
                        shalwar_gheera: item.shalwar_gheera,
                        front_pocket: item.front_pocket,
                        side_pocket: item.side_pocket,
                        shalwar_pocket: item.shalwar_pocket,
                    })),
                    ...finalProductItems.map(item => ({
                        productId: item.productId,
                        quantity: parseFloat(item.quantity) || 1,
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
        const stitchingBookingItems = (booking.items || []).filter(item => !item.productId);
        const productBookingItems = (booking.items || []).filter(item => !!item.productId);
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
            stitchingType: item.stitchingType || "SUIT",
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
            gehra_gird: item.gehra_gird || "",
            kandha: item.kandha || "",
            chaati_around: item.chaati_around || "",
            kamar_around: item.kamar_around || "",
            hip_around: item.hip_around || "",
            shalwar_lambai: item.shalwar_lambai || "",
            puhncha: item.puhncha || "",
            shalwar_gheera: item.shalwar_gheera || "",
            wskot_lambai: item.wskot_lambai || "",
            wskot_teera: item.wskot_teera || "",
            wskot_gala: item.wskot_gala || "",
            wskot_chaati: item.wskot_chaati || "",
            wskot_kamar: item.wskot_kamar || "",
            wskot_hip: item.wskot_hip || "",
        })) : [{
            id: 1, productId: "", productName: "",
            selectedOptionIds: [], unitPrice: 0, quantity: 1, totalPrice: 0,
            bookingType: "STITCHING", isStitching: true, isCollapsed: false,
            stitchingType: "SUIT",
            itemStatus: "PENDING", itemNote: "",
            cuffType: "", pohnchaType: "", gheraType: "", galaType: "", galaSize: "",
            pocketType: "", shalwarType: "", hasShalwarPocket: false, hasFrontPockets: false,
            qameez_lambai: "", bazoo: "", teera: "", galaa: "", chaati: "",
            gheera: "", kaf: "", gehra_gird: "", kandha: "", chaati_around: "", kamar_around: "",
            hip_around: "", shalwar_lambai: "", puhncha: "", shalwar_gheera: "",
            wskot_lambai: "", wskot_teera: "", wskot_gala: "", wskot_chaati: "",
            wskot_kamar: "", wskot_hip: "",
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
        setCustomerSearchFilters({
            name: booking.customer?.name || "",
            fatherName: booking.customer?.fatherName || "",
            phone: booking.customer?.phone || "",
            address: booking.customer?.address || "",
            measurementNo: booking.customer?.measurementNo || ""
        });
        setShowCustomerGrid(false);
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
                stitchingType: "SUIT",
                itemStatus: "PENDING", itemNote: "",
                cuffType: "", pohnchaType: "", gheraType: "", galaType: "", galaSize: "",
                pocketType: "", shalwarType: "", hasShalwarPocket: false, hasFrontPockets: false,
                qameez_lambai: "", bazoo: "", teera: "", galaa: "", chaati: "",
                gheera: "", kaf: "", gehra_gird: "", kandha: "", chaati_around: "", kamar_around: "",
                hip_around: "", shalwar_lambai: "", puhncha: "", shalwar_gheera: "",
                wskot_lambai: "", wskot_teera: "", wskot_gala: "", wskot_chaati: "",
                wskot_kamar: "", wskot_hip: "",
            }
        ]);
        setProductItems([]);
        setCustomerSearchFilters({
            name: "",
            fatherName: "",
            phone: "",
            address: "",
            measurementNo: ""
        });
        setShowCustomerGrid(false);
    };

    const handleDelete = async (id) => {
        if (!isAdmin) {
            alert("Only administrators can delete bookings.");
            return;
        }
        if (!confirm("Are you sure you want to delete this booking?")) return;

        try {
            const response = await fetch(`/api/bookings?id=${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.error || "Failed to delete");
            }

            setBookings(prev => prev.filter(b => b.id !== id));
            setSuccessMessage("Booking deleted successfully!");
        } catch (err) {
            alert(err.message || "Failed to delete booking");
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        const booking = (bookings || []).find(b => b.id === id);
        const currentStatus = booking?.status;
        if ((currentStatus === "COMPLETED" || currentStatus === "RETURNED") && !isAdmin) {
            alert("Only an admin can change the status of a completed or returned booking.");
            return;
        }

        if (newStatus === "RETURNED") {
            const confirmed = window.confirm("Are you sure you want to change the status to Returned?");
            if (!confirmed) return;
        }
        try {
            const response = await fetch("/api/bookings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, status: newStatus }),
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.error || "Failed to update status");
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
        const matchesTo = !filterDateTo || bDate <= filterDateTo;

        const dDate = b.deliveryDate ? b.deliveryDate.slice(0, 10) : "";
        const matchesDeliveryFrom = !filterDeliveryFrom || dDate >= filterDeliveryFrom;
        const matchesDeliveryTo = !filterDeliveryTo || dDate <= filterDeliveryTo;

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
        sum + (b.items || []).filter(i => !i.productId).reduce((s, i) => s + (parseFloat(i.quantity) || 1), 0), 0);

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
                                {/* Customer Search Inputs in a single row */}
                                <Grid size={{ xs: 12 }}>
                                    <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', lg: 'row' }, width: '100%', alignItems: 'center' }}>
                                        {/* Name input */}
                                        <Box sx={{ flex: 1.1, minWidth: 0, width: '100%' }}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                label="Name *"
                                                value={customerSearchFilters.name}
                                                onChange={(e) => handleFilterChange("name", e.target.value)}
                                                required
                                                sx={FIELD_SX}
                                            />
                                        </Box>

                                        {/* Father Name input */}
                                        <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                label="Father Name"
                                                value={customerSearchFilters.fatherName}
                                                onChange={(e) => handleFilterChange("fatherName", e.target.value)}
                                                sx={FIELD_SX}
                                            />
                                        </Box>

                                        {/* Phone Number input */}
                                        <Box sx={{ flex: 1.1, minWidth: 0, width: '100%' }}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                label="Phone Number"
                                                value={customerSearchFilters.phone}
                                                onChange={(e) => handleFilterChange("phone", e.target.value)}
                                                sx={FIELD_SX}
                                            />
                                        </Box>

                                        {/* Address input */}
                                        <Box sx={{ flex: 1.6, minWidth: 0, width: '100%' }}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                label="Address"
                                                value={customerSearchFilters.address}
                                                onChange={(e) => handleFilterChange("address", e.target.value)}
                                                sx={FIELD_SX}
                                            />
                                        </Box>

                                        {/* Measurement No input */}
                                        <Box sx={{ flex: 0.8, minWidth: 0, width: '100%' }}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                label="Measurement No"
                                                value={customerSearchFilters.measurementNo}
                                                onChange={(e) => handleFilterChange("measurementNo", e.target.value)}
                                                sx={FIELD_SX}
                                            />
                                        </Box>
                                    </Box>

                                    {/* Clickable Customer Search Results Grid */}
                                    {showCustomerGrid && hasActiveSearch && filteredCustomers.length > 0 && (
                                        <Card variant="outlined" sx={{ mt: 2, border: '1px solid #d1d5db', borderRadius: 2, overflow: 'hidden', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                                            <TableContainer sx={{ maxHeight: 250 }}>
                                                <Table size="small" stickyHeader>
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableCell sx={{ fontWeight: 700, backgroundColor: '#f3f4f6', color: '#374151' }}>Name</TableCell>
                                                            <TableCell sx={{ fontWeight: 700, backgroundColor: '#f3f4f6', color: '#374151' }}>Father Name</TableCell>
                                                            <TableCell sx={{ fontWeight: 700, backgroundColor: '#f3f4f6', color: '#374151' }}>Phone Number</TableCell>
                                                            <TableCell sx={{ fontWeight: 700, backgroundColor: '#f3f4f6', color: '#374151' }}>Address</TableCell>
                                                            <TableCell sx={{ fontWeight: 700, backgroundColor: '#f3f4f6', color: '#374151' }}>Measurement No</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {filteredCustomers.map((cust) => (
                                                            <TableRow 
                                                                key={cust.id} 
                                                                hover 
                                                                onClick={() => {
                                                                    handleCustomerChange(cust.id);
                                                                    setCustomerSearchFilters({
                                                                        name: cust.name || "",
                                                                        fatherName: cust.fatherName || "",
                                                                        phone: cust.phone || "",
                                                                        address: cust.address || "",
                                                                        measurementNo: cust.measurementNo || ""
                                                                    });
                                                                    setShowCustomerGrid(false);
                                                                }}
                                                                sx={{ 
                                                                    cursor: 'pointer',
                                                                    '&:hover': {
                                                                        backgroundColor: '#f3e8ff !important'
                                                                    }
                                                                }}
                                                            >
                                                                <TableCell sx={{ fontWeight: 600, color: '#1f2937' }}>{cust.name}</TableCell>
                                                                <TableCell color="text.secondary">{cust.fatherName || "—"}</TableCell>
                                                                <TableCell color="text.secondary">{cust.phone || "—"}</TableCell>
                                                                <TableCell color="text.secondary">{cust.address || "—"}</TableCell>
                                                                <TableCell sx={{ color: '#7c3aed', fontWeight: 700 }}>M# {cust.measurementNo || "—"}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        </Card>
                                    )}
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
                                            options={customerOptions}
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
                                            value={(customerOptions || []).find(c => c.id === formData.billingCustomerId) || null}
                                            onChange={(_, newValue) => setFormData(prev => ({ ...prev, billingCustomerId: newValue ? newValue.id : "" }))}
                                            onInputChange={(event, newInputValue, reason) => {
                                                if (reason === "input") {
                                                    setCustomerSearchInput(newInputValue);
                                                }
                                            }}
                                            loading={searchingCustomers}
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
                                                    label="Billing Account *"
                                                    size="small"
                                                    fullWidth
                                                    required
                                                    placeholder="Select who will be billed"
                                                    InputProps={{
                                                        ...params.InputProps,
                                                        endAdornment: (
                                                            <>
                                                                {searchingCustomers ? <CircularProgress color="inherit" size={20} /> : null}
                                                                {params.InputProps.endAdornment}
                                                            </>
                                                        )
                                                    }}
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
                                                                                  {/* Stitching Type Selector */}
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1.5, mb: 1 }}>
                                                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Stitching Type:</Typography>
                                                        <RadioGroup
                                                            row
                                                            value={item.stitchingType || "SUIT"}
                                                            onChange={(e) => handleStitchingTypeChange(index, e.target.value)}
                                                        >
                                                            <FormControlLabel 
                                                                value="SUIT" 
                                                                control={<Radio size="small" sx={{ color: '#8b5cf6', '&.Mui-checked': { color: '#7c3aed' }, p: 0.5 }} />} 
                                                                label={<Typography variant="caption" sx={{ fontWeight: (item.stitchingType || "SUIT") === "SUIT" ? 700 : 400 }}>Suit (شلوار قمیض)</Typography>} 
                                                                sx={{ m: 0, mr: 2 }} 
                                                            />
                                                            <FormControlLabel 
                                                                value="WAISTCOAT" 
                                                                control={<Radio size="small" sx={{ color: '#8b5cf6', '&.Mui-checked': { color: '#7c3aed' }, p: 0.5 }} />} 
                                                                label={<Typography variant="caption" sx={{ fontWeight: item.stitchingType === "WAISTCOAT" ? 700 : 400 }}>Waistcoat (واسکٹ)</Typography>} 
                                                                sx={{ m: 0 }} 
                                                            />
                                                        </RadioGroup>
                                                    </Box>

                                                    {/* Quantity & per-unit price */}
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                                        <Typography variant="caption" color="text.secondary">Qty:</Typography>
                                                        <TextField
                                                            size="small"
                                                            type="number"
                                                            value={item.quantity || 1}
                                                            onChange={(e) => handleQuantityChange(index, e.target.value)}
                                                            inputProps={{ min: 0.01, step: "any", style: { textAlign: 'center', padding: '4px 8px', width: 50 } }}
                                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: 'white', fontSize: '0.85rem' } }}
                                                        />
                                                        {(item.quantity || 1) > 1 && (
                                                            <Typography variant="caption" color="text.secondary">
                                                                Rs.{(calculateUnitPrice(item)).toLocaleString()} × {item.quantity} =&nbsp;
                                                                <strong style={{ color: '#059669' }}>Rs.{(item.totalPrice || 0).toLocaleString()}</strong>
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                    {/* Item Status */}
                                                    <Box sx={{ mt: 1 }}>
                                                        <TextField
                                                            select
                                                            size="small"
                                                            label="Suit Status"
                                                            value={item.itemStatus || "PENDING"}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                if (val === "RETURNED") {
                                                                    const confirmed = window.confirm("Are you sure you want to change this suit status to Returned?");
                                                                    if (!confirmed) return;
                                                                }
                                                                const ni = [...cartItems];
                                                                ni[index].itemStatus = val;
                                                                setCartItems(ni);
                                                            }}
                                                            sx={{ width: 150, '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: 'white', fontSize: '0.8rem' } }}
                                                        >
                                                            {[
                                                                { value: "PENDING", label: "Pending", color: "#f59e0b" },
                                                                { value: "READY", label: "Ready", color: "#10b981" },
                                                                { value: "COMPLETED", label: "Completed", color: "#059669" },
                                                                { value: "RETURNED", label: "Returned", color: "#ef4444" },
                                                            ].map(s => (
                                                                <MenuItem key={s.value} value={s.value}>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                                                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: s.color, flexShrink: 0 }} />
                                                                        <span>{s.label}</span>
                                                                    </Box>
                                                                </MenuItem>
                                                            ))}
                                                        </TextField>
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
                                                        inputProps={{ min: 0.01, step: "any", style: { textAlign: 'center', padding: '4px 8px', width: 50 } }}
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
                                {/* Subtotal row */}
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                    <Typography variant="body2" fontWeight={600} color="text.secondary">Subtotal</Typography>
                                    <Typography variant="body2" fontWeight={700} color="text.secondary">Rs.&nbsp;{totalSubtotal.toFixed(0)}</Typography>
                                </Box>
                                {/* Total row */}
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, pb: 1.5, borderBottom: '1px solid #d1fae5' }}>
                                    <Typography variant="body2" fontWeight={600} color="text.secondary">Total Amount</Typography>
                                    <Typography variant="h6" fontWeight={800} color="#059669">Rs.&nbsp;{totalAmount.toFixed(0)}</Typography>
                                </Box>
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 4 }}>
                                        <TextField fullWidth size="small" label="Bill Discount"
                                            value={formData.discount}
                                            onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                                            InputProps={{ startAdornment: <InputAdornment position="start">Rs.</InputAdornment> }}
                                            sx={FIELD_SX} />
                                    </Grid>
                                    <Grid size={{ xs: 4 }}>
                                        <TextField fullWidth size="small" label="Advance Amount" required
                                            value={formData.advanceAmount}
                                            onChange={(e) => setFormData({ ...formData, advanceAmount: e.target.value })}
                                            disabled={!!editingBookingId && !isAdmin}
                                            InputProps={{ startAdornment: <InputAdornment position="start">Rs.</InputAdornment> }}
                                            sx={FIELD_SX} />
                                    </Grid>
                                    <Grid size={{ xs: 4 }}>
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

    const paymentDialog = payBooking && (
        <Dialog 
            open={payDialogOpen} 
            onClose={() => !paying && setPayDialogOpen(false)}
            maxWidth="sm"
            fullWidth
            PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
        >
            <DialogTitle sx={{
                fontWeight: 700,
                pt: 2.5,
                pb: 2,
                px: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                color: 'white'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ p: 1, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2, display: 'flex' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
                    </Box>
                    <Box>
                        <Typography variant="h6" fontWeight={800} sx={{ color: 'white', lineHeight: 1.2 }}>
                            Receive Bill Payment
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                            Booking #{payBooking.bookingNumber || payBooking.id}
                        </Typography>
                    </Box>
                </Box>
                <Chip 
                    label={payBooking.status || "PENDING"} 
                    size="small" 
                    sx={{ 
                        fontWeight: 700, 
                        bgcolor: 'rgba(255,255,255,0.15)', 
                        color: 'white',
                        fontSize: '0.72rem' 
                    }} 
                />
            </DialogTitle>

            <DialogContent sx={{ p: 3, pt: '20px !important' }}>
                {error && (
                    <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2, borderRadius: 2 }}>
                        {error}
                    </Alert>
                )}

                {/* Customer & Booking Dates Section */}
                <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 2.5, border: '1px solid #e2e8f0', mb: 2.5 }}>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
                                CUSTOMER DETAILS
                            </Typography>
                            <Typography variant="subtitle2" fontWeight={800} color="#0f172a">
                                {payBooking.customer?.name || "N/A"}
                            </Typography>
                            {payBooking.customer?.phone && (
                                <Typography variant="caption" color="text.secondary" display="block">
                                    Phone: {payBooking.customer.phone}
                                </Typography>
                            )}
                            {payBooking.customer?.address && (
                                <Typography variant="caption" color="text.secondary" display="block">
                                    Addr: {payBooking.customer.address}
                                </Typography>
                            )}
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
                                ORDER DATES & TYPE
                            </Typography>
                            <Typography variant="body2" fontWeight={700} color="#334155">
                                Type: {payBooking.bookingType || "STITCHING"}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                                Booking Date: {payBooking.bookingDate ? new Date(payBooking.bookingDate).toLocaleDateString('en-GB') : "N/A"}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                                Delivery Date: {payBooking.deliveryDate ? new Date(payBooking.deliveryDate).toLocaleDateString('en-GB') : "N/A"}
                            </Typography>
                        </Grid>
                    </Grid>
                </Box>

                {/* Items Summary Table */}
                {(payBooking.items || []).length > 0 && (
                    <Box sx={{ mb: 2.5 }}>
                        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 1, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Booking Items ({payBooking.items.length})
                        </Typography>
                        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, maxHeight: 160 }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow sx={{ '& th': { bgcolor: '#f1f5f9', fontWeight: 700, fontSize: '0.75rem' } }}>
                                        <TableCell>Item Description</TableCell>
                                        <TableCell align="center">Qty</TableCell>
                                        <TableCell align="right">Unit Price</TableCell>
                                        <TableCell align="right">Total</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {payBooking.items.map((item, idx) => {
                                        const itemName = item.productId 
                                            ? (item.product?.name || "Product Item")
                                            : `${item.stitchingType || "Suit"} Stitching`;
                                        return (
                                            <TableRow key={item.id || idx}>
                                                <TableCell sx={{ fontSize: '0.8rem', py: 0.8 }}>{itemName}</TableCell>
                                                <TableCell align="center" sx={{ fontSize: '0.8rem', py: 0.8, fontWeight: 600 }}>{item.quantity || 1}</TableCell>
                                                <TableCell align="right" sx={{ fontSize: '0.8rem', py: 0.8 }}>Rs. {parseFloat(item.unitPrice || 0).toLocaleString()}</TableCell>
                                                <TableCell align="right" sx={{ fontSize: '0.8rem', py: 0.8, fontWeight: 700 }}>Rs. {parseFloat(item.totalPrice || 0).toLocaleString()}</TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                )}

                {/* Payment Financial Cards */}
                <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
                    <Grid size={{ xs: 6, sm: 3 }}>
                        <Card variant="outlined" sx={{ p: 1.5, textAlign: 'center', bgcolor: '#f8fafc', borderRadius: 2 }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">TOTAL BILL</Typography>
                            <Typography variant="body2" fontWeight={800} color="#0f172a">
                                Rs. {parseFloat(payBooking.totalAmount || 0).toLocaleString()}
                            </Typography>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                        <Card variant="outlined" sx={{ p: 1.5, textAlign: 'center', bgcolor: '#f0fdf4', borderRadius: 2, borderColor: '#bbf7d0' }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">ADVANCE</Typography>
                            <Typography variant="body2" fontWeight={800} color="#15803d">
                                Rs. {parseFloat(payBooking.advanceAmount || 0).toLocaleString()}
                            </Typography>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                        <Card variant="outlined" sx={{ p: 1.5, textAlign: 'center', bgcolor: '#eff6ff', borderRadius: 2, borderColor: '#bfdbfe' }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">TOTAL PAID</Typography>
                            <Typography variant="body2" fontWeight={800} color="#1d4ed8">
                                Rs. {Math.max(0, parseFloat(payBooking.totalAmount || 0) - parseFloat(payBooking.remainingAmount || 0)).toLocaleString()}
                            </Typography>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                        <Card variant="outlined" sx={{ p: 1.5, textAlign: 'center', bgcolor: '#fef2f2', borderRadius: 2, borderColor: '#fecaca' }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">REMAINING</Typography>
                            <Typography variant="body2" fontWeight={800} color="#b91c1c">
                                Rs. {parseFloat(payBooking.remainingAmount || 0).toLocaleString()}
                            </Typography>
                        </Card>
                    </Grid>
                </Grid>

                {/* Amount Entry Input */}
                <TextField
                    fullWidth
                    label="Payment Amount Received"
                    type="number"
                    size="small"
                    value={payReceived}
                    onChange={(e) => setPayReceived(e.target.value)}
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><Typography fontWeight={700} color="primary">Rs.</Typography></InputAdornment>
                    }}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 2.5,
                            fontWeight: 800,
                            fontSize: '1.15rem',
                            bgcolor: 'white',
                            '& fieldset': { borderColor: '#3b82f6', borderWidth: 2 }
                        }
                    }}
                />
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3, pt: 1, borderTop: '1px solid', borderColor: 'divider', gap: 1 }}>
                <Button 
                    variant="outlined" 
                    color="inherit" 
                    disabled={paying}
                    onClick={() => setPayDialogOpen(false)}
                    sx={{ borderRadius: 2, textTransform: 'none', px: 2.5 }}
                >
                    Cancel
                </Button>
                <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                    <Button 
                        variant="outlined" 
                        color="success" 
                        disabled={paying}
                        onClick={() => handlePaySubmit("LESS_PAY")}
                        sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700 }}
                    >
                        Less Pay & Clear
                    </Button>
                    <Button 
                        variant="contained" 
                        color="primary" 
                        disabled={paying}
                        onClick={() => handlePaySubmit("PARTIAL_PAY")}
                        sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700 }}
                    >
                        Partial Pay
                    </Button>
                    <Button 
                        variant="contained" 
                        color="success" 
                        disabled={paying}
                        onClick={() => handlePaySubmit("FULL_PAY")}
                        sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700, px: 3 }}
                    >
                        Full Pay
                    </Button>
                </Box>
            </DialogActions>
        </Dialog>
    );

    const checkoutDialog = checkoutBooking && (() => {
        const allItems = checkoutBooking.items || [];
        const totalSuitsInBooking = allItems.reduce((sum, item) => sum + (parseFloat(item.quantity) || 1), 0);
        const alreadyDeliveredBeforeThis = allItems
            .filter(item => item.itemStatus === "DELIVERED")
            .reduce((sum, item) => sum + (parseFloat(item.quantity) || 1), 0);

        const undeliveredItems = allItems.filter(item => item.itemStatus !== "DELIVERED");

        let deliveredNow = 0;
        undeliveredItems.forEach(item => {
            const maxQty = parseFloat(item.quantity) || 1;
            const q = checkoutQuantities[item.id] !== undefined ? checkoutQuantities[item.id] : maxQty;
            deliveredNow += parseFloat(q) || 0;
        });

        const totalDeliveredAfterThis = alreadyDeliveredBeforeThis + deliveredNow;
        const allDelivered = totalDeliveredAfterThis === totalSuitsInBooking;

        const totalAmount = parseFloat(checkoutBooking.totalAmount || 0);
        const alreadyPaid = parseFloat(checkoutBooking.advanceAmount || 0);
        const currentRemaining = parseFloat(checkoutBooking.remainingAmount || 0);

        const cashReceived = parseFloat(checkoutCashReceived) || 0;
        const discount = parseFloat(checkoutDiscount) || 0;
        const paymentPlusDiscount = cashReceived + discount;

        const remainingBalanceAfterPayment = Math.max(0, currentRemaining - paymentPlusDiscount);
        const totalPaidBeforeAndThis = alreadyPaid + cashReceived + discount;

        const isExceeding = paymentPlusDiscount > currentRemaining;

        const isAllSelected = undeliveredItems.length > 0 && undeliveredItems.every(item => {
            const maxQty = parseFloat(item.quantity) || 1;
            const q = checkoutQuantities[item.id] !== undefined ? checkoutQuantities[item.id] : maxQty;
            return q === maxQty && q > 0;
        });

        const handleToggleSelectAll = (checked) => {
            const newQuants = {};
            undeliveredItems.forEach(item => {
                const maxQty = parseFloat(item.quantity) || 1;
                newQuants[item.id] = checked ? maxQty : 0;
            });
            setCheckoutQuantities(newQuants);
        };

        return (
            <Dialog 
                open={checkoutOpen} 
                onClose={() => !paying && setCheckoutOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
            >
                <DialogTitle sx={{ fontWeight: 800, borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}>
                    {/* Header Wizard Steps Nav */}
                    <Grid container spacing={1.5} sx={{ alignItems: 'center' }}>
                        {[
                            { step: 1, title: "1. SELECT SUITS TO DELIVER", subtitle: "Step 1 of 3" },
                            { step: 2, title: "2. PAYMENT & DISCOUNT", subtitle: "Step 2 of 3" },
                            { step: 3, title: "3. REVIEW & FINALIZE", subtitle: "Step 3 of 3" },
                        ].map((s) => {
                            const isActive = checkoutStep === s.step;
                            const isCompleted = checkoutStep > s.step;
                            return (
                                <Grid key={s.step} size={{ xs: 4 }}>
                                    <Box
                                        onClick={() => {
                                            if (isCompleted) setCheckoutStep(s.step);
                                        }}
                                        sx={{
                                            p: 1.5,
                                            borderRadius: 2,
                                            bgcolor: isActive ? '#3b82f6' : isCompleted ? '#dbeafe' : '#f8fafc',
                                            color: isActive ? '#ffffff' : isCompleted ? '#1e40af' : '#64748b',
                                            cursor: isCompleted ? 'pointer' : 'default',
                                            transition: 'all 0.2s',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 0.3,
                                            border: isActive ? '2px solid #2563eb' : '1px solid #cbd5e1'
                                        }}
                                    >
                                        <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, opacity: isActive ? 0.9 : 0.8 }}>
                                            {s.subtitle}
                                        </Typography>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
                                            {s.title}
                                        </Typography>
                                    </Box>
                                </Grid>
                            );
                        })}
                    </Grid>
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    {error && (
                        <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2, borderRadius: 2 }}>
                            {error}
                        </Alert>
                    )}

                    {/* STEP 1: SELECT SUITS TO DELIVER */}
                    {checkoutStep === 1 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                            <Box>
                                <Typography variant="h6" fontWeight={800} color="text.primary">
                                    Order Check Out Wizard — Step 1 of 3
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    All pending suits are selected by default. You can change quantities if needed.
                                </Typography>
                            </Box>

                            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                                <Table size="small">
                                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                        <TableRow>
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    size="small"
                                                    checked={isAllSelected}
                                                    onChange={(e) => handleToggleSelectAll(e.target.checked)}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Suit (Item)</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 700 }}>Total Qty</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 700 }}>Already Delivered</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 700, width: 140 }}>Deliver Now (Qty)</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 700 }}>Pending After</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {allItems.map((item, idx) => {
                                            const totalQty = parseFloat(item.quantity) || 1;
                                            const isDelivered = item.itemStatus === "DELIVERED";
                                            const alreadyDeliv = isDelivered ? totalQty : 0;
                                            const maxDeliverNow = totalQty - alreadyDeliv;
                                            const currentDeliverVal = isDelivered 
                                                ? 0 
                                                : (checkoutQuantities[item.id] !== undefined ? checkoutQuantities[item.id] : maxDeliverNow);
                                            const pendingAfter = Math.max(0, totalQty - alreadyDeliv - currentDeliverVal);

                                            const isWskot = item.stitchingType === "WAISTCOAT" || (!item.qameez_lambai && item.wskot_lambai);
                                            const itemType = item.productId ? "Product" : (isWskot ? "Waistcoat" : "SUIT");
                                            const optionsStr = (item.selectedOptions || []).map(o => o.stitchingOption?.name).filter(Boolean).join(', ');
                                            
                                            const itemTitle = item.productId 
                                                ? `${item.productName || item.product?.name || "Cloth/Product"}`
                                                : `Stitching: ${itemType} ${optionsStr ? `(${optionsStr})` : ''}`;

                                            return (
                                                <TableRow key={item.id} sx={{ bgcolor: currentDeliverVal > 0 ? '#f5f3ff' : 'inherit' }}>
                                                    <TableCell padding="checkbox">
                                                        <Checkbox
                                                            size="small"
                                                            disabled={isDelivered}
                                                            checked={currentDeliverVal > 0}
                                                            onChange={(e) => {
                                                                setCheckoutQuantities({
                                                                    ...checkoutQuantities,
                                                                    [item.id]: e.target.checked ? maxDeliverNow : 0
                                                                });
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell sx={{ fontWeight: 600 }}>{idx + 1}</TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight={700}>{itemTitle}</Typography>
                                                        {item.itemNote && (
                                                            <Typography variant="caption" color="text.secondary">Note: {item.itemNote}</Typography>
                                                        )}
                                                    </TableCell>
                                                    <TableCell align="center" sx={{ fontWeight: 600 }}>{totalQty}</TableCell>
                                                    <TableCell align="center" sx={{ color: 'text.secondary' }}>{alreadyDeliv}</TableCell>
                                                    <TableCell align="center">
                                                        {isDelivered ? (
                                                            <Chip label="Delivered" size="small" color="success" variant="outlined" />
                                                        ) : (
                                                            <TextField
                                                                type="number"
                                                                size="small"
                                                                inputProps={{ min: 0, max: maxDeliverNow, step: "any", style: { textAlign: 'center' } }}
                                                                value={currentDeliverVal}
                                                                onChange={(e) => {
                                                                    const val = Math.max(0, Math.min(maxDeliverNow, parseFloat(e.target.value) || 0));
                                                                    setCheckoutQuantities({
                                                                        ...checkoutQuantities,
                                                                        [item.id]: val
                                                                    });
                                                                }}
                                                                sx={{ width: 90, '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                                                            />
                                                        )}
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Chip
                                                            label={pendingAfter}
                                                            size="small"
                                                            sx={{
                                                                fontWeight: 800,
                                                                bgcolor: pendingAfter === 0 ? '#dcfce7' : '#fee2e2',
                                                                color: pendingAfter === 0 ? '#166534' : '#991b1b'
                                                            }}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                                <Box sx={{ p: 1.5, bg: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0' }}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                size="small"
                                                checked={isAllSelected}
                                                onChange={(e) => handleToggleSelectAll(e.target.checked)}
                                            />
                                        }
                                        label={<Typography variant="body2" fontWeight={700}>Select All</Typography>}
                                    />
                                    <Box sx={{ display: 'flex', gap: 3 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Total Suits in Booking: <strong>{totalSuitsInBooking}</strong>
                                        </Typography>
                                        <Typography variant="body2" color="primary.main" fontWeight={700}>
                                            Total Deliver Now: <strong>{deliveredNow}</strong>
                                        </Typography>
                                    </Box>
                                </Box>
                            </TableContainer>

                            {/* Validation Check Step 1 */}
                            <Card variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#fafafa' }}>
                                <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ display: 'block', mb: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    Validation Check — Is Quantity Selected &gt; 0?
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 6 }}>
                                        <Box sx={{
                                            p: 2, borderRadius: 2, border: '2px solid',
                                            borderColor: deliveredNow === 0 ? '#f87171' : '#e2e8f0',
                                            bgcolor: deliveredNow === 0 ? '#fef2f2' : '#ffffff',
                                            textAlign: 'center'
                                        }}>
                                            <Typography variant="subtitle2" fontWeight={800} color={deliveredNow === 0 ? '#dc2626' : 'text.secondary'}>
                                                No (0 Selected)
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                                                Exit Wizard / Return to Booking Dashboard<br />(No state change)
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid size={{ xs: 6 }}>
                                        <Box sx={{
                                            p: 2, borderRadius: 2, border: '2px solid',
                                            borderColor: deliveredNow > 0 ? '#22c55e' : '#e2e8f0',
                                            bgcolor: deliveredNow > 0 ? '#f0fdf4' : '#ffffff',
                                            textAlign: 'center'
                                        }}>
                                            <Typography variant="subtitle2" fontWeight={800} color={deliveredNow > 0 ? '#16a34a' : 'text.secondary'}>
                                                Yes (1 or more selected)
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                                                Proceed to Step 2
                                            </Typography>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </Card>
                        </Box>
                    )}

                    {/* STEP 2: PAYMENT & DISCOUNT */}
                    {checkoutStep === 2 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                            <Box>
                                <Typography variant="h6" fontWeight={800} color="text.primary">
                                    Order Check Out Wizard — Step 2 of 3
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Enter payment details for this delivery.
                                </Typography>
                            </Box>

                            <Grid container spacing={2.5}>
                                {/* Booking Summary Card */}
                                <Grid size={{ xs: 6 }}>
                                    <Card variant="outlined" sx={{ p: 2.5, borderRadius: 2, height: '100%' }}>
                                        <Typography variant="subtitle2" fontWeight={800} color="primary.main" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                            Booking Summary
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2" color="text.secondary">Booking No.</Typography>
                                                <Typography variant="body2" fontWeight={800} color="#6d28d9">#{checkoutBooking.bookingNumber || checkoutBooking.id}</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2" color="text.secondary">Customer</Typography>
                                                <Box sx={{ textAlign: 'right' }}>
                                                    <Typography variant="body2" fontWeight={700}>{checkoutBooking.customer?.name}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{checkoutBooking.customer?.phone}</Typography>
                                                </Box>
                                            </Box>
                                            <Divider />
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2" color="text.secondary">Total Amount</Typography>
                                                <Typography variant="body2" fontWeight={700}>Rs. {totalAmount.toLocaleString()}</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2" color="text.secondary">Already Paid</Typography>
                                                <Typography variant="body2" fontWeight={700} color="success.main">Rs. {alreadyPaid.toLocaleString()}</Typography>
                                            </Box>
                                            <Divider />
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Typography variant="body2" fontWeight={700}>Remaining Balance</Typography>
                                                <Typography variant="subtitle1" fontWeight={800} color="success.main">
                                                    Rs. {currentRemaining.toLocaleString()}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Card>
                                </Grid>

                                {/* Payment Details Card */}
                                <Grid size={{ xs: 6 }}>
                                    <Card variant="outlined" sx={{ p: 2.5, borderRadius: 2, height: '100%' }}>
                                        <Typography variant="subtitle2" fontWeight={800} color="primary.main" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                            Payment Details
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                            <TextField
                                                fullWidth
                                                label="Cash Received"
                                                type="number"
                                                size="small"
                                                value={checkoutCashReceived}
                                                onChange={(e) => setCheckoutCashReceived(e.target.value)}
                                                InputProps={{
                                                    startAdornment: <InputAdornment position="start">Rs.</InputAdornment>
                                                }}
                                            />
                                            <TextField
                                                fullWidth
                                                label="Discount"
                                                type="number"
                                                size="small"
                                                value={checkoutDiscount}
                                                onChange={(e) => setCheckoutDiscount(e.target.value)}
                                                InputProps={{
                                                    startAdornment: <InputAdornment position="start">Rs.</InputAdornment>
                                                }}
                                            />
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 0.5 }}>
                                                <Typography variant="body2" color="text.secondary">Payment + Discount</Typography>
                                                <Typography variant="body2" fontWeight={700}>Rs. {paymentPlusDiscount.toLocaleString()}</Typography>
                                            </Box>
                                            <Divider />
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Typography variant="body2" fontWeight={700}>Remaining Balance After Payment</Typography>
                                                <Typography variant="subtitle1" fontWeight={800} color={remainingBalanceAfterPayment > 0 ? "error.main" : "success.main"}>
                                                    Rs. {remainingBalanceAfterPayment.toLocaleString()}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Card>
                                </Grid>
                            </Grid>

                            {/* Validation Check Step 2 */}
                            <Card variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#fafafa' }}>
                                <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ display: 'block', mb: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    Validation Check — Is Cash Received + Discount &gt; Remaining Balance?
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 6 }}>
                                        <Box sx={{
                                            p: 2, borderRadius: 2, border: '2px solid',
                                            borderColor: isExceeding ? '#f87171' : '#e2e8f0',
                                            bgcolor: isExceeding ? '#fef2f2' : '#ffffff',
                                            textAlign: 'center'
                                        }}>
                                            <Typography variant="subtitle2" fontWeight={800} color={isExceeding ? '#dc2626' : 'text.secondary'}>
                                                Yes (Exceeds)
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                                                Checkout not allowed.<br />Amount cannot exceed remaining balance.
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid size={{ xs: 6 }}>
                                        <Box sx={{
                                            p: 2, borderRadius: 2, border: '2px solid',
                                            borderColor: !isExceeding ? '#22c55e' : '#e2e8f0',
                                            bgcolor: !isExceeding ? '#f0fdf4' : '#ffffff',
                                            textAlign: 'center'
                                        }}>
                                            <Typography variant="subtitle2" fontWeight={800} color={!isExceeding ? '#16a34a' : 'text.secondary'}>
                                                No (Valid)
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                                                Proceed to Step 3
                                            </Typography>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </Card>
                        </Box>
                    )}

                    {/* STEP 3: REVIEW & FINALIZE */}
                    {checkoutStep === 3 && (() => {
                        let finalStatusTitle = "";
                        let finalStatusColor = "";
                        let finalStatusBg = "";
                        let finalStatusDesc = "";
                        let ledgerActionDesc = "";

                        if (allDelivered) {
                            if (remainingBalanceAfterPayment === 0) {
                                finalStatusTitle = "Completed — Fully Paid (Booking Closed)";
                                finalStatusColor = "#15803d";
                                finalStatusBg = "#dcfce7";
                                finalStatusDesc = "All suits delivered and remaining balance is Rs. 0. Order is complete.";
                                ledgerActionDesc = "No ledger entry created.";
                            } else {
                                finalStatusTitle = "Closed — Pending Ledger Settlement (Transferred To Ledger)";
                                finalStatusColor = "#b91c1c";
                                finalStatusBg = "#fef2f2";
                                finalStatusDesc = "All suits delivered, but an outstanding balance remains. Order will be closed.";
                                ledgerActionDesc = `Debit Customer Ledger Account with exact remaining balance: Rs. ${remainingBalanceAfterPayment.toLocaleString()}`;
                            }
                        } else {
                            if (remainingBalanceAfterPayment === 0) {
                                finalStatusTitle = "Partially Delivered — Fully Paid (Booking Open)";
                                finalStatusColor = "#0369a1";
                                finalStatusBg = "#e0f2fe";
                                finalStatusDesc = "Some suits delivered & balance cleared. Booking remains open for pending items.";
                                ledgerActionDesc = "No ledger entry created (Booking remains open).";
                            } else {
                                finalStatusTitle = "Partially Delivered — Partial Payment (Booking Open)";
                                finalStatusColor = "#c2410c";
                                finalStatusBg = "#fff7ed";
                                finalStatusDesc = "Some suits delivered & partial payment received. Booking remains open.";
                                ledgerActionDesc = "No ledger entry created (Booking remains open).";
                            }
                        }

                        return (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                <Box>
                                    <Typography variant="h6" fontWeight={800} color="text.primary">
                                        Order Check Out Wizard — Step 3 of 3
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Review and confirm. System will decide the final status automatically.
                                    </Typography>
                                </Box>

                                <Grid container spacing={2.5}>
                                    {/* Delivery Summary */}
                                    <Grid size={{ xs: 6 }}>
                                        <Card variant="outlined" sx={{ p: 2.5, borderRadius: 2, height: '100%' }}>
                                            <Typography variant="subtitle2" fontWeight={800} color="primary.main" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                                Delivery Summary
                                            </Typography>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography variant="body2" color="text.secondary">Total Suits in Booking</Typography>
                                                    <Typography variant="body2" fontWeight={700}>{totalSuitsInBooking}</Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography variant="body2" color="text.secondary">Already Delivered (Before This)</Typography>
                                                    <Typography variant="body2" fontWeight={700}>{alreadyDeliveredBeforeThis}</Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography variant="body2" color="text.secondary">Delivered Now</Typography>
                                                    <Typography variant="body2" fontWeight={700} color="primary.main">{deliveredNow}</Typography>
                                                </Box>
                                                <Divider />
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Typography variant="body2" fontWeight={700}>Total Delivered (After This)</Typography>
                                                    <Typography variant="subtitle1" fontWeight={800} color="primary.dark">{totalDeliveredAfterThis}</Typography>
                                                </Box>
                                            </Box>
                                        </Card>
                                    </Grid>

                                    {/* Payment Summary */}
                                    <Grid size={{ xs: 6 }}>
                                        <Card variant="outlined" sx={{ p: 2.5, borderRadius: 2, height: '100%' }}>
                                            <Typography variant="subtitle2" fontWeight={800} color="primary.main" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                                Payment Summary
                                            </Typography>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography variant="body2" color="text.secondary">Total Amount</Typography>
                                                    <Typography variant="body2" fontWeight={700}>Rs. {totalAmount.toLocaleString()}</Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography variant="body2" color="text.secondary">Already Paid</Typography>
                                                    <Typography variant="body2" fontWeight={700}>Rs. {alreadyPaid.toLocaleString()}</Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography variant="body2" color="text.secondary">Cash Received</Typography>
                                                    <Typography variant="body2" fontWeight={700} color="success.main">Rs. {cashReceived.toLocaleString()}</Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography variant="body2" color="text.secondary">Discount</Typography>
                                                    <Typography variant="body2" fontWeight={700} color="warning.dark">Rs. {discount.toLocaleString()}</Typography>
                                                </Box>
                                                <Divider />
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography variant="body2" fontWeight={700}>Total Paid (Before + This)</Typography>
                                                    <Typography variant="body2" fontWeight={800} color="success.main">Rs. {totalPaidBeforeAndThis.toLocaleString()}</Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Typography variant="body2" fontWeight={700}>Remaining Balance</Typography>
                                                    <Typography variant="subtitle1" fontWeight={800} color={remainingBalanceAfterPayment > 0 ? "error.main" : "success.main"}>
                                                        Rs. {remainingBalanceAfterPayment.toLocaleString()}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Card>
                                    </Grid>
                                </Grid>

                                {/* Automatic Status Decision Card */}
                                <Card variant="outlined" sx={{ p: 2.5, borderRadius: 2, bgcolor: finalStatusBg, borderColor: finalStatusColor + '80' }}>
                                    <Typography variant="caption" fontWeight={800} sx={{ color: finalStatusColor, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 0.5 }}>
                                        AUTOMATIC FINAL STATUS DECISION
                                    </Typography>
                                    <Typography variant="h6" fontWeight={800} sx={{ color: finalStatusColor, mb: 1 }}>
                                        {finalStatusTitle}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: finalStatusColor, opacity: 0.9 }}>
                                        {finalStatusDesc}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: finalStatusColor, fontWeight: 700, display: 'block', mt: 1 }}>
                                        💡 Ledger Action: {ledgerActionDesc}
                                    </Typography>
                                </Card>
                            </Box>
                        );
                    })()}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3, pt: 1, display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                    <Button
                        variant="outlined"
                        color="inherit"
                        disabled={paying}
                        onClick={() => {
                            if (checkoutStep === 1) {
                                setCheckoutOpen(false);
                            } else {
                                setCheckoutStep(checkoutStep - 1);
                            }
                        }}
                        sx={{ textTransform: 'none', borderRadius: 2, px: 3, fontWeight: 700 }}
                    >
                        {checkoutStep === 1 ? "Cancel" : "Back"}
                    </Button>

                    <Button
                        variant="contained"
                        color={checkoutStep === 3 ? "success" : "primary"}
                        disabled={paying || (checkoutStep === 1 && deliveredNow === 0) || (checkoutStep === 2 && isExceeding)}
                        onClick={() => {
                            if (checkoutStep < 3) {
                                setCheckoutStep(checkoutStep + 1);
                            } else {
                                handleCheckoutSubmit();
                            }
                        }}
                        startIcon={checkoutStep === 3 ? <ScanLine size={18} /> : null}
                        sx={{
                            textTransform: 'none',
                            borderRadius: 2,
                            px: 4,
                            py: 1.2,
                            fontWeight: 800,
                            bgcolor: checkoutStep === 3 ? "#16a34a" : "#3b82f6",
                            '&:hover': {
                                bgcolor: checkoutStep === 3 ? "#15803d" : "#2563eb",
                            }
                        }}
                    >
                        {paying ? <CircularProgress size={22} color="inherit" /> : checkoutStep === 3 ? "Confirm & Complete Checkout" : "Next"}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    })();

    return (
        <Box sx={{ width: '100%', p: 3 }}>
            {formDialog}
            {paymentDialog}
            {checkoutDialog}

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
                    <MenuItem value="COMPLETED">Completed</MenuItem>
                    <MenuItem value="RETURNED">Returned</MenuItem>
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
                    options={customerOptions}
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
                    value={(customerOptions || []).find(c => c.id === filterCustomerId) || null}
                    onChange={(_, newValue) => setFilterCustomerId(newValue ? newValue.id : null)}
                    onInputChange={(event, newInputValue, reason) => {
                        if (reason === "input") {
                            setCustomerSearchInput(newInputValue);
                        }
                    }}
                    loading={searchingCustomers}
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
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Customer"
                            InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                    <>
                                        {searchingCustomers ? <CircularProgress color="inherit" size={20} /> : null}
                                        {params.InputProps.endAdornment}
                                    </>
                                )
                            }}
                        />
                    )}
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
                            <TableCell sx={{ fontWeight: 700, color: '#374151' }}>Items</TableCell>
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
                                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
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
                                    {/* Items */}
                                    <TableCell>
                                        {(() => {
                                            const stitchItems = (booking.items || []).filter(i => !i.productId);
                                            const prodItems = (booking.items || []).filter(i => !!i.productId);
                                            const suitsQty = stitchItems.filter(i => i.stitchingType !== "WAISTCOAT").reduce((s, i) => s + (parseFloat(i.quantity) || 1), 0);
                                            const wskotsQty = stitchItems.filter(i => i.stitchingType === "WAISTCOAT").reduce((s, i) => s + (parseFloat(i.quantity) || 1), 0);
                                            const prodQty = prodItems.reduce((s, i) => s + (parseFloat(i.quantity) || 1), 0);
                                            return (
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4 }}>
                                                    {suitsQty > 0 && (
                                                        <Chip size="small"
                                                            label={`${suitsQty} Suit${suitsQty > 1 ? 's' : ''}`}
                                                            sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700, bgcolor: '#ede9fe', color: '#6d28d9', borderRadius: 1 }} />
                                                    )}
                                                    {wskotsQty > 0 && (
                                                        <Chip size="small"
                                                            label={`${wskotsQty} W.Coat${wskotsQty > 1 ? 's' : ''}`}
                                                            sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700, bgcolor: '#fbcfe8', color: '#be185d', borderRadius: 1 }} />
                                                    )}
                                                    {prodQty > 0 && (
                                                        <Chip size="small"
                                                            label={`${prodQty} Product${prodQty > 1 ? 's' : ''}`}
                                                            sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700, bgcolor: '#dbeafe', color: '#1d4ed8', borderRadius: 1 }} />
                                                    )}
                                                    {suitsQty === 0 && wskotsQty === 0 && prodQty === 0 && (
                                                        <Typography variant="caption" color="text.disabled">—</Typography>
                                                    )}
                                                </Box>
                                            );
                                        })()}
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
                                        {(() => {
                                            const discountAmt = (booking.items || []).reduce((s, i) => s + parseFloat(i.discount || 0), 0);
                                            return (
                                                <>
                                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>Rs.&nbsp;{parseFloat(booking.totalAmount).toFixed(0)}</Typography>
                                                    {discountAmt > 0 && (
                                                        <Typography variant="caption" color="error.main" sx={{ display: 'block', fontWeight: 600 }}>
                                                            Disc: Rs.&nbsp;{discountAmt.toFixed(0)}
                                                        </Typography>
                                                    )}
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Adv: Rs.&nbsp;{parseFloat(booking.advanceAmount).toFixed(0)}</Typography>
                                                    <Typography variant="caption" sx={{ display: 'block', color: '#dc2626', fontWeight: 600 }}>Rem: Rs.&nbsp;{parseFloat(booking.remainingAmount).toFixed(0)}</Typography>
                                                    {booking.billStatus && (
                                                        <Chip 
                                                            label={booking.billStatus} 
                                                            size="small" 
                                                            sx={{ 
                                                                mt: 0.5, 
                                                                height: 18, 
                                                                fontSize: '0.62rem', 
                                                                fontWeight: 700, 
                                                                bgcolor: booking.billStatus === "Clear Bill" ? "#d1fae5" : "#fee2e2", 
                                                                color: booking.billStatus === "Clear Bill" ? "#065f46" : "#991b1b" 
                                                            }} 
                                                        />
                                                    )}
                                                </>
                                            );
                                        })()}
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
                                            {parseFloat(booking.remainingAmount) > 0 && (
                                                <Tooltip title="Pay / Clear Bill">
                                                    <IconButton size="small" sx={{ color: '#10b981' }} onClick={() => handleOpenPayDialog(booking)}>
                                                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                            <Tooltip title="Print">
                                                <IconButton size="small" color="primary" onClick={() => handlePrintClick(booking)}><Printer size={17} /></IconButton>
                                            </Tooltip>
                                            {isAdmin && (
                                                <Tooltip title="Delete Booking">
                                                    <IconButton size="small" color="error" onClick={() => handleDelete(booking.id)}><Trash2 size={17} /></IconButton>
                                                </Tooltip>
                                            )}
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
                        {isBulkPrint ? (
                            <>
                                <Button variant="outlined" size="large" startIcon={<BookText />}
                                    onClick={() => handlePrintConfirm('MERGED_BILL')}
                                    sx={{ justifyContent: 'flex-start', py: 1.5, borderRadius: 2, textTransform: 'none' }}>
                                    Print Merged Bill / Invoice
                                </Button>
                                <Button variant="outlined" size="large" startIcon={<BookText />}
                                    onClick={() => handlePrintConfirm('BILL')}
                                    sx={{ justifyContent: 'flex-start', py: 1.5, borderRadius: 2, textTransform: 'none' }}>
                                    Print Separate Bills / Invoices
                                </Button>
                            </>
                        ) : (
                            <Button variant="outlined" size="large" startIcon={<BookText />}
                                onClick={() => handlePrintConfirm('BILL')}
                                sx={{ justifyContent: 'flex-start', py: 1.5, borderRadius: 2, textTransform: 'none' }}>
                                Print Bill / Invoice
                            </Button>
                        )}
                        <Button variant="outlined" size="large" startIcon={<Ruler />}
                            onClick={() => handlePrintConfirm('STITCHING')}
                            sx={{ justifyContent: 'flex-start', py: 1.5, borderRadius: 2, textTransform: 'none' }}>
                            {isBulkPrint ? "Print Stitching Details (Separate)" : "Print Stitching Details"}
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
                                            const statusColors = { PENDING: "#f59e0b", READY: "#10b981", COMPLETED: "#059669", RETURNED: "#ef4444", DELIVERED: "#059669", CANCELLED: "#ef4444" };
                                            const sc = statusColors[item.itemStatus || "PENDING"] || "#6b7280";
                                            const isWskot = item.stitchingType === "WAISTCOAT" || (!item.qameez_lambai && item.wskot_lambai);
                                            const isStitch = (item.selectedOptions || []).length > 0 || !item.productId;
                                            const itemType = isStitch ? (isWskot ? "Waistcoat" : "Suit") : "";
                                            return (
                                                <TableRow key={idx}>
                                                    <TableCell sx={{ fontWeight: 600, verticalAlign: 'top' }}>
                                                        {itemType ? `${itemType} ` : ""}{item.product?.name || (isStitch ? "Custom Stitching" : "Product")}
                                                    </TableCell>
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
            {(printBooking || bulkPrintBookings.length > 0) && (
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
                    {bulkPrintBookings.length > 0 && (
                        printType === 'MERGED_BILL' ? (
                            <div className="print-page">
                                <MergedCustomerBill bookings={bulkPrintBookings} />
                            </div>
                        ) : (
                            bulkPrintBookings.map((bk) => (
                                <div key={bk.id} className="print-page">
                                    {printType === 'BILL'
                                        ? <CustomerBill booking={bk} />
                                        : <TailorTicket booking={bk} measurements={null} />
                                    }
                                </div>
                            ))
                        )
                    )}
                </div>
            )}

            <GlobalStyles styles={{
                '@media print': {
                    '@page': {
                        size: (printType === 'BILL' || printType === 'MERGED_BILL') ? '80mm auto' : 'A4 portrait',
                        margin: (printType === 'BILL' || printType === 'MERGED_BILL') ? '0' : '10mm',
                        marginTop: '0mm',
                        marginBottom: '0mm'
                    },
                    'html, body': {
                        width: (printType === 'BILL' || printType === 'MERGED_BILL') ? '80mm !important' : 'auto !important',
                        margin: '0 !important',
                        padding: '0 !important',
                        height: 'auto !important',
                        overflow: 'visible !important',
                        backgroundColor: 'white !important',
                    },
                    'body *': { visibility: 'hidden' },
                    '#printable-section': {
                        display: 'block !important',
                        visibility: 'visible',
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        width: (printType === 'BILL' || printType === 'MERGED_BILL') ? '80mm !important' : '100%',
                        margin: (printType === 'BILL' || printType === 'MERGED_BILL') ? '0 !important' : '0',
                        padding: (printType === 'BILL' || printType === 'MERGED_BILL') ? '4mm 3mm !important' : '0',
                        boxSizing: 'border-box !important',
                        backgroundColor: 'white',
                    },
                    '#printable-section *': {
                        visibility: 'visible',
                        color: (printType === 'BILL' || printType === 'MERGED_BILL') ? '#000000 !important' : 'inherit',
                        fontWeight: (printType === 'BILL' || printType === 'MERGED_BILL') ? 'bold !important' : 'inherit',
                        borderColor: (printType === 'BILL' || printType === 'MERGED_BILL') ? '#000000 !important' : 'inherit',
                        fontFamily: (printType === 'BILL' || printType === 'MERGED_BILL') ? 'Arial, Helvetica, sans-serif !important' : 'inherit',
                    },
                    '#printable-section .print-page': {
                        width: '100% !important',
                        pageBreakAfter: 'always',
                        breakAfter: 'page',
                        pageBreakInside: 'avoid',
                        marginBottom: (printType === 'BILL' || printType === 'MERGED_BILL') ? '0 !important' : 'auto',
                    },
                    '#printable-section .print-page:last-child': {
                        pageBreakAfter: 'auto',
                        breakAfter: 'auto',
                    },
                    '#printable-section table': {
                        tableLayout: (printType === 'BILL' || printType === 'MERGED_BILL') ? 'auto !important' : 'fixed',
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
