const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: '187.77.121.23',
  user: 'gracetailors',
  password: 'DildilPakistan786_786_waqas',
  database: 'gracetailors',
  port: 3306
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Successfully connected to MySQL!');
  
  connection.query('SELECT COUNT(*) AS cnt FROM customer', (err1, res1) => {
    if (err1) console.error(err1);
    else console.log('Total customers:', res1[0].cnt);
    
    connection.query('SELECT COUNT(*) AS cnt FROM booking', (err2, res2) => {
      if (err2) console.error(err2);
      else console.log('Total bookings:', res2[0].cnt);
      connection.end();
    });
  });
});
