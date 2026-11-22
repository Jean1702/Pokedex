import React, { useCallback, useContext, useEffect, useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import BottomHudPokemon from '../components/BottomHudPokemon';
import { AuthContext } from '../contexts/AuthContext';
import {
    buscarDetalhesCompletosPokemon,
    capturarPokemon,
    favoritarPokemon,
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

const NOMES_STATS = {
    hp: 'HP',
    attack: 'Ataque',
    defense: 'Defesa',
    'special-attack': 'Atq. Esp.',
    'special-defense': 'Def. Esp.',
    speed: 'Velocidade',
};

function obterEstiloTipo(tipo) {
    const chave = String(tipo || '').toLowerCase().trim();
    return CORES_TIPO[chave] || CORES_TIPO.default;
}

function calcularMinMaxStat(nomeStat, base) {
    if (nomeStat === 'hp') {
        return {
            min: 2 * base + 110,
            max: 2 * base + 204,
        };
    }
    return {
        min: Math.floor((2 * base + 5) * 0.9),
        max: Math.floor((2 * base + 99) * 1.1),
    };
}

export default function PokemonScreen({ route, navigation }) {
    const { id } = route.params || {};
    const { token, sair } = useContext(AuthContext);

    const [pokemon, setPokemon] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');

    const [modoSprite, setModoSprite] = useState(0);
    const [falhouSprite, setFalhouSprite] = useState(false);
    const [favorito, setFavorito] = useState(false);
    const [capturado, setCapturado] = useState(false);
    const [tocandoChoro, setTocandoChoro] = useState(false);

    const carregarDetalhes = useCallback(async (pokemonId) => {
        try {
            setCarregando(true);
            setErro('');
            setFalhouSprite(false);
            setModoSprite(0);

            const dados = await buscarDetalhesCompletosPokemon(pokemonId);
            setPokemon(dados);
        } catch (e) {
            setErro(e.message || 'Erro ao carregar detalhes do Pokémon.');
        } finally {
            setCarregando(false);
        }
    }, []);

    useEffect(() => {
        if (id) {
            carregarDetalhes(id);
        }
    }, [id, carregarDetalhes]);

    const handleFavoritar = async () => {
        if (!token) {
            navigation.navigate('LoginScreen');
            return;
        }

        const novoValor = !favorito;
        setFavorito(novoValor);

        try {
            await favoritarPokemon(token, pokemon.id, novoValor);
        } catch (e) {
            setFavorito(!novoValor);
            if (e.status === 401) {
                await sair();
                navigation.navigate('LoginScreen');
            }
        }
    };

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

    const handleTocarChoro = () => {
        const urlChoro =
            pokemon?.cries?.latest ||
            pokemon?.cries?.legacy ||
            `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${pokemon?.id}.ogg`;

        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.Audio) {
            try {
                setTocandoChoro(true);
                const audio = new window.Audio(urlChoro);
                audio.onended = () => setTocandoChoro(false);
                audio.onerror = () => setTocandoChoro(false);
                audio.play().catch(() => setTocandoChoro(false));
            } catch {
                setTocandoChoro(false);
            }
        }
    };

    if (carregando) {
        return (
            <View style={styles.centralizado}>
                <ActivityIndicator size="large" color={cores.primaria} />
                <Text style={styles.textoStatus}>Carregando ficha do Pokémon...</Text>
            </View>
        );
    }

    if (erro || !pokemon) {
        return (
            <View style={styles.centralizado}>
                <Text style={styles.textoErro}>{erro || 'Pokémon não encontrado.'}</Text>
                <TouchableOpacity
                    style={styles.botaoVoltarErro}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.textoBotao}>Voltar</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const tipos = Array.isArray(pokemon.types) && pokemon.types.length > 0
        ? pokemon.types
        : ['normal'];

    const temaPrimario = obterEstiloTipo(tipos[0]);
    const temaSecundario = tipos[1] ? obterEstiloTipo(tipos[1]) : temaPrimario;
    const coresGradiente = tipos[1]
        ? [temaPrimario.fundo, temaSecundario.fundo]
        : [temaPrimario.fundo, '#141418'];

    const urlsSprites = [
        `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/${pokemon.shiny ? 'shiny/' : ''}${pokemon.id}.gif`,
        `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/back/${pokemon.shiny ? 'shiny/' : ''}${pokemon.id}.gif`,
        `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`,
    ];

    const uriAtual = falhouSprite ? pokemon.image : urlsSprites[modoSprite];
    const numeroFormatado = `#${String(pokemon.id).padStart(2, '0')}`;
    const alturaMetros = pokemon.height ? `${(pokemon.height / 10).toFixed(1)} m` : '--';
    const pesoKg = pokemon.weight ? `${(pokemon.weight / 10).toFixed(1)} kg` : '--';

    return (
        <View style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollConteudo}
            >
                <LinearGradient
                    colors={coresGradiente}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.bannerTopo}
                >
                    <View style={styles.barraAcoesTopo}>
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => navigation.goBack()}
                            style={styles.botaoVoltar}
                        >
                            <Ionicons name="arrow-back" size={20} color={cores.texto} />
                        </TouchableOpacity>

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

                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => {
                            setFalhouSprite(false);
                            setModoSprite((prev) => (prev + 1) % urlsSprites.length);
                        }}
                        style={styles.palcoSprite}
                    >
                        <View style={styles.haloSprite} />
                        {uriAtual ? (
                            <Image
                                source={{ uri: uriAtual }}
                                resizeMode="contain"
                                style={styles.spritePrincipal}
                                onError={() => setFalhouSprite(true)}
                            />
                        ) : null}
                    </TouchableOpacity>

                    <View style={styles.rodapeBanner}>
                        <View style={styles.spacerEsquerda} />

                        <View style={styles.indicadorPontos}>
                            {urlsSprites.map((_, idx) => (
                                <TouchableOpacity
                                    key={idx}
                                    onPress={() => {
                                        setFalhouSprite(false);
                                        setModoSprite(idx);
                                    }}
                                    style={[
                                        styles.pontoCarousel,
                                        modoSprite === idx && styles.pontoCarouselAtivo,
                                    ]}
                                />
                            ))}
                        </View>

                        <View style={styles.grupoTiposBanner}>
                            {tipos.map((t, index) => {
                                const estilo = obterEstiloTipo(t);
                                return (
                                    <View
                                        key={`${t}-${index}`}
                                        style={[
                                            styles.pilulaTipoBanner,
                                            { borderColor: estilo.borda },
                                        ]}
                                    >
                                        <View style={[styles.pontoTipo, { backgroundColor: estilo.principal }]} />
                                        <Text style={[styles.textoTipoBanner, { color: estilo.principal }]}>
                                            {t}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                </LinearGradient>

                <View style={styles.divisorHorizontal} />

                <View style={styles.corpoFicha}>
                    <View style={styles.linhaTitulo}>
                        <Text style={styles.nomePokemon}>
                            {pokemon.name} <Text style={styles.numeroPokemon}>{numeroFormatado}</Text>
                        </Text>

                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={handleFavoritar}
                            style={styles.botaoFavoritoWrapper}
                        >
                            <View
                                style={[
                                    styles.losangoFavorito,
                                    favorito && styles.losangoFavoritoAtivo,
                                ]}
                            />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.secaoDescricao}>
                        <Text style={styles.tituloSecaoCentro}>Descrição</Text>
                        <Text style={styles.textoDescricao}>{pokemon.descricao}</Text>
                    </View>

                    <View style={styles.linhaMedidas}>
                        <View style={styles.cardMedida}>
                            <Text style={styles.labelMedida}>Altura</Text>
                            <Text style={styles.valorMedida}>{alturaMetros}</Text>
                        </View>

                        <View style={styles.cardMedida}>
                            <Text style={styles.labelMedida}>Peso</Text>
                            <Text style={styles.valorMedida}>{pesoKg}</Text>
                        </View>

                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={handleTocarChoro}
                            style={[
                                styles.cardMedida,
                                styles.cardChoro,
                                tocandoChoro && styles.cardChoroAtivo,
                            ]}
                        >
                            <Ionicons
                                name={tocandoChoro ? 'volume-high' : 'volume-medium-outline'}
                                size={16}
                                color={tocandoChoro ? cores.primaria : cores.texto}
                            />
                            <Text style={styles.valorMedida}>Choro</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.cardBloco}>
                        <Text style={styles.tituloCard}>Habilidades</Text>
                        <View style={styles.listaHabilidades}>
                            {Array.isArray(pokemon.abilities) && pokemon.abilities.length > 0 ? (
                                pokemon.abilities.map((item, idx) => (
                                    <View key={`${item.ability?.name}-${idx}`} style={styles.itemHabilidade}>
                                        <Text style={styles.nomeHabilidade}>{item.ability?.name}</Text>
                                        {item.is_hidden && (
                                            <View style={styles.badgeOculta}>
                                                <Text style={styles.textoBadgeOculta}>Oculta</Text>
                                            </View>
                                        )}
                                    </View>
                                ))
                            ) : (
                                <Text style={styles.textoVazioCard}>Sem habilidades registradas.</Text>
                            )}
                        </View>
                    </View>

                    <View style={styles.cardBloco}>
                        <Text style={styles.tituloCardCenter}>Evolução</Text>
                        {Array.isArray(pokemon.evolucoes) && pokemon.evolucoes.length > 0 ? (
                            <View style={styles.linhaEvolucoes}>
                                {pokemon.evolucoes.map((evo, idx) => {
                                    const atual = evo.id === Number(pokemon.id);
                                    return (
                                        <React.Fragment key={evo.id}>
                                            {idx > 0 && (
                                                <Ionicons
                                                    name="chevron-forward"
                                                    size={16}
                                                    color={cores.textoSecundario}
                                                />
                                            )}
                                            <TouchableOpacity
                                                activeOpacity={0.8}
                                                onPress={() => !atual && navigation.push('PokemonScreen', { id: evo.id })}
                                                style={[
                                                    styles.itemEvolucao,
                                                    atual && { borderColor: temaPrimario.principal },
                                                ]}
                                            >
                                                <Image
                                                    source={{ uri: evo.image }}
                                                    resizeMode="contain"
                                                    style={styles.imagemEvolucao}
                                                />
                                                <Text style={styles.nomeEvolucao} numberOfLines={1}>
                                                    {evo.name}
                                                </Text>
                                            </TouchableOpacity>
                                        </React.Fragment>
                                    );
                                })}
                            </View>
                        ) : (
                            <Text style={styles.textoVazioCard}>Cadeia evolutiva não disponível.</Text>
                        )}
                    </View>

                    <View style={styles.cardBloco}>
                        <Text style={styles.tituloCardCenter}>Estatísticas Básicas</Text>

                        <View style={styles.cabecalhoTabelaStats}>
                            <Text style={styles.colNomeStat} />
                            <Text style={styles.colValorStat}>Base</Text>
                            <Text style={styles.colValorStat}>Min</Text>
                            <Text style={styles.colValorStat}>Max</Text>
                        </View>

                        {Array.isArray(pokemon.stats) &&
                            pokemon.stats.map((st) => {
                                const nomeStat = st.stat?.name || '';
                                const base = st.base_stat || 0;
                                const { min, max } = calcularMinMaxStat(nomeStat, base);
                                const porcentagem = Math.min(100, Math.round((base / 180) * 100));

                                return (
                                    <View key={nomeStat} style={styles.linhaStat}>
                                        <Text style={styles.labelStat}>
                                            {NOMES_STATS[nomeStat] || nomeStat}
                                        </Text>

                                        <View style={styles.barraStatFundo}>
                                            <View
                                                style={[
                                                    styles.barraStatPreenchida,
                                                    {
                                                        width: `${porcentagem}%`,
                                                        backgroundColor: temaPrimario.principal,
                                                    },
                                                ]}
                                            />
                                        </View>

                                        <Text style={styles.numeroStatBase}>{base}</Text>
                                        <Text style={styles.numeroStatSecundario}>{min}</Text>
                                        <Text style={styles.numeroStatSecundario}>{max}</Text>
                                    </View>
                                );
                            })}
                    </View>
                </View>
            </ScrollView>

            <BottomHudPokemon
                abaAtiva="detalhe"
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
    scrollConteudo: {
        paddingBottom: espacos.grande,
    },
    bannerTopo: {
        paddingTop: espacos.medio,
        paddingHorizontal: espacos.medio,
        paddingBottom: espacos.medio,
    },
    barraAcoesTopo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    botaoVoltar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(13, 13, 13, 0.45)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.16)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    botaoCaptura: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: 'rgba(13, 13, 13, 0.45)',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.28)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    botaoCapturaAtivo: {
        borderColor: '#F59E0B',
        backgroundColor: 'rgba(245, 158, 11, 0.22)',
    },
    losangoCaptura: {
        width: 16,
        height: 16,
        borderRadius: 3,
        borderWidth: 2,
        borderColor: cores.texto,
        transform: [{ rotate: '45deg' }],
    },
    losangoCapturaAtivo: {
        backgroundColor: '#F59E0B',
        borderColor: '#FEF3C7',
    },
    palcoSprite: {
        height: 155,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    haloSprite: {
        position: 'absolute',
        width: 130,
        height: 130,
        borderRadius: 65,
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
    },
    spritePrincipal: {
        width: 128,
        height: 128,
    },
    rodapeBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    spacerEsquerda: {
        flex: 1,
    },
    indicadorPontos: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    pontoCarousel: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    pontoCarouselAtivo: {
        width: 16,
        backgroundColor: cores.texto,
    },
    grupoTiposBanner: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 6,
    },
    pilulaTipoBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 9,
        backgroundColor: 'rgba(13, 13, 13, 0.65)',
        borderWidth: 1,
    },
    pontoTipo: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    textoTipoBanner: {
        fontSize: fontes.pequena - 1,
        fontWeight: '700',
        textTransform: 'capitalize',
    },
    divisorHorizontal: {
        height: 1.5,
        backgroundColor: 'rgba(255, 255, 255, 0.14)',
    },
    corpoFicha: {
        paddingHorizontal: espacos.medio,
        paddingTop: espacos.medio,
        gap: 14,
    },
    linhaTitulo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    nomePokemon: {
        color: cores.texto,
        fontSize: fontes.titulo + 2,
        fontWeight: '800',
        textTransform: 'capitalize',
    },
    numeroPokemon: {
        color: cores.textoSecundario,
        fontWeight: '700',
    },
    botaoFavoritoWrapper: {
        padding: 8,
    },
    losangoFavorito: {
        width: 22,
        height: 22,
        borderRadius: 4,
        backgroundColor: '#EA580C',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.7)',
        transform: [{ rotate: '45deg' }],
    },
    losangoFavoritoAtivo: {
        backgroundColor: '#FACC15',
        borderColor: '#FEF9C3',
        transform: [{ rotate: '45deg' }, { scale: 1.15 }],
    },
    secaoDescricao: {
        backgroundColor: cores.superficie,
        borderRadius: bordas.raio + 2,
        padding: espacos.medio,
        borderWidth: 1,
        borderColor: cores.borda,
    },
    tituloSecaoCentro: {
        color: cores.texto,
        fontSize: fontes.grande,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 6,
    },
    textoDescricao: {
        color: cores.textoSecundario,
        fontSize: fontes.pequena + 1,
        lineHeight: 20,
        textAlign: 'center',
    },
    linhaMedidas: {
        flexDirection: 'row',
        gap: 8,
    },
    cardMedida: {
        flex: 1,
        backgroundColor: cores.superficie,
        borderRadius: bordas.raio,
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderWidth: 1,
        borderColor: cores.borda,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
    },
    cardChoro: {
        flexDirection: 'row',
        gap: 6,
    },
    cardChoroAtivo: {
        borderColor: cores.primaria,
        backgroundColor: cores.primariaClara,
    },
    labelMedida: {
        color: cores.textoSecundario,
        fontSize: 11,
        fontWeight: '600',
    },
    valorMedida: {
        color: cores.texto,
        fontSize: fontes.normal,
        fontWeight: '700',
    },
    cardBloco: {
        backgroundColor: cores.superficie,
        borderRadius: bordas.raio + 2,
        padding: espacos.medio,
        borderWidth: 1,
        borderColor: cores.borda,
    },
    tituloCard: {
        color: cores.texto,
        fontSize: fontes.grande,
        fontWeight: '700',
        marginBottom: 10,
    },
    tituloCardCenter: {
        color: cores.texto,
        fontSize: fontes.grande,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 12,
    },
    listaHabilidades: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    itemHabilidade: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: cores.fundo,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: cores.borda,
    },
    nomeHabilidade: {
        color: cores.texto,
        fontSize: fontes.pequena + 1,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    badgeOculta: {
        backgroundColor: cores.primariaClara,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: cores.primaria,
    },
    textoBadgeOculta: {
        color: cores.primaria,
        fontSize: 10,
        fontWeight: '800',
    },
    linhaEvolucoes: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: 8,
    },
    itemEvolucao: {
        width: 82,
        backgroundColor: cores.fundo,
        borderRadius: bordas.raio,
        padding: 8,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: cores.borda,
    },
    imagemEvolucao: {
        width: 54,
        height: 54,
        marginBottom: 4,
    },
    nomeEvolucao: {
        color: cores.texto,
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'capitalize',
    },
    cabecalhoTabelaStats: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        paddingBottom: 4,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    },
    colNomeStat: {
        flex: 1,
    },
    colValorStat: {
        width: 42,
        color: cores.textoSecundario,
        fontSize: 11,
        fontWeight: '700',
        textAlign: 'right',
    },
    linhaStat: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    labelStat: {
        width: 68,
        color: cores.textoSecundario,
        fontSize: 12,
        fontWeight: '600',
    },
    barraStatFundo: {
        flex: 1,
        height: 6,
        borderRadius: 3,
        backgroundColor: cores.fundo,
        overflow: 'hidden',
        marginHorizontal: 8,
    },
    barraStatPreenchida: {
        height: '100%',
        borderRadius: 3,
    },
    numeroStatBase: {
        width: 42,
        color: cores.texto,
        fontSize: 12,
        fontWeight: '800',
        textAlign: 'right',
    },
    numeroStatSecundario: {
        width: 42,
        color: cores.textoSecundario,
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'right',
    },
    textoVazioCard: {
        color: cores.textoSecundario,
        fontSize: fontes.pequena,
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