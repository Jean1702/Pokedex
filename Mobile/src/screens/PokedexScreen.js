import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import PokemonCard from '../components/PokemonCard';
import { pokemonService } from '../services/api';
import { cores, fontes, espacos, bordas } from '../styles/theme';

const GERACOES = [
    { id: 'todas', label: 'Todas Gerações', min: 1, max: 9999 },
    { id: 'gen1', label: 'Gen 1 • Kanto', min: 1, max: 151 },
    { id: 'gen2', label: 'Gen 2 • Johto', min: 152, max: 251 },
    { id: 'gen3', label: 'Gen 3 • Hoenn', min: 252, max: 386 },
    { id: 'gen4', label: 'Gen 4 • Sinnoh', min: 387, max: 493 },
];

export default function PokedexScreen({ navigation }) {
    const [pokemons, setPokemons] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [atualizando, setAtualizando] = useState(false);
    const [erro, setErro] = useState(null);

    const [geracaoSelecionada, setGeracaoSelecionada] = useState(GERACOES[0]);
    const [tipoSelecionado, setTipoSelecionado] = useState('Todos');
    const [apenasShiny, setApenasShiny] = useState(false);
    const [buscaAberta, setBuscaAberta] = useState(false);
    const [busca, setBusca] = useState('');
    const [modalFiltro, setModalFiltro] = useState(null);

    const carregarPokemons = useCallback(async (silencioso = false) => {
        try {
            if (!silencioso) setCarregando(true);
            setErro(null);

            const dados = await pokemonService.listarTodos();
            setPokemons(Array.isArray(dados) ? dados : []);
        } catch (err) {
            setErro(err.message || 'Não foi possível conectar ao servidor.');
        } finally {
            setCarregando(false);
            setAtualizando(false);
        }
    }, []);

    useEffect(() => {
        carregarPokemons();
    }, [carregarPokemons]);

    const tiposDisponiveis = useMemo(() => {
        const unicos = new Set();
        pokemons.forEach((p) => {
            if (p.type) {
                p.type
                    .split('/')
                    .map((t) => t.trim())
                    .filter(Boolean)
                    .forEach((t) => unicos.add(t));
            }
        });
        return ['Todos', ...Array.from(unicos)];
    }, [pokemons]);

    const pokemonsFiltrados = useMemo(() => {
        return pokemons.filter((p) => {
            const idNum = Number(p.id);
            const bateGeracao =
                idNum >= geracaoSelecionada.min && idNum <= geracaoSelecionada.max;

            const bateTipo =
                tipoSelecionado === 'Todos' ||
                (p.type && p.type.toLowerCase().includes(tipoSelecionado.toLowerCase()));

            const bateShiny = !apenasShiny || Boolean(p.shiny);

            const termo = busca.trim().toLowerCase();
            const bateBusca =
                !termo ||
                p.name?.toLowerCase().includes(termo) ||
                String(p.id).includes(termo);

            return bateGeracao && bateTipo && bateShiny && bateBusca;
        });
    }, [pokemons, geracaoSelecionada, tipoSelecionado, apenasShiny, busca]);

    if (carregando) {
        return (
            <View style={styles.centralizado}>
                <ActivityIndicator size="large" color={cores.primaria} />
                <Text style={styles.textoStatus}>Sincronizando Pokédex...</Text>
            </View>
        );
    }

    if (erro) {
        return (
            <View style={styles.centralizado}>
                <Text style={styles.textoErro}>{erro}</Text>
                <TouchableOpacity
                    style={styles.botaoTentarNovamente}
                    onPress={() => carregarPokemons()}
                >
                    <Text style={styles.textoBotao}>Tentar novamente</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* CABEÇALHO DE HARDWARE POKÉDEX COM CHANFRO E GRADIENTES */}
            <LinearGradient
                colors={['#232329', '#141418']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.headerPokedex}
            >
                <View style={styles.headerLinhaPrincipal}>
                    {/* Lente Principal -> Leva para 05 - Login conforme o fluxo do diagrama */}
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => {
                            // Quando criarmos a LoginScreen: navigation.navigate('LoginScreen')
                            console.log('Ir para Login');
                        }}
                        style={styles.lenteAnelExterno}
                    >
                        <LinearGradient
                            colors={['#7DD3FC', '#0284C7', '#0369A1']}
                            start={{ x: 0.2, y: 0.1 }}
                            end={{ x: 0.9, y: 0.9 }}
                            style={styles.lenteVidro}
                        >
                            <View style={styles.lenteReflexoPrincipal} />
                            <View style={styles.lenteReflexoSecundario} />
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Botões Centrais Estilizados: Geração & Tipo */}
                    <View style={styles.grupoFiltros}>
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => setModalFiltro('geracao')}
                            style={styles.botaoFiltroWrapper}
                        >
                            <LinearGradient
                                colors={
                                    geracaoSelecionada.id !== 'todas'
                                        ? [cores.primaria, '#9A3412']
                                        : ['#2A2A32', '#1A1A20']
                                }
                                style={[
                                    styles.botaoFiltro,
                                    geracaoSelecionada.id !== 'todas' && styles.botaoFiltroAtivo,
                                ]}
                            >
                                <Text style={styles.textoFiltro} numberOfLines={1}>
                                    {geracaoSelecionada.id === 'todas'
                                        ? 'Geração'
                                        : geracaoSelecionada.label.split('•')[0].trim()}
                                </Text>
                                <Text style={styles.setaMini}>▾</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => setModalFiltro('tipo')}
                            style={styles.botaoFiltroWrapper}
                        >
                            <LinearGradient
                                colors={
                                    tipoSelecionado !== 'Todos'
                                        ? [cores.primaria, '#9A3412']
                                        : ['#2A2A32', '#1A1A20']
                                }
                                style={[
                                    styles.botaoFiltro,
                                    tipoSelecionado !== 'Todos' && styles.botaoFiltroAtivo,
                                ]}
                            >
                                <Text style={styles.textoFiltro} numberOfLines={1}>
                                    {tipoSelecionado === 'Todos' ? 'Tipo' : tipoSelecionado}
                                </Text>
                                <Text style={styles.setaMini}>▾</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    {/* Controles Laterais Direitos: Botão Busca + Losango Laranja Shiny */}
                    <View style={styles.grupoDireita}>
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => {
                                setBuscaAberta((prev) => !prev);
                                if (buscaAberta) setBusca('');
                            }}
                            style={[
                                styles.botaoQuadrado,
                                buscaAberta && styles.botaoQuadradoAtivo,
                            ]}
                        >
                            <Text style={styles.iconeBusca}>⌕</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => setApenasShiny((prev) => !prev)}
                            style={[
                                styles.losangoShiny,
                                apenasShiny && styles.losangoShinyAtivo,
                            ]}
                        />
                    </View>
                </View>

                {/* Barra Inferior do Header: LED Central + Contador de resultados */}
                <View style={styles.headerRodape}>
                    <View style={styles.ledsStatus}>
                        <View
                            style={[
                                styles.ledCentral,
                                (geracaoSelecionada.id !== 'todas' ||
                                    tipoSelecionado !== 'Todos' ||
                                    apenasShiny) &&
                                styles.ledCentralAtivo,
                            ]}
                        />
                    </View>

                    <Text style={styles.contadorTexto}>
                        {pokemonsFiltrados.length} {pokemonsFiltrados.length === 1 ? 'encontrado' : 'encontrados'}
                    </Text>
                </View>

                {/* Campo de busca retrátil */}
                {buscaAberta && (
                    <TextInput
                        style={styles.inputBusca}
                        placeholder="Buscar Pokémon por nome ou número..."
                        placeholderTextColor={cores.textoSecundario}
                        value={busca}
                        onChangeText={setBusca}
                        autoCapitalize="none"
                        autoFocus
                    />
                )}
            </LinearGradient>

            {/* Traço divisor curto característico do wireframe */}
            <View style={styles.tracoDivisor} />

            {/* Lista de Cards */}
            <FlatList
                data={pokemonsFiltrados}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                    <PokemonCard
                        item={item}
                        onAbrirDetalhe={(pokemonSelecionado) => {
                            // Próxima tela do diagrama: 02-Pokémon
                            console.log('Navegar para 02-Pokémon:', pokemonSelecionado);
                        }}
                    />
                )}
                contentContainerStyle={styles.lista}
                showsVerticalScrollIndicator={false}
                refreshing={atualizando}
                onRefresh={() => {
                    setAtualizando(true);
                    carregarPokemons(true);
                }}
                ListEmptyComponent={
                    <Text style={styles.textoStatus}>
                        Nenhum Pokémon encontrado com esses filtros.
                    </Text>
                }
            />

            {/* Modal Elegante de Seleção (Geração / Tipo) */}
            <Modal
                visible={modalFiltro !== null}
                transparent
                animationType="fade"
                onRequestClose={() => setModalFiltro(null)}
            >
                <Pressable style={styles.modalOverlay} onPress={() => setModalFiltro(null)}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitulo}>
                            {modalFiltro === 'geracao' ? 'Filtrar por Geração' : 'Filtrar por Tipo'}
                        </Text>

                        {modalFiltro === 'geracao'
                            ? GERACOES.map((gen) => (
                                <TouchableOpacity
                                    key={gen.id}
                                    style={[
                                        styles.modalOpcao,
                                        geracaoSelecionada.id === gen.id && styles.modalOpcaoAtiva,
                                    ]}
                                    onPress={() => {
                                        setGeracaoSelecionada(gen);
                                        setModalFiltro(null);
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.modalTextoOpcao,
                                            geracaoSelecionada.id === gen.id && styles.modalTextoAtivo,
                                        ]}
                                    >
                                        {gen.label}
                                    </Text>
                                </TouchableOpacity>
                            ))
                            : tiposDisponiveis.map((tipo) => (
                                <TouchableOpacity
                                    key={tipo}
                                    style={[
                                        styles.modalOpcao,
                                        tipoSelecionado === tipo && styles.modalOpcaoAtiva,
                                    ]}
                                    onPress={() => {
                                        setTipoSelecionado(tipo);
                                        setModalFiltro(null);
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.modalTextoOpcao,
                                            tipoSelecionado === tipo && styles.modalTextoAtivo,
                                        ]}
                                    >
                                        {tipo}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                    </View>
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
        backgroundColor: cores.fundo,
        justifyContent: 'center',
        alignItems: 'center',
        padding: espacos.grande,
    },
    headerPokedex: {
        borderRadius: bordas.raio + 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.14)',
        borderTopColor: 'rgba(255, 255, 255, 0.25)',
        padding: espacos.medio,
        marginBottom: espacos.pequeno + 2,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.45,
        shadowRadius: 14,
        elevation: 8,
    },
    headerLinhaPrincipal: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
    },
    lenteAnelExterno: {
        width: 48,
        height: 48,
        borderRadius: 24,
        padding: 3,
        backgroundColor: '#E5E7EB',
        shadowColor: '#38BDF8',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.55,
        shadowRadius: 10,
        elevation: 6,
    },
    lenteVidro: {
        flex: 1,
        borderRadius: 21,
        position: 'relative',
        overflow: 'hidden',
    },
    lenteReflexoPrincipal: {
        position: 'absolute',
        top: 5,
        left: 7,
        width: 12,
        height: 8,
        borderRadius: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        transform: [{ rotate: '-25deg' }],
    },
    lenteReflexoSecundario: {
        position: 'absolute',
        bottom: 6,
        right: 7,
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
    },
    grupoFiltros: {
        flex: 1,
        flexDirection: 'row',
        gap: 8,
    },
    botaoFiltroWrapper: {
        flex: 1,
        borderRadius: bordas.raio,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 6,
        elevation: 4,
    },
    botaoFiltro: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 11,
        paddingHorizontal: 12,
        borderRadius: bordas.raio,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.14)',
        borderTopColor: 'rgba(255, 255, 255, 0.28)',
    },
    botaoFiltroAtivo: {
        borderColor: cores.primaria,
        borderTopColor: '#FB923C',
    },
    textoFiltro: {
        color: cores.texto,
        fontSize: fontes.pequena,
        fontWeight: '700',
        textTransform: 'capitalize',
        flex: 1,
    },
    setaMini: {
        color: 'rgba(255, 255, 255, 0.65)',
        fontSize: 12,
        marginLeft: 4,
    },
    grupoDireita: {
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 9,
    },
    botaoQuadrado: {
        width: 28,
        height: 24,
        borderRadius: 7,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.18)',
        borderTopColor: 'rgba(255, 255, 255, 0.32)',
        backgroundColor: '#25252C',
        alignItems: 'center',
        justifyContent: 'center',
    },
    botaoQuadradoAtivo: {
        borderColor: cores.primaria,
        backgroundColor: cores.primariaClara,
    },
    iconeBusca: {
        color: cores.texto,
        fontSize: 14,
        fontWeight: 'bold',
        lineHeight: 16,
    },
    losangoShiny: {
        width: 16,
        height: 16,
        backgroundColor: cores.primaria,
        borderRadius: 4,
        transform: [{ rotate: '45deg' }],
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.85)',
        shadowColor: cores.primaria,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.7,
        shadowRadius: 6,
    },
    losangoShinyAtivo: {
        backgroundColor: '#FACC15',
        shadowColor: '#FACC15',
        transform: [{ rotate: '45deg' }, { scale: 1.18 }],
    },
    headerRodape: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        position: 'relative',
    },
    ledsStatus: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    ledCentral: {
        width: 14,
        height: 14,
        borderRadius: 4,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.22)',
        backgroundColor: '#1F2937',
    },
    ledCentralAtivo: {
        backgroundColor: '#22C55E',
        borderColor: '#86EFAC',
        shadowColor: '#22C55E',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 8,
    },
    contadorTexto: {
        position: 'absolute',
        right: 0,
        color: cores.textoSecundario,
        fontSize: 11,
        fontWeight: '600',
    },
    inputBusca: {
        marginTop: espacos.pequeno + 4,
        backgroundColor: '#0E0E11',
        color: cores.texto,
        fontSize: fontes.normal,
        paddingHorizontal: espacos.medio,
        paddingVertical: 9,
        borderRadius: bordas.raio,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.14)',
    },
    tracoDivisor: {
        width: '32%',
        height: 3,
        backgroundColor: 'rgba(255, 255, 255, 0.16)',
        marginBottom: espacos.pequeno + 6,
        borderRadius: 2,
    },
    lista: {
        paddingBottom: espacos.grande,
    },
    textoStatus: {
        color: cores.textoSecundario,
        fontSize: fontes.normal,
        textAlign: 'center',
        marginTop: espacos.medio,
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.78)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: espacos.grande,
    },
    modalCard: {
        width: '100%',
        maxWidth: 340,
        backgroundColor: '#18181C',
        borderRadius: bordas.raio + 6,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        padding: espacos.medio,
    },
    modalTitulo: {
        color: cores.texto,
        fontSize: fontes.grande,
        fontWeight: '700',
        marginBottom: espacos.medio,
        textAlign: 'center',
    },
    modalOpcao: {
        paddingVertical: 12,
        paddingHorizontal: espacos.medio,
        borderRadius: bordas.raio,
        marginBottom: 6,
        backgroundColor: '#101013',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    modalOpcaoAtiva: {
        backgroundColor: cores.primariaClara,
        borderColor: cores.primaria,
    },
    modalTextoOpcao: {
        color: cores.texto,
        fontSize: fontes.normal,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    modalTextoAtivo: {
        color: cores.primaria,
        fontWeight: '700',
    },
});