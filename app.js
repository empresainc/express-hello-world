const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', async (req, res) => {
  try {
    // Corpo da requisição exatamente igual ao que o app envia
    const params = new URLSearchParams();
    params.append('app_id', 'filmbr');
    params.append('version', '1.0.0');
    params.append('device_id', '5d570494343d7035');

    const response = await axios.post('https://filmbr.i2s1n.com/api/search/screen', 
    params.toString(), 
    {
      headers: {
        'Accept-Encoding': 'gzip',
        'androidid': '5d570494343d7035',
        'app_id': 'filmbr',
        'app_language': 'pt',
        'channel_code': 'filmbr_sh_1000',
        'Connection': 'Keep-Alive',
        'Content-Type': 'application/x-www-form-urlencoded',
        'cur_time': '1777758585423',
        'device_id': '5d570494343d7035',
        'en_al': '0',
        'gaid': '24be4297-657d-44b3-9639-1f498c263839',
        'Host': 'filmbr.i2s1n.com',
        'is_display': 'GMT+00:00',
        'is_language': 'pt',
        'is_vvv': '1',
        'log-header': 'I am the log request header.',
        'mob_mfr': 'oneplus',
        'mobmodel': 'NE2211',
        'package_name': 'com.starshort.minishort',
        'sign': 'EBD388257EFBC654CB04D6781A8646DB',
        'sys_platform': '2',
        'sysrelease': '9'
      }
    });

    // Envia o JSON real de volta
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
