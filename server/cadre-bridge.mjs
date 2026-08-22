#!/usr/bin/env node

/**
 * Stable stdio-to-HTTP bridge for Claude Desktop and Cowork.
 *
 * Cadre rotates its localhost port and bearer token on every launch. The
 * bridge reads the current private connection file for each request, so the
 * installed Claude plugin keeps working without embedding or refreshing a
 * credential. Cadre's long-running work is polled through explicit tools
 * rather than server-pushed notifications.
 */

import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

let sessionId = null;

// Agent tools that do real local work can take a while, but a dead or hostile
// loopback listener must not strand the stdio client forever. Tests can opt
// into a much shorter deadline without making the production timeout
// user-configurable (and therefore easy to weaken accidentally).
const REQUEST_TIMEOUT_MS = 15 * 60 * 1000;

function requestTimeoutMs() {
  if (process.env.NODE_ENV !== 'test') return REQUEST_TIMEOUT_MS;
  const override = Number(process.env.CADRE_BRIDGE_TEST_REQUEST_TIMEOUT_MS);
  return Number.isFinite(override) && override >= 10 && override <= REQUEST_TIMEOUT_MS
    ? Math.floor(override)
    : REQUEST_TIMEOUT_MS;
}

function connectionPath() {
  return (
    process.env.CADRE_AGENT_API_FILE ||
    path.join(os.homedir(), 'Library', 'Application Support', 'Cadre', 'agent-api.json')
  );
}

// ---------------------------------------------------------------------------
// Liveness (F-002)
//
// `agent-api.json` is only ever deleted on a graceful shutdown, so after a
// crash it survives pointing at a dead process. Trusting it blindly turns
// into an opaque network error ("fetch failed") instead of a clear "Cadre is
// not running". `ps -o lstart=` gives both signals in one call: no matching
// pid means the process is dead, and a start time that does not match the
// `startedAtMs` Cadre stamped on write means the pid was recycled to an
// unrelated process (pid reuse is real — a bare `kill(pid, 0)` cannot tell
// the difference on its own).
//
// This mirrors evaluateConnectionLiveness() in
// src/main/services/agent-api/connection-liveness.ts — kept as a small
// inline copy because this script ships standalone and cannot import
// compiled TypeScript. Keep the two in sync when this logic changes.
// ---------------------------------------------------------------------------

const START_TIME_TOLERANCE_MS = 5000;

async function probeProcess(pid) {
  try {
    const { stdout } = await execFileAsync('/bin/ps', ['-o', 'lstart=', '-p', String(pid)], {
      timeout: 2000,
    });
    const trimmed = stdout.trim();
    if (!trimmed) return { pidExists: false, actualStartedAtMs: null };
    const parsedMs = Date.parse(trimmed);
    return { pidExists: true, actualStartedAtMs: Number.isNaN(parsedMs) ? null : parsedMs };
  } catch (error) {
    if (error && typeof error.code === 'number') {
      // `ps` ran and exited non-zero: on macOS that means "no matching pid" —
      // a reliable dead-process signal, not a probe failure.
      return { pidExists: false, actualStartedAtMs: null };
    }
    // Spawn-level failure (no `ps` on PATH, sandboxed, timed out): liveness
    // could not be determined at all. Fail open rather than block a real,
    // live connection on an environment quirk.
    return { pidExists: true, actualStartedAtMs: null };
  }
}

function evaluateConnectionLiveness(info, probe) {
  if (!info || typeof info !== 'object') return { alive: false, reason: 'malformed' };
  if (typeof info.pid !== 'number' || !Number.isInteger(info.pid) || info.pid <= 0) {
    return { alive: false, reason: 'missing-pid' };
  }
  if (!probe.pidExists) return { alive: false, reason: 'dead-process' };
  if (
    typeof info.startedAtMs === 'number' &&
    Number.isFinite(info.startedAtMs) &&
    probe.actualStartedAtMs !== null &&
    Math.abs(info.startedAtMs - probe.actualStartedAtMs) > START_TIME_TOLERANCE_MS
  ) {
    return { alive: false, reason: 'pid-reused' };
  }
  return { alive: true };
}

