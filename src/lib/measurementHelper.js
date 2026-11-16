import prisma from "./prisma.js";

/**
 * Gets the next available numeric measurement number based on MAX(CAST(measurementNo AS UNSIGNED)) + 1.
 * Skips any numbers already assigned to ensure uniqueness.
 */
export async function getNextMeasurementNo(client = prisma) {
    const maxResult = await client.$queryRawUnsafe(`
        SELECT MAX(CAST(c.measurementNo AS UNSIGNED)) AS maxNo 
        FROM customer c
        LEFT JOIN accountcategory ac ON c.accountCategoryId = ac.id
        WHERE c.measurementNo IS NOT NULL 
          AND c.measurementNo REGEXP '^[0-9]+$' 
          AND CAST(c.measurementNo AS UNSIGNED) < 1000000000
          AND (ac.name IS NULL OR (LOWER(ac.name) NOT LIKE '%tailor%' AND LOWER(ac.name) NOT LIKE '%cutter%'))
    `);

    let nextNum = (maxResult[0]?.maxNo != null ? Number(maxResult[0].maxNo) : 0) + 1;
    while (await client.customer.findFirst({ where: { measurementNo: String(nextNum) }, select: { id: true } })) {
        nextNum++;
    }
    return String(nextNum);
}

/**
 * Generates a random available measurement number that is not currently assigned to any customer.
 */
export async function getRandomAvailableMeasurementNo(client = prisma) {
    const maxResult = await client.$queryRawUnsafe(`
        SELECT MAX(CAST(c.measurementNo AS UNSIGNED)) AS maxNo 
        FROM customer c
        LEFT JOIN accountcategory ac ON c.accountCategoryId = ac.id
        WHERE c.measurementNo IS NOT NULL 
          AND c.measurementNo REGEXP '^[0-9]+$' 
          AND CAST(c.measurementNo AS UNSIGNED) < 1000000000
          AND (ac.name IS NULL OR (LOWER(ac.name) NOT LIKE '%tailor%' AND LOWER(ac.name) NOT LIKE '%cutter%'))
    `);

    const currentMax = maxResult[0]?.maxNo != null ? Number(maxResult[0].maxNo) : 1000;
    const upperBound = Math.max(currentMax + 500, 10000);

    for (let attempts = 0; attempts < 100; attempts++) {
        const randomNum = Math.floor(Math.random() * upperBound) + 1;
        const exists = await client.customer.findFirst({
            where: { measurementNo: String(randomNum) },
            select: { id: true }
        });
        if (!exists) {
            return String(randomNum);
        }
    }
    return getNextMeasurementNo(client);
}

