"use client";

import { useState } from "react";
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
    Autocomplete,
    Chip,
    Avatar,
    Tooltip,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import {
    Trash2,
    Search,
    Plus,
    X as XIcon,
    Save,
    ShoppingCart,
    CreditCard,
} from "lucide-react";

const PAYMENT_METHODS = [
    { value: "CASH", label: "Cash" },
    { value: "BANK_TRANSFER", label: "Bank Transfer" },
    { value: "CHEQUE", label: "Cheque" },
    { value: "ONLINE", label: "Online" },
];

export default function PurchaseManagementClient({ initialPurchases, suppliers, products, banks }) {
    const [purchases, setPurchases] = useState(initialPurchases);
    const [searchQuery, setSearchQuery] = useState("");

    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const [formData, setFormData] = useState({
        supplierId: "",
        invoiceNumber: "",
        purchaseDate: new Date().toISOString().split("T")[0],
        notes: "",
        items: [],
        payments: [],
    });

    /* ── helpers ──────────────────────────────────────── */

    const resetForm = () => {
        setFormData({
            supplierId: "",
            invoiceNumber: `INV-${Date.now()}`,
            purchaseDate: new Date().toISOString().split("T")[0],
            notes: "",
            items: [],
            payments: [],
        });
        setError("");
    };

    const calcItemTotal = (item) => (parseFloat(item.quantity) || 0) * (parseFloat(item.costPrice) || 0);
    const calcGrandTotal = () => formData.items.reduce((s, i) => s + calcItemTotal(i), 0);
    const calcTotalPaid = () => formData.payments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
    const calcBalance = () => calcGrandTotal() - calcTotalPaid();

    /* ── handlers ─────────────────────────────────────── */

    const handleOpen = () => { resetForm(); setOpen(true); };
    const handleClose = () => { if (!loading) { setOpen(false); resetForm(); } };

    // Items
    const handleAddItem = () => setFormData(p => ({ ...p, items: [...p.items, { productId: "", quantity: 1, costPrice: 0 }] }));
    const handleRemoveItem = (i) => setFormData(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }));
    const handleItemChange = (index, field, value) => {
        setFormData(prev => {
            const items = [...prev.items];
            items[index] = { ...items[index], [field]: value };
            if (field === "productId") {
                const prod = (products || []).find(p => p.id === value);
                if (prod) { items[index].costPrice = prod.costPrice; items[index].unitPrice = prod.unitPrice; }
            }
            return { ...prev, items };
        });
    };

    // Payments
    const handleAddPayment = () => setFormData(p => ({ ...p, payments: [...p.payments, { amount: "", method: "CASH", date: new Date().toISOString().split("T")[0], notes: "" }] }));
    const handleRemovePayment = (i) => setFormData(p => ({ ...p, payments: p.payments.filter((_, idx) => idx !== i) }));
    const handlePaymentChange = (index, field, value) => {
        setFormData(prev => {
            const payments = [...prev.payments];
            payments[index] = { ...payments[index], [field]: value };
            return { ...prev, payments };
        });
    };

    const handleSubmit = async () => {
        if (!formData.supplierId) { setError("Please select a supplier."); return; }
        if (formData.items.length === 0) { setError("Please add at least one item."); return; }

        setLoading(true);
        setError("");
        try {
            const payload = {
                ...formData,
                totalAmount: calcGrandTotal().toString(),
                items: formData.items.map(item => ({
                    productId: parseInt(item.productId),
                    quantity: parseInt(item.quantity),
                    unitCost: parseFloat(item.costPrice).toString(),
                    totalCost: (parseInt(item.quantity) * parseFloat(item.costPrice)).toString(),
                })),
                payments: formData.payments.map(p => ({ ...p, amount: p.amount.toString() })),
            };

            const res = await fetch("/api/purchases", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to create purchase");
            }

            const saved = await res.json();
            setPurchases(prev => [saved, ...prev]);
            setSuccessMessage("Purchase saved successfully!");
            handleClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete this purchase? This will revert stock and balances. Cannot be undone.")) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/purchases/${id}`, { method: "DELETE" });
            if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to delete"); }
            setPurchases(prev => prev.filter(p => p.id !== id));
            setSuccessMessage("Purchase deleted successfully!");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const filtered = (purchases || []).filter(p => {
        const q = searchQuery.toLowerCase();
        return (p.invoiceNumber || "").toLowerCase().includes(q) ||
            (p.supplier?.name || "").toLowerCase().includes(q);
    });

    /* ── render ──────────────────────────────────────── */

    return (
        <Box sx={{ width: "100%", p: 3 }}>

            {/* ── Action bar ─────────────────────────────── */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, gap: 2 }}>
                <TextField
                    placeholder="Search by invoice or supplier…"
                    variant="outlined"
                    size="small"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    sx={{ width: 360 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start"><Search size={18} /></InputAdornment>
                        ),
                    }}
                />
                <Button
                    variant="contained"
                    startIcon={<Plus size={18} />}
                    onClick={handleOpen}
                    sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, px: 3 }}
                >
                    New Purchase
                </Button>
            </Box>

            {/* ── Purchases Table ─────────────────────────── */}
            <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, overflow: "hidden" }}>
                <TableContainer>
                    <Table sx={{ minWidth: 650 }}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: "action.hover" }}>
                                <TableCell sx={{ fontWeight: 700 }}>Invoice #</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Supplier</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Total Amount</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filtered.length > 0 ? (
                                filtered.map((purchase) => {
                                    const isPaid = parseFloat(purchase.paidAmount) >= parseFloat(purchase.totalAmount);
                                    return (
                                        <TableRow
                                            key={purchase.id}
                                            sx={{ "&:hover": { bgcolor: "action.hover" }, transition: "background-color 0.2s" }}
                                        >
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: 600 }}>
                                                    {purchase.invoiceNumber}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" color="text.secondary">
                                                    {new Date(purchase.purchaseDate).toLocaleDateString()}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={500}>
                                                    {purchase.supplierRel?.name || purchase.supplier}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={700} color="text.primary">
                                                    Rs. {parseFloat(purchase.totalAmount).toLocaleString()}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={isPaid ? "Paid" : "Partial"}
                                                    size="small"
                                                    color={isPaid ? "success" : "warning"}
                                                    variant="filled"
                                                    sx={{ borderRadius: 1, fontWeight: 600 }}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <Tooltip title="Delete Purchase">
                                                    <IconButton size="small" color="error" onClick={() => handleDelete(purchase.id)} disabled={loading}>
                                                        <Trash2 size={17} />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                                        <ShoppingCart size={40} color="#d1d5db" />
                                        <Typography color="text.secondary" sx={{ mt: 1.5 }}>
                                            No purchases found.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>

            {/* ── New Purchase Dialog ─────────────────────── */}
            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth="lg"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid", borderColor: "divider", pb: 2 }}>
                    New Purchase Entry
                </DialogTitle>

                <DialogContent sx={{ pt: "24px !important", pb: 3 }}>
                    {error && (
                        <Alert severity="error" variant="filled" onClose={() => setError("")} sx={{ mb: 2.5, borderRadius: 2 }}>
                            {error}
                        </Alert>
                    )}

                    {/* ── Row 1: Invoice | Supplier | Date ── */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={4}>
                            <TextField
                                fullWidth size="small"
                                label="Invoice Number"
                                value={formData.invoiceNumber}
                                variant="filled"
                                InputProps={{ readOnly: true }}
                            />
                        </Grid>
                        <Grid item xs={4}>
                            <Autocomplete
                                size="small"
                                options={suppliers || []}
                                getOptionLabel={(o) => o.name || ""}
                                value={(suppliers || []).find(s => s.id === formData.supplierId) || null}
                                onChange={(_, v) => setFormData(p => ({ ...p, supplierId: v ? v.id : "" }))}
                                componentsProps={{ paper: { sx: { minWidth: 300 } } }}
                                sx={{ minWidth: 300 }}
                                renderInput={(params) => (
                                    <TextField {...params} label="Supplier" required variant="outlined" />
                                )}
                            />
                        </Grid>
                        <Grid item xs={4}>
                            <DatePicker
                                label="Purchase Date"
                                value={formData.purchaseDate ? dayjs(formData.purchaseDate) : null}
                                onChange={(newValue) => setFormData(p => ({ ...p, purchaseDate: newValue ? newValue.format("YYYY-MM-DD") : "" }))}
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                        size: "small",
                                        required: true,
                                        variant: "outlined"
                                    }
                                }}
                            />
                        </Grid>
                    </Grid>

                    <Divider sx={{ mb: 3 }} />

                    {/* ── Items Section ── */}
                    <Box sx={{ mb: 3 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                            <Typography variant="subtitle1" fontWeight={700} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <ShoppingCart size={18} /> Purchase Items
                            </Typography>
                            <Button
                                size="small"
                                variant="outlined"
                                startIcon={<Plus size={15} />}
                                onClick={handleAddItem}
                                sx={{ borderRadius: 2, textTransform: "none" }}
                            >
                                Add Item
                            </Button>
                        </Box>

                        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                            <Table size="small">
                                <TableHead sx={{ bgcolor: "action.hover" }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 600, width: "40%" }}>Product</TableCell>
                                        <TableCell sx={{ fontWeight: 600, width: "15%" }}>Qty</TableCell>
                                        <TableCell sx={{ fontWeight: 600, width: "20%" }}>Cost Price</TableCell>
                                        <TableCell sx={{ fontWeight: 600, width: "20%" }}>Total</TableCell>
                                        <TableCell sx={{ width: "5%" }} />
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {formData.items.map((item, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell sx={{ py: 1 }}>
                                                <Autocomplete
                                                    size="small"
                                                    options={products || []}
                                                    getOptionLabel={(o) => o.name || ""}
                                                    value={(products || []).find(p => p.id === item.productId) || null}
                                                    onChange={(_, v) => handleItemChange(idx, "productId", v ? v.id : "")}
                                                    componentsProps={{ paper: { sx: { minWidth: 300 } } }}
                                                    sx={{ minWidth: 260 }}
                                                    renderInput={(params) => (
                                                        <TextField {...params} label="Product" variant="outlined" />
                                                    )}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ py: 1 }}>
                                                <TextField
                                                    fullWidth size="small"
                                                    type="number"
                                                    label="Qty"
                                                    value={item.quantity}
                                                    onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell sx={{ py: 1 }}>
                                                <TextField
                                                    fullWidth size="small"
                                                    type="number"
                                                    label="Cost (Rs.)"
                                                    value={item.costPrice}
                                                    onChange={(e) => handleItemChange(idx, "costPrice", e.target.value)}
                                                    variant="outlined"
                                                    InputProps={{ startAdornment: <InputAdornment position="start">Rs.</InputAdornment> }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ py: 1 }}>
                                                <Typography variant="body2" fontWeight={700} color="primary.main">
                                                    Rs. {calcItemTotal(item).toLocaleString()}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ py: 1 }}>
                                                <Tooltip title="Remove">
                                                    <IconButton size="small" color="error" onClick={() => handleRemoveItem(idx)}>
                                                        <Trash2 size={15} />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {formData.items.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center" sx={{ py: 3, color: "text.secondary" }}>
                                                No items added yet. Click "Add Item" to begin.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {/* Grand Total row */}
                                    {formData.items.length > 0 && (
                                        <TableRow sx={{ bgcolor: "action.hover" }}>
                                            <TableCell colSpan={3} sx={{ fontWeight: 700 }}>Grand Total</TableCell>
                                            <TableCell colSpan={2} sx={{ fontWeight: 700, color: "primary.main", fontSize: "1rem" }}>
                                                Rs. {calcGrandTotal().toLocaleString()}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>

                    <Divider sx={{ mb: 3 }} />

                    {/* ── Payments Section ── */}
                    <Box sx={{ mb: 3 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                            <Typography variant="subtitle1" fontWeight={700} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <CreditCard size={18} /> Payments
                            </Typography>
                            <Button
                                size="small"
                                variant="outlined"
                                color="success"
                                startIcon={<Plus size={15} />}
                                onClick={handleAddPayment}
                                sx={{ borderRadius: 2, textTransform: "none" }}
                            >
                                Add Payment
                            </Button>
                        </Box>

                        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                            <Table size="small">
                                <TableHead sx={{ bgcolor: "action.hover" }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 600, width: "22%" }}>Amount</TableCell>
                                        <TableCell sx={{ fontWeight: 600, width: "25%" }}>Method</TableCell>
                                        <TableCell sx={{ fontWeight: 600, width: "22%" }}>Date</TableCell>
                                        <TableCell sx={{ fontWeight: 600, width: "25%" }}>Notes</TableCell>
                                        <TableCell sx={{ width: "6%" }} />
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {formData.payments.map((payment, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell sx={{ py: 1 }}>
                                                <TextField
                                                    fullWidth size="small"
                                                    type="number"
                                                    label="Amount"
                                                    value={payment.amount}
                                                    onChange={(e) => handlePaymentChange(idx, "amount", e.target.value)}
                                                    variant="outlined"
                                                    InputProps={{ startAdornment: <InputAdornment position="start">Rs.</InputAdornment> }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ py: 1 }}>
                                                <Autocomplete
                                                    size="small"
                                                    options={PAYMENT_METHODS}
                                                    getOptionLabel={(o) => o.label}
                                                    value={PAYMENT_METHODS.find(m => m.value === payment.method) || null}
                                                    onChange={(_, v) => handlePaymentChange(idx, "method", v ? v.value : "")}
                                                    componentsProps={{ paper: { sx: { minWidth: 200 } } }}
                                                    sx={{ minWidth: 160 }}
                                                    renderInput={(params) => (
                                                        <TextField {...params} label="Method" variant="outlined" />
                                                    )}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ py: 1 }}>
                                                <DatePicker
                                                    label="Date"
                                                    value={payment.date ? dayjs(payment.date) : null}
                                                    onChange={(newValue) => handlePaymentChange(idx, "date", newValue ? newValue.format("YYYY-MM-DD") : "")}
                                                    slotProps={{
                                                        textField: {
                                                            fullWidth: true,
                                                            size: "small",
                                                            variant: "outlined"
                                                        }
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ py: 1 }}>
                                                <TextField
                                                    fullWidth size="small"
                                                    label="Notes"
                                                    value={payment.notes}
                                                    onChange={(e) => handlePaymentChange(idx, "notes", e.target.value)}
                                                    placeholder="Optional"
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell sx={{ py: 1 }}>
                                                <Tooltip title="Remove">
                                                    <IconButton size="small" color="error" onClick={() => handleRemovePayment(idx)}>
                                                        <Trash2 size={15} />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {formData.payments.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center" sx={{ py: 3, color: "text.secondary" }}>
                                                No payments added. Unpaid purchases will be tracked as credit.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {/* Summary row */}
                                    {formData.payments.length > 0 && (
                                        <TableRow sx={{ bgcolor: "action.hover" }}>
                                            <TableCell colSpan={5}>
                                                <Box sx={{ display: "flex", gap: 4, px: 1 }}>
                                                    <Typography variant="body2">
                                                        Total Paid: <b>Rs. {calcTotalPaid().toLocaleString()}</b>
                                                    </Typography>
                                                    <Typography variant="body2" color={calcBalance() > 0 ? "error.main" : "success.main"}>
                                                        Balance: <b>Rs. {calcBalance().toLocaleString()}</b>
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>

                    {/* ── Notes ── */}
                    <TextField
                        fullWidth size="small"
                        label="Additional Notes"
                        multiline
                        rows={2}
                        value={formData.notes}
                        onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                        variant="outlined"
                        placeholder="Optional remarks or special instructions…"
                    />
                </DialogContent>

                <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid", borderColor: "divider", gap: 1 }}>
                    <Button
                        onClick={handleClose}
                        variant="outlined"
                        color="inherit"
                        disabled={loading}
                        startIcon={<XIcon size={17} />}
                        sx={{ borderRadius: 2, textTransform: "none" }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={loading}
                        startIcon={loading ? null : <Save size={17} />}
                        sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, px: 3 }}
                    >
                        {loading ? <CircularProgress size={20} color="inherit" /> : "Save Purchase"}
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