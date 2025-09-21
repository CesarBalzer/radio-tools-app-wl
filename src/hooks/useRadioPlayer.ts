import {useCallback, useEffect, useMemo, useState} from 'react';
import TrackPlayer, {
  State,
  usePlaybackState,
  useTrackPlayerEvents,
  Event,
} from 'react-native-track-player';
import {Share} from 'react-native';
import {setupPlayer} from '../player/service';

// ───────────────── helpers v5 ─────────────────
type MaybePlaybackState = State | { state?: State } | undefined | null;

function getStateValue(s: MaybePlaybackState): State | undefined {
  // Se for string enum (State), retorna direto; se for objeto, pega .state
  return (typeof s === 'string' ? s : s?.state) as State | undefined;
}

// remove valores falsy do array de eventos
function ev(...items: Array<Event | null | undefined | false>): Event[] {
  return items.filter((x): x is Event => x != null && x !== false);
}

type Args = { urls: string[]; label: string };

async function waitForPlaying(ms: number) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    const s = await TrackPlayer.getPlaybackState(); // v5
    if (getStateValue(s) === State.Playing) return true;
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
}

async function tryPlay(url: string, label: string) {
  await TrackPlayer.reset();
  await TrackPlayer.add({ id: 'radio', url, title: label });
  await TrackPlayer.play();
  const ok = await waitForPlaying(7000);
  if (!ok) throw new Error('timeout starting stream');
}

export function useRadioPlayer({ urls, label }: Args) {
  const rawPlaybackState = usePlaybackState(); // pode ser State OU {state?: State}
  const [loading, setLoading] = useState(true);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [volume, _setVolume] = useState(1);

  const setVolume = useCallback((v: number) => {
    const nv = Math.max(0, Math.min(1, v));
    _setVolume(nv);
    TrackPlayer.setVolume(nv).catch(() => {});
  }, []);

  const state = getStateValue(rawPlaybackState);
  const playing = state === State.Playing;
  const isBuffering = state === State.Buffering;

  // eventos válidos da v5 (sem valores vazios)
  useTrackPlayerEvents(
    ev(
      Event.PlaybackState,
      Event.PlaybackProgressUpdated,
      Event.PlaybackActiveTrackChanged,
      Event.PlaybackError,
      Event.RemotePlay,
      Event.RemotePause,
      Event.RemoteStop,
      Event.RemoteDuck,
      Event.RemotePlayPause,
      // metadados (apenas se seu stream expõe ICY/ID3)
      Event.MetadataCommonReceived,
      Event.MetadataTimedReceived,
      Event.MetadataChapterReceived,
    ),
    (e) => {
      if (e.type === Event.PlaybackError) {
        setError(e.message ?? 'Erro de reprodução.');
      }
    }
  );

  useEffect(() => {
    (async () => {
      try {
        await setupPlayer();
        await TrackPlayer.pause().catch(() => {});
        await TrackPlayer.stop().catch(() => {});
        await TrackPlayer.setVolume(volume);
        setError(null);
      } catch (e: any) {
        setError(String(e?.message || e) || 'Falha ao inicializar o player.');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startWithFallbacks = useCallback(async () => {
    const candidates = urls.filter(Boolean);
    if (!candidates.length) {
      throw new Error('Nenhum endpoint de stream configurado.');
    }
    let lastErr: unknown = null;
    for (const u of candidates) {
      try {
        await tryPlay(u, label);
        setCurrentUrl(u);
        setError(null);
        return;
      } catch (err) {
        lastErr = err;
      }
    }
    throw lastErr ?? new Error('Todos os endpoints falharam.');
  }, [urls, label]);

  const togglePlay = useCallback(async () => {
    const s = await TrackPlayer.getPlaybackState(); // v5
    const curr = getStateValue(s);
    if (curr === State.Playing) {
      await TrackPlayer.pause();
      return;
    }

    const queue = await TrackPlayer.getQueue().catch(() => []);
    if (queue && queue.length > 0 && currentUrl) {
      await TrackPlayer.play();
      return;
    }

    setLoading(true);
    try {
      await startWithFallbacks();
    } catch (e: any) {
      setError('Não foi possível iniciar o stream (todos os endpoints falharam).');
    } finally {
      setLoading(false);
    }
  }, [currentUrl, startWithFallbacks]);

  const stop = useCallback(async () => {
    await TrackPlayer.stop().catch(() => {});
    await TrackPlayer.reset().catch(() => {});
    setCurrentUrl(null);
  }, []);

  const share = useCallback(async (name?: string, url?: string | null) => {
    try {
      await Share.share({ message: `${name ?? 'Minha Rádio'} — ouça agora: ${url ?? ''}` });
    } catch {}
  }, []);

  return useMemo(
    () => ({
      loading,
      error,
      currentUrl,
      volume,
      setVolume,
      playing,
      isBuffering,
      togglePlay,
      stop,
      share,
    }),
    [loading, error, currentUrl, volume, setVolume, playing, isBuffering, togglePlay, stop, share]
  );
}
