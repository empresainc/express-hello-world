const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const app = express();
const port = process.env.PORT || 3000;

// Configurações exatas extraídas do seu JADX
const AES_KEY = "QwEr12TyUi!@Op34AsDf#$GhJk56L%^Z";
const AES_IV  = "xCvB78Nm&*9(0)Mn";

// Função que tenta descriptografar de todas as formas possíveis
function decryptAllVariants(cipherText) {
  // Limpeza absoluta de caracteres inválidos do Base64
  const cleaned = cipherText.replace(/[^A-Za-z0-9+/=]/g, '');
  const iv = Buffer.from(AES_IV, 'utf8');

  // Variável para guardar o resultado se funcionar
  let decryptedResult = null;

  // Variante 1: AES-256-CBC usando a chave completa (32 bytes)
  try {
    const key256 = Buffer.from(AES_KEY, 'utf8');
    const decipher256 = crypto.createDecipheriv('aes-256-cbc', key256, iv);
    decipher256.setAutoPadding(true);
    let decrypted = decipher256.update(cleaned, 'base64', 'utf8');
    decrypted += decipher256.final('utf8');
    return decrypted;
  } catch (e) {
    // Falhou com AES-256, vamos tentar a Variante 2
  }

  // Variante 2: AES-128-CBC usando apenas os primeiros 16 bytes da chave
  try {
    const key128 = Buffer.from(AES_KEY.substring(0, 16), 'utf8');
    const decipher128 = crypto.createDecipheriv('aes-128-cbc', key128, iv);
    decipher128.setAutoPadding(true);
    let decrypted = decipher128.update(cleaned, 'base64', 'utf8');
    decrypted += decipher128.final('utf8');
    return decrypted;
  } catch (e) {
    // Falhou também com AES-128
  }

  throw new Error("Falhou em todas as variantes de AES (128 e 256 bits).");
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
      responseType: 'text',
      headers: {
        'Accept-Encoding': 'identity',
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
    
    // Corta a string após a primeira barra '/' para isolar o Base64
    let base64Limpo = rawData;
    if (rawData.includes('/')) {
      base64Limpo = rawData.substring(rawData.indexOf('/') + 1);
    }

    try {
      // Tenta descriptografar usando as variantes
      const dadosFinais = decryptAllVariants(base64Limpo);
      
      // Retorna o JSON original ou texto
      try {
        res.json(JSON.parse(dadosFinais));
      } catch {
        res.send(dadosFinais);
      }
    } catch (error) {
      res.status(500).send("Erro na descriptografia: " + error.message + "\n\nDados Base64 tentados:\n" + base64Limpo);
    }

  } catch (error) {
    res.status(500).send("Erro na requisição: " + error.message);
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
