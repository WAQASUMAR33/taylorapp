import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#3B82F6', // Blue as per project description
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
            default: '#F3F4F6', // light gray background
        },
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
        MuiDatePicker: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                    },
                },
            },
        },
        MuiPickersDay: {
            styleOverrides: {
                root: {
                    borderRadius: '8px',
                    '&.Mui-selected': {
                        backgroundColor: '#3B82F6 !important',
                    },
                    '&:hover': {
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    },
                },
                today: {
                    border: '1px solid #3B82F6 !important',
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
