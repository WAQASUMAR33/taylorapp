'use client';

import * as React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import NextAppDirEmotionCacheProvider from './EmotionCache';
import theme from './theme';

export default function ThemeRegistry({ children }) {
    return (
        <NextAppDirEmotionCacheProvider options={{ key: 'mui' }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <ThemeProvider theme={theme}>
                    {/* CssBaseline kicksstart an elegant, consistent, and simple baseline to build upon. */}
                    <CssBaseline />
                    {children}
                </ThemeProvider>
            </LocalizationProvider>
        </NextAppDirEmotionCacheProvider>
    );
}
