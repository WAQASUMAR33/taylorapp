"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    Box, Grid, Card, CardContent, Typography, TextField, Button,
    Autocomplete, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, Chip, Avatar, Divider,
    CircularProgress, Alert, InputAdornment, Tooltip, LinearProgress
} from "@mui/material";
import {
    BarChart3, TrendingUp, TrendingDown, DollarSign, Users,
    Scissors, Calendar, RefreshCw, Filter, ShoppingBag,
    ArrowUpRight, ArrowDownRight, Clock, CheckCircle, AlertCircle,
    Package, Wallet, CreditCard, Receipt
} from "lucide-react";

// ─── colour palette helpers ──────────────────────────────────────────────────
const fmt = (n) =>
    new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 }).format(n ?? 0);

const STATUS_COLOR = {
    PENDING: { bg: "#fef3c7", color: "#92400e", label: "Pending" },
    MEASUREMENT_TAKEN: { bg: "#dbeafe", color: "#1e40af", label: "Measured" },
    CUTTING: { bg: "#ede9fe", color: "#5b21b6", label: "Cutting" },
    STITCHING: { bg: "#fce7f3", color: "#9d174d", label: "Stitching" },
    TRIAL: { bg: "#d1fae5", color: "#065f46", label: "Trial" },
    READY: { bg: "#ccfbf1", color: "#0f766e", label: "Ready" },
    DELIVERED: { bg: "#dcfce7", color: "#166534", label: "Delivered" },
    CANCELLED: { bg: "#fee2e2", color: "#991b1b", label: "Cancelled" },
};

