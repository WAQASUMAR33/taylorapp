"use client";

import { useState, useMemo } from "react";
import {
    Box, Card, CardContent, Typography, TextField, InputAdornment,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Chip, IconButton, Collapse, Grid, Divider, Button, Stack,
    Tooltip,
} from "@mui/material";
import {
    Search, ChevronDown, ChevronUp, ReceiptText, TrendingUp,
    BadgePercent, ShoppingBag, Users, CalendarRange, X,
} from "lucide-react";

function fmt(n) {
    return "Rs. " + parseFloat(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d) {
    return new Date(d).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtDateTime(d) {
    return new Date(d).toLocaleString("en-PK", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const QUICK_RANGES = [
    { label: "Today", getDates: () => { const d = new Date(); d.setHours(0,0,0,0); return [d, new Date()]; } },
    { label: "This Week", getDates: () => { const d = new Date(); d.setDate(d.getDate() - d.getDay()); d.setHours(0,0,0,0); return [d, new Date()]; } },
    { label: "This Month", getDates: () => { const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return [d, new Date()]; } },
    { label: "Last Month", getDates: () => {
        const s = new Date(); s.setDate(1); s.setMonth(s.getMonth() - 1); s.setHours(0,0,0,0);
        const e = new Date(); e.setDate(0); e.setHours(23,59,59,999);
        return [s, e];
    }},
    { label: "This Year", getDates: () => { const d = new Date(); d.setMonth(0,1); d.setHours(0,0,0,0); return [d, new Date()]; } },
];

function ExpandableRow({ bill }) {
    const [open, setOpen] = useState(false);
    const total = parseFloat(bill.total || 0);
    const discount = parseFloat(bill.discount || 0);
    const subtotal = parseFloat(bill.subtotal || 0);

    return (
        <>
            <TableRow hover sx={{ "& > *": { borderBottom: open ? "unset" : undefined }, cursor: "pointer" }} onClick={() => setOpen(!open)}>
                <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <IconButton size="small" sx={{ p: 0.3 }}>
                            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </IconButton>
                        <Typography variant="body2" fontWeight={700} fontFamily="monospace">{bill.billNumber}</Typography>
                    </Box>
                </TableCell>
                <TableCell>
                    <Typography variant="caption" color="text.secondary">{fmtDateTime(bill.createdAt)}</Typography>
                </TableCell>
                <TableCell>
                    {bill.customer ? (
                        <Box>
                            <Typography variant="body2" fontWeight={600}>{bill.customer.name}</Typography>
                            {bill.customer.phone && (
                                <Typography variant="caption" color="text.secondary">{bill.customer.phone}</Typography>
                            )}
                        </Box>
                    ) : (
                        <Chip label="Walk-in" size="small" variant="outlined" sx={{ borderRadius: 1, fontSize: "0.7rem" }} />
                    )}
                </TableCell>
                <TableCell align="center">
                    <Chip label={bill.items?.length || 0} size="small" sx={{ borderRadius: 1, fontWeight: 700, minWidth: 32 }} />
                </TableCell>
                <TableCell align="right">
                    <Typography variant="body2" color="text.secondary">
                        {fmt(subtotal)}
                    </Typography>
                </TableCell>
                <TableCell align="right">
                    {discount > 0 ? (
                        <Typography variant="body2" color="error.main" fontWeight={600}>− {fmt(discount)}</Typography>
                    ) : (
                        <Typography variant="body2" color="text.disabled">—</Typography>
                    )}
                </TableCell>
                <TableCell align="right">
                    <Typography variant="body2" fontWeight={800} color="success.main">{fmt(total)}</Typography>
                </TableCell>
            </TableRow>

            {/* Expandable items */}
            <TableRow>
                <TableCell colSpan={7} sx={{ py: 0, bgcolor: "action.hover" }}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ py: 1.5, px: 4 }}>
                            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 1, display: "block", textTransform: "uppercase", letterSpacing: 0.5 }}>
                                Items
                            </Typography>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 600, py: 0.5, fontSize: "0.75rem" }}>Product</TableCell>
                                        <TableCell sx={{ fontWeight: 600, py: 0.5, fontSize: "0.75rem" }}>Code</TableCell>
                                        <TableCell sx={{ fontWeight: 600, py: 0.5, fontSize: "0.75rem" }} align="center">Qty</TableCell>
                                        <TableCell sx={{ fontWeight: 600, py: 0.5, fontSize: "0.75rem" }} align="right">Unit Price</TableCell>
                                        <TableCell sx={{ fontWeight: 600, py: 0.5, fontSize: "0.75rem" }} align="right">Item Disc</TableCell>
                                        <TableCell sx={{ fontWeight: 600, py: 0.5, fontSize: "0.75rem" }} align="right">Total</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {(bill.items || []).map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell sx={{ py: 0.5, fontSize: "0.8rem" }}>{item.product?.name || "—"}</TableCell>
                                            <TableCell sx={{ py: 0.5, fontSize: "0.75rem", fontFamily: "monospace", color: "text.secondary" }}>{item.product?.sku || "—"}</TableCell>
                                            <TableCell sx={{ py: 0.5, fontSize: "0.8rem" }} align="center">{item.quantity}</TableCell>
                                            <TableCell sx={{ py: 0.5, fontSize: "0.8rem" }} align="right">{fmt(item.unitPrice)}</TableCell>
                                            <TableCell sx={{ py: 0.5, fontSize: "0.8rem" }} align="right">
                                                {parseFloat(item.discount) > 0
                                                    ? <Typography variant="caption" color="error.main">{parseFloat(item.discount)}%</Typography>
                                                    : "—"}
                                            </TableCell>
                                            <TableCell sx={{ py: 0.5, fontSize: "0.8rem", fontWeight: 700 }} align="right">{fmt(item.total)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            {bill.notes && (
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                                    Note: {bill.notes}
                                </Typography>
                            )}
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </>
    );
}

