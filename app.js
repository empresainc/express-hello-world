const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', async (req, res) => {
  try {
    const params = new URLSearchParams();
    params.append('app_id', 'filmbr');
    params.append('version', '1.0.0');
    params.append('device_id', '5d570494343d7035');

    const response = await axios.post('https://filmbr.i2s1n.com/api/public/get_sys_conf', 
    params.toString(), // Convertemos explicitamente para string
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 9; NE2211 Build/SKQ1.220617.001)',
        'Host': 'filmbr.i2s1n.com',
        'Connection': 'Keep-Alive',
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate',
        'Cache-Control': 'no-cache'
      }
    });

    // Mostra apenas os dados reais da API na tela
    res.json(response.data);
  } catch (error) {
    if (error.response) {
      res.json({
        erro: "A API recusou",
        status: error.response.status,
        data: error.response.data
      });
    } else {
      res.status(500).send("Erro de conexão: " + error.message);
    }
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
