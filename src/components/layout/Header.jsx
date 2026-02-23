"use client";

import React, { useState } from "react";
import { Bell, Search, User, LogOut, LayoutDashboard, ChevronDown } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
    Toolbar,
    TextField,
    InputAdornment,
    IconButton,
    Badge,
    Typography,
    Box,
    Avatar,
    useTheme,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Divider,
    ButtonBase
} from "@mui/material";

export default function Header() {
    const { data: session } = useSession();
    const router = useRouter();
    const theme = useTheme();
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const handleSearch = (e) => {
        if (e.key === "Enter") {
            const query = e.target.value;
            if (query.trim()) {
                router.push(`/dashboard/search?q=${encodeURIComponent(query)}`);
            }
        }
    };

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleNavigate = (path) => {
        handleMenuClose();
        router.push(path);
    };

    const handleLogout = async () => {
        handleMenuClose();
        await signOut({ callbackUrl: "/login" });
    };

    return (
        <Box
            sx={{
                height: 64,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 3,
                gap: 2,
                backgroundColor: 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(12px)',
                borderBottom: `1px solid ${theme.palette.divider}`,
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
        >
            {/* Search */}
            <Box sx={{ flexGrow: 1, maxWidth: 420 }}>
                <TextField
                    fullWidth
                    placeholder="Search everything..."
                    variant="outlined"
                    size="small"
                    onKeyDown={handleSearch}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search size={18} color={theme.palette.text.secondary} />
                            </InputAdornment>
                        ),
                        sx: {
                            borderRadius: '12px',
                            backgroundColor: theme.palette.action.hover,
                            transition: 'all 0.25s ease',
                            '& fieldset': { border: '1px solid transparent' },
                            '&:hover': {
                                backgroundColor: theme.palette.action.selected,
                                '& fieldset': { borderColor: theme.palette.divider }
                            },
                            '&.Mui-focused': {
                                backgroundColor: '#fff',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                '& fieldset': { borderColor: theme.palette.primary.main, borderWidth: '1px !important' },
                            }
                        }
                    }}
                />
            </Box>

            {/* Right side */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton
                    size="medium"
                    sx={{
                        transition: 'all 0.2s',
                        '&:hover': { backgroundColor: theme.palette.action.hover, transform: 'translateY(-1px)' }
                    }}
                >
                    <Badge
                        badgeContent={0}
                        color="error"
                        variant="dot"
                        sx={{ '& .MuiBadge-badge': { boxShadow: `0 0 0 2px #fff` } }}
                    >
                        <Bell size={20} color={theme.palette.text.secondary} />
                    </Badge>
                </IconButton>

                {/* Divider */}
                <Box sx={{ width: '1px', height: 24, bgcolor: 'divider', mx: 0.5 }} />

                {/* User info */}
                <ButtonBase
                    onClick={handleMenuOpen}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        p: 0.5,
                        pr: 1.5,
                        borderRadius: '16px',
                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        backgroundColor: open ? theme.palette.action.selected : 'transparent',
                        '&:hover': {
                            backgroundColor: theme.palette.action.hover,
                            transform: 'translateY(-1px)',
                            '& .user-name': { color: theme.palette.primary.main },
                            '& .chevron-icon': { transform: 'translateY(1px)' }
                        }
                    }}
                >
                    <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                        <Typography
                            variant="subtitle2"
                            className="user-name"
                            fontWeight={700}
                            fontSize="0.875rem"
                            lineHeight={1.2}
                            sx={{ transition: 'color 0.2s' }}
                        >
                            {session?.user?.name || "Admin User"}
                        </Typography>
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            fontWeight={600}
                            sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem', opacity: 0.8 }}
                        >
                            {session?.user?.role || "ADMIN"}
                        </Typography>
                    </Box>
                    <Box sx={{ position: 'relative' }}>
                        <Avatar
                            src={session?.user?.image}
                            alt={session?.user?.name}
                            sx={{
                                bgcolor: 'primary.main',
                                width: 38,
                                height: 38,
                                fontSize: '1rem',
                                fontWeight: 700,
                                boxShadow: open
                                    ? `0 0 0 2px ${theme.palette.background.paper}, 0 0 0 4px ${theme.palette.primary.main}`
                                    : '0 2px 8px rgba(59, 130, 246, 0.25)',
                                transition: 'all 0.2s',
                            }}
                        >
                            {(session?.user?.name || "A")[0]}
                        </Avatar>
                    </Box>
                    <ChevronDown
                        size={14}
                        className="chevron-icon"
                        color={theme.palette.text.disabled}
                        style={{
                            marginLeft: -4,
                            transition: 'transform 0.2s',
                            transform: open ? 'rotate(180deg)' : 'none'
                        }}
                    />
                </ButtonBase>

                {/* Profile Menu */}
                <Menu
                    anchorEl={anchorEl}
                    open={open}
                    onClose={handleMenuClose}
                    onClick={handleMenuClose}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                    PaperProps={{
                        elevation: 0,
                        sx: {
                            overflow: 'visible',
                            filter: 'drop-shadow(0px 8px 24px rgba(0,0,0,0.12))',
                            mt: 1.5,
                            borderRadius: '16px',
                            minWidth: 200,
                            border: `1px solid ${theme.palette.divider}`,
                            '& .MuiAvatar-root': {
                                width: 32,
                                height: 32,
                                ml: -0.5,
                                mr: 1,
                            },
                        },
                    }}
                >
                    <Box sx={{ px: 2, py: 1.5, display: { sm: 'none' } }}>
                        <Typography variant="subtitle2" fontWeight={700}>
                            {session?.user?.name || "Admin User"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {session?.user?.role || "ADMIN"}
                        </Typography>
                    </Box>

                    <MenuItem
                        onClick={() => handleNavigate('/dashboard')}
                        sx={{ py: 1.2, mx: 1, borderRadius: '10px' }}
                    >
                        <ListItemIcon>
                            <LayoutDashboard size={18} strokeWidth={2.5} />
                        </ListItemIcon>
                        <ListItemText
                            primary="Dashboard"
                            primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                        />
                    </MenuItem>

                    <MenuItem
                        onClick={() => handleNavigate('/dashboard/profile')}
                        sx={{ py: 1.2, mx: 1, borderRadius: '10px' }}
                    >
                        <ListItemIcon>
                            <User size={18} strokeWidth={2.5} />
                        </ListItemIcon>
                        <ListItemText
                            primary="My Profile"
                            primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                        />
                    </MenuItem>

                    <Divider sx={{ my: 1, opacity: 0.6 }} />

                    <MenuItem
                        onClick={handleLogout}
                        sx={{
                            py: 1.2,
                            mx: 1,
                            borderRadius: '10px',
                            color: 'error.main',
                            '&:hover': { backgroundColor: 'rgba(239, 68, 68, 0.08)' }
                        }}
                    >
                        <ListItemIcon>
                            <LogOut size={18} color={theme.palette.error.main} strokeWidth={2.5} />
                        </ListItemIcon>
                        <ListItemText
                            primary="Logout"
                            primaryTypographyProps={{ variant: 'body2', fontWeight: 700 }}
                        />
                    </MenuItem>
                </Menu>
            </Box>
        </Box>
    );
}
