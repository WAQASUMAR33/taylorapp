const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const movements = await prisma.materialmovement.findMany({
      where: { type: "OUT" },
      orderBy: { movedAt: "desc" },
      include: {
        material: {
          select: { id: true, title: true, price: true },
        },
      },
    });

    const serializedRecords = movements.map((mv) => ({
      ...mv,
      quantity: parseFloat(mv.quantity.toString()),
      movedAt: mv.movedAt.toISOString(),
      createdAt: mv.createdAt.toISOString(),
      material: {
        ...mv.material,
        price: parseFloat(mv.material.price.toString()),
      },
    }));

    // Simulating React component state
    const records = serializedRecords;
    const searchQuery = "";
    const filterMaterial = "all";
    const dateFrom = "";
    const dateTo = "";

    const filtered = records.filter((r) => {
        const matchMaterial =
            filterMaterial === "all" || r.material.id === parseInt(filterMaterial);
        const matchSearch =
            r.material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (r.notes || "").toLowerCase().includes(searchQuery.toLowerCase());

        const recordDate = new Date(r.movedAt);
        recordDate.setHours(0, 0, 0, 0);
        const from = dateFrom ? new Date(dateFrom) : null;
        const to = dateTo ? new Date(dateTo) : null;
        if (to) to.setHours(23, 59, 59, 999);
        const matchDate =
            (!from || recordDate >= from) && (!to || new Date(r.movedAt) <= to);

        console.log(`Record ID: ${r.id}, matchMaterial: ${matchMaterial}, matchSearch: ${matchSearch}, matchDate: ${matchDate}`);
        return matchMaterial && matchSearch && matchDate;
    });

    console.log("Filtered records length:", filtered.length);

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
