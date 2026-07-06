"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
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
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Grid,
    Snackbar,
    Alert,
    TablePagination
} from "@mui/material";
import { Plus, Search, Eye, Trash2, RotateCcw, Printer } from "lucide-react";

export default function SaleReturnsClient({ initialReturns, customers, products, banks }) {
    const [returns, setReturns] = useState(initialReturns || []);
    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [openViewDialog, setOpenViewDialog] = useState(false);
    const [selectedReturn, setSelectedReturn] = useState(null);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    // Pagination
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Alerts
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

    // Add Form State
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerSearch, setCustomerSearch] = useState("");
    const [showCustomerGrid, setShowCustomerGrid] = useState(false);
    const [customerResults, setCustomerResults] = useState([]);
    const [searchingCustomer, setSearchingCustomer] = useState(false);
    const searchTimeoutRef = useRef(null);

    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    const handleCustomerSearchChange = (query) => {
        setCustomerSearch(query);
        setShowCustomerGrid(true);
        if (!query) {
            setCustomerResults([]);
            return;
        }

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(async () => {
            setSearchingCustomer(true);
            try {
                const res = await fetch(`/api/customers?search=${encodeURIComponent(query)}&limit=15`);
                if (res.ok) {
                    const data = await res.json();
                    setCustomerResults(data.customers || []);
                }
            } catch (error) {
                console.error("Failed to search customers:", error);
            } finally {
                setSearchingCustomer(false);
            }
        }, 250);
    };

    const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentMode, setPaymentMode] = useState("CASH");
    const [selectedBankId, setSelectedBankId] = useState("");
    const [notes, setNotes] = useState("");
    const [items, setItems] = useState([
        { id: Date.now(), productId: "", quantity: 1, unitPrice: 0, totalPrice: 0 }
    ]);

    // Toast triggers
    const triggerAlert = (message, severity = "success") => {
        setSnackbar({ open: true, message, severity });
    };

    // Handle Item changes
    const handleItemChange = (id, field, value) => {
        setItems(prev => prev.map(item => {
            if (item.id === id) {
                const updated = { ...item, [field]: value };
                if (field === "productId") {
                    const prod = products.find(p => p.id === parseInt(value));
                    updated.unitPrice = prod ? prod.unitPrice : 0;
                }
                const qty = parseFloat(updated.quantity) || 0;
                const price = parseFloat(updated.unitPrice) || 0;
                updated.totalPrice = Math.round(qty * price * 100) / 100;
                return updated;
            }
            return item;
        }));
    };

    const handleAddItemRow = () => {
        setItems(prev => [...prev, { id: Date.now(), productId: "", quantity: 1, unitPrice: 0, totalPrice: 0 }]);
    };

    const handleRemoveItemRow = (id) => {
        if (items.length > 1) {
            setItems(prev => prev.filter(item => item.id !== id));
        } else {
            triggerAlert("At least one return item is required", "error");
        }
    };

    // Calculated total return value
    const grandTotal = useMemo(() => {
        return items.reduce((sum, item) => sum + (parseFloat(item.totalPrice) || 0), 0);
    }, [items]);

    // Submit handler
    const handleSubmitReturn = async () => {
        if (!selectedCustomer) {
            triggerAlert("Please select a customer", "error");
            return;
        }
        if (paymentMode === "BANK" && !selectedBankId) {
            triggerAlert("Please select a bank account", "error");
            return;
        }

        const validItems = items.filter(i => i.productId && parseFloat(i.quantity) > 0);
        if (validItems.length === 0) {
            triggerAlert("Please add at least one valid product to return", "error");
            return;
        }

        const payload = {
            customerId: selectedCustomer.id,
            returnDate,
            totalAmount: grandTotal,
            paymentMode,
            bankId: paymentMode === "BANK" ? selectedBankId : null,
            notes,
            items: validItems.map(i => ({
                productId: i.productId,
                quantity: i.quantity,
                unitPrice: i.unitPrice
            }))
        };

        try {
            const res = await fetch("/api/sale-returns", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || "Failed to submit sale return");
            }

            triggerAlert("Sale return recorded successfully!");
            setOpenAddDialog(false);

            // Refetch returns
            const refreshRes = await fetch("/api/sale-returns");
            const refreshed = await refreshRes.json();
            setReturns(refreshed);

            // Reset state
            setSelectedCustomer(null);
            setCustomerSearch("");
            setNotes("");
            setItems([{ id: Date.now(), productId: "", quantity: 1, unitPrice: 0, totalPrice: 0 }]);
            setPaymentMode("CASH");
            setSelectedBankId("");
        } catch (err) {
            triggerAlert(err.message, "error");
        }
    };

    // Filters logic
    const filteredReturns = useMemo(() => {
        return returns.filter(r => {
            const matchesQuery = r.returnNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.customer.name.toLowerCase().includes(searchQuery.toLowerCase());
            
            const rDate = new Date(r.returnDate);
            let matchesFrom = true;
            let matchesTo = true;

            if (dateFrom) {
                const start = new Date(dateFrom);
                start.setHours(0, 0, 0, 0);
                matchesFrom = rDate >= start;
            }
            if (dateTo) {
                const end = new Date(dateTo);
                end.setHours(23, 59, 59, 999);
                matchesTo = rDate <= end;
            }

            return matchesQuery && matchesFrom && matchesTo;
        });
    }, [returns, searchQuery, dateFrom, dateTo]);

    const paginatedReturns = useMemo(() => {
        const start = page * rowsPerPage;
        return filteredReturns.slice(start, start + rowsPerPage);
    }, [filteredReturns, page, rowsPerPage]);

    // Print Receipt
    const handlePrintReceipt = (ret) => {
        const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '—';
        const itemsHtml = ret.items.map(item => `
            <tr style="border-bottom: 1px dotted #ddd">
                <td style="padding: 6px 0; font-size: 10px; vertical-align: top; line-height: 1.3">
                    <strong>${item.product.name}</strong>
                    <div style="font-size: 9px; color: #666">
                        ${item.quantity} x Rs. ${parseFloat(item.unitPrice).toLocaleString()}
                    </div>
                </td>
                <td style="padding: 6px 0; font-size: 10px; vertical-align: top; text-align: center">
                    ${item.quantity}
                </td>
                <td style="padding: 6px 0; font-size: 10px; vertical-align: top; text-align: right; font-weight: bold">
                    Rs. ${parseFloat(item.totalPrice).toLocaleString()}
                </td>
            </tr>
        `).join('');

        const html = `
        <html>
        <head>
            <title>Return Receipt - ${ret.returnNumber}</title>
            <style>
                @media print {
                    body { margin: 0; padding: 10px; font-family: 'Arial', sans-serif; color: #000; width: 80mm }
                }
                body { font-family: 'Arial', sans-serif; margin: 0; padding: 20px }
            </style>
        </head>
        <body onload="window.print()">
            <div style="text-align: center; margin-bottom: 8px">
                <div style="font-size: 15px; fontWeight: 900; text-transform: uppercase">Grace Cloth and Tailors</div>
                <div style="font-size: 9px; color: #555; font-style: italic">Where Style Meets Perfection</div>
                <div style="font-size: 10px; font-weight: 600; margin-top: 2px">📞 03006284318 | 03186284318</div>
                <div style="font-size: 9px; color: #333">Basement of Faazal Plaza, Dhulyan Chowk Dinga</div>
                <div style="border-bottom: 1px dashed #000; margin: 8px 0 6px 0"></div>
                <div style="font-size: 12px; font-weight: bold; text-transform: uppercase">Sale Return Invoice</div>
                <div style="border-bottom: 1px dashed #000; margin: 6px 0 8px 0"></div>
            </div>
            <div style="font-size: 10px; line-height: 1.4; margin-bottom: 8px">
                <table style="width: 100%">
                    <tr><td>Return No:</td><td style="text-align: right">#${ret.returnNumber}</td></tr>
                    <tr><td>Return Date:</td><td style="text-align: right">${fmt(ret.returnDate)}</td></tr>
                    <tr><td>Customer:</td><td style="text-align: right; font-weight: bold">${ret.customer.name}</td></tr>
                    <tr><td>Payment Mode:</td><td style="text-align: right">${ret.paymentMode}</td></tr>
                    ${ret.bank ? `<tr><td>Bank:</td><td style="text-align: right">${ret.bank.name}</td></tr>` : ''}
                </table>
                <div style="border-bottom: 1px dashed #000; margin: 6px 0"></div>
            </div>
            <table style="width: 100%; border-collapse: collapse">
                <thead>
                    <tr style="border-bottom: 1px dashed #000">
                        <th style="text-align: left; font-size: 10px">Item</th>
                        <th style="text-align: center; font-size: 10px; width: 30px">Qty</th>
                        <th style="text-align: right; font-size: 10px; width: 70px">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>
            <div style="border-bottom: 1px dashed #000; margin: 8px 0"></div>
            <table style="width: 100%">
                <tr>
                    <td style="font-size: 11px; font-weight: bold">Refund Amount:</td>
                    <td style="font-size: 11px; font-weight: bold; text-align: right; color: #dc2626">Rs. ${parseFloat(ret.totalAmount).toLocaleString()}</td>
                </tr>
            </table>
            ${ret.notes ? `<div style="border: 1px dotted #aaa; font-size: 9px; padding: 4px; margin: 8px 0"><strong>Note:</strong> ${ret.notes}</div>` : ''}
            <div style="text-align: center; font-size: 9px; margin-top: 12px">
                <div style="border-bottom: 1px dashed #000; margin-bottom: 6px"></div>
                <div>Returns processed successfully. Thank you!</div>
            </div>
        </body>
        </html>`;

        const win = window.open('', '_blank');
        win.document.write(html);
        win.document.close();
    };

    return (
        <Box sx={{ p: 3 }}>
            {/* Filter controls */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4}>
                        <TextField
                            fullWidth
                            variant="outlined"
                            size="small"
                            placeholder="Search by Return No, Customer..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            InputProps={{
                                startAdornment: <Search size={18} style={{ marginRight: 8, color: "#666" }} />
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField
                            fullWidth
                            type="date"
                            size="small"
                            label="From"
                            InputLabelProps={{ shrink: true }}
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField
                            fullWidth
                            type="date"
                            size="small"
                            label="To"
                            InputLabelProps={{ shrink: true }}
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} sm={2} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<Plus size={18} />}
                            onClick={() => setOpenAddDialog(true)}
                            fullWidth
                        >
                            New Return
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {/* List Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead sx={{ bgcolor: "grey.100" }}>
                        <TableRow>
                            <TableCell>Return Number</TableCell>
                            <TableCell>Customer Name</TableCell>
                            <TableCell>Date</TableCell>
                            <TableCell>Payment Mode</TableCell>
                            <TableCell align="center">Returned Qty</TableCell>
                            <TableCell align="right">Refund Amount</TableCell>
                            <TableCell align="center">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginatedReturns.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center">
                                    No sale returns found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedReturns.map((ret) => {
                                const totalQty = ret.items.reduce((s, i) => s + i.quantity, 0);
                                return (
                                    <TableRow key={ret.id}>
                                        <TableCell style={{ fontWeight: 700, color: '#f59e0b' }}>#{ret.returnNumber}</TableCell>
                                        <TableCell style={{ fontWeight: 600 }}>{ret.customer.name}</TableCell>
                                        <TableCell>{new Date(ret.returnDate).toLocaleDateString('en-GB')}</TableCell>
                                        <TableCell>{ret.paymentMode}</TableCell>
                                        <TableCell align="center">{totalQty}</TableCell>
                                        <TableCell align="right" style={{ fontWeight: 700, color: '#dc2626' }}>
                                            Rs. {ret.totalAmount.toLocaleString()}
                                        </TableCell>
                                        <TableCell align="center">
                                            <IconButton color="primary" onClick={() => { setSelectedReturn(ret); setOpenViewDialog(true); }}>
                                                <Eye size={18} />
                                            </IconButton>
                                            <IconButton color="warning" onClick={() => handlePrintReceipt(ret)}>
                                                <Printer size={18} />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={filteredReturns.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={(e, newPage) => setPage(newPage)}
                    onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                />
            </TableContainer>

            {/* Dialog Add Return */}
            <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle style={{ fontWeight: 800 }}>Create New Product Sale Return</DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={3}>
                        {/* Customer Row */}
                        <Grid item xs={12} style={{ position: 'relative' }}>
                            <Typography variant="subtitle2" style={{ fontWeight: 700, marginBottom: '6px' }}>Select Customer</Typography>
                            {selectedCustomer ? (
                                <Box sx={{
                                    p: 2,
                                    border: '1px solid #e0e0e0',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    bgcolor: '#fafafa',
                                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.02)'
                                }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Box sx={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: '50%',
                                            bgcolor: 'warning.light',
                                            color: 'warning.main',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 'bold',
                                            fontSize: '1.1rem'
                                        }}>
                                            {selectedCustomer.name.charAt(0).toUpperCase()}
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle1" fontWeight="bold" sx={{ color: 'text.primary', lineHeight: 1.2 }}>
                                                {selectedCustomer.name}
                                            </Typography>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 0.5 }}>
                                                {selectedCustomer.phone && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        📞 {selectedCustomer.phone}
                                                    </Typography>
                                                )}
                                                {selectedCustomer.address && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        📍 {selectedCustomer.address}
                                                    </Typography>
                                                )}
                                                <Typography variant="caption" color="warning.main" fontWeight="bold">
                                                    💳 Bal: Rs. {parseFloat(selectedCustomer.balance || 0).toLocaleString()}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                    <Button variant="outlined" color="error" size="small" sx={{ borderRadius: '8px' }} onClick={() => { setSelectedCustomer(null); setCustomerSearch(""); setCustomerResults([]); }}>Change</Button>
                                </Box>
                            ) : (
                                <>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        placeholder="Type customer name, phone, measurement number..."
                                        value={customerSearch}
                                        onChange={(e) => handleCustomerSearchChange(e.target.value)}
                                        onFocus={() => setShowCustomerGrid(true)}
                                        InputProps={{
                                            startAdornment: <Search size={18} style={{ marginRight: 8, color: "#999" }} />
                                        }}
                                    />
                                    {showCustomerGrid && (customerSearch || searchingCustomer) && (
                                        <Paper style={{
                                            position: 'absolute',
                                            left: 24,
                                            right: 24,
                                            zIndex: 1500,
                                            maxHeight: '220px',
                                            overflowY: 'auto',
                                            border: '1px solid #e0e0e0',
                                            borderRadius: '8px',
                                            boxShadow: '0 8px 16px rgba(0,0,0,0.08)',
                                            backgroundColor: '#fff'
                                        }}>
                                            {searchingCustomer ? (
                                                <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary', fontSize: '0.85rem' }}>
                                                    Searching customers...
                                                </Box>
                                            ) : customerResults.length === 0 ? (
                                                <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary', fontSize: '0.85rem' }}>
                                                    No customers found.
                                                </Box>
                                            ) : (
                                                <Table size="small">
                                                    <TableBody>
                                                        {customerResults.map(c => (
                                                            <TableRow 
                                                                key={c.id} 
                                                                hover 
                                                                style={{ cursor: 'pointer' }}
                                                                onClick={() => {
                                                                    setSelectedCustomer(c);
                                                                    setShowCustomerGrid(false);
                                                                }}
                                                            >
                                                                <TableCell sx={{ py: 1 }}><strong>{c.name}</strong></TableCell>
                                                                <TableCell sx={{ py: 1 }}>{c.phone || "—"}</TableCell>
                                                                <TableCell sx={{ py: 1 }}>M# {c.measurementNo || "—"}</TableCell>
                                                                <TableCell sx={{ py: 1 }} align="right">Rs. {parseFloat(c.balance || 0).toLocaleString()}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            )}
                                        </Paper>
                                    )}
                                </>
                            )}
                        </Grid>

                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                type="date"
                                size="small"
                                label="Return Date"
                                InputLabelProps={{ shrink: true }}
                                value={returnDate}
                                onChange={(e) => setReturnDate(e.target.value)}
                            />
                        </Grid>

                        <Grid item xs={12} sm={4}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Payment Mode</InputLabel>
                                <Select
                                    label="Payment Mode"
                                    value={paymentMode}
                                    onChange={(e) => setPaymentMode(e.target.value)}
                                >
                                    <MenuItem value="CASH">Cash Refund</MenuItem>
                                    <MenuItem value="BANK">Bank Transfer Refund</MenuItem>
                                    <MenuItem value="LEDGER">Adjust Customer Balance</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        {paymentMode === "BANK" && (
                            <Grid item xs={12} sm={4}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Refund Bank</InputLabel>
                                    <Select
                                        label="Refund Bank"
                                        value={selectedBankId}
                                        onChange={(e) => setSelectedBankId(e.target.value)}
                                    >
                                        {banks.map(b => (
                                            <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        )}

                        {/* Items Section */}
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="subtitle2" style={{ fontWeight: 700 }}>Returned Products</Typography>
                                <Button variant="outlined" size="small" startIcon={<Plus size={16} />} onClick={handleAddItemRow}>Add Product</Button>
                            </Box>

                            {items.map((item, idx) => (
                                <Grid container spacing={2} key={item.id} alignItems="center" sx={{ mb: 1.5 }}>
                                    <Grid item xs={12} sm={6}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Product</InputLabel>
                                            <Select
                                                label="Product"
                                                value={item.productId}
                                                onChange={(e) => handleItemChange(item.id, "productId", e.target.value)}
                                            >
                                                {products.map(p => (
                                                    <MenuItem key={p.id} value={p.id}>{p.name} (SKU: {p.sku})</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} sm={1.5}>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            label="Qty"
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => handleItemChange(item.id, "quantity", e.target.value)}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={2}>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            label="Unit Price"
                                            type="number"
                                            value={item.unitPrice}
                                            onChange={(e) => handleItemChange(item.id, "unitPrice", e.target.value)}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={2.5} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                                        <Typography variant="body2" style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                                            Rs. {item.totalPrice.toLocaleString()}
                                        </Typography>
                                        {items.length > 1 && (
                                            <IconButton color="error" size="small" onClick={() => handleRemoveItemRow(item.id)}>
                                                <Trash2 size={16} />
                                            </IconButton>
                                        )}
                                    </Grid>
                                </Grid>
                            ))}
                        </Grid>

                        <Grid item xs={12} sm={8}>
                            <TextField
                                fullWidth
                                multiline
                                rows={2}
                                label="Notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </Grid>

                        <Grid item xs={12} sm={4}>
                            <Box sx={{
                                p: 1.5,
                                borderRadius: '12px',
                                bgcolor: '#fff5f5',
                                border: '1px solid #fee2e2',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '100%',
                                minHeight: '65px'
                            }}>
                                <Typography variant="caption" fontWeight="bold" sx={{ color: 'error.main', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    Refund Total
                                </Typography>
                                <Typography variant="h5" fontWeight="bold" sx={{ color: 'error.main', mt: 0.5 }}>
                                    Rs. {grandTotal.toLocaleString()}
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenAddDialog(false)} color="secondary">Cancel</Button>
                    <Button onClick={handleSubmitReturn} color="primary" variant="contained">Submit Return</Button>
                </DialogActions>
            </Dialog>

            {/* Dialog View Return details */}
            <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="sm" fullWidth>
                {selectedReturn && (
                    <>
                        <DialogTitle style={{ fontWeight: 800 }}>Sale Return Details</DialogTitle>
                        <DialogContent dividers>
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="caption" color="textSecondary" display="block">Return ID / Number</Typography>
                                <Typography variant="body1" fontWeight="bold">#{selectedReturn.returnNumber}</Typography>
                            </Box>
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="caption" color="textSecondary" display="block">Customer Name</Typography>
                                <Typography variant="body1" fontWeight="bold">{selectedReturn.customer.name}</Typography>
                            </Box>
                            <Grid container spacing={2} sx={{ mb: 2 }}>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="textSecondary" display="block">Date</Typography>
                                    <Typography variant="body1">{new Date(selectedReturn.returnDate).toLocaleDateString('en-GB')}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="textSecondary" display="block">Payment Mode</Typography>
                                    <Typography variant="body1">{selectedReturn.paymentMode} {selectedReturn.bank ? `(${selectedReturn.bank.name})` : ""}</Typography>
                                </Grid>
                            </Grid>

                            <Typography variant="subtitle2" style={{ fontWeight: 800, marginBottom: '6px' }}>Returned Products</Typography>
                            <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                                <Table size="small">
                                    <TableHead sx={{ bgcolor: 'grey.50' }}>
                                        <TableRow>
                                            <TableCell>Product</TableCell>
                                            <TableCell align="center">Qty</TableCell>
                                            <TableCell align="right">Price</TableCell>
                                            <TableCell align="right">Total</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {selectedReturn.items.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell>{item.product.name}</TableCell>
                                                <TableCell align="center">{item.quantity}</TableCell>
                                                <TableCell align="right">Rs. {parseFloat(item.unitPrice).toLocaleString()}</TableCell>
                                                <TableCell align="right" style={{ fontWeight: 700 }}>Rs. {parseFloat(item.totalPrice).toLocaleString()}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            <Box sx={{ mb: 2, textAlign: 'right' }}>
                                <Typography variant="caption" color="textSecondary" display="block">Refund Total</Typography>
                                <Typography variant="h6" fontWeight="bold" color="error.main">Rs. {selectedReturn.totalAmount.toLocaleString()}</Typography>
                            </Box>

                            {selectedReturn.notes && (
                                <Box sx={{ p: 1.5, border: '1px dotted #ccc', borderRadius: 2, bgcolor: 'grey.50' }}>
                                    <Typography variant="caption" color="textSecondary" display="block">Notes</Typography>
                                    <Typography variant="body2">{selectedReturn.notes}</Typography>
                                </Box>
                            )}
                        </DialogContent>
                        <DialogActions>
                            <Button startIcon={<Printer />} variant="outlined" color="primary" onClick={() => handlePrintReceipt(selectedReturn)}>Print Receipt</Button>
                            <Button onClick={() => setOpenViewDialog(false)} color="secondary">Close</Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* Notification Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            >
                <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
