"use client";

import { useState } from "react";
import Link from "next/link";
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
    InputAdornment,
    Tooltip,
    Card,
    Grid,
    CircularProgress,
    Alert,
    Snackbar,
    MenuItem,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from "@mui/material";
import {
    Edit,
    Trash2,
    Search,
    UserPlus,
    Phone,
    MapPin,
    Ruler,
    Save,
    Plus,
    X as XIcon,
    User,
    Users,
    Mail,
    Hash
} from "lucide-react";
import { Autocomplete } from "@mui/material";

export default function CustomerManagementClient({ initialCustomers, accountCategories }) {
    const [customers, setCustomers] = useState(initialCustomers);
    const [categories, setCategories] = useState(accountCategories);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterCategory, setFilterCategory] = useState(null);

    // Quick Add Category State
    const [quickAddCatOpen, setQuickAddCatOpen] = useState(false);
    const [newCatName, setNewCatName] = useState("");
    const [newCatLoading, setNewCatLoading] = useState(false);

    // UI States
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        fatherName: "",
        phone: "",
        email: "",
        address: "",
        code: "",
        accountCategoryId: categories.length > 0 ? categories[0].id : null,
        notes: "",
        balance: 0
    });

    const resetForm = () => {
        setFormData({
            name: "",
            fatherName: "",
            phone: "",
            address: "",
            code: "",
            accountCategoryId: categories.length > 0 ? categories[0].id : null,
            notes: "",
            balance: 0
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

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === "phone") {
            // Only allow numerical values
            if (value === "" || /^[0-9]+$/.test(value)) {
                setFormData(prev => ({ ...prev, [name]: value }));
            }
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const isEditing = formData.id;
            const url = isEditing ? `/api/customers/${formData.id}` : "/api/customers";
            const method = isEditing ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || `Failed to ${isEditing ? 'update' : 'create'} customer`);
            }

            const savedCustomer = await response.json();

            // Update local state
            if (isEditing) {
                setCustomers(prev => prev.map(c => c.id === savedCustomer.id ? savedCustomer : c));
                setSuccessMessage("Customer updated successfully!");
            } else {
                setCustomers(prev => [savedCustomer, ...prev]);
                setSuccessMessage("Customer added successfully!");
            }

            setShowForm(false);
            resetForm();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleQuickAddCategory = async () => {
        if (!newCatName.trim()) return;
        setNewCatLoading(true);
        try {
            const response = await fetch("/api/account-categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newCatName }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to add category");
            }

            const savedCat = await response.json();
            setCategories(prev => [...prev, savedCat].sort((a, b) => a.name.localeCompare(b.name)));
            setFormData(prev => ({ ...prev, accountCategoryId: savedCat.id }));
            setSuccessMessage("Category added successfully!");
            setQuickAddCatOpen(false);
            setNewCatName("");
        } catch (err) {
            setError(err.message);
        } finally {
            setNewCatLoading(false);
        }
    };

    const handleEdit = (customer) => {
        setFormData({
            id: customer.id,
            name: customer.name,
            fatherName: customer.fatherName || "",
            phone: customer.phone || "",
            address: customer.address || "",
            code: customer.code || "",
            accountCategoryId: customer.accountCategoryId || (categories.length > 0 ? categories[0].id : null),
            notes: customer.notes || "",
            balance: customer.balance || 0
        });
        setShowForm(true);
    };

    const handleDelete = async (customerId) => {
        if (!confirm("Are you sure you want to delete this customer?")) return;
        setError(""); // Clear previous errors

        try {
            const response = await fetch(`/api/customers/${customerId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const data = await response.json();
                if (response.status === 404) {
                    // Customer already gone, remove from UI
                    setCustomers(prev => prev.filter(c => c.id !== customerId));
                    setSuccessMessage("Customer was already deleted.");
                    return;
                }
                throw new Error(data.error || "Failed to delete customer");
            }

            setCustomers(prev => prev.filter(c => c.id !== customerId));
            setSuccessMessage("Customer deleted successfully!");
        } catch (err) {
            setError(err.message);
        }
    };

    const filteredCustomers = customers.filter(customer => {
        const matchesSearch =
            customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            customer.phone?.includes(searchQuery) ||
            customer.code?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory = !filterCategory || customer.accountCategoryId === filterCategory.id;

        return matchesSearch && matchesCategory;
    });

    // Calculate stats for summary cards
    const categoryStats = categories.map(cat => ({
        ...cat,
        count: customers.filter(c => c.accountCategoryId === cat.id).length
    }));

    if (showForm) {
        return (
            <Box sx={{ width: '100%', bgcolor: '#f9fafb', minHeight: '100vh', p: 3 }}>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <Card sx={{ mb: 2 }}>
                    <Box sx={{ p: 2, bgcolor: '#8b5cf6', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {formData.id ? 'EDIT CUSTOMER' : 'NEW CUSTOMER'}
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
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Full name</Typography>
                                <TextField
                                    fullWidth
                                    name="name"
                                    required
                                    placeholder="e.g. John Doe"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    variant="outlined"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <User size={18} color="#9ca3af" />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: 'white',
                                            borderRadius: '10px',
                                            '& fieldset': { borderColor: '#e5e7eb' },
                                            '&:hover fieldset': { borderColor: '#8b5cf6' },
                                            '&.Mui-focused fieldset': { borderColor: '#8b5cf6' },
                                        }
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Father Name</Typography>
                                <TextField
                                    fullWidth
                                    name="fatherName"
                                    placeholder="e.g. Robert Doe"
                                    value={formData.fatherName || ""}
                                    onChange={handleInputChange}
                                    variant="outlined"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Users size={18} color="#9ca3af" />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: 'white',
                                            borderRadius: '10px',
                                            '& fieldset': { borderColor: '#e5e7eb' },
                                            '&:hover fieldset': { borderColor: '#8b5cf6' },
                                            '&.Mui-focused fieldset': { borderColor: '#8b5cf6' },
                                        }
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Phone number</Typography>
                                <TextField
                                    fullWidth
                                    name="phone"
                                    placeholder="111-222-3333"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    variant="outlined"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 1 }}>
                                                    <Typography sx={{ fontSize: '1.2rem' }}>🇵🇰</Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151' }}>+92</Typography>
                                                    <Box sx={{ ml: 1, mr: 1, height: '20px', width: '1px', bgcolor: '#e5e7eb' }} />
                                                </Box>
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: 'white',
                                            borderRadius: '10px',
                                            '& fieldset': { borderColor: '#e5e7eb' },
                                            '&:hover fieldset': { borderColor: '#8b5cf6' },
                                            '&.Mui-focused fieldset': { borderColor: '#8b5cf6' },
                                        }
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Email Address</Typography>
                                <TextField
                                    fullWidth
                                    name="email"
                                    placeholder="e.g. john@example.com"
                                    value={formData.email || ""}
                                    onChange={handleInputChange}
                                    variant="outlined"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Mail size={18} color="#9ca3af" />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: 'white',
                                            borderRadius: '10px',
                                            '& fieldset': { borderColor: '#e5e7eb' },
                                            '&:hover fieldset': { borderColor: '#8b5cf6' },
                                            '&.Mui-focused fieldset': { borderColor: '#8b5cf6' },
                                        }
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Customer Code (Optional)</Typography>
                                <TextField
                                    fullWidth
                                    name="code"
                                    placeholder="e.g. CUST-001"
                                    value={formData.code}
                                    onChange={handleInputChange}
                                    variant="outlined"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Hash size={18} color="#9ca3af" />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: 'white',
                                            borderRadius: '10px',
                                            '& fieldset': { borderColor: '#e5e7eb' },
                                            '&:hover fieldset': { borderColor: '#8b5cf6' },
                                            '&.Mui-focused fieldset': { borderColor: '#8b5cf6' },
                                        }
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>
                                    {formData.id ? 'Current Balance' : 'Opening Balance'}
                                </Typography>
                                <TextField
                                    fullWidth
                                    name="balance"
                                    type="number"
                                    placeholder="0.00"
                                    value={formData.balance}
                                    onChange={handleInputChange}
                                    variant="outlined"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151' }}>Rs.</Typography>
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: 'white',
                                            borderRadius: '10px',
                                            '& fieldset': { borderColor: '#e5e7eb' },
                                            '&:hover fieldset': { borderColor: '#8b5cf6' },
                                            '&.Mui-focused fieldset': { borderColor: '#8b5cf6' },
                                        }
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Account Category</Typography>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Autocomplete
                                        fullWidth
                                        options={categories}
                                        getOptionLabel={(option) => option.name || ""}
                                        value={categories.find(c => c.id === formData.accountCategoryId) || null}
                                        onChange={(event, newValue) => {
                                            setFormData(prev => ({
                                                ...prev,
                                                accountCategoryId: newValue ? newValue.id : null
                                            }));
                                        }}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                variant="outlined"
                                                placeholder="Select category"
                                                sx={{
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
                                    <Tooltip title="Add New Category">
                                        <IconButton
                                            onClick={() => setQuickAddCatOpen(true)}
                                            sx={{
                                                bgcolor: '#8b5cf6',
                                                color: 'white',
                                                borderRadius: '10px',
                                                '&:hover': { bgcolor: '#7c3aed' }
                                            }}
                                        >
                                            <Plus size={20} />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Box sx={{ mb: 1.5, display: 'inline-flex', alignItems: 'center', gap: 1.5, borderLeft: '4px solid #8b5cf6', pl: 1.5 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#1f2937', fontSize: '0.95rem', letterSpacing: '0.01em' }}>
                                        Address
                                    </Typography>
                                </Box>
                                <TextField
                                    fullWidth
                                    name="address"
                                    placeholder="e.g. 123 Street, City"
                                    multiline
                                    rows={4}
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    variant="outlined"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: 'white',
                                            borderRadius: '12px',
                                            '& fieldset': { borderColor: '#e5e7eb' },
                                            '&:hover fieldset': { borderColor: '#8b5cf6' },
                                            '&.Mui-focused fieldset': { borderColor: '#8b5cf6' },
                                        }
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Box sx={{ mb: 1.5, display: 'inline-flex', alignItems: 'center', gap: 1.5, borderLeft: '4px solid #8b5cf6', pl: 1.5 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#1f2937', fontSize: '0.95rem', letterSpacing: '0.01em' }}>
                                        Notes
                                    </Typography>
                                </Box>
                                <TextField
                                    fullWidth
                                    name="notes"
                                    placeholder="e.g. Any special instructions..."
                                    multiline
                                    rows={4}
                                    value={formData.notes}
                                    onChange={handleInputChange}
                                    variant="outlined"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: 'white',
                                            borderRadius: '12px',
                                            '& fieldset': { borderColor: '#e5e7eb' },
                                            '&:hover fieldset': { borderColor: '#8b5cf6' },
                                            '&.Mui-focused fieldset': { borderColor: '#8b5cf6' },
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
            {error && (
                <Alert
                    severity="error"
                    sx={{ mb: 2, borderRadius: 2 }}
                    onClose={() => setError("")}
                >
                    {error}
                </Alert>
            )}
            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={3}>
                    <Card sx={{
                        p: 2.5,
                        borderRadius: 3,
                        bgcolor: 'white',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}>
                        <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 600, mb: 1 }}>Total Customers</Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h4" sx={{ fontWeight: 800, color: '#111827' }}>{customers.length}</Typography>
                            <Avatar sx={{ bgcolor: '#f5f3ff', color: '#8b5cf6' }}>
                                <Users size={20} />
                            </Avatar>
                        </Box>
                    </Card>
                </Grid>
                {categoryStats.slice(0, 3).map((stat, idx) => (
                    <Grid item xs={12} md={3} key={stat.id}>
                        <Card sx={{
                            p: 2.5,
                            borderRadius: 3,
                            bgcolor: 'white',
                            border: '1px solid #e5e7eb',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                        }}>
                            <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 600, mb: 1 }}>{stat.name}</Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="h4" sx={{ fontWeight: 800, color: '#111827' }}>{stat.count}</Typography>
                                <Avatar sx={{
                                    bgcolor: idx === 0 ? '#ecfdf5' : (idx === 1 ? '#eff6ff' : '#fff7ed'),
                                    color: idx === 0 ? '#10b981' : (idx === 1 ? '#3b82f6' : '#f59e0b')
                                }}>
                                    <User size={20} />
                                </Avatar>
                            </Box>
                        </Card>
                    </Grid>
                ))}
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
                        placeholder="Search customers by name, phone or code..."
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
                    <Autocomplete
                        options={categories}
                        getOptionLabel={(option) => option.name}
                        value={filterCategory}
                        onChange={(e, newValue) => setFilterCategory(newValue)}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Filter by Category"
                                size="small"
                                sx={{ width: 250, bgcolor: 'white' }}
                            />
                        )}
                        sx={{ borderRadius: 2 }}
                    />
                </Box>
                <Button
                    variant="contained"
                    startIcon={<UserPlus size={18} />}
                    onClick={handleOpen}
                    sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        px: 3,
                        py: 1,
                        bgcolor: '#8b5cf6', // Matching header color
                        '&:hover': { bgcolor: '#7c3aed' }
                    }}
                >
                    Add New Customer
                </Button>
            </Box>

            {/* Customers Table */}
            <TableContainer component={Paper} elevation={0} sx={{
                borderRadius: 3,
                border: '1px solid #e5e7eb',
                overflow: 'hidden'
            }}>
                <Table sx={{ minWidth: 650 }}>
                    <TableHead sx={{ bgcolor: '#f9fafb' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 600, width: '25%' }}>Customer Info</TableCell>
                            <TableCell sx={{ fontWeight: 600, width: '12%' }}>Code</TableCell>
                            <TableCell sx={{ fontWeight: 600, width: '15%' }}>Current Balance</TableCell>
                            <TableCell sx={{ fontWeight: 600, width: '25%' }}>Contact Details</TableCell>
                            <TableCell sx={{ fontWeight: 600, width: '23%' }}>Address</TableCell>
                            <TableCell sx={{ fontWeight: 600, width: '15%' }} align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredCustomers.length > 0 ? (
                            filteredCustomers.map((customer) => (
                                <TableRow
                                    key={customer.id}
                                    sx={{ '&:hover': { bgcolor: '#f3f4f6' }, transition: 'background-color 0.2s' }}
                                >
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Avatar sx={{
                                                bgcolor: '#8b5cf6',
                                                width: 40,
                                                height: 40,
                                                fontWeight: 600
                                            }}>
                                                {customer.name.charAt(0)}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                    {customer.name}
                                                </Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                                    <Chip
                                                        label={customer.accountCategory?.name || 'N/A'}
                                                        size="small"
                                                        sx={{
                                                            height: 20,
                                                            fontSize: '0.65rem',
                                                            fontWeight: 600,
                                                            bgcolor: '#f3f4f6',
                                                            color: '#374151'
                                                        }}
                                                    />
                                                </Box>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600, color: '#374151' }}>
                                            {customer.code || 'N/A'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Tooltip title="View Ledger">
                                            <Typography
                                                variant="body2"
                                                component={Link}
                                                href={`/dashboard/ledger?customerId=${customer.id}`}
                                                sx={{
                                                    fontWeight: 700,
                                                    color: customer.balance > 0 ? '#ef4444' : (customer.balance < 0 ? '#22c55e' : '#374151'),
                                                    textDecoration: 'none',
                                                    '&:hover': { textDecoration: 'underline' }
                                                }}
                                            >
                                                Rs. {parseFloat(customer.balance || 0).toFixed(2)}
                                            </Typography>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Phone size={14} className="text-zinc-400" />
                                                <Typography variant="body2">{customer.phone || 'No phone'}</Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <MapPin size={14} className="text-zinc-400 shrink-0" />
                                            <Typography variant="body2" sx={{
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical'
                                            }}>
                                                {customer.address || 'No address provided'}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                            <Tooltip title="Measurements">
                                                <IconButton
                                                    size="small"
                                                    color="info"
                                                    component={Link}
                                                    href={`/dashboard/measurements?customerId=${customer.id}`}
                                                >
                                                    <Ruler size={18} />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Edit Profile">
                                                <IconButton
                                                    size="small"
                                                    color="primary"
                                                    onClick={() => handleEdit(customer)}
                                                >
                                                    <Edit size={18} />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete Customer">
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleDelete(customer.id)}
                                                >
                                                    <Trash2 size={18} />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                                    <Typography color="textSecondary">No customers found matching your search.</Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Quick Add Category Dialog */}
            <Dialog
                open={quickAddCatOpen}
                onClose={() => setQuickAddCatOpen(false)}
                PaperProps={{
                    sx: { borderRadius: 3, width: '100%', maxWidth: '400px' }
                }}
            >
                <DialogTitle sx={{ fontWeight: 700, bgcolor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    New Account Category
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#374151' }}>
                        Category Name
                    </Typography>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="e.g. Wholesaler, VIP, etc."
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        autoFocus
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2, bgcolor: '#f9fafb', borderTop: '1px solid #e5e7eb' }}>
                    <Button onClick={() => setQuickAddCatOpen(false)} sx={{ color: '#6b7280' }}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleQuickAddCategory}
                        disabled={!newCatName.trim() || newCatLoading}
                        sx={{ bgcolor: '#8b5cf6', '&:hover': { bgcolor: '#7c3aed' } }}
                    >
                        {newCatLoading ? <CircularProgress size={20} color="inherit" /> : "Create Category"}
                    </Button>
                </DialogActions>
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
