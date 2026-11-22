import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomHudPokemon from '../components/BottomHudPokemon';
import { AuthContext } from '../contexts/AuthContext';
import {
  buscarDetalhesAtaques,
  buscarPokemonPorId,
  capturarPokemon,
} from '../services/pokemon.service';
import { cores, fontes, espacos, bordas } from '../styles/theme';

const CORES_TIPO = {
  normal: { principal: '#A8A77A', fundo: '#4A4936', borda: 'rgba(168, 167, 122, 0.55)' },
  fire: { principal: '#FB923C', fundo: '#7C2D12', borda: 'rgba(251, 146, 60, 0.55)' },
  water: { principal: '#38BDF8', fundo: '#0C4A6E', borda: 'rgba(56, 189, 248, 0.55)' },
  grass: { principal: '#4ADE80', fundo: '#14532D', borda: 'rgba(74, 222, 128, 0.55)' },
  electric: { principal: '#FACC15', fundo: '#713F12', borda: 'rgba(250, 204, 21, 0.55)' },
  ice: { principal: '#67E8F9', fundo: '#164E63', borda: 'rgba(103, 232, 249, 0.55)' },
  fighting: { principal: '#F87171', fundo: '#7F1D1D', borda: 'rgba(248, 113, 113, 0.55)' },
  poison: { principal: '#C084FC', fundo: '#581C87', borda: 'rgba(192, 132, 252, 0.55)' },
  ground: { principal: '#FBBF24', fundo: '#78350F', borda: 'rgba(251, 191, 36, 0.55)' },
  flying: { principal: '#93C5FD', fundo: '#1E3A8A', borda: 'rgba(147, 197, 253, 0.55)' },
  psychic: { principal: '#F472B6', fundo: '#831843', borda: 'rgba(244, 114, 182, 0.55)' },
  bug: { principal: '#A3E635', fundo: '#365314', borda: 'rgba(163, 230, 53, 0.55)' },
  rock: { principal: '#D6D3D1', fundo: '#44403C', borda: 'rgba(214, 211, 209, 0.55)' },
  ghost: { principal: '#A855F7', fundo: '#3B0764', borda: 'rgba(168, 85, 247, 0.55)' },
  dragon: { principal: '#818CF8', fundo: '#312E81', borda: 'rgba(129, 140, 248, 0.55)' },
  dark: { principal: '#A1A1AA', fundo: '#27272A', borda: 'rgba(161, 161, 170, 0.55)' },
  steel: { principal: '#CBD5E1', fundo: '#334155', borda: 'rgba(203, 213, 225, 0.55)' },
  fairy: { principal: '#F9A8D4', fundo: '#701A75', borda: 'rgba(249, 168, 212, 0.55)' },
  default: { principal: cores.primaria, fundo: '#2A1815', borda: 'rgba(217, 80, 50, 0.5)' },
};

const METODOS_APRENDIZADO = [
  { id: 'todos', label: 'Todos', icone: 'apps-outline' },
  { id: 'level-up', label: 'Nível', icone: 'trending-up-outline' },
  { id: 'egg', label: 'Egg Group', icone: 'egg-outline' },
  { id: 'tutor', label: 'Treinador', icone: 'school-outline' },
  { id: 'machine', label: 'TM / HM', icone: 'disc-outline' },
];

const GERACOES_VERSAO = [
  { id: 'todas', label: 'Todas Gens', grupos: null },
  { id: 'gen1', label: 'Gen I', grupos: ['red-blue', 'yellow'] },
  { id: 'gen2', label: 'Gen II', grupos: ['gold-silver', 'crystal'] },
  { id: 'gen3', label: 'Gen III', grupos: ['ruby-sapphire', 'emerald', 'firered-leafgreen', 'colosseum', 'xd'] },
  { id: 'gen4', label: 'Gen IV', grupos: ['diamond-pearl', 'platinum', 'heartgold-soulsilver'] },
  { id: 'gen5', label: 'Gen V', grupos: ['black-white', 'black-2-white-2'] },
  { id: 'gen6', label: 'Gen VI', grupos: ['x-y', 'omega-ruby-alpha-sapphire'] },
  { id: 'gen7', label: 'Gen VII', grupos: ['sun-moon', 'ultra-sun-ultra-moon', 'lets-go-pikachu-lets-go-eevee'] },
  { id: 'gen8', label: 'Gen VIII', grupos: ['sword-shield', 'brilliant-diamond-and-shining-pearl', 'legends-arceus'] },
  { id: 'gen9', label: 'Gen IX', grupos: ['scarlet-violet'] },
];

