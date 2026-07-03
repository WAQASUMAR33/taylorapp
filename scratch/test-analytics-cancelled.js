const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const customer = await prisma.customer.findFirst({ select: { id: true } });
    if (!customer) {
      console.log("No customers found in database.");
      return;
    }
    const customerId = customer.id;
    console.log(`Using customerId: ${customerId}`);

    console.log("Creating mock bookings...");
    
    // Stitching Cancelled (should be ignored)
    const b1 = await prisma.booking.create({
      data: {
        bookingNumber: "TEST-ST-CAN",
        customerId,
        bookingType: "STITCHING",
        status: "CANCELLED",
        totalAmount: 100,
        advanceAmount: 0,
        remainingAmount: 100,
      }
    });

    // Stitching Pending (should NOT be ignored)
    const b2 = await prisma.booking.create({
      data: {
        bookingNumber: "TEST-ST-PEN",
        customerId,
        bookingType: "STITCHING",
        status: "PENDING",
        totalAmount: 100,
        advanceAmount: 0,
        remainingAmount: 100,
      }
    });

    // Suit Cancelled (should NOT be ignored)
    const b3 = await prisma.booking.create({
      data: {
        bookingNumber: "TEST-SU-CAN",
        customerId,
        bookingType: "SUIT",
        status: "CANCELLED",
        totalAmount: 100,
        advanceAmount: 0,
        remainingAmount: 100,
      }
    });

    console.log("Mock bookings created successfully.");

    // Query using NOT
    const results = await prisma.booking.findMany({
      where: {
        bookingNumber: { startsWith: "TEST-" },
        NOT: {
          bookingType: "STITCHING",
          status: "CANCELLED"
        }
      },
      select: {
        bookingNumber: true,
        bookingType: true,
        status: true
      }
    });

    console.log("Query Results (excluding STITCHING - CANCELLED):");
    console.log(results);

    // Clean up
    console.log("Cleaning up mock bookings...");
    await prisma.booking.deleteMany({
      where: {
        bookingNumber: { startsWith: "TEST-" }
      }
    });
    console.log("Cleanup done.");

  } catch (err) {
    console.error("Error during operations:", err);
    // Cleanup if failed
    await prisma.booking.deleteMany({
      where: {
        bookingNumber: { startsWith: "TEST-" }
      }
    });
  } finally {
    await prisma.$disconnect();
  }
}

main();
