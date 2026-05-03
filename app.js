function decryptAES(base64) {
  const zlib = require('zlib');

  const data = Buffer.from(base64, 'base64');

  const keys = [
    Buffer.from(AES_KEY, 'utf8'),
    Buffer.from(AES_KEY.slice(0, 16), 'utf8'),
    crypto.createHash('md5').update(AES_KEY).digest(),
    crypto.createHash('sha256').update(AES_KEY).digest()
  ];

  const ivs = [
    Buffer.from(AES_IV, 'utf8'),
    Buffer.alloc(16, 0),
    data.slice(0, 16)
  ];

  const modes = ['aes-256-cbc', 'aes-128-cbc', 'aes-256-ecb', 'aes-128-ecb'];

  function decodeOutput(buf) {
    const attempts = [];

    attempts.push(buf);

    try { attempts.push(zlib.gunzipSync(buf)); } catch {}
    try { attempts.push(zlib.inflateSync(buf)); } catch {}
    try { attempts.push(zlib.brotliDecompressSync(buf)); } catch {}

    for (const out of attempts) {
      const text = out.toString('utf8');

      if (
        text.includes('{') ||
        text.includes('[') ||
        text.includes('"') ||
        text.length > 20
      ) {
        return text;
      }
    }

    return null;
  }

  for (const mode of modes) {
    for (const keyRaw of keys) {
      let key = keyRaw;

      if (mode.includes('256') && key.length !== 32) continue;
      if (mode.includes('128') && key.length !== 16) continue;

      const possibleIvs = mode.includes('ecb') ? [null] : ivs;

      for (const iv of possibleIvs) {
        for (const autoPadding of [true, false]) {
          try {
            let input = data;

            // se o IV vier embutido nos primeiros 16 bytes
            if (iv && iv.equals(data.slice(0, 16))) {
              input = data.slice(16);
            }

            const decipher = crypto.createDecipheriv(mode, key, iv);
            decipher.setAutoPadding(autoPadding);

            const decrypted = Buffer.concat([
              decipher.update(input),
              decipher.final()
            ]);

            const decoded = decodeOutput(decrypted);

            if (decoded) {
              console.log("✅ FUNCIONOU:", {
                mode,
                keyLength: key.length,
                iv: iv ? iv.toString('utf8') : 'ECB',
                autoPadding
              });

              return decoded;
            }

          } catch {}
        }
      }
    }
  }

  throw new Error("Nenhuma variante AES conseguiu descriptografar.");
}