export default function SaleListClient({ initialBills }) {
    const [search, setSearch] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [activeQuick, setActiveQuick] = useState(null);

    const applyQuickRange = (range) => {
        const [from, to] = range.getDates();
        setDateFrom(from.toISOString().slice(0, 10));
        setDateTo(to.toISOString().slice(0, 10));
        setActiveQuick(range.label);
    };

    const clearFilters = () => {
        setDateFrom("");
        setDateTo("");
        setSearch("");
        setActiveQuick(null);
    };

    const filtered = useMemo(() => {
        return initialBills.filter((bill) => {
            const q = search.toLowerCase();
            const matchSearch = !q ||
                bill.billNumber.toLowerCase().includes(q) ||
                (bill.customer?.name || "").toLowerCase().includes(q) ||
                (bill.customer?.phone || "").includes(q);

            const billDate = new Date(bill.createdAt);
            const from = dateFrom ? new Date(dateFrom + "T00:00:00") : null;
            const to = dateTo ? new Date(dateTo + "T23:59:59") : null;
            const matchDate = (!from || billDate >= from) && (!to || billDate <= to);

            return matchSearch && matchDate;
        });
    }, [initialBills, search, dateFrom, dateTo]);

    // Stats over filtered bills
    const stats = useMemo(() => {
        const totalRevenue = filtered.reduce((s, b) => s + parseFloat(b.total || 0), 0);
        const totalDiscount = filtered.reduce((s, b) => s + parseFloat(b.discount || 0), 0);
        const totalSubtotal = filtered.reduce((s, b) => s + parseFloat(b.subtotal || 0), 0);
        const totalItems = filtered.reduce((s, b) => s + (b.items?.reduce((si, i) => si + i.quantity, 0) || 0), 0);
        const uniqueCustomers = new Set(filtered.filter(b => b.customerId).map(b => b.customerId)).size;
        const avgBill = filtered.length > 0 ? totalRevenue / filtered.length : 0;
        return { totalRevenue, totalDiscount, totalSubtotal, totalItems, uniqueCustomers, avgBill, count: filtered.length };
    }, [filtered]);

    const hasFilters = search || dateFrom || dateTo;

    return (
        <Box sx={{ px: 3, pb: 4 }}>

            {/* ── Stat Cards ───────────────────────────────────── */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                    { label: "Total Revenue", value: fmt(stats.totalRevenue), icon: <TrendingUp size={22} />, color: "#2563eb", bg: "#eff6ff" },
                    { label: "Total Bills", value: stats.count, icon: <ReceiptText size={22} />, color: "#7c3aed", bg: "#f5f3ff" },
                    { label: "Avg Bill Value", value: fmt(stats.avgBill), icon: <ShoppingBag size={22} />, color: "#059669", bg: "#ecfdf5" },
                    { label: "Total Discount", value: fmt(stats.totalDiscount), icon: <BadgePercent size={22} />, color: "#dc2626", bg: "#fef2f2" },
                    { label: "Items Sold", value: stats.totalItems, icon: <ShoppingBag size={20} />, color: "#d97706", bg: "#fffbeb" },
                    { label: "Customers", value: stats.uniqueCustomers, icon: <Users size={22} />, color: "#0891b2", bg: "#ecfeff" },
                ].map((s) => (
                    <Grid key={s.label} size={{ xs: 6, sm: 4, md: 2 }}>
                        <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, height: "100%" }}>
                            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase", letterSpacing: 0.4, lineHeight: 1.3 }}>
                                        {s.label}
                                    </Typography>
                                    <Box sx={{ bgcolor: s.bg, color: s.color, p: 0.6, borderRadius: 1.5, display: "flex" }}>
                                        {s.icon}
                                    </Box>
                                </Box>
                                <Typography variant="h6" fontWeight={800} color="text.primary" sx={{ lineHeight: 1.2 }}>
                                    {s.value}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* ── Filters ──────────────────────────────────────── */}
            <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, p: 2, mb: 3 }}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }} flexWrap="wrap">
                    <TextField
                        placeholder="Search bill no. or customer…"
                        size="small"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        sx={{ minWidth: 260, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><Search size={16} /></InputAdornment>,
                        }}
                    />
                    <TextField
                        label="From" type="date" size="small"
                        value={dateFrom}
                        onChange={(e) => { setDateFrom(e.target.value); setActiveQuick(null); }}
                        InputLabelProps={{ shrink: true }}
                        sx={{ minWidth: 160, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                    />
                    <TextField
                        label="To" type="date" size="small"
                        value={dateTo}
                        onChange={(e) => { setDateTo(e.target.value); setActiveQuick(null); }}
                        InputLabelProps={{ shrink: true }}
                        sx={{ minWidth: 160, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                    />

                    {/* Quick ranges */}
                    <Box sx={{ display: "flex", gap: 0.8, flexWrap: "wrap", alignItems: "center" }}>
                        <CalendarRange size={15} color="#6b7280" />
                        {QUICK_RANGES.map((r) => (
                            <Chip
                                key={r.label}
                                label={r.label}
                                size="small"
                                clickable
                                onClick={() => applyQuickRange(r)}
                                color={activeQuick === r.label ? "primary" : "default"}
                                variant={activeQuick === r.label ? "filled" : "outlined"}
                                sx={{ borderRadius: 1.5, fontWeight: 500, fontSize: "0.72rem" }}
                            />
                        ))}
                    </Box>

                    {hasFilters && (
                        <Tooltip title="Clear filters">
                            <IconButton size="small" onClick={clearFilters} sx={{ color: "error.main" }}>
                                <X size={17} />
                            </IconButton>
                        </Tooltip>
                    )}
                </Stack>
            </Paper>

            {/* ── Bills Table ───────────────────────────────────── */}
            <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, overflow: "hidden" }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: "action.hover" }}>
                                <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Bill #</TableCell>
                                <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Date & Time</TableCell>
                                <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Customer</TableCell>
                                <TableCell sx={{ fontWeight: 700, py: 1.5 }} align="center">Items</TableCell>
                                <TableCell sx={{ fontWeight: 700, py: 1.5 }} align="right">Subtotal</TableCell>
                                <TableCell sx={{ fontWeight: 700, py: 1.5 }} align="right">Discount</TableCell>
                                <TableCell sx={{ fontWeight: 700, py: 1.5 }} align="right">Total</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filtered.length > 0 ? (
                                filtered.map((bill) => <ExpandableRow key={bill.id} bill={bill} />)
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                                        <ReceiptText size={40} color="#d1d5db" />
                                        <Typography color="text.secondary" sx={{ mt: 1 }}>
                                            {hasFilters ? "No bills match your filters." : "No bills recorded yet."}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {filtered.length > 0 && (
                    <Box sx={{ px: 3, py: 1.5, borderTop: "1px solid", borderColor: "divider", display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "action.hover" }}>
                        <Typography variant="caption" color="text.secondary">
                            Showing {filtered.length} of {initialBills.length} bill{initialBills.length !== 1 ? "s" : ""}
                        </Typography>
                        <Typography variant="body2" fontWeight={700} color="success.main">
                            Total: {fmt(stats.totalRevenue)}
                        </Typography>
                    </Box>
                )}
            </Paper>
        </Box>
    );
}
