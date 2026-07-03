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

const getBriefDescription = (desc) => {
    if (!desc) return "—";
    const bookingMatch = desc.match(/Booking\s+#?([a-zA-Z0-9-]+)/i);
    const bookingRef = bookingMatch ? ` #${bookingMatch[1]}` : "";
    
    if (desc.toLowerCase().includes("payment") || desc.toLowerCase().includes("pay")) {
        return `Payment Received${bookingRef}`;
    }
    if (desc.toLowerCase().includes("booking") || desc.toLowerCase().includes("stitching")) {
        return `Suit Purchase${bookingRef}`;
    }
    return desc;
};

export default function LedgerManagementClient({ 
    initialEntries, 
    initialCustomers, 
    initialTotalCount, 
    initialTotals 
}) {
    const searchParams = useSearchParams();
    const customerIdParam = searchParams.get("customerId");

    const [entries, setEntries] = useState(initialEntries);
    const [totalCount, setTotalCount] = useState(initialTotalCount || 0);
    const [totals, setTotals] = useState(initialTotals || { debit: 0, credit: 0 });
    const [initialBalance, setInitialBalance] = useState(0);

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(50);

    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [filterCustomer, setFilterCustomer] = useState(null);
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const [customerOptions, setCustomerOptions] = useState(initialCustomers);
    const [customerSearchInput, setCustomerSearchInput] = useState("");
    const [searchingCustomers, setSearchingCustomers] = useState(false);
    const [debouncedCustomerSearch, setDebouncedCustomerSearch] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [refetchTrigger, setRefetchTrigger] = useState(0);

    // View Modal State (For Bookings Details click)
    const [viewOpen, setViewOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);

    // Payment Modal State (For pay action button)
    const [payDialogOpen, setPayDialogOpen] = useState(false);
    const [payBooking, setPayBooking] = useState(null);
    const [payReceived, setPayReceived] = useState("");
    const [paying, setPaying] = useState(false);

    const handleOpenPayDialog = (booking) => {
        setPayBooking(booking);
        setPayReceived(parseFloat(booking.remainingAmount || 0).toString());
        setPayDialogOpen(true);
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

            setSuccessMessage("Payment processed successfully!");
            setPayDialogOpen(false);
            setRefetchTrigger(prev => prev + 1); // Refresh ledger
        } catch (err) {
            setError(err.message);
        } finally {
            setPaying(false);
        }
    };

    const [formData, setFormData] = useState({
        customerId: "",
        type: "DEBIT",
        amount: "",
        description: "",
    });

    // Derived: selected customer object for the form
    const selectedFormCustomer = customerOptions.find(c => c.id === formData.customerId) || null;

    // Handle debouncing for ledger search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Handle debouncing for customer search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedCustomerSearch(customerSearchInput);
        }, 300);
        return () => clearTimeout(timer);
    }, [customerSearchInput]);

    // Fetch matching customers for dropdown options
    useEffect(() => {
        const searchCustomers = async () => {
            if (!debouncedCustomerSearch.trim()) return;
            setSearchingCustomers(true);
            try {
                const res = await fetch(`/api/customers?search=${encodeURIComponent(debouncedCustomerSearch)}&limit=50`);
                if (res.ok) {
                    const data = await res.json();
                    const fetched = data.customers || [];
                    setCustomerOptions(prev => {
                        const map = new Map(prev.map(c => [c.id, c]));
                        fetched.forEach(c => {
                            if (c && c.id) {
                                map.set(c.id, {
                                    ...c,
                                    balance: c.balance ? parseFloat(c.balance.toString()) : 0
                                });
                            }
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
        searchCustomers();
    }, [debouncedCustomerSearch]);

    // Auto-filter if customerId passed via URL
    useEffect(() => {
        if (customerIdParam) {
            const existing = customerOptions.find(c => c.id === parseInt(customerIdParam));
            if (existing) {
                setFilterCustomer(existing);
            } else {
                const fetchCustomer = async () => {
                    try {
                        const res = await fetch(`/api/customers/${customerIdParam}`);
                        if (res.ok) {
                            const c = await res.json();
                            if (c) {
                                const formatted = {
                                    ...c,
                                    balance: c.balance ? parseFloat(c.balance.toString()) : 0
                                };
                                setCustomerOptions(prev => [...prev, formatted]);
                                setFilterCustomer(formatted);
                            }
                        }
                    } catch (err) {
                        console.error("Failed to fetch customer for URL param:", err);
                    }
                };
                fetchCustomer();
            }
        }
    }, [customerIdParam]);

    // Fetch ledger entries based on current filters, page, and limit
    useEffect(() => {
        const fetchEntries = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                params.append("page", page.toString());
                params.append("limit", limit.toString());
                if (debouncedSearch) params.append("search", debouncedSearch);
                if (filterCustomer) params.append("customerId", filterCustomer.id.toString());
                if (dateFrom) params.append("dateFrom", dateFrom);
                if (dateTo) params.append("dateTo", dateTo);

                const res = await fetch(`/api/ledger?${params.toString()}`);
                if (!res.ok) throw new Error("Failed to fetch ledger entries");
                
                const data = await res.json();
                setEntries(data.entries);
                setTotalCount(data.totalCount);
                setTotals(data.totals);
                setInitialBalance(data.initialBalance);
            } catch (err) {
                console.error(err);
                setError("Failed to load ledger data");
            } finally {
                setLoading(false);
            }
        };

        fetchEntries();
    }, [page, limit, debouncedSearch, filterCustomer?.id, dateFrom, dateTo, refetchTrigger]);

    // Reset page to 1 on filter changes
    useEffect(() => {
        setPage(1);
    }, [filterCustomer, dateFrom, dateTo]);

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

            setRefetchTrigger(prev => prev + 1);
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
            setRefetchTrigger(prev => prev + 1);
            setSuccessMessage("Ledger entry deleted successfully!");
        } catch (err) {
            alert(err.message);
        }
    };

    const hasActiveFilters = searchQuery || filterCustomer || dateFrom || dateTo;

    const clearFilters = () => {
        setSearchQuery("");
        setDebouncedSearch("");
        setFilterCustomer(null);
        setDateFrom("");
        setDateTo("");
        setPage(1);
    };

    const balance = totals.debit - totals.credit;



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
                            options={customerOptions}
                            getOptionLabel={(o) => o.name || ""}
                            value={filterCustomer}
                            onChange={(_, v) => setFilterCustomer(v)}
                            onInputChange={(event, newInputValue, reason) => {
                                if (reason === "input") {
                                    setCustomerSearchInput(newInputValue);
                                }
                            }}
                            loading={searchingCustomers}
                            filterOptions={(options) => options}
                            componentsProps={{ paper: { sx: { minWidth: 300 } } }}
                            sx={{ minWidth: 240 }}
                            renderInput={(params) => (
                                <TextField 
                                    {...params} 
                                    label="Filter by Account" 
                                    variant="outlined" 
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
                        variant="contained"
                        startIcon={<Plus size={18} />}
                        onClick={handleOpen}
                        sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, px: 3, flexShrink: 0 }}
                    >
                        New Entry
                    </Button>
                </Box>
                {(dateFrom || dateTo || searchQuery || filterCustomer) && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                        Found {totalCount} matching ledger entr{totalCount === 1 ? "y" : "ies"}
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
                                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                                <TableCell sx={{ fontWeight: 700 }} align="right">Prev Balance</TableCell>
                                <TableCell sx={{ fontWeight: 700 }} align="right">Debit</TableCell>
                                <TableCell sx={{ fontWeight: 700 }} align="right">Credit</TableCell>
                                <TableCell sx={{ fontWeight: 700 }} align="right">Balance</TableCell>
                                <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody sx={{ opacity: loading ? 0.6 : 1, transition: "opacity 0.2s" }}>
                            {entries.length > 0 ? (
                                (() => {
                                    let running = initialBalance;
                                    return entries
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
                                                            {new Date(entry.entryDate).toLocaleDateString('en-GB')}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        {entry.booking ? (
                                                            <Typography 
                                                                variant="body2" 
                                                                onClick={() => {
                                                                    setSelectedBooking(entry.booking);
                                                                    setViewOpen(true);
                                                                }}
                                                                sx={{ 
                                                                    cursor: 'pointer', 
                                                                    color: 'primary.main', 
                                                                    fontWeight: 600,
                                                                    textDecoration: 'underline',
                                                                    '&:hover': {
                                                                        color: 'primary.dark'
                                                                    }
                                                                }}
                                                            >
                                                                {getBriefDescription(entry.description)}
                                                            </Typography>
                                                        ) : (
                                                            <Typography variant="body2" color="text.secondary">
                                                                {entry.description || "—"}
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
                                                            {entry.booking && parseFloat(entry.booking.remainingAmount) > 0 && (
                                                                <Tooltip title="Pay / Clear Bill">
                                                                    <IconButton 
                                                                        size="small" 
                                                                        sx={{ color: '#10b981' }} 
                                                                        onClick={() => handleOpenPayDialog(entry.booking)}
                                                                    >
                                                                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
                                                                    </IconButton>
                                                                </Tooltip>
                                                            )}
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
                                        {loading ? (
                                            <CircularProgress size={30} />
                                        ) : (
                                            <>
                                                <BookText size={40} color="#d1d5db" />
                                                <Typography color="text.secondary" sx={{ mt: 1.5 }}>
                                                    No ledger entries found.
                                                </Typography>
                                            </>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Pagination Controls */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 2, borderTop: "1px solid", borderColor: "divider", flexWrap: "wrap", gap: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                        Showing {entries.length > 0 ? (page - 1) * limit + 1 : 0} to{" "}
                        {Math.min(page * limit, totalCount)} of {totalCount} entries
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                        <Button
                            size="small"
                            variant="outlined"
                            disabled={page === 1 || loading}
                            onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                            sx={{ borderRadius: 1.5, textTransform: "none" }}
                        >
                            Previous
                        </Button>
                        <Typography variant="body2" sx={{ mx: 1, fontWeight: 600 }}>
                            Page {page} of {Math.ceil(totalCount / limit) || 1}
                        </Typography>
                        <Button
                            size="small"
                            variant="outlined"
                            disabled={page >= Math.ceil(totalCount / limit) || loading}
                            onClick={() => setPage(prev => prev + 1)}
                            sx={{ borderRadius: 1.5, textTransform: "none" }}
                        >
                            Next
                        </Button>
                        <TextField
                            select
                            size="small"
                            value={limit}
                            onChange={(e) => {
                                setLimit(parseInt(e.target.value));
                                setPage(1);
                            }}
                            sx={{ ml: 2, width: 80, '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                            SelectProps={{ native: true }}
                        >
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                            <option value={200}>200</option>
                        </TextField>
                    </Box>
                </Box>
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
                                options={customerOptions}
                                getOptionLabel={(o) => `${o.name || ""}${o.code ? ` (${o.code})` : ""}`}
                                value={selectedFormCustomer}
                                onChange={(_, v) => setFormData(p => ({ ...p, customerId: v?.id || "" }))}
                                onInputChange={(event, newInputValue, reason) => {
                                    if (reason === "input") {
                                        setCustomerSearchInput(newInputValue);
                                    }
                                }}
                                loading={searchingCustomers}
                                filterOptions={(options) => options}
                                componentsProps={{ paper: { sx: { minWidth: 300 } } }}
                                sx={{ minWidth: 300 }}
                                renderInput={(params) => (
                                    <TextField 
                                        {...params} 
                                        label="Account" 
                                        required 
                                        variant="outlined"
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

            {/* ── Payment and View Booking Dialogs ── */}
            {payBooking && (
                <Dialog 
                    open={payDialogOpen} 
                    onClose={() => !paying && setPayDialogOpen(false)}
                    maxWidth="xs"
                    fullWidth
                    PaperProps={{ sx: { borderRadius: 3 } }}
                >
                    <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid', borderColor: 'divider', pb: 1.5 }}>
                        Receive Bill Payment
                    </DialogTitle>
                    <DialogContent sx={{ pt: 2.5 }}>
                        {error && (
                            <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2, borderRadius: 2 }}>
                                {error}
                            </Alert>
                        )}
                        
                        <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 2, mb: 2.5 }}>
                            <Grid container spacing={1.5}>
                                <Grid size={{ xs: 6 }}>
                                    <Typography variant="caption" color="text.secondary" display="block">BOOKING NO</Typography>
                                    <Typography variant="body2" fontWeight={700}>#{payBooking.bookingNumber || payBooking.id}</Typography>
                                </Grid>
                                <Grid size={{ xs: 6 }}>
                                    <Typography variant="caption" color="text.secondary" display="block">CUSTOMER</Typography>
                                    <Typography variant="body2" fontWeight={700}>{payBooking.customer?.name}</Typography>
                                </Grid>
                                
                                <Grid size={{ xs: 4 }}>
                                    <Typography variant="caption" color="text.secondary" display="block">TOTAL AMOUNT</Typography>
                                    <Typography variant="body2" fontWeight={600}>Rs. {parseFloat(payBooking.totalAmount || 0).toLocaleString()}</Typography>
                                </Grid>
                                <Grid size={{ xs: 4 }}>
                                    <Typography variant="caption" color="text.secondary" display="block">DISCOUNT</Typography>
                                    <Typography variant="body2" fontWeight={600} color="error.main">
                                        Rs. {(payBooking.items || []).reduce((s, i) => s + parseFloat(i.discount || 0), 0).toLocaleString()}
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 4 }}>
                                    <Typography variant="caption" color="text.secondary" display="block">ADVANCE PAID</Typography>
                                    <Typography variant="body2" fontWeight={600} color="success.main">Rs. {parseFloat(payBooking.advanceAmount || 0).toLocaleString()}</Typography>
                                </Grid>
                                
                                <Grid size={{ xs: 12 }}>
                                    <Divider sx={{ my: 0.5 }} />
                                </Grid>
                                
                                <Grid size={{ xs: 12 }} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="subtitle2" fontWeight={700} color="text.primary">Current Balance Due:</Typography>
                                    <Typography variant="subtitle1" fontWeight={800} color="#b91c1c">
                                        Rs. {parseFloat(payBooking.remainingAmount || 0).toLocaleString()}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Box>

                        <TextField
                            fullWidth
                            label="Payment Amount Received"
                            type="number"
                            size="small"
                            value={payReceived}
                            onChange={(e) => setPayReceived(e.target.value)}
                            InputProps={{
                                startAdornment: <InputAdornment position="start">Rs.</InputAdornment>
                            }}
                            sx={{ mb: 1 }}
                        />
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 3, flexDirection: 'column', gap: 1 }}>
                        <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
                            <Button 
                                fullWidth 
                                variant="contained" 
                                color="success" 
                                disabled={paying}
                                onClick={() => handlePaySubmit("FULL_PAY")}
                                sx={{ textTransform: 'none', borderRadius: 2 }}
                            >
                                Full Pay
                            </Button>
                            <Button 
                                fullWidth 
                                variant="outlined" 
                                color="success" 
                                disabled={paying}
                                onClick={() => handlePaySubmit("LESS_PAY")}
                                sx={{ textTransform: 'none', borderRadius: 2 }}
                            >
                                Less Pay & Clear
                            </Button>
                        </Box>
                        <Button 
                            fullWidth 
                            variant="contained" 
                            color="primary" 
                            disabled={paying}
                            onClick={() => handlePaySubmit("PARTIAL_PAY")}
                            sx={{ textTransform: 'none', borderRadius: 2 }}
                        >
                            Partial Pay
                        </Button>
                        <Button 
                            fullWidth 
                            variant="text" 
                            disabled={paying}
                            onClick={() => setPayDialogOpen(false)}
                            sx={{ textTransform: 'none', borderRadius: 2, color: 'text.secondary' }}
                        >
                            Cancel
                        </Button>
                    </DialogActions>
                </Dialog>
            )}

            {selectedBooking && (
                <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="md" fullWidth dir="rtl">
                    <DialogTitle sx={{ bgcolor: '#8b5cf6', color: 'white', py: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6" fontWeight="bold" className="font-urdu">بکنگ کی تفصیلات</Typography>
                            <IconButton onClick={() => setViewOpen(false)} sx={{ color: 'white' }}>
                                <X size={20} />
                            </IconButton>
                        </Box>
                    </DialogTitle>
                    <DialogContent sx={{ p: 3 }}>
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
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={() => setViewOpen(false)} variant="outlined" sx={{ color: '#8b5cf6', borderColor: '#8b5cf6', textTransform: 'none' }}>Close</Button>
                    </DialogActions>
                </Dialog>
            )}

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
