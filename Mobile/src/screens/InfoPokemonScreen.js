import React, { useCallback, useContext, useEffect, useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import BottomHudPokemon from '../components/BottomHudPokemon';
import PokemonHeaderBanner, { obterEstiloTipo } from '../components/PokemonHeaderBanner';
import { AuthContext } from '../contexts/AuthContext';
import {
    buscarInformacoesExtrasPokemon,
    capturarPokemon,
} from '../services/pokemon.service';
import { cores, fontes, espacos, bordas } from '../styles/theme';

const NOMES_EV = {
    hp: 'HP',
    attack: 'Ataque',
    defense: 'Defesa',
    'special-attack': 'Atq. Esp.',
    'special-defense': 'Def. Esp.',
    speed: 'Velocidade',
};

const TRADUCAO_CRESCIMENTO = {
    slow: 'Lento',
    medium: 'Médio',
    fast: 'Rápido',
    'medium-slow': 'Médio-Lento',
    'slow-then-very-fast': 'Errático',
    'fast-then-very-slow': 'Flutuante',
};

function formatarTextoSlug(texto) {
    return String(texto || '')
        .split('-')
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(' ');
}

export default function InfoPokemonScreen({ route, navigation }) {
    const { id } = route.params || {};
    const { token, sair } = useContext(AuthContext);

    const [dados, setDados] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');
    const [capturado, setCapturado] = useState(false);

    const carregarDados = useCallback(async () => {
        if (!id) return;

        try {
            setCarregando(true);
            setErro('');
            const resposta = await buscarInformacoesExtrasPokemon(id);
            setDados(resposta);
        } catch (e) {
            setErro(e.message || 'Erro ao carregar informações detalhadas.');
        } finally {
            setCarregando(false);
        }
    }, [id]);

    useEffect(() => {
        carregarDados();
    }, [carregarDados]);

    const handleCapturar = async () => {
        if (!token) {
            navigation.navigate('LoginScreen');
            return;
        }

        const novoValor = !capturado;
        setCapturado(novoValor);

        try {
            await capturarPokemon(token, dados.id, novoValor);
        } catch (e) {
            setCapturado(!novoValor);
            if (e.status === 401) {
                await sair();
                navigation.navigate('LoginScreen');
            }
        }
    };

    if (carregando) {
        return (
            <View style={styles.centralizado}>
                <ActivityIndicator size="large" color={cores.primaria} />
                <Text style={styles.textoStatus}>Carregando informações...</Text>
            </View>
        );
    }

    if (erro || !dados) {
        return (
            <View style={styles.centralizado}>
                <Text style={styles.textoErro}>{erro || 'Informações não encontradas.'}</Text>
                <TouchableOpacity
                    style={styles.botaoVoltarErro}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.textoBotao}>Voltar</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const { fraquezas, resistencias, imunidades } = dados.efetividade;
    const treino = dados.treinamento;

    const chanceCapturaPct = treino.captureRate !== null
        ? `${Math.min(100, Math.round((treino.captureRate / 255) * 100))}%`
        : '--';

    const semGenero = treino.genderRate === -1 || treino.genderRate === null;
    const pctFemea = !semGenero ? (treino.genderRate / 8) * 100 : 0;
    const pctMacho = !semGenero ? 100 - pctFemea : 0;

    const passosEclosao = treino.hatchCounter !== null
        ? `${(treino.hatchCounter + 1) * 255} passos (${treino.hatchCounter} ciclos)`
        : '--';

    return (
        <View style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollWrapper}
            >
                <PokemonHeaderBanner
                    pokemon={dados}
                    capturado={capturado}
                    onVoltar={() => navigation.goBack()}
                    onCapturar={handleCapturar}
                    alturaPalco={135}
                />

                <View style={styles.corpoConteudo}>
                    <View style={styles.cardBloco}>
                        <Text style={styles.tituloSecaoCentro}>Vantagens e desvantagens de dano</Text>

                        <View style={styles.subBlocoDano}>
                            <Text style={styles.subTituloFraqueza}>Sofre dano aumentado (Fraquezas)</Text>
                            <View style={styles.gradeBadges}>
                                {fraquezas.length > 0 ? (
                                    fraquezas.map((item) => {
                                        const estilo = obterEstiloTipo(item.type);
                                        return (
                                            <View
                                                key={item.type}
                                                style={[
                                                    styles.badgeEfetividade,
                                                    { backgroundColor: `${estilo.fundo}CC`, borderColor: estilo.borda },
                                                ]}
                                            >
                                                <Text style={[styles.textoBadgeTipo, { color: estilo.principal }]}>
                                                    {item.type}
                                                </Text>
                                                <View style={styles.tagMultiplicador}>
                                                    <Text style={styles.textoMultiplicador}>{item.multiplier}</Text>
                                                </View>
                                            </View>
                                        );
                                    })
                                ) : (
                                    <Text style={styles.textoNeutro}>Nenhuma fraqueza registrada.</Text>
                                )}
                            </View>
                        </View>

                        <View style={styles.subBlocoDano}>
                            <Text style={styles.subTituloResistencia}>Sofre dano reduzido (Resistências)</Text>
                            <View style={styles.gradeBadges}>
                                {resistencias.length > 0 ? (
                                    resistencias.map((item) => {
                                        const estilo = obterEstiloTipo(item.type);
                                        return (
                                            <View
                                                key={item.type}
                                                style={[
                                                    styles.badgeEfetividade,
                                                    { backgroundColor: `${estilo.fundo}CC`, borderColor: estilo.borda },
                                                ]}
                                            >
                                                <Text style={[styles.textoBadgeTipo, { color: estilo.principal }]}>
                                                    {item.type}
                                                </Text>
                                                <View style={styles.tagMultiplicador}>
                                                    <Text style={styles.textoMultiplicador}>{item.multiplier}</Text>
                                                </View>
                                            </View>
                                        );
                                    })
                                ) : (
                                    <Text style={styles.textoNeutro}>Nenhuma resistência registrada.</Text>
                                )}
                            </View>
                        </View>

                        {imunidades.length > 0 && (
                            <View style={styles.subBlocoDano}>
                                <Text style={styles.subTituloImunidade}>Imunidades (0x)</Text>
                                <View style={styles.gradeBadges}>
                                    {imunidades.map((item) => {
                                        const estilo = obterEstiloTipo(item.type);
                                        return (
                                            <View
                                                key={item.type}
                                                style={[
                                                    styles.badgeEfetividade,
                                                    { backgroundColor: `${estilo.fundo}CC`, borderColor: estilo.borda },
                                                ]}
                                            >
                                                <Text style={[styles.textoBadgeTipo, { color: estilo.principal }]}>
                                                    {item.type}
                                                </Text>
                                                <View style={styles.tagMultiplicador}>
                                                    <Text style={styles.textoMultiplicador}>0x</Text>
                                                </View>
                                            </View>
                                        );
                                    })}
                                </View>
                            </View>
                        )}
                    </View>

                    <View style={styles.cardBloco}>
                        <Text style={styles.tituloSecaoCentro}>Treinamento & IVs</Text>

                        <View style={styles.gradeMetricas}>
                            <View style={styles.caixaMetrica}>
                                <Text style={styles.labelMetrica}>Índice de Captura</Text>
                                <Text style={styles.valorMetrica}>
                                    {treino.captureRate !== null ? `${treino.captureRate} (${chanceCapturaPct})` : '--'}
                                </Text>
                            </View>

                            <View style={styles.caixaMetrica}>
                                <Text style={styles.labelMetrica}>Felicidade Base</Text>
                                <Text style={styles.valorMetrica}>
                                    {treino.baseHappiness !== null ? `${treino.baseHappiness} pts` : '--'}
                                </Text>
                            </View>

                            <View style={styles.caixaMetrica}>
                                <Text style={styles.labelMetrica}>Experiência Base</Text>
                                <Text style={styles.valorMetrica}>
                                    {treino.baseExperience !== null ? `${treino.baseExperience} XP` : '--'}
                                </Text>
                            </View>

                            <View style={styles.caixaMetrica}>
                                <Text style={styles.labelMetrica}>Taxa de Crescimento</Text>
                                <Text style={styles.valorMetrica}>
                                    {treino.growthRate
                                        ? TRADUCAO_CRESCIMENTO[treino.growthRate] || formatarTextoSlug(treino.growthRate)
                                        : '--'}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.linhaDetalheTreino}>
                            <Text style={styles.labelLinhaTreino}>Faixa de IVs (Individual Values)</Text>
                            <Text style={styles.valorLinhaTreino}>{treino.ivRange}</Text>
                        </View>

                        <View style={styles.linhaDetalheTreino}>
                            <Text style={styles.labelLinhaTreino}>Rendimento de EVs (Effort Values)</Text>
                            <View style={styles.grupoEvs}>
                                {treino.evYield.length > 0 ? (
                                    treino.evYield.map((ev) => (
                                        <View key={ev.stat} style={styles.pillEv}>
                                            <Text style={styles.textoPillEv}>
                                                +{ev.effort} {NOMES_EV[ev.stat] || ev.stat}
                                            </Text>
                                        </View>
                                    ))
                                ) : (
                                    <Text style={styles.valorLinhaTreino}>Nenhum EV</Text>
                                )}
                            </View>
                        </View>
                    </View>

                    <View style={styles.cardBloco}>
                        <Text style={styles.tituloSecaoCentro}>Bridge (Reprodução)</Text>

                        <View style={styles.linhaDetalheTreino}>
                            <Text style={styles.labelLinhaTreino}>Egg Groups</Text>
                            <View style={styles.grupoEvs}>
                                {treino.eggGroups.length > 0 ? (
                                    treino.eggGroups.map((grupo) => (
                                        <View key={grupo} style={styles.pillEgg}>
                                            <Text style={styles.textoPillEgg}>{formatarTextoSlug(grupo)}</Text>
                                        </View>
                                    ))
                                ) : (
                                    <Text style={styles.valorLinhaTreino}>Desconhecido</Text>
                                )}
                            </View>
                        </View>

                        <View style={styles.linhaDetalheTreino}>
                            <Text style={styles.labelLinhaTreino}>Distribuição de Gênero</Text>
                            {semGenero ? (
                                <Text style={styles.valorLinhaTreino}>Sem gênero definido</Text>
                            ) : (
                                <View style={styles.blocoGenero}>
                                    <View style={styles.linhaTextoGenero}>
                                        <Text style={styles.textoMacho}>♂ {pctMacho.toFixed(1)}%</Text>
                                        <Text style={styles.textoFemea}>♀ {pctFemea.toFixed(1)}%</Text>
                                    </View>
                                    <View style={styles.barraGeneroFundo}>
                                        <View style={[styles.barraGeneroMacho, { width: `${pctMacho}%` }]} />
                                        <View style={[styles.barraGeneroFemea, { width: `${pctFemea}%` }]} />
                                    </View>
                                </View>
                            )}
                        </View>

                        <View style={styles.linhaDetalheTreino}>
                            <Text style={styles.labelLinhaTreino}>Eclosão do Ovo</Text>
                            <Text style={styles.valorLinhaTreino}>{passosEclosao}</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            <BottomHudPokemon
                abaAtiva="info"
                navigation={navigation}
                pokemon={dados}
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
    scrollWrapper: {
        paddingBottom: espacos.grande,
    },
    corpoConteudo: {
        padding: espacos.medio,
        gap: 14,
    },
    cardBloco: {
        backgroundColor: cores.superficie,
        borderRadius: bordas.raio + 2,
        padding: espacos.medio,
        borderWidth: 1,
        borderColor: cores.borda,
        gap: 12,
    },
    tituloSecaoCentro: {
        color: cores.texto,
        fontSize: fontes.grande,
        fontWeight: '700',
        textAlign: 'center',
    },
    subBlocoDano: {
        gap: 8,
    },
    subTituloFraqueza: {
        color: '#F87171',
        fontSize: 12,
        fontWeight: '700',
    },
    subTituloResistencia: {
        color: '#4ADE80',
        fontSize: 12,
        fontWeight: '700',
    },
    subTituloImunidade: {
        color: '#A1A1AA',
        fontSize: 12,
        fontWeight: '700',
    },
    gradeBadges: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 7,
    },
    badgeEfetividade: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingLeft: 10,
        paddingRight: 5,
        paddingVertical: 4,
        borderRadius: 9,
        borderWidth: 1,
    },
    textoBadgeTipo: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'capitalize',
    },
    tagMultiplicador: {
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    textoMultiplicador: {
        color: cores.texto,
        fontSize: 10,
        fontWeight: '800',
    },
    textoNeutro: {
        color: cores.textoSecundario,
        fontSize: 12,
    },
    gradeMetricas: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 8,
    },
    caixaMetrica: {
        width: '48.5%',
        backgroundColor: cores.fundo,
        borderRadius: bordas.raio,
        padding: 11,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    labelMetrica: {
        color: cores.textoSecundario,
        fontSize: 11,
        fontWeight: '600',
        marginBottom: 4,
    },
    valorMetrica: {
        color: cores.texto,
        fontSize: fontes.normal,
        fontWeight: '800',
    },
    linhaDetalheTreino: {
        backgroundColor: cores.fundo,
        borderRadius: bordas.raio,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        gap: 6,
    },
    labelLinhaTreino: {
        color: cores.textoSecundario,
        fontSize: 11,
        fontWeight: '600',
    },
    valorLinhaTreino: {
        color: cores.texto,
        fontSize: fontes.normal,
        fontWeight: '700',
    },
    grupoEvs: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 2,
    },
    pillEv: {
        backgroundColor: cores.primariaClara,
        borderWidth: 1,
        borderColor: cores.primaria,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    textoPillEv: {
        color: cores.primaria,
        fontSize: 12,
        fontWeight: '700',
    },
    pillEgg: {
        backgroundColor: 'rgba(56, 189, 248, 0.14)',
        borderWidth: 1,
        borderColor: 'rgba(56, 189, 248, 0.45)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    textoPillEgg: {
        color: '#38BDF8',
        fontSize: 12,
        fontWeight: '700',
    },
    blocoGenero: {
        gap: 6,
        marginTop: 2,
    },
    linhaTextoGenero: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    textoMacho: {
        color: '#38BDF8',
        fontSize: 12,
        fontWeight: '700',
    },
    textoFemea: {
        color: '#F472B6',
        fontSize: 12,
        fontWeight: '700',
    },
    barraGeneroFundo: {
        flexDirection: 'row',
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
        backgroundColor: cores.superficie,
    },
    barraGeneroMacho: {
        height: '100%',
        backgroundColor: '#38BDF8',
    },
    barraGeneroFemea: {
        height: '100%',
        backgroundColor: '#F472B6',
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