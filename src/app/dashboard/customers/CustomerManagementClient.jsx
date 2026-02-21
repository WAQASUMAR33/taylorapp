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
    CardContent,
    Grid,
    CircularProgress,
    Alert,
    Snackbar,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Autocomplete,
    Divider,
    Stack,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from "@mui/material";
import {
    Edit,
    Trash2,
    Search,
    Phone,
    MapPin,
    Ruler,
    Plus,
    User,
    Users,
    BookText,
    Tag,
} from "lucide-react";

export default function CustomerManagementClient({ initialCustomers, accountCategories }) {
    const [customers, setCustomers] = useState(initialCustomers);
    const [categories, setCategories] = useState(accountCategories);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterCategory, setFilterCategory] = useState(null);

    // Quick Add Category State
    const [quickAddCatOpen, setQuickAddCatOpen] = useState(false);
    const [newCatName, setNewCatName] = useState("");
    const [newCatLoading, setNewCatLoading] = useState(false);

    // Form Dialog State
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        fatherName: "",
        phone: "",
        address: "",
        accountCategoryId: categories.length > 0 ? categories[0].id : null,
        notes: "",
        balance: 0,
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
            balance: 0,
        });
        setError("");
        setLoading(false);
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
            if (value === "" || /^[0-9]+$/.test(value)) {
                setFormData((prev) => ({ ...prev, [name]: value }));
            }
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
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
                throw new Error(data.error || `Failed to ${isEditing ? "update" : "create"} customer`);
            }

            const savedCustomer = await response.json();
            const updatedCategory = categories.find((c) => c.id === savedCustomer.accountCategoryId);
            const customerWithRelations = {
                ...savedCustomer,
                accountCategory: updatedCategory || savedCustomer.accountCategory,
            };

            if (isEditing) {
                setCustomers((prev) => prev.map((c) => (c.id === savedCustomer.id ? customerWithRelations : c)));
                setSuccessMessage("Customer updated successfully!");
            } else {
                setCustomers((prev) => [customerWithRelations, ...prev]);
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
            setCategories((prev) => [...prev, savedCat].sort((a, b) => a.name.localeCompare(b.name)));
            setFormData((prev) => ({ ...prev, accountCategoryId: savedCat.id }));
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
            balance: customer.balance || 0,
        });
        setShowForm(true);
    };

    const handleDelete = async (customerId) => {
        if (!confirm("Are you sure you want to delete this customer?")) return;
        setError("");

        try {
            const response = await fetch(`/api/customers/${customerId}`, { method: "DELETE" });

            if (!response.ok) {
                const data = await response.json();
                if (response.status === 404) {
                    setCustomers((prev) => prev.filter((c) => c.id !== customerId));
                    setSuccessMessage("Customer was already deleted.");
                    return;
                }
                throw new Error(data.error || "Failed to delete customer");
            }

            setCustomers((prev) => prev.filter((c) => c.id !== customerId));
            setSuccessMessage("Customer deleted successfully!");
        } catch (err) {
            setError(err.message);
        }
    };

    const filteredCustomers = (customers || []).filter((customer) => {
        const query = (searchQuery || "").toLowerCase();
        const matchesSearch =
            (customer.name || "").toLowerCase().includes(query) ||
            (customer.phone || "").includes(searchQuery || "");
        const matchesCategory = !filterCategory || customer.accountCategoryId === filterCategory.id;
        return matchesSearch && matchesCategory;
    });

    const customerCategories = (categories || []).filter(
        (cat) =>
            !(cat.name || "").toLowerCase().includes("cutter") &&
            !(cat.name || "").toLowerCase().includes("tailor")
    );

    const filteredInitialCustomers = (customers || []).filter((c) => {
        const cat = (categories || []).find((cat) => cat.id === c.accountCategoryId);
        return (
            !cat ||
            (!(cat.name || "").toLowerCase().includes("cutter") &&
                !(cat.name || "").toLowerCase().includes("tailor"))
        );
    });

    const categoryStats = customerCategories.map((cat) => ({
        ...cat,
        count: filteredInitialCustomers.filter((c) => c.accountCategoryId === cat.id).length,
    }));

    const statColors = [
        { bg: "primary.light", color: "primary.main" },
        { bg: "success.light", color: "success.main" },
        { bg: "info.light", color: "info.main" },
        { bg: "warning.light", color: "warning.main" },
        { bg: "secondary.light", color: "secondary.main" },
    ];

    return (
        <Box sx={{ width: "100%", p: 3 }}>

            {/* ── Summary Cards ─────────────────────────────── */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {/* Total Customers Card */}
                <Grid item xs={12} md={4}>
                    <Card
                        elevation={0}
                        sx={{
                            borderRadius: 4,
                            background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                            color: "white",
                            boxShadow: "0 10px 30px rgba(37,99,235,0.2)",
                            position: "relative",
                            overflow: "hidden",
                        }}
                    >
                        <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <Box>
                                    <Box sx={{ bgcolor: "rgba(255,255,255,0.2)", p: 0.8, borderRadius: 1.5, display: "inline-flex", mb: 2 }}>
                                        <Users size={20} color="white" />
                                    </Box>
                                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, lineHeight: 1.2 }}>
                                        Total Customers
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
                                        {filteredCustomers.length} Active Records
                                    </Typography>
                                </Box>
                                <Box sx={{ position: "relative", display: "inline-flex", mt: 1 }}>
                                    <CircularProgress
                                        variant="determinate"
                                        value={100}
                                        size={70}
                                        thickness={4}
                                        sx={{ color: "rgba(255,255,255,0.2)" }}
                                    />
                                    <CircularProgress
                                        variant="determinate"
                                        value={75} // Visual representation
                                        size={70}
                                        thickness={4}
                                        sx={{
                                            color: "white",
                                            position: "absolute",
                                            left: 0,
                                            [`& .MuiCircularProgress-circle`]: { strokeLinecap: "round" },
                                        }}
                                    />
                                    <Box
                                        sx={{
                                            top: 0,
                                            left: 0,
                                            bottom: 0,
                                            right: 0,
                                            position: "absolute",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        <Typography variant="caption" component="div" sx={{ fontWeight: 700, color: "white" }}>
                                            75%
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Placeholder/Secondary Info Cards (Following the Dropbox/GDrive pattern) */}
                <Grid item xs={12} md={4}>
                    <Card
                        elevation={0}
                        sx={{
                            borderRadius: 4,
                            border: "1px solid",
                            borderColor: "divider",
                            background: "white",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                        }}
                    >
                        <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <Box>
                                    <Box sx={{ bgcolor: "success.light", p: 0.8, borderRadius: 1.5, display: "inline-flex", mb: 2 }}>
                                        <BookText size={20} color="#10b981" />
                                    </Box>
                                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, lineHeight: 1.2, color: "text.primary" }}>
                                        Recent Activity
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                        Updated Today
                                    </Typography>
                                </Box>
                                <Box sx={{ position: "relative", display: "inline-flex", mt: 1 }}>
                                    <CircularProgress
                                        variant="determinate"
                                        value={100}
                                        size={60}
                                        thickness={4}
                                        sx={{ color: "action.hover" }}
                                    />
                                    <Box
                                        sx={{
                                            top: 0,
                                            left: 0,
                                            bottom: 0,
                                            right: 0,
                                            position: "absolute",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        <Typography variant="caption" sx={{ fontWeight: 700, color: "text.primary" }}>
                                            OK
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* ── Quick Access Section ────────────────────────── */}
            <Box sx={{ mb: 5 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: "text.primary", letterSpacing: -0.5 }}>
                    Quick Access
                </Typography>
                <Grid container spacing={3}>
                    {categoryStats.map((stat, idx) => {
                        const c = statColors[idx % statColors.length];
                        return (
                            <Grid item key={stat.id}>
                                <Stack
                                    spacing={1.5}
                                    alignItems="center"
                                    onClick={() => setFilterCategory(stat)}
                                    sx={{
                                        cursor: "pointer",
                                        "&:hover .icon-box": {
                                            transform: "translateY(-4px)",
                                            boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
                                        },
                                        width: 90,
                                    }}
                                >
                                    <Box
                                        className="icon-box"
                                        sx={{
                                            width: 60,
                                            height: 60,
                                            bgcolor: "white",
                                            borderRadius: 2.5,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
                                            border: "1px solid",
                                            borderColor: "divider",
                                            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                            color: c.color,
                                        }}
                                    >
                                        <User size={stat.id === filterCategory?.id ? 30 : 24} strokeWidth={2.5} />
                                    </Box>
                                    <Box sx={{ textAlign: "center" }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary", fontSize: "0.85rem", whiteSpace: "nowrap" }}>
                                            {stat.name}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 500 }}>
                                            {stat.count} items
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Grid>
                        );
                    })}
                    <Grid item>
                        <Stack spacing={1.5} alignItems="center" onClick={() => setQuickAddCatOpen(true)} sx={{ cursor: "pointer", width: 90 }}>
                            <Box
                                sx={{
                                    width: 60,
                                    height: 60,
                                    bgcolor: "white",
                                    borderRadius: 2.5,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    border: "1px dashed",
                                    borderColor: "divider",
                                    transition: "all 0.2s",
                                    color: "text.secondary",
                                    "&:hover": { bgcolor: "action.hover", borderColor: "primary.main", color: "primary.main" }
                                }}
                            >
                                <Plus size={24} />
                            </Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary", fontSize: "0.85rem" }}>
                                Add
                            </Typography>
                        </Stack>
                    </Grid>
                </Grid>
            </Box>


            {/* ── Action Bar ────────────────────────────────── */}
            <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                alignItems={{ xs: "stretch", sm: "center" }}
                justifyContent="space-between"
                sx={{ mb: 4 }}
            >
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ flex: 1 }}>
                    <TextField
                        placeholder="Search customer..."
                        variant="outlined"
                        size="small"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search size={18} color="#9ca3af" />
                                </InputAdornment>
                            ),
                        }}
                        sx={{
                            minWidth: 320,
                            bgcolor: "white",
                            "& .MuiOutlinedInput-root": {
                                borderRadius: 10, // Pill shape
                                "& fieldset": { borderColor: "rgba(0,0,0,0.08)" },
                                "&:hover fieldset": { borderColor: "primary.main" },
                                transition: "all 0.2s"
                            },
                        }}
                    />
                    <Autocomplete
                        options={customerCategories}
                        getOptionLabel={(option) => option.name || ""}
                        value={filterCategory}
                        onChange={(e, newValue) => setFilterCategory(newValue)}
                        sx={{ minWidth: 260 }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                placeholder="Filter by Category"
                                size="small"
                                sx={{
                                    bgcolor: "white",
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: 10, // Pill shape
                                        "& fieldset": { borderColor: "rgba(0,0,0,0.08)" },
                                        "&:hover fieldset": { borderColor: "primary.main" },
                                        transition: "all 0.2s"
                                    },
                                }}
                            />
                        )}
                    />
                </Stack>
                <Button
                    variant="contained"
                    startIcon={<Plus size={18} />}
                    onClick={handleOpen}
                    sx={{
                        borderRadius: 10, // Pill shape button
                        textTransform: "none",
                        px: 4,
                        py: 1,
                        whiteSpace: "nowrap",
                        boxShadow: "0 4px 12px rgba(37,99,235,0.2)",
                    }}
                >
                    Add New Customer
                </Button>
            </Stack>

            {/* ── Customers Table (Redesigned) ───────────────── */}
            <TableContainer
                component={Paper}
                elevation={0}
                sx={{
                    borderRadius: 4,
                    border: "1px solid",
                    borderColor: "rgba(0,0,0,0.06)",
                    boxShadow: "0 10px 40px rgba(0,0,0,0.03)",
                    overflow: "hidden",
                    bgcolor: "white",
                }}
            >
                <Table sx={{ minWidth: 800 }}>
                    <TableHead sx={{ bgcolor: "rgba(0,0,0,0.01)" }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 800, color: "text.primary", opacity: 0.6, fontSize: "0.75rem", textTransform: "uppercase", py: 2.5, pl: 4 }}>#</TableCell>
                            <TableCell sx={{ fontWeight: 800, color: "text.primary", opacity: 0.6, fontSize: "0.75rem", textTransform: "uppercase", py: 2.5 }}>Name</TableCell>
                            <TableCell sx={{ fontWeight: 800, color: "text.primary", opacity: 0.6, fontSize: "0.75rem", textTransform: "uppercase", py: 2.5 }}>Category</TableCell>
                            <TableCell sx={{ fontWeight: 800, color: "text.primary", opacity: 0.6, fontSize: "0.75rem", textTransform: "uppercase", py: 2.5 }}>Phone</TableCell>
                            <TableCell sx={{ fontWeight: 800, color: "text.primary", opacity: 0.6, fontSize: "0.75rem", textTransform: "uppercase", py: 2.5 }}>Address</TableCell>
                            <TableCell sx={{ fontWeight: 800, color: "text.primary", opacity: 0.6, fontSize: "0.75rem", textTransform: "uppercase", py: 2.5 }}>Balance</TableCell>
                            <TableCell sx={{ fontWeight: 800, color: "text.primary", opacity: 0.6, fontSize: "0.75rem", textTransform: "uppercase", py: 2.5, pr: 4 }} align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredCustomers.length > 0 ? (
                            filteredCustomers.map((customer, index) => (
                                <TableRow
                                    key={customer.id}
                                    hover
                                    sx={{
                                        "&:last-child td, &:last-child th": { border: 0 },
                                        transition: "background-color 0.2s",
                                        "&:hover": { bgcolor: "rgba(37, 99, 235, 0.01) !important" },
                                    }}
                                >
                                    <TableCell sx={{ py: 2, pl: 4, color: "text.secondary", fontWeight: 600, fontSize: "0.85rem" }}>
                                        {(index + 1).toString().padStart(2, '0')}
                                    </TableCell>
                                    <TableCell sx={{ py: 2 }}>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                            <Avatar
                                                sx={{
                                                    width: 32,
                                                    height: 32,
                                                    fontSize: "0.8rem",
                                                    fontWeight: 700,
                                                    bgcolor: "primary.light",
                                                    color: "primary.main",
                                                }}
                                            >
                                                {customer.name.charAt(0).toUpperCase()}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="body2" sx={{ fontWeight: 700, color: "text.primary" }}>
                                                    {customer.name}
                                                </Typography>
                                                {customer.fatherName && (
                                                    <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                                                        S/O: {customer.fatherName}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ py: 2 }}>
                                        <Chip
                                            label={customer.accountCategory?.name || "Standard"}
                                            size="small"
                                            sx={{
                                                height: 24,
                                                borderRadius: 1.5,
                                                fontSize: "0.75rem",
                                                fontWeight: 700,
                                                bgcolor:
                                                    customer.accountCategory?.name?.toLowerCase().includes("vip") ? "rgba(139, 92, 246, 0.1)" :
                                                        customer.accountCategory?.name?.toLowerCase().includes("corporate") ? "rgba(59, 130, 246, 0.1)" :
                                                            "rgba(16, 185, 129, 0.1)",
                                                color:
                                                    customer.accountCategory?.name?.toLowerCase().includes("vip") ? "#7c3aed" :
                                                        customer.accountCategory?.name?.toLowerCase().includes("corporate") ? "#2563eb" :
                                                            "#059669",
                                                border: "none",
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ py: 2 }}>
                                        <Typography variant="body2" sx={{ color: "text.secondary", display: "flex", alignItems: "center", gap: 0.5 }}>
                                            <Phone size={12} color="#9ca3af" />
                                            {customer.phone || "—"}
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={{ py: 2 }}>
                                        <Typography variant="body2" sx={{ color: "text.secondary", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {customer.address || "—"}
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={{ py: 2 }}>
                                        <Tooltip title="View Ledger">
                                            <Box sx={{ display: "inline-flex", flexDirection: "column" }}>
                                                <Typography
                                                    variant="body2"
                                                    component={Link}
                                                    href={`/dashboard/ledger?customerId=${customer.id}`}
                                                    sx={{
                                                        textDecoration: "none",
                                                        fontWeight: 800,
                                                        color:
                                                            customer.balance > 0 ? "#059669" :
                                                                customer.balance < 0 ? "#dc2626" :
                                                                    "text.primary",
                                                    }}
                                                >
                                                    Rs. {Math.abs(parseFloat(customer.balance || 0)).toLocaleString()}
                                                </Typography>
                                                {customer.balance !== 0 && (
                                                    <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.5, lineHeight: 1 }}>
                                                        {parseFloat(customer.balance || 0) > 0 ? "SUCCESS (Cr)" : "PENDING (Dr)"}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell sx={{ py: 2, pr: 4 }} align="right">
                                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                                            <IconButton
                                                size="small"
                                                component={Link}
                                                href={`/dashboard/measurements?customerId=${customer.id}`}
                                                sx={{ color: "text.secondary", "&:hover": { bgcolor: "action.hover", color: "primary.main" } }}
                                            >
                                                <Ruler size={16} />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleEdit(customer)}
                                                sx={{ color: "text.secondary", "&:hover": { bgcolor: "action.hover", color: "primary.main" } }}
                                            >
                                                <Edit size={16} />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDelete(customer.id)}
                                                sx={{ color: "text.secondary", "&:hover": { bgcolor: "action.hover", color: "error.main" } }}
                                            >
                                                <Trash2 size={16} />
                                            </IconButton>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} sx={{ py: 10, textAlign: "center" }}>
                                    <Users size={40} color="#d1d5db" style={{ marginBottom: 12 }} />
                                    <Typography variant="body1" sx={{ color: "text.secondary", fontWeight: 600 }}>
                                        No customers found.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>



            {/* ── Add / Edit Customer Dialog ────────────────── */}
            <Dialog
                open={showForm}
                onClose={handleClose}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid", borderColor: "divider", pb: 2 }}>
                    {formData.id ? "Edit Customer" : "Add New Customer"}
                </DialogTitle>

                <DialogContent sx={{ pt: 2.5 }}>
                    {error && (
                        <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2, borderRadius: 2 }}>
                            {error}
                        </Alert>
                    )}

                    {/* Top action row — Add Category button sits here, top-right */}
                    <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<Plus size={15} />}
                            onClick={() => setQuickAddCatOpen(true)}
                            sx={{ borderRadius: 2, textTransform: "none", fontSize: "0.8rem" }}
                        >
                            Add Category
                        </Button>
                    </Box>

                    {/* 3 fields per row — all size="small", minWidth 300 */}
                    <Grid container spacing={2}>
                        {/* Full Name */}
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Full Name"
                                name="name"
                                required
                                placeholder="Enter full name"
                                value={formData.name}
                                onChange={handleInputChange}
                                variant="outlined"
                                sx={{ minWidth: 300 }}
                            />
                        </Grid>

                        {/* Father Name */}
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Father Name"
                                name="fatherName"
                                placeholder="Enter father's name"
                                value={formData.fatherName || ""}
                                onChange={handleInputChange}
                                variant="outlined"
                                sx={{ minWidth: 300 }}
                            />
                        </Grid>

                        {/* Phone */}
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Phone Number"
                                name="phone"
                                placeholder="03001234567"
                                value={formData.phone}
                                onChange={handleInputChange}
                                variant="outlined"
                                sx={{ minWidth: 300 }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                <Typography sx={{ fontSize: "0.95rem", lineHeight: 1 }}>🇵🇰</Typography>
                                                <Typography variant="body2" fontWeight={600}>+92</Typography>
                                                <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: 16 }} />
                                            </Box>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>

                        {/* Opening Balance */}
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Opening Balance"
                                name="balance"
                                type="number"
                                required
                                placeholder="0.00"
                                value={formData.balance}
                                onChange={handleInputChange}
                                variant="outlined"
                                sx={{ minWidth: 300 }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Typography variant="body2" fontWeight={600}>Rs.</Typography>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>

                        {/* Account Category */}
                        <Grid item xs={12} md={4}>
                            <Autocomplete
                                fullWidth
                                size="small"
                                options={categories.filter(
                                    (cat) =>
                                        !cat.name.toLowerCase().includes("cutter") &&
                                        !cat.name.toLowerCase().includes("tailor")
                                )}
                                getOptionLabel={(option) => option.name || ""}
                                value={categories.find((c) => c.id === formData.accountCategoryId) || null}
                                onChange={(event, newValue) => {
                                    setFormData((prev) => ({
                                        ...prev,
                                        accountCategoryId: newValue ? newValue.id : null,
                                    }));
                                }}
                                sx={{ minWidth: 300 }}
                                ListboxProps={{ style: { minWidth: 300 } }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Account Category"
                                        variant="outlined"
                                        placeholder="Select category"
                                    />
                                )}
                            />
                        </Grid>

                        {/* Address */}
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Address"
                                name="address"
                                placeholder="Enter full address"
                                multiline
                                rows={3}
                                value={formData.address}
                                onChange={handleInputChange}
                                variant="outlined"
                                sx={{ minWidth: 300 }}
                            />
                        </Grid>

                        {/* Notes */}
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Notes"
                                name="notes"
                                placeholder="Additional information..."
                                multiline
                                rows={3}
                                value={formData.notes}
                                onChange={handleInputChange}
                                variant="outlined"
                                sx={{ minWidth: 300 }}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>

                <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid", borderColor: "divider", gap: 1 }}>
                    <Button onClick={handleClose} variant="outlined" color="inherit" disabled={loading} sx={{ borderRadius: 2, textTransform: "none" }}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={loading || !formData.name?.trim()}
                        sx={{ borderRadius: 2, textTransform: "none", px: 3 }}
                    >
                        {loading ? <CircularProgress size={20} color="inherit" /> : formData.id ? "Update Customer" : "Save Customer"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Quick Add Category Dialog ─────────────────── */}
            <Dialog
                open={quickAddCatOpen}
                onClose={() => setQuickAddCatOpen(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid", borderColor: "divider" }}>
                    New Account Category
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    <TextField
                        fullWidth
                        label="Category Name"
                        placeholder="e.g. Wholesaler, VIP"
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        autoFocus
                        variant="outlined"
                        onKeyDown={(e) => { if (e.key === "Enter") handleQuickAddCategory(); }}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid", borderColor: "divider", gap: 1 }}>
                    <Button
                        onClick={() => setQuickAddCatOpen(false)}
                        variant="outlined"
                        color="inherit"
                        sx={{ borderRadius: 2, textTransform: "none" }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleQuickAddCategory}
                        disabled={!newCatName.trim() || newCatLoading}
                        sx={{ borderRadius: 2, textTransform: "none" }}
                    >
                        {newCatLoading ? <CircularProgress size={20} color="inherit" /> : "Create Category"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Success Snackbar ──────────────────────────── */}
            <Snackbar
                open={!!successMessage}
                autoHideDuration={4000}
                onClose={() => setSuccessMessage("")}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            >
                <Alert onClose={() => setSuccessMessage("")} severity="success" sx={{ width: "100%", borderRadius: 2 }}>
                    {successMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
}
