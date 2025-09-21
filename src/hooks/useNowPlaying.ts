// src/screens/player/hooks/useNowPlaying.ts
import {useEffect, useMemo, useRef, useState} from 'react';
import {Event, useTrackPlayerEvents, useProgress} from 'react-native-track-player';
import axios from 'axios';

type Args = { playing: boolean; metadataUrl?: string };

function splitArtistTitle(raw?: string) {
  if (!raw) return {artist: undefined, title: undefined};
  if (raw.includes(' - ')) {
    const [a, ...rest] = raw.split(' - ');
    return {artist: a.trim(), title: rest.join(' - ').trim()};
  }
  return {artist: undefined, title: raw.trim()};
}

export function useNowPlaying({playing, metadataUrl}: Args) {
  const [artist, setArtist] = useState<string | undefined>();
  const [title, setTitle] = useState<string | undefined>();
  const [startedAt, setStartedAt] = useState<number | undefined>(undefined);

  // para “congelar” o tempo no pause
  const pausedAtRef = useRef<number | undefined>(undefined);

  // tick para re-render a cada 1s quando estiver tocando
  const [, setTick] = useState(0);

  // fallback (se precisar) — não usamos para live, só pra ter referência
  const progress = useProgress();

  // eventos ID3/ICY
  useTrackPlayerEvents([Event.MetadataCommonReceived], (e: any) => {
    const t = (e?.title || e?.streamTitle || '').toString();
    const a = (e?.artist || '').toString();
    let nextArtist = a;
    let nextTitle = t;

    if (!nextArtist && t.includes(' - ')) {
      const st = splitArtistTitle(t);
      nextArtist = st.artist || '';
      nextTitle = st.title || '';
    }
    // nova faixa -> reinicia cronômetro
    setArtist(nextArtist || undefined);
    setTitle(nextTitle || undefined);
    setStartedAt(Date.now() / 1000);
    pausedAtRef.current = undefined;
  });

  // polling em metadataUrl (só quando tocando)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (!metadataUrl || !playing) return;

    const fetchMeta = async () => {
      try {
        const {data} = await axios.get(metadataUrl, {timeout: 5000});
        // Icecast
        const src = data?.icestats?.source;
        const pick = Array.isArray(src) ? src[0] : src;
        let a: string | undefined; let t: string | undefined;
        if (pick?.title) ({artist: a, title: t} = splitArtistTitle(String(pick.title)));

        // Shoutcast
        if (!t) {
          const val = data?.streamcurrentSong || data?.songtitle;
          if (val) ({artist: a, title: t} = splitArtistTitle(String(val)));
        }

        if (a || t) {
          setArtist(a);
          setTitle(t);
          // se mudou a faixa, reinicia cronômetro
          setStartedAt(Date.now() / 1000);
          pausedAtRef.current = undefined;
        }
      } catch { /* silencioso */ }
    };

    fetchMeta();
    pollRef.current = setInterval(fetchMeta, 12000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [metadataUrl, playing]);

  // pausa/retoma: congela tempo no pause e compensa no resume
  useEffect(() => {
    const now = Date.now() / 1000;
    if (!startedAt) return;

    if (!playing && pausedAtRef.current == null) {
      // acabou de pausar
      pausedAtRef.current = now;
    } else if (playing && pausedAtRef.current != null) {
      // retomou: ajusta startedAt para “pular” o tempo parado
      const delta = now - pausedAtRef.current;
      setStartedAt((prev) => (prev ? prev + delta : prev));
      pausedAtRef.current = undefined;
    }
  }, [playing, startedAt]);

  // tick de 1s apenas quando tocando
  useEffect(() => {
    if (!playing || !startedAt) return;
    const id = setInterval(() => setTick((t) => (t + 1) % 1e9), 1000);
    return () => clearInterval(id);
  }, [playing, startedAt]);

  const elapsedSec = useMemo(() => {
    if (!startedAt) return Math.floor(progress.position || 0);
    const now = Date.now() / 1000;
    if (pausedAtRef.current != null) {
      return Math.max(0, Math.floor(pausedAtRef.current - startedAt)); // congelado
    }
    return Math.max(0, Math.floor(now - startedAt)); // contando
  }, [startedAt, progress.position /* mantém estável quando não iniciou */, playing]);

  return {artist, title, elapsedSec};
}
