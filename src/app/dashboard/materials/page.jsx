import prisma from "@/lib/prisma";
import MaterialManagementClient from "./MaterialManagementClient";

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

    return <MaterialManagementClient initialMaterials={serializedMaterials} />;
}
