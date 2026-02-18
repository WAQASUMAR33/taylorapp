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
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const [formData, setFormData] = useState({
        customerId: "",
        type: "DEBIT",
        amount: "",
        description: ""
    });

    const handleOpen = () => {
        setFormData({
            customerId: "",
            type: "DEBIT",
            amount: "",
            description: ""
        });
        setError("");
        setOpen(true);
    };

    const handleClose = () => {
        if (!loading) setOpen(false);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
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
            setSuccessMessage("Ledger entry created successfully!");
            setOpen(false);
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
        const matchesSearch = entry.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            entry.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            entry.customer.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
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

    return (
        <Box sx={{ width: '100%', p: 3 }}>
            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                    <Card sx={{
                        p: 3,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        borderRadius: 3,
                        boxShadow: '0 10px 40px rgba(102, 126, 234, 0.3)'
                    }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>Total Debit</Typography>
                                <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 1 }}>
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
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>Total Credit</Typography>
                                <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 1 }}>
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
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>Current Balance</Typography>
                                <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 1 }}>
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
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3,
                gap: 2,
                flexWrap: 'wrap'
            }}>
                <Box sx={{ display: 'flex', gap: 2, flex: 1 }}>
                    <TextField
                        placeholder="Search by ID, customer name, code, or description..."
                        variant="outlined"
                        size="small"
                        sx={{ minWidth: 300, bgcolor: 'white' }}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search size={18} />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <Autocomplete
                        options={customers}
                        getOptionLabel={(option) => option.name}
                        value={filterCustomer}
                        onChange={(e, newValue) => setFilterCustomer(newValue)}
                        renderInput={(params) => <TextField {...params} label="Filter by Customer" size="small" sx={{ minWidth: 300 }} />}
                        sx={{ minWidth: 300, bgcolor: 'white', borderRadius: 2 }}
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
                        bgcolor: '#3b82f6',
                        '&:hover': { bgcolor: '#2563eb' }
                    }}
                >
                    Add Entry
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
                            <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Pre-Balance</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Debit</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Credit</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Current Balance</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
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
                                                <TableCell>
                                                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                                        #{entry.id}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                        {entry.customer.name}
                                                    </Typography>
                                                    {entry.customer.code && (
                                                        <Typography variant="caption" color="textSecondary">
                                                            {entry.customer.code}
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell>
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
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                        Rs. {preBalance.toLocaleString()}
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
                                                            fontWeight: 700,
                                                            color: currentBalance >= 0 ? '#059669' : '#dc2626',
                                                            fontSize: '0.9rem'
                                                        }}
                                                    >
                                                        Rs. {currentBalance.toLocaleString()}
                                                    </Typography>
                                                </TableCell>
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
            <Dialog
                open={open}
                onClose={handleClose}
                fullWidth
                maxWidth="sm"
                PaperProps={{
                    sx: { borderRadius: 3, p: 1 }
                }}
            >
                <DialogTitle sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontWeight: 'bold'
                }}>
                    Add Ledger Entry
                    <IconButton onClick={handleClose} disabled={loading}>
                        <X size={20} />
                    </IconButton>
                </DialogTitle>
                <form onSubmit={handleSubmit}>
                    <DialogContent>
                        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Select Customer</Typography>
                                <Autocomplete
                                    options={customers}
                                    getOptionLabel={(option) => `${option.name}${option.code ? ` (${option.code})` : ''}`}
                                    onChange={(e, newValue) => setFormData(prev => ({ ...prev, customerId: newValue?.id || '' }))}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            placeholder="Search and select customer..."
                                            required
                                            variant="outlined"
                                            size="small"
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    bgcolor: 'white',
                                                    borderRadius: '10px',
                                                    '& fieldset': { borderColor: '#e5e7eb' },
                                                    '&:hover fieldset': { borderColor: '#3b82f6' },
                                                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                                                }
                                            }}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Entry Type</Typography>
                                <TextField
                                    fullWidth
                                    select
                                    name="type"
                                    required
                                    value={formData.type}
                                    onChange={handleInputChange}
                                    variant="outlined"
                                    size="small"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: 'white',
                                            borderRadius: '10px',
                                            '& fieldset': { borderColor: '#e5e7eb' },
                                            '&:hover fieldset': { borderColor: '#3b82f6' },
                                            '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                                        }
                                    }}
                                >
                                    <MenuItem value="DEBIT">Debit</MenuItem>
                                    <MenuItem value="CREDIT">Credit</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Amount</Typography>
                                <TextField
                                    fullWidth
                                    name="amount"
                                    type="number"
                                    required
                                    placeholder="e.g. 1000"
                                    value={formData.amount}
                                    onChange={handleInputChange}
                                    variant="outlined"
                                    size="small"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Typography sx={{ color: '#9ca3af', fontWeight: 600, fontSize: '0.875rem' }}>Rs.</Typography>
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: 'white',
                                            borderRadius: '10px',
                                            '& fieldset': { borderColor: '#e5e7eb' },
                                            '&:hover fieldset': { borderColor: '#3b82f6' },
                                            '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                                        }
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Box sx={{ mb: 1.5, display: 'inline-flex', alignItems: 'center', gap: 1.5, borderLeft: '4px solid #8b5cf6', pl: 1.5 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#1f2937', fontSize: '0.95rem', letterSpacing: '0.01em' }}>
                                        Description / Remarks
                                    </Typography>
                                </Box>
                                <TextField
                                    fullWidth
                                    name="description"
                                    placeholder="e.g. Payment received against invoice #123, or custom order advance..."
                                    multiline
                                    rows={3}
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    variant="outlined"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: 'white',
                                            borderRadius: '12px',
                                            '& fieldset': { borderColor: '#e5e7eb' },
                                            '&:hover fieldset': { borderColor: '#3b82f6' },
                                            '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                                        }
                                    }}
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ p: 3 }}>
                        <Button
                            onClick={handleClose}
                            disabled={loading}
                            sx={{ color: 'text.secondary', textTransform: 'none' }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={loading}
                            sx={{
                                borderRadius: 2,
                                textTransform: 'none',
                                px: 4,
                                bgcolor: '#3b82f6',
                                '&:hover': { bgcolor: '#2563eb' },
                                minWidth: 120
                            }}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : "Save Entry"}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

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
