import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Ionicons} from '@expo/vector-icons';
import {useTheme as useAppTheme} from '../theme/ThemeProvider';

import PlayerScreen from '../screens/PlayerScreen';
import LiveScreen from '../screens/LiveScreen';
import PromosScreen from '../screens/PromosScreen';

const Tab = createBottomTabNavigator();

export function Tabs() {
	const theme = useAppTheme();

	return (
		<Tab.Navigator
			initialRouteName="Rádio"
			screenOptions={{
				headerShown: false,
				tabBarActiveTintColor: theme.colors.primary,
				tabBarInactiveTintColor: theme.colors.muted,
				tabBarStyle: {
					backgroundColor: theme.colors.card,
					borderTopColor: theme.colors.border
				}
			}}
		>
			<Tab.Screen
				name="Rádio"
				component={PlayerScreen}
				options={{
					tabBarIcon: ({color, size, focused}) => <Ionicons name={focused ? 'play-circle' : 'play-circle-outline'} color={color} size={size ?? 22} />
				}}
			/>
			<Tab.Screen
				name="Live"
				component={LiveScreen}
				options={{
					tabBarIcon: ({color, size, focused}) => <Ionicons name={focused ? 'videocam' : 'videocam-outline'} color={color} size={size ?? 22} />
				}}
			/>
			<Tab.Screen
				name="Promos"
				component={PromosScreen}
				options={{
					tabBarIcon: ({color, size, focused}) => <Ionicons name={focused ? 'pricetags' : 'pricetags-outline'} color={color} size={size ?? 22} />
				}}
			/>
		</Tab.Navigator>
	);
}
