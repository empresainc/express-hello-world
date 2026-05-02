const express = require('express');
const axios = require('axios');
const crypto = require('crypto');

const app = express();
const port = process.env.PORT || 3000;

// ===============================
// CONFIG
// ===============================

const AES_KEY = "QwEr12TyUi!@Op34AsDf#$GhJk56L%^Z";
const AES_IV  = "xCvB78Nm&*9(0)Mn";

// ===============================
// FUNÇÃO DE DESCRIPTOGRAFIA
// ===============================

function decryptAllVariants(cipherText) {

  // Limpeza segura Base64
  const cleaned = cipherText
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .replace(/\s/g, '');

  const iv = Buffer.from(AES_IV, 'utf8');

  // ===========================
  // TENTATIVA AES-256-CBC
  // ===========================

  try {

    // AES-256 precisa EXACTAMENTE 32 bytes
    const key256 = Buffer.from(
      AES_KEY.substring(0, 32),
      'utf8'
    );

    const decipher256 = crypto.createDecipheriv(
      'aes-256-cbc',
      key256,
      iv
    );

    decipher256.setAutoPadding(true);

    let decrypted = decipher256.update(
      cleaned,
      'base64',
      'utf8'
    );

    decrypted += decipher256.final('utf8');

    console.log('AES-256 funcionou');

    return decrypted;

  } catch (e) {

    console.log('AES-256 falhou:');
    console.log(e.message);
  }

  // ===========================
  // TENTATIVA AES-128-CBC
  // ===========================

  try {

    const key128 = Buffer.from(
      AES_KEY.substring(0, 16),
      'utf8'
    );

    const decipher128 = crypto.createDecipheriv(
      'aes-128-cbc',
      key128,
      iv
    );

    decipher128.setAutoPadding(true);

    let decrypted = decipher128.update(
      cleaned,
      'base64',
      'utf8'
    );

    decrypted += decipher128.final('utf8');

    console.log('AES-128 funcionou');

    return decrypted;

  } catch (e) {

    console.log('AES-128 falhou:');
    console.log(e.message);
  }

  throw new Error(
    'Falhou em todas as variantes AES.'
  );
}

// ===============================
// ROTA PRINCIPAL
// ===============================

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
          'androidid': '5d570494343d7035',
          'app_id': 'filmbr',
          'app_language': 'pt',
          'channel_code': 'filmbr_sh_1000',
          'Connection': 'Keep-Alive',
          'Content-Type': 'application/x-www-form-urlencoded',
          'cur_time': Date.now().toString(),
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
      }
    );

    // ===========================
    // DADOS BRUTOS
    // ===========================

    const rawData = response.data.toString().trim();

    console.log('\n================ RAW ================\n');
    console.log(rawData);

    // NÃO cortar no "/"
    const base64Limpo = rawData;

    console.log('\n============= BASE64 =============\n');
    console.log(base64Limpo);

    // ===========================
    // DESCRIPTOGRAFAR
    // ===========================

    const dadosFinais = decryptAllVariants(
      base64Limpo
    );

    console.log('\n========== DESCRIPTOGRAFADO ==========\n');
    console.log(dadosFinais);

    // ===========================
    // TENTA DEVOLVER JSON
    // ===========================

    try {

      const json = JSON.parse(dadosFinais);

      res.json(json);

    } catch {

      res.send(dadosFinais);
    }

  } catch (error) {

    console.log('\n========== ERRO ==========\n');
    console.log(error);

    res.status(500).send({
      erro: true,
      mensagem: error.message,
      stack: error.stack
    });
  }
});

// ===============================
// START SERVER
// ===============================

app.listen(port, () => {

  console.log(`
====================================
Servidor rodando na porta ${port}
====================================
`);
});
