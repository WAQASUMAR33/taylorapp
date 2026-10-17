"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
    Box,
    Typography,
    TextField,
    Button,
    InputAdornment,
    IconButton,
    Alert,
    CircularProgress,
    Chip,
} from "@mui/material";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import { Scissors, Lock, Mail, ArrowRight, ShieldCheck } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const result = await signIn("credentials", {
                username,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError("Invalid email or password. Please verify and try again.");
            } else {
                router.push("/dashboard");
            }
        } catch (err) {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: "100vh",
                width: "100vw",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "#F8FAFC",
                backgroundImage: "radial-gradient(circle at 15% 20%, rgba(37, 99, 235, 0.08) 0%, transparent 40%), radial-gradient(circle at 85% 80%, rgba(124, 58, 237, 0.08) 0%, transparent 40%)",
                p: { xs: 2, sm: 3, md: 4 },
                borderRadius: 0,
            }}
        >
            {/* Main Sharp Geometric Card */}
            <Box
                sx={{
                    width: "100%",
                    maxWidth: 1060,
                    bgcolor: "#FFFFFF",
                    borderRadius: 0,
                    border: "1px solid rgba(226, 232, 240, 0.9)",
                    boxShadow: "0 15px 35px -5px rgba(0, 0, 0, 0.06)",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: { xs: "column", md: "row" },
                    p: { xs: 2.5, sm: 3 },
                    gap: { xs: 2, md: 3 },
                }}
            >
                {/* Left Panel: Form */}
                <Box
                    sx={{
                        flex: 1,
                        p: { xs: 2, sm: 4, md: 5 },
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        borderRadius: 0,
                    }}
                >
                    {/* Brand Badge */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
                        <Box
                            sx={{
                                width: 44,
                                height: 44,
                                borderRadius: 0,
                                background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#FFFFFF",
                                boxShadow: "0 2px 6px rgba(37, 99, 235, 0.3)",
                            }}
                        >
                            <Scissors size={22} strokeWidth={2.2} />
                        </Box>
                        <Box>
                            <Typography
                                variant="h6"
                                sx={{
                                    fontWeight: 800,
                                    background: "linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)",
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                    letterSpacing: "-0.01em",
                                    lineHeight: 1.2,
                                }}
                            >
                                GRACE TAILORS
                            </Typography>
                            <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 600 }}>
                                Tailor Enterprise Suite
                            </Typography>
                        </Box>
                    </Box>

                    <Typography
                        variant="h4"
                        sx={{
                            fontWeight: 800,
                            color: "#0F172A",
                            mb: 1,
                            letterSpacing: "-0.02em",
                        }}
                    >
                        Sign in to account
                    </Typography>

                    <Typography
                        variant="body2"
                        sx={{
                            color: "#64748B",
                            mb: 3.5,
                            fontSize: "0.925rem",
                        }}
                    >
                        Welcome back! Please enter your credentials to access operations.
                    </Typography>

                    {error && (
                        <Alert
                            severity="error"
                            sx={{ mb: 3, borderRadius: 0 }}
                            onClose={() => setError("")}
                        >
                            {error}
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit}>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                            <TextField
                                id="email"
                                label="Email address"
                                variant="outlined"
                                fullWidth
                                required
                                autoComplete="email"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Mail size={18} color="#64748B" />
                                        </InputAdornment>
                                    ),
                                    sx: { borderRadius: 0 },
                                }}
                            />

                            <TextField
                                id="password"
                                label="Password"
                                variant="outlined"
                                type={showPassword ? "text" : "password"}
                                fullWidth
                                required
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Lock size={18} color="#64748B" />
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                aria-label={showPassword ? "Hide password" : "Show password"}
                                                onClick={() => setShowPassword((prev) => !prev)}
                                                edge="end"
                                                size="small"
                                                sx={{ color: "#64748B", borderRadius: 0 }}
                                            >
                                                {showPassword ? (
                                                    <VisibilityOffOutlinedIcon fontSize="small" />
                                                ) : (
                                                    <VisibilityOutlinedIcon fontSize="small" />
                                                )}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                    sx: { borderRadius: 0 },
                                }}
                            />

                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                disabled={loading}
                                endIcon={!loading && <ArrowRight size={18} />}
                                sx={{
                                    py: 1.4,
                                    borderRadius: 0,
                                    fontSize: "0.95rem",
                                    fontWeight: 700,
                                    boxShadow: "0 2px 8px rgba(37, 99, 235, 0.25)",
                                }}
                            >
                                {loading ? <CircularProgress size={22} color="inherit" /> : "Sign In to Dashboard"}
                            </Button>
                        </Box>
                    </form>

                    <Box sx={{ mt: 4, pt: 3, borderTop: "1px solid rgba(226, 232, 240, 0.8)", display: "flex", alignItems: "center", gap: 1 }}>
                        <ShieldCheck size={16} color="#10B981" />
                        <Typography variant="caption" color="text.secondary">
                            Authorized personnel only &bull; End-to-end encrypted session
                        </Typography>
                    </Box>
                </Box>

                {/* Right Panel: Tailor Banner Image & Feature Showcase */}
                <Box
                    sx={{
                        flex: 1.05,
                        display: { xs: "none", md: "flex" },
                        position: "relative",
                        minHeight: 540,
                        borderRadius: 0,
                        overflow: "hidden",
                        flexDirection: "column",
                        justifyContent: "flex-end",
                        p: 4,
                        bgcolor: "#0F172A",
                    }}
                >
                    <Box
                        component="img"
                        src="/tailor_login_banner.png"
                        alt="Tailor craftsmanship"
                        sx={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            opacity: 0.65,
                            borderRadius: 0,
                        }}
                    />
                    <Box
                        sx={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            background: "linear-gradient(180deg, rgba(15, 23, 42, 0.2) 0%, rgba(15, 23, 42, 0.85) 100%)",
                        }}
                    />
                    <Box sx={{ position: "relative", zIndex: 1, color: "#FFFFFF" }}>
                        <Chip
                            label="PRECISION BESPOKE"
                            size="small"
                            sx={{
                                bgcolor: "rgba(255, 255, 255, 0.15)",
                                backdropFilter: "blur(8px)",
                                color: "#FFFFFF",
                                fontWeight: 700,
                                fontSize: "0.6875rem",
                                mb: 1.5,
                                borderRadius: 0,
                            }}
                        />
                        <Typography variant="h5" fontWeight={800} sx={{ mb: 1, letterSpacing: "-0.01em" }}>
                            Mastery in Bespoke Tailoring Management
                        </Typography>
                        <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.8)", fontSize: "0.875rem" }}>
                            Track real-time bookings, cutting, stitching workflows, inventory, customer measurement records, and ledgers seamlessly.
                        </Typography>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}
