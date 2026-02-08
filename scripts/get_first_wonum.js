const db = require('../src/config/db');
(async ()=>{
  try{
    const [rows]=await db.query('SELECT wonum FROM master_wo LIMIT 1');
    if(rows && rows.length) console.log(rows[0].wonum);
    else console.log('');
  }catch(e){console.error(e.message); process.exit(1)}
})();