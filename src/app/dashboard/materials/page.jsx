import prisma from "@/lib/prisma";
import MaterialManagementClient from "./MaterialManagementClient";
import { Box, Typography } from "@mui/material";
import { Boxes } from "lucide-react";

export const metadata = {
    title: "Material Stock | TailorFlow",
};

export default async function MaterialStockPage() {
    const materials = await prisma.material.findMany({
        orderBy: { createdAt: "desc" },
    });

    // Serialize Decimal objects for Client Component
    const serializedMaterials = materials.map(material => ({
        ...material,
        quantity: parseFloat(material.quantity.toString()),
        price: parseFloat(material.price.toString()),
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{
                        p: 1.5,
                        bgcolor: 'primary.light',
                        borderRadius: 3,
                        color: 'primary.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Boxes size={28} />
                    </Box>
                    <Box>
                        <Typography variant="h4" fontWeight="bold" color="text.primary">
                            Material Management
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                            Manage your material stock, prices, and inventory.
                        </Typography>
                    </Box>
                </Box>
            </Box>

            <Box sx={{ px: 3 }}>
                <MaterialManagementClient initialMaterials={serializedMaterials} />
            </Box>
        </Box>
    );
}
