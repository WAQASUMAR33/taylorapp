"use client";

import React, { useState } from "react";
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
    Avatar,
    Box,
    Typography,
    TextField,
    Grid,
    CircularProgress,
    Alert,
    Snackbar,
    MenuItem,
    Chip,
    Card,
    Divider,
    InputAdornment,
    Tooltip,
    Autocomplete,
    Radio,
    RadioGroup,
    FormControlLabel,
    FormControl,
    Checkbox,
    GlobalStyles
} from "@mui/material";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import {
    Trash2,
    Plus,
    ShoppingCart,
    Calendar,
    User,
    Search,
    Save,
    X as XIcon,
    Eye,
    Printer,
    BookText,
    Ruler,
    MessageCircle
} from "lucide-react";

const BOOKING_STATUSES = [
    { value: "PENDING", label: "Pending", color: "#f59e0b" },
    { value: "MEASUREMENT_TAKEN", label: "Measurement Taken", color: "#3b82f6" },
    { value: "CUTTING", label: "Cutting", color: "#8b5cf6" },
    { value: "STITCHING", label: "Stitching", color: "#ec4899" },
    { value: "TRIAL", label: "Trial", color: "#06b6d4" },
    { value: "READY", label: "Ready", color: "#10b981" },
    { value: "DELIVERED", label: "Delivered", color: "#059669" },
    { value: "CANCELLED", label: "Cancelled", color: "#ef4444" }
];

