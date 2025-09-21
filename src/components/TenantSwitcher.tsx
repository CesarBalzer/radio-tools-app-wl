// src/components/TenantSwitcher.tsx
import React from 'react';
import {View, TouchableOpacity, Text} from 'react-native';
import {useRemoteConfigControls} from '../config/RemoteConfigProvider';

export default function TenantSwitcher() {
	const {tenant, setTenant, refresh, currentUrl} = useRemoteConfigControls();

	const Btn = ({label, value}: {label: string; value: string}) => (
		<TouchableOpacity
			onPress={() => setTenant(value)}
			style={{padding: 10, margin: 6, borderRadius: 8, backgroundColor: tenant === value ? '#444' : '#222'}}
		>
			<Text style={{color: '#fff'}}>{label}</Text>
		</TouchableOpacity>
	);

	return (
		<View style={{padding: 12}}>
			<Text style={{color: '#fff', marginBottom: 8}}>Tenant atual: {tenant}</Text>
			<Text style={{color: '#bbb', marginBottom: 8, fontSize: 12}}>URL: {currentUrl ?? '-'}</Text>
			<View style={{flexDirection: 'row'}}>
				<Btn label="Aurora" value="cliente-aurora" />
				<Btn label="Radar" value="cliente-radar" />
				<Btn label="Metro" value="cliente-metro" />
			</View>
			<TouchableOpacity onPress={refresh} style={{padding: 10, marginTop: 8, borderRadius: 8, backgroundColor: '#333'}}>
				<Text style={{color: '#fff'}}>Forçar refresh</Text>
			</TouchableOpacity>
		</View>
	);
}
