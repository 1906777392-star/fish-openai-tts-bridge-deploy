require("dotenv").config();

const Fastify = require("fastify");
const app = Fastify({ logger: true, bodyLimit: 2 * 1024 * 1024 });
const PORT = Number(process.env.PORT) || 3000;
const FISH_TTS_URL = "https://api.fish.audio/v1/tts";
const MAX_INPUT_CHARS = Math.max(1, Number(process.env.MAX_INPUT_CHARS) || 3000);
const RATE_LIMIT_PER_MINUTE = Math.max(1, Number(process.env.RATE_LIMIT_PER_MINUTE) || 20);
const LICENSE_SERVER_URL = String(process.env.LICENSE_SERVER_URL || "https://fish-tts-license-server.1906777392.workers.dev").trim().replace(/\/+$/, "");
const LICENSE_CACHE_TTL_MS = Math.max(60_000, Number(process.env.LICENSE_CACHE_TTL_MS) || 6 * 60 * 60 * 1000);
const requestsByIp = new Map();
const licenseCache = new Map();

function configuredClientKey() { return String(process.env.TTS_GATEWAY_KEY || "").trim(); }
function configuredLicenseKey() { return String(process.env.LICENSE_KEY || "").trim(); }

function requireClientKey(req, reply) {
  const expected = configuredClientKey();
  if (!expected) { reply.code(500).send({ error: { message: "TTS_GATEWAY_KEY 未配置", type: "configuration_error" } }); return false; }
  const bearer = String(req.headers.authorization || "").match(/^Bearer\s+(.+)$/i)?.[1]?.trim() || "";
  const xApiKey = String(req.headers["x-api-key"] || "").trim();
  if (bearer === expected || xApiKey === expected) return true;
  reply.code(401).send({ error: { message: "语音桥 API Key 无效", type: "authentication_error" } }); return false;
}

function allowRequest(req, reply) {
  const ip = String(req.ip || "unknown"), now = Date.now(), start = now - 60_000;
  const recent = (requestsByIp.get(ip) || []).filter(time => time >= start);
  if (recent.length >= RATE_LIMIT_PER_MINUTE) { reply.code(429).send({ error: { message: "请求过于频繁，请稍后再试", type: "rate_limit_error" } }); return false; }
  recent.push(now); requestsByIp.set(ip, recent); return true;
}

function deploymentInstanceId(req) {
  const forwardedHost = String(req.headers["x-forwarded-host"] || "").split(",")[0].trim();
  return (forwardedHost || String(req.headers.host || "").trim()).toLowerCase().replace(/:\d+$/, "");
}

async function requireLicense(req, reply) {
  const licenseKey = configuredLicenseKey();
  if (!licenseKey) { reply.code(503).send({ error: { message: "LICENSE_KEY 未配置，请联系服务提供方", type: "license_configuration_error" } }); return false; }
  const instanceId = deploymentInstanceId(req);
  if (instanceId.length < 3) { reply.code(503).send({ error: { message: "无法识别此部署地址", type: "license_instance_error" } }); return false; }
  if ((licenseCache.get(instanceId) || 0) > Date.now()) return true;
  const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const verification = await fetch(`${LICENSE_SERVER_URL}/v1/verify`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ licenseKey, instanceId }), signal: controller.signal });
    let payload = {}; try { payload = await verification.json(); } catch (_) {}
    if (!verification.ok || payload.valid !== true) { reply.code(verification.status === 403 ? 403 : 503).send({ error: { message: payload?.error?.message || "授权验证失败", type: payload?.error?.type || "license_error" } }); return false; }
    licenseCache.set(instanceId, Date.now() + LICENSE_CACHE_TTL_MS); return true;
  } catch (error) {
    req.log.error({ message: error.message }, "License verification exception");
    reply.code(503).send({ error: { message: "授权服务暂时不可用，请稍后重试", type: "license_unavailable" } }); return false;
  } finally { clearTimeout(timeout); }
}

app.get("/", async () => ({ ok: true, service: "fish-audio-openai-bridge", docs: "Use POST /v1/audio/speech" }));
app.get("/health", async () => ({ ok: true, service: "fish-audio-openai-bridge" }));
app.get("/v1/models", async (req, reply) => {
  if (!await requireLicense(req, reply) || !requireClientKey(req, reply)) return;
  const model = String(process.env.FISH_MODEL || "s2.1-pro-free").trim();
  return { object: "list", data: [{ id: model, object: "model", owned_by: "fish-audio" }] };
});
app.post("/v1/audio/speech", async (req, reply) => {
  if (!await requireLicense(req, reply) || !requireClientKey(req, reply) || !allowRequest(req, reply)) return;
  const fishKey = String(process.env.FISH_API_KEY || "").trim();
  if (!fishKey) return reply.code(500).send({ error: { message: "FISH_API_KEY 未配置", type: "configuration_error" } });
  const body = req.body || {}, text = String(body.input || body.text || "").trim(), referenceId = String(body.voice || "").trim(), model = String(body.model || process.env.FISH_MODEL || "s2.1-pro-free").trim();
  if (!text) return reply.code(400).send({ error: { message: "缺少 input 文本", type: "invalid_request_error" } });
  if (text.length > MAX_INPUT_CHARS) return reply.code(400).send({ error: { message: `单次文字不能超过 ${MAX_INPUT_CHARS} 个字符`, type: "invalid_request_error" } });
  if (!referenceId) return reply.code(400).send({ error: { message: "缺少 voice（Fish 音色 Reference ID）", type: "invalid_request_error" } });
  const requestedFormat = String(body.response_format || "mp3").toLowerCase();
  const format = ["mp3", "wav", "opus", "pcm"].includes(requestedFormat) ? requestedFormat : "mp3";
  const fishBody = { text, reference_id: referenceId, format, normalize: true, chunk_length: 300, latency: "normal" };
  const speed = Number(body.speed); if (Number.isFinite(speed) && speed >= 0.5 && speed <= 2) fishBody.prosody = { speed, volume: 0, normalize_loudness: true };
  try {
    const upstream = await fetch(FISH_TTS_URL, { method: "POST", headers: { Authorization: `Bearer ${fishKey}`, "Content-Type": "application/json", model }, body: JSON.stringify(fishBody) });
    if (!upstream.ok) return reply.code(upstream.status).send({ error: { message: `Fish Audio 请求失败（HTTP ${upstream.status}）`, type: "upstream_error" } });
    const audio = Buffer.from(await upstream.arrayBuffer());
    const contentType = upstream.headers.get("content-type") || (format === "wav" ? "audio/wav" : format === "opus" ? "audio/ogg" : "audio/mpeg");
    return reply.code(200).header("Content-Type", contentType).header("Content-Length", String(audio.length)).send(audio);
  } catch (error) { req.log.error({ message: error.message }, "Fish Audio request exception"); return reply.code(502).send({ error: { message: "无法连接 Fish Audio，请稍后再试", type: "upstream_connection_error" } }); }
});
app.listen({ port: PORT, host: "0.0.0.0" }).then(address => app.log.info(`Fish Audio 语音桥运行在 ${address}`)).catch(error => { app.log.error(error); process.exit(1); });
