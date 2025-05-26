const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/backup', (req, res) => {
  const backupData = req.body;
  fs.writeFileSync('backup.json', JSON.stringify(backupData, null, 2));
  res.status(200).send({ message: 'Backup saved successfully!' });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