const ROTULO_CLASSE_DANO = {
  physical: 'Físico',
  special: 'Especial',
  status: 'Status',
};

function obterEstiloTipo(tipo) {
  const chave = String(tipo || '').toLowerCase().trim();
  return CORES_TIPO[chave] || CORES_TIPO.default;
}

function formatarNomeGolpe(slug) {
  return String(slug || '')
    .split('-')
    .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1))
    .join(' ');
}

export default function AtaquePokemonScreen({ route, navigation }) {
  const { id, pokemon: pokemonParam } = route.params || {};
  const { token, sair } = useContext(AuthContext);

  const [pokemon, setPokemon] = useState(pokemonParam || null);
  const [carregandoPokemon, setCarregandoPokemon] = useState(!pokemonParam?.moves);
  const [carregandoDetalhes, setCarregandoDetalhes] = useState(false);
  const [erro, setErro] = useState('');

  const [metodoSelecionado, setMetodoSelecionado] = useState('todos');
  const [geracaoSelecionada, setGeracaoSelecionada] = useState('todas');
  const [detalhesMapa, setDetalhesMapa] = useState({});
  const [capturado, setCapturado] = useState(false);

  const carregarBase = useCallback(async () => {
    if (pokemonParam?.moves) {
      setPokemon(pokemonParam);
      setCarregandoPokemon(false);
      return;
    }

    if (!id) return;

    try {
      setCarregandoPokemon(true);
      setErro('');
      const dados = await buscarPokemonPorId(id);
      setPokemon(dados);
    } catch (e) {
      setErro(e.message || 'Erro ao carregar ataques do Pokémon.');
    } finally {
      setCarregandoPokemon(false);
    }
  }, [id, pokemonParam]);

  useEffect(() => {
    carregarBase();
  }, [carregarBase]);

  const ataquesFiltrados = useMemo(() => {
    if (!Array.isArray(pokemon?.moves)) return [];

    const genObj = GERACOES_VERSAO.find((g) => g.id === geracaoSelecionada);
    const gruposPermitidos = genObj?.grupos || null;

    const lista = [];

    pokemon.moves.forEach((entry) => {
      const detalhesVersao = entry.version_group_details || [];

      const combinacoesValidas = detalhesVersao.filter((vgd) => {
        const metodo = vgd.move_learn_method?.name;
        const grupo = vgd.version_group?.name;

        const bateMetodo =
          metodoSelecionado === 'todos' || metodo === metodoSelecionado;

        const bateGeracao =
          !gruposPermitidos || gruposPermitidos.includes(grupo);

        return bateMetodo && bateGeracao;
      });

      if (combinacoesValidas.length > 0) {
        const ultima = combinacoesValidas[combinacoesValidas.length - 1];
        lista.push({
          name: entry.move.name,
          metodo: ultima.move_learn_method?.name || 'level-up',
          nivel: ultima.level_learned_at || 0,
        });
      }
    });

    if (metodoSelecionado === 'level-up') {
      lista.sort((a, b) => a.nivel - b.nivel);
    }

    return lista;
  }, [pokemon, metodoSelecionado, geracaoSelecionada]);

  useEffect(() => {
    let ativo = true;

    const carregarInfoAtaques = async () => {
      if (ataquesFiltrados.length === 0) return;

      const nomes = ataquesFiltrados.map((a) => a.name);
      setCarregandoDetalhes(true);

      const mapa = await buscarDetalhesAtaques(nomes);
      if (ativo) {
        setDetalhesMapa((prev) => ({ ...prev, ...mapa }));
        setCarregandoDetalhes(false);
      }
    };

    carregarInfoAtaques();

    return () => {
      ativo = false;
    };
  }, [ataquesFiltrados]);

  const handleCapturar = async () => {
    if (!token) {
      navigation.navigate('LoginScreen');
      return;
    }

    const novoValor = !capturado;
    setCapturado(novoValor);

    try {
      await capturarPokemon(token, pokemon.id, novoValor);
    } catch (e) {
      setCapturado(!novoValor);
      if (e.status === 401) {
        await sair();
        navigation.navigate('LoginScreen');
      }
    }
  };

  if (carregandoPokemon) {
    return (
      <View style={styles.centralizado}>
        <ActivityIndicator size="large" color={cores.primaria} />
        <Text style={styles.textoStatus}>Carregando movimentos...</Text>
      </View>
    );
  }

  if (erro || !pokemon) {
    return (
      <View style={styles.centralizado}>
        <Text style={styles.textoErro}>{erro || 'Movimentos não encontrados.'}</Text>
        <TouchableOpacity
          style={styles.botaoVoltarErro}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.textoBotao}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const tiposPokemon = Array.isArray(pokemon.types) && pokemon.types.length > 0
    ? pokemon.types
    : ['normal'];

  return (
    <View style={styles.container}>
      <View style={styles.headerTopo}>
        <View style={styles.linhaAcoes}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.goBack()}
            style={styles.botaoVoltar}
          >
            <Ionicons name="arrow-back" size={20} color={cores.texto} />
          </TouchableOpacity>

          <Text style={styles.nomeTopo} numberOfLines={1}>
            {pokemon.name} #{String(pokemon.id).padStart(2, '0')}
          </Text>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleCapturar}
            style={[
              styles.botaoCaptura,
              capturado && styles.botaoCapturaAtivo,
            ]}
          >
            <View
              style={[
                styles.losangoCaptura,
                capturado && styles.losangoCapturaAtivo,
              ]}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.linhaTiposPokemon}>
          {tiposPokemon.map((t, index) => {
            const estilo = obterEstiloTipo(t);
            return (
              <View
                key={`${t}-${index}`}
                style={[
                  styles.pilulaTipoTopo,
                  { backgroundColor: `${estilo.fundo}CC`, borderColor: estilo.borda },
                ]}
              >
                <View style={[styles.pontoTipo, { backgroundColor: estilo.principal }]} />
                <Text style={[styles.textoTipoTopo, { color: estilo.principal }]}>
                  {t}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.divisorHorizontal} />

      <View style={styles.blocoFiltros}>
        <View style={styles.tituloFiltrosBox}>
          <Text style={styles.tituloFiltros}>Tipos de Ataque</Text>
          <Text style={styles.contadorAtaques}>
            {ataquesFiltrados.length}{' '}
            {ataquesFiltrados.length === 1 ? 'golpe' : 'golpes'}
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carrosselChips}
        >
          {METODOS_APRENDIZADO.map((item) => {
            const ativo = metodoSelecionado === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.8}
                onPress={() => setMetodoSelecionado(item.id)}
                style={[styles.chipFiltro, ativo && styles.chipFiltroAtivo]}
              >
                <Ionicons
                  name={item.icone}
                  size={14}
                  color={ativo ? cores.primaria : cores.textoSecundario}
                />
                <Text style={[styles.textoChip, ativo && styles.textoChipAtivo]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carrosselChips}
        >
          {GERACOES_VERSAO.map((gen) => {
            const ativa = geracaoSelecionada === gen.id;
            return (
              <TouchableOpacity
                key={gen.id}
                activeOpacity={0.8}
                onPress={() => setGeracaoSelecionada(gen.id)}
                style={[styles.chipGeracao, ativa && styles.chipGeracaoAtiva]}
              >
                <Text style={[styles.textoChipGen, ativa && styles.textoChipGenAtivo]}>
                  {gen.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.cabecalhoLista}>
        <Text style={styles.tituloLista}>Ataques / Tipos / Dano</Text>
        {carregandoDetalhes && (
          <ActivityIndicator size="small" color={cores.primaria} />
        )}
      </View>

      <FlatList
        data={ataquesFiltrados}
        keyExtractor={(item) => item.name}
        contentContainerStyle={styles.listaConteudo}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.vazioBox}>
            <Ionicons name="flash-off-outline" size={28} color={cores.textoSecundario} />
            <Text style={styles.textoVazio}>
              Nenhum ataque encontrado para essa geração e método.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const detalhe = detalhesMapa[item.name];
          const estiloTipo = obterEstiloTipo(detalhe?.type);
          const danoTexto =
            detalhe?.power !== null && detalhe?.power !== undefined
              ? String(detalhe.power)
              : '—';

          return (
            <View style={styles.cardAtaque}>
              <View style={styles.linhaPrincipalAtaque}>
                <View style={styles.colunaNomeAtaque}>
                  <Text style={styles.nomeAtaque} numberOfLines={1}>
                    {formatarNomeGolpe(item.name)}
                  </Text>

                  <View style={styles.metaLinha}>
                    {item.metodo === 'level-up' && item.nivel > 0 && (
                      <Text style={styles.tagMetodo}>Nv. {item.nivel}</Text>
                    )}
                    {item.metodo === 'egg' && (
                      <Text style={styles.tagMetodo}>Egg Group</Text>
                    )}
                    {item.metodo === 'tutor' && (
                      <Text style={styles.tagMetodo}>Treinador</Text>
                    )}
                    {item.metodo === 'machine' && (
                      <Text style={styles.tagMetodo}>TM / HM</Text>
                    )}

                    {detalhe?.damageClass && (
                      <Text style={styles.tagClasse}>
                        • {ROTULO_CLASSE_DANO[detalhe.damageClass] || detalhe.damageClass}
                      </Text>
                    )}
                  </View>
                </View>

                <View
                  style={[
                    styles.pilulaTipoAtaque,
                    {
                      backgroundColor: `${estiloTipo.fundo}CC`,
                      borderColor: estiloTipo.borda,
                    },
                  ]}
                >
                  <View style={[styles.pontoTipo, { backgroundColor: estiloTipo.principal }]} />
                  <Text style={[styles.textoTipoAtaque, { color: estiloTipo.principal }]}>
                    {detalhe?.type || '...'}
                  </Text>
                </View>

                <View style={styles.caixaDano}>
                  <Text style={styles.labelDano}>Dano</Text>
                  <Text style={styles.valorDano}>{danoTexto}</Text>
                </View>
              </View>

              <Text style={styles.descricaoAtaque}>
                {detalhe?.descricao || 'Carregando descrição do movimento...'}
              </Text>
            </View>
          );
        }}
      />

      <BottomHudPokemon
        abaAtiva="ataques"
        navigation={navigation}
        pokemon={pokemon}
      />
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
    backgroundColor: cores.fundo,
    justifyContent: 'center',
    alignItems: 'center',
    padding: espacos.grande,
  },
  headerTopo: {
    paddingTop: espacos.medio,
    paddingHorizontal: espacos.medio,
    paddingBottom: 12,
    backgroundColor: '#141418',
  },
  linhaAcoes: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  botaoVoltar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: cores.superficie,
    borderWidth: 1,
    borderColor: cores.borda,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nomeTopo: {
    flex: 1,
    color: cores.texto,
    fontSize: fontes.grande,
    fontWeight: '800',
    textTransform: 'capitalize',
    textAlign: 'center',
  },
  botaoCaptura: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: cores.superficie,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.24)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  botaoCapturaAtivo: {
    borderColor: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  losangoCaptura: {
    width: 15,
    height: 15,
    borderRadius: 3,
    borderWidth: 2,
    borderColor: cores.texto,
    transform: [{ rotate: '45deg' }],
  },
  losangoCapturaAtivo: {
    backgroundColor: '#F59E0B',
    borderColor: '#FEF3C7',
  },
  linhaTiposPokemon: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 6,
    marginTop: 10,
  },
  pilulaTipoTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9,
    borderWidth: 1,
  },
  pontoTipo: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  textoTipoTopo: {
    fontSize: fontes.pequena - 1,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  divisorHorizontal: {
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  blocoFiltros: {
    backgroundColor: cores.superficie,
    marginHorizontal: espacos.medio,
    marginTop: 12,
    borderRadius: bordas.raio + 2,
    padding: 12,
    borderWidth: 1,
    borderColor: cores.borda,
    gap: 10,
  },
  tituloFiltrosBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tituloFiltros: {
    color: cores.texto,
    fontSize: fontes.normal + 1,
    fontWeight: '700',
  },
  contadorAtaques: {
    color: cores.textoSecundario,
    fontSize: 12,
    fontWeight: '600',
  },
  carrosselChips: {
    gap: 7,
  },
  chipFiltro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: cores.fundo,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  chipFiltroAtivo: {
    borderColor: cores.primaria,
    backgroundColor: cores.primariaClara,
  },
  textoChip: {
    color: cores.textoSecundario,
    fontSize: fontes.pequena,
    fontWeight: '600',
  },
  textoChipAtivo: {
    color: cores.texto,
    fontWeight: '700',
  },
  chipGeracao: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: cores.fundo,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  chipGeracaoAtiva: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.16)',
  },
  textoChipGen: {
    color: cores.textoSecundario,
    fontSize: 11,
    fontWeight: '600',
  },
  textoChipGenAtivo: {
    color: '#38BDF8',
    fontWeight: '700',
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
    fontSize: fontes.normal,
    fontWeight: '700',
  },
  listaConteudo: {
    paddingHorizontal: espacos.medio,
    paddingBottom: espacos.grande,
    gap: 10,
  },
  cardAtaque: {
    backgroundColor: cores.superficie,
    borderRadius: bordas.raio + 2,
    padding: 12,
    borderWidth: 1,
    borderColor: cores.borda,
    gap: 8,
  },
  linhaPrincipalAtaque: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  colunaNomeAtaque: {
    flex: 1,
  },
  nomeAtaque: {
    color: cores.texto,
    fontSize: fontes.normal,
    fontWeight: '700',
  },
  metaLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  tagMetodo: {
    color: cores.primaria,
    fontSize: 11,
    fontWeight: '700',
  },
  tagClasse: {
    color: cores.textoSecundario,
    fontSize: 11,
    fontWeight: '600',
  },
  pilulaTipoAtaque: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9,
    borderWidth: 1,
  },
  textoTipoAtaque: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  caixaDano: {
    width: 48,
    backgroundColor: cores.fundo,
    borderRadius: 9,
    paddingVertical: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  labelDano: {
    color: cores.textoSecundario,
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  valorDano: {
    color: cores.texto,
    fontSize: fontes.normal,
    fontWeight: '800',
  },
  descricaoAtaque: {
    color: cores.textoSecundario,
    fontSize: fontes.pequena,
    lineHeight: 18,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 7,
  },
  vazioBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    gap: 8,
  },
  textoVazio: {
    color: cores.textoSecundario,
    fontSize: fontes.pequena + 1,
    textAlign: 'center',
  },
  textoStatus: {
    color: cores.textoSecundario,
    fontSize: fontes.normal,
    marginTop: espacos.medio,
  },
  textoErro: {
    color: cores.erro,
    fontSize: fontes.normal,
    textAlign: 'center',
    marginBottom: espacos.medio,
  },
  botaoVoltarErro: {
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
});