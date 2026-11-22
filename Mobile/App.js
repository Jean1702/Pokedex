import React, { useContext } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AuthContext, AuthProvider } from './src/contexts/AuthContext';
import { cores } from './src/styles/theme';
import HomeScreen from './src/screens/HomeScreen';
import PokedexScreen from './src/screens/PokedexScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import PokemonScreen from './src/screens/PokemonScreen';
import AttacksPokemonScreen from './src/screens/AttacksPokemonScreen';
import InfoPokemonScreen from './src/screens/InfoPokemonScreen';
import UserScreen from './src/screens/UserScreen';

const Stack = createNativeStackNavigator();

function Rotas() {
  const { token, iniciando } = useContext(AuthContext);

  if (iniciando) {
    return (
      <View style={{ flex: 1, backgroundColor: cores.fundo, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={cores.primaria} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: cores.fundo },
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="PokedexScreen" component={PokedexScreen} />
      <Stack.Screen name="PokemonScreen" component={PokemonScreen} />
      <Stack.Screen name="AttacksPokemonScreen" component={AttacksPokemonScreen} />
      <Stack.Screen name="InfoPokemonScreen" component={InfoPokemonScreen} />


      {token ? (
        <>
        <Stack.Screen name="UserScreen" component={UserScreen} />

        </>
      ) : (
        <>
          <Stack.Screen name="LoginScreen" component={LoginScreen} />
          <Stack.Screen name="RegisterScreen" component={RegisterScreen} />

        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Rotas />
      </NavigationContainer>
    </AuthProvider>
  );
}