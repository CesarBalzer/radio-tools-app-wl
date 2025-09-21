// src/components/BackgroundCarousel.tsx
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {ImageBackground, ScrollView, View, StyleSheet, useWindowDimensions} from 'react-native';

type Props = {
	images: string[]; // lista de URLs
	height?: number; // altura do hero
	intervalMs?: number;
};

const RADIUS = 24;

export default function BackgroundCarousel({images, height = 300, intervalMs = 3500}: Props) {
	const {width} = useWindowDimensions();
	const list = useMemo(() => (Array.isArray(images) ? images.filter(Boolean) : []), [images]);
	const [index, setIndex] = useState(0);
	const scrollRef = useRef<ScrollView>(null);

	useEffect(() => {
		if (list.length <= 1) return;
		const id = setInterval(() => {
			setIndex((i) => {
				const next = (i + 1) % list.length;
				scrollRef.current?.scrollTo({x: next * width, animated: true});
				return next;
			});
		}, intervalMs);
		return () => clearInterval(id);
	}, [list.length, width, intervalMs]);

	if (!list.length) return <View style={{height}} />;

	return (
		<View style={[styles.wrap, {height}]}>
			<ScrollView
				ref={scrollRef}
				horizontal
				pagingEnabled
				showsHorizontalScrollIndicator={false}
				onScroll={(e) => {
					const i = Math.round(e.nativeEvent.contentOffset.x / width);
					if (i !== index) setIndex(i);
				}}
				scrollEventThrottle={16}
			>
				{list.map((url, idx) => (
					<ImageBackground key={idx} source={{uri: url}} style={[styles.banner, {width, height}]} imageStyle={styles.bannerImg}>
						<View style={styles.overlay} />
					</ImageBackground>
				))}
			</ScrollView>

			{list.length > 1 && (
				<View style={styles.dots}>
					{list.map((_, i) => (
						<View key={i} style={[styles.dot, {opacity: i === index ? 1 : 0.35}]} />
					))}
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: {marginTop: 10},
	banner: {justifyContent: 'center', alignItems: 'center'},
	bannerImg: {resizeMode: 'cover', borderRadius: RADIUS},
	overlay: {...StyleSheet.absoluteFillObject, borderRadius: RADIUS, backgroundColor: 'rgba(0,0,0,0.15)'},
	dots: {position: 'absolute', bottom: 10, alignSelf: 'center', flexDirection: 'row', gap: 6},
	dot: {width: 7, height: 7, borderRadius: 10, backgroundColor: '#fff'}
});
