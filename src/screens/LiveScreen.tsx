// src/screens/LiveScreen.tsx
import React, {useMemo} from 'react';
import {View, Text, StyleSheet, useWindowDimensions} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {VideoView, useVideoPlayer} from 'expo-video';
import {useRemoteConfig} from '../config/RemoteConfigProvider';
import {useTheme, type Theme} from '../theme/ThemeProvider';
import {withAlpha} from '../utils/format';

export default function LiveScreen() {
	const {streams} = useRemoteConfig();
	const theme = useTheme();
	const v = streams.video;
	const {width, height} = useWindowDimensions();
	const isLandscape = width > height;

	// Usa APENAS as URLs do seu RemoteConfig
	const urls = useMemo(() => (v?.primaryUrl ? [v.primaryUrl, ...(v.fallbackUrls ?? [])].filter(Boolean) : []), [v]);

	// Cria o player exatamente como você já fazia
	const player = useVideoPlayer(urls[0] ?? null, (p) => {
		if (!p) return;
		p.play();
	});

	const s = styles(theme);

	// Sem canal configurado → mensagem clara e acessível (alert)
	if (!v?.primaryUrl) {
		return (
			<SafeAreaView
				edges={['top']}
				style={[s.container, {backgroundColor: theme.colors.background}]}
				accessibilityRole="summary"
				accessibilityLabel="Tela de transmissão ao vivo"
			>
				<View style={s.center} accessibilityRole="alert" accessibilityLabel="Sem canal de vídeo configurado">
					<Text style={[s.title, {color: theme.colors.text}]} allowFontScaling>
						Ao vivo (vídeo)
					</Text>
					<Text style={{color: withAlpha(theme.colors.text, 0.7)}} allowFontScaling>
						Sem canal de vídeo configurado.
					</Text>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView
			edges={['top']}
			style={[s.container, {backgroundColor: theme.colors.background}, isLandscape && {padding: 16}]}
			accessibilityRole="summary"
			accessibilityLabel="Tela de transmissão ao vivo"
		>
			{!isLandscape && (
				<Text style={[s.title, {color: theme.colors.text}]} allowFontScaling accessibilityRole="header">
					Ao vivo (vídeo)
				</Text>
			)}

			<View
				style={[
					s.playerCard,
					{backgroundColor: withAlpha(theme.colors.primary, 0.2), borderColor: theme.colors.border},
					isLandscape && s.playerCardLandscape
				]}
				// O card é apenas visual; não precisa entrar na ordem de foco
				importantForAccessibility="no-hide-descendants"
				accessibilityElementsHidden
			>
				<VideoView
					style={isLandscape ? s.videoLandscape : s.video}
					player={player}
					nativeControls
					contentFit="contain"
					fullscreenOptions={{enable: true}}
					allowsPictureInPicture
					accessibilityLabel="Janela do vídeo ao vivo"
					accessibilityHint="Use os controles do player para reproduzir, pausar, alternar tela cheia e legendas quando disponíveis."
				/>
			</View>
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
		videoLandscape: {width: '100%', height: '100%'}
	});
}
