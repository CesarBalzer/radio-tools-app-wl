// src/screens/player/components/TrackModal.tsx
import React, {useEffect, useMemo, useRef} from 'react';
import {
	Modal,
	View,
	Text,
	Image,
	TouchableOpacity,
	TouchableWithoutFeedback,
	Linking,
	StyleSheet,
	ScrollView,
	Platform,
	AccessibilityInfo,
	findNodeHandle
} from 'react-native';
import {useTheme} from '../theme/ThemeProvider';
import type {ItunesTrack} from '../hooks/useItunesTrack';
import {Ionicons} from '@expo/vector-icons';
import {onColorFor, rgbaFromHex, withAlpha} from '../utils/format';

type Props = {
	visible: boolean;
	onClose: () => void;
	track: ItunesTrack | null;
};

function upscaleItunesArt(url?: string | null) {
	if (!url) return undefined;
	return url.replace(/\/\d+x\d+bb\.(?:jpg|png)/, '/600x600bb.jpg');
}

export default function TrackModal({visible, onClose, track}: Props) {
	const theme = useTheme();
	const styles = useMemo(() => makeStyles(theme), [theme]);

	// chame hooks antes dos returns condicionais
	const titleRef = useRef<Text>(null);

	useEffect(() => {
		if (!visible || !track) return;
		const timer = setTimeout(() => {
			const node = findNodeHandle(titleRef.current);
			if (node) AccessibilityInfo.setAccessibilityFocus(node);
			const line = [track.artistName, track.trackName].filter(Boolean).join(' — ');
			if (line) AccessibilityInfo.announceForAccessibility(`Detalhes da faixa. ${line}`);
		}, 100);
		return () => clearTimeout(timer);
	}, [visible, track?.artistName, track?.trackName]);

	if (!visible || !track) return null;

	const cover = upscaleItunesArt(track.artworkUrl100);
	const released = track.releaseDate ? new Date(track.releaseDate).toLocaleDateString() : null;

	const openAppleMusic = async () => {
		if (!track.trackViewUrl) return;
		try {
			await Linking.openURL(track.trackViewUrl);
		} catch {}
	};

	const lineForImage = [track.artistName, track.trackName].filter(Boolean).join(' — ');

	return (
		<Modal
			visible={visible}
			transparent
			animationType="fade"
			onRequestClose={onClose}
			statusBarTranslucent
			// iOS: formSheet fica bonito, mas como é transparent usamos fade
			presentationStyle={Platform.OS === 'ios' ? 'overFullScreen' : undefined}
		>
			{/* Backdrop (decorativo) — ignorado por leitores de tela */}
			<TouchableWithoutFeedback onPress={onClose}>
				<View style={styles.backdrop} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden />
			</TouchableWithoutFeedback>

			<View
				style={styles.sheet}
				// Indicamos que esta view é modal para leitores de tela
				accessibilityViewIsModal
				// iOS: gesto "scrub" de 2 dedos fecha
				onAccessibilityEscape={onClose}
				accessibilityRole="summary"
				accessibilityLabel="Janela de detalhes da faixa"
			>
				{/* handle opcional */}
				<View style={styles.handle} accessible={false} importantForAccessibility="no" />

				<ScrollView
					bounces={false}
					contentContainerStyle={styles.content}
					showsVerticalScrollIndicator={false}
					// Ajuda o leitor de tela a ler mudanças com calma
					accessibilityLiveRegion={Platform.OS === 'android' ? 'polite' : undefined}
				>
					{cover ? (
						<Image
							source={{uri: cover}}
							style={styles.cover}
							accessibilityRole="image"
							accessibilityLabel={lineForImage ? `Capa: ${lineForImage}` : 'Capa da faixa'}
						/>
					) : null}

					<Text ref={titleRef} style={styles.title} numberOfLines={3} allowFontScaling accessibilityRole="header">
						{track.trackName}
					</Text>

					<Text style={styles.artist} numberOfLines={2} allowFontScaling>
						{track.artistName}
					</Text>

					{!!track.collectionName && (
						<Text style={styles.subtle} numberOfLines={2} allowFontScaling>
							Álbum:{' '}
							<Text style={styles.em} allowFontScaling>
								{track.collectionName}
							</Text>
						</Text>
					)}

					{!!track.primaryGenreName && (
						<Text style={[styles.subtle, styles.italic]} allowFontScaling>
							{track.primaryGenreName}
						</Text>
					)}

					{!!released && (
						<Text style={styles.meta} allowFontScaling>
							Lançamento: {released}
						</Text>
					)}

					{!!track.trackViewUrl && Platform.OS === 'ios' && (
						<TouchableOpacity
							style={styles.primaryBtn}
							onPress={openAppleMusic}
							accessibilityRole="link"
							accessibilityLabel="Abrir no Apple Music"
							accessibilityHint="Abre a página da música no Apple Music"
						>
							<Ionicons name="musical-notes" size={18} color={styles._onPrimary} />
							<Text style={[styles.primaryBtnText, {color: styles._onPrimary}]} allowFontScaling>
								Abrir no Apple Music
							</Text>
						</TouchableOpacity>
					)}

					<TouchableOpacity
						style={styles.secondaryBtn}
						onPress={onClose}
						accessibilityRole="button"
						accessibilityLabel="Fechar"
						accessibilityHint="Fecha a janela de detalhes"
					>
						<Ionicons name="close" size={18} color={theme.colors.text} />
						<Text style={styles.secondaryBtnText} allowFontScaling>
							Fechar
						</Text>
					</TouchableOpacity>
				</ScrollView>
			</View>
		</Modal>
	);
}

