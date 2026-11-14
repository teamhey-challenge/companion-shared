import { expect, test } from "bun:test";
import { PAIR_CODE_ALPHABET, PAIR_CODE_RE, isCoordKey, parseClientFrame, parseServerFrame, sanitizeCtx } from "../src/index";

test("v0.4.0 settings frame and pair-code alphabet", () => {
  const s = { proactive: "normal", memoryEnabled: true, speech: "banmal", nickname: null };
  expect(parseServerFrame({ type: "settings", settings: s }).ok).toBe(true);
  expect(parseServerFrame({ type: "settings", settings: { ...s, proactive: "x" } }).ok).toBe(false);
  expect(/[01OIL]/.test(PAIR_CODE_ALPHABET)).toBe(false);
  expect(PAIR_CODE_RE.test("ABCDEFGH")).toBe(true);
});

test("client frames validate", () => {
  expect(parseClientFrame('{"type":"hello","v":1,"appVersion":"1.0"}').ok).toBe(true);
  expect(parseClientFrame({ type: "turn.start", turnId: "t1", trigger: "ptt" }).ok).toBe(true);
  expect(parseClientFrame({ type: "turn.start", turnId: "t1", trigger: "x" })).toEqual({ ok: false, code: "bad_frame" });
  expect(parseClientFrame({ type: "text", turnId: "t1", text: "a".repeat(501) })).toEqual({ ok: false, code: "text_too_long" });
  expect(parseClientFrame("{")).toEqual({ ok: false, code: "bad_json" });
  expect(parseClientFrame({ type: "nope" }).ok).toBe(false);
  expect(parseClientFrame({ type: "turn.cancel", turnId: "" }).ok).toBe(false);
});

test("ctx drops coordinate keys and keeps the rest", () => {
  const r = parseClientFrame({ type: "ctx", ctx: { gear: "P", lat: 37.5, longitude: 127, GPS: "x", location: { a: 1 }, rangeKm: 120, nested: { a: 1 } } });
  expect(r).toEqual({ ok: true, value: { type: "ctx", ctx: { gear: "P", rangeKm: 120 } } });
  expect(sanitizeCtx([])).toBeNull();
  for (const k of ["lat", "lon", "Latitude", "gps_pos", "location", "coords", "geo"]) expect(isCoordKey(k)).toBe(true);
  for (const k of ["gear", "speedBand", "doors", "wipers", "rangeKm", "fuelType", "headlamps"]) expect(isCoordKey(k)).toBe(false);
});

test("server frames validate", () => {
  expect(parseServerFrame({ type: "reply.start", turnId: "t", audio: "none" }).ok).toBe(true);
  expect(parseServerFrame({ type: "reply.start", turnId: "t", audio: { format: "pcm_s16le", sampleRate: 24000, channels: 1 } }).ok).toBe(true);
  expect(parseServerFrame({ type: "reply.start", turnId: "t", audio: "mp3" }).ok).toBe(false);
  expect(parseServerFrame({ type: "error", code: "rate_limited" }).ok).toBe(true);
  expect(parseServerFrame({ type: "error", code: "weird" }).ok).toBe(false);
});
