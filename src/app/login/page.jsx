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
} from "@mui/material";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";

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
                setError("Invalid email or password. Please try again.");
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
                backgroundColor: "#e0f2fe",
                backgroundImage: "linear-gradient(135deg, #e0f2fe 0%, #dbeafe 100%)",
                p: { xs: 2, sm: 3, md: 4 },
            }}
        >
            {/* Main Container Card */}
            <Box
                sx={{
                    width: "100%",
                    maxWidth: 1040,
                    bgcolor: "#ffffff",
                    borderRadius: "28px",
                    boxShadow: "0 20px 45px -10px rgba(0, 0, 0, 0.07), 0 10px 20px -5px rgba(0, 0, 0, 0.04)",
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
                    }}
                >
                    <Typography
                        variant="h3"
                        sx={{
                            fontWeight: 700,
                            color: "#111827",
                            mb: 1,
                            fontSize: { xs: "1.875rem", sm: "2.25rem" },
                            letterSpacing: "-0.5px",
                        }}
                    >
                        Grace Tailors
                    </Typography>

                    <Typography
                        variant="body1"
                        sx={{
                            color: "#8c857b",
                            mb: 4,
                            fontSize: "0.95rem",
                        }}
                    >
                        Enter your details below to continue
                    </Typography>

                    {error && (
                        <Alert
                            severity="error"
                            variant="outlined"
                            sx={{ mb: 3, borderRadius: 2.5 }}
                            onClose={() => setError("")}
                        >
                            {error}
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit}>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                            <TextField
                                id="email"
                                label="Email"
                                variant="outlined"
                                fullWidth
                                required
                                autoComplete="email"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: "10px",
                                        "& fieldset": { borderColor: "#d1d5db" },
                                        "&:hover fieldset": { borderColor: "#9ca3af" },
                                        "&.Mui-focused fieldset": { borderColor: "#604235" },
                                    },
                                    "& .MuiInputLabel-root": { color: "#6b7280" },
                                    "& .MuiInputLabel-root.Mui-focused": { color: "#604235" },
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
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                aria-label={showPassword ? "Hide password" : "Show password"}
                                                onClick={() => setShowPassword((prev) => !prev)}
                                                edge="end"
                                                size="small"
                                                sx={{ color: "#6b7280" }}
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
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: "10px",
                                        "& fieldset": { borderColor: "#d1d5db" },
                                        "&:hover fieldset": { borderColor: "#9ca3af" },
                                        "&.Mui-focused fieldset": { borderColor: "#604235" },
                                    },
                                    "& .MuiInputLabel-root": { color: "#6b7280" },
                                    "& .MuiInputLabel-root.Mui-focused": { color: "#604235" },
                                }}
                            />

                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                disabled={loading}
                                sx={{
                                    py: 1.5,
                                    borderRadius: "10px",
                                    bgcolor: "#604235",
                                    color: "#ffffff",
                                    textTransform: "none",
                                    fontWeight: 600,
                                    fontSize: "1rem",
                                    boxShadow: "none",
                                    "&:hover": {
                                        bgcolor: "#4d3429",
                                        boxShadow: "0 4px 12px rgba(96, 66, 53, 0.25)",
                                    },
                                    "&.Mui-disabled": {
                                        bgcolor: "#a8978e",
                                        color: "#ffffff",
                                    },
                                }}
                            >
                                {loading ? <CircularProgress size={22} color="inherit" /> : "Sign in"}
                            </Button>
                        </Box>
                    </form>
                </Box>

                {/* Right Panel: Tailor Banner Image */}
                <Box
                    sx={{
                        flex: 1.05,
                        display: { xs: "none", md: "block" },
                        position: "relative",
                        minHeight: 520,
                        borderRadius: "20px",
                        overflow: "hidden",
                    }}
                >
                    <Box
                        component="img"
                        src="/tailor_login_banner.png"
                        alt="Tailor craftsmanship"
                        sx={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                            borderRadius: "20px",
                        }}
                    />
                </Box>
            </Box>
        </Box>
    );
}
