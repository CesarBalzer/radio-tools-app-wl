import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Animated, PanResponder, View, StyleSheet, LayoutChangeEvent} from 'react-native';

type Props = {
	value: number; // 0..1
	onChange?: (v: number) => void; // durante o arrasto
	onRelease?: (v: number) => void; // ao soltar / tap
	activeColor?: string; // trilho ativo + thumb
	inactiveColor?: string; // trilho inativo
	height?: number; // altura da área (default 44)
	trackHeight?: number; // espessura do trilho (default 3)
	thumbSize?: number; // diâmetro da bolinha (default 20)
};

export default function VolumeSlider({
	value,
	onChange,
	onRelease,
	activeColor = '#FFF',
	inactiveColor = 'rgba(255,255,255,0.35)',
	height = 44,
	trackHeight = 3,
	thumbSize = 20
}: Props) {
	const [width, setWidth] = useState(0);
	const progress = useRef(new Animated.Value(0)).current; // 0..1
	const clamped = (v: number) => Math.min(1, Math.max(0, v));

	// sincroniza com prop externa
	useEffect(() => {
		progress.setValue(clamped(value));
	}, [value]);

	const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

	const setFromX = (x: number, final = false) => {
		if (width <= 0) return;
		const v = clamped(x / width);
		progress.setValue(v);
		onChange?.(v);
		if (final) onRelease?.(v);
	};

	const pan = useMemo(
		() =>
			PanResponder.create({
				onStartShouldSetPanResponder: () => true,
				onMoveShouldSetPanResponder: () => true,
				onPanResponderGrant: (evt) => {
					const x = evt.nativeEvent.locationX;
					setFromX(x, false);
				},
				onPanResponderMove: (evt, gesture) => {
					const x = Math.min(width, Math.max(0, gesture.dx + gesture.x0 - (gesture.x0 - evt.nativeEvent.locationX)));
					setFromX(x, false);
				},
				onPanResponderRelease: (evt) => {
					setFromX(evt.nativeEvent.locationX, true);
				},
				onPanResponderTerminationRequest: () => false,
				onPanResponderTerminate: (evt) => {
					setFromX(evt.nativeEvent.locationX, true);
				}
			}),
		[width]
	);

	const thumbTranslateX = progress.interpolate({
		inputRange: [0, 1],
		outputRange: [0, Math.max(0, width - thumbSize)]
	});
	const activeWidth = progress.interpolate({
		inputRange: [0, 1],
		outputRange: [0, width]
	});

	return (
		<View
			{...pan.panHandlers}
			onLayout={onLayout}
			style={[styles.container, {height}]}
			pointerEvents="box-only"
			hitSlop={{left: 8, right: 8, top: 8, bottom: 8}}
		>
			<View style={[styles.track, {height: trackHeight, backgroundColor: inactiveColor}]} />
			<Animated.View style={[styles.trackActive, {height: trackHeight, backgroundColor: activeColor, width: activeWidth}]} />
			<Animated.View
				style={[
					styles.thumb,
					{width: thumbSize, height: thumbSize, borderRadius: thumbSize, backgroundColor: activeColor, transform: [{translateX: thumbTranslateX}]}
				]}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {width: '100%', justifyContent: 'center'},
	track: {width: '100%', borderRadius: 999},
	trackActive: {position: 'absolute', left: 0, borderRadius: 999},
	thumb: {position: 'absolute', left: 0, top: '50%', marginTop: -10, elevation: 2}
});
