"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { Box, CssBaseline } from "@mui/material";

const DRAWER_WIDTH = 260;
const COLLAPSED_WIDTH = 72;

export default function DashboardLayout({ children }) {
    const [collapsed, setCollapsed] = useState(false);
    const sidebarWidth = collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH;

    return (
        <>
            <CssBaseline />

            {/* Fixed sidebar */}
            <Sidebar
                collapsed={collapsed}
                setCollapsed={setCollapsed}
                drawerWidth={DRAWER_WIDTH}
                collapsedDrawerWidth={COLLAPSED_WIDTH}
            />

            {/* Content column — sits to the right of the fixed sidebar */}
            <Box
                sx={{
                    marginLeft: `${sidebarWidth}px`,
                    width: `calc(100% - ${sidebarWidth}px)`,
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1), width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    bgcolor: 'background.default',
                    overflow: 'hidden',
                }}
            >
                {/* Sticky header */}
                <Box sx={{ position: 'sticky', top: 0, zIndex: 100, flexShrink: 0 }}>
                    <Header />
                </Box>

                {/* Full-width, full-height page content */}
                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        width: '100%',
                        overflowX: 'hidden',
                        overflowY: 'auto',
                    }}
                >
                    {children}
                </Box>
            </Box>
        </>
    );
}
