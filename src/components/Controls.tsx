// src/components/Controls.tsx
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {TouchableOpacity, View, StyleSheet, ViewStyle, AccessibilityInfo} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {useTheme, type Theme} from '../theme/ThemeProvider';
import VolumeSlider from './VolumeSlider';
import {onColorFor, rgbaFromHex} from '../utils/format';

type Props = {
  volume: number;
  setVolume: (v: number) => void;
  playing: boolean;
  onTogglePlay: () => void;
  onShare: () => void;
  containerStyle?: ViewStyle;
};

export default function Controls({volume, setVolume, playing, onTogglePlay, onShare, containerStyle}: Props) {
  const t = useTheme();

  const onPrimary = useMemo(() => onColorFor(t.colors.primary, '#000'), [t.colors.primary]);
  const borderStrong = useMemo(() => rgbaFromHex(onPrimary, 0.9, t.colors.border), [onPrimary, t.colors.border]);
  const trackInactive = useMemo(() => rgbaFromHex(onPrimary, 0.22, 'rgba(0,0,0,0.22)'), [onPrimary]);
  const s = useMemo(() => styles(t), [t]);

  const [volUI, setVolUI] = useState(volume);
  useEffect(() => setVolUI(volume), [volume]);

  // Anunciar play/pause quando mudar
  const lastPlayingRef = useRef<boolean>(playing);
  useEffect(() => {
    if (lastPlayingRef.current !== playing) {
      AccessibilityInfo.announceForAccessibility(playing ? 'Reproduzindo' : 'Pausado');
      lastPlayingRef.current = playing;
    }
  }, [playing]);

  const handleTogglePlay = async () => {
    try { await Haptics.selectionAsync(); } catch {}
    onTogglePlay();
  };

  const handleShare = async () => {
    try { await Haptics.selectionAsync(); } catch {}
    onShare();
  };

  return (
    <View
      style={[s.bar, {backgroundColor: t.colors.primary}, containerStyle]}
      accessibilityRole="toolbar"
      accessibilityLabel="Controles do player"
    >
      {/* Botão Play/Pause com rótulos claros */}
      <TouchableOpacity
        onPress={handleTogglePlay}
        style={[s.iconBtn, {borderColor: borderStrong}]}
        hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}
        accessibilityRole="button"
        accessibilityLabel={playing ? 'Pausar' : 'Reproduzir'}
        accessibilityHint={playing ? 'Pausa o áudio' : 'Inicia o áudio'}
        accessibilityState={{selected: playing}}
      >
        <Ionicons name={playing ? 'pause' : 'play'} size={22} color={onPrimary} />
      </TouchableOpacity>

      {/* Slider de volume acessível (adjustable) */}
      <View style={s.sliderWrap} accessible={false}>
        <VolumeSlider
          value={volUI}
          onChange={setVolUI}
          onRelease={(v) => {
            setVolume(v);
            const pct = Math.round(v * 100);
            AccessibilityInfo.announceForAccessibility(`Volume ${pct} por cento`);
          }}
          activeColor={onPrimary}
          inactiveColor={trackInactive}
          height={40}
          trackHeight={3}
          thumbSize={18}
          accessibilityLabel="Controle de volume"
        />
      </View>

      {/* Compartilhar */}
      <TouchableOpacity
        onPress={handleShare}
        style={[s.iconBtn, {borderColor: borderStrong}]}
        hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}
        accessibilityRole="button"
        accessibilityLabel="Compartilhar"
        accessibilityHint="Compartilha o que está tocando agora"
      >
        <Ionicons name="share-social" size={22} color={onPrimary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = (t: Theme) =>
  StyleSheet.create({
    bar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderTopLeftRadius: 10,
      borderTopRightRadius: 10,
      borderTopWidth: 1,
      borderColor: t.colors.border
    },
    iconBtn: {
      width: 44,
      height: 44,
      borderRadius: 12,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent'
    },
    sliderWrap: {
      flex: 1,
      paddingHorizontal: 15,
      justifyContent: 'center'
    }
  });
