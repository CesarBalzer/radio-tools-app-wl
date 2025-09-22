// src/components/MiniMarquee.tsx
import React, {useEffect, useRef, useState} from 'react';
import {Animated, Easing, LayoutChangeEvent, StyleSheet, Text, View, ViewStyle, TextStyle} from 'react-native';

type Props = {
	children: string;
	containerStyle?: ViewStyle;
	textStyle?: TextStyle;
	speed?: number; // px/s
	gap?: number; // px entre cópias
	pause?: number; // ms de pausa nas extremidades
	numberOfLines?: number; // mantém compatível com <Text>
};

export default function MiniMarquee({children, containerStyle, textStyle, speed = 50, gap = 30, pause = 600, numberOfLines = 1}: Props) {
	const [wContainer, setWContainer] = useState(0);
	const [wText, setWText] = useState(0);
	const anim = useRef(new Animated.Value(0)).current;

	const overflow = wText > wContainer && wContainer > 0;

	useEffect(() => {
		if (!overflow) return;
		anim.setValue(0);
		const distance = wText + gap; // uma passada inteira
		const duration = (distance / speed) * 1000;

		const loop = Animated.loop(
			Animated.sequence([
				Animated.delay(pause),
				Animated.timing(anim, {
					toValue: -distance,
					duration,
					easing: Easing.linear,
					useNativeDriver: true
				}),
				Animated.delay(pause),
				Animated.timing(anim, {toValue: 0, duration: 0, useNativeDriver: true})
			])
		);
		loop.start();
		return () => loop.stop();
	}, [overflow, wText, wContainer, speed, gap, pause, anim]);

	const onLayoutContainer = (e: LayoutChangeEvent) => setWContainer(e.nativeEvent.layout.width);
	const onLayoutText = (e: LayoutChangeEvent) => setWText(e.nativeEvent.layout.width);

	if (!children) return null;

	if (!overflow) {
		return (
			<View onLayout={onLayoutContainer} style={[styles.container, containerStyle]}>
				<Text onLayout={onLayoutText} style={[styles.text, textStyle]} numberOfLines={numberOfLines} ellipsizeMode="tail">
					{children}
				</Text>
			</View>
		);
	}

	return (
		<View onLayout={onLayoutContainer} style={[styles.container, containerStyle]}>
			<Animated.View style={{flexDirection: 'row', transform: [{translateX: anim}]}}>
				<Text onLayout={onLayoutText} style={[styles.text, textStyle]}>
					{children}
				</Text>
				<View style={{width: gap}} />
				{/* cópia para loop contínuo */}
				<Text style={[styles.text, textStyle]}>{children}</Text>
			</Animated.View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {flexShrink: 1, overflow: 'hidden', minWidth: 0},
	text: {fontSize: 12}
});
