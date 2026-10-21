# AES 加解密：格式与互通

## 概述

AES 页面与 Agent 的 `aes_encrypt` / `aes_decrypt` 共用 `public/compute/aes.js`（`ToolCompute.load('aes')` → `KCompute.aes`）。目标是让结果能直接与 OpenSSL、Java（JCE）、Python 等标准实现互通，全部计算在浏览器内完成。

旧页面用 SHA-256(口令) 直接作密钥并输出 `Base64(IV):Base64(密文)`，旧 Agent 用 PBKDF2 + AES-GCM，两边互不兼容。新模块统一参数和输出布局：旧 Agent 的输出就是新默认格式；旧页面输出仍可解密，并标注“旧格式”。

## 设计

| 参数 | 取值 | 默认 | 互通对应 |
| --- | --- | --- | --- |
| 模式 `mode` | `GCM` / `CBC` / `CTR` | `GCM` | Java `AES/GCM/NoPadding`、`AES/CBC/PKCS5Padding`、`AES/CTR/NoPadding` |
| 密钥类型 `keyType` | `password`（PBKDF2）/ `openssl` / `hex` / `base64` / `utf8` | `password` | `PBKDF2WithHmacSHA256`；`openssl enc -pbkdf2`；`SecretKeySpec(bytes)` |
| 密钥长度 `keySize` | 128 / 192 / 256（口令派生）；原始密钥按字节数 16/24/32 | 256 | `-aes-256-*`、`PBEKeySpec(..., 256)` |
| 迭代次数 `iterations` | 1–10,000,000 | 100,000 | `-iter`、`PBEKeySpec` iterationCount |
| salt | 留空随机（16 字节，拼进输出）或指定 Hex（不拼） | 随机 | |
| IV / nonce | 留空随机（GCM 12 字节、CBC/CTR 16 字节，拼进输出）或指定 Hex/UTF-8（不拼） | 随机 | `GCMParameterSpec(128, iv)` / `IvParameterSpec` |
| AAD | UTF-8 文本，仅 GCM | 无 | `cipher.updateAAD(...)` |
| 编码 `encoding` | `base64` / `hex`；解密默认自动识别 | `base64` | |

**规则：随机生成的 salt/IV 随密文传输（拼在开头），指定的值视为双方约定、不写入输出。** 输出布局：

| 密钥类型 | 输出（再按 Base64/Hex 编码） |
| --- | --- |
| 口令 PBKDF2 | `salt(16)` ‖ `IV` ‖ 密文 ‖ `tag(16，仅 GCM)` |
| OpenSSL | `"Salted__"` ‖ `salt(8)` ‖ 密文；密钥与 IV 一起由 PBKDF2 派生（仅 CBC/CTR） |
| 原始密钥 | `IV` ‖ 密文 ‖ `tag(16，仅 GCM)` |
| 旧格式（仅解密） | `Base64(IV16):Base64(密文)`，密钥 = SHA-256(口令)，CBC 或 CTR（64 位计数器） |

- GCM：128 位标签附在密文后，与 Java/Python `AESGCM`/Go `Seal` 的输出一致。
- CBC：PKCS#7 填充（Java 的 PKCS5Padding 对 AES 即 PKCS#7）。
- CTR：整个 16 字节计数块按大端 128 位递增，与 Java/OpenSSL/Python `modes.CTR` 一致（WebCrypto `length: 128`）。
- OpenSSL：`PBKDF2-HMAC-SHA256(口令, salt, iter, keyLen+16)`，前 keyLen 字节为密钥、后 16 字节为 IV，等同 `openssl enc -aes-256-cbc -pbkdf2 -iter N -md sha256`。

## 流程

```text
加密：校验参数 → 派生/解析密钥（PBKDF2 / OpenSSL / 原始） → 随机或指定 IV → WebCrypto 加密
      → 拼接 [Salted__ salt | salt] [IV] 密文 [tag] → Base64/Hex，同时返回各部分供互通展示
解密：口令类先识别旧格式 "b64:b64" → 解码（自动识别 Hex/Base64）→ 口令类识别 "Salted__"
      → 按布局取出 salt / IV / 密文 → 派生密钥 → WebCrypto 解密 → UTF-8 文本（非 UTF-8 时给 Hex）
```

旧格式与 OpenSSL 数据不记录模式：选 CBC/CTR 时按所选模式解；选 GCM（默认）时依次尝试 CBC、CTR，只接受能解出有效 UTF-8 的结果。

## 细节

- **AES-192 回退**：Chrome 的 WebCrypto 拒绝 192 位密钥（“192-bit AES keys are not supported”）。WebCrypto 拒绝 24 字节密钥时，改用模块内的纯 JS AES（CBC/CTR/GCM），与 WebCrypto 路径用同一批 NIST 向量测试；结果里 `engine` 为 `js`。
- **错误**：抛出带 `code` 的 `AesError`（如 `KEY_LENGTH`、`IV_LENGTH`、`BAD_HEX`、`DECRYPT_FAILED`、`OPENSSL_GCM`），页面按 code 显示中英文提示，Agent 返回英文 message。
- **页面**：保留 `aesInput`/`aesKey`/`aesMode`/`aesOutput`/`aesResult`/`aesStatus` 等 id 与 `doAES`、`setAESMode`、`aesSwap` 函数（Agent 页面执行器依赖）。结果、明细和互通命令都用 `textContent` 写入。互通区按本次参数生成 OpenSSL / Java 17+ / Python（pycryptodome）解密示例，口令只用占位符。
- **Agent**：`aes_encrypt({ text, password })`、`aes_decrypt({ encrypted, password })` 行为不变（默认即 PBKDF2-SHA256 10 万次 + AES-256-GCM，`Base64(salt‖IV‖密文‖tag)`），新增可选 `mode`、`keyType`、`keySize`、`iterations`、`iv`、`salt`、`aad`、`encoding`。返回 IV、salt、tag 等公开参数，不返回密钥。

## 注意事项

- 不支持 ECB、ZeroPadding/NoPadding，也不支持 CryptoJS 口令模式 / `openssl enc` 不加 `-pbkdf2` 时的 EVP_BytesToKey(MD5)。CryptoJS 请改用原始密钥：`CryptoJS.AES.encrypt(text, CryptoJS.enc.Hex.parse(key), { iv: CryptoJS.enc.Hex.parse(iv) })`。
- `openssl enc` 不支持 GCM；`-pbkdf2` 不带 `-iter` 时 OpenSSL 默认 10,000 次，解密时迭代次数需一致。
- 指定固定 IV 只用于对接既有系统；GCM 下同一密钥重复使用 nonce 会泄露明文关系。
- 纯 JS 回退不是常数时间实现，仅用于浏览器不支持的 192 位密钥。
- 测试：`tests/aes.test.cjs` 覆盖 NIST SP 800-38A（CBC/CTR）与 GCM 规范向量、OpenSSL 命令行生成的密文、Node（OpenSSL）参考实现互解、旧页面/旧 Agent 格式；浏览器回归在 Chrome 中验证页面加解密、旧格式标注、AES-192 回退与英文界面。
