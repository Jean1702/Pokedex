import React, { createContext, useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { request } from '../services/api';

const CHAVE_TOKEN = '@pokedex:token';
const PREFIXO_FOTO = '@pokedex:foto_usuario_';

function ehJwtValido(valor) {
  return typeof valor === 'string' && valor.split('.').length === 3;
}

function obterChaveFotoPorToken(token) {
  if (!ehJwtValido(token)) return null;
  try {
    const payloadBase64 = token.split('.')[1];
    const base64Normalizado = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
    const jsonString =
      typeof atob === 'function'
        ? decodeURIComponent(
          atob(base64Normalizado)
            .split('')
            .map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
            .join('')
        )
        : '';
    if (!jsonString) return null;
    const payload = JSON.parse(jsonString);
    const identificador = payload.id ?? payload.sub ?? payload.name ?? payload.nome;
    return identificador != null ? `${PREFIXO_FOTO}${String(identificador)}` : null;
  } catch {
    return null;
  }
}

export const AuthContext = createContext({
  token: null,
  fotoUsuario: null,
  iniciando: true,
  carregandoSessao: true,
  entrar: async () => { },
  logar: async () => { },
  cadastrar: async () => { },
  sair: async () => { },
  atualizarFotoUsuario: async () => { },
});

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [fotoUsuario, setFotoUsuario] = useState(null);
  const [iniciando, setIniciando] = useState(true);

  useEffect(() => {
    let ativo = true;

    const restaurarSessao = async () => {
      try {
        const tokenSalvo = await AsyncStorage.getItem(CHAVE_TOKEN);
        if (!ativo) return;

        if (ehJwtValido(tokenSalvo)) {
          setToken(tokenSalvo);
          const chaveFoto = obterChaveFotoPorToken(tokenSalvo);
          const fotoSalva = chaveFoto ? await AsyncStorage.getItem(chaveFoto) : null;
          if (ativo) {
            setFotoUsuario(fotoSalva || null);
          }
        } else {
          if (tokenSalvo) {
            await AsyncStorage.removeItem(CHAVE_TOKEN);
          }
          setToken(null);
          setFotoUsuario(null);
        }
      } catch (e) {
        console.warn('[AuthContext] Erro ao restaurar sessão:', e);
      } finally {
        if (ativo) setIniciando(false);
      }
    };

    restaurarSessao();

    return () => {
      ativo = false;
    };
  }, []);

  const salvarSessao = useCallback(async (novoToken, fotoInicial = null) => {
    if (!ehJwtValido(novoToken)) {
      throw new Error('Token de autenticação inválido.');
    }

    setToken(novoToken);
    await AsyncStorage.setItem(CHAVE_TOKEN, novoToken);

    const chaveFoto = obterChaveFotoPorToken(novoToken);

    if (fotoInicial) {
      setFotoUsuario(fotoInicial);
      if (chaveFoto) {
        await AsyncStorage.setItem(chaveFoto, fotoInicial);
      }
      return;
    }

    if (chaveFoto) {
      const fotoSalvaUsuario = await AsyncStorage.getItem(chaveFoto);
      setFotoUsuario(fotoSalvaUsuario || null);
    } else {
      setFotoUsuario(null);
    }
  }, []);

  const logar = useCallback(async (name, password) => {
    const resposta = await request('/auth/login', {
      method: 'POST',
      body: { name, password },
    });

    const tokenRecebido = resposta?.token;
    if (!tokenRecebido) {
      throw new Error(resposta?.erro || 'Token não retornado pelo servidor.');
    }

    await salvarSessao(tokenRecebido, resposta?.user?.image || null);
    return resposta;
  }, [salvarSessao]);

  const entrar = useCallback(async (usuarioOuToken, senhaOuFoto = null) => {
    if (ehJwtValido(usuarioOuToken)) {
      return salvarSessao(usuarioOuToken, senhaOuFoto);
    }
    return logar(usuarioOuToken, senhaOuFoto);
  }, [salvarSessao, logar]);

  const cadastrar = useCallback(async (name, password) => {
    const resposta = await request('/auth/register', {
      method: 'POST',
      body: { name, password },
    });

    if (ehJwtValido(resposta?.token)) {
      await salvarSessao(resposta.token, resposta?.user?.image || null);
      return resposta;
    }

    return logar(name, password);
  }, [salvarSessao, logar]);

  const atualizarFotoUsuario = useCallback(async (novaUri) => {
    const uriLimpa = novaUri ? String(novaUri).trim() : null;
    setFotoUsuario(uriLimpa);

    const chaveFoto = obterChaveFotoPorToken(token);
    if (!chaveFoto) return;

    if (uriLimpa) {
      await AsyncStorage.setItem(chaveFoto, uriLimpa);
    } else {
      await AsyncStorage.removeItem(chaveFoto);
    }
  }, [token]);

  const sair = useCallback(async () => {
    setToken(null);
    setFotoUsuario(null);
    await AsyncStorage.removeItem(CHAVE_TOKEN);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        fotoUsuario,
        iniciando,
        carregandoSessao: iniciando,
        entrar,
        logar,
        cadastrar,
        sair,
        atualizarFotoUsuario,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}