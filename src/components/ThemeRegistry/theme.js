import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#4B3BC3', // Hireism Purple
            light: '#6B5ED1',
            dark: '#3A2E9E',
            contrastText: '#fff',
        },
        secondary: {
            main: '#6366f1',
        },
        success: {
            main: '#10B981',
        },
        warning: {
            main: '#F59E0B',
        },
        error: {
            main: '#EF4444',
        },
        info: {
            main: '#8B5CF6',
        },
        background: {
            default: '#F3F2F7', // soft lavender/gray
            paper: '#FFFFFF',
        },
        text: {
            primary: '#1F2937',
            secondary: '#6B7280',
        },
    },
    shape: {
        borderRadius: 24, // Global high rounding
    },
    typography: {
        fontFamily: [
            '-apple-system',
            'BlinkMacSystemFont',
            '"Segoe UI"',
            'Roboto',
            '"Helvetica Neue"',
            'Arial',
            'sans-serif',
            '"Apple Color Emoji"',
            '"Segoe UI Emoji"',
            '"Segoe UI Symbol"',
        ].join(','),
    },
    components: {
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: '24px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                    border: 'none',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: '24px',
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: '12px',
                    textTransform: 'none',
                    fontWeight: 600,
                },
            },
        },
        MuiDatePicker: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: '16px',
                    },
                },
            },
        },
        MuiPickersDay: {
            styleOverrides: {
                root: {
                    borderRadius: '12px',
                    '&.Mui-selected': {
                        backgroundColor: '#4B3BC3 !important',
                    },
                    '&:hover': {
                        backgroundColor: 'rgba(75, 59, 195, 0.1)',
                    },
                },
                today: {
                    border: '1px solid #4B3BC3 !important',
                },
            },
        },
        MuiPickersCalendarHeader: {
            styleOverrides: {
                labelContainer: {
                    fontWeight: 700,
                },
                switchViewButton: {
                    '& .MuiSvgIcon-root': {
                        fontSize: '1.2rem',
                    },
                },
            },
        },
    },
});

export default theme;
