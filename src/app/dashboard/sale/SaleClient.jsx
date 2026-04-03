"use client";

import { useState } from "react";
import {
    Box, Button, Typography, TextField, InputAdornment, Autocomplete,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, IconButton, Divider, Alert, Snackbar, Chip, Tooltip,
    Card, CardContent, Grid,
} from "@mui/material";
import {
    Search, Plus, Trash2, ShoppingBag, User, Tag, ReceiptText,
    Minus, BadgePercent,
} from "lucide-react";

const emptyCart = [];

export default function SaleClient({ products, customers }) {
    const [cart, setCart] = useState(emptyCart);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [billDiscount, setBillDiscount] = useState("");
    const [notes, setNotes] = useState("");
    const [productSearch, setProductSearch] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [lastBillNumber, setLastBillNumber] = useState(null);

    // Add product to cart
    const handleAddProduct = (product) => {
        if (!product) return;
        setCart(prev => {
            const existing = prev.find(i => i.productId === product.id);
            if (existing) {
                return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, {
                productId: product.id,
                name: product.name,
                sku: product.sku,
                unitPrice: parseFloat(product.unitPrice || 0),
                quantity: 1,
                discount: "",
            }];
        });
        setProductSearch(null);
    };

    const handleQtyChange = (productId, delta) => {
        setCart(prev => prev
            .map(i => i.productId === productId ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i)
        );
    };

    const handleQtyInput = (productId, value) => {
        const qty = parseInt(value) || 1;
        setCart(prev => prev.map(i => i.productId === productId ? { ...i, quantity: Math.max(1, qty) } : i));
    };

    const handlePriceChange = (productId, value) => {
        setCart(prev => prev.map(i => i.productId === productId ? { ...i, unitPrice: value } : i));
    };

    const handleItemDiscountChange = (productId, value) => {
        const v = Math.min(100, Math.max(0, parseFloat(value) || 0));
        setCart(prev => prev.map(i => i.productId === productId ? { ...i, discount: value === "" ? "" : v } : i));
    };

    const handleRemove = (productId) => {
        setCart(prev => prev.filter(i => i.productId !== productId));
    };

    // Calculations
    const getItemTotal = (item) => {
        const price = parseFloat(item.unitPrice) || 0;
        const disc = parseFloat(item.discount) || 0;
        return item.quantity * price * (1 - disc / 100);
    };

    const subtotal = cart.reduce((sum, item) => sum + getItemTotal(item), 0);
    const billDiscountAmt = Math.min(parseFloat(billDiscount) || 0, subtotal);
    const total = subtotal - billDiscountAmt;

    const handleSave = async () => {
        if (cart.length === 0) { setError("Add at least one product to the cart."); return; }
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/sale", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customerId: selectedCustomer?.id || null,
                    items: cart.map(i => ({
                        productId: i.productId,
                        quantity: i.quantity,
                        unitPrice: parseFloat(i.unitPrice) || 0,
                        discount: parseFloat(i.discount) || 0,
                    })),
                    billDiscountAmt,
                    notes,
                }),
            });

            if (!res.ok) {
                const d = await res.json();
                throw new Error(d.error || "Failed to save sale");
            }

            const saved = await res.json();
            setLastBillNumber(saved.billNumber);
            setSuccessMessage(`Bill ${saved.billNumber} saved successfully!`);
            // Reset
            setCart([]);
            setSelectedCustomer(null);
            setBillDiscount("");
            setNotes("");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ px: 3, pb: 4 }}>
            <Grid container spacing={3}>

                {/* ── Left: Product search + Cart ──────────── */}
                <Grid size={{ xs: 12, lg: 8 }}>

                    {/* Product search */}
                    <Autocomplete
                        options={products}
                        value={productSearch}
                        onChange={(_, val) => handleAddProduct(val)}
                        getOptionLabel={(opt) => `${opt.name} — ${opt.sku}`}
                        filterOptions={(opts, { inputValue }) => {
                            const q = inputValue.toLowerCase();
                            return opts.filter(o =>
                                o.name.toLowerCase().includes(q) ||
                                (o.sku || "").toLowerCase().includes(q)
                            );
                        }}
                        renderOption={(props, opt) => (
                            <Box component="li" {...props} key={opt.id}>
                                <Box sx={{ display: "flex", flexDirection: "column" }}>
                                    <Typography variant="body2" fontWeight={600}>{opt.name}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Code: {opt.sku} &nbsp;|&nbsp; Rs. {parseFloat(opt.unitPrice || 0).toLocaleString()}
                                    </Typography>
                                </Box>
                            </Box>
                        )}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                placeholder="Search by product name or code…"
                                size="small"
                                sx={{ bgcolor: "background.paper", "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                                InputProps={{
                                    ...params.InputProps,
                                    startAdornment: (
                                        <InputAdornment position="start"><Search size={18} /></InputAdornment>
                                    ),
                                }}
                            />
                        )}
                        sx={{ mb: 3 }}
                        blurOnSelect
                        clearOnBlur={false}
                    />

                    {/* Cart table */}
                    <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, overflow: "hidden" }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: "action.hover" }}>
                                    <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Product</TableCell>
                                    <TableCell sx={{ fontWeight: 700, py: 1.5, width: 110 }} align="center">Qty</TableCell>
                                    <TableCell sx={{ fontWeight: 700, py: 1.5, width: 130 }}>Unit Price</TableCell>
                                    <TableCell sx={{ fontWeight: 700, py: 1.5, width: 110 }}>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                            <BadgePercent size={14} /> Disc %
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 700, py: 1.5, width: 110 }} align="right">Total</TableCell>
                                    <TableCell sx={{ width: 40 }} />
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {cart.length > 0 ? cart.map((item) => (
                                    <TableRow key={item.productId} hover>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={600}>{item.name}</Typography>
                                            <Typography variant="caption" color="text.secondary" fontFamily="monospace">{item.sku}</Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, justifyContent: "center" }}>
                                                <IconButton size="small" onClick={() => handleQtyChange(item.productId, -1)} sx={{ p: 0.3 }}>
                                                    <Minus size={14} />
                                                </IconButton>
                                                <TextField
                                                    value={item.quantity}
                                                    onChange={(e) => handleQtyInput(item.productId, e.target.value)}
                                                    size="small"
                                                    type="number"
                                                    inputProps={{ min: 1, style: { textAlign: "center", padding: "2px 4px", width: 40 } }}
                                                    variant="outlined"
                                                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }}
                                                />
                                                <IconButton size="small" onClick={() => handleQtyChange(item.productId, 1)} sx={{ p: 0.3 }}>
                                                    <Plus size={14} />
                                                </IconButton>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                value={item.unitPrice}
                                                onChange={(e) => handlePriceChange(item.productId, e.target.value)}
                                                size="small"
                                                type="number"
                                                inputProps={{ min: 0, style: { padding: "4px 6px" } }}
                                                InputProps={{ startAdornment: <InputAdornment position="start"><Typography variant="caption">Rs.</Typography></InputAdornment> }}
                                                sx={{ width: 120, "& .MuiOutlinedInput-root": { borderRadius: 1 } }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                value={item.discount}
                                                onChange={(e) => handleItemDiscountChange(item.productId, e.target.value)}
                                                size="small"
                                                type="number"
                                                placeholder="0"
                                                inputProps={{ min: 0, max: 100, style: { padding: "4px 6px" } }}
                                                InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                                                sx={{ width: 90, "& .MuiOutlinedInput-root": { borderRadius: 1 } }}
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography variant="body2" fontWeight={700} color="success.main">
                                                Rs. {getItemTotal(item).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                            </Typography>
                                            {parseFloat(item.discount) > 0 && (
                                                <Typography variant="caption" color="error.main" display="block">
                                                    -{item.discount}% off
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <IconButton size="small" color="error" onClick={() => handleRemove(item.productId)}>
                                                <Trash2 size={15} />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                                            <ShoppingBag size={36} color="#d1d5db" />
                                            <Typography color="text.secondary" sx={{ mt: 1 }}>
                                                Search and add products above
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Paper>
                </Grid>

                {/* ── Right: Customer + Summary + Actions ────── */}
                <Grid size={{ xs: 12, lg: 4 }}>
                    <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, position: "sticky", top: 16 }}>
                        <CardContent sx={{ p: 3 }}>

                            {/* Customer */}
                            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, display: "flex", alignItems: "center", gap: 0.8 }}>
                                <User size={16} /> Customer (optional)
                            </Typography>
                            <Autocomplete
                                options={customers}
                                value={selectedCustomer}
                                onChange={(_, val) => setSelectedCustomer(val)}
                                getOptionLabel={(opt) => `${opt.name}${opt.phone ? ` — ${opt.phone}` : ""}`}
                                renderInput={(params) => (
                                    <TextField {...params} placeholder="Walk-in / Cash Sale" size="small" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
                                )}
                                clearOnEscape
                            />

                            <Divider sx={{ my: 2.5 }} />

                            {/* Bill Discount */}
                            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, display: "flex", alignItems: "center", gap: 0.8 }}>
                                <BadgePercent size={16} /> Bill Discount
                            </Typography>
                            <TextField
                                fullWidth size="small"
                                label="Discount on entire bill"
                                type="number"
                                placeholder="0"
                                value={billDiscount}
                                onChange={(e) => setBillDiscount(e.target.value)}
                                InputProps={{ startAdornment: <InputAdornment position="start">Rs.</InputAdornment> }}
                                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                            />

                            <Divider sx={{ my: 2.5 }} />

                            {/* Bill Summary */}
                            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, display: "flex", alignItems: "center", gap: 0.8 }}>
                                <ReceiptText size={16} /> Bill Summary
                            </Typography>

                            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                    <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                                    <Typography variant="body2" fontWeight={600}>
                                        Rs. {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </Typography>
                                </Box>
                                {billDiscountAmt > 0 && (
                                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                        <Typography variant="body2" color="error.main">Bill Discount</Typography>
                                        <Typography variant="body2" color="error.main" fontWeight={600}>
                                            − Rs. {billDiscountAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </Typography>
                                    </Box>
                                )}
                                <Divider />
                                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                    <Typography variant="subtitle1" fontWeight={700}>Total</Typography>
                                    <Typography variant="subtitle1" fontWeight={800} color="success.main">
                                        Rs. {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </Typography>
                                </Box>
                            </Box>

                            <Divider sx={{ my: 2.5 }} />

                            {/* Notes */}
                            <TextField
                                fullWidth size="small" label="Notes" multiline rows={2}
                                placeholder="Optional notes…"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                sx={{ mb: 2.5, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                            />

                            {error && (
                                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError("")}>
                                    {error}
                                </Alert>
                            )}

                            <Button
                                fullWidth variant="contained" size="large"
                                onClick={handleSave}
                                disabled={loading || cart.length === 0}
                                startIcon={<ReceiptText size={18} />}
                                sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700, py: 1.4 }}
                            >
                                {loading ? "Saving…" : `Save Bill — Rs. ${total.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                            </Button>

                            {cart.length > 0 && (
                                <Button
                                    fullWidth variant="outlined" color="inherit" size="small"
                                    onClick={() => setCart([])}
                                    sx={{ mt: 1, borderRadius: 2, textTransform: "none" }}
                                >
                                    Clear Cart
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Snackbar
                open={!!successMessage} autoHideDuration={5000}
                onClose={() => setSuccessMessage("")}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            >
                <Alert onClose={() => setSuccessMessage("")} severity="success" variant="filled" sx={{ width: "100%", borderRadius: 2 }}>
                    {successMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
}
