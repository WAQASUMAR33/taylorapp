"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Scissors } from "lucide-react";
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    InputAdornment,
    IconButton,
    Alert,
    CircularProgress,
    Divider,
    Avatar,
} from "@mui/material";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import LoginIcon from "@mui/icons-material/Login";

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
                setError("Invalid username or password. Please try again.");
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
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "background.default",
                px: 2,
            }}
        >
            <Paper
                elevation={3}
                sx={{
                    width: "100%",
                    maxWidth: 420,
                    borderRadius: 3,
                    overflow: "hidden",
                }}
            >
                {/* Header band */}
                <Box
                    sx={{
                        bgcolor: "primary.main",
                        px: 4,
                        py: 4,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 1.5,
                    }}
                >
                    <Avatar
                        sx={{
                            width: 56,
                            height: 56,
                            bgcolor: "primary.dark",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
                        }}
                    >
                        <Scissors size={28} />
                    </Avatar>
                    <Box sx={{ textAlign: "center" }}>
                        <Typography variant="h5" fontWeight={700} color="primary.contrastText">
                            TailorFlow
                        </Typography>
                        <Typography variant="body2" sx={{ color: "primary.contrastText", opacity: 0.8, mt: 0.5 }}>
                            Tailor Management System
                        </Typography>
                    </Box>
                </Box>

                {/* Form body */}
                <Box
                    component="form"
                    onSubmit={handleSubmit}
                    sx={{ px: 4, py: 4 }}
                    noValidate
                >
                    <Typography variant="h6" fontWeight={600} color="text.primary" gutterBottom>
                        Sign In
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Enter your credentials to access the dashboard.
                    </Typography>

                    {error && (
                        <Alert
                            severity="error"
                            variant="filled"
                            sx={{ mb: 3, borderRadius: 2 }}
                            onClose={() => setError("")}
                        >
                            {error}
                        </Alert>
                    )}

                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                        <TextField
                            id="username"
                            label="Username"
                            variant="outlined"
                            size="small"
                            fullWidth
                            required
                            autoComplete="username"
                            autoFocus
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <AccountCircleOutlinedIcon fontSize="small" color="action" />
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <TextField
                            id="password"
                            label="Password"
                            variant="outlined"
                            size="small"
                            type={showPassword ? "text" : "password"}
                            fullWidth
                            required
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LockOutlinedIcon fontSize="small" color="action" />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                            onClick={() => setShowPassword((prev) => !prev)}
                                            edge="end"
                                            size="small"
                                        >
                                            {showPassword ? (
                                                <VisibilityOffOutlinedIcon fontSize="small" />
                                            ) : (
                                                <VisibilityOutlinedIcon fontSize="small" />
                                            )}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Box>

                    <Button
                        id="login-submit-btn"
                        type="submit"
                        fullWidth
                        variant="contained"
                        size="large"
                        disabled={loading || !username.trim() || !password.trim()}
                        startIcon={loading ? null : <LoginIcon />}
                        sx={{
                            mt: 3,
                            borderRadius: 2,
                            textTransform: "none",
                            fontWeight: 600,
                            fontSize: "1rem",
                            py: 1.25,
                        }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : "Sign In"}
                    </Button>

                    <Divider sx={{ my: 3 }} />

                    <Typography variant="caption" color="text.disabled" align="center" display="block">
                        &copy; {new Date().getFullYear()} TailorFlow &mdash; All rights reserved.
                    </Typography>
                </Box>
            </Paper>
        </Box>
    );
}
