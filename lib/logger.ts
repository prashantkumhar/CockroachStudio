type LogMeta = Record<string, string | number | boolean | undefined>;

/** Structured logs for Vercel / server runtime — search by `scope` in dashboard logs. */
export function logInfo(scope: string, message: string, meta?: LogMeta) {
  console.log(JSON.stringify({ level: "info", scope, message, ...meta, ts: new Date().toISOString() }));
}

export function logError(scope: string, err: unknown, meta?: LogMeta) {
  const payload: Record<string, unknown> = {
    level: "error",
    scope,
    ...meta,
    ts: new Date().toISOString(),
  };

  if (err instanceof Error) {
    payload.message = err.message;
    payload.name = err.name;
    if (process.env.NODE_ENV !== "production") {
      payload.stack = err.stack;
    }
  } else {
    payload.message = String(err);
  }

  console.error(JSON.stringify(payload));
}

export function requireServerEnv(name: string): string {
  const value = process.env[name];
  if (!value || value === "missing") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
