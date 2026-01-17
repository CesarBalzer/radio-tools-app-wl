import {useEffect} from 'react';
import {Platform} from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import {luminanceOf} from '../utils/format';
import {useTheme as useAppTheme} from '../theme/ThemeProvider';

export function useAndroidNavBarTheming() {
	const t = useAppTheme();

	useEffect(() => {
		if (Platform.OS !== 'android') return;

		const bg = t.colors.card;
		const btnStyle = luminanceOf(bg) > 0.55 ? 'dark' : 'light';

		NavigationBar.setBackgroundColorAsync(bg).catch(() => {});
		NavigationBar.setButtonStyleAsync(btnStyle as 'light' | 'dark').catch(() => {});
		NavigationBar.setBorderColorAsync('#00000000').catch(() => {});
	}, [t.colors.card]);
}
