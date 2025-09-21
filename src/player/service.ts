import TrackPlayer, {
  Event,
  Capability,
  AppKilledPlaybackBehavior,
  RepeatMode,
  State,
} from 'react-native-track-player';

// Serviço em segundo plano (não retornar função)
export async function playbackService(): Promise<void> {
  // Controles remotos
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.stop());

  // Interrupções (ligue autoHandleInterruptions no setup; ainda assim mantemos listener)
  TrackPlayer.addEventListener(Event.RemoteDuck, async (e) => {
    if (e.paused) {
      await TrackPlayer.pause();
    } else {
      // retomar conforme seu UX (aqui deixamos o auto-handle cuidar)
    }
  });

  // Diagnóstico básico
  TrackPlayer.addEventListener(Event.PlaybackError, (e) => {
    console.warn('[TrackPlayer] error', e.code, e.message);
  });
}

// Setup idempotente do player
let _once: Promise<void> | null = null;

export async function setupPlayer(): Promise<void> {
  if (_once) return _once;
  _once = (async () => {
    await TrackPlayer.setupPlayer({
      // waitForBuffer: true,
      autoHandleInterruptions: true, // recomendado p/ v5
    });

    await TrackPlayer.updateOptions({
      android: {
        appKilledPlaybackBehavior:
          AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
      },
      capabilities: [Capability.Play, Capability.Pause, Capability.Stop],
      // compactCapabilities: [Capability.Play, Capability.Pause],
      progressUpdateEventInterval: 2, // habilita PlaybackProgressUpdated
    });

    await TrackPlayer.setRepeatMode(RepeatMode.Off);
  })();
  return _once;
}
