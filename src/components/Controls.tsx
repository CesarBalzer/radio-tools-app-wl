// src/components/Controls.tsx
import React, {useEffect, useState} from 'react';
import {TouchableOpacity, View, StyleSheet, ViewStyle} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useTheme, type Theme} from '../theme/ThemeProvider';
import VolumeSlider from './VolumeSlider';

type Props = {
  volume: number;
  setVolume: (v: number) => void;
  playing: boolean;
  onTogglePlay: () => void;
  onShare: () => void;
  containerStyle?: ViewStyle;
};

export default function Controls({
  volume,
  setVolume,
  playing,
  onTogglePlay,
  onShare,
  containerStyle
}: Props) {
  const t = useTheme();
  const s = styles(t);

  const [volUI, setVolUI] = useState(volume);
  useEffect(() => setVolUI(volume), [volume]);

  return (
    <View style={[s.bar, {backgroundColor: t.colors.primary}, containerStyle]}>
      <TouchableOpacity
        onPress={onTogglePlay}
        style={s.iconBtn}
        hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}
      >
        <Ionicons name={playing ? 'pause' : 'play'} size={22} color="#000" />
      </TouchableOpacity>

      <View style={s.sliderWrap}>
        <VolumeSlider
          value={volUI}
          onChange={setVolUI}
          onRelease={setVolume}
          activeColor="#000"
          inactiveColor="rgba(0,0,0,0.22)"
          height={40}
          trackHeight={3}
          thumbSize={18}
        />
      </View>

      <TouchableOpacity
        onPress={onShare}
        style={s.iconBtn}
        hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}
      >
        <Ionicons name="share-social" size={22} color="#000" />
      </TouchableOpacity>
    </View>
  );
}

const styles = (t: Theme) =>
  StyleSheet.create({
    bar: {
      // flex:1,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 10,
    },
    iconBtn: {
      width: 44,
      height: 44,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: 'rgba(0,0,0,0.9)',
      alignItems: 'center',
      justifyContent: 'center'
    },
    sliderWrap: {
      flex: 1,
      paddingHorizontal: 15,
      justifyContent: 'center'
    }
  });
