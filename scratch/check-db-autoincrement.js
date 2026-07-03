const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Checking database columns for user and customer tables...");
    const userColumns = await prisma.$queryRawUnsafe("SHOW COLUMNS FROM `user` WHERE Field = 'id'");
    console.log("User 'id' column details:", userColumns);

    const customerColumns = await prisma.$queryRawUnsafe("SHOW COLUMNS FROM `customer` WHERE Field = 'id'");
    console.log("Customer 'id' column details:", customerColumns);

    const tables = ['user', 'customer', 'expense', 'accountcategory', 'bank', 'employee', 'measurement', 'category', 'product', 'purchase', 'bill'];
    for (const table of tables) {
      try {
        const columns = await prisma.$queryRawUnsafe(`SHOW COLUMNS FROM \`${table}\` WHERE Field = 'id'`);
        if (columns.length > 0) {
          const isAutoincrement = columns[0].Extra && columns[0].Extra.includes('auto_increment');
          console.log(`Table ${table} id auto_increment:`, isAutoincrement ? "YES" : "NO", `(Extra: ${columns[0].Extra})`);
        } else {
          console.log(`Table ${table}: id field not found`);
        }
      } catch (err) {
        console.log(`Error checking table ${table}:`, err.message);
      }
    }
  } catch (err) {
    console.error("Error connecting to database:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
