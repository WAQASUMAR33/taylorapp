"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
    Box,
    Button,
    IconButton,
    Typography,
    TextField,
    InputAdornment,
    Card,
    Grid,
    CircularProgress,
    Alert,
    Snackbar,
    Avatar,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Autocomplete,
    Tooltip,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
} from "@mui/material";
import {
    Trash2,
    Search,
    Plus,
    Printer,
    Save,
    X,
    TrendingUp,
    TrendingDown,
    BookText,
    User,
    Wallet,
} from "lucide-react";

const ENTRY_TYPES = [
    { label: "Debit (Receivable)", value: "DEBIT" },
    { label: "Credit (Payable)", value: "CREDIT" },
];

export default function LedgerManagementClient({ initialEntries, customers }) {
    const searchParams = useSearchParams();
    const customerIdParam = searchParams.get("customerId");

    const [entries, setEntries] = useState(initialEntries);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterCustomer, setFilterCustomer] = useState(null);
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    // Auto-filter if customerId passed via URL
    useEffect(() => {
        if (customerIdParam && customers.length > 0) {
            const c = customers.find(c => c.id === parseInt(customerIdParam));
            if (c) setFilterCustomer(c);
        }
    }, [customerIdParam, customers]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [showForm, setShowForm] = useState(false);

    const [formData, setFormData] = useState({
        customerId: "",
        type: "DEBIT",
        amount: "",
        description: "",
    });

    // Derived: selected customer object for the form
    const selectedFormCustomer = customers.find(c => c.id === formData.customerId) || null;

    /* ── helpers ──────────────────────────────────────── */

    const handleOpen = () => {
        setFormData({ customerId: "", type: "DEBIT", amount: "", description: "" });
        setError("");
        setShowForm(true);
    };

    const handleClose = () => { if (!loading) setShowForm(false); };

    const handleSubmit = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/ledger", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to create ledger entry");
            }

            const savedEntry = await res.json();
            const newEntry = {
                ...savedEntry,
                amount: savedEntry.amount.toString(),
                customer: customers.find(c => c.id === savedEntry.customerId) || null,
            };

            setEntries(prev => [...prev, newEntry]);
            setSuccessMessage("Entry saved successfully!");
            setShowForm(false);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this ledger entry?")) return;
        try {
            const res = await fetch(`/api/ledger?id=${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete ledger entry");
            setEntries(prev => prev.filter(e => e.id !== id));
            setSuccessMessage("Ledger entry deleted successfully!");
        } catch (err) {
            alert(err.message);
        }
    };

    /* ── filtering & totals ──────────────────────────── */

    const filteredEntries = entries.filter(entry => {
        const q = (searchQuery || "").toLowerCase();
        const matchesSearch =
            (entry.description || "").toLowerCase().includes(q) ||
            (entry.customer?.name || "").toLowerCase().includes(q) ||
            (entry.customer?.code || "").toLowerCase().includes(q) ||
            entry.id.toString().includes(searchQuery);
        const matchesCustomer = !filterCustomer || entry.customerId === filterCustomer.id;

        // Date range filter — compare date strings directly (YYYY-MM-DD)
        const entryDay = entry.entryDate
            ? new Date(entry.entryDate).toISOString().split("T")[0]
            : "";
        const matchesFrom = !dateFrom || entryDay >= dateFrom;
        const matchesTo = !dateTo || entryDay <= dateTo;

        return matchesSearch && matchesCustomer && matchesFrom && matchesTo;
    });

    const hasActiveFilters = searchQuery || filterCustomer || dateFrom || dateTo;

    const clearFilters = () => {
        setSearchQuery("");
        setFilterCustomer(null);
        setDateFrom("");
        setDateTo("");
    };

    const totals = filteredEntries.reduce(
        (acc, e) => {
            if (e.type === "DEBIT") acc.debit += parseFloat(e.amount);
            else acc.credit += parseFloat(e.amount);
            return acc;
        },
        { debit: 0, credit: 0 }
    );

    const balance = totals.debit - totals.credit;

    const handlePrintLedger = () => {
        const sortedEntries = filteredEntries
            .slice()
            .sort((a, b) => new Date(a.entryDate) - new Date(b.entryDate) || a.id - b.id);

        let running = 0;
        const rows = sortedEntries.map((entry) => {
            const debitAmt = entry.type === "DEBIT" ? parseFloat(entry.amount) : 0;
            const creditAmt = entry.type === "CREDIT" ? parseFloat(entry.amount) : 0;
            const preBalance = running;
            running += debitAmt - creditAmt;
            return { entry, debitAmt, creditAmt, preBalance, currentBal: running };
        });

        const fmt = (n) => `Rs. ${n.toLocaleString()}`;
        const dateLabel = (d) => new Date(d).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });

        const filterInfo = [
            filterCustomer ? `Account: ${filterCustomer.name}` : null,
            dateFrom ? `From: ${dateLabel(dateFrom)}` : null,
            dateTo ? `To: ${dateLabel(dateTo)}` : null,
        ].filter(Boolean).join("   |   ");

        const tableRows = rows.map(({ entry, debitAmt, creditAmt, preBalance, currentBal }) => `
            <tr>
                <td>#${entry.id}</td>
                <td>${entry.customer?.name || "—"}${entry.customer?.code ? `<br><small>${entry.customer.code}</small>` : ""}</td>
                <td>${dateLabel(entry.entryDate)}${entry.description ? `<br><small>${entry.description}</small>` : ""}</td>
                <td class="num">${fmt(preBalance)}</td>
                <td class="num debit">${debitAmt > 0 ? fmt(debitAmt) : "—"}</td>
                <td class="num credit">${creditAmt > 0 ? fmt(creditAmt) : "—"}</td>
                <td class="num ${currentBal >= 0 ? "pos" : "neg"}">${fmt(currentBal)}</td>
            </tr>`).join("");

        const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Ledger Report</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #111; padding: 24px; }
  .header { text-align: center; margin-bottom: 18px; }
  .header h1 { font-size: 20px; font-weight: 700; }
  .header p { color: #555; margin-top: 4px; font-size: 11px; }
  .summary { display: flex; gap: 16px; margin-bottom: 18px; }
  .summary-card { flex: 1; border: 1px solid #ddd; border-radius: 6px; padding: 10px 14px; }
  .summary-card .label { font-size: 10px; color: #555; text-transform: uppercase; letter-spacing: .5px; }
  .summary-card .value { font-size: 16px; font-weight: 700; margin-top: 3px; }
  .debit-card .value { color: #2563eb; }
  .credit-card .value { color: #dc2626; }
  .balance-card .value { color: #16a34a; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #f3f4f6; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: .4px; padding: 8px 10px; border: 1px solid #e5e7eb; }
  td { padding: 7px 10px; border: 1px solid #e5e7eb; vertical-align: top; }
  td small { color: #666; font-size: 10px; }
  tr:nth-child(even) { background: #f9fafb; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .debit { color: #2563eb; font-weight: 600; }
  .credit { color: #dc2626; font-weight: 600; }
  .pos { color: #16a34a; font-weight: 700; }
  .neg { color: #dc2626; font-weight: 700; }
  .footer { margin-top: 20px; font-size: 10px; color: #888; text-align: right; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
  <div class="header">
    <h1>Taylor — Ledger Report</h1>
    <p>Printed on ${new Date().toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })}${filterInfo ? `&nbsp;&nbsp;|&nbsp;&nbsp;${filterInfo}` : ""}</p>
    <p>${sortedEntries.length} entr${sortedEntries.length === 1 ? "y" : "ies"}</p>
  </div>

  <div class="summary">
    <div class="summary-card debit-card">
      <div class="label">Total Debit</div>
      <div class="value">${fmt(totals.debit)}</div>
    </div>
    <div class="summary-card credit-card">
      <div class="label">Total Credit</div>
      <div class="value">${fmt(totals.credit)}</div>
    </div>
    <div class="summary-card balance-card">
      <div class="label">${filterCustomer ? `${filterCustomer.name} — Balance` : "Current Balance"}</div>
      <div class="value" style="color:${balance >= 0 ? "#16a34a" : "#dc2626"}">${fmt(balance)}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Ref #</th>
        <th>Account</th>
        <th>Date / Description</th>
        <th class="num">Prev Balance</th>
        <th class="num">Debit</th>
        <th class="num">Credit</th>
        <th class="num">Balance</th>
      </tr>
    </thead>
    <tbody>${tableRows}</tbody>
  </table>

  <div class="footer">Generated by Taylor Management System</div>
  <script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`;

        const win = window.open("", "_blank");
        win.document.write(html);
        win.document.close();
    };

    /* ── render ──────────────────────────────────────── */

    return (
        <Box sx={{ width: "100%", p: 3 }}>

            {/* ── Summary Cards ──────────────────────────── */}
            <Grid container spacing={2.5} sx={{ mb: 3 }}>
                {[
                    {
                        label: "Total Debit",
                        value: totals.debit,
                        gradient: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)",
                        shadow: "rgba(59,130,246,0.3)",
                        icon: <TrendingUp size={36} style={{ opacity: 0.8 }} />,
                    },
                    {
                        label: "Total Credit",
                        value: totals.credit,
                        gradient: "linear-gradient(135deg, #f87171 0%, #ef4444 100%)",
                        shadow: "rgba(239,68,68,0.3)",
                        icon: <TrendingDown size={36} style={{ opacity: 0.8 }} />,
                    },
                    {
                        label: filterCustomer ? `${filterCustomer.name} — Balance` : "Current Balance",
                        value: balance,
                        gradient: "linear-gradient(135deg, #34d399 0%, #10b981 100%)",
                        shadow: "rgba(16,185,129,0.3)",
                        icon: <BookText size={36} style={{ opacity: 0.8 }} />,
                    },
                ].map(({ label, value, gradient, shadow, icon }) => (
                    <Grid key={label} size={{ xs: 12, md: 4 }}>
                        <Card sx={{
                            p: 3,
                            background: gradient,
                            color: "white",
                            borderRadius: 3,
                            boxShadow: `0 10px 40px ${shadow}`,
                        }}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <Box>
                                    <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>
                                        {label}
                                    </Typography>
                                    <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>
                                        Rs. {value.toLocaleString()}
                                    </Typography>
                                </Box>
                                {icon}
                            </Box>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* ── Action Bar ─────────────────────────────── */}
            <Box sx={{ mb: 3 }}>
                {/* Single row: From Date | To Date | Search | Account Filter | Balance chip | Clear | New Entry */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                    <Box sx={{ display: "flex", gap: 2, flex: 1, flexWrap: "wrap", alignItems: "center" }}>
                        {/* ── Date range first ── */}
                        <TextField
                            size="small"
                            type="date"
                            label="From Date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            sx={{ minWidth: 175 }}
                        />
                        <TextField
                            size="small"
                            type="date"
                            label="To Date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            sx={{ minWidth: 175 }}
                            inputProps={{ min: dateFrom || undefined }}
                        />
                        {/* ── Then search + account ── */}
                        <TextField
                            placeholder="Search entries…"
                            variant="outlined"
                            size="small"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            sx={{ minWidth: 220 }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start"><Search size={18} /></InputAdornment>
                                ),
                            }}
                        />
                        <Autocomplete
                            size="small"
                            options={customers}
                            getOptionLabel={(o) => o.name || ""}
                            value={filterCustomer}
                            onChange={(_, v) => setFilterCustomer(v)}
                            componentsProps={{ paper: { sx: { minWidth: 300 } } }}
                            sx={{ minWidth: 240 }}
                            renderInput={(params) => (
                                <TextField {...params} label="Filter by Account" variant="outlined" />
                            )}
                        />
                        {filterCustomer && (
                            <Chip
                                icon={<Wallet size={15} />}
                                label={`Balance: Rs. ${(filterCustomer.balance || 0).toLocaleString()}`}
                                color={filterCustomer.balance >= 0 ? "success" : "error"}
                                variant="filled"
                                sx={{ alignSelf: "center", fontWeight: 600, borderRadius: 2 }}
                            />
                        )}
                        {hasActiveFilters && (
                            <Button
                                size="small"
                                variant="outlined"
                                color="inherit"
                                startIcon={<X size={15} />}
                                onClick={clearFilters}
                                sx={{ borderRadius: 2, textTransform: "none" }}
                            >
                                Clear
                            </Button>
                        )}
                    </Box>
                    <Button
                        variant="outlined"
                        startIcon={<Printer size={18} />}
                        onClick={handlePrintLedger}
                        disabled={filteredEntries.length === 0}
                        sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, px: 3, flexShrink: 0 }}
                    >
                        Print Ledger
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Plus size={18} />}
                        onClick={handleOpen}
                        sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, px: 3, flexShrink: 0 }}
                    >
                        New Entry
                    </Button>
                </Box>
                {(dateFrom || dateTo) && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                        Showing {filteredEntries.length} entr{filteredEntries.length === 1 ? "y" : "ies"}
                        {dateFrom && ` from ${new Date(dateFrom).toLocaleDateString()}`}
                        {dateTo && ` to ${new Date(dateTo).toLocaleDateString()}`}
                    </Typography>
                )}
            </Box>

            {/* ── Ledger Table ──────────────────────────── */}
            <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, overflow: "auto" }}>
                <TableContainer>
                    <Table sx={{ minWidth: 1000 }}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: "action.hover" }}>
                                <TableCell sx={{ fontWeight: 700 }}>Ref #</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Account</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Date / Description</TableCell>
                                <TableCell sx={{ fontWeight: 700 }} align="right">Prev Balance</TableCell>
                                <TableCell sx={{ fontWeight: 700 }} align="right">Debit</TableCell>
                                <TableCell sx={{ fontWeight: 700 }} align="right">Credit</TableCell>
                                <TableCell sx={{ fontWeight: 700 }} align="right">Balance</TableCell>
                                <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredEntries.length > 0 ? (
                                (() => {
                                    let running = 0;
                                    return filteredEntries
                                        .slice()
                                        .sort((a, b) => new Date(a.entryDate) - new Date(b.entryDate) || a.id - b.id)
                                        .map((entry) => {
                                            const preBalance = running;
                                            const debitAmt = entry.type === "DEBIT" ? parseFloat(entry.amount) : 0;
                                            const creditAmt = entry.type === "CREDIT" ? parseFloat(entry.amount) : 0;
                                            running += (debitAmt - creditAmt);
                                            const currentBal = running;

                                            return (
                                                <TableRow
                                                    key={entry.id}
                                                    sx={{ "&:hover": { bgcolor: "action.hover" }, transition: "background-color 0.2s" }}
                                                >
                                                    <TableCell>
                                                        <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: 600 }}>
                                                            #{entry.id}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                                            <Avatar
                                                                variant="rounded"
                                                                sx={(t) => ({
                                                                    width: 32, height: 32, fontSize: "0.8rem", fontWeight: 700,
                                                                    bgcolor: t.palette.primary.light, color: t.palette.primary.main, borderRadius: 1,
                                                                })}
                                                            >
                                                                {(entry.customer?.name || "?")[0].toUpperCase()}
                                                            </Avatar>
                                                            <Box>
                                                                <Typography variant="subtitle2" fontWeight={600}>
                                                                    {entry.customer?.name}
                                                                </Typography>
                                                                {entry.customer?.code && (
                                                                    <Typography variant="caption" color="text.secondary">
                                                                        {entry.customer.code}
                                                                    </Typography>
                                                                )}
                                                            </Box>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2">
                                                            {new Date(entry.entryDate).toLocaleDateString()}
                                                        </Typography>
                                                        {entry.description && (
                                                            <Typography variant="caption" color="text.secondary" display="block">
                                                                {entry.description}
                                                            </Typography>
                                                        )}
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                            Rs. {preBalance.toLocaleString()}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography
                                                            variant="body2"
                                                            sx={{ fontWeight: 600, color: debitAmt > 0 ? "primary.main" : "text.disabled" }}
                                                        >
                                                            {debitAmt > 0 ? `Rs. ${debitAmt.toLocaleString()}` : "—"}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography
                                                            variant="body2"
                                                            sx={{ fontWeight: 600, color: creditAmt > 0 ? "error.dark" : "text.disabled" }}
                                                        >
                                                            {creditAmt > 0 ? `Rs. ${creditAmt.toLocaleString()}` : "—"}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Chip
                                                            label={`Rs. ${currentBal.toLocaleString()}`}
                                                            size="small"
                                                            color={currentBal >= 0 ? "success" : "error"}
                                                            variant={currentBal >= 0 ? "outlined" : "filled"}
                                                            sx={{ borderRadius: 1, fontWeight: 700, fontSize: "0.8rem" }}
                                                        />
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }}>
                                                            <Tooltip title="Print Entry">
                                                                <IconButton size="small" color="primary" onClick={() => window.print()}>
                                                                    <Printer size={17} />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Delete Entry">
                                                                <IconButton size="small" color="error" onClick={() => handleDelete(entry.id)}>
                                                                    <Trash2 size={17} />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        });
                                })()
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                                        <BookText size={40} color="#d1d5db" />
                                        <Typography color="text.secondary" sx={{ mt: 1.5 }}>
                                            No ledger entries found.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>

            {/* ── New Entry Dialog ───────────────────────── */}
            <Dialog
                open={showForm}
                onClose={handleClose}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid", borderColor: "divider", pb: 2 }}>
                    New Ledger Entry
                </DialogTitle>

                <DialogContent sx={{ pt: "24px !important", pb: 3 }}>
                    {error && (
                        <Alert severity="error" variant="filled" onClose={() => setError("")} sx={{ mb: 2.5, borderRadius: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Grid container spacing={2}>
                        {/* Row 1: Account | Type | Amount */}
                        <Grid size={{ xs: 4 }}>
                            <Autocomplete
                                size="small"
                                options={customers}
                                getOptionLabel={(o) => `${o.name || ""}${o.code ? ` (${o.code})` : ""}`}
                                value={selectedFormCustomer}
                                onChange={(_, v) => setFormData(p => ({ ...p, customerId: v?.id || "" }))}
                                componentsProps={{ paper: { sx: { minWidth: 300 } } }}
                                sx={{ minWidth: 300 }}
                                renderInput={(params) => (
                                    <TextField {...params} label="Account" required variant="outlined" />
                                )}
                            />
                        </Grid>

                        <Grid size={{ xs: 4 }}>
                            <Autocomplete
                                size="small"
                                options={ENTRY_TYPES}
                                getOptionLabel={(o) => o.label}
                                value={ENTRY_TYPES.find(o => o.value === formData.type) || null}
                                onChange={(_, v) => setFormData(p => ({ ...p, type: v?.value || "DEBIT" }))}
                                componentsProps={{ paper: { sx: { minWidth: 260 } } }}
                                sx={{ minWidth: 260 }}
                                renderInput={(params) => (
                                    <TextField {...params} label="Entry Type" required variant="outlined" />
                                )}
                            />
                        </Grid>

                        <Grid size={{ xs: 4 }}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Amount (Rs.)"
                                name="amount"
                                type="number"
                                required
                                value={formData.amount}
                                onChange={(e) => setFormData(p => ({ ...p, amount: e.target.value }))}
                                variant="outlined"
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">Rs.</InputAdornment>,
                                }}
                            />
                        </Grid>

                        {/* Balance info banner — shown when an account is selected */}
                        {selectedFormCustomer && (
                            <Grid size={{ xs: 12 }}>
                                <Box sx={(t) => ({
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 2,
                                    px: 2,
                                    py: 1.5,
                                    borderRadius: 2,
                                    bgcolor: selectedFormCustomer.balance >= 0 ? "success.light" : "error.light",
                                    border: "1px solid",
                                    borderColor: selectedFormCustomer.balance >= 0 ? "success.main" : "error.main",
                                })}>
                                    <Wallet size={18} />
                                    <Box>
                                        <Typography variant="caption" fontWeight={600} color="text.secondary">
                                            Current Account Balance
                                        </Typography>
                                        <Typography variant="body1" fontWeight={700}>
                                            {selectedFormCustomer.name} — Rs.{" "}
                                            {(selectedFormCustomer.balance || 0).toLocaleString()}
                                        </Typography>
                                    </Box>
                                    <Chip
                                        label={selectedFormCustomer.balance >= 0 ? "Credit" : "Debit"}
                                        size="small"
                                        color={selectedFormCustomer.balance >= 0 ? "success" : "error"}
                                        variant="filled"
                                        sx={{ ml: "auto", borderRadius: 1, fontWeight: 700 }}
                                    />
                                </Box>
                            </Grid>
                        )}

                        {/* Description — full width, minWidth 600 */}
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Description"
                                name="description"
                                multiline
                                rows={3}
                                required
                                value={formData.description}
                                onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                                placeholder="Enter description or remarks…"
                                variant="outlined"
                                sx={{ minWidth: 600 }}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>

                <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid", borderColor: "divider", gap: 1 }}>
                    <Button
                        onClick={handleClose}
                        variant="outlined"
                        color="inherit"
                        disabled={loading}
                        startIcon={<X size={17} />}
                        sx={{ borderRadius: 2, textTransform: "none" }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={loading || !formData.customerId || !formData.amount}
                        startIcon={loading ? null : <Save size={17} />}
                        sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, px: 3 }}
                    >
                        {loading ? <CircularProgress size={20} color="inherit" /> : "Save Entry"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Success Snackbar ────────────────────────── */}
            <Snackbar
                open={!!successMessage}
                autoHideDuration={4000}
                onClose={() => setSuccessMessage("")}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            >
                <Alert
                    onClose={() => setSuccessMessage("")}
                    severity="success"
                    variant="filled"
                    sx={{ width: "100%", borderRadius: 2 }}
                >
                    {successMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
}
