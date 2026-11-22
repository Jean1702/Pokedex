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
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import AvatarUser from '../components/AvatarUser';
import PokemonCard from '../components/PokemonCard';
import { AuthContext } from '../contexts/AuthContext';
import { listarPokemons } from '../services/pokemon.service';
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

const TIPOS_OFICIAIS = [
    { nome: 'Todos', label: 'Todos', cor: cores.primaria },
    { nome: 'Normal', label: 'Normal', cor: '#A8A77A' },
    { nome: 'Fire', label: 'Fogo', cor: '#F97316' },
    { nome: 'Water', label: 'Água', cor: '#38BDF8' },
    { nome: 'Grass', label: 'Planta', cor: '#22C55E' },
    { nome: 'Electric', label: 'Elétrico', cor: '#FACC15' },
    { nome: 'Ice', label: 'Gelo', cor: '#67E8F9' },
    { nome: 'Fighting', label: 'Lutador', cor: '#EF4444' },
    { nome: 'Poison', label: 'Venenoso', cor: '#C084FC' },
    { nome: 'Ground', label: 'Terra', cor: '#D97706' },
    { nome: 'Flying', label: 'Voador', cor: '#818CF8' },
    { nome: 'Psychic', label: 'Psíquico', cor: '#EC4899' },
    { nome: 'Bug', label: 'Inseto', cor: '#84CC16' },
    { nome: 'Rock', label: 'Pedra', cor: '#B45309' },
    { nome: 'Ghost', label: 'Fantasma', cor: '#A855F7' },
    { nome: 'Dragon', label: 'Dragão', cor: '#6366F1' },
    { nome: 'Dark', label: 'Sombrio', cor: '#71717A' },
    { nome: 'Steel', label: 'Aço', cor: '#94A3B8' },
    { nome: 'Fairy', label: 'Fada', cor: '#F472B6' },
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
    const { token } = useContext(AuthContext);

    const [pokemons, setPokemons] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [atualizando, setAtualizando] = useState(false);
    const [erro, setErro] = useState('');

    const [geracaoSelecionada, setGeracaoSelecionada] = useState(GERACOES[0]);
    const [tipoSelecionado, setTipoSelecionado] = useState(TIPOS_OFICIAIS[0]);
    const [apenasShiny, setApenasShiny] = useState(false);
    const [busca, setBusca] = useState('');
    const [modalFiltro, setModalFiltro] = useState(null);

    const carregarDados = useCallback(async (tipoNome = 'Todos', silencioso = false) => {
        try {
            if (!silencioso) setCarregando(true);
            setErro('');

            const dados = await listarPokemons(tipoNome);
            const listaLimpa = Array.isArray(dados) ? dados.filter(ehPokemonBase) : [];
            setPokemons(listaLimpa);
        } catch (e) {
            setErro(e.message || 'Erro ao carregar Pokémon.');
        } finally {
            setCarregando(false);
            setAtualizando(false);
        }
    }, []);

    useEffect(() => {
        carregarDados(tipoSelecionado.nome);
    }, [tipoSelecionado, carregarDados]);

    const pokemonsFiltrados = useMemo(() => {
        return pokemons.filter((p) => {
            const idNum = Number(p.id);
            const bateGeracao =
                idNum >= geracaoSelecionada.min && idNum <= geracaoSelecionada.max;

            const bateShiny = !apenasShiny || Boolean(p.shiny);

            const termo = busca.trim().toLowerCase();
            const bateBusca =
                !termo ||
                p.name?.toLowerCase().includes(termo) ||
                String(p.id).includes(termo);

            return bateGeracao && bateShiny && bateBusca;
        });
    }, [pokemons, geracaoSelecionada, apenasShiny, busca]);

    const temFiltroAtivo =
        geracaoSelecionada.id !== 'todas' ||
        tipoSelecionado.nome !== 'Todos' ||
        apenasShiny ||
        busca.trim().length > 0;

    const limparFiltros = () => {
        setGeracaoSelecionada(GERACOES[0]);
        setTipoSelecionado(TIPOS_OFICIAIS[0]);
        setApenasShiny(false);
        setBusca('');
    };

    return (
        <View style={styles.container}>
            {/* CABEÇALHO FLUIDO E FUNCIONAL */}
            <View style={styles.headerContainer}>
                <View style={styles.linhaBusca}>
                    <AvatarUser
                        tamanho={44}
                        onPress={() => navigation.navigate(token ? 'UsuarioScreen' : 'LoginScreen')}
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

                {/* Linha 2: Chips de Filtro Rápido (Geração, Tipo e Shiny) */}
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
                            tipoSelecionado.nome !== 'Todos' && {
                                borderColor: tipoSelecionado.cor,
                                backgroundColor: `${tipoSelecionado.cor}1F`,
                            },
                        ]}
                    >
                        <View
                            style={[
                                styles.pontoCor,
                                {
                                    backgroundColor:
                                        tipoSelecionado.nome !== 'Todos' ? tipoSelecionado.cor : cores.textoSecundario,
                                },
                            ]}
                        />
                        <Text style={styles.textoChipFiltro} numberOfLines={1}>
                            {tipoSelecionado.nome === 'Todos' ? 'Tipo' : tipoSelecionado.label}
                        </Text>
                        <Ionicons name="chevron-down" size={13} color={cores.textoSecundario} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={0.75}
                        onPress={() => setApenasShiny((prev) => !prev)}
                        style={[
                            styles.chipShiny,
                            apenasShiny && styles.chipShinyAtivo,
                        ]}
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

                {/* Linha 3: Barra de Status Discreta (Total + Limpar) */}
                <View style={styles.barraStatus}>
                    <Text style={styles.textoContador}>
                        {pokemonsFiltrados.length}{' '}
                        {pokemonsFiltrados.length === 1 ? 'Pokémon exibido' : 'Pokémons exibidos'}
                    </Text>

                    {temFiltroAtivo && (
                        <TouchableOpacity onPress={limparFiltros} style={styles.botaoReset}>
                            <Text style={styles.textoReset}>Limpar filtros</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* CONTEÚDO PRINCIPAL */}
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
                        onPress={() => carregarDados(tipoSelecionado.nome)}
                    >
                        <Text style={styles.textoBotao}>Tentar novamente</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={pokemonsFiltrados}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={({ item }) => (
                        <PokemonCard
                            item={item}
                            onAbrirDetalhe={(pokemonSelecionado) => {
                                navigation.navigate('PokemonScreen', { id: pokemonSelecionado.id });
                            }}
                        />
                    )}
                    contentContainerStyle={styles.lista}
                    showsVerticalScrollIndicator={false}
                    refreshing={atualizando}
                    onRefresh={() => {
                        setAtualizando(true);
                        carregarDados(tipoSelecionado.nome, true);
                    }}
                    ListEmptyComponent={
                        <View style={styles.vazioContainer}>
                            <Ionicons name="search-outline" size={32} color={cores.textoSecundario} />
                            <Text style={styles.textoStatus}>Nenhum Pokémon encontrado.</Text>
                        </View>
                    }
                />
            )}

            {/* MODAL POPOVER COMPACTO E SEM ROLAGEM PESADA */}
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
                            <Text style={styles.popoverTitulo}>
                                {modalFiltro === 'geracao' ? 'Filtrar por Geração' : 'Filtrar por Elemento'}
                            </Text>
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
                            <View style={styles.gridTipos}>
                                {TIPOS_OFICIAIS.map((tipo) => {
                                    const ativo = tipoSelecionado.nome === tipo.nome;
                                    return (
                                        <TouchableOpacity
                                            key={tipo.nome}
                                            activeOpacity={0.75}
                                            onPress={() => {
                                                setTipoSelecionado(tipo);
                                                setModalFiltro(null);
                                            }}
                                            style={[
                                                styles.itemTipo,
                                                ativo && {
                                                    borderColor: tipo.cor,
                                                    backgroundColor: `${tipo.cor}24`,
                                                },
                                            ]}
                                        >
                                            <View style={[styles.pontoCor, { backgroundColor: tipo.cor }]} />
                                            <Text
                                                style={[
                                                    styles.itemTipoTexto,
                                                    ativo && { color: cores.texto, fontWeight: '700' },
                                                ]}
                                                numberOfLines={1}
                                            >
                                                {tipo.label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
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
        gap: 8,
    },
    chipFiltro: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        height: 36,
        paddingHorizontal: 10,
        borderRadius: 11,
        backgroundColor: cores.superficie,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.09)',
    },
    chipShiny: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        height: 36,
        paddingHorizontal: 12,
        borderRadius: 11,
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
        fontSize: fontes.pequena,
        fontWeight: '600',
    },
    pontoCor: {
        width: 8,
        height: 8,
        borderRadius: 4,
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
    // Modal Popover Flutuante
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
    popoverTitulo: {
        color: cores.texto,
        fontSize: fontes.grande,
        fontWeight: '700',
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
        gap: 7,
        backgroundColor: '#111115',
        borderRadius: 10,
        paddingVertical: 9,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.07)',
    },
    itemTipoTexto: {
        color: cores.textoSecundario,
        fontSize: fontes.pequena,
        fontWeight: '600',
        flex: 1,
    },
});