type LogValue = unknown;

const SECRET_PATTERNS = [
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
  /\+?\d[\d\s().-]{7,}\d/g,
  /(bearer|token|apikey|api_key|secret|password)=?[^\s&]+/gi,
];

function redact(value: LogValue): LogValue {
  if (typeof value === 'string') {
    return SECRET_PATTERNS.reduce((text, pattern) => text.replace(pattern, '[redacted]'), value).slice(0, 500);
  }
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.slice(0, 20).map(redact);
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => [
      key,
      /ocr|raw|text|content|token|secret|password|email|phone/i.test(key) ? '[redacted]' : redact(item),
    ]),
  );
}

export const safeLogger = {
  debug(message: string, metadata?: LogValue) {
    if (process.env.NODE_ENV === 'production') return;
    console.debug(message, metadata === undefined ? undefined : redact(metadata));
  },
  warn(message: string, metadata?: LogValue) {
    console.warn(message, metadata === undefined ? undefined : redact(metadata));
  },
  error(message: string, metadata?: LogValue) {
    console.error(message, metadata === undefined ? undefined : redact(metadata));
  },
};
