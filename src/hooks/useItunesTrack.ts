// src/screens/player/hooks/useItunesTrack.ts
import {useEffect, useMemo, useRef, useState} from 'react';
import axios from 'axios';

export type ItunesTrack = {
  artistName: string;
  trackName: string;
  collectionName?: string;
  artworkUrl100?: string;
  previewUrl?: string;
  trackViewUrl?: string;
  collectionViewUrl?: string;
  primaryGenreName?: string;
  releaseDate?: string;
  trackTimeMillis?: number;
  currency?: string;
  trackPrice?: number;
  country?: string;
};

const mem = new Map<string, ItunesTrack | null>();
const DEBOUNCE_MS = 300;

function toKey(artist?: string, title?: string, country = 'br') {
  return `${(artist||'').toLowerCase()}|${(title||'').toLowerCase()}|${country}`;
}

function normalizeCover(url?: string, size = 600) {
  if (!url) return undefined;
  return url.replace(/\/\d+x\d+bb\./, `/${size}x${size}bb.`);
}

export function useItunesTrack(artist?: string, title?: string, country = 'br') {
  const [track, setTrack] = useState<ItunesTrack | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setErr] = useState<string | null>(null);
  const tRef = useRef<NodeJS.Timeout | null>(null);

  const q = useMemo(() => {
    const term = [artist, title].filter(Boolean).join(' ').trim();
    return term.length ? term : '';
  }, [artist, title]);

  useEffect(() => {
    if (tRef.current) clearTimeout(tRef.current);
    if (!q) { setTrack(null); setErr(null); return; }

    const key = toKey(artist, title, country);
    const cached = mem.get(key);
    if (cached !== undefined) { setTrack(cached); setErr(null); return; }

    tRef.current = setTimeout(async () => {
      setLoading(true);
      setErr(null);
      try {
        const url = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=song&limit=5&country=${country}`;
        const {data} = await axios.get(url, {timeout: 6000});
        const list: any[] = Array.isArray(data?.results) ? data.results : [];
        // heurística: prioriza match por artista e início do título
        const norm = (s: string) => s?.toLowerCase().normalize('NFKD').replace(/\p{Diacritic}/gu,'').trim();
        const na = norm(artist||'');
        const nt = norm(title||'');

        let best: any | null = null;
        for (const it of list) {
          const a = norm(it.artistName||'');
          const t = norm(it.trackName||'');
          if (na && !a.includes(na)) continue;
          if (nt && !(t.startsWith(nt) || t.includes(nt))) continue;
          best = it; break;
        }
        if (!best) best = list[0] || null;

        const out: ItunesTrack | null = best ? {
          artistName: best.artistName,
          trackName: best.trackName,
          collectionName: best.collectionName,
          artworkUrl100: normalizeCover(best.artworkUrl100, 600),
          previewUrl: best.previewUrl,
          trackViewUrl: best.trackViewUrl,
          collectionViewUrl: best.collectionViewUrl,
          primaryGenreName: best.primaryGenreName,
          releaseDate: best.releaseDate,
          trackTimeMillis: best.trackTimeMillis,
          currency: best.currency,
          trackPrice: best.trackPrice,
          country,
        } : null;

        mem.set(key, out);
        setTrack(out);
      } catch (e: any) {
        setErr(e?.message || 'itunes search error');
        mem.set(key, null);
        setTrack(null);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => { if (tRef.current) clearTimeout(tRef.current); };
  }, [q, artist, title, country]);

  const coverUrl = useMemo(() => normalizeCover(track?.artworkUrl100, 600) || null, [track]);

  return { track, coverUrl, loading, error };
}
