import prisma from "@/lib/prisma";
import EmployeeManagementClient from "./EmployeeManagementClient";
import { Box, Typography } from "@mui/material";

export const metadata = {
    title: "Employee Management - TailorFlow",
};

export default async function EmployeesPage() {
    const employees = await prisma.employee.findMany({
        orderBy: { createdAt: "desc" },
    });

    // Serialize
    const serializedEmployees = employees.map(emp => ({
        ...emp,
        salary: emp.salary ? emp.salary.toString() : "0",
        createdAt: emp.createdAt.toISOString(),
        updatedAt: emp.updatedAt.toISOString(),
    }));

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{
                py: 3,
                px: 3,
                mb: 3,
                bgcolor: 'background.paper',
                borderBottom: 1,
                borderColor: 'divider',
                borderRadius: 2,
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
            }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold" color="text.primary">
                        Employee Management
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                        Manage your stitching staff, roles, and salary information.
                    </Typography>
                </Box>
            </Box>

            <Box sx={{ px: 3 }}>
                <EmployeeManagementClient initialEmployees={serializedEmployees} />
            </Box>
        </Box>
    );
}
