import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {StatusBar} from 'expo-status-bar';
import {useTheme as useAppTheme} from './theme/ThemeProvider';
import {useConfigAutoRefresh} from './hooks/useConfigAutoRefresh';
import {useAndroidNavBarTheming} from './hooks/useAndroidNavBarTheming';
import {Tabs} from './navigation/Tabs';

export function AppMain() {
	const theme = useAppTheme();

	useAndroidNavBarTheming();
	useConfigAutoRefresh();

	return (
		<NavigationContainer theme={theme.navigationTheme}>
			<Tabs />
			<StatusBar style={theme.statusBarStyle} />
		</NavigationContainer>
	);
}
