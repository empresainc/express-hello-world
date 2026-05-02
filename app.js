const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const app = express();
const port = process.env.PORT || 3000;

// Configurações exatas extraídas do seu JADX
const AES_KEY = "QwEr12TyUi!@Op34AsDf#$GhJk56L%^Z";
const AES_IV  = "xCvB78Nm&*9(0)Mn";

function decrypt(cipherText) {
  try {
    // A chave e o IV exatos que você encontrou no Constant.java
    const key = Buffer.from(AES_KEY, 'utf8');
    const iv = Buffer.from(AES_IV, 'utf8');

    // Remove espaços em branco ou quebras de linha que possam quebrar o Base64
    const cleanedCipherText = cipherText.replace(/\s/g, '');

    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    decipher.setAutoPadding(true);

    let decrypted = decipher.update(cleanedCipherText, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    return "Erro ao descriptografar: " + error.message;
  }
}

app.get('/', async (req, res) => {
  try {
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

    const dadosCriptografados = response.data;

    // Tratamento dinâmico para pegar exatamente os dados após o "SHOKxxxxxx/"
    let base64Correto = dadosCriptografados;
    if (dadosCriptografados.startsWith("SHOK")) {
      const parts = dadosCriptografados.split('/');
      if (parts.length > 1) {
        // Remove a primeira parte (SHOK5119ocG2i+z) e junta o resto caso haja mais barras
        parts.shift(); 
        base64Correto = parts.join('/');
      }
    }

    // Descriptografando os dados limpos
    const dadosFinais = decrypt(base64Correto);

    // Tenta exibir como JSON, senão exibe como texto direto
    try {
      res.json(JSON.parse(dadosFinais));
    } catch {
      res.send(dadosFinais);
    }

  } catch (error) {
    res.status(500).send("Erro na requisição: " + error.message);
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
