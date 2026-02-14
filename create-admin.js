const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function createAdminUser() {
    const connection = await mysql.createConnection({
        host: '153.92.15.57',
        port: 3306,
        user: 'u726235305_tailor',
        password: 'DildilPakistan786Tailor',
        database: 'u726235305_tailor'
    });

    try {
        console.log('Connected to database');

        // Hash the password
        const passwordHash = await bcrypt.hash('786ninja', 10);

        // Check if user exists
        const [existingUsers] = await connection.execute(
            'SELECT * FROM user WHERE username = ?',
            ['theitxprts@gmail.com']
        );

        if (existingUsers.length > 0) {
            console.log('Admin user already exists');
            // Update the password
            await connection.execute(
                'UPDATE user SET passwordHash = ?, role = ?, isActive = ? WHERE username = ?',
                [passwordHash, 'ADMIN', true, 'theitxprts@gmail.com']
            );
            console.log('Admin user password updated');
        } else {
            // Insert new admin user
            await connection.execute(
                'INSERT INTO user (fullName, username, email, role, passwordHash, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
                ['Admin User', 'theitxprts@gmail.com', 'theitxprts@gmail.com', 'ADMIN', passwordHash, true]
            );
            console.log('Admin user created successfully!');
        }

        console.log('\nLogin credentials:');
        console.log('Username: theitxprts@gmail.com');
        console.log('Password: 786ninja');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await connection.end();
    }
}

createAdminUser();
