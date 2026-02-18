// App.js — Stock Manager entry point with tab navigation
import 'react-native-gesture-handler';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ThemeProvider, useTheme } from './src/ThemeContext';

import DashboardScreen from './src/screens/DashboardScreen';
import ItemsScreen from './src/screens/ItemsScreen';
import ItemFormScreen from './src/screens/ItemFormScreen';
import CategoriesScreen from './src/screens/CategoriesScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import TransactionScreen from './src/screens/TransactionScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Error boundary to catch and display errors
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    render() {
        if (this.state.hasError) {
            return (
                <View style={errorStyles.container}>
                    <Text style={errorStyles.title}>⚠️ Error</Text>
                    <Text style={errorStyles.msg}>{this.state.error?.message || 'Unknown error'}</Text>
                    <Text style={errorStyles.hint}>Restart Expo Go to try again</Text>
                </View>
            );
        }
        return this.props.children;
    }
}

const errorStyles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f0f23', padding: 30 },
    title: { fontSize: 24, color: '#ef5350', fontWeight: '800', marginBottom: 12 },
    msg: { fontSize: 14, color: '#e8e8f0', textAlign: 'center', marginBottom: 16 },
    hint: { fontSize: 12, color: '#8888aa' },
});

function TabNavigator() {
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: colors.surface,
                    borderTopColor: colors.border,
                    borderTopWidth: 1,
                    height: 65 + insets.bottom,
                    paddingBottom: 8 + insets.bottom,
                    paddingTop: 8,
                },
                tabBarActiveTintColor: colors.accent,
                tabBarInactiveTintColor: colors.textMuted,
                tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    switch (route.name) {
                        case 'Dashboard': iconName = focused ? 'grid' : 'grid-outline'; break;
                        case 'Transactions': iconName = focused ? 'swap-horizontal' : 'swap-horizontal-outline'; break;
                        case 'Items': iconName = focused ? 'cube' : 'cube-outline'; break;
                        case 'Categories': iconName = focused ? 'folder' : 'folder-outline'; break;
                        case 'Reports': iconName = focused ? 'bar-chart' : 'bar-chart-outline'; break;
                        case 'Settings': iconName = focused ? 'settings' : 'settings-outline'; break;
                        default: iconName = 'ellipse';
                    }
                    return <Ionicons name={iconName} size={22} color={color} />;
                },
            })}
        >
            <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: 'Beranda' }} />
            <Tab.Screen name="Transactions" component={TransactionScreen} options={{ tabBarLabel: 'Transaksi' }} />
            <Tab.Screen name="Items" component={ItemsScreen} options={{ tabBarLabel: 'Inventaris' }} />
        </Tab.Navigator>
    );
}

function AppContent() {
    const { isDark } = useTheme();
    return (
        <NavigationContainer>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Main" component={TabNavigator} />
                <Stack.Screen name="ItemForm" component={ItemFormScreen} options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="Categories" component={CategoriesScreen} options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="Reports" component={ReportsScreen} options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="Settings" component={SettingsScreen} options={{ animation: 'slide_from_right' }} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}

export default function App() {
    return (
        <SafeAreaProvider>
            <ErrorBoundary>
                <ThemeProvider>
                    <AppContent />
                </ThemeProvider>
            </ErrorBoundary>
        </SafeAreaProvider>
    );
}
