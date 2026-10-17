"use client";

import { useState } from "react";
import { Bell, Search, User, Plus, LogOut, Settings, Store } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
    TextField,
    InputAdornment,
    IconButton,
    Badge,
    Typography,
    Box,
    Avatar,
    useTheme,
    Button,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Divider,
    Chip,
    Tooltip,
} from "@mui/material";

export default function Header() {
    const { data: session } = useSession();
    const router = useRouter();
    const theme = useTheme();

    const [userMenuAnchor, setUserMenuAnchor] = useState(null);
    const [searchValue, setSearchValue] = useState("");

    const handleSearch = (e) => {
        if (e.key === "Enter") {
            const query = searchValue.trim();
            if (query) {
                router.push(`/dashboard/search?q=${encodeURIComponent(query)}`);
            }
        }
    };

    const handleUserMenuOpen = (event) => {
        setUserMenuAnchor(event.currentTarget);
    };

    const handleUserMenuClose = () => {
        setUserMenuAnchor(null);
    };

    const userName = session?.user?.name || session?.user?.fullName || "Staff Member";
    const userRole = session?.user?.role || "USER";
    const userBranch = session?.user?.branch?.name || (session?.user?.role === "ADMIN" ? "All Branches" : "Main Branch");

    const initials = userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();

    return (
        <Box
            component="header"
            sx={{
                height: 64,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                px: { xs: 2, sm: 3 },
                gap: 2,
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(12px)",
                borderBottom: `1px solid ${theme.palette.divider}`,
                boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.04)",
                borderRadius: 0,
            }}
        >
            {/* Search Input Bar (Sharp Architectural Style) */}
            <Box sx={{ flexGrow: 1, maxWidth: { xs: 260, sm: 460 } }}>
                <TextField
                    fullWidth
                    placeholder="Search bookings, customers, fabrics..."
                    variant="outlined"
                    size="small"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    onKeyDown={handleSearch}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search size={18} color="#64748B" />
                            </InputAdornment>
                        ),
                        endAdornment: (
                            <InputAdornment position="end" sx={{ display: { xs: "none", md: "flex" } }}>
                                <Box
                                    sx={{
                                        px: 1,
                                        py: 0.2,
                                        borderRadius: 0,
                                        bgcolor: "#F1F5F9",
                                        border: "1px solid #E2E8F0",
                                        color: "#64748B",
                                        fontSize: "0.6875rem",
                                        fontWeight: 600,
                                    }}
                                >
                                    Enter
                                </Box>
                            </InputAdornment>
                        ),
                        sx: {
                            borderRadius: 0,
                            backgroundColor: "#F8FAFC",
                            "& fieldset": { borderColor: "rgba(226, 232, 240, 0.9)", borderRadius: 0 },
                            "&:hover fieldset": { borderColor: "#CBD5E1" },
                            "&.Mui-focused fieldset": {
                                borderColor: "primary.main",
                                borderWidth: "1.5px",
                                borderRadius: 0,
                            },
                            "&.Mui-focused": {
                                backgroundColor: "#FFFFFF",
                                boxShadow: "0 2px 8px rgba(37, 99, 235, 0.12)",
                            },
                        },
                    }}
                />
            </Box>

            {/* Right side Actions */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexShrink: 0 }}>
                {/* Branch Chip Indicator */}
                <Box sx={{ display: { xs: "none", lg: "flex" }, alignItems: "center" }}>
                    <Chip
                        icon={<Store size={14} />}
                        label={userBranch}
                        size="small"
                        sx={{
                            bgcolor: "#EFF6FF",
                            color: "#1E40AF",
                            fontWeight: 600,
                            border: "1px solid #BFDBFE",
                            borderRadius: 0,
                            px: 0.5,
                            "& .MuiChip-icon": { color: "#2563EB" },
                        }}
                    />
                </Box>

                {/* Quick Add Booking Action Button */}
                <Button
                    variant="contained"
                    size="small"
                    startIcon={<Plus size={16} />}
                    onClick={() => router.push("/dashboard/bookings")}
                    sx={{
                        display: { xs: "none", sm: "inline-flex" },
                        borderRadius: 0,
                        px: 2,
                        py: 0.75,
                        fontWeight: 600,
                        fontSize: "0.8125rem",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                        boxShadow: "0 2px 6px rgba(37, 99, 235, 0.25)",
                    }}
                >
                    New Booking
                </Button>

                {/* Notifications Icon Button */}
                <Tooltip title="Notifications">
                    <IconButton
                        size="medium"
                        sx={{
                            color: "#64748B",
                            bgcolor: "#F8FAFC",
                            border: "1px solid #E2E8F0",
                            borderRadius: 0,
                            "&:hover": { bgcolor: "#F1F5F9", color: "#1E293B" },
                        }}
                    >
                        <Badge color="error" variant="dot" invisible={false}>
                            <Bell size={18} />
                        </Badge>
                    </IconButton>
                </Tooltip>

                {/* Subtle vertical divider */}
                <Box sx={{ width: 1, height: 26, bgcolor: "divider" }} />

                {/* User Profile trigger with Dropdown Menu */}
                <Box
                    onClick={handleUserMenuOpen}
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.25,
                        cursor: "pointer",
                        p: 0.5,
                        borderRadius: 0,
                        transition: "background-color 0.15s ease",
                        "&:hover": {
                            bgcolor: "rgba(0, 0, 0, 0.03)",
                        },
                    }}
                >
                    <Avatar
                        variant="square"
                        sx={{
                            width: 36,
                            height: 36,
                            fontSize: "0.85rem",
                            fontWeight: 700,
                            background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
                            color: "#FFFFFF",
                            boxShadow: "0 2px 6px rgba(37, 99, 235, 0.25)",
                            borderRadius: 0,
                        }}
                    >
                        {initials || <User size={18} />}
                    </Avatar>

                    <Box sx={{ textAlign: "left", display: { xs: "none", sm: "block" } }}>
                        <Typography
                            variant="subtitle2"
                            fontWeight={700}
                            lineHeight={1.2}
                            sx={{ color: "#0F172A", maxWidth: 140 }}
                            noWrap
                        >
                            {userName}
                        </Typography>
                        <Typography
                            variant="caption"
                            sx={{
                                color: "#64748B",
                                fontSize: "0.7rem",
                                fontWeight: 600,
                                textTransform: "uppercase",
                                letterSpacing: "0.04em",
                                display: "block",
                            }}
                        >
                            {userRole}
                        </Typography>
                    </Box>
                </Box>

                {/* Interactive Material Menu */}
                <Menu
                    anchorEl={userMenuAnchor}
                    open={Boolean(userMenuAnchor)}
                    onClose={handleUserMenuClose}
                    transformOrigin={{ horizontal: "right", vertical: "top" }}
                    anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                    PaperProps={{
                        sx: {
                            mt: 1.5,
                            minWidth: 220,
                            borderRadius: 0,
                            p: 1,
                        },
                    }}
                >
                    <Box sx={{ px: 2, py: 1.5 }}>
                        <Typography variant="subtitle2" fontWeight={700} color="#0F172A">
                            {userName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                            {session?.user?.email || "grace@tailors.com"}
                        </Typography>
                        <Chip
                            label={userRole}
                            size="small"
                            color="primary"
                            sx={{
                                mt: 1,
                                height: 20,
                                fontSize: "0.65rem",
                                fontWeight: 700,
                                borderRadius: 0,
                            }}
                        />
                    </Box>

                    <Divider sx={{ my: 0.5 }} />

                    <MenuItem
                        onClick={() => {
                            handleUserMenuClose();
                            router.push("/dashboard/settings");
                        }}
                        sx={{ borderRadius: 0 }}
                    >
                        <ListItemIcon>
                            <Settings size={18} />
                        </ListItemIcon>
                        <ListItemText primary="System Settings" primaryTypographyProps={{ fontSize: "0.875rem" }} />
                    </MenuItem>

                    <MenuItem
                        onClick={() => {
                            handleUserMenuClose();
                            signOut({ callbackUrl: "/login" });
                        }}
                        sx={{ color: "error.main", borderRadius: 0 }}
                    >
                        <ListItemIcon sx={{ color: "error.main" }}>
                            <LogOut size={18} />
                        </ListItemIcon>
                        <ListItemText
                            primary="Sign Out"
                            primaryTypographyProps={{ fontSize: "0.875rem", fontWeight: 600 }}
                        />
                    </MenuItem>
                </Menu>
            </Box>
        </Box>
    );
}
