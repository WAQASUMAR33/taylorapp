"use client";

import { useState, useRef } from "react";
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
    Camera,
    X,
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

    // Image upload state
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const fileInputRef = useRef(null);

    // First category in the list as default
    const getDefaultCategoryId = (cats) => {
        return (cats || []).length > 0 ? cats[0].id : null;
    };

    const [formData, setFormData] = useState({
        name: "",
        fatherName: "",
        phone: "",
        address: "",
        accountCategoryId: getDefaultCategoryId(accountCategories),
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
            accountCategoryId: getDefaultCategoryId(categories),
            notes: "",
            balance: 0,
        });
        setImageFile(null);
        setImagePreview(null);
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

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(null);
        setFormData((prev) => ({ ...prev, image: null }));
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            let imageUrl = formData.image || null;

            // Upload new image if selected
            if (imageFile) {
                const uploadData = new FormData();
                uploadData.append("file", imageFile);
                const uploadRes = await fetch("/api/upload", { method: "POST", body: uploadData });
                if (!uploadRes.ok) {
                    const d = await uploadRes.json();
                    throw new Error(d.error || "Image upload failed");
                }
                const uploadJson = await uploadRes.json();
                imageUrl = uploadJson.url;
            } else if (imagePreview === null) {
                imageUrl = null; // explicitly removed
            }

            const isEditing = formData.id;
            const url = isEditing ? `/api/customers/${formData.id}` : "/api/customers";
            const method = isEditing ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formData, image: imageUrl }),
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
            image: customer.image || null,
        });
        setImageFile(null);
        setImagePreview(customer.image || null);
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
            <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: { xs: "wrap", md: "nowrap" } }}>
                {/* Total Customers */}
                <Box sx={{ flex: "1 1 0%", minWidth: 0 }}>
                    <Card
                        elevation={0}
                        sx={{
                            borderRadius: 3,
                            background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                            color: "white",
                            boxShadow: "0 4px 20px rgba(37,99,235,0.25)",
                            height: "100%",
                        }}
                    >
                        <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                            <Typography variant="caption" sx={{ fontWeight: 600, opacity: 0.85, textTransform: "uppercase", letterSpacing: 0.5 }}>
                                Total Customers
                            </Typography>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1 }}>
                                <Typography variant="h4" sx={{ fontWeight: 800 }}>
                                    {filteredInitialCustomers.length}
                                </Typography>
                                <Box sx={{ bgcolor: "rgba(255,255,255,0.2)", p: 1, borderRadius: 2 }}>
                                    <Users size={22} color="white" />
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Box>

                {/* Category Stats */}
                {categoryStats.map((stat, idx) => {
                    const c = statColors[idx % statColors.length];
                    return (
                        <Box key={stat.id} sx={{ flex: "1 1 0%", minWidth: 0 }}>
                            <Card
                                elevation={0}
                                sx={{
                                    borderRadius: 3,
                                    border: "1px solid",
                                    borderColor: "divider",
                                    height: "100%",
                                    transition: "transform 0.2s, box-shadow 0.2s",
                                    "&:hover": { transform: "translateY(-2px)", boxShadow: "0 6px 20px rgba(0,0,0,0.08)" },
                                }}
                            >
                                <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                                        {stat.name}
                                    </Typography>
                                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1 }}>
                                        <Typography variant="h4" sx={{ fontWeight: 800, color: "text.primary" }}>
                                            {stat.count}
                                        </Typography>
                                        <Box sx={{ bgcolor: c.bg, color: c.color, p: 1, borderRadius: 2 }}>
                                            <User size={20} />
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Box>
                    );
                })}
            </Box>

            {/* ── Action Bar ────────────────────────────────── */}
            <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                alignItems={{ xs: "stretch", sm: "center" }}
                justifyContent="space-between"
                sx={{ mb: 3 }}
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
                                    <Search size={18} />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ minWidth: 300, bgcolor: "background.paper", "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                    />
                    <Autocomplete
                        options={customerCategories}
                        getOptionLabel={(option) => option.name || ""}
                        value={filterCategory}
                        onChange={(e, newValue) => setFilterCategory(newValue)}
                        sx={{ minWidth: 300 }}
                        ListboxProps={{ style: { minWidth: 300 } }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                placeholder="Filter by Category"
                                size="small"
                                sx={{ bgcolor: "background.paper", "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                            />
                        )}
                    />
                </Stack>
                <Button
                    variant="contained"
                    startIcon={<Plus size={18} />}
                    onClick={handleOpen}
                    sx={{ borderRadius: 2, textTransform: "none", px: 3, py: 1, whiteSpace: "nowrap" }}
                >
                    Add New Customer
                </Button>
            </Stack>

            {/* ── Customers Table ───────────────────────────── */}
            <TableContainer
                component={Paper}
                elevation={0}
                sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, overflow: "hidden" }}
            >
                <Table>
                    <TableHead sx={{ bgcolor: "action.hover" }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Customer</TableCell>
                            <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Balance</TableCell>
                            <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Phone</TableCell>
                            <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Address</TableCell>
                            <TableCell sx={{ fontWeight: 700, py: 1.5 }} align="center">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredCustomers.length > 0 ? (
                            filteredCustomers.map((customer) => (
                                <TableRow
                                    key={customer.id}
                                    hover
                                    sx={{ transition: "background-color 0.15s" }}
                                >
                                    {/* Customer Name */}
                                    <TableCell>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                            <Avatar
                                                src={customer.image || undefined}
                                                sx={{
                                                    bgcolor: "primary.main",
                                                    width: 38,
                                                    height: 38,
                                                    fontSize: "0.9rem",
                                                    fontWeight: 700,
                                                }}
                                            >
                                                {!customer.image && customer.name.charAt(0).toUpperCase()}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="subtitle2" fontWeight={600}>
                                                    {customer.name}
                                                </Typography>
                                                {customer.fatherName && (
                                                    <Typography variant="caption" color="text.secondary" display="block">
                                                        S/O: {customer.fatherName}
                                                    </Typography>
                                                )}
                                                <Chip
                                                    label={customer.accountCategory?.name || "N/A"}
                                                    size="small"
                                                    sx={{ height: 18, fontSize: "0.65rem", mt: 0.3 }}
                                                />
                                            </Box>
                                        </Box>
                                    </TableCell>

                                    {/* Balance */}
                                    <TableCell>
                                        <Tooltip title="View Ledger">
                                            <Box
                                                component={Link}
                                                href={`/dashboard/ledger?customerId=${customer.id}`}
                                                sx={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 0.5 }}
                                            >
                                                <Typography
                                                    variant="body2"
                                                    fontWeight={700}
                                                    sx={{
                                                        color:
                                                            customer.balance > 0
                                                                ? "success.main"
                                                                : customer.balance < 0
                                                                    ? "error.main"
                                                                    : "text.primary",
                                                    }}
                                                >
                                                    Rs. {Math.abs(parseFloat(customer.balance || 0)).toFixed(2)}
                                                    {parseFloat(customer.balance || 0) > 0
                                                        ? " (Cr)"
                                                        : parseFloat(customer.balance || 0) < 0
                                                            ? " (Dr)"
                                                            : ""}
                                                </Typography>
                                                <BookText size={14} color="#9ca3af" />
                                            </Box>
                                        </Tooltip>
                                    </TableCell>

                                    {/* Phone */}
                                    <TableCell>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                            <Phone size={14} color="#9ca3af" />
                                            <Typography variant="body2">{customer.phone || "—"}</Typography>
                                        </Box>
                                    </TableCell>

                                    {/* Address */}
                                    <TableCell>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                            <MapPin size={14} color="#9ca3af" />
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    display: "-webkit-box",
                                                    WebkitLineClamp: 1,
                                                    WebkitBoxOrient: "vertical",
                                                    maxWidth: 220,
                                                }}
                                            >
                                                {customer.address || "—"}
                                            </Typography>
                                        </Box>
                                    </TableCell>

                                    {/* Actions */}
                                    <TableCell align="center">
                                        <Stack direction="row" spacing={0.5} justifyContent="center">
                                            <Tooltip title="Measurements">
                                                <IconButton
                                                    size="small"
                                                    color="info"
                                                    component={Link}
                                                    href={`/dashboard/measurements?customerId=${customer.id}`}
                                                >
                                                    <Ruler size={17} />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Edit">
                                                <IconButton size="small" color="primary" onClick={() => handleEdit(customer)}>
                                                    <Edit size={17} />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <IconButton size="small" color="error" onClick={() => handleDelete(customer.id)}>
                                                    <Trash2 size={17} />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                                    <Users size={40} color="#d1d5db" />
                                    <Typography color="text.secondary" sx={{ mt: 1 }}>
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

                    {/* Image Upload */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                        <Box sx={{ position: "relative" }}>
                            <Avatar
                                src={imagePreview || undefined}
                                sx={{ width: 72, height: 72, fontSize: "1.6rem", fontWeight: 700, bgcolor: "primary.main", cursor: "pointer", border: "2px dashed", borderColor: imagePreview ? "transparent" : "primary.main" }}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {!imagePreview && <Camera size={28} />}
                            </Avatar>
                            {imagePreview && (
                                <IconButton
                                    size="small"
                                    onClick={handleRemoveImage}
                                    sx={{ position: "absolute", top: -6, right: -6, bgcolor: "error.main", color: "white", width: 20, height: 20, "&:hover": { bgcolor: "error.dark" } }}
                                >
                                    <X size={12} />
                                </IconButton>
                            )}
                        </Box>
                        <Box>
                            <Typography variant="body2" fontWeight={600}>Customer Photo</Typography>
                            <Typography variant="caption" color="text.secondary">JPEG, PNG, WebP up to 5MB</Typography>
                            <Box sx={{ mt: 0.5 }}>
                                <Button size="small" variant="outlined" onClick={() => fileInputRef.current?.click()} sx={{ borderRadius: 2, textTransform: "none", fontSize: "0.75rem" }}>
                                    {imagePreview ? "Change Photo" : "Upload Photo"}
                                </Button>
                            </Box>
                        </Box>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            style={{ display: "none" }}
                            onChange={handleImageChange}
                        />
                    </Box>

                    <Grid container spacing={2}>
                        {/* Full Name */}
                        <Grid size={{ xs: 12, md: 4 }}>
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
                            />
                        </Grid>

                        {/* Father Name */}
                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Father Name"
                                name="fatherName"
                                placeholder="Enter father's name"
                                value={formData.fatherName || ""}
                                onChange={handleInputChange}
                                variant="outlined"
                            />
                        </Grid>

                        {/* Phone */}
                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Phone Number"
                                name="phone"
                                placeholder="03001234567"
                                value={formData.phone}
                                onChange={handleInputChange}
                                variant="outlined"
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
                        <Grid size={{ xs: 12, md: 4 }}>
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
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Autocomplete
                                fullWidth
                                size="small"
                                options={categories}
                                getOptionLabel={(option) => option.name || ""}
                                value={categories.find((c) => c.id === formData.accountCategoryId) || null}
                                onChange={(event, newValue) => {
                                    setFormData((prev) => ({
                                        ...prev,
                                        accountCategoryId: newValue ? newValue.id : null,
                                    }));
                                }}
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
                        <Grid size={{ xs: 12, md: 4 }}>
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
                            />
                        </Grid>

                        {/* Notes — full width on last row */}
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Notes"
                                name="notes"
                                placeholder="Additional information..."
                                multiline
                                rows={2}
                                value={formData.notes}
                                onChange={handleInputChange}
                                variant="outlined"
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
