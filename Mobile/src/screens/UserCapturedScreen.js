import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    FlatList,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Modal,
    Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import AvatarUser from '../components/AvatarUser';
import PokemonCard from '../components/PokemonCard';
import UserBottomNav from '../components/UserBottomNav';
import { TIPOS_OFICIAIS } from '../constants/tiposPokemon';
import { AuthContext } from '../contexts/AuthContext';
import {
    capturarPokemon,
    listarCapturadosUsuario,
} from '../services/pokemon.service';
import { cores, fontes, espacos, bordas } from '../styles/theme';

const GERACOES = [
    { id: 'todas', label: 'Todas', regiao: 'Dex Completa', faixa: '001–1025', min: 1, max: 1025, cor: '#38BDF8' },
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

function normalizarListaPokemons(dados) {
    if (!Array.isArray(dados)) return [];
    return dados
        .map((item) => {
            const base = item?.pokemons || item?.pokemon || item;
            if (!base || !base.id) return null;

            const ehShiny =
                typeof base.shiny === 'boolean' ? base.shiny : Boolean(item?.catch_shiny);

            return {
                ...base,
                shiny: ehShiny,
                types: Array.isArray(base.types)
                    ? base.types
                    : Array.isArray(base.pokemon_types)
                        ? base.pokemon_types
                            .sort((a, b) => (a.slot || 0) - (b.slot || 0))
                            .map((pt) => pt?.types?.name || pt?.name)
                            .filter(Boolean)
                        : [],
            };
        })
        .filter(Boolean);
}

export default function UserCapturedScreen({ navigation }) {
    const { token, sair } = useContext(AuthContext);

    const [capturados, setCapturados] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [atualizando, setAtualizando] = useState(false);
    const [erro, setErro] = useState('');

    const [geracaoSelecionada, setGeracaoSelecionada] = useState(GERACOES[0]);
    const [tiposSelecionados, setTiposSelecionados] = useState([]);
    const [apenasShiny, setApenasShiny] = useState(false);
    const [busca, setBusca] = useState('');
    const [modalFiltro, setModalFiltro] = useState(null);

    const carregarCapturados = useCallback(async (silencioso = false) => {
        if (!token) return;

        try {
            if (!silencioso) setCarregando(true);
            setErro('');

            const dados = await listarCapturadosUsuario(token);
            setCapturados(normalizarListaPokemons(dados));
        } catch (e) {
            if (e?.status === 401) {
                await sair();
                return;
            }
            setErro(e.message || 'Erro ao carregar Pokémon capturados.');
        } finally {
            setCarregando(false);
            setAtualizando(false);
        }
    }, [token, sair]);

    useEffect(() => {
        carregarCapturados();
    }, [carregarCapturados]);

    const handleLiberarPokemon = async (pokemonId, ehShiny) => {
        const backup = capturados;
        setCapturados((prev) =>
            prev.filter((p) => !(p.id === pokemonId && Boolean(p.shiny) === Boolean(ehShiny)))
        );

        try {
            await capturarPokemon(token, pokemonId, false, Boolean(ehShiny));
        } catch (e) {
            setCapturados(backup);
            if (e?.status === 401) {
                await sair();
            }
        }
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

    const capturadosFiltrados = useMemo(() => {
        const termo = busca.trim().toLowerCase();
        const nomesTipos = tiposSelecionados.map((t) => t.nome.toLowerCase());

        return capturados.filter((p) => {
            const idNum = Number(p.id);
            const bateGeracao =
                idNum >= geracaoSelecionada.min && idNum <= geracaoSelecionada.max;

            const bateBusca =
                !termo ||
                p.name?.toLowerCase().includes(termo) ||
                String(p.id).includes(termo);

            const bateShiny = !apenasShiny || Boolean(p.shiny);

            const tiposPoke = Array.isArray(p.types)
                ? p.types.map((t) => String(t).toLowerCase())
                : [];
            const bateTipos =
                nomesTipos.length === 0 ||
                nomesTipos.every((t) => tiposPoke.includes(t));

            return bateGeracao && bateBusca && bateShiny && bateTipos;
        });
    }, [capturados, geracaoSelecionada, busca, apenasShiny, tiposSelecionados]);

    const temFiltroAtivo =
        geracaoSelecionada.id !== 'todas' ||
        tiposSelecionados.length > 0 ||
        apenasShiny ||
        busca.trim().length > 0;

    const limparFiltros = () => {
        setGeracaoSelecionada(GERACOES[0]);
        setTiposSelecionados([]);
        setApenasShiny(false);
        setBusca('');
    };

    const corPrimariaTipo = tiposSelecionados[0]?.cor || cores.textoSecundario;
    const textoChipTipo =
        tiposSelecionados.length === 0
            ? 'Tipo'
            : tiposSelecionados.map((t) => t.label).join(' + ');

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#13232E', '#141418']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.headerTela}
            >
                <View style={styles.linhaTopo}>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => navigation.navigate('UserScreen')}
                        style={styles.botaoVoltar}
                    >
                        <Ionicons name="arrow-back" size={20} color={cores.texto} />
                    </TouchableOpacity>

                    <View style={styles.tituloBox}>
                        <Text style={styles.tagSubtitulo}>REGISTRO DE CAPTURA</Text>
                        <Text style={styles.tituloPrincipal}>Capturados</Text>
                    </View>

                    <AvatarUser
                        tamanho={44}
                        onPress={() => navigation.navigate('UserScreen')}
                    />
                </View>
            </LinearGradient>

            <View style={styles.areaFiltros}>
                <View style={styles.caixaBusca}>
                    <Ionicons name="search" size={16} color={cores.textoSecundario} />
                    <TextInput
                        style={styles.inputBusca}
                        placeholder="Buscar capturado ou #001..."
                        placeholderTextColor={cores.textoSecundario}
                        value={busca}
                        onChangeText={setBusca}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    {busca.length > 0 && (
                        <TouchableOpacity onPress={() => setBusca('')} hitSlop={8}>
                            <Ionicons name="close-circle" size={17} color={cores.textoSecundario} />
                        </TouchableOpacity>
                    )}
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
                        onPress={() => setApenasShiny((prev) => !prev)}
                        style={[styles.chipAcao, apenasShiny && styles.chipShinyAtivo]}
                    >
                        <Ionicons
                            name={apenasShiny ? 'sparkles' : 'sparkles-outline'}
                            size={14}
                            color={apenasShiny ? '#FACC15' : cores.textoSecundario}
                        />
                        <Text style={[styles.textoChipFiltro, apenasShiny && { color: '#FACC15' }]}>
                            Shiny
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.barraStatus}>
                    <Text style={styles.textoContador}>
                        {temFiltroAtivo
                            ? `${capturadosFiltrados.length} de ${capturados.length} capturados`
                            : `${capturados.length} ${capturados.length === 1 ? 'Pokémon capturado' : 'Pokémons capturados'}`}
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
                    <ActivityIndicator size="large" color="#38BDF8" />
                    <Text style={styles.textoStatus}>Carregando capturados...</Text>
                </View>
            ) : erro ? (
                <View style={styles.centralizado}>
                    <Text style={styles.textoErro}>{erro}</Text>
                    <TouchableOpacity
                        style={styles.botaoTentarNovamente}
                        onPress={() => carregarCapturados()}
                    >
                        <Text style={styles.textoBotao}>Tentar novamente</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={capturadosFiltrados}
                    keyExtractor={(item) => `${item.id}-${item.shiny ? 'shiny' : 'normal'}`}
                    contentContainerStyle={styles.listaConteudo}
                    showsVerticalScrollIndicator={false}
                    refreshing={atualizando}
                    onRefresh={() => {
                        setAtualizando(true);
                        carregarCapturados(true);
                    }}
                    ListEmptyComponent={
                        <View style={styles.vazioBox}>
                            <View style={styles.circuloVazio} />
                            <Text style={styles.textoStatus}>
                                {temFiltroAtivo
                                    ? 'Nenhum Pokémon capturado corresponde aos filtros.'
                                    : 'Nenhum Pokémon marcado como capturado ainda.'}
                            </Text>
                            {temFiltroAtivo ? (
                                <TouchableOpacity style={styles.botaoExplorar} onPress={limparFiltros}>
                                    <Text style={styles.textoBotao}>Limpar filtros</Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    style={styles.botaoExplorar}
                                    onPress={() => navigation.navigate('PokedexScreen')}
                                >
                                    <Text style={styles.textoBotao}>Ir para a Pokédex</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    }
                    renderItem={({ item }) => (
                        <View style={styles.itemWrapper}>
                            <PokemonCard
                                item={item}
                                modoShiny={Boolean(item.shiny)}
                                onAbrirDetalhe={(pokemonSelecionado) => {
                                    navigation.navigate('PokemonScreen', {
                                        id: pokemonSelecionado.id,
                                        shiny: Boolean(item.shiny),
                                    });
                                }}
                            />
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => handleLiberarPokemon(item.id, item.shiny)}
                                style={[
                                    styles.botaoLiberar,
                                    item.shiny && styles.botaoLiberarShiny,
                                ]}
                            >
                                <Ionicons
                                    name={item.shiny ? 'sparkles' : 'radio-button-on'}
                                    size={14}
                                    color={item.shiny ? '#FACC15' : '#38BDF8'}
                                />
                                <Text
                                    style={[
                                        styles.textoLiberar,
                                        item.shiny && { color: '#FACC15' },
                                    ]}
                                >
                                    {item.shiny
                                        ? 'Remover Shiny dos capturados'
                                        : 'Remover dos capturados'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
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
                                                borderColor: '#38BDF8',
                                                backgroundColor: 'rgba(56, 189, 248, 0.16)',
                                            },
                                        ]}
                                    >
                                        <MaterialCommunityIcons
                                            name="shape-outline"
                                            size={14}
                                            color="#38BDF8"
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
                                        style={[styles.botaoAplicarModal, { backgroundColor: '#38BDF8' }]}
                                    >
                                        <Text style={[styles.textoAplicarModal, { color: '#091016' }]}>Aplicar</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </Pressable>
                </Pressable>
            </Modal>

            <UserBottomNav abaAtiva="capturados" navigation={navigation} />
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
    headerTela: {
        margin: espacos.medio,
        marginBottom: 8,
        padding: espacos.medio,
        borderRadius: bordas.raio + 6,
        borderWidth: 1,
        borderColor: 'rgba(56, 189, 248, 0.28)',
    },
    linhaTopo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
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
    tituloBox: {
        flex: 1,
    },
    tagSubtitulo: {
        color: '#38BDF8',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1.4,
    },
    tituloPrincipal: {
        color: cores.texto,
        fontSize: fontes.titulo,
        fontWeight: '800',
        marginTop: 2,
    },
    areaFiltros: {
        paddingHorizontal: espacos.medio,
        marginBottom: 8,
        gap: 8,
    },
    caixaBusca: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        height: 40,
        backgroundColor: cores.superficie,
        borderRadius: 12,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    inputBusca: {
        flex: 1,
        color: cores.texto,
        fontSize: 13,
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
        height: 34,
        paddingHorizontal: 8,
        borderRadius: 10,
        backgroundColor: cores.superficie,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.09)',
    },
    chipAcao: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        height: 34,
        paddingHorizontal: 11,
        borderRadius: 10,
        backgroundColor: cores.superficie,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.09)',
    },
    chipShinyAtivo: {
        borderColor: 'rgba(250, 204, 21, 0.55)',
        backgroundColor: 'rgba(250, 204, 21, 0.14)',
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
        fontWeight: '600',
    },
    botaoReset: {
        paddingVertical: 2,
        paddingHorizontal: 6,
    },
    textoReset: {
        color: '#38BDF8',
        fontSize: 12,
        fontWeight: '700',
    },
    listaConteudo: {
        paddingHorizontal: espacos.medio,
        paddingBottom: espacos.grande,
    },
    itemWrapper: {
        marginBottom: 6,
    },
    botaoLiberar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: -8,
        marginBottom: 10,
        paddingVertical: 6,
        borderBottomLeftRadius: bordas.raio,
        borderBottomRightRadius: bordas.raio,
        backgroundColor: 'rgba(56, 189, 248, 0.08)',
        borderWidth: 1,
        borderTopWidth: 0,
        borderColor: 'rgba(56, 189, 248, 0.24)',
    },
    botaoLiberarShiny: {
        backgroundColor: 'rgba(250, 204, 21, 0.08)',
        borderColor: 'rgba(250, 204, 21, 0.28)',
    },
    textoLiberar: {
        color: '#38BDF8',
        fontSize: 11,
        fontWeight: '700',
    },
    vazioBox: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 56,
        gap: 12,
    },
    circuloVazio: {
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: 2,
        borderColor: '#38BDF8',
        marginBottom: 4,
    },
    botaoExplorar: {
        backgroundColor: cores.primaria,
        paddingHorizontal: espacos.grande,
        paddingVertical: 10,
        borderRadius: bordas.raio,
        marginTop: 4,
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
        paddingVertical: 10,
        borderRadius: bordas.raio,
    },
    textoBotao: {
        color: cores.texto,
        fontSize: fontes.normal,
        fontWeight: '700',
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
        color: '#38BDF8',
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