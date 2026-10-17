import { createTheme, alpha } from '@mui/material/styles';

// Material Design Baseline Palette for Grace Tailors (Geometric Sharp Architecture)
const PRIMARY_MAIN = '#2563EB'; // Royal Indigo / Blue
const PRIMARY_LIGHT = '#60A5FA';
const PRIMARY_DARK = '#1D4ED8';

const SECONDARY_MAIN = '#0284C7'; // Cyan / Sky Blue
const SECONDARY_LIGHT = '#38BDF8';
const SECONDARY_DARK = '#0369A1';

const SUCCESS_MAIN = '#10B981';
const WARNING_MAIN = '#F59E0B';
const ERROR_MAIN = '#EF4444';
const INFO_MAIN = '#6366F1';

const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: PRIMARY_MAIN,
            light: PRIMARY_LIGHT,
            dark: PRIMARY_DARK,
            contrastText: '#FFFFFF',
        },
        secondary: {
            main: SECONDARY_MAIN,
            light: SECONDARY_LIGHT,
            dark: SECONDARY_DARK,
            contrastText: '#FFFFFF',
        },
        success: {
            main: SUCCESS_MAIN,
            light: '#34D399',
            dark: '#059669',
            contrastText: '#FFFFFF',
        },
        warning: {
            main: WARNING_MAIN,
            light: '#FBBF24',
            dark: '#D97706',
            contrastText: '#FFFFFF',
        },
        error: {
            main: ERROR_MAIN,
            light: '#F87171',
            dark: '#DC2626',
            contrastText: '#FFFFFF',
        },
        info: {
            main: INFO_MAIN,
            light: '#818CF8',
            dark: '#4F46E5',
            contrastText: '#FFFFFF',
        },
        text: {
            primary: '#0F172A', // Slate 900
            secondary: '#64748B', // Slate 500
            disabled: '#94A3B8',
        },
        background: {
            default: '#F8FAFC', // Slate 50
            paper: '#FFFFFF',
        },
        divider: 'rgba(226, 232, 240, 0.9)', // Slate 200
        action: {
            hover: 'rgba(37, 99, 235, 0.04)',
            selected: 'rgba(37, 99, 235, 0.08)',
            focus: 'rgba(37, 99, 235, 0.12)',
        },
    },
    // Explicit 0px border radius across all elements (sharp geometric modern style)
    shape: {
        borderRadius: 0,
    },
    typography: {
        fontFamily: [
            'var(--font-geist-sans)',
            '-apple-system',
            'BlinkMacSystemFont',
            '"Segoe UI"',
            'Roboto',
            'sans-serif',
        ].join(','),
        h1: {
            fontWeight: 800,
            fontSize: '2.25rem',
            lineHeight: 1.25,
            letterSpacing: '-0.025em',
            color: '#0F172A',
        },
        h2: {
            fontWeight: 700,
            fontSize: '1.875rem',
            lineHeight: 1.3,
            letterSpacing: '-0.02em',
            color: '#0F172A',
        },
        h3: {
            fontWeight: 700,
            fontSize: '1.5rem',
            lineHeight: 1.35,
            letterSpacing: '-0.015em',
            color: '#0F172A',
        },
        h4: {
            fontWeight: 700,
            fontSize: '1.25rem',
            lineHeight: 1.4,
            letterSpacing: '-0.01em',
            color: '#0F172A',
        },
        h5: {
            fontWeight: 600,
            fontSize: '1.125rem',
            lineHeight: 1.45,
            color: '#0F172A',
        },
        h6: {
            fontWeight: 600,
            fontSize: '1rem',
            lineHeight: 1.5,
            color: '#0F172A',
        },
        subtitle1: {
            fontSize: '1rem',
            fontWeight: 500,
            lineHeight: 1.5,
            color: '#475569',
        },
        subtitle2: {
            fontSize: '0.875rem',
            fontWeight: 600,
            lineHeight: 1.57,
            color: '#475569',
        },
        body1: {
            fontSize: '0.9375rem',
            lineHeight: 1.6,
            color: '#1E293B',
        },
        body2: {
            fontSize: '0.845rem',
            lineHeight: 1.55,
            color: '#64748B',
        },
        button: {
            fontWeight: 600,
            textTransform: 'none',
            letterSpacing: '0.015em',
            fontSize: '0.875rem',
        },
        caption: {
            fontSize: '0.75rem',
            lineHeight: 1.5,
            color: '#64748B',
        },
        overline: {
            fontSize: '0.6875rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#64748B',
        },
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    backgroundColor: '#F8FAFC',
                    color: '#0F172A',
                    scrollBehavior: 'smooth',
                },
                '*': {
                    borderRadius: 0,
                },
            },
        },
        MuiButton: {
            defaultProps: {
                disableElevation: true,
            },
            styleOverrides: {
                root: {
                    borderRadius: 0,
                    padding: '8px 18px',
                    fontWeight: 600,
                    textTransform: 'none',
                    transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                        transform: 'translateY(-1px)',
                    },
                    '&:active': {
                        transform: 'translateY(0)',
                    },
                },
                containedPrimary: {
                    background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
                    '&:hover': {
                        background: 'linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%)',
                        boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                    },
                },
                containedSecondary: {
                    background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                    boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)',
                    '&:hover': {
                        background: 'linear-gradient(135deg, #0369A1 0%, #075985 100%)',
                        boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
                    },
                },
                containedSuccess: {
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
                    '&:hover': {
                        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                        boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                    },
                },
                containedError: {
                    background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.25)',
                    '&:hover': {
                        background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
                        boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)',
                    },
                },
                outlined: {
                    borderRadius: 0,
                    borderColor: 'rgba(203, 213, 225, 0.9)',
                    color: '#334155',
                    backgroundColor: '#FFFFFF',
                    '&:hover': {
                        borderColor: PRIMARY_MAIN,
                        backgroundColor: alpha(PRIMARY_MAIN, 0.04),
                        color: PRIMARY_MAIN,
                    },
                },
                text: {
                    borderRadius: 0,
                    color: '#475569',
                    '&:hover': {
                        backgroundColor: alpha(PRIMARY_MAIN, 0.06),
                        color: PRIMARY_MAIN,
                    },
                },
                sizeSmall: {
                    padding: '5px 12px',
                    fontSize: '0.8125rem',
                    borderRadius: 0,
                },
                sizeLarge: {
                    padding: '11px 24px',
                    fontSize: '0.9375rem',
                    borderRadius: 0,
                },
            },
        },
        MuiIconButton: {
            styleOverrides: {
                root: {
                    borderRadius: 0,
                    transition: 'all 0.15s ease',
                    color: '#64748B',
                    '&:hover': {
                        backgroundColor: alpha(PRIMARY_MAIN, 0.08),
                        color: PRIMARY_MAIN,
                        transform: 'scale(1.05)',
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 0,
                    backgroundColor: '#FFFFFF',
                    border: '1px solid rgba(226, 232, 240, 0.9)',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04)',
                    transition: 'box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    borderRadius: 0,
                },
                elevation0: {
                    boxShadow: 'none',
                },
                elevation1: {
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04)',
                    border: '1px solid rgba(226, 232, 240, 0.9)',
                },
                elevation2: {
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                    border: '1px solid rgba(226, 232, 240, 0.8)',
                },
                elevation3: {
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.06)',
                },
                elevation4: {
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.07)',
                },
            },
        },
        MuiTextField: {
            defaultProps: {
                variant: 'outlined',
                size: 'small',
            },
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    borderRadius: 0,
                    backgroundColor: '#FFFFFF',
                    transition: 'all 0.18s ease',
                    '& fieldset': {
                        borderColor: 'rgba(203, 213, 225, 0.85)',
                        borderWidth: '1px',
                        borderRadius: 0,
                    },
                    '&:hover fieldset': {
                        borderColor: '#94A3B8',
                    },
                    '&.Mui-focused fieldset': {
                        borderColor: PRIMARY_MAIN,
                        borderWidth: '2px',
                    },
                    '&.Mui-focused': {
                        boxShadow: `0 0 0 3px ${alpha(PRIMARY_MAIN, 0.12)}`,
                    },
                },
                input: {
                    padding: '10px 14px',
                    fontSize: '0.875rem',
                },
            },
        },
        MuiInputLabel: {
            styleOverrides: {
                root: {
                    fontSize: '0.875rem',
                    color: '#64748B',
                    '&.Mui-focused': {
                        color: PRIMARY_MAIN,
                        fontWeight: 600,
                    },
                },
            },
        },
        MuiTableContainer: {
            styleOverrides: {
                root: {
                    borderRadius: 0,
                    border: '1px solid rgba(226, 232, 240, 0.9)',
                    backgroundColor: '#FFFFFF',
                    overflowX: 'auto',
                },
            },
        },
        MuiTableHead: {
            styleOverrides: {
                root: {
                    backgroundColor: '#F8FAFC',
                    '& .MuiTableCell-root': {
                        fontWeight: 700,
                        fontSize: '0.725rem',
                        color: '#475569',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        borderBottom: '1px solid rgba(226, 232, 240, 0.95)',
                        padding: '12px 16px',
                        backgroundColor: '#F8FAFC',
                        borderRadius: 0,
                    },
                },
            },
        },
        MuiTableRow: {
            styleOverrides: {
                root: {
                    borderRadius: 0,
                    transition: 'background-color 0.15s ease',
                    '&:hover': {
                        backgroundColor: 'rgba(241, 245, 249, 0.65) !important',
                    },
                    '&.Mui-selected': {
                        backgroundColor: 'rgba(238, 242, 255, 0.8) !important',
                    },
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                root: {
                    padding: '12px 16px',
                    fontSize: '0.875rem',
                    borderBottom: '1px solid rgba(241, 245, 249, 0.95)',
                    color: '#1E293B',
                    borderRadius: 0,
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: 0,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    height: 26,
                    transition: 'all 0.15s ease',
                },
                filled: {
                    border: '1px solid transparent',
                    borderRadius: 0,
                },
                outlined: {
                    borderColor: 'rgba(203, 213, 225, 0.9)',
                    borderRadius: 0,
                },
                colorSuccess: {
                    backgroundColor: '#DCFCE7',
                    color: '#166534',
                },
                colorWarning: {
                    backgroundColor: '#FEF3C7',
                    color: '#92400E',
                },
                colorError: {
                    backgroundColor: '#FEE2E2',
                    color: '#991B1B',
                },
                colorInfo: {
                    backgroundColor: '#EDE9FE',
                    color: '#5B21B6',
                },
                colorPrimary: {
                    backgroundColor: '#DBEAFE',
                    color: '#1E40AF',
                },
            },
        },
        MuiDialog: {
            styleOverrides: {
                paper: {
                    borderRadius: 0,
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    border: '1px solid rgba(226, 232, 240, 0.9)',
                    overflow: 'hidden',
                },
            },
        },
        MuiDialogTitle: {
            styleOverrides: {
                root: {
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    padding: '20px 24px',
                    borderBottom: '1px solid rgba(226, 232, 240, 0.9)',
                    color: '#0F172A',
                    borderRadius: 0,
                },
            },
        },
        MuiDialogContent: {
            styleOverrides: {
                root: {
                    padding: '24px',
                },
            },
        },
        MuiDialogActions: {
            styleOverrides: {
                root: {
                    padding: '16px 24px',
                    borderTop: '1px solid rgba(226, 232, 240, 0.9)',
                    backgroundColor: '#F8FAFC',
                    gap: 8,
                    borderRadius: 0,
                },
            },
        },
        MuiTabs: {
            styleOverrides: {
                root: {
                    minHeight: 44,
                    borderRadius: 0,
                },
                indicator: {
                    height: 3,
                    borderRadius: 0,
                    backgroundColor: PRIMARY_MAIN,
                },
            },
        },
        MuiTab: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    minHeight: 44,
                    padding: '8px 18px',
                    color: '#64748B',
                    borderRadius: 0,
                    transition: 'all 0.18s ease',
                    '&.Mui-selected': {
                        color: PRIMARY_MAIN,
                        fontWeight: 700,
                    },
                    '&:hover': {
                        color: '#0F172A',
                        backgroundColor: alpha(PRIMARY_MAIN, 0.04),
                    },
                },
            },
        },
        MuiTooltip: {
            styleOverrides: {
                tooltip: {
                    backgroundColor: '#0F172A',
                    color: '#FFFFFF',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    borderRadius: 0,
                    padding: '6px 12px',
                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.18)',
                },
                arrow: {
                    color: '#0F172A',
                },
            },
        },
        MuiMenu: {
            styleOverrides: {
                paper: {
                    borderRadius: 0,
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(226, 232, 240, 0.95)',
                    padding: '4px',
                },
            },
        },
        MuiMenuItem: {
            styleOverrides: {
                root: {
                    borderRadius: 0,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    padding: '8px 12px',
                    margin: '2px 0px',
                    transition: 'all 0.15s ease',
                    '&:hover': {
                        backgroundColor: alpha(PRIMARY_MAIN, 0.08),
                        color: PRIMARY_MAIN,
                    },
                    '&.Mui-selected': {
                        backgroundColor: alpha(PRIMARY_MAIN, 0.12),
                        color: PRIMARY_MAIN,
                        fontWeight: 600,
                    },
                },
            },
        },
        MuiAlert: {
            styleOverrides: {
                root: {
                    borderRadius: 0,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    alignItems: 'center',
                },
                standardSuccess: {
                    backgroundColor: '#ECFDF5',
                    color: '#065F46',
                    border: '1px solid #A7F3D0',
                    borderRadius: 0,
                },
                standardWarning: {
                    backgroundColor: '#FFFBEB',
                    color: '#92400E',
                    border: '1px solid #FDE68A',
                    borderRadius: 0,
                },
                standardError: {
                    backgroundColor: '#FEF2F2',
                    color: '#991B1B',
                    border: '1px solid #FECACA',
                    borderRadius: 0,
                },
                standardInfo: {
                    backgroundColor: '#EFF6FF',
                    color: '#1E40AF',
                    border: '1px solid #BFDBFE',
                    borderRadius: 0,
                },
            },
        },
        MuiSelect: {
            styleOverrides: {
                root: {
                    borderRadius: 0,
                },
            },
        },
        MuiPaginationItem: {
            styleOverrides: {
                root: {
                    borderRadius: 0,
                    fontWeight: 600,
                    '&.Mui-selected': {
                        backgroundColor: PRIMARY_MAIN,
                        color: '#FFFFFF',
                        '&:hover': {
                            backgroundColor: PRIMARY_DARK,
                        },
                    },
                },
            },
        },
        MuiBadge: {
            styleOverrides: {
                badge: {
                    borderRadius: 0,
                },
            },
        },
    },
});

export default theme;
