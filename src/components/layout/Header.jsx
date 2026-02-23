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
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    cursor: 'pointer',
                    p: 0.5,
                    pr: 1,
                    borderRadius: '12px',
                    transition: 'all 0.2s',
                    '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                        '& .user-name': { color: theme.palette.primary.main }
                    }
                }}>
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
                    <Avatar
                        src={session?.user?.image}
                        alt={session?.user?.name}
                        sx={{
                            bgcolor: 'primary.main',
                            width: 38,
                            height: 38,
                            fontSize: '1rem',
                            fontWeight: 700,
                            boxShadow: '0 2px 8px rgba(59, 130, 246, 0.25)',
                            transition: 'transform 0.2s',
                            '&:hover': { transform: 'scale(1.05)' }
                        }}
                    >
                        {(session?.user?.name || "A")[0]}
                    </Avatar>
                </Box>
            </Box>
        </Box>
    );
}
