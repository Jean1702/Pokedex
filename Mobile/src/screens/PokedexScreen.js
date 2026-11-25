import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    FlatList,
    TextInput,
    ActivityIndicator,
    TouchableOpacity,
    Modal,
    Pressable,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import AvatarUser from '../components/AvatarUser';
import PokemonCard from '../components/PokemonCard';
import { TIPOS_OFICIAIS } from '../constants/tiposPokemon';
import { AuthContext } from '../contexts/AuthContext';
import {
    listarCapturadosUsuario,
    listarPokemons,
} from '../services/pokemon.service';
import { cores, fontes, espacos, bordas } from '../styles/theme';

const GERACOES = [
    { id: 'todas', label: 'Todas', regiao: 'Dex Completa', faixa: '001–1025', min: 1, max: 1025, cor: cores.primaria },
    { id: 'gen1', label: 'Gen I', regiao: 'Kanto', faixa: '001–151', min: 1, max: 151, cor: '#EF4444' },
    { id: 'gen2', label: 'Gen II', regiao: 'Johto', faixa: '152–251', min: 152, max: 251, cor: '#F59E0B' },
    { id: 'gen3', label: 'Gen III', regiao: 'Hoenn', faixa: '252–386', min: 252, max: 386, cor: '#10B981' },
    { id: 'gen4', label: 'Gen IV', regiao: 'Sinnoh', faixa: '387–493', min: 387, max: 493, cor: '#3B82F6' },
    { id: 'gen5', label: 'Gen V', regiao: 'Unova', faixa: '494–649', min: 494, max: 649, cor: '#6366F1' },
    { id: 'gen6', label: 'Gen VI', regiao: 'Kalos', faixa: '650–721', min: 650, max: 721, cor: '#EC4899' },
    { id: 'gen7', label: 'Gen VII', regiao: 'Alola', faixa: '722–809', min: 722, max: 809, cor: '#F97316' },
    { id: 'gen8', label: 'Gen VIII', regiao: 'Galar', faixa: '810–905', min: 810, max: 905, cor: '#14B8A6' },
    { id: 'gen9', label: 'Gen IX', regiao: 'Paldea', faixa: '906–1025', min: 906, max: 1025, cor: '#A855F7' },
];

const SUFIXOS_EXTRAS = [
    '-mega', '-gmax', '-alola', '-galar', '-hisui', '-paldea',
    '-totem', '-primal', '-origin', '-eternamax', '-blade', '-crowned',
];

function ehPokemonBase(pokemon) {
    const idNum = Number(pokemon.id);
    if (idNum > 1025) return false;
    const nome = (pokemon.name || '').toLowerCase();
    return !SUFIXOS_EXTRAS.some((sufixo) => nome.includes(sufixo));
}

