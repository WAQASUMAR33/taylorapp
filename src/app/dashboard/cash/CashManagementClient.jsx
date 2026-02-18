"use client";

import { useState } from "react";
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
    Box,
    Typography,
    TextField,
    InputAdornment,
    Card,
    Grid,
    CircularProgress,
    Alert,
    Snackbar,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tooltip,
    Chip
} from "@mui/material";

import {
    Trash2,
    Search,
    Plus,
    Banknote,
    X,
    TrendingUp,
    TrendingDown,
    Printer,
    Link as LinkIcon
} from "lucide-react";
import { Autocomplete } from "@mui/material";

export default function CashManagementClient({ initialEntries, cashAccount, bookings = [] }) {
    const [entries, setEntries] = useState(initialEntries);
    const [searchQuery, setSearchQuery] = useState("");

    // UI States
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const CASH_CATEGORIES = {
        DEBIT: ["Sale", "Advance", "Investment", "Others"],
        CREDIT: ["Purchase", "Salary", "Rent", "Utility", "Drawing", "Expense", "Others"]
    };

    const [formData, setFormData] = useState({
        type: "DEBIT",
        category: "Others",
        amount: "",
        description: "",
        bookingId: ""
    });

    const getEntryDetails = (entry) => {
        let category = "Manual";
        let party = "-";

        // 1. Identify Party
        if (entry.booking?.customer?.name) {
            party = entry.booking.customer.name;
        } else if (entry.purchase?.supplierRel?.name) {
            party = entry.purchase.supplierRel.name;
        } else if (entry.purchase?.supplier) {
            party = entry.purchase.supplier;
        } else if (entry.description?.includes("Advance from")) {
            // Fallback for system strings if relation is missing
            const parts = entry.description.split("Advance from ");
            if (parts.length > 1) party = parts[1].split("(")[0].trim();
        }

        // 2. Identify Category
        if (entry.description?.startsWith("[")) {
            const match = entry.description.match(/^\[(.*?)\]/);
            if (match) category = match[1];
        } else if (entry.bookingId && entry.description?.includes("Advance")) {
            category = "Advance";
        } else if (entry.bookingId) {
            category = "Sale";
        } else if (entry.purchaseId) {
            category = "Purchase";
        }

        return { category, party };
    };

    const [showForm, setShowForm] = useState(false);

    const handleOpen = () => {
        setFormData({
            type: "DEBIT",
            category: "Others",
            amount: "",
            description: "",
            bookingId: ""
        });
        setError("");
        setShowForm(true);
    };

    const handleClose = () => {
        if (!loading) setShowForm(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const submissionData = {
                ...formData,
                description: `[${formData.category}] ${formData.description}`
            };

            const response = await fetch("/api/cash", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(submissionData),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to create cash entry");
            }

            // Re-fetch to get correct ordering and data
            const refreshRes = await fetch("/api/cash");
            const refreshedEntries = await refreshRes.json();
            setEntries(refreshedEntries);

            setSuccessMessage("انٹری کامیابی سے محفوظ ہو گئی!");
            setShowForm(false);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredEntries = entries.filter(entry => {
        const query = (searchQuery || "").toLowerCase();
        return (entry.description || "").toLowerCase().includes(query) ||
            (entry.customer?.name || "").toLowerCase().includes(query) ||
            (entry.customer?.code || "").toLowerCase().includes(query);
    });

    // Calculate totals
    const totals = entries.reduce((acc, entry) => {
        if (entry.type === "DEBIT") {
            acc.debit += parseFloat(entry.amount);
        } else {
            acc.credit += parseFloat(entry.amount);
        }
        return acc;
    }, { debit: 0, credit: 0 });

    const balance = totals.debit - totals.credit;

    if (showForm) {
        return (
            <Box sx={{ width: '100%', bgcolor: '#f9fafb', minHeight: '100vh', p: 3 }}>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <Card sx={{ mb: 2 }}>
                    <Box sx={{ p: 2, bgcolor: '#8b5cf6', color: 'white', display: 'flex', flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700 }} className="font-urdu">
                            کیش انٹری درج کریں
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                variant="contained"
                                startIcon={<Save size={18} />}
                                onClick={handleSubmit}
                                disabled={loading || !formData.amount || !formData.description.trim()}
                                sx={{ bgcolor: '#059669', '&:hover': { bgcolor: '#047857' } }}
                                className="font-urdu"
                            >
                                {loading ? <CircularProgress size={20} color="inherit" /> : "محفوظ کریں"}
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<X size={18} />}
                                onClick={handleClose}
                                sx={{ bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' } }}
                                className="font-urdu"
                            >
                                کینسل
                            </Button>
                        </Box>
                    </Box>

                    <Box sx={{ p: 3 }}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151', fontSize: '0.875rem' }} className="font-urdu">قسم (Type)</Typography>
                                </Box>
                                <TextField
                                    fullWidth
                                    select
                                    required
                                    name="type"
                                    dir="rtl"
                                    value={formData.type}
                                    onChange={handleInputChange}
                                    variant="outlined"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: 'white',
                                            borderRadius: '10px',
                                            '& fieldset': { borderColor: '#e5e7eb' },
                                            '&:hover fieldset': { borderColor: '#8b5cf6' },
                                            '&.Mui-focused fieldset': { borderColor: '#8b5cf6' },
                                        },
                                        '& .MuiOutlinedInput-input': { textAlign: 'right' }
                                    }}
                                >
                                    <MenuItem value="DEBIT">کیش ان (ڈیبٹ)</MenuItem>
                                    <MenuItem value="CREDIT">کیش آؤٹ (کریڈٹ)</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151', fontSize: '0.875rem' }} className="font-urdu">کیٹیگری</Typography>
                                </Box>
                                <TextField
                                    fullWidth
                                    select
                                    required
                                    name="category"
                                    dir="rtl"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                    variant="outlined"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: 'white',
                                            borderRadius: '10px',
                                            '& fieldset': { borderColor: '#e5e7eb' },
                                            '&:hover fieldset': { borderColor: '#8b5cf6' },
                                            '&.Mui-focused fieldset': { borderColor: '#8b5cf6' },
                                        },
                                        '& .MuiOutlinedInput-input': { textAlign: 'right' }
                                    }}
                                >
                                    {CASH_CATEGORIES[formData.type].map(cat => (
                                        <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151', fontSize: '0.875rem' }} className="font-urdu">رقم</Typography>
                                </Box>
                                <TextField
                                    fullWidth
                                    name="amount"
                                    type="number"
                                    required
                                    dir="rtl"
                                    value={formData.amount}
                                    onChange={handleInputChange}
                                    variant="outlined"
                                    placeholder="رقم درج کریں"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: 'white',
                                            borderRadius: '10px',
                                            '& fieldset': { borderColor: '#e5e7eb' },
                                            '&:hover fieldset': { borderColor: '#8b5cf6' },
                                            '&.Mui-focused fieldset': { borderColor: '#8b5cf6' },
                                        },
                                        '& .MuiOutlinedInput-input': { textAlign: 'right' }
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151', fontSize: '0.875rem' }} className="font-urdu">بکنگ لنک کریں (آپشنل)</Typography>
                                </Box>
                                <Autocomplete
                                    options={bookings}
                                    getOptionLabel={(option) => `${option.bookingNumber || ""} - ${option.customer?.name || ""}`}
                                    value={bookings.find(b => b.id === formData.bookingId) || null}
                                    onChange={(e, newValue) => setFormData(prev => ({ ...prev, bookingId: newValue?.id || "" }))}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            placeholder="بکنگ نمبر یا کسٹمر سے تلاش کریں"
                                            dir="rtl"
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    bgcolor: 'white',
                                                    borderRadius: '10px',
                                                    '& fieldset': { borderColor: '#e5e7eb' },
                                                    '&:hover fieldset': { borderColor: '#8b5cf6' },
                                                    '&.Mui-focused fieldset': { borderColor: '#8b5cf6' },
                                                },
                                                '& .MuiOutlinedInput-input': { textAlign: 'right' }
                                            }}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151', fontSize: '0.875rem' }} className="font-urdu">تفصیل</Typography>
                                </Box>
                                <TextField
                                    fullWidth
                                    name="description"
                                    multiline
                                    rows={3}
                                    required
                                    dir="rtl"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="تفصیل درج کریں"
                                    variant="outlined"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: 'white',
                                            borderRadius: '10px',
                                            '& fieldset': { borderColor: '#e5e7eb' },
                                            '&:hover fieldset': { borderColor: '#8b5cf6' },
                                            '&.Mui-focused fieldset': { borderColor: '#8b5cf6' },
                                        },
                                        '& .MuiOutlinedInput-input': { textAlign: 'right' }
                                    }}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                </Card>
            </Box>
        );
    }

    return (
        <Box sx={{ width: '100%', p: 3 }}>
            <Box sx={{ mb: 4, display: 'flex', flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#1f2937', textAlign: 'right' }} className="font-urdu">کیش مینجمنٹ</Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'right' }}>کیش اکاؤنٹ اور لیجر کا ریکارڈ رکھیں</Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<Plus size={18} />}
                    onClick={handleOpen}
                    sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        px: 3,
                        py: 1,
                        bgcolor: '#8b5cf6',
                        '&:hover': { bgcolor: '#7c3aed' }
                    }}
                    className="font-urdu"
                >
                    کیش انٹری درج کریں
                </Button>
            </Box>

            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 4, flexDirection: 'row-reverse' }}>
                <Grid item xs={12} md={4}>
                    <Card sx={{
                        p: 3,
                        background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
                        color: 'white',
                        borderRadius: 4,
                        boxShadow: '0 10px 25px rgba(59, 130, 246, 0.3)'
                    }}>
                        <Box sx={{ display: 'flex', flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500, textAlign: 'right' }} className="font-urdu">کل کیش ان (ڈیبٹ)</Typography>
                                <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 1, textAlign: 'right' }}>
                                    Rs. {totals.debit.toLocaleString()}
                                </Typography>
                            </div>
                            <TrendingUp size={40} style={{ opacity: 0.8 }} />
                        </Box>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card sx={{
                        p: 3,
                        background: 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)',
                        color: 'white',
                        borderRadius: 4,
                        boxShadow: '0 10px 25px rgba(239, 68, 68, 0.3)'
                    }}>
                        <Box sx={{ display: 'flex', flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500, textAlign: 'right' }} className="font-urdu">کل کیش آؤٹ (کریڈٹ)</Typography>
                                <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 1, textAlign: 'right' }}>
                                    Rs. {totals.credit.toLocaleString()}
                                </Typography>
                            </div>
                            <TrendingDown size={40} style={{ opacity: 0.8 }} />
                        </Box>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card sx={{
                        p: 3,
                        background: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
                        color: 'white',
                        borderRadius: 4,
                        boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)'
                    }}>
                        <Box sx={{ display: 'flex', flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500, textAlign: 'right' }} className="font-urdu">باقی کیش</Typography>
                                <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 1, textAlign: 'right' }}>
                                    Rs. {balance.toLocaleString()}
                                </Typography>
                            </div>
                            <Banknote size={40} style={{ opacity: 0.8 }} />
                        </Box>
                    </Card>
                </Grid>
            </Grid>

            {/* Action Bar */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <TextField
                    placeholder="تلاش کریں..."
                    variant="outlined"
                    size="small"
                    dir="rtl"
                    sx={{ width: 400, bgcolor: 'white' }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search size={18} />
                            </InputAdornment>
                        ),
                        style: { textAlign: 'right' }
                    }}
                />
            </Box>

            {/* Cash Table */}
            <TableContainer component={Paper} elevation={0} sx={{
                borderRadius: 3,
                border: '1px solid #e5e7eb',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
                <Table>
                    <TableHead sx={{ bgcolor: '#f9fafb' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 600 }} align="right">بیلنس</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">کریڈٹ (آؤٹ)</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">ڈیبٹ (ان)</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">تفصیل / پارٹی</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">کیٹیگری</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">تاریخ</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">حوالہ #</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredEntries.length > 0 ? (
                            (() => {
                                // For running balance in descending list, we need to calculate differently
                                // But since entries are chronological, let's calculate from bottom up or top down accurately.
                                // Simplest: display debit/credit and total balance in head summary.
                                // For row-specific balance:
                                let running = 0;
                                return filteredEntries.map((entry, idx) => {
                                    const preBalance = running;
                                    const debit = entry.type === 'DEBIT' ? parseFloat(entry.amount) : 0;
                                    const credit = entry.type === 'CREDIT' ? parseFloat(entry.amount) : 0;
                                    running += (debit - credit);
                                    const current = running;

                                    const { category, party } = getEntryDetails(entry);

                                    return (
                                        <TableRow key={entry.id} sx={{ '&:hover': { bgcolor: '#f3f4f6' } }}>
                                            <TableCell align="right">
                                                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                                    Rs. {current.toLocaleString()}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography variant="body2" sx={{ color: credit > 0 ? '#dc2626' : '#9ca3af', fontWeight: credit > 0 ? 600 : 400 }}>
                                                    {credit > 0 ? `Rs. ${credit.toLocaleString()}` : '-'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography variant="body2" sx={{ color: debit > 0 ? '#2563eb' : '#9ca3af', fontWeight: debit > 0 ? 600 : 400 }}>
                                                    {debit > 0 ? `Rs. ${debit.toLocaleString()}` : '-'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{party}</Typography>
                                                <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                                                    {entry.description?.startsWith('[') ? entry.description.split('] ')[1] : entry.description}
                                                </Typography>
                                                {entry.booking && (
                                                    <Box sx={{ mt: 0.5, display: 'flex', justifyContent: 'flex-end' }}>
                                                        <Chip
                                                            size="small"
                                                            icon={<LinkIcon size={12} />}
                                                            label={`بکنگ: ${entry.booking.bookingNumber}`}
                                                            sx={{ height: 18, fontSize: '0.65rem' }}
                                                        />
                                                    </Box>
                                                )}
                                                {entry.purchase && (
                                                    <Box sx={{ mt: 0.5, display: 'flex', justifyContent: 'flex-end' }}>
                                                        <Chip
                                                            size="small"
                                                            icon={<LinkIcon size={12} />}
                                                            label={`انڈیکس: ${entry.purchase.invoiceNumber}`}
                                                            sx={{ height: 18, fontSize: '0.65rem' }}
                                                        />
                                                    </Box>
                                                )}
                                            </TableCell>
                                            <TableCell align="right">
                                                <Chip
                                                    label={category}
                                                    size="small"
                                                    sx={{
                                                        height: 20,
                                                        fontSize: '0.7rem',
                                                        fontWeight: 600,
                                                        bgcolor: category === 'Sale' || category === 'Advance' ? '#dcfce7' : '#fee2e2',
                                                        color: category === 'Sale' || category === 'Advance' ? '#166534' : '#991b1b',
                                                        border: 'none'
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell align="right">{new Date(entry.entryDate).toLocaleDateString()}</TableCell>
                                            <TableCell align="right" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>#{entry.id}</TableCell>
                                        </TableRow>
                                    );
                                });
                            })()
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                                    <Typography color="textSecondary" className="font-urdu">کیش کی کوئی ٹرانزیکشن نہیں ملی۔</Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>


            {/* Success Notification */}
            <Snackbar
                open={!!successMessage}
                autoHideDuration={4000}
                onClose={() => setSuccessMessage("")}
            >
                <Alert severity="success" sx={{ width: '100%' }}>
                    {successMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
}
