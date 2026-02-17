"use client";

import { useState, useEffect } from "react";
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
    Autocomplete,
    Divider
} from "@mui/material";
import {
    Edit,
    Trash2,
    Search,
    Plus,
    X as XIcon,
    ShoppingCart,
    Calendar,
    FileText,
    CreditCard,
    Save,
    DollarSign,
    Package
} from "lucide-react";

export default function PurchaseManagementClient({ initialPurchases, suppliers, products }) {
    const [purchases, setPurchases] = useState(initialPurchases);
    const [searchQuery, setSearchQuery] = useState("");

    // UI States
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    // Form State
    const [formData, setFormData] = useState({
        supplierId: "",
        invoiceNumber: "",
        purchaseDate: new Date().toISOString().split('T')[0],
        notes: "",
        items: [],
        payments: []
    });

    const resetForm = () => {
        setFormData({
            supplierId: "",
            invoiceNumber: `INV-${Date.now()}`,
            purchaseDate: new Date().toISOString().split('T')[0],
            notes: "",
            items: [],
            payments: []
        });
        setError("");
    };

    const handleOpen = () => {
        resetForm();
        setShowForm(true);
    };

    const handleClose = () => {
        if (!loading) {
            setShowForm(false);
            resetForm();
        }
    };

    // --- Calculation Helpers ---
    const calculateItemTotal = (item) => {
        const qty = parseFloat(item.quantity) || 0;
        const cost = parseFloat(item.costPrice) || 0;
        return qty * cost;
    };

    const calculateGrandTotal = () => {
        return formData.items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
    };

    const calculateTotalPaid = () => {
        return formData.payments.reduce((sum, payment) => sum + (parseFloat(payment.amount) || 0), 0);
    };

    const calculateBalance = () => {
        return calculateGrandTotal() - calculateTotalPaid();
    };

    // --- Dynamic Form Handlers ---

    // 1. Items
    const handleAddItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [
                ...prev.items,
                { productId: "", quantity: 1, costPrice: 0, unitPrice: 0 }
            ]
        }));
    };

    const handleRemoveItem = (index) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const handleItemChange = (index, field, value) => {
        setFormData(prev => {
            const newItems = [...prev.items];
            newItems[index] = { ...newItems[index], [field]: value };

            // If product selected, auto-fill prices
            if (field === 'productId') {
                const product = products.find(p => p.id === value);
                if (product) {
                    newItems[index].costPrice = product.costPrice;
                    newItems[index].unitPrice = product.unitPrice;
                }
            }

            return { ...prev, items: newItems };
        });
    };

    // 2. Payments
    const handleAddPayment = () => {
        setFormData(prev => ({
            ...prev,
            payments: [
                ...prev.payments,
                { amount: 0, method: "CASH", date: new Date().toISOString().split('T')[0], notes: "" }
            ]
        }));
    };

    const handleRemovePayment = (index) => {
        setFormData(prev => ({
            ...prev,
            payments: prev.payments.filter((_, i) => i !== index)
        }));
    };

    const handlePaymentChange = (index, field, value) => {
        setFormData(prev => {
            const newPayments = [...prev.payments];
            newPayments[index] = { ...newPayments[index], [field]: value };
            return { ...prev, payments: newPayments };
        });
    };

    // --- Submit ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (!formData.supplierId) {
            setError("Please select a supplier.");
            setLoading(false);
            return;
        }
        if (formData.items.length === 0) {
            setError("Please add at least one item.");
            setLoading(false);
            return;
        }

        try {
            // Sanitize payload: ensure decimals are handled correctly
            const payload = {
                ...formData,
                totalAmount: calculateGrandTotal().toString(),
                items: formData.items.map(item => ({
                    productId: parseInt(item.productId),
                    quantity: parseInt(item.quantity),
                    unitCost: parseFloat(item.costPrice).toString(),
                    totalCost: (parseInt(item.quantity) * parseFloat(item.costPrice)).toString()
                })),
                payments: formData.payments.map(payment => ({
                    ...payment,
                    amount: payment.amount.toString()
                }))
            };

            const response = await fetch("/api/purchases", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to create purchase");
            }

            const savedPurchase = await response.json();

            // Refresh purchase list (simplified for now, ideally re-fetch)
            setPurchases(prev => [savedPurchase, ...prev]);

            setSuccessMessage("Purchase recorded successfully!");
            setShowForm(false);
            resetForm();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (purchaseId) => {
        if (!confirm("Are you sure you want to delete this purchase? This will revert stock and balances. This action CANNOT be undone.")) return;

        setLoading(true);
        setError("");

        try {
            const response = await fetch(`/api/purchases/${purchaseId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to delete purchase");
            }

            setPurchases(prev => prev.filter(p => p.id !== purchaseId));
            setSuccessMessage("Purchase and associated records reverted successfully!");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Filter Logic
    const filteredPurchases = purchases.filter(p =>
        p.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.supplier.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (showForm) {
        return (
            <Box sx={{ width: '100%', bgcolor: '#f9fafb', minHeight: '100vh', p: 3 }}>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <Card sx={{ mb: 2 }}>
                    <Box sx={{ p: 2, bgcolor: '#8b5cf6', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            NEW PURCHASE ORDER
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                variant="contained"
                                startIcon={<Save size={18} />}
                                onClick={handleSubmit}
                                disabled={loading}
                                sx={{ bgcolor: '#059669', '&:hover': { bgcolor: '#047857' } }}
                            >
                                {loading ? <CircularProgress size={20} color="inherit" /> : "Save"}
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<XIcon size={18} />}
                                onClick={handleClose}
                                sx={{ bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' } }}
                            >
                                Cancel
                            </Button>
                        </Box>
                    </Box>

                    <Box sx={{ p: 3 }}>
                        {/* Header Details */}
                        <Grid container spacing={3} sx={{ mb: 4 }}>
                            <Grid item xs={12} md={4}>
                                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Invoice Number</Typography>
                                <TextField
                                    fullWidth
                                    size="small"
                                    value={formData.invoiceNumber}
                                    disabled
                                    variant="outlined"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <FileText size={18} color="#9ca3af" />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#f3f4f6', borderRadius: '10px' } }}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Supplier</Typography>
                                <Autocomplete
                                    options={suppliers}
                                    getOptionLabel={(option) => option.name || ""}
                                    value={suppliers.find(s => s.id === formData.supplierId) || null}
                                    onChange={(_, newValue) => {
                                        setFormData(prev => ({ ...prev, supplierId: newValue ? newValue.id : "" }));
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            placeholder="Search and select supplier..."
                                            required
                                            size="small"
                                            variant="outlined"
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    bgcolor: 'white',
                                                    borderRadius: '10px',
                                                    width: 300,
                                                    '& fieldset': { borderColor: '#e5e7eb' },
                                                    '&:hover fieldset': { borderColor: '#3b82f6' },
                                                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                                                }
                                            }}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Purchase Date</Typography>
                                <TextField
                                    fullWidth
                                    size="small"
                                    type="date"
                                    value={formData.purchaseDate}
                                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><Calendar size={18} color="#9ca3af" /></InputAdornment>,
                                    }}
                                    variant="outlined"
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
                        </Grid>

                        <Divider sx={{ my: 3 }} />

                        {/* Items Section */}
                        <Box sx={{ mb: 4 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <ShoppingCart size={20} /> Order Items
                                </Typography>
                                <Button
                                    startIcon={<Plus size={16} />}
                                    variant="outlined"
                                    size="small"
                                    onClick={handleAddItem}
                                >
                                    Add Item
                                </Button>
                            </Box>

                            <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                    <TableHead sx={{ bgcolor: '#f3f4f6' }}>
                                        <TableRow>
                                            <TableCell width="35%">Product</TableCell>
                                            <TableCell width="15%">Quantity</TableCell>
                                            <TableCell width="20%">Cost Price</TableCell>
                                            <TableCell width="20%">Total</TableCell>
                                            <TableCell width="10%"></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {formData.items.map((item, index) => (
                                            <TableRow key={index}>
                                                <TableCell>
                                                    <Autocomplete
                                                        options={products}
                                                        getOptionLabel={(option) => option.name || ""}
                                                        value={products.find(p => p.id === item.productId) || null}
                                                        onChange={(_, newValue) => handleItemChange(index, 'productId', newValue ? newValue.id : "")}
                                                        renderInput={(params) => (
                                                            <TextField
                                                                {...params}
                                                                placeholder="Select Product"
                                                                variant="outlined"
                                                                size="small"
                                                                sx={{
                                                                    '& .MuiOutlinedInput-root': {
                                                                        bgcolor: 'white',
                                                                        borderRadius: '8px',
                                                                        '& fieldset': { borderColor: '#e5e7eb' },
                                                                        '&:hover fieldset': { borderColor: '#3b82f6' },
                                                                        '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                                                                    }
                                                                }}
                                                            />
                                                        )}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <TextField
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                        variant="standard"
                                                        fullWidth
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <TextField
                                                        type="number"
                                                        value={item.costPrice}
                                                        onChange={(e) => handleItemChange(index, 'costPrice', e.target.value)}
                                                        variant="standard"
                                                        InputProps={{ startAdornment: <InputAdornment position="start">Rs.</InputAdornment> }}
                                                        fullWidth
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography fontWeight="bold">
                                                        Rs. {calculateItemTotal(item).toFixed(2)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <IconButton size="small" color="error" onClick={() => handleRemoveItem(index)}>
                                                        <Trash2 size={16} />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {formData.items.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                                    No items added.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        <TableRow sx={{ bgcolor: '#fafafa' }}>
                                            <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>Grand Total:</TableCell>
                                            <TableCell colSpan={2} sx={{ fontWeight: 'bold', color: 'primary.main', fontSize: '1.1rem' }}>
                                                Rs. {calculateGrandTotal().toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>

                        <Divider sx={{ my: 3 }} />

                        {/* Payments Section */}
                        <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CreditCard size={20} /> Payments
                                </Typography>
                                <Button
                                    startIcon={<Plus size={16} />}
                                    variant="outlined"
                                    size="small"
                                    onClick={handleAddPayment}
                                >
                                    Add Payment
                                </Button>
                            </Box>

                            <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                    <TableHead sx={{ bgcolor: '#f3f4f6' }}>
                                        <TableRow>
                                            <TableCell width="25%">Amount</TableCell>
                                            <TableCell width="25%">Method</TableCell>
                                            <TableCell width="25%">Date</TableCell>
                                            <TableCell width="15%">Notes</TableCell>
                                            <TableCell width="10%"></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {formData.payments.map((payment, index) => (
                                            <TableRow key={index}>
                                                <TableCell>
                                                    <TextField
                                                        type="number"
                                                        value={payment.amount}
                                                        onChange={(e) => handlePaymentChange(index, 'amount', e.target.value)}
                                                        variant="standard"
                                                        InputProps={{ startAdornment: <InputAdornment position="start">Rs.</InputAdornment> }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <TextField
                                                        select
                                                        value={payment.method}
                                                        onChange={(e) => handlePaymentChange(index, 'method', e.target.value)}
                                                        variant="standard"
                                                        fullWidth
                                                    >
                                                        {['CASH', 'BANK_TRANSFER', 'CHEQUE', 'ONLINE'].map(m => (
                                                            <MenuItem key={m} value={m}>{m}</MenuItem>
                                                        ))}
                                                    </TextField>
                                                </TableCell>
                                                <TableCell>
                                                    <TextField
                                                        type="date"
                                                        value={payment.date}
                                                        onChange={(e) => handlePaymentChange(index, 'date', e.target.value)}
                                                        variant="standard"
                                                        fullWidth
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <TextField
                                                        value={payment.notes}
                                                        onChange={(e) => handlePaymentChange(index, 'notes', e.target.value)}
                                                        placeholder="Optional"
                                                        variant="standard"
                                                        fullWidth
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <IconButton size="small" color="error" onClick={() => handleRemovePayment(index)}>
                                                        <Trash2 size={16} />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {formData.payments.length > 0 && (
                                            <TableRow sx={{ bgcolor: '#fafafa' }}>
                                                <TableCell colSpan={5}>
                                                    <Box sx={{ display: 'flex', gap: 4, justifyContent: 'flex-end', px: 2 }}>
                                                        <Typography variant="body2">Total Paid: <b>Rs. {calculateTotalPaid().toFixed(2)}</b></Typography>
                                                        <Typography variant="body2" color="error">Balance Due: <b>Rs. {calculateBalance().toFixed(2)}</b></Typography>
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>

                        <Grid container spacing={2} sx={{ mt: 2 }}>
                            <Grid item xs={12}>
                                <Box sx={{ mb: 1.5, display: 'inline-flex', alignItems: 'center', gap: 1.5, borderLeft: '4px solid #8b5cf6', pl: 1.5 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#1f2937', fontSize: '0.95rem', letterSpacing: '0.01em' }}>
                                        Additional Notes
                                    </Typography>
                                </Box>
                                <TextField
                                    fullWidth
                                    placeholder="e.g. Fragile items, handle with care, special delivery instructions..."
                                    multiline
                                    rows={3}
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
                    </Box>
                </Card>
            </Box>
        );
    }

    return (
        <Box sx={{ width: '100%', p: 3 }}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {/* Action Bar */}
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3,
                gap: 2
            }}>
                <TextField
                    placeholder="Search purchases..."
                    variant="outlined"
                    size="small"
                    sx={{ width: 450, bgcolor: 'white' }}
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
                    New Purchase
                </Button>
            </Box>

            {/* Purchases Table */}
            <TableContainer component={Paper} elevation={0} sx={{
                borderRadius: 3,
                border: '1px solid #e5e7eb',
                overflow: 'hidden'
            }}>
                <Table sx={{ minWidth: 650 }}>
                    <TableHead sx={{ bgcolor: '#f9fafb' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Invoice #</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Supplier</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Total Amount</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredPurchases.length > 0 ? (
                            filteredPurchases.map((purchase) => (
                                <TableRow
                                    key={purchase.id}
                                    sx={{ '&:hover': { bgcolor: '#f3f4f6' }, transition: 'background-color 0.2s' }}
                                >
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Calendar size={14} className="text-zinc-400" />
                                            <Typography variant="body2">
                                                {new Date(purchase.purchaseDate).toLocaleDateString()}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                                            {purchase.invoiceNumber}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {purchase.supplierRel?.name || purchase.supplier}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight="bold">
                                            Rs. {parseFloat(purchase.totalAmount).toFixed(2)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{
                                            px: 1.5,
                                            py: 0.5,
                                            bgcolor: purchase.paidAmount >= purchase.totalAmount ? '#dcfce7' : '#fee2e2',
                                            color: purchase.paidAmount >= purchase.totalAmount ? '#166534' : '#991b1b',
                                            borderRadius: 1,
                                            display: 'inline-block',
                                            fontSize: '0.75rem',
                                            fontWeight: 600
                                        }}>
                                            {purchase.paidAmount >= purchase.totalAmount ? 'PAID' : 'PARTIAL'}
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleDelete(purchase.id)}
                                            disabled={loading}
                                        >
                                            <Trash2 size={18} />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                                    <Typography color="textSecondary">No purchases found.</Typography>
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
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={() => setSuccessMessage("")} severity="success" sx={{ width: '100%', borderRadius: 2 }}>
                    {successMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
}
