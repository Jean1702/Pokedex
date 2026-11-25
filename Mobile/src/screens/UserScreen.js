import React, { useCallback, useContext, useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AvatarUser from '../components/AvatarUser';
import UserBottomNav from '../components/UserBottomNav';
import { AuthContext } from '../contexts/AuthContext';
import {
  listarCapturadosUsuario,
  listarFavoritosUsuario,
} from '../services/pokemon.service';
import { listarTimes } from '../services/team.service';
import { buscarUsuarioLogado } from '../services/user.service';
import { cores, fontes, espacos, bordas } from '../styles/theme';

const AVATARES_SUGERIDOS = [
  { id: 25, nome: 'Pikachu', uri: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png' },
  { id: 6, nome: 'Charizard', uri: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png' },
  { id: 94, nome: 'Gengar', uri: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/94.png' },
  { id: 133, nome: 'Eevee', uri: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/133.png' },
  { id: 448, nome: 'Lucario', uri: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/448.png' },
  { id: 150, nome: 'Mewtwo', uri: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png' },
];

function extrairNomeDoToken(token) {
  if (!token) return 'Treinador';
  try {
    const payloadBase64 = token.split('.')[1];
    if (!payloadBase64) return 'Treinador';
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
    if (!jsonString) return 'Treinador';
    const payload = JSON.parse(jsonString);
    return payload.name || payload.nome || 'Treinador';
  } catch {
    return 'Treinador';
  }
}

export default function UserScreen({ navigation }) {
  const { token, sair, fotoUsuario, atualizarFotoUsuario } = useContext(AuthContext);
  const [nomeTreinador, setNomeTreinador] = useState(() => extrairNomeDoToken(token));

  const [resumo, setResumo] = useState({
    times: 0,
    capturados: 0,
    shinies: 0,
    favoritos: 0,
  });
  const [carregandoResumo, setCarregandoResumo] = useState(true);

  const [modalFotoVisivel, setModalFotoVisivel] = useState(false);
  const [urlFotoDraft, setUrlFotoDraft] = useState('');

  const lidarCom401 = useCallback(async (err) => {
    if (err?.status === 401) {
      await sair();
      return true;
    }
    return false;
  }, [sair]);

  const carregarDadosTreinador = useCallback(async () => {
    if (!token) return;

    try {
      setCarregandoResumo(true);
      const [perfil, times, capturados, favoritos] = await Promise.all([
        buscarUsuarioLogado(token).catch(() => null),
        listarTimes(token),
        listarCapturadosUsuario(token),
        listarFavoritosUsuario(token),
      ]);

      if (perfil?.name) {
        setNomeTreinador(perfil.name);
      }

      const listaCap = Array.isArray(capturados) ? capturados : [];
      const totalShinies = listaCap.filter((row) => {
        const poke = row?.pokemons || row;
        return typeof poke?.shiny === 'boolean' ? poke.shiny : Boolean(row?.catch_shiny);
      }).length;

      setResumo({
        times: Array.isArray(times) ? times.length : 0,
        capturados: listaCap.length,
        shinies: totalShinies,
        favoritos: Array.isArray(favoritos) ? favoritos.length : 0,
      });
    } catch (e) {
      await lidarCom401(e);
    } finally {
      setCarregandoResumo(false);
    }
  }, [token, lidarCom401]);

  useEffect(() => {
    carregarDadosTreinador();
  }, [carregarDadosTreinador]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (token) {
        carregarDadosTreinador();
      }
    });
    return unsubscribe;
  }, [navigation, token, carregarDadosTreinador]);

  const abrirModalFoto = () => {
    setUrlFotoDraft(fotoUsuario || '');
    setModalFotoVisivel(true);
  };

  const handleEscolherArquivoLocal = async () => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (event) => {
        const arquivo = event.target?.files?.[0];
        if (!arquivo) return;
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            setUrlFotoDraft(reader.result);
          }
        };
        reader.readAsDataURL(arquivo);
      };
      input.click();
      return;
    }

    try {
      const ImagePicker = require('expo-image-picker');
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return;

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!res.canceled && res.assets?.[0]?.uri) {
        setUrlFotoDraft(res.assets[0].uri);
      }
    } catch {
      // Fallback via URL ou avatares sugeridos
    }
  };

  const handleSalvarFoto = async () => {
    await atualizarFotoUsuario(urlFotoDraft);
    setModalFotoVisivel(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollConteudo}
      >
        <LinearGradient
          colors={['#251B18', '#141418']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardPerfil}
        >
          <View style={styles.linhaPerfil}>
            <AvatarUser
              tamanho={72}
              nome={nomeTreinador}
              editavel
              onPress={abrirModalFoto}
            />

            <View style={styles.infoTreinador}>
              <Text style={styles.tagTreinador}>TREINADOR POKÉMON</Text>
              <Text style={styles.nomeTreinador} numberOfLines={1}>
                {nomeTreinador}
              </Text>
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={abrirModalFoto}
                style={styles.linkEditarFoto}
              >
                <Ionicons name="image-outline" size={13} color={cores.primaria} />
                <Text style={styles.textoLinkEditarFoto}>Alterar foto de perfil</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={sair}
              style={styles.botaoSair}
            >
              <Ionicons name="log-out-outline" size={18} color={cores.erro} />
              <Text style={styles.textoSair}>Sair</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.gradeEstatisticas}>
          <View style={styles.cardStat}>
            <Ionicons name="shield-half-outline" size={18} color={cores.primaria} />
            <Text style={styles.valorStat}>
              {carregandoResumo ? '--' : resumo.times}
            </Text>
            <Text style={styles.labelStat}>Times</Text>
          </View>

          <View style={styles.cardStat}>
            <MaterialCommunityIcons name="pokeball" size={18} color="#38BDF8" />
            <Text style={styles.valorStat}>
              {carregandoResumo ? '--' : resumo.capturados}
            </Text>
            <Text style={styles.labelStat}>Capturados</Text>
          </View>

          <View style={styles.cardStat}>
            <Ionicons name="sparkles" size={18} color="#FACC15" />
            <Text style={styles.valorStat}>
              {carregandoResumo ? '--' : resumo.shinies}
            </Text>
            <Text style={styles.labelStat}>Shinies</Text>
          </View>

          <View style={styles.cardStat}>
            <Ionicons name="star" size={18} color="#F59E0B" />
            <Text style={styles.valorStat}>
              {carregandoResumo ? '--' : resumo.favoritos}
            </Text>
            <Text style={styles.labelStat}>Favoritos</Text>
          </View>
        </View>

        <Text style={styles.tituloSecao}>Central do Treinador</Text>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate('TeamScreen')}
          style={[styles.cardAtalho, styles.cardAtalhoDestaque]}
        >
          <View style={[styles.iconeAtalho, { backgroundColor: cores.primariaClara }]}>
            <Ionicons name="people" size={22} color={cores.primaria} />
          </View>

          <View style={styles.textoAtalhoBox}>
            <View style={styles.linhaTituloAtalho}>
              <Text style={styles.tituloAtalho}>Meus Times</Text>
              <View style={styles.badgeAtalho}>
                <Text style={styles.textoBadgeAtalho}>{resumo.times}</Text>
              </View>
            </View>
            <Text style={styles.descAtalho}>
              Monte equipes de até 6 Pokémon com seus capturados ou da Pokédex
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={20} color={cores.primaria} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate('UserCapturedScreen')}
          style={styles.cardAtalho}
        >
          <View style={[styles.iconeAtalho, { backgroundColor: 'rgba(56, 189, 248, 0.14)' }]}>
            <MaterialCommunityIcons name="pokeball" size={22} color="#38BDF8" />
          </View>

          <View style={styles.textoAtalhoBox}>
            <View style={styles.linhaTituloAtalho}>
              <Text style={styles.tituloAtalho}>Pokémons Capturados</Text>
              <View style={styles.badgeAtalho}>
                <Text style={[styles.textoBadgeAtalho, { color: '#38BDF8' }]}>
                  {resumo.capturados}
                </Text>
              </View>
            </View>
            <Text style={styles.descAtalho}>
              Gerencie seus Pokémons normais e shinies capturados
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={20} color={cores.textoSecundario} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate('UserFavoritesScreen')}
          style={styles.cardAtalho}
        >
          <View style={[styles.iconeAtalho, { backgroundColor: 'rgba(245, 158, 11, 0.14)' }]}>
            <Ionicons name="star" size={22} color="#F59E0B" />
          </View>

          <View style={styles.textoAtalhoBox}>
            <View style={styles.linhaTituloAtalho}>
              <Text style={styles.tituloAtalho}>Favoritos</Text>
              <View style={styles.badgeAtalho}>
                <Text style={[styles.textoBadgeAtalho, { color: '#F59E0B' }]}>
                  {resumo.favoritos}
                </Text>
              </View>
            </View>
            <Text style={styles.descAtalho}>
              Acesse seus Pokémons marcados como favoritos
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={20} color={cores.textoSecundario} />
        </TouchableOpacity>
      </ScrollView>

      {/* Modal Alterar Foto de Perfil */}
      <Modal
        visible={modalFotoVisivel}
        transparent
        animationType="fade"
        onRequestClose={() => setModalFotoVisivel(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setModalFotoVisivel(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>Foto do Treinador</Text>
              <TouchableOpacity onPress={() => setModalFotoVisivel(false)}>
                <Ionicons name="close" size={20} color={cores.texto} />
              </TouchableOpacity>
            </View>

            <View style={styles.previewFotoBox}>
              <AvatarUser
                tamanho={86}
                uriOverride={urlFotoDraft}
                nome={nomeTreinador}
              />

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleEscolherArquivoLocal}
                style={styles.botaoUploadFoto}
              >
                <Ionicons name="folder-open-outline" size={16} color={cores.texto} />
                <Text style={styles.textoBotaoUpload}>Escolher imagem do dispositivo</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.labelInput}>Ou cole a URL da imagem</Text>
            <TextInput
              style={styles.input}
              placeholder="https://..."
              placeholderTextColor={cores.textoSecundario}
              value={urlFotoDraft.startsWith('data:') ? '' : urlFotoDraft}
              onChangeText={setUrlFotoDraft}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.labelInput}>Avatares rápidos</Text>
            <View style={styles.gradeAvataresRapidos}>
              {AVATARES_SUGERIDOS.map((av) => {
                const selecionado = urlFotoDraft === av.uri;
                return (
                  <TouchableOpacity
                    key={av.id}
                    activeOpacity={0.8}
                    onPress={() => setUrlFotoDraft(av.uri)}
                    style={[
                      styles.itemAvatarRapido,
                      selecionado && styles.itemAvatarRapidoAtivo,
                    ]}
                  >
                    <Image
                      source={{ uri: av.uri }}
                      resizeMode="contain"
                      style={styles.imgAvatarRapido}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.rodapeModalFoto}>
              {urlFotoDraft ? (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setUrlFotoDraft('')}
                  style={styles.botaoRemoverFoto}
                >
                  <Text style={styles.textoRemoverFoto}>Remover</Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSalvarFoto}
                style={styles.botaoConfirmarModal}
              >
                <Text style={styles.textoBotao}>Salvar Foto</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <UserBottomNav abaAtiva="perfil" navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
  scrollConteudo: {
    padding: espacos.medio,
    paddingBottom: espacos.grande * 1.5,
    gap: 14,
  },
  cardPerfil: {
    padding: espacos.medio,
    borderRadius: bordas.raio + 6,
    borderWidth: 1,
    borderColor: 'rgba(217, 80, 50, 0.3)',
  },
  linhaPerfil: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  infoTreinador: {
    flex: 1,
  },
  tagTreinador: {
    color: cores.primaria,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  nomeTreinador: {
    color: cores.texto,
    fontSize: fontes.titulo,
    fontWeight: '800',
    marginTop: 2,
  },
  linkEditarFoto: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 5,
  },
  textoLinkEditarFoto: {
    color: cores.primaria,
    fontSize: 12,
    fontWeight: '700',
  },
  botaoSair: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  textoSair: {
    color: cores.erro,
    fontSize: 12,
    fontWeight: '700',
  },
  gradeEstatisticas: {
    flexDirection: 'row',
    gap: 8,
  },
  cardStat: {
    flex: 1,
    backgroundColor: cores.superficie,
    borderRadius: bordas.raio + 2,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: cores.borda,
    alignItems: 'center',
    gap: 4,
  },
  valorStat: {
    color: cores.texto,
    fontSize: fontes.grande + 1,
    fontWeight: '800',
  },
  labelStat: {
    color: cores.textoSecundario,
    fontSize: 11,
    fontWeight: '600',
  },
  tituloSecao: {
    color: cores.texto,
    fontSize: fontes.grande,
    fontWeight: '800',
    marginTop: 2,
  },
  cardAtalho: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: cores.superficie,
    borderRadius: bordas.raio + 4,
    padding: espacos.medio,
    borderWidth: 1,
    borderColor: cores.borda,
  },
  cardAtalhoDestaque: {
    borderColor: 'rgba(217, 80, 50, 0.38)',
  },
  iconeAtalho: {
    width: 46,
    height: 46,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoAtalhoBox: {
    flex: 1,
    gap: 3,
  },
  linhaTituloAtalho: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tituloAtalho: {
    color: cores.texto,
    fontSize: fontes.normal + 1,
    fontWeight: '800',
  },
  badgeAtalho: {
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  textoBadgeAtalho: {
    color: cores.primaria,
    fontSize: 11,
    fontWeight: '800',
  },
  descAtalho: {
    color: cores.textoSecundario,
    fontSize: 12,
    lineHeight: 17,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: espacos.medio,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#18181D',
    borderRadius: 18,
    padding: espacos.medio + 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitulo: {
    color: cores.texto,
    fontSize: fontes.grande + 1,
    fontWeight: '800',
  },
  previewFotoBox: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  botaoUploadFoto: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: cores.fundo,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  textoBotaoUpload: {
    color: cores.texto,
    fontSize: 12,
    fontWeight: '700',
  },
  labelInput: {
    color: cores.textoSecundario,
    fontSize: 12,
    fontWeight: '700',
  },
  input: {
    height: 44,
    backgroundColor: cores.fundo,
    borderRadius: 11,
    paddingHorizontal: 12,
    color: cores.texto,
    borderWidth: 1,
    borderColor: cores.borda,
    outlineStyle: 'none',
  },
  gradeAvataresRapidos: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  itemAvatarRapido: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: cores.fundo,
    borderWidth: 1,
    borderColor: cores.borda,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  itemAvatarRapidoAtivo: {
    borderColor: cores.primaria,
    backgroundColor: cores.primariaClara,
  },
  imgAvatarRapido: {
    width: '85%',
    height: '85%',
  },
  rodapeModalFoto: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  botaoRemoverFoto: {
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 11,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoRemoverFoto: {
    color: cores.erro,
    fontSize: 12,
    fontWeight: '700',
  },
  botaoConfirmarModal: {
    flex: 1,
    height: 44,
    borderRadius: 11,
    backgroundColor: cores.primaria,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoBotao: {
    color: cores.texto,
    fontSize: fontes.normal,
    fontWeight: '700',
  },
});