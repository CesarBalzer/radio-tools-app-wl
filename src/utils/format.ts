export function mmss(sec: number) {
	const s = Math.max(0, Math.floor(sec));
	const m = Math.floor(s / 60);
	const r = s % 60;
	return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

export function readableOn(hex: string) {
  const h = hex?.replace('#', '');
  if (!/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(h)) return '#000';
  const to255 = (p: string) => (p.length === 1 ? parseInt(p + p, 16) : parseInt(p, 16));
  const r = to255(h.length === 3 ? h[0] : h.slice(0, 2));
  const g = to255(h.length === 3 ? h[1] : h.slice(2, 4));
  const b = to255(h.length === 3 ? h[2] : h.slice(4, 6));
  const sr = r / 255, sg = g / 255, sb = b / 255;
  const lin = (s: number) => (s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4));
  const L = 0.2126 * lin(sr) + 0.7152 * lin(sg) + 0.0722 * lin(sb);
  return L > 0.5 ? '#000000' : '#FFFFFF';
}

export const rgbaFromFg = (fg: '#000000' | '#FFFFFF', a: number) =>
  fg === '#FFFFFF' ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`;