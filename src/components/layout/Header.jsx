"use client";

import { Bell, Search, User } from "lucide-react";
import { useSession } from "next-auth/react";
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
    useTheme
} from "@mui/material";

export default function Header() {
    const { data: session } = useSession();
    const router = useRouter();
    const theme = useTheme();

    const handleSearch = (e) => {
        if (e.key === "Enter") {
            const query = e.target.value;
            if (query.trim()) {
                router.push(`/dashboard/search?q=${encodeURIComponent(query)}`);
            }
        }
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
                            borderRadius: 3,
                            backgroundColor: theme.palette.action.hover,
                            '& fieldset': { border: 'none' },
                            '&:hover': { backgroundColor: theme.palette.action.selected },
                        }
                    }}
                />
            </Box>

            {/* Right side */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <IconButton size="medium" color="inherit">
                    <Badge badgeContent={0} color="error" variant="dot">
                        <Bell size={22} />
                    </Badge>
                </IconButton>

                {/* Divider */}
                <Box sx={{ width: 1, height: 28, bgcolor: 'divider' }} />

                {/* User info */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}>
                    <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                        <Typography variant="subtitle2" fontWeight={700} lineHeight={1.2}>
                            {session?.user?.name || "User"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            {session?.user?.role || "Role"}
                        </Typography>
                    </Box>
                    <Avatar
                        src={session?.user?.image}
                        alt={session?.user?.name}
                        sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontSize: '0.875rem' }}
                    >
                        <User size={18} />
                    </Avatar>
                </Box>
            </Box>
        </Box>
    );
}
