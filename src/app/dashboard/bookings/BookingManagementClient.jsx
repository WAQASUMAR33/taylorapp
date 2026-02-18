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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tooltip,
    Autocomplete,
    Radio,
    RadioGroup,
    FormControlLabel,
    FormControl,
    Checkbox,
    GlobalStyles
} from "@mui/material";
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
    const tailors = employees.filter(e => e.role === "Tailor");
    const cutters = employees.filter(e => e.role === "Cutter");

    const handleCustomerChange = (customerId) => {
        const customer = customers.find(c => c.id === parseInt(customerId));
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
        const product = products.find(p => p.id === parseInt(productId));
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

    const filteredBookings = bookings.filter(b =>
        b.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.customer?.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.customer?.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.id.toString().includes(searchQuery) ||
        b.bookingNumber?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusColor = (status) => {
        const statusObj = BOOKING_STATUSES.find(s => s.value === status);
        return statusObj?.color || "#6b7280";
    };

    if (showForm) {
        return (
            <Box sx={{ width: '100%', bgcolor: '#f9fafb', minHeight: '100vh', p: 3 }}>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <Card sx={{ mb: 2 }}>
                    <Box sx={{ p: 2, bgcolor: '#8b5cf6', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>SALE ORDER / BOOKING</Typography>
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
                                onClick={() => setShowForm(false)}
                                sx={{ bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' } }}
                            >
                                Cancel
                            </Button>
                        </Box>
                    </Box>

                    <Box sx={{ p: 3 }}>
                        <Grid container spacing={2}>
                            {/* Left Section */}
                            <Grid item xs={12} md={6}>
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Serial No</Typography>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            value="Auto Generated"
                                            disabled
                                            sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#f3f4f6', borderRadius: '10px' } }}
                                        />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Date</Typography>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            type="date"
                                            name="bookingDate"
                                            required
                                            value={formData.bookingDate}
                                            onChange={(e) => setFormData({ ...formData, bookingDate: e.target.value })}
                                            InputProps={{
                                                startAdornment: <InputAdornment position="start"><Calendar size={18} color="#9ca3af" /></InputAdornment>,
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
                                    <Grid item xs={6}>
                                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Customer Order Ref</Typography>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            value="Auto"
                                            disabled
                                            sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#f3f4f6', borderRadius: '10px' } }}
                                        />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Delivery Date</Typography>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            type="date"
                                            name="deliveryDate"
                                            required
                                            value={formData.deliveryDate}
                                            onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                                            InputProps={{
                                                startAdornment: <InputAdornment position="start"><Calendar size={18} color="#9ca3af" /></InputAdornment>,
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

                                    {/* Right Section - Customer Info */}
                                    <Grid item xs={12} md={6}>
                                        <Card variant="outlined" sx={{ p: 2, bgcolor: '#ffffff', height: '100%', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                            <Box sx={{ mb: 2, display: 'inline-flex', alignItems: 'center', gap: 1.5, borderLeft: '4px solid #8b5cf6', pl: 1.5 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1f2937', fontSize: '0.95rem', letterSpacing: '0.01em' }}>
                                                    Customer Information
                                                </Typography>
                                            </Box>
                                            <Grid container spacing={2}>
                                                <Grid item xs={12}>
                                                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Select Customer</Typography>
                                                    <Autocomplete
                                                        options={customers}
                                                        getOptionLabel={(option) => option.name || ""}
                                                        value={customers.find(c => c.id === formData.customerId) || null}
                                                        onChange={(event, newValue) => {
                                                            handleCustomerChange(newValue ? newValue.id : "");
                                                        }}
                                                        renderInput={(params) => (
                                                            <TextField
                                                                {...params}
                                                                placeholder="نام، فون، آئی ڈی، یا پتے سے تلاش کریں..."
                                                                size="small"
                                                                fullWidth
                                                                required
                                                                InputProps={{
                                                                    ...params.InputProps,
                                                                    startAdornment: (
                                                                        <>
                                                                            <InputAdornment position="start">
                                                                                <User size={18} color="#9ca3af" />
                                                                            </InputAdornment>
                                                                            {params.InputProps.startAdornment}
                                                                        </>
                                                                    ),
                                                                }}
                                                                sx={{
                                                                    width: 400,
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
                                                <Grid item xs={6}>
                                                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Name</Typography>
                                                    <TextField
                                                        fullWidth
                                                        size="small"
                                                        value={formData.customerName}
                                                        disabled
                                                        placeholder="e.g. John Doe"
                                                        sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#f9fafb', borderRadius: '10px' } }}
                                                    />
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Code</Typography>
                                                    <TextField
                                                        fullWidth
                                                        size="small"
                                                        value={formData.customerCode}
                                                        disabled
                                                        placeholder="e.g. CUST-001"
                                                        sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#f9fafb', borderRadius: '10px' } }}
                                                    />
                                                </Grid>
                                                <Grid item xs={12}>
                                                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Telephone</Typography>
                                                    <TextField
                                                        fullWidth
                                                        size="small"
                                                        value={formData.customerPhone}
                                                        disabled
                                                        placeholder="e.g. +92 300 1234567"
                                                        InputProps={{
                                                            startAdornment: (
                                                                <InputAdornment position="start">
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                        <Typography sx={{ fontSize: '1.2rem' }}>🇵🇰</Typography>
                                                                        <Typography sx={{ fontWeight: 600, color: '#374151', ml: 0.5 }}>+92</Typography>
                                                                        <Box sx={{ width: '1px', height: '20px', bgcolor: '#e5e7eb', ml: 1 }} />
                                                                    </Box>
                                                                </InputAdornment>
                                                            ),
                                                        }}
                                                        sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#f9fafb', borderRadius: '10px' } }}
                                                    />
                                                </Grid>
                                                <Grid item xs={12}>
                                                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Address</Typography>
                                                    <TextField
                                                        fullWidth
                                                        size="small"
                                                        value={formData.customerAddress}
                                                        disabled
                                                        multiline
                                                        rows={2}
                                                        placeholder="e.g. House #123, Street #4, Sector..."
                                                        sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#f9fafb', borderRadius: '10px' } }}
                                                    />
                                                </Grid>
                                            </Grid>
                                        </Card>
                                    </Grid>
                                </Grid>

                                {/* Stitching section removed as it's now per-item */}

                                {/* Product Grid */}
                                <Box sx={{ mt: 3 }}>
                                    <TableContainer component={Paper} variant="outlined">
                                        <Table size="small">
                                            <TableHead sx={{ bgcolor: '#e5e7eb' }}>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 600, width: 50 }}>#</TableCell>
                                                    <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
                                                    <TableCell sx={{ fontWeight: 600, width: 100 }}>Quantity</TableCell>
                                                    {/* Unit column removed */}
                                                    <TableCell sx={{ fontWeight: 600, width: 150 }}>Rate</TableCell>
                                                    <TableCell sx={{ fontWeight: 600, width: 120 }}>Discount</TableCell>
                                                    <TableCell sx={{ fontWeight: 600, width: 150 }}>Total Value</TableCell>
                                                    <TableCell sx={{ fontWeight: 600, width: 50 }}></TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {cartItems.map((item, index) => (
                                                    <React.Fragment key={index}>
                                                        <TableRow sx={{ '&:hover': { bgcolor: '#f3f4f6' }, transition: 'background-color 0.2s', '& td, & th': { borderBottom: item.bookingType === 'STITCHING' && !item.isCollapsed ? 'none' : undefined } }}>
                                                            <TableCell>{index + 1}</TableCell>
                                                            <TableCell>
                                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                                    <Autocomplete
                                                                        options={products}
                                                                        getOptionLabel={(option) => option.name || ""}
                                                                        value={products.find(p => p.id === item.productId) || null}
                                                                        onChange={(event, newValue) => {
                                                                            handleProductChange(index, newValue ? newValue.id : "");
                                                                        }}
                                                                        sx={{ flexGrow: 1 }}
                                                                        renderInput={(params) => (
                                                                            <TextField
                                                                                {...params}
                                                                                placeholder="منتخب کریں"
                                                                                size="small"
                                                                                required
                                                                                fullWidth
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
                                                                    {/* Category selection is now automated based on product selection */}
                                                                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                        <Chip
                                                                            size="small"
                                                                            label={item.bookingType === 'STITCHING' ? 'Suit (Needs Stitching)' : 'Stitched (Readymade)'}
                                                                            variant="outlined"
                                                                            sx={{
                                                                                fontSize: '0.7rem',
                                                                                height: 20,
                                                                                color: item.bookingType === 'STITCHING' ? '#8b5cf6' : '#6b7280',
                                                                                borderColor: item.bookingType === 'STITCHING' ? '#8b5cf6' : '#e5e7eb',
                                                                                bgcolor: item.bookingType === 'STITCHING' ? '#f5f3ff' : '#f9fafb'
                                                                            }}
                                                                        />
                                                                    </Box>
                                                                </Box>
                                                            </TableCell>
                                                            <TableCell>
                                                                <TextField
                                                                    size="small"
                                                                    required
                                                                    value={item.quantity}
                                                                    onFocus={(e) => e.target.select()}
                                                                    onChange={(e) => {
                                                                        const val = e.target.value;
                                                                        if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                                                            handleQuantityChange(index, val);
                                                                        }
                                                                    }}
                                                                    sx={{ width: '80px', '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: '6px' } }}
                                                                />
                                                            </TableCell>
                                                            {/* Unit cell removed */}
                                                            <TableCell>
                                                                <TextField
                                                                    size="small"
                                                                    required
                                                                    value={item.unitPrice} // Changed from salePrice to unitPrice
                                                                    onFocus={(e) => e.target.select()}
                                                                    onChange={(e) => {
                                                                        const val = e.target.value;
                                                                        if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                                                            const newItems = [...cartItems];
                                                                            newItems[index].unitPrice = val;
                                                                            newItems[index].totalPrice = calculateItemTotal(newItems[index]);
                                                                            setCartItems(newItems);
                                                                        }
                                                                    }}
                                                                    sx={{ width: '120px', '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: '6px' } }}
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <TextField
                                                                    size="small"
                                                                    value={item.discount}
                                                                    onFocus={(e) => e.target.select()}
                                                                    onChange={(e) => {
                                                                        const val = e.target.value;
                                                                        if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                                                            const newItems = [...cartItems];
                                                                            newItems[index].discount = val;
                                                                            newItems[index].totalPrice = calculateItemTotal(newItems[index]);
                                                                            setCartItems(newItems);
                                                                        }
                                                                    }}
                                                                    sx={{ width: '100px', '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: '6px' } }}
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                                    {(parseFloat(item.totalPrice) || 0).toFixed(2)}
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell>
                                                                <IconButton
                                                                    size="small"
                                                                    color="error"
                                                                    onClick={() => handleRemoveRow(index)}
                                                                    disabled={cartItems.length === 1}
                                                                >
                                                                    <Trash2 size={16} />
                                                                </IconButton>
                                                            </TableCell>
                                                        </TableRow>
                                                        {item.bookingType === 'STITCHING' && (
                                                            <TableRow>
                                                                <TableCell colSpan={7} sx={{ pb: 3, pt: 0, borderBottom: '1px solid rgba(224, 224, 224, 1)' }}>
                                                                    {item.isCollapsed ? (
                                                                        <Box sx={{ mt: 1.5, p: 2, borderRadius: '8px', border: '1px solid #e5e7eb', bgcolor: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                                            <Typography variant="body2" color="textSecondary">
                                                                                <strong>Stitching Details Saved</strong> for {item.productName || "Product"}
                                                                            </Typography>
                                                                            <Button
                                                                                size="small"
                                                                                onClick={() => {
                                                                                    const newItems = [...cartItems];
                                                                                    newItems[index].isCollapsed = false;
                                                                                    setCartItems(newItems);
                                                                                }}
                                                                                sx={{ color: '#8b5cf6' }}
                                                                                className="font-urdu"
                                                                            >
                                                                                تبدیلی کریں
                                                                            </Button>
                                                                        </Box>
                                                                    ) : (
                                                                        <Box sx={{ mt: 1.5, p: 2, borderRadius: '8px', border: '1px solid #8b5cf6', bgcolor: '#f5f3ff', minWidth: '100%' }}>
                                                                            {index > 0 && previousStitchingDetails && (
                                                                                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                                                                    <Button
                                                                                        size="small"
                                                                                        variant="outlined"
                                                                                        onClick={() => {
                                                                                            const newItems = [...cartItems];
                                                                                            newItems[index] = {
                                                                                                ...newItems[index],
                                                                                                ...previousStitchingDetails
                                                                                            };
                                                                                            setCartItems(newItems);
                                                                                        }}
                                                                                        sx={{ borderColor: '#8b5cf6', color: '#8b5cf6', '&:hover': { borderColor: '#7c3aed', bgcolor: '#f5f3ff' } }}
                                                                                    >
                                                                                        Use Previous Details
                                                                                    </Button>
                                                                                </Box>
                                                                            )}
                                                                            <Grid container spacing={2}>
                                                                                <Grid item xs={12} sm={4}>
                                                                                    <Typography variant="caption" className="font-urdu" sx={{ fontWeight: 700, mb: 0.5, display: 'block', color: '#6d28d9' }}>کف</Typography>
                                                                                    <TextField
                                                                                        select
                                                                                        required
                                                                                        size="small"
                                                                                        value={item.cuffType}
                                                                                        onChange={(e) => {
                                                                                            const newItems = [...cartItems];
                                                                                            newItems[index].cuffType = e.target.value;
                                                                                            setCartItems(newItems);
                                                                                        }}
                                                                                        sx={{ width: '300px', '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: '6px' } }}
                                                                                    >
                                                                                        <MenuItem value="single">سنگل</MenuItem>
                                                                                        <MenuItem value="double folding">ڈبل فولڈنگ</MenuItem>
                                                                                        <MenuItem value="open sleeve">کھلی آستین</MenuItem>
                                                                                    </TextField>
                                                                                </Grid>
                                                                                <Grid item xs={12} sm={4}>
                                                                                    <Typography variant="caption" className="font-urdu" sx={{ fontWeight: 700, mb: 0.5, display: 'block', color: '#6d28d9' }}>پائنچہ</Typography>
                                                                                    <TextField
                                                                                        select
                                                                                        required
                                                                                        size="small"
                                                                                        value={item.pohnchaType}
                                                                                        onChange={(e) => {
                                                                                            const newItems = [...cartItems];
                                                                                            newItems[index].pohnchaType = e.target.value;
                                                                                            setCartItems(newItems);
                                                                                        }}
                                                                                        sx={{ width: '300px', '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: '6px' } }}
                                                                                    >
                                                                                        <MenuItem value="jaali">جالی والا</MenuItem>
                                                                                        <MenuItem value="karhaai">کڑھائی والا</MenuItem>
                                                                                        <MenuItem value="jaali_karhaai">جالی بمعہ کڑھائی</MenuItem>
                                                                                        <MenuItem value="saada">سادہ</MenuItem>
                                                                                    </TextField>
                                                                                </Grid>
                                                                                <Grid item xs={12} sm={4}>
                                                                                    <Typography variant="caption" className="font-urdu" sx={{ fontWeight: 700, mb: 0.5, display: 'block', color: '#6d28d9' }}>گھیرا</Typography>
                                                                                    <TextField
                                                                                        select
                                                                                        required
                                                                                        size="small"
                                                                                        value={item.gheraType}
                                                                                        onChange={(e) => {
                                                                                            const newItems = [...cartItems];
                                                                                            newItems[index].gheraType = e.target.value;
                                                                                            setCartItems(newItems);
                                                                                        }}
                                                                                        sx={{ width: '300px', '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: '6px' } }}
                                                                                    >
                                                                                        <MenuItem value="seedha">سیدھا</MenuItem>
                                                                                        <MenuItem value="gol">گول</MenuItem>
                                                                                    </TextField>
                                                                                </Grid>
                                                                                <Grid item xs={12} sm={4}>
                                                                                    <Typography variant="caption" className="font-urdu" sx={{ fontWeight: 700, mb: 0.5, display: 'block', color: '#6d28d9' }}>گالہ</Typography>
                                                                                    <TextField
                                                                                        select
                                                                                        required
                                                                                        size="small"
                                                                                        value={item.galaType}
                                                                                        onChange={(e) => {
                                                                                            const newItems = [...cartItems];
                                                                                            newItems[index].galaType = e.target.value;
                                                                                            setCartItems(newItems);
                                                                                        }}
                                                                                        sx={{ width: '300px', '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: '6px' } }}
                                                                                    >
                                                                                        <MenuItem value="ban">بین</MenuItem>
                                                                                        <MenuItem value="collar">کالر</MenuItem>
                                                                                    </TextField>
                                                                                </Grid>
                                                                                {item.galaType && (
                                                                                    <Grid item xs={12} sm={4}>
                                                                                        <Typography variant="caption" className="font-urdu" sx={{ fontWeight: 700, mb: 0.5, display: 'block', color: '#6d28d9' }}>سائز</Typography>
                                                                                        <TextField
                                                                                            select
                                                                                            required
                                                                                            size="small"
                                                                                            value={item.galaSize}
                                                                                            onChange={(e) => {
                                                                                                const newItems = [...cartItems];
                                                                                                newItems[index].galaSize = e.target.value;
                                                                                                setCartItems(newItems);
                                                                                            }}
                                                                                            sx={{ width: '300px', '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: '6px' } }}
                                                                                        >
                                                                                            {[13.5, 14, 14.5, 15, 15.5, 16, 16.5, 17, 17.5, 18, 18.5, 19, 19.5].map(s => <MenuItem key={s} value={s.toString()}>{s}</MenuItem>)}
                                                                                        </TextField>
                                                                                    </Grid>
                                                                                )}
                                                                                <Grid item xs={12} sm={4}>
                                                                                    <Typography variant="caption" className="font-urdu" sx={{ fontWeight: 700, mb: 0.5, display: 'block', color: '#6d28d9' }}>جیب</Typography>
                                                                                    <TextField
                                                                                        select
                                                                                        required
                                                                                        size="small"
                                                                                        value={item.pocketType}
                                                                                        onChange={(e) => {
                                                                                            const newItems = [...cartItems];
                                                                                            newItems[index].pocketType = e.target.value;
                                                                                            setCartItems(newItems);
                                                                                        }}
                                                                                        sx={{ width: '300px', '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: '6px' } }}
                                                                                    >
                                                                                        <MenuItem value="single">سنگل</MenuItem>
                                                                                        <MenuItem value="double">ڈبل</MenuItem>
                                                                                    </TextField>
                                                                                </Grid>
                                                                                <Grid item xs={12} sm={4}>
                                                                                    <Typography variant="caption" className="font-urdu" sx={{ fontWeight: 700, mb: 0.5, display: 'block', color: '#6d28d9' }}>شلوار کی قسم</Typography>
                                                                                    <TextField
                                                                                        select
                                                                                        required
                                                                                        size="small"
                                                                                        value={item.shalwarType}
                                                                                        onChange={(e) => {
                                                                                            const newItems = [...cartItems];
                                                                                            newItems[index].shalwarType = e.target.value;
                                                                                            setCartItems(newItems);
                                                                                        }}
                                                                                        sx={{ width: '300px', '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: '6px' } }}
                                                                                    >
                                                                                        <MenuItem value="pajama">پاجامہ</MenuItem>
                                                                                        <MenuItem value="shalwar">شلوار</MenuItem>
                                                                                        <MenuItem value="trouser">ٹراؤزر</MenuItem>
                                                                                    </TextField>
                                                                                </Grid>
                                                                                <Grid item xs={12} sm={4}>
                                                                                    <Box sx={{ display: 'flex', gap: 2, height: '100%', alignItems: 'flex-end', pb: 0.5 }}>
                                                                                        <FormControlLabel
                                                                                            control={
                                                                                                <Checkbox
                                                                                                    size="small"
                                                                                                    checked={item.hasShalwarPocket}
                                                                                                    onChange={(e) => {
                                                                                                        const newItems = [...cartItems];
                                                                                                        newItems[index].hasShalwarPocket = e.target.checked;
                                                                                                        setCartItems(newItems);
                                                                                                    }}
                                                                                                />
                                                                                            }
                                                                                            label={<Typography variant="caption" className="font-urdu" sx={{ fontWeight: 600 }}>شلوار جیب</Typography>}
                                                                                            sx={{ m: 0 }}
                                                                                        />
                                                                                        <FormControlLabel
                                                                                            control={
                                                                                                <Checkbox
                                                                                                    size="small"
                                                                                                    checked={item.hasFrontPockets}
                                                                                                    onChange={(e) => {
                                                                                                        const newItems = [...cartItems];
                                                                                                        newItems[index].hasFrontPockets = e.target.checked;
                                                                                                        setCartItems(newItems);
                                                                                                    }}
                                                                                                />
                                                                                            }
                                                                                            label={<Typography variant="caption" className="font-urdu" sx={{ fontWeight: 600 }}>سامنے والی جیبیں</Typography>}
                                                                                            sx={{ m: 0 }}
                                                                                        />
                                                                                    </Box>
                                                                                </Grid>
                                                                                <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                                                                                    <Button
                                                                                        variant="contained"
                                                                                        size="small"
                                                                                        startIcon={<Save size={16} />}
                                                                                        onClick={() => {
                                                                                            const newItems = [...cartItems];
                                                                                            newItems[index].isCollapsed = true;
                                                                                            setCartItems(newItems);

                                                                                            // Save as previous details for future suggestions
                                                                                            setPreviousStitchingDetails({
                                                                                                cuffType: newItems[index].cuffType,
                                                                                                pohnchaType: newItems[index].pohnchaType,
                                                                                                gheraType: newItems[index].gheraType,
                                                                                                galaType: newItems[index].galaType,
                                                                                                galaSize: newItems[index].galaSize,
                                                                                                pocketType: newItems[index].pocketType,
                                                                                                shalwarType: newItems[index].shalwarType,
                                                                                                hasShalwarPocket: newItems[index].hasShalwarPocket,
                                                                                                hasFrontPockets: newItems[index].hasFrontPockets
                                                                                            });
                                                                                        }}
                                                                                        sx={{ bgcolor: '#8b5cf6', '&:hover': { bgcolor: '#7c3aed' } }}
                                                                                        className="font-urdu"
                                                                                    >
                                                                                        تفصیلات محفوظ کریں
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
                                    <Button
                                        startIcon={<Plus size={16} />}
                                        onClick={handleAddRow}
                                        sx={{ mt: 1 }}
                                        size="small"
                                        className="font-urdu"
                                    >
                                        نیا کالم شامل کریں
                                    </Button>

                                    <Grid container spacing={2} sx={{ mt: 2, p: 2, bgcolor: '#f8fafc', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                                        <Grid item xs={12} md={6}>
                                            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Tailor</Typography>
                                            <Autocomplete
                                                options={tailors}
                                                getOptionLabel={(option) => option.name}
                                                value={tailors.find(t => t.id === formData.tailorId) || null}
                                                onChange={(event, newValue) => {
                                                    setFormData({ ...formData, tailorId: newValue ? newValue.id : "" });
                                                }}
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        placeholder="Select Tailor"
                                                        size="small"
                                                        fullWidth
                                                        required
                                                        sx={{
                                                            minWidth: 300,
                                                            '& .MuiOutlinedInput-root': {
                                                                bgcolor: 'white',
                                                                borderRadius: '10px',
                                                                '& fieldset': { borderColor: '#e5e7eb' },
                                                                '&:hover fieldset': { borderColor: '#8b5cf6' },
                                                                '&.Mui-focused fieldset': { borderColor: '#8b5cf6' },
                                                            }
                                                        }}
                                                    />
                                                )}
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Cutter</Typography>
                                            <Autocomplete
                                                options={cutters}
                                                getOptionLabel={(option) => option.name}
                                                value={cutters.find(c => c.id === formData.cutterId) || null}
                                                onChange={(event, newValue) => {
                                                    setFormData({ ...formData, cutterId: newValue ? newValue.id : "" });
                                                }}
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        placeholder="Select Cutter"
                                                        size="small"
                                                        fullWidth
                                                        required
                                                        sx={{
                                                            minWidth: 300,
                                                            '& .MuiOutlinedInput-root': {
                                                                bgcolor: 'white',
                                                                borderRadius: '10px',
                                                                '& fieldset': { borderColor: '#e5e7eb' },
                                                                '&:hover fieldset': { borderColor: '#8b5cf6' },
                                                                '&.Mui-focused fieldset': { borderColor: '#8b5cf6' },
                                                            }
                                                        }}
                                                    />
                                                )}
                                            />
                                        </Grid>
                                    </Grid>
                                </Box>

                                {/* Totals Section */}
                                <Grid container spacing={2} sx={{ mt: 2 }}>
                                    <Grid item xs={12} md={6}>
                                        <Box sx={{ mb: 1.5, display: 'inline-flex', alignItems: 'center', gap: 1.5, borderLeft: '4px solid #8b5cf6', pl: 1.5 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#1f2937', fontSize: '0.95rem', letterSpacing: '0.01em' }}>
                                                Remarks
                                            </Typography>
                                        </Box>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            name="notes"
                                            placeholder="e.g. Urgent delivery required, special stitching request..."
                                            multiline
                                            rows={3}
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
                                    <Grid item xs={12} md={6}>
                                        <Card variant="outlined" sx={{ p: 2, bgcolor: '#f0fdf4' }}>
                                            <Grid container spacing={2}>
                                                <Grid item xs={6}>
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Total Amount:</Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography variant="body2" sx={{ fontWeight: 700, textAlign: 'right' }}>
                                                        Rs. {totalAmount.toFixed(2)}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Advance Received</Typography>
                                                    <TextField
                                                        fullWidth
                                                        size="small"
                                                        required
                                                        placeholder="0.00"
                                                        value={formData.advanceAmount}
                                                        onChange={(e) => setFormData({ ...formData, advanceAmount: e.target.value })}
                                                        InputProps={{
                                                            startAdornment: <InputAdornment position="start">Rs.</InputAdornment>,
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
                                                <Grid item xs={6}>
                                                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Balance</Typography>
                                                    <TextField
                                                        fullWidth
                                                        size="small"
                                                        value={balanceAmount.toFixed(2)}
                                                        disabled
                                                        InputProps={{
                                                            startAdornment: <InputAdornment position="start">Rs.</InputAdornment>,
                                                        }}
                                                        sx={{
                                                            '& .MuiOutlinedInput-root': {
                                                                bgcolor: balanceAmount > 0 ? '#fee2e2' : '#f0fdf4',
                                                                borderRadius: '10px',
                                                                border: balanceAmount > 0 ? '2px solid #ef4444' : '1px solid #e5e7eb',
                                                                '& .MuiInputBase-input': {
                                                                    fontWeight: 800,
                                                                    fontSize: '1.1rem',
                                                                    color: balanceAmount > 0 ? '#b91c1c' : '#059669',
                                                                    textAlign: 'center'
                                                                }
                                                            }
                                                        }}
                                                    />
                                                </Grid>
                                            </Grid>
                                        </Card>
                                    </Grid>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Box>
                </Card>
            </Box>
        );
    }

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3,
                gap: 2
            }}>
                <TextField
                    placeholder="Search by customer or booking number..."
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
                    onClick={() => setShowForm(true)}
                    sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        px: 3,
                        py: 1,
                        bgcolor: '#8b5cf6',
                        '&:hover': { bgcolor: '#7c3aed' }
                    }}
                >
                    New Booking
                </Button>
            </Box>

            <TableContainer component={Paper} elevation={0} sx={{
                borderRadius: 3,
                border: '1px solid #e5e7eb',
                overflow: 'hidden'
            }}>
                <Table sx={{ minWidth: 650 }}>
                    <TableHead sx={{ bgcolor: '#f9fafb' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Booking #</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Dates</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Delivery Date</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredBookings.length > 0 ? (
                            filteredBookings.map((booking) => (
                                <TableRow
                                    key={booking.id}
                                    sx={{ '&:hover': { bgcolor: '#f3f4f6' }, transition: 'background-color 0.2s' }}
                                >
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                                            {booking.bookingNumber}
                                        </Typography>
                                        <Chip
                                            label={booking.bookingType}
                                            size="small"
                                            sx={{
                                                mt: 0.5,
                                                height: 18,
                                                fontSize: '0.65rem',
                                                bgcolor: booking.bookingType === 'SUIT' ? '#dbeafe' : '#fef3c7',
                                                color: booking.bookingType === 'SUIT' ? '#1e40af' : '#92400e'
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <User size={16} className="text-zinc-400" />
                                            <Box>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                    {booking.customer?.name}
                                                </Typography>
                                                <Typography variant="caption" color="textSecondary">
                                                    {booking.customer?.phone}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                            <Typography variant="caption">
                                                Booked: {new Date(booking.bookingDate).toLocaleDateString()}
                                            </Typography>
                                            {booking.returnDate && (
                                                <Typography variant="caption" color="primary">
                                                    Return: {new Date(booking.returnDate).toLocaleDateString()}
                                                </Typography>
                                            )}
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            select
                                            size="small"
                                            value={booking.status}
                                            onChange={(e) => handleStatusUpdate(booking.id, e.target.value)}
                                            sx={{
                                                minWidth: 150,
                                                '& .MuiOutlinedInput-root': {
                                                    bgcolor: getStatusColor(booking.status) + '20',
                                                    color: getStatusColor(booking.status),
                                                    fontWeight: 600,
                                                    fontSize: '0.75rem'
                                                }
                                            }}
                                        >
                                            {BOOKING_STATUSES.map((status) => (
                                                <MenuItem key={status.value} value={status.value}>
                                                    {status.label}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {booking.deliveryDate ? new Date(booking.deliveryDate).toLocaleDateString() : '-'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Box>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                Rs. {parseFloat(booking.totalAmount).toFixed(2)}
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                Advance: Rs. {parseFloat(booking.advanceAmount).toFixed(2)}
                                            </Typography>
                                            <Typography variant="caption" sx={{ display: 'block', color: '#dc2626', fontWeight: 500 }}>
                                                Remaining: Rs. {parseFloat(booking.remainingAmount).toFixed(2)}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                            <Tooltip title="View Details">
                                                <IconButton size="small" sx={{ color: '#3b82f6' }} onClick={() => handleViewBooking(booking)}>
                                                    <Eye size={18} />
                                                </IconButton>
                                            </Tooltip>

                                            <Tooltip title="Print Details">
                                                <IconButton
                                                    size="small"
                                                    color="primary"
                                                    onClick={() => handlePrintClick(booking)}
                                                >
                                                    <Printer size={18} />
                                                </IconButton>
                                            </Tooltip>
                                            <IconButton size="small" color="error" onClick={() => handleDelete(booking.id)}>
                                                <Trash2 size={18} />
                                            </IconButton>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                                    <Typography color="textSecondary">No bookings found.</Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* View Details Dialog */}
            <Dialog open={printDialogOpen} onClose={() => setPrintDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Select Print Option</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        <Button
                            variant="outlined"
                            size="large"
                            startIcon={<BookText />}
                            onClick={() => handlePrintConfirm('BILL')}
                            sx={{ justifyContent: 'flex-start', py: 2 }}
                        >
                            Print Bill / Invoice
                        </Button>
                        <Button
                            variant="outlined"
                            size="large"
                            startIcon={<Ruler />}
                            onClick={() => handlePrintConfirm('STITCHING')}
                            sx={{ justifyContent: 'flex-start', py: 2 }}
                        >
                            Print Stitching Details
                        </Button>
                    </Box>
                </DialogContent>
            </Dialog>

            <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Booking Details</DialogTitle>
                <DialogContent>
                    {selectedBooking && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', bgcolor: '#f5f3ff', p: 2, borderRadius: 2 }}>
                                <Box>
                                    <Typography variant="subtitle2" color="textSecondary">Booking Number</Typography>
                                    <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>{selectedBooking.bookingNumber}</Typography>
                                </Box>
                                <Box sx={{ textAlign: 'right' }}>
                                    <Typography variant="subtitle2" color="textSecondary">Status</Typography>
                                    <Chip label={selectedBooking.status} color="primary" variant="outlined" size="small" />
                                </Box>
                            </Box>

                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <Card variant="outlined" sx={{ p: 2 }}>
                                        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <User size={18} /> Customer Info
                                        </Typography>
                                        <Typography variant="body2">Name: {selectedBooking.customer?.name}</Typography>
                                        <Typography variant="body2">Phone: {selectedBooking.customer?.phone}</Typography>
                                        <Typography variant="body2">Email: {selectedBooking.customer?.email}</Typography>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Card variant="outlined" sx={{ p: 2 }}>
                                        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Calendar size={18} /> Dates
                                        </Typography>
                                        <Typography variant="body2">Booked: {new Date(selectedBooking.bookingDate).toLocaleDateString()}</Typography>
                                        <Typography variant="body2">Delivery: {selectedBooking.deliveryDate ? new Date(selectedBooking.deliveryDate).toLocaleDateString() : 'N/A'}</Typography>
                                        <Typography variant="body2">Trial: {selectedBooking.trialDate ? new Date(selectedBooking.trialDate).toLocaleDateString() : 'N/A'}</Typography>
                                    </Card>
                                </Grid>
                            </Grid>

                            {/* Additional Info: Tailor & Cutter */}
                            <Grid container spacing={3} sx={{ mt: 1 }}>
                                <Grid item xs={12} md={6}>
                                    <Card variant="outlined" sx={{ p: 2 }}>
                                        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>Tailor Details</Typography>
                                        {selectedBooking.tailor ? (
                                            <Box>
                                                <Typography variant="body2">Name: {selectedBooking.tailor.name}</Typography>
                                                <Typography variant="body2" color="textSecondary">Role: {selectedBooking.tailor.role}</Typography>
                                            </Box>
                                        ) : (
                                            <Typography variant="body2" color="textSecondary">Not Assigned</Typography>
                                        )}
                                    </Card>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Card variant="outlined" sx={{ p: 2 }}>
                                        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>Cutter Details</Typography>
                                        {selectedBooking.cutter ? (
                                            <Box>
                                                <Typography variant="body2">Name: {selectedBooking.cutter.name}</Typography>
                                                <Typography variant="body2" color="textSecondary">Role: {selectedBooking.cutter.role}</Typography>
                                            </Box>
                                        ) : (
                                            <Typography variant="body2" color="textSecondary">Not Assigned</Typography>
                                        )}
                                    </Card>
                                </Grid>
                            </Grid>

                            {/* Removed global stitching display */}

                            <Divider>ITEMS</Divider>
                            <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                    <TableHead sx={{ bgcolor: '#f9fafb' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }} align="right">Qty</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }} align="right">Price</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }} align="right">Discount</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }} align="right">Discounted Price</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }} align="right">Final Price</TableCell>
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
                                                        <TableCell sx={{ fontWeight: 600 }}>{item.product?.name}</TableCell>
                                                        <TableCell align="right">{item.quantity}</TableCell>
                                                        <TableCell align="right">Rs. {unitPrice.toFixed(2)}</TableCell>
                                                        <TableCell align="right">Rs. {discount.toFixed(2)}</TableCell>
                                                        <TableCell align="right">Rs. {discountedPrice.toFixed(2)}</TableCell>
                                                        <TableCell align="right">Rs. {parseFloat(item.totalPrice).toFixed(2)}</TableCell>
                                                    </TableRow>
                                                    {(item.cuffType || item.pohnchaType || item.galaType) && (
                                                        <TableRow>
                                                            <TableCell colSpan={6} sx={{ bgcolor: '#f8fafc', py: 1 }}>
                                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, px: 2 }}>
                                                                    {item.cuffType && <Typography variant="caption"><strong>کف:</strong> {item.cuffType}</Typography>}
                                                                    {item.pohnchaType && <Typography variant="caption"><strong>پائنچہ:</strong> {item.pohnchaType}</Typography>}
                                                                    {item.galaType && <Typography variant="caption"><strong>گالہ:</strong> {item.galaType === 'ban' ? 'بین' : 'کالر'} ({item.galaSize})</Typography>}
                                                                    {item.gheraType && <Typography variant="caption"><strong>گھیرا:</strong> {item.gheraType === 'seedha' ? 'سیدھا' : 'گول'}</Typography>}
                                                                    {item.shalwarType && <Typography variant="caption"><strong>شلوار:</strong> {item.shalwarType}</Typography>}
                                                                    <Typography variant="caption"><strong>شلوار جیب:</strong> {item.hasShalwarPocket ? 'جی ہاں' : 'نہیں'}</Typography>
                                                                    <Typography variant="caption"><strong>سامنے والی جیبیں:</strong> {item.hasFrontPockets ? 'جی ہاں' : 'نہیں'}</Typography>
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

                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
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
                <DialogActions>
                    <Button onClick={() => setViewOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={!!error || !!successMessage}
                autoHideDuration={6000}
                onClose={() => { setError(""); setSuccessMessage(""); }}
            >
                <Alert severity={error ? "error" : "success"}>
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
                                <Typography variant="h4" fontWeight="bold">Tailor App</Typography>
                                <Typography variant="body2">Booking Invoice</Typography>
                            </Box>

                            <Grid container spacing={2} sx={{ mb: 4 }}>
                                <Grid item xs={6}>
                                    <Typography variant="subtitle2" fontWeight="bold">Customer Info</Typography>
                                    <Typography variant="body2">{printBooking.customer?.name}</Typography>
                                    <Typography variant="body2">{printBooking.customer?.phone}</Typography>
                                </Grid>
                                <Grid item xs={6} sx={{ textAlign: 'right' }}>
                                    <Typography variant="subtitle2" fontWeight="bold">Booking Info</Typography>
                                    <Typography variant="body2">No: {printBooking.bookingNumber}</Typography>
                                    <Typography variant="body2">Date: {new Date(printBooking.bookingDate).toLocaleDateString()}</Typography>
                                    <Typography variant="body2">Delivery: {printBooking.deliveryDate ? new Date(printBooking.deliveryDate).toLocaleDateString() : '-'}</Typography>
                                </Grid>
                            </Grid>

                            <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell><strong>Product</strong></TableCell>
                                            <TableCell align="right"><strong>Qty</strong></TableCell>
                                            <TableCell align="right"><strong>Price</strong></TableCell>
                                            <TableCell align="right"><strong>Total</strong></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {printBooking.items?.map((item, idx) => (
                                            <React.Fragment key={idx}>
                                                <TableRow>
                                                    <TableCell>{item.product?.name}</TableCell>
                                                    <TableCell align="right">{item.quantity}</TableCell>
                                                    <TableCell align="right">{parseFloat(item.unitPrice).toFixed(2)}</TableCell>
                                                    <TableCell align="right">{parseFloat(item.totalPrice).toFixed(2)}</TableCell>
                                                </TableRow>
                                            </React.Fragment>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
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
                            dir="rtl"
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
                                <Typography variant="subtitle1" fontWeight="bold">سلائی آرڈر (Booking #{printBooking.bookingNumber})</Typography>
                            </Box>

                            <Box sx={{ mb: 2, pb: 1 }}>
                                <Grid container spacing={1}>
                                    <Grid item xs={12}>
                                        <Typography variant="body1"><strong>نام کسٹمر:</strong> {printBooking.customer?.name || ''}</Typography>
                                    </Grid>
                                    <Grid item xs={12} sx={{ minHeight: '3em' }}>
                                        <Typography variant="body1"><strong>پتہ:</strong> {printBooking.customer?.address || ''}</Typography>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Typography variant="body1"><strong>فون نمبر:</strong> {printBooking.customer?.phone || ''}</Typography>
                                    </Grid>
                                </Grid>
                            </Box>

                            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', pb: 1 }}>
                                <Typography variant="body1"><strong>تاریخ بکنگ:</strong> {printBooking.bookingDate ? new Date(printBooking.bookingDate).toLocaleDateString() : ''}</Typography>
                                <Typography variant="body1"><strong>تاریخ حوالگی:</strong> {printBooking.deliveryDate ? new Date(printBooking.deliveryDate).toLocaleDateString() : ''}</Typography>
                            </Box>

                            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', pb: 1 }}>
                                <Typography variant="body1"><strong>کٹر:</strong> {employees?.find(e => e.id === printBooking.cutterId)?.name || ''}</Typography>
                                <Typography variant="body1"><strong>کیریگر (درزی):</strong> {employees?.find(e => e.id === printBooking.tailorId)?.name || ''}</Typography>
                            </Box>

                            {/* MERGED MEASUREMENTS AND STITCHING DETAILS TABLE */}
                            <TableContainer component={Box} sx={{ mb: 2 }}>
                                <Table size="small" sx={{ border: '1px solid #000' }}>
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: '#f3f4f6' }}>
                                            <TableCell sx={{ border: '1px solid #000', fontWeight: 'bold', textAlign: 'right' }}>تفصیل (Detail)</TableCell>
                                            <TableCell sx={{ border: '1px solid #000', fontWeight: 'bold', textAlign: 'right' }}>پیمائش / سلائی (Measurement / Stitching)</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {printBooking.items?.map((item, idx) => (
                                            <React.Fragment key={idx}>
                                                {/* Product Header if more than 1 item */}
                                                {printBooking.items.length > 1 && (
                                                    <TableRow>
                                                        <TableCell colSpan={2} sx={{ border: '1px solid #000', fontWeight: 'bold', bgcolor: '#f9fafb', textAlign: 'center' }}>
                                                            {item.product?.name} (تعداد: {item.quantity})
                                                        </TableCell>
                                                    </TableRow>
                                                )}

                                                {/* Measurements & Related Stitching Details */}
                                                {true && (
                                                    <>
                                                        <TableRow>
                                                            <TableCell sx={{ border: '1px solid #000', textAlign: 'right' }}>لمبائی (Length)</TableCell>
                                                            <TableCell sx={{ border: '1px solid #000', textAlign: 'right' }}>{customerMeasurements?.qameez_lambai || ''}</TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell sx={{ border: '1px solid #000', textAlign: 'right' }}>تیرا (Shoulder)</TableCell>
                                                            <TableCell sx={{ border: '1px solid #000', textAlign: 'right' }}>{customerMeasurements?.teera || ''}</TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell sx={{ border: '1px solid #000', textAlign: 'right' }}>بازو (Sleeve) / کف</TableCell>
                                                            <TableCell sx={{ border: '1px solid #000', textAlign: 'right' }}>
                                                                {customerMeasurements?.bazoo || ''}
                                                                {item.cuffType ? ` (${item.cuffType === 'single' ? 'سنگل' : item.cuffType === 'double folding' ? 'ڈبل' : item.cuffType === 'open sleeve' ? 'کھلی آستین' : item.cuffType})` : ''}
                                                            </TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell sx={{ border: '1px solid #000', textAlign: 'right' }}>گلہ (Neck) / گالہ</TableCell>
                                                            <TableCell sx={{ border: '1px solid #000', textAlign: 'right' }}>
                                                                {customerMeasurements?.galaa || ''}
                                                                {item.galaType ? ` (${item.galaType === 'ban' ? 'بین' : 'کالر'}${item.galaSize ? ` : ${item.galaSize}` : ''})` : ''}
                                                            </TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell sx={{ border: '1px solid #000', textAlign: 'right' }}>چھاتی (Chest)</TableCell>
                                                            <TableCell sx={{ border: '1px solid #000', textAlign: 'right' }}>{customerMeasurements?.chaati || ''}</TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell sx={{ border: '1px solid #000', textAlign: 'right' }}>کمر (Waist)</TableCell>
                                                            <TableCell sx={{ border: '1px solid #000', textAlign: 'right' }}>{customerMeasurements?.kamar_around || ''}</TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell sx={{ border: '1px solid #000', textAlign: 'right' }}>گھیرا (Daman)</TableCell>
                                                            <TableCell sx={{ border: '1px solid #000', textAlign: 'right' }}>
                                                                {customerMeasurements?.gheera || ''}
                                                                {item.gheraType ? ` (${item.gheraType === 'seedha' ? 'سیدھا' : 'گول'})` : ''}
                                                            </TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell sx={{ border: '1px solid #000', textAlign: 'right' }}>شلوار لمبائی (Shalwar Length)</TableCell>
                                                            <TableCell sx={{ border: '1px solid #000', textAlign: 'right' }}>{customerMeasurements?.shalwar_lambai || ''}</TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell sx={{ border: '1px solid #000', textAlign: 'right' }}>پائنچہ (Bottom)</TableCell>
                                                            <TableCell sx={{ border: '1px solid #000', textAlign: 'right' }}>
                                                                {customerMeasurements?.puhncha || ''}
                                                                {item.pohnchaType ? ` (${item.pohnchaType === 'saada' ? 'سادہ' : item.pohnchaType === 'jaali' ? 'جالی والا' : item.pohnchaType === 'karhaai' ? 'کڑھائی والا' : 'جالی بمعہ کڑھائی'})` : ''}
                                                            </TableCell>
                                                        </TableRow>
                                                    </>
                                                )}

                                                {/* Stitching Only Details */}
                                                <TableRow>
                                                    <TableCell sx={{ border: '1px solid #000', textAlign: 'right' }}>جیب (Pocket)</TableCell>
                                                    <TableCell sx={{ border: '1px solid #000', textAlign: 'right' }}>{item.pocketType === 'single' ? 'سنگل' : (item.pocketType === 'double' ? 'ڈبل' : '')}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell sx={{ border: '1px solid #000', textAlign: 'right' }}>سامنے والی جیب (Front Pocket)</TableCell>
                                                    <TableCell sx={{ border: '1px solid #000', textAlign: 'right' }}>{item.hasFrontPockets ? 'جی ہاں (Yes)' : ''}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell sx={{ border: '1px solid #000', textAlign: 'right' }}>شلوار جیب (Shalwar Pocket)</TableCell>
                                                    <TableCell sx={{ border: '1px solid #000', textAlign: 'right' }}>{item.hasShalwarPocket ? 'جی ہاں (Yes)' : ''}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell sx={{ border: '1px solid #000', textAlign: 'right' }}>شلوار کی قسم (Shalwar Type)</TableCell>
                                                    <TableCell sx={{ border: '1px solid #000', textAlign: 'right' }}>{item.shalwarType === 'pajama' ? 'پاجامہ' : (item.shalwarType === 'shalwar' ? 'شلوار' : '')}</TableCell>
                                                </TableRow>
                                            </React.Fragment>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            {/* NOTE SECTION */}
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="body1"><strong>نوٹ (Note):</strong></Typography>
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
