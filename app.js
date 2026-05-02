const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', async (req, res) => {
  try {
    const response = await axios.post('https://filmbr.i2s1n.com/api/public/get_sys_conf', 
    'app_id=filmbr&version=1.0.0&device_id=5d570494343d7035', 
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 9; NE2211 Build/SKQ1.220617.001)',
        'Host': 'filmbr.i2s1n.com',
        'Connection': 'Keep-Alive'
      }
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).send("Erro ao conectar à API deles: " + error.message);
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
