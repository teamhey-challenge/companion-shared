/**
 * 컴패니언 WebSocket 프로토콜 (developer.md §6.2). 텍스트 프레임 = JSON, 바이너리 = 서버→앱 TTS 오디오(PCM s16le).
 * 의존성 없는 순수 TS: 서버·웹·테스트가 같은 검증기를 쓴다.
 */

export const PROTOCOL_VERSION = 1;
export const MAX_TEXT_CHARS = 500;
export const MAX_FRAME_BYTES = 4 * 1024;
export const MAX_ID_CHARS = 64;

export type Trigger = "ptt" | "listen_after_proactive";
export type CtxValue = string | number | boolean | null;
export type Ctx = Record<string, CtxValue>;

export interface AudioFormat {
  format: "pcm_s16le";
  sampleRate: number;
  channels: 1;
}
export type AudioSpec = AudioFormat | "none";

// ---- 앱 → 서버 ----
export interface Hello { type: "hello"; v: number; appVersion: string }
export interface TurnStart { type: "turn.start"; turnId: string; trigger: Trigger }
export interface TextFrame { type: "text"; turnId: string; text: string }
export interface CtxFrame { type: "ctx"; turnId?: string; ctx: Ctx }
export interface TurnEnd { type: "turn.end"; turnId: string }
export interface TurnCancel { type: "turn.cancel"; turnId: string }
export type ClientFrame = Hello | TurnStart | TextFrame | CtxFrame | TurnEnd | TurnCancel;

// ---- 서버 → 앱 ----
export interface ReplyStart { type: "reply.start"; turnId: string; audio: AudioSpec }
export interface ReplyDelta { type: "reply.delta"; turnId: string; text: string }
export interface ReplyEnd { type: "reply.end"; turnId: string; text: string; firstTokenMs: number | null; totalMs: number }
export interface Proactive { type: "proactive"; id: string; reason: string }
export interface ErrorFrame { type: "error"; code: ErrorCode; turnId?: string; message?: string }
export type ServerFrame = ReplyStart | ReplyDelta | ReplyEnd | Proactive | ErrorFrame;

export const ERROR_CODES = [
  "bad_json", "bad_frame", "hello_required", "text_too_long", "turn_unknown",
  "rate_limited", "no_key", "llm_failed", "binary_not_accepted",
] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];

// ---- HTTP ----
export interface RegisterRequest { installId: string }
export interface RegisterResponse { carToken: string }
export interface SessionResponse { sessionId: string; wsTicket: string; expiresInSec: number }
export const PROVISION_HEADER = "X-Provision-Secret";

/** 좌표로 보이는 키. ctx에서 조용히 버린다(대소문자 무시, 접두·접미 포함). */
const COORD_KEY = /(^|[_\-.])(lat|lng|lon|long|latitude|longitude|location|loc|gps|position|pos|coords?|coordinates?|geo|geolocation)([_\-.]|$)|^(lat|lon|lng)(itude)?\d*$|latitude|longitude|gps|location|geo/i;
export const isCoordKey = (k: string): boolean => COORD_KEY.test(k);

export type Parsed<T> = { ok: true; value: T } | { ok: false; code: ErrorCode };
const bad = (code: ErrorCode = "bad_frame"): { ok: false; code: ErrorCode } => ({ ok: false, code });

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const isId = (v: unknown): v is string => typeof v === "string" && v.length >= 1 && v.length <= MAX_ID_CHARS && /^[\w.:\-]+$/.test(v);

/** ctx에서 좌표 키를 버리고, 원시값만 남긴다. 최대 32개 키. */
export function sanitizeCtx(raw: unknown): Ctx | null {
  if (!isObj(raw)) return null;
  const out: Ctx = {};
  let n = 0;
  for (const [k, v] of Object.entries(raw)) {
    if (isCoordKey(k) || k.length > 40) continue;
    if (v === null || typeof v === "boolean" || (typeof v === "number" && Number.isFinite(v)) || (typeof v === "string" && v.length <= 100)) {
      if (++n > 32) break;
      out[k] = v;
    }
  }
  return out;
}

/** 앱→서버 텍스트 프레임 하나를 검증한다. ctx는 좌표 키를 버린 값으로 돌려준다. */
export function parseClientFrame(raw: unknown): Parsed<ClientFrame> {
  let m: unknown = raw;
  if (typeof raw === "string") {
    try {
      m = JSON.parse(raw);
    } catch {
      return bad("bad_json");
    }
  }
  if (!isObj(m) || typeof m.type !== "string") return bad();
  switch (m.type) {
    case "hello":
      if (typeof m.v !== "number" || !Number.isInteger(m.v) || typeof m.appVersion !== "string" || m.appVersion.length > 40) return bad();
      return { ok: true, value: { type: "hello", v: m.v, appVersion: m.appVersion } };
    case "turn.start":
      if (!isId(m.turnId) || (m.trigger !== "ptt" && m.trigger !== "listen_after_proactive")) return bad();
      return { ok: true, value: { type: "turn.start", turnId: m.turnId, trigger: m.trigger } };
    case "text":
      if (!isId(m.turnId) || typeof m.text !== "string" || !m.text.trim()) return bad();
      if (m.text.length > MAX_TEXT_CHARS) return bad("text_too_long");
      return { ok: true, value: { type: "text", turnId: m.turnId, text: m.text } };
    case "ctx": {
      if (m.turnId !== undefined && !isId(m.turnId)) return bad();
      const ctx = sanitizeCtx(m.ctx);
      if (!ctx) return bad();
      return { ok: true, value: m.turnId === undefined ? { type: "ctx", ctx } : { type: "ctx", turnId: m.turnId, ctx } };
    }
    case "turn.end":
    case "turn.cancel":
      if (!isId(m.turnId)) return bad();
      return { ok: true, value: { type: m.type, turnId: m.turnId } };
    default:
      return bad();
  }
}

/** 서버→앱 텍스트 프레임 검증(클라이언트·시험용). */
export function parseServerFrame(raw: unknown): Parsed<ServerFrame> {
  let m: unknown = raw;
  if (typeof raw === "string") {
    try {
      m = JSON.parse(raw);
    } catch {
      return bad("bad_json");
    }
  }
  if (!isObj(m) || typeof m.type !== "string") return bad();
  const audioOk = (a: unknown) =>
    a === "none" || (isObj(a) && a.format === "pcm_s16le" && typeof a.sampleRate === "number" && a.sampleRate > 0 && a.channels === 1);
  switch (m.type) {
    case "reply.start":
      if (!isId(m.turnId) || !audioOk(m.audio)) return bad();
      return { ok: true, value: m as unknown as ReplyStart };
    case "reply.delta":
      if (!isId(m.turnId) || typeof m.text !== "string") return bad();
      return { ok: true, value: m as unknown as ReplyDelta };
    case "reply.end":
      if (!isId(m.turnId) || typeof m.text !== "string" || typeof m.totalMs !== "number") return bad();
      return { ok: true, value: m as unknown as ReplyEnd };
    case "proactive":
      if (typeof m.id !== "string" || typeof m.reason !== "string") return bad();
      return { ok: true, value: m as unknown as Proactive };
    case "error":
      if (typeof m.code !== "string" || !(ERROR_CODES as readonly string[]).includes(m.code)) return bad();
      return { ok: true, value: m as unknown as ErrorFrame };
    default:
      return bad();
  }
}
