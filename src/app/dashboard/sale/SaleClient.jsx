"use client";

import { useState, useRef } from "react";
import {
    Box, Button, Typography, TextField, InputAdornment, Autocomplete,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, IconButton, Divider, Alert, Snackbar, Chip, Tooltip,
    Card, CardContent, Grid,
} from "@mui/material";
import {
    Search, Plus, Trash2, ShoppingBag, User, Tag, ReceiptText,
    Minus, BadgePercent, Printer, Wallet, ScanLine,
} from "lucide-react";

// ─── Print Header (same style as bookings) ───────────────────────────────────
function PrintHeader() {
    return (
        <div style={{ borderBottom: '3px solid #1a1a2e', paddingBottom: 10, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <img src="/logo.png" alt="Logo" style={{ width: 72, height: 72, objectFit: 'contain' }} />
                <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: 1, color: '#1a1a2e', textTransform: 'uppercase' }}>
                        Grace Cloth and Tailors
                    </div>
                    <div style={{ fontSize: 12, color: '#555', marginTop: 2, fontStyle: 'italic' }}>
                        Where Style Meets Perfection
                    </div>
                    <div style={{ fontSize: 12, marginTop: 4, color: '#222' }}>
                        📞 03006284318 &nbsp;|&nbsp; 03186284318
                    </div>
                    <div style={{ fontSize: 11, color: '#444', marginTop: 2 }}>
                        Basement of Faazal Plaza, Dhulyan Chowk Dinga
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Sale Receipt — 80 mm thermal ────────────────────────────────────────────
function SaleReceipt({ bill, cashPaid }) {
    if (!bill) return null;

    const fmtDate = (d) => new Date(d).toLocaleString('en-PK', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
    const rs = (n) => `Rs. ${parseFloat(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

    const Dash = () => (
        <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />
    );

    const Row = ({ label, value, bold, large }) => (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: large ? 14 : 11, fontWeight: bold ? 800 : 400, marginBottom: 2 }}>
            <span>{label}</span>
            <span>{value}</span>
        </div>
    );

    return (
        <div style={{
            fontFamily: "'Courier New', Courier, monospace",
            color: '#000',
            width: '76mm',
            boxSizing: 'border-box',
            fontSize: 11,
            padding: '3mm 2mm',
        }}>
            {/* ── Shop header ── */}
            <div style={{ textAlign: 'center', marginBottom: 6 }}>
                <div style={{ fontSize: 17, fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase', lineHeight: 1.2 }}>
                    Grace Cloth<br />&amp; Tailors
                </div>
                <div style={{ fontSize: 10, fontStyle: 'italic', marginTop: 3 }}>
                    Where Style Meets Perfection
                </div>
                <div style={{ fontSize: 10, marginTop: 3 }}>
                    0300-6284318 | 0318-6284318
                </div>
                <div style={{ fontSize: 10, marginTop: 2 }}>
                    Basement Faazal Plaza,<br />Dhulyan Chowk Dinga
                </div>
            </div>

            <Dash />

            <div style={{ textAlign: 'center', fontWeight: 800, fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>
                SALE RECEIPT
            </div>

            <Dash />

            {/* ── Bill info ── */}
            <div style={{ fontSize: 10, lineHeight: 1.6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span><strong>Bill #:</strong> {bill.billNumber}</span>
                    <span>{fmtDate(bill.createdAt)}</span>
                </div>
                <div>
                    <strong>Customer:</strong>{' '}
                    {bill.customer ? bill.customer.name : 'Walk-in / Cash Sale'}
                    {bill.customer?.phone && ` | ${bill.customer.phone}`}
                </div>
            </div>

            <Dash />

            {/* ── Items ── */}
            <div style={{ fontSize: 10 }}>
                <div style={{ display: 'flex', fontWeight: 700, borderBottom: '1px solid #000', paddingBottom: 3, marginBottom: 4 }}>
                    <span style={{ flex: 4 }}>Item</span>
                    <span style={{ flex: 1, textAlign: 'center' }}>Qty</span>
                    <span style={{ flex: 2, textAlign: 'right' }}>Price</span>
                    <span style={{ flex: 2, textAlign: 'right' }}>Total</span>
                </div>

                {(bill.items || []).map((item, idx) => (
                    <div key={item.id} style={{ marginBottom: 6 }}>
                        <div style={{ fontWeight: 700, fontSize: 11 }}>
                            {idx + 1}. {item.product?.name || '—'}
                        </div>
                        <div style={{ display: 'flex', fontSize: 10 }}>
                            <span style={{ flex: 4, color: '#555' }}>{item.product?.sku || ''}</span>
                            <span style={{ flex: 1, textAlign: 'center' }}>{item.quantity}</span>
                            <span style={{ flex: 2, textAlign: 'right' }}>
                                {rs(item.unitPrice)}
                                {parseFloat(item.discount) > 0 && ` -${parseFloat(item.discount)}%`}
                            </span>
                            <span style={{ flex: 2, textAlign: 'right', fontWeight: 700 }}>
                                {rs(item.total)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <Dash />

            {/* ── Totals ── */}
            <div style={{ fontSize: 11 }}>
                <Row label="Subtotal" value={rs(bill.subtotal)} />
                {parseFloat(bill.discount) > 0 && (
                    <Row label="Discount" value={`- ${rs(bill.discount)}`} />
                )}
            </div>
            <div style={{ borderTop: '2px solid #000', marginTop: 4, paddingTop: 4 }}>
                <Row label="TOTAL" value={rs(bill.total)} bold large />
            </div>

            {bill.customer && cashPaid < parseFloat(bill.total) && (
                <div style={{ marginTop: 4, fontSize: 11 }}>
                    <Row label="Cash Paid" value={rs(cashPaid)} />
                    <Row label="Balance Due" value={rs(parseFloat(bill.total) - cashPaid)} bold />
                </div>
            )}

            {/* ── Notes ── */}
            {bill.notes && (
                <>
                    <Dash />
                    <div style={{ fontSize: 10 }}><strong>Note:</strong> {bill.notes}</div>
                </>
            )}

            <Dash />

            {/* ── Footer ── */}
            <div style={{ textAlign: 'center', fontSize: 10, lineHeight: 1.7 }}>
                <div>Thank you for your purchase!</div>
                <div>Please keep this receipt for records.</div>
            </div>

            {/* trailing space for tear-off */}
            <div style={{ height: 16 }} />
        </div>
    );
}

const emptyCart = [];

export default function SaleClient({ products, customers }) {
    const [cart, setCart] = useState(emptyCart);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [billDiscount, setBillDiscount] = useState("");
    const [cashPaid, setCashPaid] = useState("");
    const [notes, setNotes] = useState("");
    const [productSearch, setProductSearch] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [lastSavedBill, setLastSavedBill] = useState(null);

    // ── Barcode scanner ──────────────────────────────────
    const [scanCode, setScanCode] = useState("");
    const [scanStatus, setScanStatus] = useState(null); // { type, msg }
    const scanRef = useRef(null);

    const handleScan = (raw) => {
        const code = raw.trim();
        if (!code) return;
        const q = code.toLowerCase();
        const product = products.find(p =>
            (p.sku || "").toLowerCase() === q ||
            (p.barcode || "").toLowerCase() === q
        );
        setScanCode("");
        if (product) {
            handleAddProduct(product);
            setScanStatus({ type: "success", msg: `Added: ${product.name}` });
        } else {
            setScanStatus({ type: "error", msg: `No product found for "${code}"` });
        }
        setTimeout(() => setScanStatus(null), 2500);
        // keep focus so scanner can fire again immediately
        setTimeout(() => scanRef.current?.focus(), 50);
    };

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

    // Partial payment calculations (only relevant when customer is selected)
    const cashPaidAmt = selectedCustomer
        ? Math.min(Math.max(parseFloat(cashPaid) || 0, 0), total)
        : total;
    const balanceAdded = selectedCustomer ? total - cashPaidAmt : 0;

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
                    cashPaid: cashPaidAmt,
                    notes,
                }),
            });

            if (!res.ok) {
                const d = await res.json();
                throw new Error(d.error || "Failed to save sale");
            }

            const saved = await res.json();
            setLastSavedBill({ bill: saved, cashPaid: cashPaidAmt });
            setSuccessMessage(`Bill ${saved.billNumber} saved successfully!`);
            // Reset
            setCart([]);
            setSelectedCustomer(null);
            setBillDiscount("");
            setCashPaid("");
            setNotes("");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePrintReceipt = () => {
        window.print();
    };

    return (
        <Box sx={{ px: 3, pb: 4 }}>
            {/* Print styles */}
            <style>{`
                @media print {
                    @page { size: 80mm auto; margin: 0; }
                    body * { visibility: hidden !important; }
                    #sale-receipt-printable,
                    #sale-receipt-printable * { visibility: visible !important; }
                    #sale-receipt-printable {
                        display: block !important;
                        position: absolute;
                        top: 0; left: 0;
                        width: 80mm;
                        box-sizing: border-box;
                        background: white;
                    }
                }
                #sale-receipt-printable { display: none; }
            `}</style>
            <Grid container spacing={3}>

                {/* ── Left: Product search + Cart ──────────── */}
                <Grid size={{ xs: 12, lg: 8 }}>

                    {/* ── Barcode scanner input ──────────────────── */}
                    <Box sx={{ mb: 2 }}>
                        <TextField
                            inputRef={scanRef}
                            fullWidth
                            size="small"
                            placeholder="Scan barcode here — or type code and press Enter…"
                            value={scanCode}
                            onChange={(e) => setScanCode(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleScan(scanCode);
                                }
                            }}
                            autoFocus
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <ScanLine size={18} style={{ color: "#6366f1" }} />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                bgcolor: "background.paper",
                                "& .MuiOutlinedInput-root": {
                                    borderRadius: 2,
                                    "& fieldset": { borderColor: "#6366f1", borderWidth: 2 },
                                    "&:hover fieldset": { borderColor: "#6366f1" },
                                    "&.Mui-focused fieldset": { borderColor: "#6366f1" },
                                },
                            }}
                        />
                        {scanStatus && (
                            <Alert
                                severity={scanStatus.type === "success" ? "success" : "error"}
                                sx={{ mt: 1, py: 0.4, borderRadius: 2 }}
                            >
                                {scanStatus.msg}
                            </Alert>
                        )}
                    </Box>

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

                            {/* Customer balance */}
                            {selectedCustomer && (
                                <Box sx={{
                                    mt: 1.5, px: 2, py: 1.2,
                                    bgcolor: parseFloat(selectedCustomer.balance || 0) < 0 ? "error.50" : "success.50",
                                    border: "1px solid",
                                    borderColor: parseFloat(selectedCustomer.balance || 0) < 0 ? "error.200" : "success.200",
                                    borderRadius: 2,
                                    display: "flex", justifyContent: "space-between", alignItems: "center",
                                }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                        Current Balance
                                    </Typography>
                                    <Typography
                                        variant="body2" fontWeight={800}
                                        color={parseFloat(selectedCustomer.balance || 0) < 0 ? "error.main" : "success.main"}
                                    >
                                        Rs. {Math.abs(parseFloat(selectedCustomer.balance || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        {parseFloat(selectedCustomer.balance || 0) < 0 ? " (due)" : " (credit)"}
                                    </Typography>
                                </Box>
                            )}

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

                            {/* Partial Payment — only when customer is selected */}
                            {selectedCustomer && (
                                <>
                                    <Divider sx={{ my: 2.5 }} />
                                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, display: "flex", alignItems: "center", gap: 0.8 }}>
                                        <Wallet size={16} /> Payment
                                    </Typography>
                                    <TextField
                                        fullWidth size="small"
                                        label="Cash Paid Now"
                                        type="number"
                                        placeholder={total.toFixed(0)}
                                        value={cashPaid}
                                        onChange={(e) => setCashPaid(e.target.value)}
                                        InputProps={{ startAdornment: <InputAdornment position="start">Rs.</InputAdornment> }}
                                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                                        helperText="Leave blank to pay full amount. Enter less to add remaining to account balance."
                                    />
                                    {balanceAdded > 0 && (
                                        <Box sx={{ mt: 1.5, p: 1.5, bgcolor: "warning.50", border: "1px solid", borderColor: "warning.200", borderRadius: 2 }}>
                                            <Typography variant="caption" color="warning.dark" fontWeight={700} display="block">
                                                Rs. {balanceAdded.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} will be added to {selectedCustomer.name}'s balance
                                            </Typography>
                                        </Box>
                                    )}
                                </>
                            )}

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
                                {selectedCustomer && cashPaidAmt < total && (
                                    <>
                                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                            <Typography variant="body2" color="text.secondary">Cash Paid</Typography>
                                            <Typography variant="body2" fontWeight={600} color="success.main">
                                                Rs. {cashPaidAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                            <Typography variant="body2" color="warning.main" fontWeight={600}>Added to Balance</Typography>
                                            <Typography variant="body2" fontWeight={700} color="warning.main">
                                                Rs. {balanceAdded.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </Typography>
                                        </Box>
                                    </>
                                )}
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

                            {lastSavedBill && (
                                <Button
                                    fullWidth variant="outlined" color="primary" size="small"
                                    onClick={handlePrintReceipt}
                                    startIcon={<Printer size={15} />}
                                    sx={{ mt: 1, borderRadius: 2, textTransform: "none" }}
                                >
                                    Print Last Receipt
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Hidden printable receipt */}
            <div id="sale-receipt-printable">
                <SaleReceipt bill={lastSavedBill?.bill} cashPaid={lastSavedBill?.cashPaid} />
            </div>

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
