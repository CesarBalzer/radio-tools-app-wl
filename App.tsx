import React from 'react';
import {ThemeProvider} from './src/theme/ThemeProvider';
import {useRemoteConfigProvider} from './src/config/RemoteConfigProvider';
import {ReadyApp} from './src/components/ReadyApp';
import {AppMain} from './src/AppMain';

export default function App() {
	const {isReady, ConfigProvider} = useRemoteConfigProvider();

	return (
		<ConfigProvider>
			<ThemeProvider>
				<ReadyApp isReady={isReady} minBrandingMs={2500}>
					<AppMain />
				</ReadyApp>
			</ThemeProvider>
		</ConfigProvider>
	);
}
