# Fish 专属语音配置教程

> 本仓库为**专有授权软件**，不是开源项目。客户可为了自己的部署用途 Fork 本仓库；禁止复制、二次分发、绕过授权或修改后作为自己的产品发布。详见 [LICENSE](./LICENSE)。

---

## 🌸 前言｜这是什么？

这是一套把 **Fish Audio 音色**接入语音软件的方法。

完成后，你可以在自己常用的软件里使用 Fish Audio 的音色朗读文字；Fish API Key、自己的语音站和音色都由你自己保存和管理，不和别人共用。

本教程适用于支持 **OpenAI** 或 **自定义 OpenAI** 语音接口的软件。

判断方法很简单：如果软件的语音设置页面里可以填写下面几项，就可以按本教程配置：

- API Key
- API 基址 / Base URL
- 模型 / Model
- 音色 / Voice ID

不同软件的页面长得不一样，但填写逻辑相同。

### ⚠️ 开始前请知道

1. `FISH_API_KEY`、`TTS_GATEWAY_KEY`、`LICENSE_KEY` 都是私人信息，不要发给别人。
2. 需要你自己注册 Fish Audio、GitHub 和 Railway。
3. Railway、Fish Audio 的免费额度和使用规则可能调整，请以平台当时页面为准。
4. 如果你的软件没有 OpenAI / 自定义 OpenAI 语音配置入口，就不能直接使用这套方法。
5. 本服务还需要服务提供方单独发给你一枚 `fish_...` 授权码。

---

# 🌸 Fish 专属语音配置教程

适用于所有支持「OpenAI / 自定义 OpenAI」语音接口的软件。

━━━━━━━━━━━━

## 【第 1 步｜注册 Fish Audio】

打开 [Fish Audio 注册页](https://fish.audio/auth/signup)，注册并登录。

然后打开 [Fish Audio API Keys](https://fish.audio/app/api-keys/)，点击 **Create New Key**，复制并保存你的 Fish API Key。

接着在 Fish Audio 选择喜欢的音色，复制它的 **Reference ID**。

你现在需要保存两样东西：

```text
Fish API Key：

音色 Reference ID：
```

━━━━━━━━━━━━

## 【第 2 步｜复制部署仓库】

在本页面顶部点击 **Fork**。

Fork 的意思是：在你自己的 GitHub 账号下创建一份部署用副本。你不需要改代码。

点击后选择你自己的账号，等待 GitHub 创建完成。

> 没有 Fork 按钮或不会操作时，也可以在 Railway 里选择本仓库进行部署；但建议 Fork，这样你的 Railway 服务连接的是你自己的 GitHub 副本。

━━━━━━━━━━━━

## 【第 3 步｜注册 Railway】

打开 [Railway](https://railway.app/)，使用 GitHub 登录。

登录后点击：

```text
New → Deploy from GitHub repo
```

选择你刚刚 Fork 的仓库：

```text
fish-openai-tts-bridge-deploy
```

━━━━━━━━━━━━

## 【第 4 步｜填 4 项变量】

进入 Railway 新建的服务，打开：

```text
Variables
```

新增下面 **4 项**：

### ① Fish API Key

```text
名称：FISH_API_KEY
内容：粘贴你自己的 Fish API Key
```

### ② 语音站密码

```text
名称：TTS_GATEWAY_KEY
内容：自己设置一串长密码
```

例如：

```text
my_fish_voice_2026_123
```

### ③ 专属授权码

```text
名称：LICENSE_KEY
内容：粘贴服务提供方发给你的 fish_... 授权码
```

### ④ Fish 模型

```text
名称：FISH_MODEL
内容：s2.1-pro-free
```

填完后等待 Railway 部署完成。看到服务状态正常或日志显示已启动，就说明语音站已创建。

━━━━━━━━━━━━

## 【第 5 步｜生成并复制公网地址】

在 Railway 服务中打开：

```text
Settings → Networking → Generate Domain
```

复制生成的网址。它大致长这样：

```text
https://你的项目.up.railway.app
```

保存好这个地址。

━━━━━━━━━━━━

## 【第 6 步｜填到语音软件】

打开你使用的语音软件，找到「语音服务」或「TTS 服务」。

服务提供方请选择：

```text
OpenAI
```

或：

```text
自定义 OpenAI
```

然后填写：

```text
名称：随便写，例如：我的 Fish 语音

API Key：填写你设置的 TTS_GATEWAY_KEY

API 基址：你的 Railway 地址/v1

模型：s2.1-pro-free

音色：填写 Fish Audio 的 Reference ID
```

举例：

```text
API 基址：
https://你的项目.up.railway.app/v1
```

━━━━━━━━━━━━

## 【注意｜最容易填错】

```text
FISH_API_KEY
→ 只填写在 Railway 的 Variables 里

TTS_GATEWAY_KEY
→ 填写到语音软件的 API Key

LICENSE_KEY
→ 填写在 Railway 的 Variables 里，不填进语音软件

API 基址最后
→ 一定要加 /v1
```

━━━━━━━━━━━━

## 【完成】

保存后，试着生成一段语音。

能正常生成声音，就说明配置成功。

如果迁移 Railway、重新生成域名或换了新的部署，请联系服务提供方重置授权绑定。
