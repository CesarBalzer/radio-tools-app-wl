// src/config/RemoteConfigProvider.ts
import React, {createContext, useContext, useEffect, useMemo, useState, useCallback, useRef} from 'react';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, {AxiosRequestHeaders} from 'axios';
import type {RemoteConfig} from '../types';

/* ─────────── Defaults mínimos ─────────── */
const DEFAULT_CONFIG: RemoteConfig = {
	version: 1,
	branding: {primary: '#ACF44E', background: '#000000', text: '#FFFFFF'},
	streams: {radio: {primaryUrl: '', fallbackUrls: []}}
};

/* Storage keys base */
const KEY_BASE = 'remote-config-cache';
const TENANT_KEY = 'remote-config-tenant';
const ETAG_KEY_BASE = 'remote-config-etag';

/* Contextos */
const RemoteContext = createContext<{config: RemoteConfig}>({config: DEFAULT_CONFIG});
const ControlContext = createContext<{
	tenant: string;
	setTenant: (t: string) => Promise<void>;
	refresh: () => Promise<void>;
	currentUrl?: string;
}>({tenant: 'default', setTenant: async () => {}, refresh: async () => {}});

/* ─────────── Helpers ─────────── */
function getExtra(): any {
	// expo-dev: expoConfig.extra; EAS runtime: manifestExtra
	return (Constants as any)?.expoConfig?.extra ?? (Constants as any)?.manifestExtra ?? {};
}
function buildRemoteUrl(extra: any, tenant: string): string | undefined {
	const tpl = extra?.REMOTE_CONFIG_URL_TEMPLATE as string | undefined;
	if (tpl) return String(tpl).replace('{tenant}', tenant);
	return extra?.REMOTE_CONFIG_URL as string | undefined;
}

/* Sanitização */
function sanitizeConfig(input: any): RemoteConfig {
	try {
		const cfg: RemoteConfig = {
			version: Number(input?.version) || 1,
			branding: {
				primary: input?.branding?.primary ?? DEFAULT_CONFIG.branding.primary,
				background: input?.branding?.background ?? DEFAULT_CONFIG.branding.background,
				text: input?.branding?.text ?? DEFAULT_CONFIG.branding.text,
				logoUrl: typeof input?.branding?.logoUrl === 'string' ? input.branding.logoUrl : undefined,
				bgImageUrl: typeof input?.branding?.bgImageUrl === 'string' ? input.branding.bgImageUrl : undefined,

				// 👇 novos campos (opcionais)
				statusBarStyle: input?.branding?.statusBarStyle === 'dark' ? 'dark' : input?.branding?.statusBarStyle === 'light' ? 'light' : undefined,
				navigationMode: input?.branding?.navigationMode === 'light' ? 'light' : input?.branding?.navigationMode === 'dark' ? 'dark' : undefined,

				// overrides de cores opcionais (se quiser total controle do tema)
				muted: typeof input?.branding?.muted === 'string' ? input.branding.muted : undefined,
				border: typeof input?.branding?.border === 'string' ? input.branding.border : undefined,
				card: typeof input?.branding?.card === 'string' ? input.branding.card : undefined
			},
			streams: {
				radio: {
					primaryUrl: String(input?.streams?.radio?.primaryUrl || DEFAULT_CONFIG.streams.radio.primaryUrl),
					fallbackUrls: Array.isArray(input?.streams?.radio?.fallbackUrls) ? input.streams.radio.fallbackUrls : [],
					metadataUrl: typeof input?.streams?.radio?.metadataUrl === 'string' ? input.streams.radio.metadataUrl : undefined
				},
				video: input?.streams?.video?.primaryUrl
					? {
							primaryUrl: String(input.streams.video.primaryUrl),
							fallbackUrls: Array.isArray(input.streams.video?.fallbackUrls) ? input.streams.video.fallbackUrls : []
					  }
					: undefined
			},
			station: Array.isArray(input?.station?.partners)
				? {...input.station, partners: input.station.partners.filter((p: any) => p && typeof p.imageUrl === 'string')}
				: input?.station,
			promos: {
				headline: typeof input?.promos?.headline === 'string' ? input.promos.headline : undefined,
				items: Array.isArray(input?.promos?.items) ? input.promos.items : []
			},
			features: {
				enablePictureInPicture: Boolean(input?.features?.enablePictureInPicture),
				enableMiniPlayer: Boolean(input?.features?.enableMiniPlayer),
				checkConfigIntervalSec: Number(input?.features?.checkConfigIntervalSec || 1800)
			}
		};
		return cfg;
	} catch {
		return DEFAULT_CONFIG;
	}
}

