import prisma from "@/lib/prisma";
import UserManagementClient from "./UserManagementClient";
import { Box, Typography } from "@mui/material";
import { Users } from "lucide-react";

export const metadata = {
    title: "User Management - TailorFlow",
};

export default async function UsersPage() {
    const users = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
    });

    // Serialize dates for client components
    const serializedUsers = users.map(user => ({
        ...user,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
    }));

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{
                py: 1.5,
                px: 3,
                mb: 3,
                bgcolor: 'background.paper',
                borderBottom: 1,
                borderColor: 'divider',
                borderRadius: 2,
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{
                        p: 1,
                        bgcolor: '#3b82f6',
                        borderRadius: 2,
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Users size={22} color="white" />
                    </Box>
                    <Box>
                        <Typography variant="h4" fontWeight="bold" color="text.primary">
                            User Management
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                            Manage system users, roles and permissions.
                        </Typography>
                    </Box>
                </Box>
            </Box>

            <UserManagementClient initialUsers={serializedUsers} />
        </Box>
    );
}
