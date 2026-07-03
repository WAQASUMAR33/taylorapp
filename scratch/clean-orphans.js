const mysql = require('mysql2/promise');

async function cleanOrphans() {
  const connection = await mysql.createConnection({
    host: '187.77.121.23',
    user: 'gracetailors',
    password: 'DildilPakistan786_786_waqas',
    database: 'gracetailors',
    port: 3306
  });

  try {
    console.log('Connected to MySQL database gracetailors.');

    // 1. Get the list of orphaned bookings
    const [orphans] = await connection.execute(`
      SELECT b.id, b.bookingNumber 
      FROM booking b 
      LEFT JOIN customer c ON b.customerId = c.id 
      WHERE c.id IS NULL
    `);

    if (orphans.length === 0) {
      console.log('No orphaned bookings found.');
      return;
    }

    console.log(`Found ${orphans.length} orphaned bookings:`, orphans);
    const orphanIds = orphans.map(o => o.id);

    // Disable foreign key checks for manual cascade-like clean up
    console.log('Disabling foreign key checks...');
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');

    // 2. Delete from booking_item_stitching_option first
    console.log('Deleting from booking_item_stitching_option...');
    await connection.execute(`
      DELETE FROM booking_item_stitching_option 
      WHERE bookingItemId IN (
        SELECT id FROM booking_item WHERE bookingId IN (${orphanIds.join(',')})
      )
    `);

    // 3. Delete from booking_item
    console.log('Deleting from booking_item...');
    await connection.execute(`
      DELETE FROM booking_item WHERE bookingId IN (${orphanIds.join(',')})
    `);

    // 4. Delete from booking_staff
    console.log('Deleting from booking_staff...');
    await connection.execute(`
      DELETE FROM booking_staff WHERE bookingId IN (${orphanIds.join(',')})
    `);

    // 5. Delete from ledgerentry
    console.log('Deleting from ledgerentry...');
    await connection.execute(`
      DELETE FROM ledgerentry WHERE bookingId IN (${orphanIds.join(',')})
    `);

    // 6. Delete from booking
    console.log('Deleting from booking...');
    await connection.execute(`
      DELETE FROM booking WHERE id IN (${orphanIds.join(',')})
    `);

    console.log('Orphaned bookings and related records deleted successfully!');

  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    console.log('Enabling foreign key checks...');
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    await connection.end();
  }
}

cleanOrphans();
