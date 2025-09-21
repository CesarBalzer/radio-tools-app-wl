import React, {useEffect, useRef} from 'react';
import {View, Animated, StyleSheet, Easing} from 'react-native';
import TrackPlayer from 'react-native-track-player';

export default function MiniWaves({active}: {active: boolean}) {
	const anim = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		let loop: Animated.CompositeAnimation | null = null;
		if (active) {
			const animate = () => {
				TrackPlayer.getVolume().then((v) => {
					const scale = 0.3 + v * 0.7; // intensidade varia com volume
					loop = Animated.loop(
						Animated.sequence([
							Animated.timing(anim, {toValue: scale, duration: 500, easing: Easing.linear, useNativeDriver: false}),
							Animated.timing(anim, {toValue: 0.1, duration: 500, easing: Easing.linear, useNativeDriver: false})
						])
					);
					loop.start();
				});
			};
			animate();
		}
		return () => loop?.stop();
	}, [active]);

	const bars = [0, 1, 2, 3, 4];
	return (
		<View style={s.wrap}>
			{bars.map((i) => (
				<Animated.View
					key={i}
					style={[
						s.bar,
						{
							height: anim.interpolate({
								inputRange: [0, 1],
								outputRange: [8, 40 + i * 2]
							})
						}
					]}
				/>
			))}
		</View>
	);
}

const s = StyleSheet.create({
	wrap: {flexDirection: 'row', alignItems: 'flex-end', gap: 4, padding: 6},
	bar: {width: 4, backgroundColor: '#acf44e', borderRadius: 2}
});
