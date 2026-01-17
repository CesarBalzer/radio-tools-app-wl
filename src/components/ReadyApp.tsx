import React, {useEffect, useRef, useState} from 'react';
import {View, StyleSheet, Image} from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import {useTheme as useAppTheme} from '../theme/ThemeProvider';
import {useRemoteConfig} from '../config/RemoteConfigProvider';
import {BrandingSplash} from './BrandingSplash';

SplashScreen.preventAutoHideAsync().catch(() => {});

type Props = {
	isReady: boolean;
	children: React.ReactNode;
	minBrandingMs?: number;
	extraHoldMs?: number;
};

export function ReadyApp({isReady, children, minBrandingMs = 1400, extraHoldMs = 0}: Props) {
	const [showOverlay, setShowOverlay] = useState(false);
	const didStartRef = useRef(false);
	const mountedRef = useRef(true);

	const t = useAppTheme();
	const cfg = useRemoteConfig();

	const logoUrl = t.assets.logoUrl || cfg?.branding?.logoUrl || cfg?.station?.logoUrl || null;
	const bgImageUrl = t.assets.bgImageUrl || cfg?.branding?.bgImageUrl || null;

	useEffect(() => {
		mountedRef.current = true;
		return () => {
			mountedRef.current = false;
		};
	}, []);

	useEffect(() => {
		async function prefetchAll(uris: string[]) {
			await Promise.all(
				uris.map(async (uri) => {
					try {
						await Image.prefetch(uri);
					} catch {}
				})
			);
		}

		async function run() {
			if (!isReady || didStartRef.current) return;
			didStartRef.current = true;

			const uris = [bgImageUrl, logoUrl].filter((x): x is string => !!x);
			if (uris.length) {
				await prefetchAll(uris);
			}

			try {
				await SplashScreen.hideAsync();
			} catch {}

			if (!mountedRef.current) return;
			setShowOverlay(true);

			const hold = Math.max(0, minBrandingMs) + Math.max(0, extraHoldMs);
			if (hold > 0) {
				await new Promise((r) => setTimeout(r, hold));
			}

			if (!mountedRef.current) return;
			setShowOverlay(false);
		}

		run();
	}, [isReady, logoUrl, bgImageUrl, minBrandingMs, extraHoldMs]);

	if (!isReady) return null;

	return (
		<View style={{flex: 1}}>
			{children}
			{showOverlay ? (
				<View style={StyleSheet.absoluteFill}>
					<BrandingSplash />
				</View>
			) : null}
		</View>
	);
}
