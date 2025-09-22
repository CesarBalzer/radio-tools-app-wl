// src/components/BackgroundHero.tsx
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {View, ImageBackground, StyleSheet, Animated, Easing} from 'react-native';
import {useTheme} from '../theme/ThemeProvider';
import {withAlpha} from '../utils/format';

type Props = {
	images: string[];
	intervalMs?: number;
	radius?: number;
	primaryTintOpacity?: number;
	overlayOpacity?: number;
};

export default function BackgroundHero({images, intervalMs = 3500, radius = 10, primaryTintOpacity = 0.2, overlayOpacity = 0.28}: Props) {
	const theme = useTheme();
	const list = useMemo(() => (Array.isArray(images) ? images.filter(Boolean) : []), [images]);
	const [index, setIndex] = useState(0);
	const fade = useRef(new Animated.Value(1)).current;

	useEffect(() => {
		if (index > list.length - 1) setIndex(0);
	}, [list.length]);

	useEffect(() => {
		if (list.length <= 1) return;
		const id = setInterval(() => {
			Animated.timing(fade, {toValue: 0, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true}).start(() => {
				setIndex((i) => (i + 1) % list.length);
				Animated.timing(fade, {toValue: 1, duration: 260, easing: Easing.in(Easing.quad), useNativeDriver: true}).start();
			});
		}, intervalMs);
		return () => clearInterval(id);
	}, [list.length, intervalMs, fade]);

	if (!list.length) return <View style={{flex: 1}} />;

	const tint = withAlpha(theme.colors.primary, primaryTintOpacity);
	const overlay = withAlpha(theme.colors.background, overlayOpacity);

	return (
		<View style={[styles.wrap, {borderRadius: radius}]}>
			<Animated.View style={[styles.layer, {opacity: fade}]}>
				<ImageBackground
					source={{uri: list[index]}}
					style={styles.fill}
					imageStyle={{borderRadius: radius, backgroundColor: tint}}
					resizeMode="cover"
				>
					<View style={[StyleSheet.absoluteFill, {borderRadius: radius, backgroundColor: overlay}]} />
				</ImageBackground>
			</Animated.View>
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: {flex: 1, overflow: 'hidden'},
	layer: {...StyleSheet.absoluteFillObject},
	fill: {flex: 1}
});
