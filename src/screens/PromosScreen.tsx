// src/screens/PromosScreen.tsx
import React, {useMemo} from 'react';
import {View, Text, FlatList, Image, StyleSheet, TouchableOpacity, Share, Alert, Platform} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import {useRemoteConfig} from '../config/RemoteConfigProvider';
import {useTheme, type Theme} from '../theme/ThemeProvider';
import {Ionicons} from '@expo/vector-icons';

/* ── helpers ─────────────────────────────────────────────────────────── */
function withAlpha(hex: string, a: number) {
	const h = hex.replace('#', '');
	const to255 = (s: string) => parseInt(s.length === 1 ? s + s : s, 16);
	const r = to255(h.length === 3 ? h[0] : h.slice(0, 2));
	const g = to255(h.length === 3 ? h[1] : h.slice(2, 4));
	const b = to255(h.length === 3 ? h[2] : h.slice(4, 6));
	return `rgba(${r},${g},${b},${a})`;
}
function hexToRgb(hex: string): [number, number, number] | null {
	const m = hex.replace('#', '').trim();
	const s =
		m.length === 3
			? m
					.split('')
					.map((c) => c + c)
					.join('')
			: m;
	if (!/^[0-9a-fA-F]{6}$/.test(s)) return null;
	const r = parseInt(s.slice(0, 2), 16);
	const g = parseInt(s.slice(2, 4), 16);
	const b = parseInt(s.slice(4, 6), 16);
	return [r, g, b];
}
function relativeLuminance([r, g, b]: [number, number, number]) {
	const srgb = [r, g, b].map((v) => v / 255).map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
	return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}
function onColorFor(bgHex: string, fallback: '#000' | '#fff' = '#000') {
	const rgb = hexToRgb(bgHex);
	if (!rgb) return fallback;
	return relativeLuminance(rgb) > 0.55 ? '#000' : '#fff';
}
/* ───────────────────────────────────────────────────────────────────── */

export default function PromosScreen() {
	const {promos, station} = useRemoteConfig();
	const theme = useTheme();
	const s = styles(theme);

	const items = useMemo(() => promos?.items ?? [], [promos?.items]);
	const onPrimary = useMemo(() => onColorFor(theme.colors.primary, '#000'), [theme.colors.primary]);

	async function handleCopy(code?: string) {
		if (!code) return;
		try {
			await Clipboard.setStringAsync(code);
			Alert.alert('Copiado', 'Código de cupom copiado para a área de transferência.');
		} catch {
			Alert.alert('Ops', 'Não foi possível copiar o cupom.');
		}
	}

	async function handleShare(item: any) {
		try {
			const parts: string[] = [];
			if (item?.title) parts.push(`🎁 ${item.title}`);
			if (item?.code) parts.push(`Cupom: ${item.code}`);
			if (station?.shareUrl) parts.push(station.shareUrl);
			const message = parts.join('\n');

			// Em iOS, Share usa 'url' separada; em Android, só message
			if (Platform.OS === 'ios' && (item?.rulesUrl || item?.image)) {
				await Share.share({message, url: item.rulesUrl || item.image});
			} else {
				await Share.share({message});
			}
		} catch {
			// usuário cancelou ou houve erro — silencioso
		}
	}

	return (
		<SafeAreaView edges={['top']} style={[s.container, {backgroundColor: theme.colors.background}]}>
			<Text style={[s.title, {color: theme.colors.text}]}>{promos?.headline ?? 'Promoções'}</Text>

			<FlatList
				data={items}
				keyExtractor={(it) => it.id}
				contentContainerStyle={s.list}
				ListEmptyComponent={
					<View style={s.empty}>
						<Text style={[s.emptyTxt, {color: theme.colors.text}]}>Nenhuma promoção disponível.</Text>
					</View>
				}
				renderItem={({item}) => {
					const hasCode = !!item.code;
					return (
						<View style={[s.card, {backgroundColor: withAlpha(theme.colors.primary, 0.2), borderColor: theme.colors.border}]}>
							{item.image ? <Image source={{uri: item.image}} style={s.img} /> : null}

							<View style={s.body}>
								<Text style={[s.cardTitle, {color: theme.colors.text}]} numberOfLines={2}>
									{item.title}
								</Text>

								{hasCode ? (
									<View style={[s.badge, {backgroundColor: withAlpha(theme.colors.primary, 0.18), borderColor: theme.colors.border}]}>
										<Text style={[s.badgeTxt, {color: theme.colors.text}]}>Cupom: {item.code}</Text>
									</View>
								) : null}

								{item.expiresAt ? <Text style={[s.meta, {color: theme.colors.text}]}>Validade: {item.expiresAt}</Text> : null}

								{/* Ações */}
								<View style={s.actions}>
									<TouchableOpacity
										onPress={() => handleCopy(item.code)}
										disabled={!hasCode}
										style={[s.btnPrimary, {backgroundColor: theme.colors.primary}, !hasCode && {opacity: 0.6}]}
										accessibilityRole="button"
										accessibilityLabel="Copiar código do cupom"
									>
										<Ionicons name="copy-outline" size={16} color={onPrimary} />
										<Text style={[s.btnPrimaryTxt, {color: onPrimary}]}>Copiar código</Text>
									</TouchableOpacity>

									<TouchableOpacity
										onPress={() => handleShare(item)}
										style={[s.btnOutline, {borderColor: theme.colors.border}]}
										accessibilityRole="button"
										accessibilityLabel="Compartilhar cupom"
									>
										<Ionicons name="share-social-outline" size={16} color={theme.colors.text} />
										<Text style={[s.btnOutlineTxt, {color: theme.colors.text}]}>Compartilhar</Text>
									</TouchableOpacity>
								</View>
							</View>
						</View>
					);
				}}
			/>
		</SafeAreaView>
	);
}

function styles(t: Theme) {
	return StyleSheet.create({
		container: {flex: 1},
		title: {fontSize: 24, fontWeight: '700', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8},
		list: {paddingHorizontal: 12, paddingBottom: 16, gap: 12},
		empty: {padding: 20, alignItems: 'center', justifyContent: 'center'},
		emptyTxt: {opacity: 0.7},

		card: {borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, overflow: 'hidden'},
		img: {width: '100%', height: 160, backgroundColor: '#111'},

		body: {padding: 12, gap: 8},
		cardTitle: {fontSize: 16, fontWeight: '700'},

		badge: {alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: StyleSheet.hairlineWidth},
		badgeTxt: {fontSize: 12, fontWeight: '800', letterSpacing: 0.3},

		meta: {fontSize: 12, opacity: 0.7},

		actions: {flexDirection: 'row', justifyContent: 'space-evenly', gap: 8, marginVertical: 10},

		btnPrimary: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: 8,
			paddingHorizontal: 14,
			paddingVertical: 10,
			borderRadius: 10,
			flexShrink: 0
		},
		btnPrimaryTxt: {fontSize: 14, fontWeight: '800'},

		btnOutline: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: 8,
			paddingHorizontal: 14,
			paddingVertical: 10,
			borderRadius: 10,
			borderWidth: 1,
			backgroundColor: 'transparent',
			flexShrink: 0
		},
		btnOutlineTxt: {fontSize: 14, fontWeight: '700'}
	});
}
