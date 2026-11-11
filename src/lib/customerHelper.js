import prisma from "./prisma.js";

/**
 * Gets the next customer ID based on current MAX(id) + 1.
 * If record with ID 500 was the maximum and gets deleted,
 * current MAX(id) will be 499, and the next ID will be 500.
 */
export async function getNextCustomerId(client = prisma) {
    const maxResult = await client.$queryRawUnsafe("SELECT MAX(id) AS maxId FROM customer");
    let nextId = (maxResult[0]?.maxId != null ? Number(maxResult[0].maxId) : 0) + 1;
    while (await client.customer.findUnique({ where: { id: nextId }, select: { id: true } })) {
        nextId++;
    }
    return nextId;
}

/**
 * Generates a random available customer ID that is not currently assigned to any customer.
 */
export async function getRandomAvailableCustomerId(client = prisma) {
    const maxResult = await client.$queryRawUnsafe("SELECT MAX(id) AS maxId FROM customer");
    const currentMax = maxResult[0]?.maxId != null ? Number(maxResult[0].maxId) : 1000;
    const upperBound = Math.max(currentMax + 500, 10000);

    for (let attempts = 0; attempts < 100; attempts++) {
        const randomId = Math.floor(Math.random() * upperBound) + 1;
        const exists = await client.customer.findUnique({
            where: { id: randomId },
            select: { id: true }
        });
        if (!exists) {
            return randomId;
        }
    }
    return getNextCustomerId(client);
}
