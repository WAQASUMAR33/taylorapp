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

    return (
        <div>
            <div style={{ paddingTop: '24px', paddingBottom: '16px', backgroundColor: '#fafafa', borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ paddingLeft: '24px', paddingRight: '24px' }} dir="rtl">
                    <h1 className="text-3xl font-bold text-zinc-900 tracking-tight font-urdu">میٹیرئیل مینجمنٹ</h1>
                    <p className="text-zinc-500 mt-1 font-urdu">اپنے مٹیریل اسٹاک، قیمتوں اور انوینٹری کا انتظام کریں۔</p>
                </div>
            </div>

            <MaterialManagementClient initialMaterials={serializedMaterials} />
        </div>
    );
}