// ─── Stat card ───────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color, bgColor, trend }) {
    return (
        <Card variant="outlined" sx={{
            borderRadius: 3, border: "1px solid #e5e7eb", height: "100%",
            transition: "box-shadow 0.2s", "&:hover": { boxShadow: "0 8px 24px rgba(0,0,0,0.09)" }
        }}>
            <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ letterSpacing: "0.05em", textTransform: "uppercase", fontSize: "0.7rem" }}>
                            {label}
                        </Typography>
                        <Typography variant="h5" fontWeight={800} sx={{ mt: 0.5, color: color || "#1f2937" }}>
                            Rs. {fmt(value)}
                        </Typography>
                        {sub && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                                {sub}
                            </Typography>
                        )}
                    </Box>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: bgColor || "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon size={20} color={color || "#6b7280"} />
                    </Box>
                </Box>
                {trend !== undefined && (
                    <Box sx={{ mt: 1.5, display: "flex", alignItems: "center", gap: 0.5 }}>
                        {trend >= 0 ? <ArrowUpRight size={14} color="#059669" /> : <ArrowDownRight size={14} color="#dc2626" />}
                        <Typography variant="caption" sx={{ color: trend >= 0 ? "#059669" : "#dc2626", fontWeight: 600 }}>
                            {Math.abs(trend).toFixed(1)}% profit margin
                        </Typography>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
}

// ─── Staff breakdown row ──────────────────────────────────────────────────────
function StaffRow({ item, max, color }) {
    const pct = max > 0 ? (item.amount / max) * 100 : 0;
    return (
        <Box sx={{ mb: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Avatar sx={{ width: 28, height: 28, fontSize: "0.75rem", bgcolor: color + "20", color: color, fontWeight: 700 }}>
                        {item.name?.[0]?.toUpperCase()}
                    </Avatar>
                    <Typography variant="body2" fontWeight={600}>{item.name}</Typography>
                    <Chip size="small" label={`${item.count} orders`} sx={{ height: 18, fontSize: "0.65rem", bgcolor: "#f3f4f6" }} />
                </Box>
                <Typography variant="body2" fontWeight={700} color={color}>Rs. {fmt(item.amount)}</Typography>
            </Box>
            <LinearProgress variant="determinate" value={pct}
                sx={{
                    height: 6, borderRadius: 3, bgcolor: "#f3f4f6",
                    "& .MuiLinearProgress-bar": { bgcolor: color, borderRadius: 3 }
                }} />
        </Box>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AnalyticsClient({ employees }) {
    const tailors = employees.filter(e => e.role === "TAILOR" || e.role === "Tailor");
    const cutters = employees.filter(e => e.role === "CUTTER" || e.role === "Cutter");
    // If roles don't match strictly, fall back to all employees in dropdowns
    const allForDropdown = employees;

    const today = new Date().toISOString().split("T")[0];
    const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];

    const [from, setFrom] = useState(firstOfMonth);
    const [to, setTo] = useState(today);
    const [filterTailor, setFilterTailor] = useState(null);
    const [filterCutter, setFilterCutter] = useState(null);

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const FIELD_SX = {
        "& .MuiOutlinedInput-root": {
            bgcolor: "white", borderRadius: 2,
            "& fieldset": { borderColor: "#e5e7eb" },
            "&:hover fieldset": { borderColor: "#8b5cf6" },
            "&.Mui-focused fieldset": { borderColor: "#8b5cf6", borderWidth: 2 },
        }
    };

    const fetchAnalytics = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const params = new URLSearchParams();
            if (from) params.set("from", from);
            if (to) params.set("to", to);
            if (filterTailor) params.set("tailorId", filterTailor.id);
            if (filterCutter) params.set("cutterId", filterCutter.id);

            const res = await fetch(`/api/analytics?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch analytics");
            const json = await res.json();
            setData(json);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [from, to, filterTailor, filterCutter]);

    useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

    const s = data?.summary || {};
    const profitMargin = s.totalBookingAmount > 0 ? ((s.totalProfit / s.totalBookingAmount) * 100) : 0;
    const tailorMax = Math.max(...(data?.tailorBreakdown || []).map(t => t.amount), 1);
    const cutterMax = Math.max(...(data?.cutterBreakdown || []).map(c => c.amount), 1);

    return (
        <Box sx={{ p: 3 }}>
            {/* ── Page header ── */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3, pb: 1.5, borderBottom: "1px solid #e5e7eb" }}>
                <Box sx={{ p: 1, bgcolor: "#3b82f6", borderRadius: 2, display: "flex" }}>
                    <BarChart3 size={22} color="white" />
                </Box>
                <Box>
                    <Typography variant="h4" fontWeight={800} color="#1f2937">Analytics</Typography>
                    <Typography variant="body2" color="text.secondary">Date-wise insights on bookings, staff performance and financials</Typography>
                </Box>
                <Box sx={{ ml: "auto" }}>
                    <Button variant="contained" startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <RefreshCw size={14} />}
                        onClick={fetchAnalytics} disabled={loading}
                        sx={{
                            bgcolor: "#3b82f6", borderRadius: 2, textTransform: "none", fontWeight: 600,
                            "&:hover": { bgcolor: "#2563eb" }
                        }}>
                        Refresh
                    </Button>
                </Box>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError("")}>{error}</Alert>}

            {/* ── Filters ── */}
            <Card variant="outlined" sx={{ mb: 3, borderRadius: 3, border: "1px solid #e5e7eb" }}>
                <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 1, bgcolor: "#f8fafc", borderBottom: "1px solid #e5e7eb" }}>
                    <Filter size={15} color="#8b5cf6" />
                    <Typography variant="subtitle2" fontWeight={700} color="#374151">Filters</Typography>
                </Box>
                <Box sx={{ p: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField fullWidth size="small" label="From Date" type="date" value={from}
                                onChange={e => setFrom(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                InputProps={{ startAdornment: <InputAdornment position="start"><Calendar size={15} color="#9ca3af" /></InputAdornment> }}
                                sx={FIELD_SX} />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField fullWidth size="small" label="To Date" type="date" value={to}
                                onChange={e => setTo(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                InputProps={{ startAdornment: <InputAdornment position="start"><Calendar size={15} color="#9ca3af" /></InputAdornment> }}
                                sx={FIELD_SX} />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Autocomplete options={allForDropdown} getOptionLabel={o => o.name || ""}
                                value={filterTailor} onChange={(_, v) => setFilterTailor(v)}
                                renderInput={params => <TextField {...params} label="Filter by Tailor" size="small" sx={{ minWidth: 300, ...FIELD_SX }} />} />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Autocomplete options={allForDropdown} getOptionLabel={o => o.name || ""}
                                value={filterCutter} onChange={(_, v) => setFilterCutter(v)}
                                renderInput={params => <TextField {...params} label="Filter by Cutter" size="small" sx={{ minWidth: 300, ...FIELD_SX }} />} />
                        </Grid>
                        <Grid item xs={12} sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                            <Button size="small" variant="outlined"
                                onClick={() => { setFrom(firstOfMonth); setTo(today); setFilterTailor(null); setFilterCutter(null); }}
                                sx={{ borderRadius: 2, textTransform: "none", borderColor: "#d1d5db", color: "#6b7280" }}>
                                Reset
                            </Button>
                            <Button size="small" variant="contained" onClick={fetchAnalytics} disabled={loading}
                                sx={{ borderRadius: 2, textTransform: "none", bgcolor: "#8b5cf6", "&:hover": { bgcolor: "#7c3aed" } }}>
                                Apply Filters
                            </Button>
                        </Grid>
                    </Grid>
                </Box>
            </Card>

            {loading && !data && (
                <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                    <CircularProgress sx={{ color: "#8b5cf6" }} />
                </Box>
            )}

            {data && (
                <>
                    {/* ── Summary Stats ── */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard icon={ShoppingBag} label="Total Bookings" value={s.totalBookingAmount}
                                sub={`${s.bookingCount} orders`} color="#8b5cf6" bgColor="#ede9fe"
                                trend={profitMargin} />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard icon={CheckCircle} label="Amount Received" value={s.totalReceived}
                                color="#059669" bgColor="#d1fae5" />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard icon={Clock} label="Amount Pending" value={s.totalPending}
                                color="#d97706" bgColor="#fef3c7" />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard icon={TrendingUp} label="Net Profit" value={s.totalProfit}
                                color={s.totalProfit >= 0 ? "#059669" : "#dc2626"}
                                bgColor={s.totalProfit >= 0 ? "#d1fae5" : "#fee2e2"} />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard icon={Package} label="Total Cost" value={s.totalCost}
                                color="#6b7280" bgColor="#f3f4f6" />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard icon={Wallet} label="Total Receivables" value={s.totalReceivables}
                                sub="From customer balances" color="#2563eb" bgColor="#dbeafe" />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard icon={CreditCard} label="Total Payable" value={s.totalPayable}
                                sub="Outstanding supplier dues" color="#dc2626" bgColor="#fee2e2" />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card variant="outlined" sx={{ borderRadius: 3, border: "1px solid #e5e7eb", height: "100%" }}>
                                <CardContent sx={{ p: 2.5 }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}
                                        sx={{ textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.05em" }}>
                                        Profit Margin
                                    </Typography>
                                    <Typography variant="h5" fontWeight={800} sx={{ mt: 0.5, color: profitMargin >= 0 ? "#059669" : "#dc2626" }}>
                                        {profitMargin.toFixed(1)}%
                                    </Typography>
                                    <LinearProgress variant="determinate" value={Math.min(Math.abs(profitMargin), 100)}
                                        sx={{
                                            mt: 1.5, height: 8, borderRadius: 4, bgcolor: "#f3f4f6",
                                            "& .MuiLinearProgress-bar": { bgcolor: profitMargin >= 0 ? "#059669" : "#dc2626", borderRadius: 4 }
                                        }} />
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>



                    {/* ── Bookings Table ── */}
                    <Card variant="outlined" sx={{ borderRadius: 3, border: "1px solid #e5e7eb" }}>
                        <Box sx={{
                            p: 2, display: "flex", alignItems: "center", gap: 1.5,
                            bgcolor: "#f8fafc", borderBottom: "1px solid #e5e7eb"
                        }}>
                            <Box sx={{ p: 1, bgcolor: "#dbeafe", borderRadius: 1.5, display: "flex" }}>
                                <Receipt size={16} color="#1d4ed8" />
                            </Box>
                            <Typography variant="subtitle2" fontWeight={700} color="#1e3a5f">Bookings List</Typography>
                            <Chip size="small" label={`${data.bookings.length} records`}
                                sx={{ ml: "auto", bgcolor: "#dbeafe", color: "#1d4ed8", fontSize: "0.68rem" }} />
                        </Box>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: "#f9fafb" }}>
                                        {["#", "Booking No.", "Date", "Customer", "Tailor", "Cutter", "Status", "Total", "Received", "Pending"].map(h => (
                                            <TableCell key={h} sx={{ fontWeight: 700, color: "#374151", fontSize: "0.78rem", whiteSpace: "nowrap" }}>{h}</TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {data.bookings.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                                                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, color: "#9ca3af" }}>
                                                    <AlertCircle size={32} />
                                                    <Typography variant="body2">No bookings found for the selected period</Typography>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {data.bookings.map((b, i) => {
                                        const sc = STATUS_COLOR[b.status] || { bg: "#f3f4f6", color: "#6b7280", label: b.status };
                                        const rem = parseFloat(b.remainingAmount) || 0;
                                        return (
                                            <TableRow key={b.id} sx={{ "&:hover": { bgcolor: "#f9fafb" }, transition: "background-color 0.15s" }}>
                                                <TableCell sx={{ color: "#9ca3af", fontWeight: 600, fontSize: "0.75rem" }}>{i + 1}</TableCell>
                                                <TableCell sx={{ fontWeight: 700, color: "#8b5cf6", fontSize: "0.78rem", whiteSpace: "nowrap" }}>{b.bookingNumber}</TableCell>
                                                <TableCell sx={{ fontSize: "0.78rem", whiteSpace: "nowrap", color: "#374151" }}>
                                                    {new Date(b.bookingDate).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })}
                                                </TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                        <Avatar sx={{ width: 24, height: 24, fontSize: "0.65rem", bgcolor: "#ede9fe", color: "#7c3aed", fontWeight: 700 }}>
                                                            {b.customer?.name?.[0]?.toUpperCase()}
                                                        </Avatar>
                                                        <Typography variant="caption" fontWeight={600} noWrap sx={{ maxWidth: 110 }}>
                                                            {b.customer?.name}
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell sx={{ fontSize: "0.78rem", color: "#374151" }}>{b.tailor?.name || "—"}</TableCell>
                                                <TableCell sx={{ fontSize: "0.78rem", color: "#374151" }}>{b.cutter?.name || "—"}</TableCell>
                                                <TableCell>
                                                    <Chip size="small" label={sc.label}
                                                        sx={{ bgcolor: sc.bg, color: sc.color, fontWeight: 600, fontSize: "0.65rem", height: 20, border: "none" }} />
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 700, color: "#1f2937", fontSize: "0.78rem" }}>
                                                    Rs. {fmt(b.totalAmount)}
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 600, color: "#059669", fontSize: "0.78rem" }}>
                                                    Rs. {fmt(b.advanceAmount)}
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="caption" fontWeight={700}
                                                        sx={{ color: rem > 0 ? "#dc2626" : "#059669" }}>
                                                        Rs. {fmt(rem)}
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {/* Table footer totals */}
                        {data.bookings.length > 0 && (
                            <Box sx={{ p: 2, bgcolor: "#f8fafc", borderTop: "2px solid #e5e7eb", display: "flex", gap: 4, flexWrap: "wrap" }}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>TOTAL ORDERS</Typography>
                                    <Typography variant="body2" fontWeight={800}>{data.bookings.length}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>TOTAL AMOUNT</Typography>
                                    <Typography variant="body2" fontWeight={800} color="#8b5cf6">Rs. {fmt(s.totalBookingAmount)}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>RECEIVED</Typography>
                                    <Typography variant="body2" fontWeight={800} color="#059669">Rs. {fmt(s.totalReceived)}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>PENDING</Typography>
                                    <Typography variant="body2" fontWeight={800} color="#d97706">Rs. {fmt(s.totalPending)}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>COST</Typography>
                                    <Typography variant="body2" fontWeight={800} color="#6b7280">Rs. {fmt(s.totalCost)}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>PROFIT</Typography>
                                    <Typography variant="body2" fontWeight={800} color={s.totalProfit >= 0 ? "#059669" : "#dc2626"}>
                                        Rs. {fmt(s.totalProfit)}
                                    </Typography>
                                </Box>
                            </Box>
                        )}
                    </Card>
                </>
            )}
        </Box>
    );
}
