const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());
app.get('/', (req, res) => {
  res.send('Halo! Proyek Node.js pertamaku berhasil jalan.');
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
