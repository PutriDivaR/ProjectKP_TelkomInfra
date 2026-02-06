const db = require('../src/config/db');
(async () => {
  try {
    const [cols] = await db.query('SHOW COLUMNS FROM master_wo');
    console.log('COLUMNS');
    console.log(JSON.stringify(cols, null, 2));

    const [rows] = await db.query('SELECT * FROM master_wo LIMIT 1');
    console.log('SAMPLE');
    if (rows && rows.length) console.log(JSON.stringify(rows[0], null, 2));
    else console.log('{}');
    process.exit(0);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
})();