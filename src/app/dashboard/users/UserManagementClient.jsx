"use client";

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    Chip,
    IconButton,
    Avatar,
    Box,
    Typography,
    TextField,
    InputAdornment,
    Card,
    Grid,
    CircularProgress,
    Alert,
    Snackbar,
    MenuItem,
    Switch,
    FormControlLabel
} from "@mui/material";
import {
    Edit,
    Trash2,
    Search,
    UserPlus,
    Mail,
    Phone,
    X as XIcon,
    Lock,
    User,
    Save
} from "lucide-react";

const roles = ["ADMIN", "MANAGER", "STAFF"];

export default function UserManagementClient({ initialUsers }) {
    const [users, setUsers] = useState(initialUsers);
    const [searchQuery, setSearchQuery] = useState("");

    // UI States
    const [showForm, setShowForm] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const [formData, setFormData] = useState({
        fullName: "",
        username: "",
        email: "",
        phone: "",
        role: "STAFF",
        password: "",
        isActive: true
    });

    const resetForm = () => {
        setFormData({
            fullName: "",
            username: "",
            email: "",
            phone: "",
            role: "STAFF",
            password: "",
            isActive: true
        });
        setEditMode(false);
        setSelectedUserId(null);
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

    const handleEdit = (user) => {
        setEditMode(true);
        setSelectedUserId(user.id);
        setFormData({
            fullName: user.fullName || "",
            username: user.username || "",
            email: user.email || "",
            phone: user.phone || "",
            role: user.role || "STAFF",
            password: "", // Leave blank unless changing
            isActive: user.isActive ?? true
        });
        setShowForm(true);
    };

    const handleInputChange = (e) => {
        const { name, value, checked, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const method = editMode ? "PUT" : "POST";
            const payload = editMode ? { ...formData, id: selectedUserId } : formData;

            const response = await fetch("/api/users", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || `Failed to ${editMode ? 'update' : 'create'} user`);
            }

            const savedUser = await response.json();

            // Serialize for local state
            const serializedUser = {
                ...savedUser,
                createdAt: savedUser.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            if (editMode) {
                setUsers(prev => prev.map(u => u.id === selectedUserId ? serializedUser : u));
                setSuccessMessage("User updated successfully!");
            } else {
                setUsers(prev => [serializedUser, ...prev]);
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
            const response = await fetch(`/api/users?id=${userId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to delete user");
            }

            setUsers(prev => prev.filter(u => u.id !== userId));
            setSuccessMessage("User deleted successfully!");
        } catch (err) {
            alert(err.message);
        }
    };

    const filteredUsers = users.filter(user =>
        user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getRoleColor = (role) => {
        switch (role) {
            case "ADMIN": return "error";
            case "MANAGER": return "primary";
            case "STAFF": return "success";
            default: return "default";
        }
    };

    if (showForm) {
        return (
            <Box sx={{ width: '100%', bgcolor: '#f9fafb', minHeight: '100vh', p: 3 }}>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <Card sx={{ mb: 2 }}>
                    <Box sx={{ p: 2, bgcolor: '#8b5cf6', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {editMode ? "EDIT SYSTEM USER" : "NEW SYSTEM USER"}
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
                                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Full Name</Typography>
                                <TextField
                                    fullWidth
                                    name="fullName"
                                    required
                                    placeholder="e.g. John Doe"
                                    value={formData.fullName}
                                    onChange={handleInputChange}
                                    variant="outlined"
                                    size="small"
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
                                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Username</Typography>
                                <TextField
                                    fullWidth
                                    name="username"
                                    required
                                    placeholder="e.g. johndoe"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    variant="outlined"
                                    size="small"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <User size={16} color="#9ca3af" />
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
                                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Role</Typography>
                                <TextField
                                    fullWidth
                                    select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleInputChange}
                                    variant="outlined"
                                    size="small"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: 'white',
                                            borderRadius: '10px',
                                            '& fieldset': { borderColor: '#e5e7eb' },
                                            '&:hover fieldset': { borderColor: '#8b5cf6' },
                                            '&.Mui-focused fieldset': { borderColor: '#8b5cf6' },
                                        }
                                    }}
                                >
                                    {roles.map((option) => (
                                        <MenuItem key={option} value={option}>
                                            {option}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Email</Typography>
                                <TextField
                                    fullWidth
                                    name="email"
                                    type="email"
                                    placeholder="e.g. john@example.com"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    variant="outlined"
                                    size="small"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Mail size={16} color="#9ca3af" />
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
                                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Phone</Typography>
                                <TextField
                                    fullWidth
                                    name="phone"
                                    placeholder="e.g. +92 300 1234567"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    variant="outlined"
                                    size="small"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Phone size={16} color="#9ca3af" />
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
                                    {editMode ? "Change Password (optional)" : "Password"}
                                </Typography>
                                <TextField
                                    fullWidth
                                    name="password"
                                    type="password"
                                    required={!editMode}
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    variant="outlined"
                                    size="small"
                                    placeholder={editMode ? "Leave blank to keep current" : "e.g. ••••••••"}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Lock size={16} color="#9ca3af" />
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
                            {editMode && (
                                <Grid item xs={12}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={formData.isActive}
                                                onChange={handleInputChange}
                                                name="isActive"
                                                color="primary"
                                            />
                                        }
                                        label="Account Active"
                                    />
                                </Grid>
                            )}
                        </Grid>
                    </Box>
                </Card>
            </Box>
        );
    }

    return (
        <Box sx={{ width: '100%', p: 3 }}>
            {/* Action Bar */}
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3,
                gap: 2
            }}>
                <TextField
                    placeholder="Search users..."
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
                <Button
                    variant="contained"
                    startIcon={<UserPlus size={18} />}
                    onClick={handleOpen}
                    sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        px: 3,
                        py: 1,
                        bgcolor: '#8b5cf6',
                        '&:hover': { bgcolor: '#7c3aed' }
                    }}
                >
                    Add New User
                </Button>
            </Box>

            {/* Users Table */}
            <TableContainer component={Paper} elevation={0} sx={{
                borderRadius: 3,
                border: '1px solid #e5e7eb',
                overflowX: 'auto'
            }}>
                <Table sx={{ minWidth: 650 }}>
                    <TableHead sx={{ bgcolor: '#f9fafb' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 600, minWidth: 200 }}>User</TableCell>
                            <TableCell sx={{ fontWeight: 600, minWidth: 150 }}>Username</TableCell>
                            <TableCell sx={{ fontWeight: 600, minWidth: 120 }}>Role</TableCell>
                            <TableCell sx={{ fontWeight: 600, minWidth: 120 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 600, minWidth: 200 }}>Contact</TableCell>
                            <TableCell sx={{ fontWeight: 600, minWidth: 100 }} align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredUsers.map((user) => (
                            <TableRow
                                key={user.id}
                                sx={{ '&:hover': { bgcolor: '#f3f4f6' }, transition: 'background-color 0.2s' }}
                            >
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Avatar sx={{
                                            bgcolor: user.role === 'ADMIN' ? '#fee2e2' : '#dbeafe',
                                            color: user.role === 'ADMIN' ? '#991b1b' : '#1e40af',
                                            fontWeight: 'bold',
                                            fontSize: '0.875rem'
                                        }}>
                                            {user.fullName.charAt(0)}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                {user.fullName}
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.75rem' }}>
                                                ID: {user.id}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" color="textSecondary">
                                        @{user.username}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={user.role}
                                        size="small"
                                        color={getRoleColor(user.role)}
                                        variant="outlined"
                                        sx={{ fontWeight: 'bold', borderRadius: 1.5 }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: '50%',
                                            bgcolor: user.isActive ? '#10b981' : '#ef4444'
                                        }} />
                                        <Typography variant="body2">
                                            {user.isActive ? 'Active' : 'Inactive'}
                                        </Typography>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                        {user.email && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Mail size={14} className="text-zinc-400" />
                                                <Typography variant="caption">{user.email}</Typography>
                                            </Box>
                                        )}
                                        {user.phone && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Phone size={14} className="text-zinc-400" />
                                                <Typography variant="caption">{user.phone}</Typography>
                                            </Box>
                                        )}
                                    </Box>
                                </TableCell>
                                <TableCell align="right">
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                        <IconButton size="small" color="primary" onClick={() => handleEdit(user)}>
                                            <Edit size={18} />
                                        </IconButton>
                                        <IconButton size="small" color="error" onClick={() => handleDelete(user.id)}>
                                            <Trash2 size={18} />
                                        </IconButton>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

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
