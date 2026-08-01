# Fish OpenAI TTS Bridge — 一键部署版

> **专有软件，不是开源项目。** 仅限取得有效 `LICENSE_KEY` 的客户为个人部署用途 Fork 和使用。禁止复制、镜像、二次分发；禁止删除、绕过或篡改授权验证；禁止修改后发布成自己的产品。详见 [LICENSE](./LICENSE)。

把任何支持 OpenAI / 自定义 OpenAI TTS 的应用，连接到你自己的 Fish Audio 账号。

> 这是自托管部署仓库：你的 Fish API Key 和 Railway 服务都由你自己掌控。使用本服务需要一枚由服务提供方发放的授权码。

## 部署到 Railway

1. Fork 本仓库到你自己的 GitHub 账号。
2. 登录 Railway，点 **New** → **Deploy from GitHub repo**。
3. 选择你 Fork 后的这个仓库，等待部署完成。
4. 在 Railway 服务的 **Variables** 中添加以下变量：

| 变量 | 填写内容 |
| --- | --- |
| `FISH_API_KEY` | 你自己的 Fish Audio API Key |
| `TTS_GATEWAY_KEY` | 自己设置的一串随机长密码，之后填写到 Kelivo 的 API Key |
| `LICENSE_KEY` | 服务提供方给你的专属 `fish_...` 授权码 |
| `FISH_MODEL` | `s2.1-pro-free` |

5. 打开 Railway 服务的 **Settings** → **Networking** → **Generate Domain**，复制生成的网址。

## 接入 Kelivo

在 Kelivo 选择 **OpenAI** 或 **自定义 OpenAI** 语音服务，并填写：

```text
API Base URL: https://你的-Railway-域名/v1
API Key:      你的 TTS_GATEWAY_KEY
Model:        s2.1-pro-free
Voice:        Fish Audio 音色的 Reference ID
```

## 授权说明

- 每枚授权码首次成功请求时会自动绑定当前 Railway 域名。
- 同一地址可持续使用。
- 授权码被复制到其他 Railway 地址时会被拒绝。
- 如果你迁移 Railway 或更换域名，请联系服务提供方重置绑定。

## 安全提醒

不要公开或截图分享：`FISH_API_KEY`、`TTS_GATEWAY_KEY`、`LICENSE_KEY`。