/* ─────────── Provider ─────────── */
export function useRemoteConfigProvider() {
	const [isReady, setIsReady] = useState(false);
	const [tenant, setTenantState] = useState<string>('default');
	const [config, setConfig] = useState<RemoteConfig>(DEFAULT_CONFIG);
	const [currentUrl, setCurrentUrl] = useState<string | undefined>(undefined);
	const firstPaintDoneRef = useRef(false);

	// resolve tenant (AsyncStorage > app.json extra > 'default')
	useEffect(() => {
		(async () => {
			const extra = getExtra();
			const storedTenant = await AsyncStorage.getItem(TENANT_KEY);
			const t = storedTenant || extra.TENANT || 'default';
			setTenantState(t);
		})();
	}, []);

	const fetchRemote = useCallback(async (t: string) => {
		const extra = getExtra();
		const url = buildRemoteUrl(extra, t);
		if (!url) throw new Error('REMOTE_CONFIG_URL ausente');
		setCurrentUrl(url);

		// ETag condicional pra economizar e evitar flicker
		const etagKey = `${ETAG_KEY_BASE}:${t}`;
		const prevEtag = await AsyncStorage.getItem(etagKey);

		const headers = {} as Record<string, string>;
		if (prevEtag) headers['If-None-Match'] = prevEtag;

		const doTry = async (attempt: number) => {
			try {
				const resp = await axios.get(url, {timeout: 7000, headers});
				if (resp.status === 304) return {updated: false as const};
				const parsed = sanitizeConfig(resp.data);
				setConfig(parsed);
				await AsyncStorage.setItem(`${KEY_BASE}:${t}`, JSON.stringify(parsed));
				const newEtag = String(resp.headers?.etag || '');
				if (newEtag) await AsyncStorage.setItem(etagKey, newEtag);
				return {updated: true as const};
			} catch (e: any) {
				if (attempt < 2) {
					await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
					return doTry(attempt + 1);
				}
				throw e;
			}
		};

		return doTry(0);
	}, []);

	const hydrateFromCache = useCallback(async (t: string) => {
		const cachedStr = await AsyncStorage.getItem(`${KEY_BASE}:${t}`);
		if (cachedStr) {
			const cached = sanitizeConfig(JSON.parse(cachedStr));
			setConfig(cached);
			return true;
		}
		return false;
	}, []);

	const refresh = useCallback(async () => {
		// usado por UI ou troca de tenant
		await fetchRemote(tenant);
	}, [fetchRemote, tenant]);

	// bootstrap: cache-first, fetch-second, com splash
	useEffect(() => {
		if (!tenant) return;
		(async () => {
			const hadCache = await hydrateFromCache(tenant);
			if (hadCache && !firstPaintDoneRef.current) {
				// já podemos liberar a UI com a marca do cliente
				setIsReady(true);
				firstPaintDoneRef.current = true;
			}
			try {
				await fetchRemote(tenant);
			} finally {
				if (!firstPaintDoneRef.current) {
					setIsReady(true);
					firstPaintDoneRef.current = true;
				}
			}
		})();
	}, [tenant, hydrateFromCache, fetchRemote]);

	// troca de tenant em runtime
	const setTenant = useCallback(
		async (t: string) => {
			if (!t || t === tenant) return;
			await AsyncStorage.setItem(TENANT_KEY, t);
			firstPaintDoneRef.current = false;
			setIsReady(false);
			setTenantState(t);
			// o efeito acima rehidrata do cache e faz fetch
		},
		[tenant]
	);

	const providerValue = useMemo(() => ({config}), [config]);
	const controlsValue = useMemo(() => ({tenant, setTenant, refresh, currentUrl}), [tenant, setTenant, refresh, currentUrl]);

	const ConfigProvider: React.FC<{children: React.ReactNode}> = ({children}) => (
		<ControlContext.Provider value={controlsValue}>
			<RemoteContext.Provider value={providerValue}>{children}</RemoteContext.Provider>
		</ControlContext.Provider>
	);

	return {isReady, ConfigProvider};
}

/* Hooks de consumo */
export function useRemoteConfig() {
	return useContext(RemoteContext).config;
}
export function useRemoteConfigControls() {
	return useContext(ControlContext);
}