function makeStyles(theme: ReturnType<typeof useTheme>) {
	const {colors} = theme;
	const onPrimary = onColorFor(colors.primary, '#000');

	return StyleSheet.create({
		_onPrimary: onPrimary as any,

		backdrop: {
			flex: 1,
			backgroundColor: rgbaFromHex(colors.primary, 0.82)
		},
		sheet: {
			position: 'absolute',
			left: 0,
			right: 0,
			bottom: 50,
			backgroundColor: colors.card,
			borderTopLeftRadius: 24,
			borderTopRightRadius: 24,
			borderTopWidth: 1,
			borderColor: withAlpha(colors.primary, 0.25),
			paddingBottom: 12,
			...Platform.select({
				ios: {shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, shadowOffset: {width: 0, height: -4}},
				android: {elevation: 16}
			}),
			maxHeight: '88%'
		},
		handle: {
			width: 44,
			height: 5,
			borderRadius: 3,
			backgroundColor: rgbaFromHex(colors.primary, 0.4),
			alignSelf: 'center',
			marginTop: 8,
			marginBottom: 6
		},
		content: {
			alignItems: 'center',
			paddingHorizontal: 20,
			paddingTop: 8,
			paddingBottom: 24,
			gap: 8
		},
		cover: {
			width: 240,
			height: 240,
			borderRadius: 16,
			borderWidth: 1,
			borderColor: colors.border
		},
		title: {
			marginTop: 12,
			fontSize: 22,
			fontWeight: '700',
			color: colors.text,
			textAlign: 'center'
		},
		artist: {
			marginTop: 4,
			fontSize: 16,
			fontWeight: '600',
			color: colors.muted,
			textAlign: 'center'
		},
		subtle: {
			marginTop: 6,
			fontSize: 14,
			color: colors.muted,
			textAlign: 'center'
		},
		italic: {fontStyle: 'italic'},
		em: {color: colors.text, fontWeight: '600'},
		meta: {
			marginTop: 2,
			fontSize: 13,
			color: colors.muted,
			textAlign: 'center'
		},
		primaryBtn: {
			marginTop: 16,
			paddingVertical: 12,
			paddingHorizontal: 16,
			borderRadius: 12,
			backgroundColor: colors.primary,
			flexDirection: 'row',
			alignItems: 'center',
			gap: 10,
			alignSelf: 'stretch',
			justifyContent: 'center',
			minHeight: 48
		},
		primaryBtnText: {
			fontSize: 16,
			fontWeight: '700'
		},
		secondaryBtn: {
			marginTop: 10,
			paddingVertical: 12,
			paddingHorizontal: 16,
			borderRadius: 12,
			borderWidth: 1,
			borderColor: colors.border,
			backgroundColor: 'transparent',
			flexDirection: 'row',
			alignItems: 'center',
			gap: 8,
			alignSelf: 'stretch',
			justifyContent: 'center',
			minHeight: 48
		},
		secondaryBtnText: {
			fontSize: 16,
			fontWeight: '600',
			color: colors.text
		}
	});
}
