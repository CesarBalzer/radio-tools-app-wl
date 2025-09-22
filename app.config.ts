import {ConfigContext, ExpoConfig} from 'expo/config';

export default ({config}: ConfigContext): ExpoConfig => ({
	name: 'Radio Tools',
	slug: 'expo-radio-white-label',
	version: '0.1.0',
	orientation: 'portrait',
	icon: './assets/icon.png',
	userInterfaceStyle: 'automatic',
	splash: {
		image: './assets/splash.png',
		resizeMode: 'contain',
		backgroundColor: '#000000'
	},
	ios: {
		supportsTablet: true,
		bundleIdentifier: 'br.com.radiotools.radios.app',
		infoPlist: {
			UIBackgroundModes: ['audio']
		}
	},
	android: {
		package: 'br.com.radiotools.radios.app',
		permissions: ['WAKE_LOCK', 'FOREGROUND_SERVICE', 'FOREGROUND_SERVICE_MEDIA_PLAYBACK', 'POST_NOTIFICATIONS'],
		adaptiveIcon: {
			foregroundImage: './assets/adaptive-icon.png',
			backgroundColor: '#000000'
		}
	},
	runtimeVersion: {
		policy: 'appVersion'
	},
	updates: {
		url: 'https://u.expo.dev/YOUR-PROJECT-ID'
	},
	extra: {
		TENANT: 'cliente-aurora', // cliente-radar / cliente-metro
		REMOTE_CONFIG_URL_TEMPLATE: 'https://kdsistemasweb.com.br/configs/{tenant}.json'
	},
	plugins: ['expo-video']
});
