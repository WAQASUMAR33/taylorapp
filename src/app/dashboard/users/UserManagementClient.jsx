"use client";

import { useState } from "react";
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, Chip, IconButton, Avatar, Box, Typography, TextField,
    InputAdornment, Card, Grid, CircularProgress, Alert, Snackbar,
    FormControlLabel, Switch, Autocomplete, Dialog, DialogTitle,
    DialogContent, DialogActions, Tooltip, Tabs, Tab, Divider,
    Checkbox, Paper,
} from "@mui/material";
import {
    Edit, Trash2, Search, UserPlus, Mail, Phone, X as XIcon,
    Lock, User, Save, Users, ShieldCheck, UserCog, Shield,
    LayoutDashboard, Calendar, BarChart3, Package, Boxes,
    BookText, Ruler, ShoppingCart, Tags, Settings, Scissors,
} from "lucide-react";

// ─── Role config ──────────────────────────────────────────────────────────────
const ROLES = ["ADMIN", "MANAGER", "STAFF"];

const ROLE_META = {
    ADMIN: { color: "error", icon: ShieldCheck, gradient: "linear-gradient(135deg, #f87171 0%, #ef4444 100%)", shadow: "rgba(239,68,68,0.3)" },
    MANAGER: { color: "primary", icon: UserCog, gradient: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)", shadow: "rgba(59,130,246,0.3)" },
    STAFF: { color: "success", icon: User, gradient: "linear-gradient(135deg, #34d399 0%, #10b981 100%)", shadow: "rgba(16,185,129,0.3)" },
};

// ─── Module definitions ───────────────────────────────────────────────────────
const MODULES = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, actions: ["view"] },
    { key: "bookings", label: "Bookings", icon: Calendar, actions: ["view", "create", "edit", "delete"] },
    { key: "analytics", label: "Analytics", icon: BarChart3, actions: ["view"] },
    { key: "customers", label: "Account Management", icon: Users, actions: ["view", "create", "edit", "delete"] },
    { key: "measurements", label: "Measurements", icon: Ruler, actions: ["view", "create", "edit", "delete"] },
    { key: "employees", label: "Employees", icon: UserCog, actions: ["view", "create", "edit", "delete"] },
    { key: "products", label: "Products", icon: Package, actions: ["view", "create", "edit", "delete"] },
    { key: "materials", label: "Material Stock", icon: Boxes, actions: ["view", "create", "edit", "delete"] },
    { key: "purchases", label: "Purchases", icon: ShoppingCart, actions: ["view", "create", "edit", "delete"] },
    { key: "ledger", label: "Ledger", icon: BookText, actions: ["view"] },
    { key: "categories", label: "Account Categories", icon: Tags, actions: ["view", "create", "edit", "delete"] },
    { key: "stitching", label: "Stitching Orders", icon: Scissors, actions: ["view", "create", "edit", "delete"] },
    { key: "users", label: "User Management", icon: Settings, actions: ["view", "create", "edit", "delete"] },
];

// Default full-access permissions (for ADMIN)
const FULL_PERMISSIONS = Object.fromEntries(
    MODULES.map(m => [m.key, Object.fromEntries(m.actions.map(a => [a, true]))])
);

// Default restricted permissions (for STAFF - view only on allowed modules)
const DEFAULT_STAFF_PERMISSIONS = Object.fromEntries(
    MODULES.map(m => [m.key, Object.fromEntries(m.actions.map(a => [a, a === "view"]))])
);

const ACTION_COLORS = {
    view: { bg: "#dbeafe", color: "#1d4ed8" },
    create: { bg: "#d1fae5", color: "#065f46" },
    edit: { bg: "#fef3c7", color: "#92400e" },
    delete: { bg: "#fee2e2", color: "#991b1b" },
};

function getDefaultPermissions(role) {
    if (role === "ADMIN") return FULL_PERMISSIONS;
    if (role === "MANAGER") return Object.fromEntries(
        MODULES.map(m => [m.key, Object.fromEntries(
            m.actions.map(a => [a, m.key !== "users"])
        )])
    );
    return DEFAULT_STAFF_PERMISSIONS;
}

