const express = require('express');
const axios = require('axios');
const crypto = require('crypto');

const app = express();
const port = process.env.PORT || 3000;

const AES_KEY = "QwEr12TyUi!@Op34AsDf#$GhJk56L%^Z";
const AES_IV  = "xCvB78Nm&*9(0)Mn";

// 🔐 Detecta se é Base64 válido
function isBase64(str) {
  return /^[A-Za-z0-9+/=]+$/.test(str);
}

// 🔓 Tentativa de decrypt simples (sem brute force inútil)
function decryptAES(cipherText) {
  try {
    const key = Buffer.from(AES_KEY, 'utf8');
    const iv = Buffer.from(AES_IV, 'utf8');

    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    decipher.setAutoPadding(true);

    let decrypted = decipher.update(cipherText, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (e) {
    return null;
  }
}

app.get('/', async (req, res) => {
  try {
    const params = new URLSearchParams();
    params.append('app_id', 'filmbr');
    params.append('version', '1.0.0');
    params.append('device_id', '5d570494343d7035');

    const response = await axios.post(
      'https://filmbr.i2s1n.com/api/search/screen',
      params.toString(),
      {
        responseType: 'text',
        headers: {
          'Accept-Encoding': 'identity',
          'Content-Type': 'application/x-www-form-urlencoded',
          'androidid': '5d570494343d7035',
          'app_id': 'filmbr',
          'app_language': 'pt',
          'channel_code': 'filmbr_sh_1000',
          'device_id': '5d570494343d7035',
          'package_name': 'com.starshort.minishort'
        }
      }
    );

    const rawData = response.data.toString().trim();

    console.log("📥 RAW:", rawData);

    // 🚫 Se não for Base64 → é erro da API
    if (!isBase64(rawData)) {
      return res.send({
        erro: true,
        tipo: "API_ERRO",
        mensagem: rawData
      });
    }

    // 🔓 tentar decrypt
    const decrypted = decryptAES(rawData);

    if (!decrypted) {
      return res.send({
        erro: true,
        tipo: "DECRYPT_FALHOU",
        base64: rawData
      });
    }

    // 📦 tentar converter para JSON
    try {
      return res.json(JSON.parse(decrypted));
    } catch {
      return res.send({
        sucesso: true,
        texto: decrypted
      });
    }

  } catch (error) {
    return res.status(500).send({
      erro: true,
      tipo: "REQUEST_FALHOU",
      mensagem: error.message
    });
  }
});

app.listen(port, () => {
  console.log("🚀 Servidor rodando na porta " + port);
});
