import {useEffect, useRef} from 'react';
import {AppState, AppStateStatus} from 'react-native';
import {useRemoteConfig, useRemoteConfigControls} from '../config/RemoteConfigProvider';

const MIN_INTERVAL_SEC = 30;
const MAX_INTERVAL_SEC = 6 * 60 * 60;

function resolveIntervalSec(value: any) {
	const n = Number(value);
	if (!Number.isFinite(n) || n <= 0) return 1800;
	return Math.max(MIN_INTERVAL_SEC, Math.min(MAX_INTERVAL_SEC, Math.floor(n)));
}

export function useConfigAutoRefresh() {
	const cfg = useRemoteConfig();
	const {refresh} = useRemoteConfigControls();

	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const refreshingRef = useRef(false);

	const intervalSec = resolveIntervalSec(cfg?.features?.checkConfigIntervalSec);

	async function safeRefresh() {
		if (refreshingRef.current) return;
		refreshingRef.current = true;
		try {
			await refresh();
		} finally {
			refreshingRef.current = false;
		}
	}

	useEffect(() => {
		if (timerRef.current) clearInterval(timerRef.current);

		timerRef.current = setInterval(() => {
			void safeRefresh();
		}, intervalSec * 1000);

		return () => {
			if (timerRef.current) clearInterval(timerRef.current);
			timerRef.current = null;
		};
	}, [intervalSec]);

	useEffect(() => {
		const onChange = (state: AppStateStatus) => {
			if (state === 'active') {
				void safeRefresh();
			}
		};

		const sub = AppState.addEventListener('change', onChange);
		return () => sub.remove();
	}, []);
}