// ─── Permissions grid component ───────────────────────────────────────────────
function PermissionsGrid({ permissions, onChange, role }) {
    const isAdmin = role === "ADMIN";

    const handleToggle = (moduleKey, action) => {
        if (isAdmin) return; // ADMIN always has full access
        const cur = permissions?.[moduleKey]?.[action] ?? false;
        onChange({
            ...permissions,
            [moduleKey]: {
                ...(permissions?.[moduleKey] || {}),
                [action]: !cur,
            },
        });
    };

    const handleModuleToggle = (moduleKey, checked) => {
        if (isAdmin) return;
        const mod = MODULES.find(m => m.key === moduleKey);
        onChange({
            ...permissions,
            [moduleKey]: Object.fromEntries(mod.actions.map(a => [a, checked])),
        });
    };

    const isModuleAllChecked = (moduleKey) => {
        const mod = MODULES.find(m => m.key === moduleKey);
        return mod.actions.every(a => permissions?.[moduleKey]?.[a]);
    };

    return (
        <Box>
            {isAdmin && (
                <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                    ADMIN role has full access to all modules by default. Permissions are not editable for admins.
                </Alert>
            )}
            <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
                {/* Table header */}
                <Box sx={{
                    display: "grid", gridTemplateColumns: "1fr auto", bgcolor: "#f8fafc",
                    borderBottom: "2px solid #e5e7eb", px: 2, py: 1.5
                }}>
                    <Typography variant="caption" fontWeight={700} color="#374151"
                        sx={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>Module</Typography>
                    <Typography variant="caption" fontWeight={700} color="#374151"
                        sx={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>Permissions</Typography>
                </Box>

                {MODULES.map((mod, i) => {
                    const ModIcon = mod.icon;
                    const allChecked = isAdmin || isModuleAllChecked(mod.key);
                    return (
                        <Box key={mod.key}
                            sx={{
                                display: "flex", alignItems: "center", px: 2, py: 1.25,
                                bgcolor: i % 2 === 0 ? "white" : "#fafafa",
                                borderBottom: i < MODULES.length - 1 ? "1px solid #f3f4f6" : "none"
                            }}>
                            {/* Module info */}
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flex: 1 }}>
                                <Tooltip title={isAdmin ? "Full access" : allChecked ? "Disable all" : "Enable all"}>
                                    <Checkbox
                                        size="small"
                                        checked={allChecked}
                                        indeterminate={!isAdmin && !allChecked &&
                                            mod.actions.some(a => permissions?.[mod.key]?.[a])}
                                        onChange={e => handleModuleToggle(mod.key, e.target.checked)}
                                        disabled={isAdmin}
                                        sx={{ p: 0.5, color: "#8b5cf6", "&.Mui-checked": { color: "#8b5cf6" } }}
                                    />
                                </Tooltip>
                                <Box sx={{ p: 0.75, bgcolor: "#ede9fe", borderRadius: 1.5, display: "flex" }}>
                                    <ModIcon size={14} color="#7c3aed" />
                                </Box>
                                <Typography variant="body2" fontWeight={600} color="#1f2937">{mod.label}</Typography>
                            </Box>

                            {/* Action chips */}
                            <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", justifyContent: "flex-end" }}>
                                {mod.actions.map(action => {
                                    const active = isAdmin || (permissions?.[mod.key]?.[action] ?? false);
                                    const ac = ACTION_COLORS[action];
                                    return (
                                        <Tooltip key={action} title={isAdmin ? `${action} (always on)` : `Toggle ${action}`}>
                                            <Chip
                                                size="small"
                                                label={action}
                                                onClick={() => handleToggle(mod.key, action)}
                                                sx={{
                                                    height: 22, fontSize: "0.68rem", fontWeight: 600,
                                                    cursor: isAdmin ? "default" : "pointer",
                                                    bgcolor: active ? ac.bg : "#f3f4f6",
                                                    color: active ? ac.color : "#9ca3af",
                                                    border: `1px solid ${active ? ac.bg : "#e5e7eb"}`,
                                                    textTransform: "capitalize",
                                                    transition: "all 0.15s",
                                                    "&:hover": isAdmin ? {} : {
                                                        bgcolor: active ? ac.bg : "#e5e7eb",
                                                        opacity: 0.85,
                                                    },
                                                }}
                                            />
                                        </Tooltip>
                                    );
                                })}
                            </Box>
                        </Box>
                    );
                })}
            </Paper>
        </Box>
    );
}

