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
import { Ionicons } from '@expo/vector-icons';
import BottomHudPokemon from '../components/BottomHudPokemon';
import PokemonHeaderBanner, { obterEstiloTipo } from '../components/PokemonHeaderBanner';
import { AuthContext } from '../contexts/AuthContext';
import {
    buscarDetalhesCompletosPokemon,
    buscarStatusPokemonUsuario,
    capturarPokemon,
    favoritarPokemon,
} from '../services/pokemon.service';
import { cores, fontes, espacos, bordas } from '../styles/theme';

const NOMES_STATS = {
    hp: 'HP',
    attack: 'Ataque',
    defense: 'Defesa',
    'special-attack': 'Atq. Esp.',
    'special-defense': 'Def. Esp.',
    speed: 'Velocidade',
};

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
    const { id, shiny: shinyParam } = route.params || {};
    const { token, sair } = useContext(AuthContext);

    const [pokemon, setPokemon] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');

    const [ehShiny, setEhShiny] = useState(Boolean(shinyParam));
    const [statusUsuario, setStatusUsuario] = useState({
        catchNormal: false,
        catchShiny: false,
        favNormal: false,
        favShiny: false,
    });
    const [tocandoChoro, setTocandoChoro] = useState(false);

    const favorito = ehShiny ? statusUsuario.favShiny : statusUsuario.favNormal;
    const capturado = ehShiny ? statusUsuario.catchShiny : statusUsuario.catchNormal;

    useEffect(() => {
        if (shinyParam !== undefined) {
            setEhShiny(Boolean(shinyParam));
        }
    }, [shinyParam, id]);

    const carregarStatusUsuario = useCallback(async (pokemonId) => {
        if (!token || !pokemonId) {
            setStatusUsuario({
                catchNormal: false,
                catchShiny: false,
                favNormal: false,
                favShiny: false,
            });
            return;
        }

        try {
            const status = await buscarStatusPokemonUsuario(token, pokemonId);
            setStatusUsuario(status);
        } catch (e) {
            if (e?.status === 401) {
                await sair();
            }
        }
    }, [token, sair]);

    const carregarDetalhes = useCallback(async (pokemonId) => {
        try {
            setCarregando(true);
            setErro('');

            const dados = await buscarDetalhesCompletosPokemon(pokemonId);
            setPokemon(dados);
            if (shinyParam === undefined) {
                setEhShiny(Boolean(dados.shiny));
            }
        } catch (e) {
            setErro(e.message || 'Erro ao carregar detalhes do Pokémon.');
        } finally {
            setCarregando(false);
        }
    }, [shinyParam]);

    useEffect(() => {
        if (id) {
            carregarDetalhes(id);
            carregarStatusUsuario(id);
        }
    }, [id, carregarDetalhes, carregarStatusUsuario]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            if (id && token) {
                carregarStatusUsuario(id);
            }
        });
        return unsubscribe;
    }, [navigation, id, token, carregarStatusUsuario]);

    const handleFavoritar = async () => {
        if (!token) {
            navigation.navigate('LoginScreen');
            return;
        }

        const chave = ehShiny ? 'favShiny' : 'favNormal';
        const novoValor = !statusUsuario[chave];
        setStatusUsuario((prev) => ({ ...prev, [chave]: novoValor }));

        try {
            await favoritarPokemon(token, pokemon.id, novoValor, ehShiny);
        } catch (e) {
            setStatusUsuario((prev) => ({ ...prev, [chave]: !novoValor }));
            if (e?.status === 401) {
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

        const chave = ehShiny ? 'catchShiny' : 'catchNormal';
        const novoValor = !statusUsuario[chave];
        setStatusUsuario((prev) => ({ ...prev, [chave]: novoValor }));

        try {
            await capturarPokemon(token, pokemon.id, novoValor, ehShiny);
        } catch (e) {
            setStatusUsuario((prev) => ({ ...prev, [chave]: !novoValor }));
            if (e?.status === 401) {
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
    const numeroFormatado = `#${String(pokemon.id).padStart(2, '0')}`;
    const alturaMetros = pokemon.height ? `${(pokemon.height / 10).toFixed(1)} m` : '--';
    const pesoKg = pokemon.weight ? `${(pokemon.weight / 10).toFixed(1)} kg` : '--';

    return (
        <View style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollConteudo}
            >
                <PokemonHeaderBanner
                    pokemon={pokemon}
                    shiny={ehShiny}
                    onAlternarShiny={() => setEhShiny((prev) => !prev)}
                    capturado={capturado}
                    onVoltar={() => navigation.goBack()}
                    onCapturar={handleCapturar}
                    alturaPalco={150}
                />

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
                        <View style={styles.cabecalhoEvolucao}>
                            <Text style={styles.tituloCardCenter}>Evolução</Text>
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => setEhShiny((prev) => !prev)}
                                style={[
                                    styles.chipShinyEvolucao,
                                    ehShiny && styles.chipShinyEvolucaoAtivo,
                                ]}
                            >
                                <Ionicons
                                    name={ehShiny ? 'sparkles' : 'sparkles-outline'}
                                    size={12}
                                    color={ehShiny ? '#FACC15' : cores.textoSecundario}
                                />
                                <Text
                                    style={[
                                        styles.textoChipShinyEvo,
                                        ehShiny && { color: '#FACC15' },
                                    ]}
                                >
                                    {ehShiny ? 'Shiny' : 'Normal'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {Array.isArray(pokemon.evolucoes) && pokemon.evolucoes.length > 0 ? (
                            <View style={styles.linhaEvolucoes}>
                                {pokemon.evolucoes.map((evo, idx) => {
                                    const atual = evo.id === Number(pokemon.id);
                                    const uriEvolucao = ehShiny
                                        ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${evo.id}.png`
                                        : evo.image;

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
                                                onPress={() =>
                                                    !atual &&
                                                    navigation.push('PokemonScreen', {
                                                        id: evo.id,
                                                        shiny: ehShiny,
                                                    })
                                                }
                                                style={[
                                                    styles.itemEvolucao,
                                                    atual && { borderColor: temaPrimario.principal },
                                                ]}
                                            >
                                                <Image
                                                    source={{ uri: uriEvolucao }}
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
                shiny={ehShiny}
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
    cabecalhoEvolucao: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    tituloCardCenter: {
        color: cores.texto,
        fontSize: fontes.grande,
        fontWeight: '700',
    },
    chipShinyEvolucao: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: cores.fundo,
        borderWidth: 1,
        borderColor: cores.borda,
    },
    chipShinyEvolucaoAtivo: {
        borderColor: 'rgba(250, 204, 21, 0.55)',
        backgroundColor: 'rgba(250, 204, 21, 0.14)',
    },
    textoChipShinyEvo: {
        color: cores.textoSecundario,
        fontSize: 11,
        fontWeight: '700',
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