function describeLivenessFailure(reason) {
  switch (reason) {
    case 'malformed':
      return 'the connection file could not be parsed';
    case 'missing-pid':
      return 'the connection file has no recorded process id';
    case 'dead-process':
      return 'the recorded process has exited';
    case 'pid-reused':
      return 'the recorded process id now belongs to a different, unrelated process';
    default:
      return 'the connection file is stale';
  }
}

async function readConnection() {
  let raw;
  try {
    raw = await fs.readFile(connectionPath(), 'utf8');
  } catch {
    // Node's filesystem errors include the absolute path (and therefore the
    // local account name). The error is forwarded to Claude, so never expose
    // the raw exception here.
    throw new Error(
      'Cadre’s local editing connection is unavailable. Open or restart Cadre and try again.',
    );
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Cadre’s local editing connection is invalid. Restart Cadre and try again.');
  }
  if (
    !Number.isInteger(parsed.port) ||
    parsed.port < 1 ||
    parsed.port > 65535 ||
    typeof parsed.token !== 'string' ||
    parsed.token.length < 16
  ) {
    throw new Error('Cadre’s local editing connection is invalid. Restart Cadre and try again.');
  }

  const probe =
    typeof parsed.pid === 'number' && Number.isInteger(parsed.pid) && parsed.pid > 0
      ? await probeProcess(parsed.pid)
      : { pidExists: false, actualStartedAtMs: null };
  const liveness = evaluateConnectionLiveness(parsed, probe);
  if (!liveness.alive) {
    throw new Error(
      `Cadre is not running (${describeLivenessFailure(liveness.reason)}). Restart Cadre and try again.`,
    );
  }

  return { port: parsed.port, token: parsed.token };
}

function writeMessage(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

function parseSse(body) {
  const messages = [];
  for (const block of body.split(/\r?\n\r?\n/)) {
    const data = block
      .split(/\r?\n/)
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trim())
      .join('\n');
    if (!data || data === '[DONE]') continue;
    messages.push(JSON.parse(data));
  }
  return messages;
}

async function forward(message) {
  const { port, token } = await readConnection();
  const headers = {
    Accept: 'application/json, text/event-stream',
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  if (sessionId) headers['mcp-session-id'] = sessionId;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs());
  try {
    const response = await fetch(`http://127.0.0.1:${port}/mcp`, {
      method: 'POST',
      headers,
      body: JSON.stringify(message),
      signal: controller.signal,
    });
    const nextSessionId = response.headers.get('mcp-session-id');
    if (nextSessionId) sessionId = nextSessionId;

    if (!response.ok) {
      throw new Error(`Cadre’s local editing service returned HTTP ${response.status}.`);
    }
    if (response.status === 202 || message.id === undefined) return;

    const body = await response.text();
    const contentType = response.headers.get('content-type') || '';
    const replies = contentType.includes('text/event-stream')
      ? parseSse(body)
      : body.trim()
        ? [JSON.parse(body)]
        : [];
    for (const reply of replies) writeMessage(reply);
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(
        'Cadre’s local editing service did not respond in time. Restart Cadre and try again.',
      );
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function writeError(message, error) {
  if (message?.id === undefined) return;
  const detail = error instanceof Error ? error.message : 'Unknown bridge error.';
  writeMessage({
    jsonrpc: '2.0',
    id: message.id,
    error: {
      code: -32000,
      message: detail,
    },
  });
}

const lines = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
for await (const line of lines) {
  if (!line.trim()) continue;
  let message;
  try {
    message = JSON.parse(line);
    await forward(message);
  } catch (error) {
    writeError(message, error);
  }
}
