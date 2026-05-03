const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const zlib = require('zlib');

const app = express();
const port = process.env.PORT || 3000;

const AES_KEY = "QwEr12TyUi!@Op34AsDf#$GhJk56L%^Z";
const AES_IV  = "xCvB78Nm&*9(0)Mn";

function cleanPayload(data) {
  let text = data.toString().trim();

  if (text.startsWith('SHOK')) {
    text = text.slice(4);
  }

  return text;
}

function tryDecodeOutput(buf) {
  const attempts = [buf];

  try { attempts.push(zlib.gunzipSync(buf)); } catch {}
  try { attempts.push(zlib.inflateSync(buf)); } catch {}
  try { attempts.push(zlib.brotliDecompressSync(buf)); } catch {}

  for (const out of attempts) {
    const text = out.toString('utf8');

    if (
      text.startsWith('{') ||
      text.startsWith('[') ||
      text.includes('"code"') ||
      text.includes('"data"') ||
      text.includes('"msg"')
    ) {
      return text;
    }
  }

  return null;
}

function decryptAES(base64) {
  const data = Buffer.from(base64, 'base64');

  const keys = [
    {
      name: 'key direta 32 bytes',
      value: Buffer.from(AES_KEY, 'utf8')
    },
    {
      name: 'primeiros 16 bytes',
      value: Buffer.from(AES_KEY.slice(0, 16), 'utf8')
    },
    {
      name: 'MD5 key',
      value: crypto.createHash('md5').update(AES_KEY).digest()
    },
    {
      name: 'SHA256 key',
      value: crypto.createHash('sha256').update(AES_KEY).digest()
    }
  ];

  const ivs = [
    {
      name: 'iv direta',
      value: Buffer.from(AES_IV, 'utf8')
    },
    {
      name: 'iv zeros',
      value: Buffer.alloc(16, 0)
    },
    {
      name: 'iv primeiros 16 bytes do payload',
      value: data.slice(0, 16),
      strip: true
    }
  ];

  const modes = [
    'aes-256-cbc',
    'aes-128-cbc',
    'aes-256-ecb',
    'aes-128-ecb'
  ];

  for (const mode of modes) {
    for (const keyObj of keys) {
      const key = keyObj.value;

      if (mode.includes('256') && key.length !== 32) continue;
      if (mode.includes('128') && key.length !== 16) continue;

      const possibleIvs = mode.includes('ecb')
        ? [{ name: 'sem IV', value: null }]
        : ivs;

      for (const ivObj of possibleIvs) {
        for (const autoPadding of [true, false]) {
          try {
            let input = data;

            if (ivObj.strip) {
              input = data.slice(16);
            }

            const decipher = crypto.createDecipheriv(
              mode,
              key,
              ivObj.value
            );

            decipher.setAutoPadding(autoPadding);

            const decrypted = Buffer.concat([
              decipher.update(input),
              decipher.final()
            ]);

            const decoded = tryDecodeOutput(decrypted);

            if (decoded) {
              console.log("✅ AES FUNCIONOU:", {
                mode,
                key: keyObj.name,
                iv: ivObj.name,
                autoPadding
              });

              return decoded;
            }

          } catch (e) {}
        }
      }
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

    console.log("RAW INÍCIO:", raw.slice(0, 50));
    console.log("RAW TAMANHO:", raw.length);

    if (!raw.startsWith('SHOK')) {
      return res.send({
        erro: true,
        tipo: 'API_ERRO_OU_RESPOSTA_INVALIDA',
        data: raw
      });
    }

    const payload = cleanPayload(raw);
    const decrypted = decryptAES(payload);

    try {
      return res.json(JSON.parse(decrypted));
    } catch {
      return res.send(decrypted);
    }

  } catch (error) {
    return res.status(500).send({
      erro: true,
      mensagem: error.message
    });
  }
});

app.listen(port, () => {
  console.log("Servidor rodando na porta " + port);
});
