// src/components/Controls.tsx
import React, {useEffect, useMemo, useRef, useState, useCallback} from 'react';
import {TouchableOpacity, View, StyleSheet, ViewStyle, AccessibilityInfo} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {useTheme, type Theme} from '../theme/ThemeProvider';
import VolumeSlider from './VolumeSlider';
import {onColorFor, rgbaFromHex} from '../utils/format';

// 🔽 novos imports
import {useItunesTrack} from '../hooks/useItunesTrack';
import {useCoverArt} from '../hooks/useCoverArt';
import TrackModal from './TrackModal';

type Props = {
  volume: number;
  setVolume: (v: number) => void;
  playing: boolean;
  onTogglePlay: () => void;
  onShare: () => void;
  containerStyle?: ViewStyle;
  // 🔽 novos (opcionais) — ajudam a resolver o botão Info
  artist?: string | null;
  title?: string | null;
  name?: string | null;
  logoUrl?: string | null;
};

export default function Controls({
  volume,
  setVolume,
  playing,
  onTogglePlay,
  onShare,
  containerStyle,
  artist,
  title,
}: Props) {
  const t = useTheme();

  const onPrimary = useMemo(() => onColorFor(t.colors.primary, '#000'), [t.colors.primary]);
  const borderStrong = useMemo(() => rgbaFromHex(onPrimary, 0.9, t.colors.border), [onPrimary, t.colors.border]);
  const trackInactive = useMemo(() => rgbaFromHex(onPrimary, 0.22, 'rgba(0,0,0,0.22)'), [onPrimary]);
  const s = useMemo(() => styles(t), [t]);

  const [volUI, setVolUI] = useState(volume);
  useEffect(() => setVolUI(volume), [volume]);

  // A11y: anunciar play/pause quando mudar
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

  // 🔽 lógica do botão Info (antes no TopBar)
  const {track: itunesTrack} = useItunesTrack(artist ?? undefined, title ?? undefined);
  const coverUrl = useCoverArt(artist ?? undefined, title ?? undefined);
  const [modalVisible, setModalVisible] = useState(false);
  const openInfo = useCallback(async () => {
    try { await Haptics.selectionAsync(); } catch {}
    setModalVisible(true);
  }, []);

  return (
    <View
      style={[s.bar, {backgroundColor: t.colors.primary}, containerStyle]}
      accessibilityRole="toolbar"
      accessibilityLabel="Controles do player"
    >
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

      {/* 🔽 Ações migradas: Info (se houver faixa) + único Share */}
      {!!itunesTrack && (
        <TouchableOpacity
          onPress={openInfo}
          style={[s.iconBtn, {borderColor: borderStrong}]}
          hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}
          accessibilityRole="button"
          accessibilityLabel="Ver detalhes da faixa"
          accessibilityHint="Abre detalhes da música em reprodução"
        >
          <Ionicons name="information-circle-outline" size={22} color={onPrimary} />
        </TouchableOpacity>
      )}

      <TouchableOpacity
        onPress={handleShare}
        style={[s.iconBtn, {borderColor: borderStrong, marginLeft:10}]}
        hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}
        accessibilityRole="button"
        accessibilityLabel="Compartilhar"
        accessibilityHint="Compartilha o que está tocando agora"
      >
        <Ionicons name="share-social" size={22} color={onPrimary} />
      </TouchableOpacity>

      <TrackModal visible={modalVisible} onClose={() => setModalVisible(false)} track={itunesTrack ?? null} />
    </View>
  );
}

const styles = (t: Theme) =>
  StyleSheet.create({
    bar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingBottom: 12,
      borderBottomLeftRadius: 10,
      borderBottomRightRadius: 10,
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
