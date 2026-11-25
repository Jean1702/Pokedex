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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import BottomHudPokemon from '../components/BottomHudPokemon';
import PokemonHeaderBanner, { obterEstiloTipo } from '../components/PokemonHeaderBanner';
import { AuthContext } from '../contexts/AuthContext';
import {
    buscarDetalhesAtaques,
    buscarPokemonPorId,
    buscarStatusPokemonUsuario,
    capturarPokemon,
} from '../services/pokemon.service';
import { cores, fontes, espacos, bordas } from '../styles/theme';

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

function formatarNomeGolpe(slug) {
    return String(slug || '')
        .split('-')
        .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1))
        .join(' ');
}

export default function AttacksPokemonScreen({ route, navigation }) {
    const { id, pokemon: pokemonParam, shiny: shinyParam } = route.params || {};
    const { token, sair } = useContext(AuthContext);

    const [pokemon, setPokemon] = useState(pokemonParam || null);
    const [ehShiny, setEhShiny] = useState(
        shinyParam !== undefined ? Boolean(shinyParam) : Boolean(pokemonParam?.shiny)
    );
    const [carregandoPokemon, setCarregandoPokemon] = useState(!pokemonParam?.moves);
    const [carregandoDetalhes, setCarregandoDetalhes] = useState(false);
    const [erro, setErro] = useState('');

    const [metodoSelecionado, setMetodoSelecionado] = useState('todos');
    const [geracaoSelecionada, setGeracaoSelecionada] = useState('todas');
    const [detalhesMapa, setDetalhesMapa] = useState({});
    const [statusUsuario, setStatusUsuario] = useState({
        catchNormal: false,
        catchShiny: false,
        favNormal: false,
        favShiny: false,
    });

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
            if (shinyParam === undefined) {
                setEhShiny(Boolean(dados.shiny));
            }
        } catch (e) {
            setErro(e.message || 'Erro ao carregar ataques do Pokémon.');
        } finally {
            setCarregandoPokemon(false);
        }
    }, [id, pokemonParam, shinyParam]);

    useEffect(() => {
        carregarBase();
        const pokemonIdAlvo = id || pokemonParam?.id;
        if (pokemonIdAlvo) {
            carregarStatusUsuario(pokemonIdAlvo);
        }
    }, [carregarBase, id, pokemonParam?.id, carregarStatusUsuario]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            const pokemonIdAlvo = id || pokemonParam?.id;
            if (pokemonIdAlvo && token) {
                carregarStatusUsuario(pokemonIdAlvo);
            }
        });
        return unsubscribe;
    }, [navigation, id, pokemonParam?.id, token, carregarStatusUsuario]);

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

        const chave = ehShiny ? 'catchShiny' : 'catchNormal';
        const novoValor = !statusUsuario[chave];
        setStatusUsuario((prev) => ({ ...prev, [chave]: novoValor }));

        try {
            await capturarPokemon(token, pokemon.id, novoValor, ehShiny);
        } catch (e) {
            setStatusUsuario((prev) => ({ ...prev, [chave]: !novoValor }));
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

    return (
        <View style={styles.container}>
            <FlatList
                data={ataquesFiltrados}
                keyExtractor={(item) => item.name}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listaConteudo}
                ListHeaderComponent={
                    <View style={styles.headerListaWrapper}>
                        <PokemonHeaderBanner
                            pokemon={pokemon}
                            shiny={ehShiny}
                            onAlternarShiny={() => setEhShiny((prev) => !prev)}
                            capturado={capturado}
                            onVoltar={() => navigation.goBack()}
                            onCapturar={handleCapturar}
                            alturaPalco={135}
                        />

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
                    </View>
                }
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
                                    <MaterialCommunityIcons
                                        name={estiloTipo.icone}
                                        size={12}
                                        color={estiloTipo.principal}
                                    />
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
    headerListaWrapper: {
        marginHorizontal: -espacos.medio,
        marginBottom: 8,
    },
    blocoFiltros: {
        backgroundColor: cores.superficie,
        marginHorizontal: espacos.medio,
        marginTop: 14,
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