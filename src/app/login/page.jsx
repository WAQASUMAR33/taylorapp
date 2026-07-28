"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
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
    Checkbox,
    FormControlLabel,
    Link as MuiLink
} from "@mui/material";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import CheckBoxOutlinedIcon from "@mui/icons-material/CheckBoxOutlined";

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(true);
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
                width: "100vw",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#e8f5e9",
                backgroundImage: `
                    radial-gradient(circle at 10% 10%, #a7f3d0 0%, transparent 40%),
                    radial-gradient(circle at 90% 90%, #6ee7b7 0%, transparent 40%)
                `,
                position: "relative",
                overflow: "hidden",
                p: { xs: 2, sm: 3 },
                "&::before": {
                    content: '""',
                    position: "absolute",
                    top: -60,
                    right: -60,
                    width: 260,
                    height: 260,
                    borderRadius: "40% 60% 70% 30% / 40% 50% 60% 50%",
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    opacity: 0.85,
                    pointerEvents: "none",
                },
                "&::after": {
                    content: '""',
                    position: "absolute",
                    bottom: -80,
                    left: -80,
                    width: 320,
                    height: 320,
                    borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%",
                    background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                    opacity: 0.8,
                    pointerEvents: "none",
                }
            }}
        >
            <Paper
                elevation={10}
                sx={{
                    width: "100%",
                    maxWidth: 880,
                    minHeight: 480,
                    borderRadius: 5,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: { xs: "column", md: "row" },
                    boxShadow: "0 20px 40px rgba(5, 150, 105, 0.15)",
                    position: "relative",
                    zIndex: 1,
                }}
            >
                {/* Left Panel: Form */}
                <Box
                    sx={{
                        flex: 1.1,
                        bgcolor: "#ffffff",
                        p: { xs: 4, sm: 6 },
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                    }}
                >
                    <Typography
                        variant="h4"
                        fontWeight={800}
                        sx={{
                            color: "#059669",
                            mb: 4,
                            letterSpacing: "-0.5px"
                        }}
                    >
                        Log in
                    </Typography>

                    {error && (
                        <Alert
                            severity="error"
                            variant="outlined"
                            sx={{ mb: 3, borderRadius: 2 }}
                            onClose={() => setError("")}
                        >
                            {error}
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit}>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 3.5 }}>
                            <TextField
                                id="username"
                                label="Username"
                                variant="standard"
                                fullWidth
                                required
                                autoComplete="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <AccountCircleOutlinedIcon sx={{ color: "#a1a1aa" }} />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{
                                    "& .MuiInput-underline:before": { borderBottomColor: "#e4e4e7" },
                                    "& .MuiInput-underline:hover:before": { borderBottomColor: "#059669" },
                                    "& .MuiInput-underline:after": { borderBottomColor: "#059669" },
                                    "& .MuiInputLabel-root": { color: "#a1a1aa" },
                                    "& .MuiInputLabel-root.Mui-focused": { color: "#059669" },
                                }}
                            />

                            <TextField
                                id="password"
                                label="Password"
                                variant="standard"
                                type={showPassword ? "text" : "password"}
                                fullWidth
                                required
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <LockOutlinedIcon sx={{ color: "#a1a1aa" }} />
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                aria-label={showPassword ? "Hide password" : "Show password"}
                                                onClick={() => setShowPassword((prev) => !prev)}
                                                edge="end"
                                                size="small"
                                                sx={{ color: "#a1a1aa" }}
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
                                sx={{
                                    "& .MuiInput-underline:before": { borderBottomColor: "#e4e4e7" },
                                    "& .MuiInput-underline:hover:before": { borderBottomColor: "#059669" },
                                    "& .MuiInput-underline:after": { borderBottomColor: "#059669" },
                                    "& .MuiInputLabel-root": { color: "#a1a1aa" },
                                    "& .MuiInputLabel-root.Mui-focused": { color: "#059669" },
                                }}
                            />

                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 1 }}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    disabled={loading || !username.trim() || !password.trim()}
                                    sx={{
                                        px: 4,
                                        py: 1.2,
                                        borderRadius: 8,
                                        bgcolor: "#059669",
                                        color: "#ffffff",
                                        textTransform: "none",
                                        fontWeight: 700,
                                        fontSize: "0.95rem",
                                        boxShadow: "0 4px 14px rgba(5, 150, 105, 0.35)",
                                        "&:hover": {
                                            bgcolor: "#047857",
                                            boxShadow: "0 6px 20px rgba(5, 150, 105, 0.45)",
                                        },
                                        "&.Mui-disabled": {
                                            bgcolor: "#a7f3d0",
                                            color: "#ffffff",
                                        }
                                    }}
                                >
                                    {loading ? <CircularProgress size={22} color="inherit" /> : "Log in"}
                                </Button>

                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={rememberMe}
                                            onChange={(e) => setRememberMe(e.target.checked)}
                                            checkedIcon={<CheckBoxOutlinedIcon sx={{ color: "#059669" }} />}
                                            size="small"
                                        />
                                    }
                                    label={
                                        <Typography variant="body2" sx={{ color: "#52525b", fontWeight: 600, fontSize: "0.85rem" }}>
                                            Remember me
                                        </Typography>
                                    }
                                />
                            </Box>

                            <Box sx={{ textAlign: "center", mt: 1 }}>
                                <MuiLink
                                    href="#"
                                    underline="hover"
                                    sx={{
                                        color: "#6ee7b7",
                                        fontSize: "0.8rem",
                                        fontWeight: 500,
                                    }}
                                    onClick={(e) => e.preventDefault()}
                                >
                                    forgot password?
                                </MuiLink>
                            </Box>
                        </Box>
                    </form>
                </Box>

                {/* Right Panel: Welcome Back Banner */}
                <Box
                    sx={{
                        flex: 1,
                        background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                        p: { xs: 4, sm: 6 },
                        color: "#ffffff",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center",
                        position: "relative",
                    }}
                >
                    <Typography variant="h3" fontWeight={800} sx={{ mb: 1.5, letterSpacing: "-0.5px" }}>
                        Welcome Back!
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.9, fontWeight: 400, mb: 4 }}>
                        Please enter your details
                    </Typography>

                    <Typography variant="body2" sx={{ opacity: 0.85, mb: 2, fontSize: "0.9rem" }}>
                        Don't have an account?
                    </Typography>

                    <Button
                        variant="outlined"
                        onClick={() => router.push("/register")}
                        sx={{
                            px: 4,
                            py: 1,
                            borderRadius: 8,
                            borderColor: "#ffffff",
                            color: "#ffffff",
                            textTransform: "none",
                            fontWeight: 600,
                            fontSize: "0.95rem",
                            borderWidth: "1.5px",
                            "&:hover": {
                                borderColor: "#ffffff",
                                bgcolor: "rgba(255, 255, 255, 0.15)",
                                borderWidth: "1.5px",
                            }
                        }}
                    >
                        Sign Up
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
}
