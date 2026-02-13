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

    const [formData, setFormData] = useState({
        type: "DEBIT",
        amount: "",
        description: "",
        bookingId: ""
    });

    const handleOpen = () => {
        setFormData({
            type: "DEBIT",
            amount: "",
            description: "",
            bookingId: ""
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
            const response = await fetch("/api/cash", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to create cash entry");
            }

            const savedEntry = await response.json();

            // Re-fetch to get correct ordering and data
            const refreshRes = await fetch("/api/cash");
            const refreshedEntries = await refreshRes.json();
            setEntries(refreshedEntries);

            setSuccessMessage("Cash entry created successfully!");
            setOpen(false);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const filteredEntries = entries.filter(entry => {
        return entry.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            entry.id.toString().includes(searchQuery);
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

    return (
        <Box sx={{ width: '100%', p: 3 }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#1f2937' }}>Cash Management</Typography>
                    <Typography variant="body2" color="textSecondary">Track and manage physical cash account ledger</Typography>
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
                >
                    Record Cash Entry
                </Button>
            </Box>

            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={4}>
                    <Card sx={{
                        p: 3,
                        background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
                        color: 'white',
                        borderRadius: 4,
                        boxShadow: '0 10px 25px rgba(59, 130, 246, 0.3)'
                    }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>Total Cash In (Debit)</Typography>
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
                        background: 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)',
                        color: 'white',
                        borderRadius: 4,
                        boxShadow: '0 10px 25px rgba(239, 68, 68, 0.3)'
                    }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>Total Cash Out (Credit)</Typography>
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
                        background: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
                        color: 'white',
                        borderRadius: 4,
                        boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)'
                    }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>Cash In Hand</Typography>
                                <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 1 }}>
                                    Rs. {balance.toLocaleString()}
                                </Typography>
                            </div>
                            <Banknote size={40} style={{ opacity: 0.8 }} />
                        </Box>
                    </Card>
                </Grid>
            </Grid>

            {/* Action Bar */}
            <Box sx={{ mb: 3 }}>
                <TextField
                    placeholder="Search logs..."
                    variant="outlined"
                    size="small"
                    sx={{ width: 400, bgcolor: 'white' }}
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
                            <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Debit (In)</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Credit (Out)</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Balance</TableCell>
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

                                    return (
                                        <TableRow key={entry.id} sx={{ '&:hover': { bgcolor: '#f3f4f6' } }}>
                                            <TableCell>{new Date(entry.entryDate).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>{entry.description}</Typography>
                                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                                    <Typography variant="caption" color="textSecondary">#{entry.id}</Typography>
                                                    {entry.booking && (
                                                        <Chip
                                                            size="small"
                                                            icon={<LinkIcon size={12} />}
                                                            label={entry.booking.bookingNumber}
                                                            sx={{ height: 20, fontSize: '0.75rem' }}
                                                        />
                                                    )}
                                                </Box>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography variant="body2">
                                                    Rs. {preBalance.toLocaleString()}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography variant="body2" sx={{ color: debit > 0 ? '#2563eb' : '#9ca3af', fontWeight: debit > 0 ? 600 : 400 }}>
                                                    {debit > 0 ? `Rs. ${debit.toLocaleString()}` : '-'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography variant="body2" sx={{ color: credit > 0 ? '#dc2626' : '#9ca3af', fontWeight: credit > 0 ? 600 : 400 }}>
                                                    {credit > 0 ? `Rs. ${credit.toLocaleString()}` : '-'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                                    Rs. {current.toLocaleString()}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    );
                                });
                            })()
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                                    <Typography color="textSecondary">No cash transactions found.</Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Record Entry Modal */}
            <Dialog
                open={open}
                onClose={handleClose}
                fullWidth
                maxWidth="sm"
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 'bold' }}>Record Cash Transaction</DialogTitle>
                <form onSubmit={handleSubmit}>
                    <DialogContent>
                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>Type</Typography>
                                <TextField
                                    fullWidth
                                    select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleInputChange}
                                    size="small"
                                >
                                    <MenuItem value="DEBIT">Cash In (Debit)</MenuItem>
                                    <MenuItem value="CREDIT">Cash Out (Credit)</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>Amount</Typography>
                                <TextField
                                    fullWidth
                                    name="amount"
                                    type="number"
                                    required
                                    value={formData.amount}
                                    onChange={handleInputChange}
                                    size="small"
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">Rs.</InputAdornment>,
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>Link Booking (Optional)</Typography>
                                <Autocomplete
                                    options={bookings}
                                    getOptionLabel={(option) => `${option.bookingNumber} - ${option.customer.name}`}
                                    value={bookings.find(b => b.id === formData.bookingId) || null}
                                    onChange={(e, newValue) => setFormData(prev => ({ ...prev, bookingId: newValue?.id || "" }))}
                                    renderInput={(params) => <TextField {...params} placeholder="Search by Booking # or Customer..." size="small" />}
                                    sx={{ bgcolor: 'white' }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>Description</Typography>
                                <TextField
                                    fullWidth
                                    name="description"
                                    multiline
                                    rows={3}
                                    required
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Daily expense, Petty cash top-up, etc."
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ p: 3 }}>
                        <Button onClick={handleClose} disabled={loading}>Cancel</Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={loading}
                            sx={{ borderRadius: 2, bgcolor: '#8b5cf6', '&:hover': { bgcolor: '#7c3aed' } }}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : "Save Record"}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

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