export default function BookingManagementClient({ initialBookings, customers, products, employees }) {
    const [bookings, setBookings] = useState(initialBookings);
    const [searchQuery, setSearchQuery] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    // View Modal State
    const [viewOpen, setViewOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [printBooking, setPrintBooking] = useState(null);
    const [printType, setPrintType] = useState("BILL"); // 'BILL' or 'STITCHING'
    const [printDialogOpen, setPrintDialogOpen] = useState(false);
    const [customerMeasurements, setCustomerMeasurements] = useState(null);
    const [tempPrintBooking, setTempPrintBooking] = useState(null);

    // Effect to trigger print when printBooking is set
    React.useEffect(() => {
        if (printBooking) {
            // Short timeout to ensure DOM update
            const timer = setTimeout(() => {
                window.print();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [printBooking]);

    // Fetch measurements when needed
    const fetchMeasurements = async (customerId) => {
        try {
            const res = await fetch(`/api/measurements?customerId=${customerId}`);
            if (res.ok) {
                const data = await res.json();
                // Get the most recent measurement
                setCustomerMeasurements(data.length > 0 ? data[0] : null);
            }
        } catch (error) {
            console.error("Failed to fetch measurements", error);
        }
    };

    const handlePrintClick = (booking) => {
        setTempPrintBooking(booking);
        setPrintDialogOpen(true);
    };

    const handlePrintConfirm = async (type) => {
        setPrintType(type);
        setPrintDialogOpen(false);

        if (type === 'STITCHING' && tempPrintBooking?.customerId) {
            await fetchMeasurements(tempPrintBooking.customerId);
        }

        setPrintBooking(tempPrintBooking);
    };


    // Form data
    const [formData, setFormData] = useState({
        customerId: "",
        customerCode: "",
        customerName: "",
        customerAddress: "",
        customerPhone: "",
        bookingType: "STITCHING",
        bookingDate: new Date().toISOString().split('T')[0],
        returnDate: "",
        deliveryDate: "",
        trialDate: "",
        tailorId: "",
        cutterId: "",
        advanceAmount: "",
        notes: ""
    });

    // Cart items for the grid
    const [cartItems, setCartItems] = useState([
        {
            quantity: "", unitPrice: "", discount: "", totalPrice: 0,
            bookingType: "", // No default selection
            // Per-Item Stitching Details
            isStitching: false,
            cuffType: "",
            pohnchaType: "",
            gheraType: "",
            galaType: "",
            galaSize: "",
            pocketType: "",
            shalwarType: "",
            hasShalwarPocket: false,
            hasFrontPockets: false
        }
    ]);

    // Store previous stitching details for reuse
    const [previousStitchingDetails, setPreviousStitchingDetails] = useState(null);


    // Filter employees by role
    const tailors = (employees || []).filter(e => e.role === "Tailor");
    const cutters = (employees || []).filter(e => e.role === "Cutter");

    const handleCustomerChange = (customerId) => {
        const customer = (customers || []).find(c => c.id === parseInt(customerId));
        if (customer) {
            setFormData(prev => ({
                ...prev,
                customerId: customer.id,
                customerCode: customer.code || "",
                customerName: customer.name,
                customerAddress: customer.address || "",
                customerPhone: customer.phone || ""
            }));
        }
    };

    const handleProductChange = (index, productId) => {
        const product = (products || []).find(p => p.id === parseInt(productId));
        if (product) {
            const newItems = [...cartItems];

            // Auto-select bookingType based on product category
            // Category "Suit" -> needs stitching (STITCHING enum displays breakdown)
            // Category "Stitched" -> readymade (SUIT enum hides breakdown)
            let bookingType = "SUIT";
            if (product.category?.name?.toLowerCase().includes("suit")) {
                bookingType = "STITCHING";
            }

            newItems[index] = {
                ...newItems[index],
                productId: product.id,
                productName: product.name,
                unitPrice: parseFloat(product.unitPrice || 0),
                quantity: newItems[index].quantity || 1,
                discount: newItems[index].discount || 0,
                totalPrice: ((newItems[index].quantity || 1) * parseFloat(product.unitPrice || 0)) - (parseFloat(newItems[index].discount) || 0),
                bookingType: bookingType,
                isStitching: bookingType === 'STITCHING',
                isCollapsed: bookingType === 'SUIT', // Auto-collapse for readymade
            };
            setCartItems(newItems);
        }
    };

    const handleQuantityChange = (index, quantity) => {
        const newItems = [...cartItems];
        const qty = parseFloat(quantity) || 0;
        const price = parseFloat(newItems[index].unitPrice) || 0;
        const discount = parseFloat(newItems[index].discount) || 0;
        newItems[index].quantity = qty;
        newItems[index].totalPrice = (qty * price) - discount;
        setCartItems(newItems);
    };

    const handleDiscountChange = (index, discount) => {
        const newItems = [...cartItems];
        const qty = parseFloat(newItems[index].quantity) || 0;
        const price = parseFloat(newItems[index].unitPrice) || 0;
        const disc = parseFloat(discount) || 0;
        newItems[index].discount = disc;
        newItems[index].totalPrice = (qty * price) - disc;
        setCartItems(newItems);
    };

    const calculateItemTotal = (item) => {
        const qty = parseFloat(item.quantity) || 0;
        const price = parseFloat(item.unitPrice) || 0;
        const disc = parseFloat(item.discount) || 0;
        return (qty * price) - disc;
    };

    const handleAddRow = () => {
        const lastItem = cartItems[cartItems.length - 1];
        const newId = cartItems.length > 0 ? Math.max(...cartItems.map(i => i.id)) + 1 : 1;

        let newStitchingDetails = {
            isStitching: false,
            cuffType: "",
            pohnchaType: "",
            gheraType: "",
            galaType: "",
            galaSize: "",
            pocketType: "",
            shalwarType: "",
            hasShalwarPocket: false,
            hasFrontPockets: false
        };

        setCartItems([
            ...cartItems,
            {
                id: newId,
                productId: "",
                productName: "",
                quantity: 1,
                unitPrice: 0,
                discount: 0,
                totalPrice: 0,
                bookingType: "", // No default
                isStitching: false,
                isCollapsed: true,
                ...newStitchingDetails,
            }
        ]);
    };

    const handleRemoveRow = (index) => {
        if (cartItems.length > 1) {
            setCartItems(cartItems.filter((_, i) => i !== index));
        }
    };


    const totalAmount = cartItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    const advanceAmount = parseFloat(formData.advanceAmount) || 0;
    const balanceAmount = totalAmount - advanceAmount;

    const handleSubmit = async () => {
        setLoading(true);
        setError("");

        const validItems = cartItems.filter(item => item.productId && item.quantity > 0);

        if (!formData.customerId) {
            setError("Please select a customer");
            setLoading(false);
            return;
        }

        if (validItems.length === 0) {
            setError("Please add at least one product");
            setLoading(false);
            return;
        }

        try {
            const payload = {
                customerId: formData.customerId,
                bookingType: formData.bookingType,
                bookingDate: formData.bookingDate,
                returnDate: formData.returnDate || null,
                deliveryDate: formData.deliveryDate || null,
                trialDate: formData.trialDate || null,
                tailorId: formData.bookingType === 'STITCHING' ? (formData.tailorId || null) : null,
                cutterId: formData.bookingType === 'STITCHING' ? (formData.cutterId || null) : null,
                totalAmount,
                advanceAmount,
                remainingAmount: balanceAmount,
                notes: formData.notes,
                items: validItems.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    discount: item.discount,
                    totalPrice: item.totalPrice,
                    // Per-Item Stitching Details
                    cuffType: item.cuffType,
                    pohnchaType: item.pohnchaType,
                    gheraType: item.gheraType,
                    galaType: item.galaType,
                    galaSize: item.galaSize,
                    pocketType: item.pocketType,
                    shalwarType: item.shalwarType,
                    hasShalwarPocket: item.hasShalwarPocket,
                    hasFrontPockets: item.hasFrontPockets
                }))
            };

            const response = await fetch("/api/bookings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to create booking");
            }

            const refreshRes = await fetch("/api/bookings");
            const refreshed = await refreshRes.json();
            setBookings(refreshed);

            setSuccessMessage("Booking created successfully!");
            setShowForm(false);
            resetForm();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            customerId: "",
            customerCode: "",
            customerName: "",
            customerAddress: "",
            customerPhone: "",
            bookingType: "STITCHING",
            bookingDate: new Date().toISOString().split('T')[0],
            returnDate: "",
            deliveryDate: "",
            trialDate: "",
            tailorId: "",
            cutterId: "",
            advanceAmount: "",
            notes: "",
            // Stitching Details
            cuffType: "",
            pohnchaType: "",
            gheraType: "",
            galaType: "",
            galaSize: "",
            pocketType: "",
            shalwarType: "",
            hasShalwarPocket: false,
            hasFrontPockets: false
        });
        setCartItems([
            { id: 1, productId: "", productName: "", quantity: "", unitPrice: "", discount: "", totalPrice: 0, bookingType: "STITCHING", isStitching: true, isCollapsed: false }
        ]);
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this booking?")) return;

        try {
            const response = await fetch(`/api/bookings?id=${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to delete");
            }

            setBookings(prev => prev.filter(b => b.id !== id));
            setSuccessMessage("Booking deleted successfully!");
        } catch (err) {
            alert(err.message);
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            const response = await fetch("/api/bookings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, status: newStatus }),
            });

            if (!response.ok) {
                throw new Error("Failed to update status");
            }

            const refreshRes = await fetch("/api/bookings");
            const refreshed = await refreshRes.json();
            setBookings(refreshed);

            setSuccessMessage("Status updated successfully!");
        } catch (err) {
            alert(err.message);
        }
    };

    const handleViewBooking = (booking) => {
        setSelectedBooking(booking);
        setViewOpen(true);
    };

    const filteredBookings = (bookings || []).filter(b =>
        (b.customer?.name || "").toLowerCase().includes((searchQuery || "").toLowerCase()) ||
        (b.customer?.phone || "").toLowerCase().includes((searchQuery || "").toLowerCase()) ||
        (b.customer?.address || "").toLowerCase().includes((searchQuery || "").toLowerCase()) ||
        (b.id || "").toString().includes(searchQuery || "") ||
        (b.bookingNumber || "").toLowerCase().includes((searchQuery || "").toLowerCase())
    );

    const getStatusColor = (status) => {
        const statusObj = BOOKING_STATUSES.find(s => s.value === status);
        return statusObj?.color || "#6b7280";
    };

    // --- replaced full-page form with Dialog below ---
    const FIELD_SX = {
        '& .MuiOutlinedInput-root': {
            bgcolor: 'white',
            borderRadius: 2,
            '& fieldset': { borderColor: '#e5e7eb' },
            '&:hover fieldset': { borderColor: '#3b82f6' },
            '&.Mui-focused fieldset': { borderColor: '#3b82f6', borderWidth: 2 },
        }
    };
    const DISABLED_SX = { '& .MuiOutlinedInput-root': { bgcolor: '#f3f4f6', borderRadius: 2 } };

    const formDialog = (
        <Dialog
            open={showForm}
            onClose={() => !loading && setShowForm(false)}
            maxWidth="xl"
            fullWidth
            PaperProps={{ sx: { borderRadius: 3, maxHeight: '95vh' } }}
        >
            <DialogTitle sx={{
                fontWeight: 700, borderBottom: '1px solid', borderColor: 'divider', pt: 2, pb: 1.5,
            }}>
                <Typography variant="h6" fontWeight={700} color="text.primary">Booking Management</Typography>
            </DialogTitle>
            <DialogContent sx={{ p: 3, mt: 1 }}>
                {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

                <Box>
                    {/* ── Row 1: 4 equal header fields ── */}
                    <Grid container spacing={2} sx={{ mb: 2, mt: 1 }}>
                        <Grid item xs={6} md={3}>
                            <TextField fullWidth size="small" label="Serial Number" value="Auto Generated" disabled sx={DISABLED_SX} />
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <TextField fullWidth size="small" label="Booking Date" type="date" name="bookingDate" required
                                value={formData.bookingDate}
                                onChange={(e) => setFormData({ ...formData, bookingDate: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                                InputProps={{ startAdornment: <InputAdornment position="start"><Calendar size={16} color="#9ca3af" /></InputAdornment> }}
                                sx={FIELD_SX} />
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <TextField fullWidth size="small" label="Order Reference" value="Auto" disabled sx={DISABLED_SX} />
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <TextField fullWidth size="small" label="Delivery Date" type="date" name="deliveryDate" required
                                value={formData.deliveryDate}
                                onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                                InputProps={{ startAdornment: <InputAdornment position="start"><Calendar size={16} color="#9ca3af" /></InputAdornment> }}
                                sx={FIELD_SX} />
                        </Grid>
                    </Grid>

                    {/* ── Customer Information Card (full-width) ── */}
                    <Card variant="outlined" sx={{ mb: 2, borderRadius: 2, border: '1px solid #e5e7eb', overflow: 'visible' }}>
                        <Box sx={{ px: 2.5, pt: 2, pb: 0.5, display: 'flex', alignItems: 'center', gap: 1.5, borderLeft: '4px solid #3b82f6' }}>
                            <User size={16} color="#3b82f6" />
                            <Typography variant="subtitle2" fontWeight={700} color="#1f2937">Customer Information</Typography>
                        </Box>
                        <Box sx={{ p: 2 }}>
                            <Grid container spacing={2}>
                                {/* Customer autocomplete — full width */}
                                <Grid item xs={12}>
                                    <Autocomplete
                                        options={(customers || []).filter(c => c.name?.toLowerCase() !== 'cash account')}
                                        getOptionLabel={(option) => option.name || ""}
                                        value={(customers || []).find(c => c.id === formData.customerId) || null}
                                        onChange={(event, newValue) => { handleCustomerChange(newValue ? newValue.id : ""); }}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="Select Customer"
                                                size="small"
                                                fullWidth
                                                required
                                                sx={{ minWidth: 300, ...FIELD_SX }}
                                            />
                                        )}
                                    />
                                </Grid>
                                {/* Name */}
                                <Grid item xs={12} sm={4}>
                                    <TextField fullWidth size="small" label="Name" value={formData.customerName}
                                        disabled placeholder="Auto-filled" sx={DISABLED_SX} />
                                </Grid>
                                {/* Phone */}
                                <Grid item xs={12} sm={4}>
                                    <TextField fullWidth size="small" label="Phone Number" value={formData.customerPhone}
                                        disabled placeholder="+92 300 1234567"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Typography sx={{ fontSize: '0.9rem', lineHeight: 1 }}>🇵🇰</Typography>
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={DISABLED_SX} />
                                </Grid>
                                {/* Address */}
                                <Grid item xs={12} sm={4}>
                                    <TextField fullWidth size="small" label="Address" value={formData.customerAddress}
                                        disabled placeholder="Auto-filled" sx={DISABLED_SX} />
                                </Grid>
                            </Grid>
                        </Box>
                    </Card>

                    {/* ── Items Table ── */}
                    <Box sx={{ mb: 2 }}>
                        <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1.5, borderLeft: '4px solid #3b82f6', pl: 1.5 }}>
                            <Typography variant="subtitle2" fontWeight={700} color="#1f2937">Order Items</Typography>
                        </Box>
                        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#f3f4f6' }}>
                                        <TableCell sx={{ fontWeight: 700, color: '#374151', width: 40 }}>#</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: '#374151' }}>Product</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: '#374151', width: 90 }}>Qty</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: '#374151', width: 110 }}>Rate</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: '#374151', width: 110 }}>Discount</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: '#374151', width: 100 }}>Total</TableCell>
                                        <TableCell sx={{ width: 40 }} />
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {cartItems.map((item, index) => (
                                        <React.Fragment key={index}>
                                            <TableRow sx={{ '&:hover': { bgcolor: '#f9fafb' }, transition: 'background-color 0.15s', '& td, & th': { borderBottom: item.bookingType === 'STITCHING' && !item.isCollapsed ? 'none' : undefined } }}>
                                                <TableCell sx={{ color: '#6b7280', fontWeight: 600 }}>{index + 1}</TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                        <Autocomplete
                                                            options={products || []}
                                                            getOptionLabel={(option) => option.name || ""}
                                                            value={(products || []).find(p => p.id === item.productId) || null}
                                                            onChange={(event, newValue) => { handleProductChange(index, newValue ? newValue.id : ""); }}
                                                            sx={{ flexGrow: 1 }}
                                                            renderInput={(params) => (
                                                                <TextField {...params} label="Select Product" size="small" required fullWidth sx={FIELD_SX} />
                                                            )}
                                                        />
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Chip size="small"
                                                                label={item.bookingType === 'STITCHING' ? 'Suit (Stitching)' : 'Stitched (Readymade)'}
                                                                variant="outlined"
                                                                sx={{ fontSize: '0.68rem', height: 18, color: item.bookingType === 'STITCHING' ? '#475569' : '#6b7280', borderColor: item.bookingType === 'STITCHING' ? '#94a3b8' : '#e5e7eb', bgcolor: item.bookingType === 'STITCHING' ? '#f1f5f9' : '#f9fafb' }}
                                                            />
                                                        </Box>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <TextField size="small" required value={item.quantity} onFocus={(e) => e.target.select()}
                                                        onChange={(e) => { const val = e.target.value; if (val === '' || /^\d*\.?\d*$/.test(val)) { handleQuantityChange(index, val); } }}
                                                        sx={{ width: '80px', ...FIELD_SX }} />
                                                </TableCell>
                                                <TableCell>
                                                    <TextField size="small" required value={item.unitPrice} onFocus={(e) => e.target.select()}
                                                        onChange={(e) => { const val = e.target.value; if (val === '' || /^\d*\.?\d*$/.test(val)) { const ni = [...cartItems]; ni[index].unitPrice = val; ni[index].totalPrice = calculateItemTotal(ni[index]); setCartItems(ni); } }}
                                                        sx={{ width: '100px', ...FIELD_SX }} />
                                                </TableCell>
                                                <TableCell>
                                                    <TextField size="small" value={item.discount} onFocus={(e) => e.target.select()}
                                                        onChange={(e) => { const val = e.target.value; if (val === '' || /^\d*\.?\d*$/.test(val)) { const ni = [...cartItems]; ni[index].discount = val; ni[index].totalPrice = calculateItemTotal(ni[index]); setCartItems(ni); } }}
                                                        sx={{ width: '90px', ...FIELD_SX }} />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#1f2937' }}>
                                                        {(parseFloat(item.totalPrice) || 0).toFixed(0)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Tooltip title="Remove item">
                                                        <span>
                                                            <IconButton size="small" color="error" onClick={() => handleRemoveRow(index)} disabled={cartItems.length === 1}>
                                                                <Trash2 size={15} />
                                                            </IconButton>
                                                        </span>
                                                    </Tooltip>
                                                </TableCell>
                                            </TableRow>
                                            {item.bookingType === 'STITCHING' && (
                                                <TableRow>
                                                    <TableCell colSpan={7} sx={{ pb: 3, pt: 0, borderBottom: '1px solid rgba(224, 224, 224, 1)' }}>
                                                        {item.isCollapsed ? (
                                                            <Box sx={{ mt: 1.5, p: 2, borderRadius: 2, border: '1px solid #e5e7eb', bgcolor: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                                <Typography variant="body2" color="textSecondary"><strong>Stitching Details Saved</strong> for {item.productName || "Product"}</Typography>
                                                                <Button size="small" onClick={() => { const ni = [...cartItems]; ni[index].isCollapsed = false; setCartItems(ni); }} sx={{ color: '#3b82f6', textTransform: 'none' }}>Edit</Button>
                                                            </Box>
                                                        ) : (
                                                            <Box sx={{ mt: 1.5, p: 2, borderRadius: 2, border: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
                                                                {index > 0 && previousStitchingDetails && (
                                                                    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                                                        <Button size="small" variant="outlined"
                                                                            onClick={() => { const ni = [...cartItems]; ni[index] = { ...ni[index], ...previousStitchingDetails }; setCartItems(ni); }}
                                                                            sx={{ borderColor: '#3b82f6', color: '#3b82f6', textTransform: 'none', '&:hover': { borderColor: '#2563eb', bgcolor: '#eff6ff' } }}>
                                                                            Use Previous Details
                                                                        </Button>
                                                                    </Box>
                                                                )}
                                                                <Grid container spacing={2}>
                                                                    {[
                                                                        { label: 'کف (Cuff)', field: 'cuffType', opts: [{ value: 'single', label: 'سنگل' }, { value: 'double folding', label: 'ڈبل فولڈنگ' }, { value: 'open sleeve', label: 'کھلی آستین' }] },
                                                                        { label: 'پونچہ (Pohncha)', field: 'pohnchaType', opts: [{ value: 'jaali', label: 'جالی کے ساتھ' }, { value: 'karhaai', label: 'کڑھائی' }, { value: 'jaali_karhaai', label: 'جالی + کڑھائی' }, { value: 'saada', label: 'سادہ' }] },
                                                                        { label: 'گھیرا (Ghera)', field: 'gheraType', opts: [{ value: 'seedha', label: 'سیدھا' }, { value: 'gol', label: 'گول' }] },
                                                                        { label: 'گلا (Gala)', field: 'galaType', opts: [{ value: 'ban', label: 'بن' }, { value: 'collar', label: 'کالر' }] },
                                                                        { label: 'جیب (Pocket)', field: 'pocketType', opts: [{ value: 'single', label: 'سنگل' }, { value: 'double', label: 'ڈبل' }] },
                                                                        { label: 'شلوار کی قسم', field: 'shalwarType', opts: [{ value: 'pajama', label: 'پاجامہ' }, { value: 'shalwar', label: 'شلوار' }, { value: 'trouser', label: 'ٹراؤزر' }] },
                                                                    ].map(({ label, field, opts }) => (
                                                                        <Grid item xs={12} sm={6} key={field}>
                                                                            <Autocomplete
                                                                                options={opts}
                                                                                getOptionLabel={(o) => o.label || ""}
                                                                                value={opts.find(o => o.value === item[field]) || null}
                                                                                onChange={(_, nv) => { const ni = [...cartItems]; ni[index][field] = nv ? nv.value : ""; setCartItems(ni); }}
                                                                                renderInput={(params) => (
                                                                                    <TextField {...params} label={label} size="small" required
                                                                                        sx={{ minWidth: 300, '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 2 } }} />
                                                                                )}
                                                                            />
                                                                        </Grid>
                                                                    ))}
                                                                    {item.galaType && (
                                                                        <Grid item xs={12} sm={6}>
                                                                            <Autocomplete
                                                                                options={[13.5, 14, 14.5, 15, 15.5, 16, 16.5, 17, 17.5, 18, 18.5, 19, 19.5].map(s => s.toString())}
                                                                                value={item.galaSize || null}
                                                                                onChange={(_, nv) => { const ni = [...cartItems]; ni[index].galaSize = nv || ""; setCartItems(ni); }}
                                                                                renderInput={(params) => (
                                                                                    <TextField {...params} label="گلے کا سائز" size="small" required
                                                                                        sx={{ minWidth: 300, '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 2 } }} />
                                                                                )}
                                                                            />
                                                                        </Grid>
                                                                    )}
                                                                    <Grid item xs={12} sm={6}>
                                                                        <Box sx={{ display: 'flex', gap: 2, height: '100%', alignItems: 'center' }}>
                                                                            <FormControlLabel control={<Checkbox size="small" checked={item.hasShalwarPocket} onChange={(e) => { const ni = [...cartItems]; ni[index].hasShalwarPocket = e.target.checked; setCartItems(ni); }} />}
                                                                                label={<Typography variant="caption" fontWeight={600}>شلوار جیب</Typography>} sx={{ m: 0 }} />
                                                                            <FormControlLabel control={<Checkbox size="small" checked={item.hasFrontPockets} onChange={(e) => { const ni = [...cartItems]; ni[index].hasFrontPockets = e.target.checked; setCartItems(ni); }} />}
                                                                                label={<Typography variant="caption" fontWeight={600}>سامنے جیب</Typography>} sx={{ m: 0 }} />
                                                                        </Box>
                                                                    </Grid>
                                                                    <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                                        <Button variant="contained" size="small" startIcon={<Save size={14} />}
                                                                            onClick={() => {
                                                                                const ni = [...cartItems];
                                                                                ni[index].isCollapsed = true;
                                                                                setCartItems(ni);
                                                                                setPreviousStitchingDetails({ cuffType: ni[index].cuffType, pohnchaType: ni[index].pohnchaType, gheraType: ni[index].gheraType, galaType: ni[index].galaType, galaSize: ni[index].galaSize, pocketType: ni[index].pocketType, shalwarType: ni[index].shalwarType, hasShalwarPocket: ni[index].hasShalwarPocket, hasFrontPockets: ni[index].hasFrontPockets });
                                                                            }}
                                                                            sx={{ bgcolor: '#3b82f6', textTransform: 'none', '&:hover': { bgcolor: '#2563eb' } }}>
                                                                            Save Details
                                                                        </Button>
                                                                    </Grid>
                                                                </Grid>
                                                            </Box>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <Button startIcon={<Plus size={15} />} onClick={handleAddRow} size="small"
                            sx={{ mt: 1, textTransform: 'none', color: '#3b82f6', fontWeight: 600 }}>
                            Add New Item
                        </Button>
                    </Box>

                    {/* ── Tailor & Cutter ── */}
                    <Card variant="outlined" sx={{ mb: 2, borderRadius: 2, border: '1px solid #e5e7eb' }}>
                        <Box sx={{ p: 2 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Autocomplete
                                        options={tailors || []}
                                        getOptionLabel={(option) => option.name || ""}
                                        value={(tailors || []).find(t => t.id === formData.tailorId) || null}
                                        onChange={(event, newValue) => { setFormData({ ...formData, tailorId: newValue ? newValue.id : "" }); }}
                                        renderInput={(params) => (
                                            <TextField {...params} label="Tailor" size="small" fullWidth required sx={{ minWidth: 400, ...FIELD_SX }} />
                                        )}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Autocomplete
                                        options={cutters || []}
                                        getOptionLabel={(option) => option.name || ""}
                                        value={(cutters || []).find(c => c.id === formData.cutterId) || null}
                                        onChange={(event, newValue) => { setFormData({ ...formData, cutterId: newValue ? newValue.id : "" }); }}
                                        renderInput={(params) => (
                                            <TextField {...params} label="Cutter" size="small" fullWidth required sx={{ minWidth: 400, ...FIELD_SX }} />
                                        )}
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                    </Card>

                    {/* ── Notes (full width) ── */}
                    <Box sx={{ mb: 2 }}>
                        <TextField fullWidth size="small" label="Remarks / Notes" name="notes"
                            multiline rows={3} value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            sx={FIELD_SX} />
                    </Box>

                    {/* ── Totals (full width) ── */}
                    <Card variant="outlined" sx={{ p: 2, bgcolor: '#f0fdf4', borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, pb: 1.5, borderBottom: '1px solid #d1fae5' }}>
                            <Typography variant="body2" fontWeight={600} color="text.secondary">Total Amount</Typography>
                            <Typography variant="h6" fontWeight={800} color="#059669">Rs.&nbsp;{totalAmount.toFixed(0)}</Typography>
                        </Box>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth size="small" label="Advance Amount" required
                                    value={formData.advanceAmount}
                                    onChange={(e) => setFormData({ ...formData, advanceAmount: e.target.value })}
                                    InputProps={{ startAdornment: <InputAdornment position="start">Rs.</InputAdornment> }}
                                    sx={FIELD_SX} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth size="small" label="Remaining Amount" value={balanceAmount.toFixed(0)} disabled
                                    InputProps={{ startAdornment: <InputAdornment position="start">Rs.</InputAdornment> }}
                                    sx={{ '& .MuiOutlinedInput-root': { bgcolor: balanceAmount > 0 ? '#fee2e2' : '#f0fdf4', borderRadius: 2, '& .MuiInputBase-input': { fontWeight: 800, color: balanceAmount > 0 ? '#b91c1c' : '#059669', textAlign: 'center' } } }} />
                            </Grid>
                        </Grid>
                    </Card>
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', gap: 1 }}>
                <Button variant="outlined" color="inherit" startIcon={<XIcon size={16} />} onClick={() => setShowForm(false)} disabled={loading}
                    sx={{ borderRadius: 2, textTransform: 'none', borderColor: '#d1d5db', color: '#374151' }}>Cancel</Button>
                <Button variant="contained" startIcon={<Save size={16} />} onClick={handleSubmit} disabled={loading}
                    sx={{ borderRadius: 2, textTransform: 'none', bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}>
                    {loading ? <CircularProgress size={18} color="inherit" /> : 'Save Booking'}
                </Button>
            </DialogActions>
        </Dialog>
    );
    // --- end formDialog ---

    return (
        <Box sx={{ width: '100%', p: 3 }}>
            {formDialog}



            {/* ── Action Bar ── */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2 }}>
                <TextField
                    placeholder="Search by customer or booking number…"
                    variant="outlined"
                    size="small"
                    sx={{ minWidth: 320, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'white' } }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{ startAdornment: (<InputAdornment position="start"><Search size={18} /></InputAdornment>) }}
                />
                <Button
                    variant="contained"
                    startIcon={<Plus size={18} />}
                    onClick={() => setShowForm(true)}
                    sx={{
                        borderRadius: 2, textTransform: 'none', px: 3, whiteSpace: 'nowrap',
                        bgcolor: '#3b82f6',
                        boxShadow: '0 4px 14px rgba(59,130,246,0.35)',
                        '&:hover': { bgcolor: '#2563eb' }
                    }}
                >
                    New Booking
                </Button>
            </Box>

            <TableContainer component={Card} elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                <Table sx={{ minWidth: 650 }}>
                    <TableHead>
                        <TableRow sx={{ bgcolor: '#f8fafc' }}>
                            <TableCell sx={{ fontWeight: 700, color: '#374151' }}>Booking No</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#374151' }}>Customer</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#374151' }}>Date</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#374151' }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#374151' }}>Delivery</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#374151' }} align="right">Amount</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#374151' }} align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredBookings.length > 0 ? (
                            filteredBookings.map((booking) => (
                                <TableRow key={booking.id} sx={{ '&:hover': { bgcolor: '#f9fafb' }, transition: 'background-color 0.15s' }}>
                                    {/* Booking No */}
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700, color: '#7c3aed' }}>
                                            #{booking.bookingNumber}
                                        </Typography>
                                        <Chip
                                            label={booking.bookingType === 'SUIT' ? 'Readymade' : 'Stitching'}
                                            size="small"
                                            sx={{
                                                mt: 0.5, height: 18, fontSize: '0.65rem', borderRadius: 1,
                                                bgcolor: booking.bookingType === 'SUIT' ? '#dbeafe' : '#fef3c7',
                                                color: booking.bookingType === 'SUIT' ? '#1e40af' : '#92400e'
                                            }}
                                        />
                                    </TableCell>
                                    {/* Customer */}
                                    <TableCell>
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>{booking.customer?.name}</Typography>
                                            <Typography variant="caption" color="text.secondary">{booking.customer?.phone}</Typography>
                                        </Box>
                                    </TableCell>
                                    {/* Date */}
                                    <TableCell>
                                        <Typography variant="body2">{new Date(booking.bookingDate).toLocaleDateString()}</Typography>
                                        {booking.returnDate && (
                                            <Typography variant="caption" color="primary" sx={{ display: 'block' }}>Return: {new Date(booking.returnDate).toLocaleDateString()}</Typography>
                                        )}
                                    </TableCell>
                                    {/* Status */}
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <Box
                                                component="select"
                                                value={booking.status}
                                                onChange={(e) => handleStatusUpdate(booking.id, e.target.value)}
                                                style={{
                                                    border: 'none',
                                                    background: 'transparent',
                                                    fontWeight: 700,
                                                    fontSize: '0.8rem',
                                                    color: getStatusColor(booking.status),
                                                    cursor: 'pointer',
                                                    outline: 'none',
                                                    padding: '2px 0',
                                                    appearance: 'none',
                                                    WebkitAppearance: 'none',
                                                }}
                                            >
                                                {BOOKING_STATUSES.map((s) => (
                                                    <option key={s.value} value={s.value}>{s.label}</option>
                                                ))}
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    {/* Delivery */}
                                    <TableCell>
                                        <Typography variant="body2">
                                            {booking.deliveryDate ? new Date(booking.deliveryDate).toLocaleDateString() : '—'}
                                        </Typography>
                                    </TableCell>
                                    {/* Amount */}
                                    <TableCell align="right">
                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>Rs.&nbsp;{parseFloat(booking.totalAmount).toFixed(0)}</Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Adv: Rs.&nbsp;{parseFloat(booking.advanceAmount).toFixed(0)}</Typography>
                                        <Typography variant="caption" sx={{ display: 'block', color: '#dc2626', fontWeight: 600 }}>Rem: Rs.&nbsp;{parseFloat(booking.remainingAmount).toFixed(0)}</Typography>
                                    </TableCell>
                                    {/* Actions */}
                                    <TableCell align="right">
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                                            <Tooltip title="View Details">
                                                <IconButton size="small" onClick={() => handleViewBooking(booking)}
                                                    sx={{ color: '#3b82f6', borderRadius: 1.5, transition: 'all 0.18s', '&:hover': { bgcolor: '#3b82f6', color: 'white' } }}>
                                                    <Eye size={17} />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Print">
                                                <IconButton size="small" onClick={() => handlePrintClick(booking)}
                                                    sx={{ color: '#3b82f6', borderRadius: 1.5, transition: 'all 0.18s', '&:hover': { bgcolor: '#3b82f6', color: 'white' } }}>
                                                    <Printer size={17} />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete Booking">
                                                <IconButton size="small" onClick={() => handleDelete(booking.id)}
                                                    sx={{ color: '#ef4444', borderRadius: 1.5, transition: 'all 0.18s', '&:hover': { bgcolor: '#ef4444', color: 'white' } }}>
                                                    <Trash2 size={17} />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
                                        <ShoppingCart size={40} style={{ opacity: 0.25 }} />
                                        <Typography color="text.secondary" fontWeight={500}>No bookings found.</Typography>
                                        <Typography variant="caption" color="text.disabled">Try adjusting your search or create a new booking.</Typography>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Print type picker dialog */}
            <Dialog open={printDialogOpen} onClose={() => setPrintDialogOpen(false)} maxWidth="xs" fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}>Select Print Option</DialogTitle>
                <DialogContent sx={{ pt: '20px !important' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Button variant="outlined" size="large" startIcon={<BookText />}
                            onClick={() => handlePrintConfirm('BILL')}
                            sx={{ justifyContent: 'flex-start', py: 1.5, borderRadius: 2, textTransform: 'none' }}>
                            Print Bill / Invoice
                        </Button>
                        <Button variant="outlined" size="large" startIcon={<Ruler />}
                            onClick={() => handlePrintConfirm('STITCHING')}
                            sx={{ justifyContent: 'flex-start', py: 1.5, borderRadius: 2, textTransform: 'none' }}>
                            Print Stitching Details
                        </Button>
                    </Box>
                </DialogContent>
            </Dialog>

            <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="md" fullWidth dir="rtl">
                <DialogTitle sx={{ bgcolor: '#8b5cf6', color: 'white', py: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" fontWeight="bold" className="font-urdu">بکنگ کی تفصیلات</Typography>
                        <IconButton onClick={() => setViewOpen(false)} sx={{ color: 'white' }}>
                            <XIcon size={20} />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ p: 3 }}>
                    {selectedBooking && (
                        <Box sx={{ mt: 2 }}>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <Card variant="outlined" sx={{ p: 2 }}>
                                        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }} className="font-urdu">گاہک کی معلومات</Typography>
                                        <Typography variant="body2" sx={{ mb: 0.5 }}><strong>نام:</strong> {selectedBooking.customer?.name}</Typography>
                                        <Typography variant="body2" sx={{ mb: 0.5 }}><strong>فون:</strong> {selectedBooking.customer?.phone}</Typography>
                                        <Typography variant="body2"><strong>پتہ:</strong> {selectedBooking.customer?.address}</Typography>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Card variant="outlined" sx={{ p: 2 }}>
                                        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }} className="font-urdu">آرڈر کی معلومات</Typography>
                                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                                            <strong>بکنگ نمبر:</strong> {selectedBooking.bookingNumber}
                                        </Typography>
                                        <Typography variant="body2" sx={{ mb: 0.5 }}><strong>تاریخ بکنگ:</strong> {new Date(selectedBooking.bookingDate).toLocaleDateString()}</Typography>
                                        <Typography variant="body2" sx={{ mb: 0.5 }}><strong>ڈیلیوری کی تاریخ:</strong> {selectedBooking.deliveryDate ? new Date(selectedBooking.deliveryDate).toLocaleDateString() : '-'}</Typography>
                                        <Typography variant="body2"><strong>ٹرائل کی تاریخ:</strong> {selectedBooking.trialDate ? new Date(selectedBooking.trialDate).toLocaleDateString() : '-'}</Typography>
                                    </Card>
                                </Grid>
                            </Grid>

                            <Grid container spacing={3} sx={{ mt: 1 }}>
                                <Grid item xs={12} md={6}>
                                    <Card variant="outlined" sx={{ p: 2 }}>
                                        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }} className="font-urdu">درزی کی تفصیلات</Typography>
                                        {selectedBooking.tailor ? (
                                            <Box>
                                                <Typography variant="body2"><strong>نام:</strong> {selectedBooking.tailor.name}</Typography>
                                                <Typography variant="body2" color="textSecondary"><strong>عہدہ:</strong> {selectedBooking.tailor.role}</Typography>
                                            </Box>
                                        ) : (
                                            <Typography variant="body2" color="textSecondary">درزی منتخب نہیں ہے</Typography>
                                        )}
                                    </Card>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Card variant="outlined" sx={{ p: 2 }}>
                                        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>Cutter Details</Typography>
                                        {selectedBooking.cutter ? (
                                            <Box>
                                                <Typography variant="body2"><strong>Name:</strong> {selectedBooking.cutter.name}</Typography>
                                                <Typography variant="body2" color="textSecondary"><strong>Role:</strong> {selectedBooking.cutter.role}</Typography>
                                            </Box>
                                        ) : (
                                            <Typography variant="body2" color="textSecondary">No Cutter Selected</Typography>
                                        )}
                                    </Card>
                                </Grid>
                            </Grid>

                            <Divider sx={{ my: 3 }}><Typography>Products / Items</Typography></Divider>
                            <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                    <TableHead sx={{ bgcolor: '#f9fafb' }}>
                                        <TableRow>
                                            <TableCell align="right" sx={{ fontWeight: 600 }}>Product</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600 }}>Qty</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600 }}>Price</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600 }}>Disc</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600 }}>Net Price</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600 }}>Total</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {selectedBooking.items?.map((item, idx) => {
                                            const unitPrice = parseFloat(item.unitPrice) || 0;
                                            const qty = parseFloat(item.quantity) || 0;
                                            const discount = parseFloat(item.discount || 0);
                                            const discountedPrice = qty > 0 ? (unitPrice - (discount / qty)) : unitPrice;

                                            return (
                                                <React.Fragment key={idx}>
                                                    <TableRow>
                                                        <TableCell align="right" sx={{ fontWeight: 600 }}>{item.product?.name}</TableCell>
                                                        <TableCell align="right">{item.quantity}</TableCell>
                                                        <TableCell align="right">Rs. {unitPrice.toFixed(2)}</TableCell>
                                                        <TableCell align="right">Rs. {discount.toFixed(2)}</TableCell>
                                                        <TableCell align="right">Rs. {discountedPrice.toFixed(2)}</TableCell>
                                                        <TableCell align="right">Rs. {parseFloat(item.totalPrice).toFixed(2)}</TableCell>
                                                    </TableRow>
                                                    {(item.cuffType || item.pohnchaType || item.galaType) && (
                                                        <TableRow>
                                                            <TableCell colSpan={6} sx={{ bgcolor: '#f8fafc', py: 1 }}>
                                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, px: 2, justifyContent: 'flex-start' }}>
                                                                    {item.cuffType && <Typography variant="caption"><strong>Cuff:</strong> {item.cuffType}</Typography>}
                                                                    {item.pohnchaType && <Typography variant="caption"><strong>Bottom:</strong> {item.pohnchaType}</Typography>}
                                                                    {item.galaType && <Typography variant="caption"><strong>Neck:</strong> {item.galaType === 'ban' ? 'Ban' : 'Collar'} ({item.galaSize})</Typography>}
                                                                    {item.gheraType && <Typography variant="caption"><strong>Daman:</strong> {item.gheraType === 'seedha' ? 'Straight' : 'Round'}</Typography>}
                                                                    {item.shalwarType && <Typography variant="caption"><strong>Shalwar:</strong> {item.shalwarType}</Typography>}
                                                                    <Typography variant="caption"><strong>Shalwar Pocket:</strong> {item.hasShalwarPocket ? 'Yes' : 'No'}</Typography>
                                                                    <Typography variant="caption"><strong>Front Pockets:</strong> {item.hasFrontPockets ? 'Yes' : 'No'}</Typography>
                                                                </Box>
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </React.Fragment>
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
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setViewOpen(false)} variant="outlined" sx={{ color: '#8b5cf6', borderColor: '#8b5cf6' }}>Close</Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={!!error || !!successMessage}
                autoHideDuration={6000}
                onClose={() => { setError(''); setSuccessMessage(''); }}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={error ? 'error' : 'success'} variant="filled" sx={{ borderRadius: 2 }}
                    onClose={() => { setError(''); setSuccessMessage(''); }}>
                    {error || successMessage}
                </Alert>
            </Snackbar>

            {/* Print Layout - Hidden normally, visible during print */}
            {printBooking && (
                <Box
                    id="printable-section"
                    sx={{
                        display: 'none',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        bgcolor: 'white',
                        zIndex: 9999,
                        p: 4,
                        '@media print': {
                            display: 'block',
                        }
                    }}
                >
                    {printType === 'BILL' ? (
                        // --- BILL / INVOICE LAYOUT ---
                        <Box>
                            <Box sx={{ textAlign: 'center', mb: 3 }}>
                                <Typography variant="h4" fontWeight="bold">Grace Cloth and Tailor</Typography>
                                <Typography variant="body2">Booking Invoice</Typography>
                            </Box>

                            <Grid container spacing={2} sx={{ mb: 4 }}>
                                <Grid item xs={6}>
                                    <Typography variant="subtitle2" fontWeight="bold">Customer Info</Typography>
                                    <Typography variant="body2">{printBooking.customer?.name}</Typography>
                                    <Typography variant="body2">{printBooking.customer?.phone}</Typography>
                                </Grid>
                                <Grid item xs={6} sx={{ textAlign: 'left' }}>
                                    <Typography variant="subtitle2" fontWeight="bold">Booking Info</Typography>
                                    <Typography variant="body2">No: {printBooking.bookingNumber}</Typography>
                                    <Typography variant="body2">Date: {new Date(printBooking.bookingDate).toLocaleDateString()}</Typography>
                                    <Typography variant="body2">Delivery: {printBooking.deliveryDate ? new Date(printBooking.deliveryDate).toLocaleDateString() : '-'}</Typography>
                                </Grid>
                            </Grid>

                            <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: '#f9fafb' }}>
                                            <TableCell align="right"><strong>Product</strong></TableCell>
                                            <TableCell align="right"><strong>Qty</strong></TableCell>
                                            <TableCell align="right"><strong>Price</strong></TableCell>
                                            <TableCell align="right"><strong>Total</strong></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {printBooking.items?.map((item, idx) => (
                                            <React.Fragment key={idx}>
                                                <TableRow>
                                                    <TableCell align="right">{item.product?.name}</TableCell>
                                                    <TableCell align="right">{item.quantity}</TableCell>
                                                    <TableCell align="right">{parseFloat(item.unitPrice).toFixed(2)}</TableCell>
                                                    <TableCell align="right">{parseFloat(item.totalPrice).toFixed(2)}</TableCell>
                                                </TableRow>
                                            </React.Fragment>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                                <Box sx={{ width: 250 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2">Total Amount:</Typography>
                                        <Typography variant="body2" fontWeight="bold">Rs. {parseFloat(printBooking.totalAmount).toFixed(2)}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2">Advance:</Typography>
                                        <Typography variant="body2" fontWeight="bold">Rs. {parseFloat(printBooking.advanceAmount).toFixed(2)}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #ddd', pt: 1 }}>
                                        <Typography variant="body2">Remaining:</Typography>
                                        <Typography variant="body2" fontWeight="bold" color="error">Rs. {parseFloat(printBooking.remainingAmount).toFixed(2)}</Typography>
                                    </Box>
                                </Box>
                            </Box>

                            <Box sx={{ mt: 8, textAlign: 'center', borderTop: '1px dashed #ccc', pt: 2 }}>
                                <Typography variant="caption">Thank you for your business!</Typography>
                            </Box>
                        </Box>
                    ) : (
                        <Box
                            sx={{
                                fontFamily: 'Arial, sans-serif',
                                p: 1,
                                color: 'black',
                                display: 'flex',
                                flexDirection: 'column',
                                minHeight: '10in', // Approximate A4 height to help keep footer at bottom
                                width: '100%',
                                boxSizing: 'border-box'
                            }}
                        >
                            <Box sx={{ textAlign: 'center', mb: 2 }}>
                                <Typography variant="h4" fontWeight="bold">Grace Cloth and Tailor</Typography>
                                <Typography variant="subtitle1" fontWeight="bold">Order Ticket (Booking #{printBooking.bookingNumber})</Typography>
                            </Box>

                            <Box sx={{ mb: 2, pb: 1 }}>
                                <Grid container spacing={1}>
                                    <Grid item xs={12}>
                                        <Typography variant="body1"><strong>Customer:</strong> {printBooking.customer?.name || ''}</Typography>
                                    </Grid>
                                    <Grid item xs={12} sx={{ minHeight: '3em' }}>
                                        <Typography variant="body1"><strong>Address:</strong> {printBooking.customer?.address || ''}</Typography>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Typography variant="body1"><strong>Phone:</strong> {printBooking.customer?.phone || ''}</Typography>
                                    </Grid>
                                </Grid>
                            </Box>

                            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', pb: 1 }}>
                                <Typography variant="body1"><strong>Date:</strong> {printBooking.bookingDate ? new Date(printBooking.bookingDate).toLocaleDateString() : ''}</Typography>
                                <Typography variant="body1"><strong>Delivery:</strong> {printBooking.deliveryDate ? new Date(printBooking.deliveryDate).toLocaleDateString() : ''}</Typography>
                            </Box>

                            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', pb: 1 }}>
                                <Typography variant="body1"><strong>Cutter:</strong> {employees?.find(e => e.id === printBooking.cutterId)?.name || ''}</Typography>
                                <Typography variant="body1"><strong>Tailor:</strong> {employees?.find(e => e.id === printBooking.tailorId)?.name || ''}</Typography>
                            </Box>

                            {/* MERGED MEASUREMENTS AND STITCHING DETAILS TABLE */}
                            <TableContainer component={Box} sx={{ mb: 2 }}>
                                <Table size="small" sx={{ border: '1px solid #000' }}>
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: '#f3f4f6' }}>
                                            <TableCell sx={{ border: '1px solid #000', fontWeight: 'bold' }}>Detail</TableCell>
                                            <TableCell sx={{ border: '1px solid #000', fontWeight: 'bold' }}>Measurement / Stitching</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {printBooking.items?.map((item, idx) => (
                                            <React.Fragment key={idx}>
                                                {/* Product Header if more than 1 item */}
                                                {printBooking.items.length > 1 && (
                                                    <TableRow>
                                                        <TableCell colSpan={2} sx={{ border: '1px solid #000', fontWeight: 'bold', bgcolor: '#f9fafb', textAlign: 'center' }}>
                                                            {item.product?.name} (Qty: {item.quantity})
                                                        </TableCell>
                                                    </TableRow>
                                                )}

                                                {/* Measurements & Related Stitching Details */}
                                                {true && (
                                                    <>
                                                        <TableRow>
                                                            <TableCell sx={{ border: '1px solid #000' }}>Length</TableCell>
                                                            <TableCell sx={{ border: '1px solid #000' }}>{customerMeasurements?.qameez_lambai || ''}</TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell sx={{ border: '1px solid #000' }}>Shoulder</TableCell>
                                                            <TableCell sx={{ border: '1px solid #000' }}>{customerMeasurements?.teera || ''}</TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell sx={{ border: '1px solid #000' }}>Sleeve / Cuff</TableCell>
                                                            <TableCell sx={{ border: '1px solid #000' }}>
                                                                {customerMeasurements?.bazoo || ''}
                                                                {item.cuffType ? ` (${item.cuffType === 'single' ? 'Single' : item.cuffType === 'double folding' ? 'Double' : item.cuffType === 'open sleeve' ? 'Open Sleeve' : item.cuffType})` : ''}
                                                            </TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell sx={{ border: '1px solid #000' }}>Neck / Collar</TableCell>
                                                            <TableCell sx={{ border: '1px solid #000' }}>
                                                                {customerMeasurements?.galaa || ''}
                                                                {item.galaType ? ` (${item.galaType === 'ban' ? 'Ban' : 'Collar'}${item.galaSize ? ` : ${item.galaSize}` : ''})` : ''}
                                                            </TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell sx={{ border: '1px solid #000' }}>Chest</TableCell>
                                                            <TableCell sx={{ border: '1px solid #000' }}>{customerMeasurements?.chaati || ''}</TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell sx={{ border: '1px solid #000' }}>Waist</TableCell>
                                                            <TableCell sx={{ border: '1px solid #000' }}>{customerMeasurements?.kamar_around || ''}</TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell sx={{ border: '1px solid #000' }}>Daman</TableCell>
                                                            <TableCell sx={{ border: '1px solid #000' }}>
                                                                {customerMeasurements?.gheera || ''}
                                                                {item.gheraType ? ` (${item.gheraType === 'seedha' ? 'Straight' : 'Round'})` : ''}
                                                            </TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell sx={{ border: '1px solid #000' }}>Shalwar Length</TableCell>
                                                            <TableCell sx={{ border: '1px solid #000' }}>{customerMeasurements?.shalwar_lambai || ''}</TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell sx={{ border: '1px solid #000' }}>Bottom</TableCell>
                                                            <TableCell sx={{ border: '1px solid #000' }}>
                                                                {customerMeasurements?.puhncha || ''}
                                                                {item.pohnchaType ? ` (${item.pohnchaType === 'saada' ? 'Simple' : item.pohnchaType === 'jaali' ? 'Net' : item.pohnchaType === 'karhaai' ? 'Embroided' : 'Net + Embroided'})` : ''}
                                                            </TableCell>
                                                        </TableRow>
                                                    </>
                                                )}

                                                {/* Stitching Only Details */}
                                                <TableRow>
                                                    <TableCell sx={{ border: '1px solid #000' }}>Pocket</TableCell>
                                                    <TableCell sx={{ border: '1px solid #000' }}>{item.pocketType === 'single' ? 'Single' : (item.pocketType === 'double' ? 'Double' : '')}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell sx={{ border: '1px solid #000' }}>Front Pocket</TableCell>
                                                    <TableCell sx={{ border: '1px solid #000' }}>{item.hasFrontPockets ? 'Yes' : ''}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell sx={{ border: '1px solid #000' }}>Shalwar Pocket</TableCell>
                                                    <TableCell sx={{ border: '1px solid #000' }}>{item.hasShalwarPocket ? 'Yes' : ''}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell sx={{ border: '1px solid #000' }}>Shalwar Type</TableCell>
                                                    <TableCell sx={{ border: '1px solid #000' }}>{item.shalwarType === 'pajama' ? 'Pajama' : (item.shalwarType === 'shalwar' ? 'Shalwar' : '')}</TableCell>
                                                </TableRow>
                                            </React.Fragment>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            {/* NOTE SECTION */}
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="body1"><strong>Note:</strong></Typography>
                                <Typography variant="body2" sx={{ p: 1, border: '1px dashed #000', borderRadius: 1, minHeight: '60px' }}>
                                    {printBooking.notes || ''}
                                </Typography>
                            </Box>

                            {/* FOOTER */}
                            <Box sx={{ mt: 'auto', pt: 2, borderTop: '2px solid #000', textAlign: 'center' }}>
                                <Typography variant="body2" fontWeight="bold">
                                    fazal plaza, dhulyan chowk dinga, tel: 053-7401543
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 1 }}>
                                    <Typography variant="body2" fontWeight="bold">Zameer Ahmed raza</Typography>
                                    <MessageCircle size={16} color="#25D366" />
                                    <Typography variant="body2" fontWeight="bold">0300-6284318</Typography>
                                </Box>
                            </Box>
                        </Box>
                    )}
                </Box>
            )}

            <GlobalStyles styles={{
                '@media print': {
                    'body *': {
                        visibility: 'hidden',
                    },
                    '#printable-section, #printable-section *': {
                        visibility: 'visible',
                    },
                    '#printable-section': {
                        position: 'fixed',
                        left: 0,
                        top: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'white',
                        zIndex: 9999,
                    },
                },
            }} />

        </Box >
    );
}
