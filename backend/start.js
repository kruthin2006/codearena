// ===== SIMPLE TEST SERVER =====
const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

console.log('✅ START.JS LOADED!');

app.get('/', (req, res) => {
  res.send('✅ Server is working!');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
});