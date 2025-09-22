// src/screens/player/hooks/useNowPlaying.ts
import {useEffect, useMemo, useRef, useState} from 'react';
import {Event, useTrackPlayerEvents, useProgress} from 'react-native-track-player';
import axios from 'axios';

type Args = { playing: boolean; metadataUrl?: string; streamUrl?: string };

function splitArtistTitle(raw?: string) {
  if (!raw) return {artist: undefined, title: undefined};
  const txt = String(raw).trim();
  const sep = txt.includes(' - ') ? ' - ' : (txt.includes(' — ') ? ' — ' : null);
  if (sep) {
    const [a, ...rest] = txt.split(sep);
    return {artist: a.trim() || undefined, title: rest.join(sep).trim() || undefined};
  }
  return {artist: undefined, title: txt || undefined};
}

function deriveBase(from?: string) {
  try {
    if (!from) return undefined;
    const u = new URL(from);
    return `${u.protocol}//${u.hostname}${u.port ? `:${u.port}` : ''}`;
  } catch {
    return undefined;
  }
}

function pickBestSource(srcList: any[], streamUrl?: string) {
  if (!Array.isArray(srcList)) return srcList;
  if (!srcList.length) return undefined;
  if (!streamUrl) return srcList[0];
  let best = srcList[0];
  try {
    const su = new URL(streamUrl);
    const mount = su.pathname || '/';
    const byMount = srcList.find(
      s =>
        String(s?.listenurl || '').includes(mount) ||
        String(s?.mount || '') === mount,
    );
    if (byMount) return byMount;
    const byHost = srcList.find(s =>
      String(s?.listenurl || '').includes(su.hostname),
    );
    if (byHost) return byHost;
    const wantAac = /aac/i.test(streamUrl) || /\.aac/i.test(streamUrl);
    const byCodec = srcList.find(s => {
      const ct = String(s?.['content-type'] || s?.content_type || '');
      return wantAac ? /aac/i.test(ct) : /mp3/i.test(ct);
    });
    if (byCodec) return byCodec;
    return best;
  } catch {
    return best;
  }
}

function parseFromJson(data: any, streamUrl?: string) {
  try {
    const src = data?.icestats?.source;
    const list = Array.isArray(src) ? src : src ? [src] : [];
    if (list.length) {
      const pick = pickBestSource(list, streamUrl);
      if (pick?.title) return splitArtistTitle(String(pick.title));
    }
    if (data?.songtitle) return splitArtistTitle(String(data.songtitle));
    if (data?.streamcurrentSong)
      return splitArtistTitle(String(data.streamcurrentSong));
  } catch {}
  return {artist: undefined, title: undefined};
}

function parseFromText(txt: string) {
  const m =
    txt.match(/StreamTitle='([^']+)'/i) ||
    txt.match(/StreamTitle="([^"]+)"/i);
  if (m?.[1]) return splitArtistTitle(m[1]);
  return {artist: undefined, title: undefined};
}

export function useNowPlaying({playing, metadataUrl, streamUrl}: Args) {
  const [artist, setArtist] = useState<string | undefined>();
  const [title, setTitle] = useState<string | undefined>();
  const [startedAt, setStartedAt] = useState<number | undefined>();
  const pausedAtRef = useRef<number | undefined>(undefined);
  const [, setTick] = useState(0);
  const progress = useProgress();

  useTrackPlayerEvents([Event.MetadataCommonReceived], (e: any) => {
    const a = e?.artist?.toString?.() || undefined;
    const t =
      e?.title?.toString?.() || e?.streamTitle?.toString?.() || undefined;
    if (a || t) {
      setArtist(a);
      setTitle(t);
      setStartedAt(Date.now() / 1000);
      pausedAtRef.current = undefined;
    }
  });

  useEffect(() => {
    let id: NodeJS.Timeout | null = null;
    const base = deriveBase(streamUrl);
    const candidates: string[] = [];
    if (metadataUrl) candidates.push(metadataUrl);
    if (base) {
      candidates.push(`${base}/status-json.xsl`);
      candidates.push(`${base}/status.xsl`);
    }
    if (!candidates.length || !playing) return;

    const fetchMeta = async () => {
      for (const url of candidates) {
        try {
          const r = await axios.get(url, {
            timeout: 7000,
            transformResponse: d => d,
            headers: {Accept: 'application/json, text/plain, */*'},
          });
          const raw = r.data;
          let a: string | undefined;
          let t: string | undefined;
          try {
            const json = typeof raw === 'string' ? JSON.parse(raw) : raw;
            const out = parseFromJson(json, streamUrl);
            a = out.artist;
            t = out.title;
          } catch {
            const txt = String(raw ?? '');
            const out = parseFromText(txt);
            a = out.artist;
            t = out.title;
          }
          if (a || t) {
            setArtist(a);
            setTitle(t);
            setStartedAt(Date.now() / 1000);
            pausedAtRef.current = undefined;
            return;
          }
        } catch {}
      }
    };

    fetchMeta();
    id = setInterval(fetchMeta, 5000);
    return () => id && clearInterval(id);
  }, [metadataUrl, streamUrl, playing]);

  useEffect(() => {
    const now = Date.now() / 1000;
    if (!startedAt) return;
    if (!playing && pausedAtRef.current == null) pausedAtRef.current = now;
    else if (playing && pausedAtRef.current != null) {
      const delta = now - pausedAtRef.current;
      setStartedAt(prev => (prev ? prev + delta : prev));
      pausedAtRef.current = undefined;
    }
  }, [playing, startedAt]);

  useEffect(() => {
    if (!playing || !startedAt) return;
    const id = setInterval(() => setTick(t => (t + 1) % 1e9), 1000);
    return () => clearInterval(id);
  }, [playing, startedAt]);

  const elapsedSec = useMemo(() => {
    if (!startedAt) return Math.floor(progress.position || 0);
    const now = Date.now() / 1000;
    if (pausedAtRef.current != null)
      return Math.max(0, Math.floor(pausedAtRef.current - startedAt));
    return Math.max(0, Math.floor(now - startedAt));
  }, [startedAt, progress.position, playing]);

  return {artist, title, elapsedSec};
}
