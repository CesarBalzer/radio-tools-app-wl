// src/components/SocialLinks.tsx
import React, {useMemo, useState} from 'react';
import {View, Text, StyleSheet, Linking, Pressable, Modal, ScrollView, AccessibilityInfo, useWindowDimensions, Platform} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useTheme, type Theme} from '../theme/ThemeProvider';
import {withAlpha} from '../utils/format';
import { SocialMap } from '../types';

type Props = {
	links: SocialMap | null | undefined;
	maxVisible?: number;
	variant?: 'auto' | 'icons';
};

const PRIORITY: (keyof SocialMap)[] = ['instagram', 'tiktok', 'youtube', 'x', 'twitter', 'facebook', 'whatsapp', 'telegram', 'website'];

const ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
	website: 'globe-outline',
	instagram: 'logo-instagram',
	facebook: 'logo-facebook',
	youtube: 'logo-youtube',
	tiktok: 'logo-tiktok',
	x: 'logo-twitter',
	twitter: 'logo-twitter',
	whatsapp: 'logo-whatsapp',
	telegram: 'paper-plane'
};

export default function SocialLinks({links, maxVisible = 5, variant = 'auto'}: Props) {
	const theme = useTheme();
	const s = useStyles(theme);
	const {width} = useWindowDimensions();
	const [showMore, setShowMore] = useState(false);

	const items = useMemo(() => {
		const l = links || {};
		const x = l.x || l.twitter;
		const raw = [
			{key: 'instagram', label: 'Instagram', url: l.instagram},
			{key: 'tiktok', label: 'TikTok', url: l.tiktok},
			{key: 'youtube', label: 'YouTube', url: l.youtube},
			{key: 'x', label: 'X (Twitter)', url: x},
			{key: 'facebook', label: 'Facebook', url: l.facebook},
			{key: 'whatsapp', label: 'WhatsApp', url: l.whatsapp},
			{key: 'telegram', label: 'Telegram', url: l.telegram},
			{key: 'website', label: 'Site', url: l.website}
		];
		return raw
			.filter((i) => typeof i.url === 'string' && i.url!.trim())
			.sort((a, b) => PRIORITY.indexOf(a.key as any) - PRIORITY.indexOf(b.key as any));
	}, [links]);

	if (!items.length) return null;

	const iconOnly = variant === 'icons' || (variant === 'auto' && width < 380);
	const visible = items.slice(0, Math.max(1, maxVisible));
	const overflow = items.slice(Math.max(1, maxVisible));

	const open = async (url: string, label: string) => {
		try {
			const ok = await Linking.canOpenURL(url);
			await Linking.openURL(ok ? url : url.startsWith('http') ? url : `https://${url}`);
			AccessibilityInfo.announceForAccessibility(`${label} aberto`);
		} catch {
			AccessibilityInfo.announceForAccessibility(`Não foi possível abrir ${label}`);
		}
	};

	return (
		<View accessibilityRole="toolbar" accessibilityLabel="Redes sociais da rádio">
			<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row}>
				{visible.map((it) => (
					<Pressable
						key={it.key}
						onPress={() => open(it.url!, it.label)}
						style={[
							s.iconBtn,
							{
								borderColor: withAlpha(theme.colors.primary, 0.55),
								backgroundColor: withAlpha(theme.colors.primary, 0.18)
							}
						]}
						accessibilityRole="link"
						accessibilityLabel={`Abrir ${it.label}`}
						accessibilityHint={`Abre o ${it.label} da rádio`}
						hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}
					>
						<Ionicons name={ICON[it.key] || 'link-outline'} size={18} color={theme.colors.primary} />
						{!iconOnly && (
							<Text style={[s.txt, {color: theme.colors.text}]} allowFontScaling numberOfLines={1}>
								{it.label}
							</Text>
						)}
					</Pressable>
				))}

				{!!overflow.length && (
					<Pressable
						onPress={() => setShowMore(true)}
						style={[
							s.iconBtn,
							{
								borderColor: withAlpha(theme.colors.primary, 0.55),
								backgroundColor: withAlpha(theme.colors.primary, 0.18)
							}
						]}
						accessibilityRole="button"
						accessibilityLabel="Mais redes"
						accessibilityHint="Abre a lista de redes sociais adicionais"
					>
						<Ionicons name="ellipsis-horizontal" size={18} color={theme.colors.primary} />
						{!iconOnly && (
							<Text style={[s.txt, {color: theme.colors.text}]} allowFontScaling numberOfLines={1}>
								Mais
							</Text>
						)}
					</Pressable>
				)}
			</ScrollView>

			<Modal visible={showMore} transparent animationType="fade" onRequestClose={() => setShowMore(false)}>
				<Pressable style={s.backdrop} onPress={() => setShowMore(false)} />
				<View
					style={[s.sheet, {backgroundColor: theme.colors.card, borderColor: withAlpha(theme.colors.primary, 0.45)}]}
					accessibilityViewIsModal
					accessibilityLabel="Outras redes sociais"
				>
					{overflow.map((it) => (
						<Pressable
							key={it.key}
							onPress={() => {
								setShowMore(false);
								open(it.url!, it.label);
							}}
							style={s.rowItem}
							accessibilityRole="link"
							accessibilityLabel={`Abrir ${it.label}`}
						>
							<Ionicons name={ICON[it.key] || 'link-outline'} size={18} color={theme.colors.primary} />
							<Text style={[s.rowTxt, {color: theme.colors.text}]} allowFontScaling>
								{it.label}
							</Text>
						</Pressable>
					))}
					<Pressable onPress={() => setShowMore(false)} style={[s.rowItem, s.rowItemClose]} accessibilityRole="button" accessibilityLabel="Fechar">
						<Ionicons name="close" size={18} color={theme.colors.primary} />
						<Text style={[s.rowTxt, {color: theme.colors.text}]} allowFontScaling>
							Fechar
						</Text>
					</Pressable>
				</View>
			</Modal>
		</View>
	);
}

function useStyles(t: Theme) {
	return StyleSheet.create({
		row: {gap: 10, paddingHorizontal: 2, marginBottom: 10},
		iconBtn: {
			minHeight: 44,
			minWidth: 44,
			paddingHorizontal: 12,
			paddingVertical: 10,
			borderRadius: 12,
			borderWidth: 1,
			alignItems: 'center',
			justifyContent: 'center',
			flexDirection: 'row',
			gap: 8
		},
		txt: {fontSize: 13, fontWeight: '700', letterSpacing: 0.2},
		backdrop: {...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)'},
		sheet: {
			position: 'absolute',
			left: 16,
			right: 16,
			bottom: 20,
			borderRadius: 14,
			borderWidth: StyleSheet.hairlineWidth,
			paddingVertical: 6,
			...Platform.select({
				ios: {shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 16, shadowOffset: {width: 0, height: -4}},
				android: {elevation: 16}
			})
		},
		rowItem: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: 10,
			paddingHorizontal: 14,
			paddingVertical: 12
		},
		rowItemClose: {borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: withAlpha(t.colors.primary, 0.25)},
		rowTxt: {fontSize: 15, fontWeight: '700'}
	});
}
