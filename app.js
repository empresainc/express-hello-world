const express = require("express");
const axios = require("axios");
const crypto = require("crypto");

const app = express();
const port = process.env.PORT || 3000;

const AES_KEY = "QwEr12TyUi!@Op34AsDf#$GhJk56L%^Z";
const AES_IV = "xCvB78Nm&*9(0)Mn";

function decryptAES(raw) {
  const variants = [
    raw.trim(),
    raw.trim().startsWith("SHOK") ? raw.trim().slice(4) : raw.trim(),
    raw.trim().startsWith("SHOK") ? raw.trim().slice(8) : raw.trim()
  ];

  const key = Buffer.from(AES_KEY, "utf8");
  const iv = Buffer.from(AES_IV, "utf8");

  for (const data of variants) {
    try {
      const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
      decipher.setAutoPadding(true);

      let decrypted = decipher.update(data, "base64", "utf8");
      decrypted += decipher.final("utf8");

      return decrypted;
    } catch (e) {}
  }

  throw new Error("Falhou no AES. Provavelmente o prefixo não é SHOK/SHOK5119 ou este endpoint usa outro decrypt.");
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

    try {
      res.json(JSON.parse(decrypted));
    } catch {
      res.send(decrypted);
    }

  } catch (error) {
    res.status(500).json({
      erro: true,
      mensagem: error.message
    });
  }
});

app.listen(port, () => {
  console.log("Servidor rodando na porta " + port);
});