// ─── Field sx ─────────────────────────────────────────────────────────────────
const FIELD_SX = {
    "& .MuiOutlinedInput-root": {
        bgcolor: "white", borderRadius: 2,
        "& fieldset": { borderColor: "#e5e7eb" },
        "&:hover fieldset": { borderColor: "#8b5cf6" },
        "&.Mui-focused fieldset": { borderColor: "#8b5cf6", borderWidth: 2 },
    }
};

// ─── Main component ───────────────────────────────────────────────────────────
export default function UserManagementClient({ initialUsers }) {
    const [users, setUsers] = useState(initialUsers);
    const [searchQuery, setSearchQuery] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [activeTab, setActiveTab] = useState(0);

    const [formData, setFormData] = useState({
        fullName: "", username: "", email: "",
        phone: "", role: "STAFF", password: "", isActive: true,
        permissions: getDefaultPermissions("STAFF"),
    });

    /* ── helpers ──────────────────────────────────────── */

    const resetForm = () => {
        setFormData({ fullName: "", username: "", email: "", phone: "", role: "STAFF", password: "", isActive: true, permissions: getDefaultPermissions("STAFF") });
        setEditMode(false);
        setSelectedUserId(null);
        setError("");
        setActiveTab(0);
    };

    const handleOpen = () => { resetForm(); setShowForm(true); };
    const handleClose = () => { if (!loading) { setShowForm(false); resetForm(); } };

    const handleEdit = (user) => {
        setEditMode(true);
        setSelectedUserId(user.id);
        setFormData({
            fullName: user.fullName || "",
            username: user.username || "",
            email: user.email || "",
            phone: user.phone || "",
            role: user.role || "STAFF",
            password: "",
            isActive: user.isActive ?? true,
            permissions: user.permissions || getDefaultPermissions(user.role || "STAFF"),
        });
        setActiveTab(0);
        setShowForm(true);
    };

    const handleInputChange = (e) => {
        const { name, value, checked, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    };

    const handleRoleChange = (newRole) => {
        setFormData(prev => ({
            ...prev,
            role: newRole || "STAFF",
            permissions: getDefaultPermissions(newRole || "STAFF"),
        }));
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError("");
        try {
            const method = editMode ? "PUT" : "POST";
            const payload = editMode
                ? { ...formData, id: selectedUserId }
                : formData;

            const res = await fetch("/api/users", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || `Failed to ${editMode ? "update" : "create"} user`);
            }

            const savedUser = await res.json();
            const serialized = {
                ...savedUser,
                createdAt: savedUser.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            if (editMode) {
                setUsers(prev => prev.map(u => u.id === selectedUserId ? serialized : u));
                setSuccessMessage("User updated successfully!");
            } else {
                setUsers(prev => [serialized, ...prev]);
                setSuccessMessage("User created successfully!");
            }

            setShowForm(false);
            resetForm();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (userId) => {
        if (!confirm("Are you sure you want to delete this user?")) return;
        try {
            const res = await fetch(`/api/users?id=${userId}`, { method: "DELETE" });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to delete user");
            }
            setUsers(prev => prev.filter(u => u.id !== userId));
            setSuccessMessage("User deleted successfully!");
        } catch (err) {
            alert(err.message);
        }
    };

    /* ── derived ──────────────────────────────────────── */

    const filteredUsers = (users || []).filter(user => {
        const q = (searchQuery || "").toLowerCase();
        return (user.fullName || "").toLowerCase().includes(q) ||
            (user.email || "").toLowerCase().includes(q) ||
            (user.username || "").toLowerCase().includes(q);
    });

    const roleCounts = ROLES.reduce((acc, r) => {
        acc[r] = users.filter(u => u.role === r).length;
        return acc;
    }, {});

    // Count granted permissions for a user
    const countPermissions = (perms) => {
        if (!perms) return 0;
        return Object.values(perms).reduce((sum, actions) =>
            sum + Object.values(actions).filter(Boolean).length, 0);
    };

    /* ── render ──────────────────────────────────────── */

    return (
        <Box sx={{ width: "100%", p: 3 }}>

            {/* ── Stats Cards ──────────────────────────── */}
            <Box sx={{ display: "flex", gap: 2.5, mb: 3, width: "100%" }}>
                <Card sx={{
                    flex: 1, p: 3,
                    background: "linear-gradient(135deg, #818cf8 0%, #6366f1 100%)",
                    color: "white", borderRadius: 3,
                    boxShadow: "0 10px 40px rgba(99,102,241,0.3)",
                }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Box>
                            <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>Total Users</Typography>
                            <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>{users.length}</Typography>
                        </Box>
                        <Users size={36} style={{ opacity: 0.8 }} />
                    </Box>
                </Card>

                {ROLES.map(role => {
                    const meta = ROLE_META[role];
                    const Icon = meta.icon;
                    return (
                        <Card key={role} sx={{
                            flex: 1, p: 3,
                            background: meta.gradient,
                            color: "white", borderRadius: 3,
                            boxShadow: `0 10px 40px ${meta.shadow}`,
                        }}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <Box>
                                    <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>
                                        {role.charAt(0) + role.slice(1).toLowerCase()}s
                                    </Typography>
                                    <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>
                                        {roleCounts[role]}
                                    </Typography>
                                </Box>
                                <Icon size={36} style={{ opacity: 0.8 }} />
                            </Box>
                        </Card>
                    );
                })}
            </Box>

            {/* ── Action Bar ──────────────────────────── */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, gap: 2 }}>
                <TextField
                    placeholder="Search users…"
                    variant="outlined"
                    size="small"
                    sx={{ minWidth: 300, ...FIELD_SX }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><Search size={18} /></InputAdornment>,
                    }}
                />
                <Button
                    variant="contained"
                    startIcon={<UserPlus size={18} />}
                    onClick={handleOpen}
                    sx={{
                        borderRadius: 2, textTransform: "none", fontWeight: 600, px: 3,
                        bgcolor: "#8b5cf6", "&:hover": { bgcolor: "#7c3aed" }
                    }}
                >
                    Add New User
                </Button>
            </Box>

            {/* ── Users Table ─────────────────────────── */}
            <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, overflow: "auto" }}>
                <Table sx={{ minWidth: 750 }}>
                    <TableHead>
                        <TableRow sx={{ bgcolor: "#f9fafb" }}>
                            <TableCell sx={{ fontWeight: 700, color: "#374151" }}>User</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#374151" }}>Username</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#374151" }}>Role</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#374151" }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#374151" }}>Contact</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#374151" }}>Module Access</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#374151" }} align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map((user) => {
                                const meta = ROLE_META[user.role] || ROLE_META.STAFF;
                                const permCount = user.role === "ADMIN"
                                    ? "Full Access"
                                    : `${countPermissions(user.permissions)} permissions`;
                                return (
                                    <TableRow key={user.id}
                                        sx={{ "&:hover": { bgcolor: "#f9fafb" }, transition: "background-color 0.2s" }}>
                                        {/* User */}
                                        <TableCell>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                                <Avatar variant="rounded" sx={{
                                                    width: 36, height: 36, fontWeight: 700, fontSize: "0.85rem",
                                                    background: meta.gradient, color: "white", borderRadius: 1.5,
                                                }}>
                                                    {(user.fullName || "?")[0].toUpperCase()}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="subtitle2" fontWeight={600}>{user.fullName}</Typography>
                                                    <Typography variant="caption" color="text.secondary">ID #{user.id}</Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>

                                        {/* Username */}
                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary" sx={{ fontFamily: "monospace" }}>
                                                @{user.username}
                                            </Typography>
                                        </TableCell>

                                        {/* Role */}
                                        <TableCell>
                                            <Chip label={user.role} size="small" color={meta.color} variant="outlined"
                                                sx={{ fontWeight: 700, borderRadius: 1 }} />
                                        </TableCell>

                                        {/* Status */}
                                        <TableCell>
                                            <Chip
                                                label={user.isActive ? "Active" : "Inactive"}
                                                size="small"
                                                color={user.isActive ? "success" : "default"}
                                                variant="filled"
                                                sx={{ borderRadius: 1, fontWeight: 600 }}
                                            />
                                        </TableCell>

                                        {/* Contact */}
                                        <TableCell>
                                            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                                                {user.email && (
                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                                                        <Mail size={13} color="#9ca3af" />
                                                        <Typography variant="caption">{user.email}</Typography>
                                                    </Box>
                                                )}
                                                {user.phone && (
                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                                                        <Phone size={13} color="#9ca3af" />
                                                        <Typography variant="caption">{user.phone}</Typography>
                                                    </Box>
                                                )}
                                            </Box>
                                        </TableCell>

                                        {/* Module Access */}
                                        <TableCell>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                                                <Shield size={14} color={user.role === "ADMIN" ? "#ef4444" : "#8b5cf6"} />
                                                <Typography variant="caption" fontWeight={600}
                                                    color={user.role === "ADMIN" ? "#ef4444" : "#8b5cf6"}>
                                                    {permCount}
                                                </Typography>
                                            </Box>
                                        </TableCell>

                                        {/* Actions */}
                                        <TableCell align="right">
                                            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }}>
                                                <Tooltip title="Edit User & Permissions">
                                                    <IconButton size="small" color="primary" onClick={() => handleEdit(user)}>
                                                        <Edit size={17} />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Delete User">
                                                    <IconButton size="small" color="error" onClick={() => handleDelete(user.id)}>
                                                        <Trash2 size={17} />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                                    <Users size={40} color="#d1d5db" />
                                    <Typography color="text.secondary" sx={{ mt: 1.5 }}>No users found.</Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>

            {/* ── Add / Edit Dialog ──────────────────── */}
            <Dialog
                open={showForm}
                onClose={handleClose}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3, maxHeight: "90vh" } }}
            >
                <DialogTitle sx={{
                    fontWeight: 700, borderBottom: "1px solid", borderColor: "divider", pb: 2,
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    background: "linear-gradient(135deg, #f8fafc 0%, #f0f4ff 100%)",
                }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Box sx={{ p: 1, bgcolor: "#ede9fe", borderRadius: 1.5, display: "flex" }}>
                            <Shield size={18} color="#8b5cf6" />
                        </Box>
                        <Typography variant="h6" fontWeight={700}>
                            {editMode ? "Edit User & Permissions" : "Add New User"}
                        </Typography>
                    </Box>
                    <IconButton size="small" onClick={handleClose} disabled={loading}>
                        <XIcon size={18} />
                    </IconButton>
                </DialogTitle>

                {/* Tabs */}
                <Box sx={{ borderBottom: "1px solid", borderColor: "divider", bgcolor: "#fafafa" }}>
                    <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}
                        sx={{
                            px: 3, "& .MuiTab-root": { textTransform: "none", fontWeight: 600, minHeight: 44 },
                            "& .Mui-selected": { color: "#8b5cf6" },
                            "& .MuiTabs-indicator": { bgcolor: "#8b5cf6" }
                        }}>
                        <Tab label="User Details" icon={<User size={15} />} iconPosition="start" />
                        <Tab label="Module Permissions" icon={<Shield size={15} />} iconPosition="start" />
                    </Tabs>
                </Box>

                <DialogContent sx={{ pt: "24px !important", pb: 3 }}>
                    {error && (
                        <Alert severity="error" variant="filled" onClose={() => setError("")} sx={{ mb: 2.5, borderRadius: 2 }}>
                            {error}
                        </Alert>
                    )}

                    {/* ── Tab 0: User Details ── */}
                    {activeTab === 0 && (
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <TextField fullWidth size="small" label="Full Name" name="fullName" required
                                    placeholder="Enter full name" value={formData.fullName}
                                    onChange={handleInputChange} sx={FIELD_SX}
                                    InputProps={{ startAdornment: <InputAdornment position="start"><User size={16} /></InputAdornment> }} />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField fullWidth size="small" label="Username" name="username" required
                                    placeholder="Enter username" value={formData.username}
                                    onChange={handleInputChange} sx={FIELD_SX} />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Autocomplete
                                    size="small"
                                    options={ROLES}
                                    value={formData.role || "STAFF"}
                                    onChange={(_, v) => handleRoleChange(v)}
                                    renderInput={(params) => (
                                        <TextField {...params} label="Role" required sx={{ minWidth: 200, ...FIELD_SX }}
                                            placeholder="Select role" />
                                    )}
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField fullWidth size="small" label="Email" name="email" type="email"
                                    placeholder="Enter email" value={formData.email}
                                    onChange={handleInputChange} sx={FIELD_SX}
                                    InputProps={{ startAdornment: <InputAdornment position="start"><Mail size={16} /></InputAdornment> }} />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField fullWidth size="small" label="Phone Number" name="phone"
                                    placeholder="Enter phone number" value={formData.phone}
                                    onChange={handleInputChange} sx={FIELD_SX}
                                    InputProps={{ startAdornment: <InputAdornment position="start"><Phone size={16} /></InputAdornment> }} />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField fullWidth size="small"
                                    label={editMode ? "Change Password (optional)" : "Password"}
                                    name="password" type="password" required={!editMode}
                                    placeholder={editMode ? "Leave blank to keep current" : "Enter password"}
                                    value={formData.password} onChange={handleInputChange} sx={FIELD_SX}
                                    InputProps={{ startAdornment: <InputAdornment position="start"><Lock size={16} /></InputAdornment> }} />
                            </Grid>

                            {editMode && (
                                <Grid item xs={12}>
                                    <FormControlLabel
                                        control={
                                            <Switch checked={formData.isActive} onChange={handleInputChange}
                                                name="isActive" color="success" />
                                        }
                                        label={<Typography variant="body2" fontWeight={500}>Account Active</Typography>}
                                    />
                                </Grid>
                            )}

                            {/* Role hint */}
                            <Grid item xs={12}>
                                <Alert severity="info" sx={{ borderRadius: 2 }} icon={<Shield size={16} />}>
                                    Changing the role will <strong>reset permissions</strong> to the default for that role.
                                    You can fine-tune them in the <strong>Module Permissions</strong> tab.
                                </Alert>
                            </Grid>
                        </Grid>
                    )}

                    {/* ── Tab 1: Module Permissions ── */}
                    {activeTab === 1 && (
                        <PermissionsGrid
                            permissions={formData.permissions}
                            role={formData.role}
                            onChange={(newPerms) => setFormData(prev => ({ ...prev, permissions: newPerms }))}
                        />
                    )}
                </DialogContent>

                <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid", borderColor: "divider", gap: 1 }}>
                    <Button onClick={handleClose} variant="outlined" color="inherit" disabled={loading}
                        startIcon={<XIcon size={17} />}
                        sx={{ borderRadius: 2, textTransform: "none", borderColor: "#d1d5db", color: "#374151" }}>
                        Cancel
                    </Button>
                    <Button variant="contained" onClick={handleSubmit}
                        disabled={loading || !formData.fullName || !formData.username}
                        startIcon={loading ? null : <Save size={17} />}
                        sx={{
                            borderRadius: 2, textTransform: "none", fontWeight: 600, px: 3,
                            bgcolor: "#8b5cf6", "&:hover": { bgcolor: "#7c3aed" }
                        }}>
                        {loading ? <CircularProgress size={20} color="inherit" /> : (editMode ? "Update User" : "Create User")}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Success Snackbar ──────────────────── */}
            <Snackbar open={!!successMessage} autoHideDuration={4000}
                onClose={() => setSuccessMessage("")}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
                <Alert onClose={() => setSuccessMessage("")} severity="success" variant="filled"
                    sx={{ width: "100%", borderRadius: 2 }}>
                    {successMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
}
