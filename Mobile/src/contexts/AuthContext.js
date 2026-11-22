import React, { createContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as loginApi, registrar as registrarApi } from '../services/auth.service';

export const AuthContext = createContext(null);

const TOKEN_KEY = '@pokedex:token';
const AVATAR_KEY = '@pokedex:avatar';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [avatarUri, setAvatarUri] = useState(null);
  const [iniciando, setIniciando] = useState(true);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(TOKEN_KEY),
      AsyncStorage.getItem(AVATAR_KEY),
    ])
      .then(([tokenSalvo, avatarSalvo]) => {
        if (tokenSalvo) setToken(tokenSalvo);
        if (avatarSalvo) setAvatarUri(avatarSalvo);
      })
      .finally(() => setIniciando(false));
  }, []);

  const entrar = async (name, password) => {
    const dados = await loginApi(name, password);
    if (!dados?.token) {
      throw new Error('Token não retornado pelo servidor.');
    }
    await AsyncStorage.setItem(TOKEN_KEY, dados.token);
    setToken(dados.token);
  };

  const cadastrar = async (name, password) => {
    const dados = await registrarApi(name, password);
    if (dados?.token) {
      await AsyncStorage.setItem(TOKEN_KEY, dados.token);
      setToken(dados.token);
    } else {
      await entrar(name, password);
    }
  };

  const atualizarAvatar = async (uri) => {
    if (uri) {
      await AsyncStorage.setItem(AVATAR_KEY, uri);
      setAvatarUri(uri);
    } else {
      await AsyncStorage.removeItem(AVATAR_KEY);
      setAvatarUri(null);
    }
  };

  const sair = async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        avatarUri,
        iniciando,
        entrar,
        cadastrar,
        atualizarAvatar,
        sair,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}