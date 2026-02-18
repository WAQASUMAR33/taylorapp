"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
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
    Chip,
    Autocomplete,
    Tooltip
} from "@mui/material";
import {
    Edit,
    Trash2,
    Search,
    Plus,
    BookText,
    X,
    TrendingUp,
    TrendingDown,
    Printer
} from "lucide-react";

export default function LedgerManagementClient({ initialEntries, customers }) {
    const searchParams = useSearchParams();
    const customerIdParam = searchParams.get("customerId");

    const [entries, setEntries] = useState(initialEntries);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterCustomer, setFilterCustomer] = useState(null);

    // Auto-filter if customerId in URL
    useEffect(() => {
        if (customerIdParam && customers.length > 0) {
            const customer = customers.find(c => c.id === parseInt(customerIdParam));
            if (customer) {
                setFilterCustomer(customer);
            }
        }
    }, [customerIdParam, customers]);

    // UI States
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const [formData, setFormData] = useState({
        customerId: "",
        type: "DEBIT",
        amount: "",
        description: ""
    });

    const [showForm, setShowForm] = useState(false);

    const handleOpen = () => {
        setFormData({
            customerId: "",
            type: "DEBIT",
            amount: "",
            description: ""
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
            const response = await fetch("/api/ledger", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to create ledger entry");
            }

            const savedEntry = await response.json();
            setEntries(prev => [...prev, savedEntry]);
            setSuccessMessage("انٹری کامیابی سے محفوظ ہو گئی!");
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
            const response = await fetch(`/api/ledger?id=${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to delete ledger entry");
            }

            setEntries(prev => prev.filter(e => e.id !== id));
            setSuccessMessage("Ledger entry deleted successfully!");
        } catch (err) {
            alert(err.message);
        }
    };

    const handlePrint = (entry) => {
        // Placeholder for printing logic
        window.print();
    };

    const filteredEntries = entries.filter(entry => {
        const query = (searchQuery || "").toLowerCase();
        const matchesSearch = (entry.description || "").toLowerCase().includes(query) ||
            (entry.customer?.name || "").toLowerCase().includes(query) ||
            (entry.customer?.code || "").toLowerCase().includes(query) ||
            entry.id.toString().includes(searchQuery);
        const matchesCustomer = !filterCustomer || entry.customerId === filterCustomer.id;
        return matchesSearch && matchesCustomer;
    });

    // Calculate totals
    const totals = filteredEntries.reduce((acc, entry) => {
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
                            لیجر انٹری درج کریں
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                variant="contained"
                                startIcon={<Save size={18} />}
                                onClick={handleSubmit}
                                disabled={loading || !formData.customerId || !formData.amount}
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
                            <Grid item xs={12}>
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151', fontSize: '0.875rem' }} className="font-urdu">گاہک کا انتخاب کریں</Typography>
                                </Box>
                                <Autocomplete
                                    options={customers}
                                    getOptionLabel={(option) => `${option.name || ""}${option.code ? ` (${option.code})` : ''}`}
                                    value={customers.find(c => c.id === formData.customerId) || null}
                                    onChange={(e, newValue) => setFormData(prev => ({ ...prev, customerId: newValue?.id || '' }))}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            placeholder="گاہک تلاش کریں"
                                            required
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
                            <Grid item xs={12} md={6}>
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151', fontSize: '0.875rem' }} className="font-urdu">انٹری کی قسم</Typography>
                                </Box>
                                <TextField
                                    fullWidth
                                    select
                                    required
                                    name="type"
                                    dir="rtl"
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
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
                                    <MenuItem value="DEBIT">وصولی (Debit)</MenuItem>
                                    <MenuItem value="CREDIT">ادائیگی (Credit)</MenuItem>
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
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
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
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 3, flexDirection: 'row-reverse' }}>
                <Grid item xs={12} md={4}>
                    <Card sx={{
                        p: 3,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        borderRadius: 3,
                        boxShadow: '0 10px 40px rgba(102, 126, 234, 0.3)'
                    }}>
                        <Box sx={{ display: 'flex', flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500, textAlign: 'right' }} className="font-urdu">کل ڈیبٹ</Typography>
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
                        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                        color: 'white',
                        borderRadius: 3,
                        boxShadow: '0 10px 40px rgba(240, 147, 251, 0.3)'
                    }}>
                        <Box sx={{ display: 'flex', flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500, textAlign: 'right' }} className="font-urdu">کل کریڈٹ</Typography>
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
                        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                        color: 'white',
                        borderRadius: 3,
                        boxShadow: '0 10px 40px rgba(79, 172, 254, 0.3)'
                    }}>
                        <Box sx={{ display: 'flex', flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500, textAlign: 'right' }} className="font-urdu">موجودہ بیلنس</Typography>
                                <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 1, textAlign: 'right' }}>
                                    Rs. {balance.toLocaleString()}
                                </Typography>
                            </div>
                            <BookText size={40} style={{ opacity: 0.8 }} />
                        </Box>
                    </Card>
                </Grid>
            </Grid>

            {/* Action Bar */}
            <Box sx={{
                display: 'flex',
                flexDirection: 'row-reverse',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3,
                gap: 2,
                flexWrap: 'wrap'
            }}>
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'row-reverse',
                    gap: 2,
                    flex: 1
                }}>
                    <TextField
                        placeholder="تلاش کریں..."
                        variant="outlined"
                        size="small"
                        dir="rtl"
                        sx={{ minWidth: 300, bgcolor: 'white' }}
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
                    <Autocomplete
                        options={customers}
                        getOptionLabel={(option) => option.name || ""}
                        value={filterCustomer}
                        onChange={(e, newValue) => setFilterCustomer(newValue)}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="گاہک سے فلٹر کریں"
                                size="small"
                                dir="rtl"
                                sx={{
                                    minWidth: 300,
                                    '& .MuiInputLabel-root': { right: 28, left: 'auto', transformOrigin: 'top right' },
                                    '& .MuiOutlinedInput-root': { paddingRight: '39px !important' }
                                }}
                            />
                        )}
                        sx={{ minWidth: 300, bgcolor: 'white' }}
                    />
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
                    نئی انٹری درج کریں
                </Button>
            </Box>

            {/* Ledger Table */}
            <TableContainer component={Paper} elevation={0} sx={{
                borderRadius: 3,
                border: '1px solid #e5e7eb',
                overflow: 'auto',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
            }}>
                <Table sx={{ minWidth: 1000 }}>
                    <TableHead sx={{ bgcolor: '#f9fafb' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 600 }} align="right">ایکشن</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">موجودہ بیلنس</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">کریڈٹ</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">ڈیبٹ</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">سابقہ بیلنس</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">تاریخ / تفصیل</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">گاہک کا نام</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">حوالہ #</TableCell>
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
                                        const debitAmount = entry.type === 'DEBIT' ? parseFloat(entry.amount) : 0;
                                        const creditAmount = entry.type === 'CREDIT' ? parseFloat(entry.amount) : 0;
                                        running += (debitAmount - creditAmount);
                                        const currentBalance = running;

                                        return (
                                            <TableRow
                                                key={entry.id}
                                                sx={{ '&:hover': { bgcolor: '#f3f4f6' }, transition: 'background-color 0.2s' }}
                                            >
                                                <TableCell align="right">
                                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                                        <Tooltip title="Print Entry">
                                                            <IconButton size="small" sx={{ color: '#8b5cf6' }} onClick={() => handlePrint(entry)}>
                                                                <Printer size={18} />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Delete Entry">
                                                            <IconButton size="small" color="error" onClick={() => handleDelete(entry.id)}>
                                                                <Trash2 size={18} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            fontWeight: 700,
                                                            color: currentBalance >= 0 ? '#059669' : '#dc2626',
                                                            fontSize: '0.9rem'
                                                        }}
                                                    >
                                                        Rs. {currentBalance.toLocaleString()}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            fontWeight: 600,
                                                            color: creditAmount > 0 ? '#9f1239' : '#9ca3af'
                                                        }}
                                                    >
                                                        {creditAmount > 0 ? `Rs. ${creditAmount.toLocaleString()}` : '-'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            fontWeight: 600,
                                                            color: debitAmount > 0 ? '#1e40af' : '#9ca3af'
                                                        }}
                                                    >
                                                        {debitAmount > 0 ? `Rs. ${debitAmount.toLocaleString()}` : '-'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                        Rs. {preBalance.toLocaleString()}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography variant="body2">
                                                        {new Date(entry.entryDate).toLocaleDateString()}
                                                    </Typography>
                                                    {entry.description && (
                                                        <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                                                            {entry.description}
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                        {entry.customer.name}
                                                    </Typography>
                                                    {entry.customer.code && (
                                                        <Typography variant="caption" color="textSecondary">
                                                            {entry.customer.code}
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                                        #{entry.id}
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    });
                            })()
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                                    <Typography color="textSecondary">No ledger entries found.</Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Add Entry Modal */}

            {/* Success Notification */}
            <Snackbar
                open={!!successMessage}
                autoHideDuration={4000}
                onClose={() => setSuccessMessage("")}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={() => setSuccessMessage("")} severity="success" sx={{ width: '100%', borderRadius: 2 }}>
                    {successMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
}