export default function PokedexScreen({ navigation }) {
    const { token, sair } = useContext(AuthContext);

    const [pokemons, setPokemons] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [atualizando, setAtualizando] = useState(false);
    const [erro, setErro] = useState('');

    const [geracaoSelecionada, setGeracaoSelecionada] = useState(GERACOES[0]);
    const [tiposSelecionados, setTiposSelecionados] = useState([]);
    const [modoShiny, setModoShiny] = useState(false);
    const [modoCapturados, setModoCapturados] = useState(false);
    const [mapaCapturados, setMapaCapturados] = useState(() => new Map());
    const [busca, setBusca] = useState('');
    const [modalFiltro, setModalFiltro] = useState(null);

    const nomesTiposAtivos = useMemo(
        () => tiposSelecionados.map((t) => t.nome),
        [tiposSelecionados]
    );

    const carregarDados = useCallback(async (listaTipos = [], silencioso = false) => {
        try {
            if (!silencioso) setCarregando(true);
            setErro('');

            const dados = await listarPokemons(listaTipos);
            const listaLimpa = Array.isArray(dados) ? dados.filter(ehPokemonBase) : [];
            setPokemons(listaLimpa);
        } catch (e) {
            setErro(e.message || 'Erro ao carregar Pokémon.');
        } finally {
            setCarregando(false);
            setAtualizando(false);
        }
    }, []);

    const carregarCapturados = useCallback(async () => {
        if (!token) {
            setMapaCapturados(new Map());
            return;
        }

        try {
            const dados = await listarCapturadosUsuario(token);
            if (Array.isArray(dados)) {
                const novoMapa = new Map();
                dados.forEach((row) => {
                    const poke = row?.pokemons || row;
                    const idNum = Number(poke?.id || row?.id_pokemon);
                    if (Number.isNaN(idNum)) return;

                    const atual = novoMapa.get(idNum) || { normal: false, shiny: false };
                    const ehShinyRow =
                        typeof poke?.shiny === 'boolean' ? poke.shiny : Boolean(row?.catch_shiny);

                    if (ehShinyRow) {
                        atual.shiny = true;
                    } else {
                        atual.normal = true;
                    }
                    novoMapa.set(idNum, atual);
                });
                setMapaCapturados(novoMapa);
            }
        } catch (e) {
            if (e?.status === 401) {
                await sair();
                setModoCapturados(false);
            }
        }
    }, [token, sair]);

    useEffect(() => {
        carregarDados(nomesTiposAtivos);
    }, [nomesTiposAtivos, carregarDados]);

    useEffect(() => {
        if (!token) {
            setModoCapturados(false);
            setMapaCapturados(new Map());
            return;
        }
        carregarCapturados();
    }, [token, carregarCapturados]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            if (token) {
                carregarCapturados();
            }
        });
        return unsubscribe;
    }, [navigation, token, carregarCapturados]);

    const alternarModoCapturados = () => {
        if (!token) {
            navigation.navigate('LoginScreen');
            return;
        }
        setModoCapturados((prev) => !prev);
    };

    const alternarTipo = (tipoObj) => {
        setTiposSelecionados((prev) => {
            const jaExiste = prev.some((t) => t.nome === tipoObj.nome);
            if (jaExiste) {
                return prev.filter((t) => t.nome !== tipoObj.nome);
            }
            if (prev.length >= 2) {
                return [prev[1], tipoObj];
            }
            return [...prev, tipoObj];
        });
    };

    const pokemonsFiltrados = useMemo(() => {
        return pokemons.filter((p) => {
            const idNum = Number(p.id);
            const bateGeracao =
                idNum >= geracaoSelecionada.min && idNum <= geracaoSelecionada.max;

            const termo = busca.trim().toLowerCase();
            const bateBusca =
                !termo ||
                p.name?.toLowerCase().includes(termo) ||
                String(p.id).includes(termo);

            return bateGeracao && bateBusca;
        });
    }, [pokemons, geracaoSelecionada, busca]);

    const totalCapturadosNaLista = useMemo(() => {
        if (!modoCapturados) return 0;
        return pokemonsFiltrados.filter((p) => {
            const cap = mapaCapturados.get(Number(p.id));
            return modoShiny ? Boolean(cap?.shiny) : Boolean(cap?.normal);
        }).length;
    }, [modoCapturados, modoShiny, pokemonsFiltrados, mapaCapturados]);

    const temFiltroAtivo =
        geracaoSelecionada.id !== 'todas' ||
        tiposSelecionados.length > 0 ||
        modoShiny ||
        modoCapturados ||
        busca.trim().length > 0;

    const limparFiltros = () => {
        setGeracaoSelecionada(GERACOES[0]);
        setTiposSelecionados([]);
        setModoShiny(false);
        setModoCapturados(false);
        setBusca('');
    };

    const corPrimariaTipo = tiposSelecionados[0]?.cor || cores.textoSecundario;
    const textoChipTipo =
        tiposSelecionados.length === 0
            ? 'Tipo'
            : tiposSelecionados.map((t) => t.label).join(' + ');

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <View style={styles.linhaBusca}>
                    <AvatarUser
                        tamanho={44}
                        mostrarStatus
                        onPress={() => navigation.navigate(token ? 'UserScreen' : 'LoginScreen')}
                    />

                    <View style={styles.caixaBusca}>
                        <Ionicons name="search" size={17} color={cores.textoSecundario} />
                        <TextInput
                            style={styles.inputBusca}
                            placeholder="Buscar Pokémon ou #001..."
                            placeholderTextColor={cores.textoSecundario}
                            value={busca}
                            onChangeText={setBusca}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        {busca.length > 0 && (
                            <TouchableOpacity onPress={() => setBusca('')} hitSlop={8}>
                                <Ionicons name="close-circle" size={18} color={cores.textoSecundario} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                <View style={styles.linhaFiltros}>
                    <TouchableOpacity
                        activeOpacity={0.75}
                        onPress={() => setModalFiltro('geracao')}
                        style={[
                            styles.chipFiltro,
                            geracaoSelecionada.id !== 'todas' && {
                                borderColor: geracaoSelecionada.cor,
                                backgroundColor: `${geracaoSelecionada.cor}1F`,
                            },
                        ]}
                    >
                        <Ionicons
                            name="globe-outline"
                            size={14}
                            color={geracaoSelecionada.id !== 'todas' ? geracaoSelecionada.cor : cores.textoSecundario}
                        />
                        <Text style={styles.textoChipFiltro} numberOfLines={1}>
                            {geracaoSelecionada.id === 'todas' ? 'Geração' : geracaoSelecionada.regiao}
                        </Text>
                        <Ionicons name="chevron-down" size={13} color={cores.textoSecundario} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={0.75}
                        onPress={() => setModalFiltro('tipo')}
                        style={[
                            styles.chipFiltro,
                            tiposSelecionados.length > 0 && {
                                borderColor: corPrimariaTipo,
                                backgroundColor: `${corPrimariaTipo}1F`,
                            },
                        ]}
                    >
                        <View style={styles.grupoIconesChip}>
                            {tiposSelecionados.length === 0 ? (
                                <MaterialCommunityIcons
                                    name="shape-outline"
                                    size={14}
                                    color={cores.textoSecundario}
                                />
                            ) : (
                                tiposSelecionados.map((t) => (
                                    <MaterialCommunityIcons
                                        key={t.nome}
                                        name={t.icone}
                                        size={13}
                                        color={t.cor}
                                    />
                                ))
                            )}
                        </View>
                        <Text style={styles.textoChipFiltro} numberOfLines={1}>
                            {textoChipTipo}
                        </Text>
                        <Ionicons name="chevron-down" size={13} color={cores.textoSecundario} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={0.75}
                        onPress={() => setModoShiny((prev) => !prev)}
                        style={[styles.chipAcao, modoShiny && styles.chipShinyAtivo]}
                    >
                        <Ionicons
                            name={modoShiny ? 'sparkles' : 'sparkles-outline'}
                            size={14}
                            color={modoShiny ? '#FACC15' : cores.textoSecundario}
                        />
                        <Text style={[styles.textoChipFiltro, modoShiny && { color: '#FACC15' }]}>
                            Shiny
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={0.75}
                        onPress={alternarModoCapturados}
                        style={[styles.chipAcao, modoCapturados && styles.chipCapturadosAtivo]}
                    >
                        <MaterialCommunityIcons
                            name="pokeball"
                            size={15}
                            color={modoCapturados ? '#38BDF8' : cores.textoSecundario}
                        />
                        <Text style={[styles.textoChipFiltro, modoCapturados && { color: '#38BDF8' }]}>
                            Dex
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.barraStatus}>
                    <Text style={styles.textoContador}>
                        {modoCapturados
                            ? `${totalCapturadosNaLista} ${modoShiny ? 'shinies capturados' : 'capturados'} de ${pokemonsFiltrados.length} exibidos`
                            : `${pokemonsFiltrados.length} ${pokemonsFiltrados.length === 1 ? 'Pokémon exibido' : 'Pokémons exibidos'}`}
                    </Text>

                    {temFiltroAtivo && (
                        <TouchableOpacity onPress={limparFiltros} style={styles.botaoReset}>
                            <Text style={styles.textoReset}>Limpar filtros</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {carregando ? (
                <View style={styles.centralizado}>
                    <ActivityIndicator size="large" color={cores.primaria} />
                    <Text style={styles.textoStatus}>Carregando Pokémons...</Text>
                </View>
            ) : erro ? (
                <View style={styles.centralizado}>
                    <Text style={styles.textoErro}>{erro}</Text>
                    <TouchableOpacity
                        style={styles.botaoTentarNovamente}
                        onPress={() => carregarDados(nomesTiposAtivos)}
                    >
                        <Text style={styles.textoBotao}>Tentar novamente</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={pokemonsFiltrados}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={({ item }) => {
                        const captura = mapaCapturados.get(Number(item.id));
                        const exibirShinyCard = modoShiny || Boolean(item.shiny);
                        const capturadoNaVariante = modoShiny
                            ? Boolean(captura?.shiny)
                            : Boolean(captura?.normal);

                        return (
                            <PokemonCard
                                item={item}
                                modoShiny={exibirShinyCard}
                                bloqueadoBlur={modoCapturados && !capturadoNaVariante}
                                onAbrirDetalhe={(pokemonSelecionado) => {
                                    navigation.navigate('PokemonScreen', {
                                        id: pokemonSelecionado.id,
                                        shiny: exibirShinyCard,
                                    });
                                }}
                            />
                        );
                    }}
                    contentContainerStyle={styles.lista}
                    showsVerticalScrollIndicator={false}
                    refreshing={atualizando}
                    onRefresh={() => {
                        setAtualizando(true);
                        carregarDados(nomesTiposAtivos, true);
                        if (token) {
                            carregarCapturados();
                        }
                    }}
                    ListEmptyComponent={
                        <View style={styles.vazioContainer}>
                            <Ionicons name="search-outline" size={32} color={cores.textoSecundario} />
                            <Text style={styles.textoStatus}>Nenhum Pokémon encontrado.</Text>
                        </View>
                    }
                />
            )}

            <Modal
                visible={modalFiltro !== null}
                transparent
                animationType="fade"
                onRequestClose={() => setModalFiltro(null)}
            >
                <Pressable style={styles.modalBackdrop} onPress={() => setModalFiltro(null)}>
                    <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />

                    <Pressable style={styles.popoverCard} onPress={(e) => e.stopPropagation()}>
                        <View style={styles.popoverHeader}>
                            <View style={styles.popoverTituloGrupo}>
                                <Text style={styles.popoverTitulo}>
                                    {modalFiltro === 'geracao' ? 'Filtrar por Geração' : 'Filtrar por Elemento'}
                                </Text>
                                {modalFiltro === 'tipo' && (
                                    <View style={styles.badgeLimiteTipos}>
                                        <Text style={styles.textoLimiteTipos}>
                                            {tiposSelecionados.length}/2
                                        </Text>
                                    </View>
                                )}
                            </View>

                            <TouchableOpacity
                                onPress={() => setModalFiltro(null)}
                                style={styles.botaoFechar}
                            >
                                <Ionicons name="close" size={18} color={cores.texto} />
                            </TouchableOpacity>
                        </View>

                        {modalFiltro === 'geracao' ? (
                            <View style={styles.gridGeracoes}>
                                {GERACOES.map((gen) => {
                                    const ativa = geracaoSelecionada.id === gen.id;
                                    return (
                                        <TouchableOpacity
                                            key={gen.id}
                                            activeOpacity={0.75}
                                            onPress={() => {
                                                setGeracaoSelecionada(gen);
                                                setModalFiltro(null);
                                            }}
                                            style={[
                                                styles.itemGeracao,
                                                ativa && {
                                                    borderColor: gen.cor,
                                                    backgroundColor: `${gen.cor}1A`,
                                                },
                                            ]}
                                        >
                                            <View style={styles.itemGeracaoLinha}>
                                                <Text style={[styles.itemGeracaoRegiao, ativa && { color: gen.cor }]}>
                                                    {gen.regiao}
                                                </Text>
                                                {ativa && <Ionicons name="checkmark-circle" size={15} color={gen.cor} />}
                                            </View>
                                            <Text style={styles.itemGeracaoMeta}>
                                                {gen.label} • #{gen.faixa}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        ) : (
                            <View>
                                <View style={styles.gridTipos}>
                                    <TouchableOpacity
                                        activeOpacity={0.75}
                                        onPress={() => {
                                            setTiposSelecionados([]);
                                            setModalFiltro(null);
                                        }}
                                        style={[
                                            styles.itemTipo,
                                            tiposSelecionados.length === 0 && {
                                                borderColor: cores.primaria,
                                                backgroundColor: `${cores.primaria}24`,
                                            },
                                        ]}
                                    >
                                        <MaterialCommunityIcons
                                            name="shape-outline"
                                            size={14}
                                            color={cores.primaria}
                                        />
                                        <Text
                                            style={[
                                                styles.itemTipoTexto,
                                                tiposSelecionados.length === 0 && {
                                                    color: cores.texto,
                                                    fontWeight: '700',
                                                },
                                            ]}
                                            numberOfLines={1}
                                        >
                                            Todos
                                        </Text>
                                    </TouchableOpacity>

                                    {TIPOS_OFICIAIS.map((tipo) => {
                                        const indexSelecionado = tiposSelecionados.findIndex(
                                            (t) => t.nome === tipo.nome
                                        );
                                        const ativo = indexSelecionado !== -1;

                                        return (
                                            <TouchableOpacity
                                                key={tipo.nome}
                                                activeOpacity={0.75}
                                                onPress={() => alternarTipo(tipo)}
                                                style={[
                                                    styles.itemTipo,
                                                    ativo && {
                                                        borderColor: tipo.cor,
                                                        backgroundColor: `${tipo.cor}28`,
                                                    },
                                                ]}
                                            >
                                                <MaterialCommunityIcons
                                                    name={tipo.icone}
                                                    size={15}
                                                    color={ativo ? tipo.cor : `${tipo.cor}CC`}
                                                />
                                                <Text
                                                    style={[
                                                        styles.itemTipoTexto,
                                                        ativo && { color: cores.texto, fontWeight: '700' },
                                                    ]}
                                                    numberOfLines={1}
                                                >
                                                    {tipo.label}
                                                </Text>
                                                {ativo && (
                                                    <Text style={[styles.ordemSlotTexto, { color: tipo.cor }]}>
                                                        {indexSelecionado + 1}
                                                    </Text>
                                                )}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>

                                <View style={styles.rodapeModalTipos}>
                                    <TouchableOpacity
                                        activeOpacity={0.8}
                                        onPress={() => setTiposSelecionados([])}
                                        style={styles.botaoLimparModal}
                                    >
                                        <Text style={styles.textoLimparModal}>Limpar</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        activeOpacity={0.85}
                                        onPress={() => setModalFiltro(null)}
                                        style={styles.botaoAplicarModal}
                                    >
                                        <Text style={styles.textoAplicarModal}>Aplicar</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: cores.fundo,
        paddingHorizontal: espacos.medio,
        paddingTop: espacos.medio,
    },
    centralizado: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: espacos.grande,
    },
    headerContainer: {
        marginBottom: espacos.pequeno + 2,
        gap: 10,
    },
    linhaBusca: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    caixaBusca: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        height: 44,
        backgroundColor: cores.superficie,
        borderRadius: 14,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    inputBusca: {
        flex: 1,
        color: cores.texto,
        fontSize: fontes.normal,
        outlineStyle: 'none',
    },
    linhaFiltros: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    chipFiltro: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        height: 36,
        paddingHorizontal: 8,
        borderRadius: 11,
        backgroundColor: cores.superficie,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.09)',
    },
    chipAcao: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        height: 36,
        paddingHorizontal: 10,
        borderRadius: 11,
        backgroundColor: cores.superficie,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.09)',
    },
    chipShinyAtivo: {
        borderColor: 'rgba(250, 204, 21, 0.55)',
        backgroundColor: 'rgba(250, 204, 21, 0.14)',
    },
    chipCapturadosAtivo: {
        borderColor: 'rgba(56, 189, 248, 0.55)',
        backgroundColor: 'rgba(56, 189, 248, 0.14)',
    },
    textoChipFiltro: {
        color: cores.texto,
        fontSize: 12,
        fontWeight: '600',
        flexShrink: 1,
    },
    grupoIconesChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    barraStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 2,
    },
    textoContador: {
        color: cores.textoSecundario,
        fontSize: 12,
        fontWeight: '500',
    },
    botaoReset: {
        paddingVertical: 2,
        paddingHorizontal: 6,
    },
    textoReset: {
        color: cores.primaria,
        fontSize: 12,
        fontWeight: '700',
    },
    lista: {
        paddingBottom: espacos.grande,
    },
    vazioContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 48,
        gap: 8,
    },
    textoStatus: {
        color: cores.textoSecundario,
        fontSize: fontes.normal,
        textAlign: 'center',
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
        paddingVertical: espacos.pequeno + 4,
        borderRadius: bordas.raio,
    },
    textoBotao: {
        color: cores.texto,
        fontSize: fontes.normal,
        fontWeight: '600',
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: espacos.medio,
    },
    popoverCard: {
        width: '100%',
        maxWidth: 420,
        backgroundColor: '#18181D',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.14)',
        padding: espacos.medio + 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.5,
        shadowRadius: 24,
        elevation: 12,
    },
    popoverHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    popoverTituloGrupo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    popoverTitulo: {
        color: cores.texto,
        fontSize: fontes.grande,
        fontWeight: '700',
    },
    badgeLimiteTipos: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.09)',
    },
    textoLimiteTipos: {
        color: cores.primaria,
        fontSize: 12,
        fontWeight: '800',
    },
    botaoFechar: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    gridGeracoes: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 8,
    },
    itemGeracao: {
        width: '48.5%',
        backgroundColor: '#111115',
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.07)',
    },
    itemGeracaoLinha: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 2,
    },
    itemGeracaoRegiao: {
        color: cores.texto,
        fontSize: fontes.normal,
        fontWeight: '700',
    },
    itemGeracaoMeta: {
        color: cores.textoSecundario,
        fontSize: 11,
    },
    gridTipos: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 7,
    },
    itemTipo: {
        width: '31.5%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#111115',
        borderRadius: 10,
        paddingVertical: 9,
        paddingHorizontal: 9,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.07)',
    },
    itemTipoTexto: {
        color: cores.textoSecundario,
        fontSize: fontes.pequena,
        fontWeight: '600',
        flex: 1,
    },
    ordemSlotTexto: {
        fontSize: 11,
        fontWeight: '900',
    },
    rodapeModalTipos: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 10,
        marginTop: 14,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.08)',
    },
    botaoLimparModal: {
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
    },
    textoLimparModal: {
        color: cores.textoSecundario,
        fontSize: fontes.pequena,
        fontWeight: '700',
    },
    botaoAplicarModal: {
        paddingHorizontal: 18,
        paddingVertical: 9,
        borderRadius: 10,
        backgroundColor: cores.primaria,
    },
    textoAplicarModal: {
        color: cores.texto,
        fontSize: fontes.pequena,
        fontWeight: '700',
    },
});