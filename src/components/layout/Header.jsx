"use client";

import { Bell, Search, User, Settings, ExternalLink, Plus } from "lucide-react";
import { useSession } from "next-auth/react";
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
    Button
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
                height: 80,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 4,
                gap: 2,
                backgroundColor: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(20px)',
                borderBottom: 'none',
                // boxShadow: 'none', // cleaner look as per Hireism
            }}
        >
            {/* Search - Centered */}
            <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
                <TextField
                    placeholder="Search something..."
                    variant="outlined"
                    size="small"
                    onKeyDown={handleSearch}
                    sx={{ width: '100%', maxWidth: 460 }}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <Search size={18} color="#94A3B8" />
                            </InputAdornment>
                        ),
                        sx: {
                            borderRadius: '16px',
                            backgroundColor: '#fff',
                            border: '1px solid #E2E8F0',
                            transition: 'all 0.2s ease',
                            '& fieldset': { border: 'none' },
                            '&:hover': {
                                borderColor: theme.palette.primary.main,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                            },
                        }
                    }}
                />
            </Box>

            {/* Right side */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                <Button
                    variant="contained"
                    startIcon={<Plus size={18} />}
                    sx={{
                        bgcolor: 'primary.main',
                        color: 'white',
                        px: 3,
                        py: 1,
                        borderRadius: '16px',
                        boxShadow: '0 4px 12px rgba(75, 59, 195, 0.2)',
                        '&:hover': {
                            bgcolor: 'primary.dark',
                        }
                    }}
                >
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
                    '& .user-name': {color: theme.palette.primary.main }
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
        </Box >
    );
}
