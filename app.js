const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const app = express();
const port = process.env.PORT || 3000;

// Credenciais exatas extraídas do seu JADX
const AES_KEY = "QwEr12TyUi!@Op34AsDf#$GhJk56L%^Z";
const AES_IV  = "xCvB78Nm&*9(0)Mn";

function decrypt(cipherText) {
  try {
    const key = Buffer.from(AES_KEY, 'utf8');
    const iv = Buffer.from(AES_IV, 'utf8');

    // Limpeza rigorosa: remove qualquer caractere que não pertença ao Base64
    const cleaned = cipherText.replace(/[^A-Za-z0-9+/=]/g, '');

    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    decipher.setAutoPadding(true);

    let decrypted = decipher.update(cleaned, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    throw error;
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
      responseType: 'text', // Força o Axios a não tentar interpretar os dados como JSON
      headers: {
        'Accept-Encoding': 'identity', // Desativa compressão gzip para os dados virem limpos
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

    const rawData = response.data.toString().trim();
    
    // Remove o cabeçalho 'SHOK...' caso ele venha na resposta
    let base64Limpo = rawData;
    if (rawData.includes('/')) {
      base64Limpo = rawData.substring(rawData.indexOf('/') + 1);
    }

    // Tenta decifrar
    try {
      const dadosFinais = decrypt(base64Limpo);
      
      // Retorna o JSON limpo
      try {
        res.json(JSON.parse(dadosFinais));
      } catch {
        res.send(dadosFinais);
      }
    } catch (decryptError) {
      // Se ainda assim falhar, o código mostra a resposta exata recebida para depuração
      res.status(500).send("Erro na descriptografia: " + decryptError.message + "\n\nDados recebidos:\n" + rawData);
    }

  } catch (error) {
    res.status(500).send("Erro na requisição: " + error.message);
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
