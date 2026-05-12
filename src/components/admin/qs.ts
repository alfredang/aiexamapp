export function buildQS(params: Record<string, string | number | undefined | null>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '' || v === 0) continue;
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export function pageWindow(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | 'ellipsis')[] = [];
  const around = new Set([1, total, current - 1, current, current + 1]);
  for (let i = 1; i <= total; i++) {
    if (around.has(i)) out.push(i);
    else if (out[out.length - 1] !== 'ellipsis') out.push('ellipsis');
  }
  return out;
}
