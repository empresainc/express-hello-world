const express = require('express');
const axios = require('axios');
const crypto = require('crypto');

const app = express();
const port = process.env.PORT || 3000;

const AES_KEY = "QwEr12TyUi!@Op34AsDf#$GhJk56L%^Z";
const AES_IV  = "xCvB78Nm&*9(0)Mn";

// 🔥 Função avançada de tentativa múltipla
function decryptAllVariants(cipherText) {
  const attempts = [];

  const raw = cipherText.trim();

  // Possíveis chaves
  const keys = [
    Buffer.from(AES_KEY, 'utf8'),
    crypto.createHash('sha256').update(AES_KEY).digest(),
    crypto.createHash('md5').update(AES_KEY).digest(),
    Buffer.from(AES_KEY.substring(0, 16), 'utf8')
  ];

  const iv = Buffer.from(AES_IV, 'utf8');

  // Modos possíveis
  const modes = [
    'aes-256-cbc',
    'aes-128-cbc',
    'aes-256-ecb',
    'aes-128-ecb'
  ];

  for (let key of keys) {
    for (let mode of modes) {
      try {
        const useIV = mode.includes('cbc');

        const decipher = crypto.createDecipheriv(
          mode,
          key.length >= 32 ? key.slice(0, 32) : key,
          useIV ? iv.slice(0, 16) : null
        );

        decipher.setAutoPadding(true);

        let decrypted = decipher.update(raw, 'base64', 'utf8');
        decrypted += decipher.final('utf8');

        if (decrypted && decrypted.length > 10) {
          return {
            success: true,
            mode,
            keyType: key.toString('hex').slice(0, 8),
            data: decrypted
          };
        }

      } catch (e) {
        attempts.push(`${mode} falhou`);
      }
    }
  }

  throw new Error("Nenhuma variante funcionou.\nTentativas:\n" + attempts.join('\n'));
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
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const rawData = response.data.toString().trim();
    console.log("RAW RECEBIDO:\n", rawData);

    let base64Data = rawData;

    // ⚠️ NÃO cortar agressivamente
    if (rawData.startsWith('{') === false && rawData.includes('/')) {
      base64Data = rawData.split('/').pop();
    }

    try {
      const result = decryptAllVariants(base64Data);

      console.log("✔ SUCESSO:", result.mode);

      try {
        res.json(JSON.parse(result.data));
      } catch {
        res.send(result.data);
      }

    } catch (err) {
      res.status(500).send(
        "Erro ao descriptografar:\n" +
        err.message +
        "\n\nRAW:\n" + rawData
      );
    }

  } catch (error) {
    res.status(500).send("Erro na request: " + error.message);
  }
});

app.listen(port, () => {
  console.log("Servidor rodando na porta " + port);
});
