// src/components/Controls.tsx
import React, {useEffect, useMemo, useState} from 'react';
import {TouchableOpacity, View, StyleSheet, ViewStyle} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
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

	// cor de ícones/borda “em cima do primary”
	const onPrimary = useMemo(() => onColorFor(t.colors.primary, '#000'), [t.colors.primary]);
	const borderStrong = useMemo(() => rgbaFromHex(onPrimary, 0.9, t.colors.border), [onPrimary, t.colors.border]);
	const trackInactive = useMemo(() => rgbaFromHex(onPrimary, 0.22, 'rgba(0,0,0,0.22)'), [onPrimary]);

	const s = useMemo(() => styles(t), [t]);

	const [volUI, setVolUI] = useState(volume);
	useEffect(() => setVolUI(volume), [volume]);

	return (
		<View style={[s.bar, {backgroundColor: t.colors.primary}, containerStyle]}>
			<TouchableOpacity onPress={onTogglePlay} style={[s.iconBtn, {borderColor: borderStrong}]} hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
				<Ionicons name={playing ? 'pause' : 'play'} size={22} color={onPrimary} />
			</TouchableOpacity>

			<View style={s.sliderWrap}>
				<VolumeSlider
					value={volUI}
					onChange={setVolUI}
					onRelease={setVolume}
					activeColor={onPrimary}
					inactiveColor={trackInactive}
					height={40}
					trackHeight={3}
					thumbSize={18}
				/>
			</View>

			<TouchableOpacity onPress={onShare} style={[s.iconBtn, {borderColor: borderStrong}]} hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
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
			// opcional: linha superior sutil usando o border do tema
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
