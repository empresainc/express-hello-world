const express = require("express");
const axios = require("axios");
const crypto = require("crypto");
const zlib = require("zlib");

const app = express();
const port = process.env.PORT || 3000;

const AES_KEY = "QwEr12TyUi!@Op34AsDf#$GhJk56L%^Z";
const AES_IV = "xCvB78Nm&*9(0)Mn";

function decodeOutput(buffer) {
  const tries = [buffer];

  try { tries.push(zlib.gunzipSync(buffer)); } catch {}
  try { tries.push(zlib.inflateSync(buffer)); } catch {}
  try { tries.push(zlib.inflateRawSync(buffer)); } catch {}

  for (const b of tries) {
    const txt = b.toString("utf8").trim();
    if (txt.startsWith("{") || txt.startsWith("[")) return txt;
  }

  return null;
}

function decryptAES(raw) {
  const text = raw.trim();
  const key = Buffer.from(AES_KEY, "utf8");
  const iv = Buffer.from(AES_IV, "utf8");

  for (let offset = 0; offset <= 80; offset++) {
    let payload = text.slice(offset).trim();

    if (!/^[A-Za-z0-9+/=]+$/.test(payload)) continue;
    if (payload.length % 4 !== 0) continue;

    const encrypted = Buffer.from(payload, "base64");

    if (encrypted.length % 16 !== 0) continue;

    try {
      const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
      decipher.setAutoPadding(true);

      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ]);

      const decoded = decodeOutput(decrypted);

      if (decoded) {
        console.log("FUNCIONOU COM OFFSET:", offset);
        return decoded;
      }
    } catch {}
  }

  throw new Error("AES falhou. Precisa descobrir o offset/header real ou outro decrypt.");
}

app.get("/", async (req, res) => {
  try {
    const response = await axios.post(
      "https://filmbr.i2s1n.com/api/search/screen",
      "",
      {
        responseType: "text",
        headers: {
          "Accept-Encoding": "gzip",
          "androidid": "5d570494343d7035",
          "app_id": "filmbr",
          "app_language": "pt",
          "channel_code": "filmbr_sh_1000",
          "Connection": "Keep-Alive",
          "Content-Length": "0",
          "Content-Type": "application/x-www-form-urlencoded",
          "cur_time": "1777766818180",
          "device_id": "5d570494343d7035",
          "en_al": "0",
          "gaid": "24be4297-657d-44b3-9639-1f498c263839",
          "Host": "filmbr.i2s1n.com",
          "is_display": "GMT+00:00",
          "is_language": "pt",
          "is_vvv": "1",
          "log-header": "I am the log request header.",
          "mob_mfr": "oneplus",
          "mobmodel": "NE2211",
          "package_name": "com.starshort.minishort",
          "sign": "C8DB89B5A97B3E0B17534644FEC37CA8",
          "sys_platform": "2",
          "sysrelease": "9",
          "token": "gAAAAABp9nC0Zy-ybbd_c9ViqvoS-MCYQuBAzahp1tnmmXVML3tTH1Qx_Ox2yz8MPUucxAQSy6rcWmJb0xxkATcgcVA2n06rgwIBoLbxirQipza_ENWC4Vb5l1VCexY790wj1rXv4fkBu5Usbbjl1n0t_ZSwMUWF3gJ2J3I-BJgxLcoQmABfrQY4eimt6PMCzctxoAv64NFSfoN1JQO0wvu8n4MH64qgztKYrYPLJpKj20OUAy8t8VPlKXtUDshlNmGAA3d3yofk",
          "User-Agent": "okhttp/4.12.0",
          "version": "40000"
        }
      }
    );

    const raw = response.data.toString().trim();
    const decrypted = decryptAES(raw);

    return res.json(JSON.parse(decrypted));

  } catch (error) {
    return res.status(500).json({
      erro: true,
      mensagem: error.message
    });
  }
});

app.listen(port, () => {
  console.log("Servidor rodando na porta " + port);
});
