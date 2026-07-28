const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    console.log("=== Starting Database Cleanup ===");
    
    // 1. Delete all booking records
    await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 0;");

        const deletedOptions = await tx.booking_item_stitching_option.deleteMany({});
        console.log(`Deleted ${deletedOptions.count} booking item stitching options.`);

        const deletedBookingItems = await tx.booking_item.deleteMany({});
        console.log(`Deleted ${deletedBookingItems.count} booking items.`);

        const deletedStaff = await tx.booking_staff.deleteMany({});
        console.log(`Deleted ${deletedStaff.count} booking staff records.`);

        const deletedOrders = await tx.order.deleteMany({});
        console.log(`Deleted ${deletedOrders.count} stitching orders.`);

        const deletedBookings = await tx.booking.deleteMany({});
        console.log(`Deleted ${deletedBookings.count} bookings.`);

        const deletedReturnItems = await tx.sale_return_item.deleteMany({});
        console.log(`Deleted ${deletedReturnItems.count} sale return items.`);

        const deletedReturns = await tx.sale_return.deleteMany({});
        console.log(`Deleted ${deletedReturns.count} sale returns.`);

        // Delete booking & return ledger entries
        const deletedBookingLedgers = await tx.ledgerentry.deleteMany({
            where: {
                OR: [
                    { bookingId: { not: null } },
                    { saleReturnId: { not: null } }
                ]
            }
        });
        console.log(`Deleted ${deletedBookingLedgers.count} booking & return ledger entries.`);

        await tx.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 1;");
    }, {
        timeout: 30000
    });

    // 2. Find customer "uzair saeed" and delete all their ledger entries
    const uzairCustomers = await prisma.customer.findMany({
        where: {
            name: {
                contains: "uzair"
            }
        }
    });

    console.log(`Found ${uzairCustomers.length} customer(s) matching "uzair":`);
    for (const c of uzairCustomers) {
        console.log(` - ID: ${c.id}, Name: ${c.name}, Phone: ${c.phone || "N/A"}, Current Balance: ${c.balance}`);
    }

    if (uzairCustomers.length > 0) {
        const uzairIds = uzairCustomers.map(c => c.id);
        const deletedUzairLedgers = await prisma.ledgerentry.deleteMany({
            where: {
                customerId: {
                    in: uzairIds
                }
            }
        });
        console.log(`Deleted ${deletedUzairLedgers.count} ledger entries for Uzair Saeed customer account(s).`);

        // Reset Uzair balance to 0
        await prisma.customer.updateMany({
            where: {
                id: { in: uzairIds }
            },
            data: {
                balance: 0
            }
        });
        console.log(`Reset customer balance to 0.00 for Uzair Saeed account(s).`);
    }

    // 3. Recalculate remaining customer balances
    console.log("Recalculating customer balances for remaining ledger entries...");
    await prisma.customer.updateMany({
        data: { balance: 0 }
    });

    const groupedEntries = await prisma.ledgerentry.groupBy({
        by: ['customerId', 'type'],
        _sum: {
            amount: true
        }
    });

    const balanceMap = {};
    for (const group of groupedEntries) {
        const cid = group.customerId;
        const type = group.type;
        const sum = parseFloat(group._sum.amount) || 0;
        
        if (!balanceMap[cid]) balanceMap[cid] = 0;
        if (type === "DEBIT") balanceMap[cid] += sum;
        else if (type === "CREDIT") balanceMap[cid] -= sum;
    }

    const customerIdsToUpdate = Object.keys(balanceMap);
    for (const cidStr of customerIdsToUpdate) {
        const cid = parseInt(cidStr);
        const bal = balanceMap[cidStr];
        await prisma.customer.update({
            where: { id: cid },
            data: { balance: bal }
        });
    }

    const remainingBookings = await prisma.booking.count();
    const remainingUzairLedgers = await prisma.ledgerentry.count({
        where: {
            customer: {
                name: { contains: "uzair" }
            }
        }
    });

    console.log("=== Cleanup Complete ===");
    console.log(`Total remaining bookings: ${remainingBookings}`);
    console.log(`Total remaining Uzair Saeed ledger entries: ${remainingUzairLedgers}`);
}

main()
    .catch(err => {
        console.error("Error executing cleanup:", err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
