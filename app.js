const express = require('express');
const axios = require('axios');
const crypto = require('crypto');

const app = express();
const port = process.env.PORT || 3000;

const AES_KEY = "QwEr12TyUi!@Op34AsDf#$GhJk56L%^Z";
const AES_IV  = "xCvB78Nm&*9(0)Mn";

function cleanPayload(data) {
  let text = data.trim();

  if (text.startsWith('SHOK')) {
    text = text.substring(4);
  }

  return text.trim();
}

function decryptAES(base64) {
  const iv = Buffer.from(AES_IV, 'utf8');

  const variants = [
    {
      name: 'AES-256-CBC chave direta',
      algo: 'aes-256-cbc',
      key: Buffer.from(AES_KEY, 'utf8'),
      iv
    },
    {
      name: 'AES-128-CBC primeiros 16 bytes',
      algo: 'aes-128-cbc',
      key: Buffer.from(AES_KEY.substring(0, 16), 'utf8'),
      iv
    },
    {
      name: 'AES-256-CBC SHA256(key)',
      algo: 'aes-256-cbc',
      key: crypto.createHash('sha256').update(AES_KEY).digest(),
      iv
    },
    {
      name: 'AES-128-CBC MD5(key)',
      algo: 'aes-128-cbc',
      key: crypto.createHash('md5').update(AES_KEY).digest(),
      iv
    },
    {
      name: 'AES-256-ECB chave direta',
      algo: 'aes-256-ecb',
      key: Buffer.from(AES_KEY, 'utf8'),
      iv: null
    },
    {
      name: 'AES-128-ECB primeiros 16 bytes',
      algo: 'aes-128-ecb',
      key: Buffer.from(AES_KEY.substring(0, 16), 'utf8'),
      iv: null
    }
  ];

  for (const v of variants) {
    try {
      const decipher = crypto.createDecipheriv(v.algo, v.key, v.iv);
      decipher.setAutoPadding(true);

      let decrypted = decipher.update(base64, 'base64', 'utf8');
      decrypted += decipher.final('utf8');

      console.log("✅ Funcionou com:", v.name);
      return decrypted;

    } catch (e) {
      console.log("❌ Falhou:", v.name);
    }
  }

  throw new Error("Nenhuma variante AES conseguiu descriptografar.");
}

app.get('/', async (req, res) => {
  try {
    const response = await axios.post(
      'https://filmbr.i2s1n.com/api/search/screen',
      '',
      {
        responseType: 'text',
        headers: {
          'Accept-Encoding': 'gzip',
          'androidid': '5d570494343d7035',
          'app_id': 'filmbr',
          'app_language': 'pt',
          'channel_code': 'filmbr_sh_1000',
          'Connection': 'Keep-Alive',
          'Content-Length': '0',
          'Content-Type': 'application/x-www-form-urlencoded',
          'cur_time': '1777766818180',
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
          'sign': 'C8DB89B5A97B3E0B17534644FEC37CA8',
          'sys_platform': '2',
          'sysrelease': '9',
          'token': 'gAAAAABp9nC0Zy-ybbd_c9ViqvoS-MCYQuBAzahp1tnmmXVML3tTH1Qx_Ox2yz8MPUucxAQSy6rcWmJb0xxkATcgcVA2n06rgwIBoLbxirQipza_ENWC4Vb5l1VCexY790wj1rXv4fkBu5Usbbjl1n0t_ZSwMUWF3gJ2J3I-BJgxLcoQmABfrQY4eimt6PMCzctxoAv64NFSfoN1JQO0wvu8n4MH64qgztKYrYPLJpKj20OUAy8t8VPlKXtUDshlNmGAA3d3yofk',
          'User-Agent': 'okhttp/4.12.0',
          'version': '40000'
        }
      }
    );

    const raw = response.data.toString().trim();
    console.log("RAW:", raw.substring(0, 100));

    const payload = cleanPayload(raw);
    const decrypted = decryptAES(payload);

    try {
      res.json(JSON.parse(decrypted));
    } catch {
      res.send(decrypted);
    }

  } catch (error) {
    res.status(500).send({
      erro: true,
      mensagem: error.message
    });
  }
});

app.listen(port, () => {
  console.log("Servidor rodando na porta " + port);
});
