import React, { useCallback, useContext, useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AvatarUser from '../components/AvatarUser';
import { AuthContext } from '../contexts/AuthContext';
import { criarTime, excluirTime, listarTimes } from '../services/team.service';
import { cores, fontes, espacos, bordas } from '../styles/theme';

function extrairNomeDoToken(token) {
  if (!token) return 'Treinador';
  try {
    const partes = token.split('.');
    if (partes.length < 2) return 'Treinador';
    const base64 = partes[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = JSON.parse(atob(base64));
    return json?.name || json?.usuario || 'Treinador';
  } catch {
    return 'Treinador';
  }
}

export default function UserScreen({ navigation }) {
  const { token, atualizarAvatar, sair } = useContext(AuthContext);

  const [times, setTimes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState('');

  const [novoTimeNome, setNovoTimeNome] = useState('');
  const [salvandoTime, setSalvandoTime] = useState(false);
  const [erroForm, setErroForm] = useState('');

  const nomeTreinador = extrairNomeDoToken(token);

  const lidarCom401 = useCallback(async (err) => {
    if (err?.status === 401) {
      await sair();
      return true;
    }
    return false;
  }, [sair]);

  const carregarTimes = useCallback(async (silencioso = false) => {
    if (!token) return;

    try {
      if (!silencioso) setCarregando(true);
      setErro('');

      const dados = await listarTimes(token);
      setTimes(Array.isArray(dados) ? dados : []);
    } catch (e) {
      const expirou = await lidarCom401(e);
      if (!expirou) {
        setErro(e.message || 'Erro ao carregar times.');
      }
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, [token, lidarCom401]);

  useEffect(() => {
    carregarTimes();
  }, [carregarTimes]);

  const escolherFotoPerfil = async () => {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      setErroForm('Permissão para acessar a galeria é necessária para alterar a foto.');
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!resultado.canceled && resultado.assets?.[0]?.uri) {
      setErroForm('');
      await atualizarAvatar(resultado.assets[0].uri);
    }
  };

  const handleCriarTime = async () => {
    if (!novoTimeNome.trim()) {
      setErroForm('Informe um nome para o time.');
      return;
    }

    try {
      setSalvandoTime(true);
      setErroForm('');
      await criarTime(token, novoTimeNome.trim());
      setNovoTimeNome('');
      await carregarTimes(true);
    } catch (e) {
      const expirou = await lidarCom401(e);
      if (!expirou) {
        setErroForm(e.message || 'Não foi possível criar o time.');
      }
    } finally {
      setSalvandoTime(false);
    }
  };

  const handleExcluirTime = async (idTime) => {
    try {
      setErro('');
      await excluirTime(token, idTime);
      setTimes((prev) => prev.filter((t) => t.id !== idTime));
    } catch (e) {
      const expirou = await lidarCom401(e);
      if (!expirou) {
        setErro(e.message || 'Não foi possível excluir o time.');
      }
    }
  };

  const handleSair = async () => {
    await sair();
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#232329', '#141418']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.headerUsuario}
      >
        <View style={styles.linhaTopo}>
          <AvatarUser
            tamanho={68}
            mostrarBadgeEdicao
            onPress={escolherFotoPerfil}
          />

          <View style={styles.infoTreinador}>
            <Text style={styles.tagPerfil}>TREINADOR</Text>
            <Text style={styles.nomeUsuario} numberOfLines={1}>
              {nomeTreinador}
            </Text>
            <TouchableOpacity onPress={escolherFotoPerfil} style={styles.linkFoto}>
              <Text style={styles.textoLinkFoto}>Alterar foto de perfil</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleSair}
            style={styles.botaoLogout}
          >
            <Ionicons name="log-out-outline" size={18} color={cores.erro} />
            <Text style={styles.textoLogout}>Sair</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.blocoNovoTime}>
        <Text style={styles.labelSecao}>Nome do Time</Text>
        <View style={styles.linhaInputTime}>
          <TextInput
            style={styles.inputTime}
            placeholder="Ex.: Time Kanto..."
            placeholderTextColor={cores.textoSecundario}
            value={novoTimeNome}
            onChangeText={setNovoTimeNome}
          />
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={salvandoTime}
            onPress={handleCriarTime}
            style={styles.botaoCriarTime}
          >
            {salvandoTime ? (
              <ActivityIndicator size="small" color={cores.texto} />
            ) : (
              <Ionicons name="add" size={22} color={cores.texto} />
            )}
          </TouchableOpacity>
        </View>
        {erroForm ? <Text style={styles.textoErroForm}>{erroForm}</Text> : null}
      </View>

      <View style={styles.cabecalhoLista}>
        <Text style={styles.tituloLista}>Meus Times</Text>
        <Text style={styles.contadorTimes}>
          {times.length} {times.length === 1 ? 'time' : 'times'}
        </Text>
      </View>

      {carregando ? (
        <View style={styles.centralizado}>
          <ActivityIndicator size="large" color={cores.primaria} />
          <Text style={styles.textoStatus}>Carregando times...</Text>
        </View>
      ) : erro ? (
        <View style={styles.centralizado}>
          <Text style={styles.textoErro}>{erro}</Text>
          <TouchableOpacity
            style={styles.botaoTentarNovamente}
            onPress={() => carregarTimes()}
          >
            <Text style={styles.textoBotao}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={times}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listaConteudo}
          showsVerticalScrollIndicator={false}
          refreshing={atualizando}
          onRefresh={() => {
            setAtualizando(true);
            carregarTimes(true);
          }}
          ListEmptyComponent={
            <View style={styles.vazioBox}>
              <Ionicons name="shield-outline" size={30} color={cores.textoSecundario} />
              <Text style={styles.textoStatus}>Nenhum time cadastrado ainda.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.cardTime}>
              <View style={styles.iconeTimeBox}>
                <Ionicons name="shield-half-outline" size={22} color={cores.primaria} />
              </View>

              <View style={styles.detalhesTime}>
                <Text style={styles.nomeTime} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.subTime}>
                  {Array.isArray(item.pokemons) ? `${item.pokemons.length} Pokémon` : 'Equipe'}
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => handleExcluirTime(item.id)}
                style={styles.botaoExcluir}
                hitSlop={8}
              >
                <Ionicons name="trash-outline" size={18} color={cores.erro} />
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <View style={styles.barraInferiorUsuario}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate('UserFavoritesScreen')}
          style={styles.botaoNavInferior}
        >
          <View style={styles.losangoFavoritos} />
          <Text style={styles.labelNavInferior}>Favoritos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate('PokedexScreen')}
          style={styles.botaoNavInferior}
        >
          <View style={styles.iconePokedexNav}>
            <View style={styles.circuloCentralNav} />
          </View>
          <Text style={styles.labelNavInferior}>Pokédex</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate('UserCapturedScreen')}
          style={styles.botaoNavInferior}
        >
          <View style={styles.circuloCapturados} />
          <Text style={styles.labelNavInferior}>Capturados</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
  centralizado: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: espacos.grande,
  },
  headerUsuario: {
    margin: espacos.medio,
    marginBottom: 12,
    padding: espacos.medio,
    borderRadius: bordas.raio + 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  linhaTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoTreinador: {
    flex: 1,
  },
  tagPerfil: {
    color: cores.primaria,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  nomeUsuario: {
    color: cores.texto,
    fontSize: fontes.titulo,
    fontWeight: '800',
    marginTop: 2,
  },
  linkFoto: {
    marginTop: 4,
  },
  textoLinkFoto: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '600',
  },
  botaoLogout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: bordas.raio,
    backgroundColor: cores.erroFundo,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  textoLogout: {
    color: cores.erro,
    fontSize: fontes.pequena,
    fontWeight: '700',
  },
  blocoNovoTime: {
    marginHorizontal: espacos.medio,
    backgroundColor: cores.superficie,
    borderRadius: bordas.raio + 2,
    padding: 12,
    borderWidth: 1,
    borderColor: cores.borda,
    gap: 8,
  },
  labelSecao: {
    color: cores.texto,
    fontSize: fontes.pequena,
    fontWeight: '700',
  },
  linhaInputTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputTime: {
    flex: 1,
    backgroundColor: cores.fundo,
    color: cores.texto,
    fontSize: fontes.normal,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: bordas.raio,
    borderWidth: 1,
    borderColor: cores.borda,
  },
  botaoCriarTime: {
    width: 42,
    height: 42,
    borderRadius: bordas.raio,
    backgroundColor: cores.primaria,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoErroForm: {
    color: cores.erro,
    fontSize: 12,
    fontWeight: '600',
  },
  cabecalhoLista: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: espacos.medio,
    marginTop: 14,
    marginBottom: 8,
  },
  tituloLista: {
    color: cores.texto,
    fontSize: fontes.grande,
    fontWeight: '700',
  },
  contadorTimes: {
    color: cores.textoSecundario,
    fontSize: 12,
    fontWeight: '600',
  },
  listaConteudo: {
    paddingHorizontal: espacos.medio,
    paddingBottom: espacos.grande,
    gap: 10,
  },
  cardTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: cores.superficie,
    borderRadius: bordas.raio + 2,
    padding: 12,
    borderWidth: 1,
    borderColor: cores.borda,
  },
  iconeTimeBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: cores.fundo,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detalhesTime: {
    flex: 1,
  },
  nomeTime: {
    color: cores.texto,
    fontSize: fontes.normal + 1,
    fontWeight: '700',
  },
  subTime: {
    color: cores.textoSecundario,
    fontSize: 12,
    marginTop: 2,
  },
  botaoExcluir: {
    padding: 6,
  },
  vazioBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    gap: 8,
  },
  textoStatus: {
    color: cores.textoSecundario,
    fontSize: fontes.normal,
    marginTop: espacos.pequeno,
  },
  textoErro: {
    color: cores.erro,
    fontSize: fontes.normal,
    textAlign: 'center',
    marginBottom: espacos.medio,
  },
  botaoTentarNovamente: {
    backgroundColor: cores.primaria,
    paddingHorizontal: espacos.grande,
    paddingVertical: 10,
    borderRadius: bordas.raio,
  },
  textoBotao: {
    color: cores.texto,
    fontSize: fontes.normal,
    fontWeight: '700',
  },
  barraInferiorUsuario: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#141418',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 10,
    paddingHorizontal: espacos.medio,
  },
  botaoNavInferior: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minWidth: 76,
  },
  losangoFavoritos: {
    width: 18,
    height: 18,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
    borderWidth: 1.5,
    borderColor: '#FEF3C7',
    transform: [{ rotate: '45deg' }],
    marginVertical: 2,
  },
  iconePokedexNav: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: cores.texto,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circuloCentralNav: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: cores.primaria,
  },
  circuloCapturados: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.18)',
  },
  labelNavInferior: {
    color: cores.textoSecundario,
    fontSize: 11,
    fontWeight: '600',
  },
});