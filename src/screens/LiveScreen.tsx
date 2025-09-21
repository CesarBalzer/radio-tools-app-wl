// src/screens/LiveScreen.tsx
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {View, Text, StyleSheet, useWindowDimensions, Pressable} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Video, ResizeMode, VideoFullscreenUpdate} from 'expo-av';
import * as ScreenOrientation from 'expo-screen-orientation';
import {useRemoteConfig} from '../config/RemoteConfigProvider';
import {useTheme, type Theme} from '../theme/ThemeProvider';

function withAlpha(hex: string, a: number) {
  const h = hex.replace('#', '');
  const to255 = (s: string) => parseInt(s.length === 1 ? s + s : s, 16);
  const r = to255(h.length === 3 ? h[0] : h.slice(0, 2));
  const g = to255(h.length === 3 ? h[1] : h.slice(2, 4));
  const b = to255(h.length === 3 ? h[2] : h.slice(4, 6));
  return `rgba(${r},${g},${b},${a})`;
}

export default function LiveScreen() {
  const {streams} = useRemoteConfig();
  const theme = useTheme();
  const v = streams.video;
  const {width, height} = useWindowDimensions();
  const isLandscape = width > height;

  const urls = useMemo(() => (v?.primaryUrl ? [v.primaryUrl, ...(v.fallbackUrls ?? [])].filter(Boolean) : []), [v]);
  const [idx, setIdx] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const videoRef = useRef<Video>(null);
  const s = styles(theme);

  useEffect(() => {
    setIdx(0);
    setMsg(null);
  }, [JSON.stringify(urls)]);

  const onError = () => {
    const next = idx + 1;
    if (next < urls.length) {
      setIdx(next);
      setMsg(`Tentando fonte ${next + 1}/${urls.length}`);
    } else {
      setMsg('Não foi possível reproduzir o vídeo.');
    }
  };

  const incVol = (delta: number) => {
    const nv = Math.max(0, Math.min(1, Math.round((volume + delta) * 100) / 100));
    setVolume(nv);
    if (nv > 0 && muted) setMuted(false);
    videoRef.current?.setVolumeAsync(nv);
    if (nv > 0) videoRef.current?.setIsMutedAsync(false);
  };

  const toggleMute = () => {
    const m = !muted;
    setMuted(m);
    videoRef.current?.setIsMutedAsync(m);
  };

  const goFullscreen = () => {
    videoRef.current?.presentFullscreenPlayer();
  };

  const onFsUpdate = async ({fullscreenUpdate}: {fullscreenUpdate: VideoFullscreenUpdate}) => {
    if (fullscreenUpdate === VideoFullscreenUpdate.PLAYER_DID_PRESENT) {
      try {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      } catch {}
    }
    if (fullscreenUpdate === VideoFullscreenUpdate.PLAYER_DID_DISMISS) {
      try {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
      } catch {}
    }
  };

  if (!v?.primaryUrl) {
    return (
      <SafeAreaView edges={['top']} style={[s.container, {backgroundColor: theme.colors.background}]}>
        <View style={s.center}>
          <Text style={[s.title, {color: theme.colors.text}]}>Ao vivo (vídeo)</Text>
          <Text style={{color: withAlpha(theme.colors.text, 0.7)}}>Sem canal de vídeo configurado.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={[s.container, {backgroundColor: theme.colors.background}, isLandscape && {padding: 16}]}>
      {!isLandscape && <Text style={[s.title, {color: theme.colors.text}]}>Ao vivo (vídeo)</Text>}

      <View style={[s.playerCard, {backgroundColor: withAlpha(theme.colors.primary, 0.2), borderColor: theme.colors.border}, isLandscape && s.playerCardLandscape]}>
        <Video
          ref={videoRef}
          key={urls[idx]}
          source={{uri: urls[idx]}}
          style={isLandscape ? s.videoLandscape : s.video}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay
          isMuted={muted}
          volume={volume}
          onError={onError}
          onFullscreenUpdate={onFsUpdate}
        />
      </View>

      <View style={[s.ctrlBar, {backgroundColor: withAlpha(theme.colors.card, 0.9), borderColor: theme.colors.border}]}>
        <Pressable style={s.ctrlBtn} onPress={() => incVol(-0.1)}>
          <Text style={[s.ctrlTxt, {color: theme.colors.text}]}>－</Text>
        </Pressable>
        <Pressable style={s.ctrlBtn} onPress={toggleMute}>
          <Text style={[s.ctrlTxt, {color: theme.colors.text}]}>{muted || volume === 0 ? '🔇' : '🔈'}</Text>
        </Pressable>
        <Pressable style={s.ctrlBtn} onPress={() => incVol(+0.1)}>
          <Text style={[s.ctrlTxt, {color: theme.colors.text}]}>＋</Text>
        </Pressable>
        <View style={{flex: 1}} />
        <Pressable style={s.ctrlBtn} onPress={goFullscreen}>
          <Text style={[s.ctrlTxt, {color: theme.colors.text}]}>⛶</Text>
        </Pressable>
      </View>

      {msg ? <Text style={[s.msg, {color: withAlpha(theme.colors.text, 0.8)}]}>{msg}</Text> : null}
      {!isLandscape ? <Text style={[s.sub, {color: withAlpha(theme.colors.text, 0.7)}]}>Dica: gire o aparelho para tela cheia.</Text> : null}
    </SafeAreaView>
  );
}

function styles(t: Theme) {
  return StyleSheet.create({
    container: {flex: 1, padding: 16, gap: 12},
    center: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8},
    title: {fontSize: 22, fontWeight: '700'},
    playerCard: {
      width: '100%',
      borderRadius: 12,
      overflow: 'hidden',
      borderWidth: StyleSheet.hairlineWidth,
      alignSelf: 'center',
      justifyContent: 'center',
      alignItems: 'center'
    },
    playerCardLandscape: {flex: 1},
    video: {width: '100%', aspectRatio: 16 / 9},
    videoLandscape: {width: '100%', height: '100%'},
    ctrlBar: {
      height: 44,
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10
    },
    ctrlBtn: {paddingHorizontal: 10, height: 36, minWidth: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center'},
    ctrlTxt: {fontSize: 18, fontWeight: '700'},
    msg: {textAlign: 'center', fontSize: 12},
    sub: {textAlign: 'center', fontSize: 12}
  });
}
