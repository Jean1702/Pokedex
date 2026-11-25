import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
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
    FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AvatarUser from '../components/AvatarUser';
import UserBottomNav from '../components/UserBottomNav';
import { obterConfigTipo } from '../constants/tiposPokemon';
import { AuthContext } from '../contexts/AuthContext';
import {
    listarCapturadosUsuario,
    listarPokemons,
} from '../services/pokemon.service';
import {
    adicionarPokemonAoTime,
    atualizarTime,
    criarTime,
    excluirTime,
    listarTimes,
    removerPokemonDoTime,
} from '../services/team.service';
import { cores, fontes, espacos, bordas } from '../styles/theme';

const ESTILOS_TIME = [
    'Competitivo',
    'Aventura',
    'Monotype',
    'Shiny Hunt',
    'Liga Pokémon',
];

function obterSpriteSlot(id, shiny) {
    const pasta = shiny ? 'shiny/' : '';
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/${pasta}${id}.gif`;
}

export default function TeamScreen({ navigation }) {
    const { token, sair } = useContext(AuthContext);

    const [times, setTimes] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');

    const [modalTimeVisivel, setModalTimeVisivel] = useState(false);
    const [timeEmEdicao, setTimeEmEdicao] = useState(null);
    const [nomeNovoTime, setNomeNovoTime] = useState('');
    const [estiloNovoTime, setEstiloNovoTime] = useState('');
    const [salvandoTime, setSalvandoTime] = useState(false);

    const [timeAlvoSlot, setTimeAlvoSlot] = useState(null);
    const [abaSeletor, setAbaSeletor] = useState('capturados');
    const [capturadosUsuario, setCapturadosUsuario] = useState([]);
    const [todosPokemons, setTodosPokemons] = useState([]);
    const [carregandoSeletor, setCarregandoSeletor] = useState(false);
    const [buscaSeletor, setBuscaSeletor] = useState('');
    const [shinySeletorDex, setShinySeletorDex] = useState(false);
    const [escalandoPokemon, setEscalandoPokemon] = useState(false);

    const lidarCom401 = useCallback(async (err) => {
        if (err?.status === 401) {
            await sair();
            return true;
        }
        return false;
    }, [sair]);

    const carregarTimes = useCallback(async (silencioso = false) => {
        if (!token) return;

        try {
            if (!silencioso) setCarregando(true);
            setErro('');

            const dados = await listarTimes(token);
            setTimes(Array.isArray(dados) ? dados : []);
        } catch (e) {
            const expirou = await lidarCom401(e);
            if (!expirou) {
                setErro(e.message || 'Erro ao carregar times.');
            }
        } finally {
            setCarregando(false);
        }
    }, [token, lidarCom401]);

    useEffect(() => {
        carregarTimes();
    }, [carregarTimes]);

    const abrirModalCriarTime = () => {
        setTimeEmEdicao(null);
        setNomeNovoTime('');
        setEstiloNovoTime('');
        setModalTimeVisivel(true);
    };

    const abrirModalEditarTime = (time) => {
        setTimeEmEdicao(time);
        setNomeNovoTime(time.name || '');
        setEstiloNovoTime(time.style || '');
        setModalTimeVisivel(true);
    };

    const handleSalvarTime = async () => {
        if (!nomeNovoTime.trim() || salvandoTime) return;

        try {
            setSalvandoTime(true);
            if (timeEmEdicao) {
                const atualizado = await atualizarTime(token, timeEmEdicao.id, {
                    name: nomeNovoTime.trim(),
                    style: estiloNovoTime.trim() || null,
                });
                setTimes((prev) =>
                    prev.map((t) =>
                        t.id === timeEmEdicao.id
                            ? { ...t, name: atualizado.name, style: atualizado.style }
                            : t
                    )
                );
            } else {
                const criado = await criarTime(token, {
                    name: nomeNovoTime.trim(),
                    style: estiloNovoTime.trim() || null,
                });
                setTimes((prev) => [...prev, { ...criado, pokemon_team: [] }]);
            }
            setModalTimeVisivel(false);
        } catch (e) {
            await lidarCom401(e);
        } finally {
            setSalvandoTime(false);
        }
    };

    const handleExcluirTime = async (teamId) => {
        const backup = times;
        setTimes((prev) => prev.filter((t) => t.id !== teamId));

        try {
            await excluirTime(token, teamId);
        } catch (e) {
            setTimes(backup);
            await lidarCom401(e);
        }
    };

    const abrirSeletorSlot = async (time) => {
        setTimeAlvoSlot(time);
        setBuscaSeletor('');
        setShinySeletorDex(false);
        setAbaSeletor('capturados');

        try {
            setCarregandoSeletor(true);
            const [caps, dex] = await Promise.all([
                listarCapturadosUsuario(token),
                todosPokemons.length > 0 ? Promise.resolve(todosPokemons) : listarPokemons([]),
            ]);

            const capsNormalizados = Array.isArray(caps)
                ? caps
                    .map((row) => {
                        const base = row?.pokemons || row;
                        if (!base?.id) return null;
                        return {
                            id: base.id,
                            name: base.name,
                            types: base.types || [],
                            shiny: typeof base.shiny === 'boolean' ? base.shiny : Boolean(row?.catch_shiny),
                        };
                    })
                    .filter(Boolean)
                : [];

            const dexBase = Array.isArray(dex)
                ? dex.filter((p) => Number(p.id) <= 1025)
                : [];

            setCapturadosUsuario(capsNormalizados);
            if (todosPokemons.length === 0) {
                setTodosPokemons(dexBase);
            }

            if (capsNormalizados.length === 0) {
                setAbaSeletor('pokedex');
            }
        } catch (e) {
            await lidarCom401(e);
        } finally {
            setCarregandoSeletor(false);
        }
    };

    const handleEscalarPokemon = async (pokemonId, ehShiny) => {
        if (!timeAlvoSlot || escalandoPokemon) return;

        try {
            setEscalandoPokemon(true);
            const timeAtualizado = await adicionarPokemonAoTime(token, timeAlvoSlot.id, {
                id_pokemon: pokemonId,
                shiny: ehShiny,
            });

            setTimes((prev) =>
                prev.map((t) => (t.id === timeAtualizado.id ? timeAtualizado : t))
            );
            setTimeAlvoSlot(null);
        } catch (e) {
            await lidarCom401(e);
        } finally {
            setEscalandoPokemon(false);
        }
    };

    const handleRemoverMembro = async (teamId, pokemonTeamId) => {
        try {
            const timeAtualizado = await removerPokemonDoTime(token, teamId, pokemonTeamId);
            setTimes((prev) =>
                prev.map((t) => (t.id === timeAtualizado.id ? timeAtualizado : t))
            );
        } catch (e) {
            await lidarCom401(e);
        }
    };

    const listaFiltradaSeletor = useMemo(() => {
        const origem = abaSeletor === 'capturados' ? capturadosUsuario : todosPokemons;
        const termo = buscaSeletor.trim().toLowerCase();

        return origem.filter((p) => {
            if (!termo) return true;
            return (
                p.name?.toLowerCase().includes(termo) ||
                String(p.id).includes(termo)
            );
        });
    }, [abaSeletor, capturadosUsuario, todosPokemons, buscaSeletor]);

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#251B18', '#141418']}
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
                        <Text style={styles.tagSubtitulo}>FORMAÇÃO DE EQUIPE</Text>
                        <Text style={styles.tituloPrincipal}>Meus Times</Text>
                    </View>

                    <AvatarUser
                        tamanho={44}
                        onPress={() => navigation.navigate('UserScreen')}
                    />
                </View>
            </LinearGradient>

            <View style={styles.barraAcoesTopo}>
                <Text style={styles.textoContador}>
                    {times.length} {times.length === 1 ? 'equipe montada' : 'equipes montadas'}
                </Text>

                <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={abrirModalCriarTime}
                    style={styles.botaoNovoTime}
                >
                    <Ionicons name="add" size={17} color={cores.texto} />
                    <Text style={styles.textoBotaoNovoTime}>Novo Time</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollConteudo}
            >
                {carregando ? (
                    <View style={styles.centralizado}>
                        <ActivityIndicator size="large" color={cores.primaria} />
                        <Text style={styles.textoStatus}>Carregando equipes...</Text>
                    </View>
                ) : erro ? (
                    <View style={styles.centralizado}>
                        <Text style={styles.textoErro}>{erro}</Text>
                        <TouchableOpacity style={styles.botaoTentar} onPress={() => carregarTimes()}>
                            <Text style={styles.textoBotao}>Tentar novamente</Text>
                        </TouchableOpacity>
                    </View>
                ) : times.length === 0 ? (
                    <View style={styles.vazioBox}>
                        <MaterialCommunityIcons name="pokeball" size={38} color={cores.primaria} />
                        <Text style={styles.tituloVazio}>Nenhum time criado ainda</Text>
                        <Text style={styles.textoStatus}>
                            Crie sua primeira equipe e escale até 6 Pokémon capturados ou da Pokédex.
                        </Text>
                        <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={abrirModalCriarTime}
                            style={styles.botaoCriarPrimeiro}
                        >
                            <Text style={styles.textoBotao}>Criar primeiro time</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    times.map((time) => {
                        const membros = Array.isArray(time.pokemon_team) ? time.pokemon_team : [];
                        const slots = Array.from({ length: 6 }, (_, idx) => membros[idx] || null);
                        const tiposUnicos = [
                            ...new Set(
                                membros.flatMap((m) => (Array.isArray(m?.pokemons?.types) ? m.pokemons.types : []))
                            ),
                        ];

                        return (
                            <View key={time.id} style={styles.cardTime}>
                                <View style={styles.headerCardTime}>
                                    <View style={styles.infoTimeTopo}>
                                        <View style={styles.linhaNomeTime}>
                                            <Text style={styles.nomeTime}>{time.name}</Text>
                                            <View style={styles.badgeContagem}>
                                                <Text style={styles.textoContagem}>{membros.length}/6</Text>
                                            </View>
                                        </View>
                                        {time.style ? (
                                            <Text style={styles.estiloTime}>{time.style}</Text>
                                        ) : null}
                                    </View>

                                    <View style={styles.acoesCardTime}>
                                        <TouchableOpacity
                                            activeOpacity={0.8}
                                            onPress={() => abrirModalEditarTime(time)}
                                            style={styles.botaoIconeTime}
                                        >
                                            <Ionicons name="pencil" size={15} color={cores.textoSecundario} />
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            activeOpacity={0.8}
                                            onPress={() => handleExcluirTime(time.id)}
                                            style={[styles.botaoIconeTime, styles.botaoExcluirTime]}
                                        >
                                            <Ionicons name="trash-outline" size={15} color={cores.erro} />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View style={styles.gradeSlots}>
                                    {slots.map((membro, index) => {
                                        if (!membro || !membro.pokemons) {
                                            return (
                                                <TouchableOpacity
                                                    key={`vazio-${index}`}
                                                    activeOpacity={0.75}
                                                    onPress={() => abrirSeletorSlot(time)}
                                                    style={styles.slotVazio}
                                                >
                                                    <Ionicons name="add" size={22} color={cores.textoSecundario} />
                                                    <Text style={styles.textoSlotVazio}>Slot {index + 1}</Text>
                                                </TouchableOpacity>
                                            );
                                        }

                                        const poke = membro.pokemons;
                                        const ehShinySlot = Boolean(membro.shiny || poke.shiny);

                                        return (
                                            <View
                                                key={membro.id}
                                                style={[
                                                    styles.slotPreenchido,
                                                    ehShinySlot && styles.slotPreenchidoShiny,
                                                ]}
                                            >
                                                <TouchableOpacity
                                                    activeOpacity={0.85}
                                                    onPress={() =>
                                                        navigation.navigate('PokemonScreen', {
                                                            id: poke.id,
                                                            shiny: ehShinySlot,
                                                        })
                                                    }
                                                    style={styles.conteudoSlot}
                                                >
                                                    {ehShinySlot && (
                                                        <View style={styles.iconeShinySlot}>
                                                            <Ionicons name="sparkles" size={10} color="#FACC15" />
                                                        </View>
                                                    )}

                                                    <Image
                                                        source={{ uri: obterSpriteSlot(poke.id, ehShinySlot) }}
                                                        resizeMode="contain"
                                                        style={styles.spriteSlot}
                                                    />
                                                    <Text
                                                        style={[
                                                            styles.nomeSlot,
                                                            ehShinySlot && { color: '#FEF08A' },
                                                        ]}
                                                        numberOfLines={1}
                                                    >
                                                        {poke.name}
                                                    </Text>
                                                </TouchableOpacity>

                                                <TouchableOpacity
                                                    activeOpacity={0.8}
                                                    onPress={() => handleRemoverMembro(time.id, membro.id)}
                                                    style={styles.botaoRemoverMembro}
                                                    hitSlop={6}
                                                >
                                                    <Ionicons name="close" size={12} color={cores.texto} />
                                                </TouchableOpacity>
                                            </View>
                                        );
                                    })}
                                </View>

                                {tiposUnicos.length > 0 && (
                                    <View style={styles.rodapeCobertura}>
                                        <Text style={styles.labelCobertura}>Tipos na equipe:</Text>
                                        <View style={styles.listaTiposCobertura}>
                                            {tiposUnicos.map((tipo) => {
                                                const cfg = obterConfigTipo(tipo);
                                                return (
                                                    <View
                                                        key={tipo}
                                                        style={[
                                                            styles.chipTipoCobertura,
                                                            {
                                                                backgroundColor: cfg.fundo,
                                                                borderColor: cfg.borda,
                                                            },
                                                        ]}
                                                    >
                                                        <MaterialCommunityIcons
                                                            name={cfg.icone}
                                                            size={12}
                                                            color={cfg.cor}
                                                        />
                                                        <Text style={[styles.valorCobertura, { color: cfg.cor }]}>
                                                            {cfg.label}
                                                        </Text>
                                                    </View>
                                                );
                                            })}
                                        </View>
                                    </View>
                                )}
                            </View>
                        );
                    })
                )}
            </ScrollView>

            {/* Modal Criar / Editar Time */}
            <Modal
                visible={modalTimeVisivel}
                transparent
                animationType="fade"
                onRequestClose={() => setModalTimeVisivel(false)}
            >
                <Pressable style={styles.modalBackdrop} onPress={() => setModalTimeVisivel(false)}>
                    <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitulo}>
                                {timeEmEdicao ? 'Editar Time' : 'Novo Time'}
                            </Text>
                            <TouchableOpacity onPress={() => setModalTimeVisivel(false)}>
                                <Ionicons name="close" size={20} color={cores.texto} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.labelInput}>Nome da Equipe</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ex: Equipe Liga Kanto"
                            placeholderTextColor={cores.textoSecundario}
                            value={nomeNovoTime}
                            onChangeText={setNomeNovoTime}
                        />

                        <Text style={styles.labelInput}>Estilo (opcional)</Text>
                        <View style={styles.linhaEstilos}>
                            {ESTILOS_TIME.map((est) => {
                                const ativo = estiloNovoTime === est;
                                return (
                                    <TouchableOpacity
                                        key={est}
                                        onPress={() => setEstiloNovoTime(ativo ? '' : est)}
                                        style={[styles.chipEstilo, ativo && styles.chipEstiloAtivo]}
                                    >
                                        <Text style={[styles.textoChipEstilo, ativo && { color: cores.texto }]}>
                                            {est}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={handleSalvarTime}
                            disabled={!nomeNovoTime.trim() || salvandoTime}
                            style={[
                                styles.botaoConfirmarModal,
                                (!nomeNovoTime.trim() || salvandoTime) && { opacity: 0.5 },
                            ]}
                        >
                            {salvandoTime ? (
                                <ActivityIndicator size="small" color={cores.texto} />
                            ) : (
                                <Text style={styles.textoBotao}>
                                    {timeEmEdicao ? 'Salvar Alterações' : 'Criar Time'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </Pressable>
                </Pressable>
            </Modal>

            {/* Modal Híbrido: Escalar Pokémon (Capturados + Pokédex Completa) */}
            <Modal
                visible={timeAlvoSlot !== null}
                transparent
                animationType="fade"
                onRequestClose={() => setTimeAlvoSlot(null)}
            >
                <Pressable style={styles.modalBackdrop} onPress={() => setTimeAlvoSlot(null)}>
                    <Pressable style={styles.modalSeletorCard} onPress={(e) => e.stopPropagation()}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitulo}>Escalar Pokémon</Text>
                                <Text style={styles.subtituloModalSeletor}>
                                    Time: {timeAlvoSlot?.name}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => setTimeAlvoSlot(null)}>
                                <Ionicons name="close" size={20} color={cores.texto} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.abasSeletor}>
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => setAbaSeletor('capturados')}
                                style={[
                                    styles.abaSeletorBtn,
                                    abaSeletor === 'capturados' && styles.abaSeletorBtnAtiva,
                                ]}
                            >
                                <Ionicons
                                    name="checkmark-circle"
                                    size={15}
                                    color={abaSeletor === 'capturados' ? '#38BDF8' : cores.textoSecundario}
                                />
                                <Text
                                    style={[
                                        styles.textoAbaSeletor,
                                        abaSeletor === 'capturados' && { color: '#38BDF8' },
                                    ]}
                                >
                                    Capturados ({capturadosUsuario.length})
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => setAbaSeletor('pokedex')}
                                style={[
                                    styles.abaSeletorBtn,
                                    abaSeletor === 'pokedex' && styles.abaSeletorBtnAtivaDex,
                                ]}
                            >
                                <MaterialCommunityIcons
                                    name="pokeball"
                                    size={15}
                                    color={abaSeletor === 'pokedex' ? cores.primaria : cores.textoSecundario}
                                />
                                <Text
                                    style={[
                                        styles.textoAbaSeletor,
                                        abaSeletor === 'pokedex' && { color: cores.texto },
                                    ]}
                                >
                                    Pokédex
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.barraBuscaSeletor}>
                            <View style={styles.caixaBuscaModal}>
                                <Ionicons name="search" size={16} color={cores.textoSecundario} />
                                <TextInput
                                    style={styles.inputBuscaModal}
                                    placeholder="Buscar por nome ou #..."
                                    placeholderTextColor={cores.textoSecundario}
                                    value={buscaSeletor}
                                    onChangeText={setBuscaSeletor}
                                    autoCapitalize="none"
                                />
                            </View>

                            {abaSeletor === 'pokedex' && (
                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    onPress={() => setShinySeletorDex((prev) => !prev)}
                                    style={[
                                        styles.botaoShinySeletor,
                                        shinySeletorDex && styles.botaoShinySeletorAtivo,
                                    ]}
                                >
                                    <Ionicons
                                        name={shinySeletorDex ? 'sparkles' : 'sparkles-outline'}
                                        size={15}
                                        color={shinySeletorDex ? '#FACC15' : cores.textoSecundario}
                                    />
                                    <Text
                                        style={[
                                            styles.textoShinySeletor,
                                            shinySeletorDex && { color: '#FACC15' },
                                        ]}
                                    >
                                        Shiny
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {carregandoSeletor ? (
                            <View style={styles.loadingSeletor}>
                                <ActivityIndicator size="large" color={cores.primaria} />
                            </View>
                        ) : (
                            <FlatList
                                data={listaFiltradaSeletor}
                                keyExtractor={(item, idx) =>
                                    `${abaSeletor}-${item.id}-${item.shiny ? 's' : 'n'}-${idx}`
                                }
                                style={styles.listaSeletor}
                                showsVerticalScrollIndicator={false}
                                ListEmptyComponent={
                                    <View style={styles.vazioSeletor}>
                                        <Text style={styles.textoStatus}>
                                            {abaSeletor === 'capturados'
                                                ? 'Você ainda não capturou Pokémon. Use a aba Pokédex ao lado!'
                                                : 'Nenhum Pokémon encontrado.'}
                                        </Text>
                                    </View>
                                }
                                renderItem={({ item }) => {
                                    const ehShinyItem =
                                        abaSeletor === 'capturados' ? Boolean(item.shiny) : shinySeletorDex;

                                    return (
                                        <TouchableOpacity
                                            activeOpacity={0.8}
                                            disabled={escalandoPokemon}
                                            onPress={() => handleEscalarPokemon(item.id, ehShinyItem)}
                                            style={[
                                                styles.itemPokemonSeletor,
                                                ehShinyItem && styles.itemPokemonSeletorShiny,
                                            ]}
                                        >
                                            <Image
                                                source={{ uri: obterSpriteSlot(item.id, ehShinyItem) }}
                                                resizeMode="contain"
                                                style={styles.spriteItemSeletor}
                                            />

                                            <View style={styles.infoItemSeletor}>
                                                <Text
                                                    style={[
                                                        styles.nomeItemSeletor,
                                                        ehShinyItem && { color: '#FEF08A' },
                                                    ]}
                                                >
                                                    {item.name}{' '}
                                                    <Text style={styles.numItemSeletor}>
                                                        #{String(item.id).padStart(2, '0')}
                                                    </Text>
                                                </Text>
                                                <Text style={styles.tiposItemSeletor}>
                                                    {Array.isArray(item.types) ? item.types.join(' • ') : ''}
                                                </Text>
                                            </View>

                                            {ehShinyItem && (
                                                <View style={styles.tagShinyLista}>
                                                    <Ionicons name="sparkles" size={11} color="#FACC15" />
                                                    <Text style={styles.textoTagShinyLista}>SHINY</Text>
                                                </View>
                                            )}

                                            <Ionicons name="add-circle" size={22} color={cores.primaria} />
                                        </TouchableOpacity>
                                    );
                                }}
                            />
                        )}
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
    headerTela: {
        margin: espacos.medio,
        marginBottom: 8,
        padding: espacos.medio,
        borderRadius: bordas.raio + 6,
        borderWidth: 1,
        borderColor: 'rgba(217, 80, 50, 0.3)',
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
        color: cores.primaria,
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
    barraAcoesTopo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: espacos.medio + 2,
        marginBottom: 10,
    },
    textoContador: {
        color: cores.textoSecundario,
        fontSize: 12,
        fontWeight: '600',
    },
    botaoNovoTime: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: cores.primaria,
        paddingHorizontal: 13,
        paddingVertical: 8,
        borderRadius: 10,
    },
    textoBotaoNovoTime: {
        color: cores.texto,
        fontSize: 12,
        fontWeight: '800',
    },
    scrollConteudo: {
        paddingHorizontal: espacos.medio,
        paddingBottom: espacos.grande * 1.5,
        gap: 14,
    },
    centralizado: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 48,
        gap: 10,
    },
    vazioBox: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: cores.superficie,
        borderRadius: bordas.raio + 4,
        padding: espacos.grande,
        borderWidth: 1,
        borderColor: cores.borda,
        gap: 10,
        marginTop: 12,
    },
    tituloVazio: {
        color: cores.texto,
        fontSize: fontes.grande,
        fontWeight: '700',
    },
    botaoCriarPrimeiro: {
        backgroundColor: cores.primaria,
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 10,
        marginTop: 4,
    },
    cardTime: {
        backgroundColor: cores.superficie,
        borderRadius: bordas.raio + 4,
        padding: espacos.medio,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        gap: 12,
    },
    headerCardTime: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
    },
    infoTimeTopo: {
        flex: 1,
    },
    linhaNomeTime: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    nomeTime: {
        color: cores.texto,
        fontSize: fontes.grande,
        fontWeight: '800',
    },
    badgeContagem: {
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 7,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
    textoContagem: {
        color: cores.textoSecundario,
        fontSize: 11,
        fontWeight: '700',
    },
    estiloTime: {
        color: cores.primaria,
        fontSize: 11,
        fontWeight: '700',
        marginTop: 2,
    },
    acoesCardTime: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    botaoIconeTime: {
        width: 32,
        height: 32,
        borderRadius: 9,
        backgroundColor: cores.fundo,
        borderWidth: 1,
        borderColor: cores.borda,
        justifyContent: 'center',
        alignItems: 'center',
    },
    botaoExcluirTime: {
        borderColor: 'rgba(239, 68, 68, 0.3)',
        backgroundColor: 'rgba(239, 68, 68, 0.08)',
    },
    gradeSlots: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 8,
    },
    slotVazio: {
        width: '31.2%',
        height: 92,
        borderRadius: 12,
        backgroundColor: '#111115',
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: 'rgba(255, 255, 255, 0.16)',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 4,
    },
    textoSlotVazio: {
        color: cores.textoSecundario,
        fontSize: 10,
        fontWeight: '600',
    },
    slotPreenchido: {
        width: '31.2%',
        height: 92,
        borderRadius: 12,
        backgroundColor: '#121217',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.14)',
        position: 'relative',
        overflow: 'hidden',
    },
    slotPreenchidoShiny: {
        borderColor: 'rgba(250, 204, 21, 0.65)',
        backgroundColor: '#1C1910',
    },
    conteudoSlot: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 6,
    },
    iconeShinySlot: {
        position: 'absolute',
        top: 5,
        left: 6,
    },
    spriteSlot: {
        width: 52,
        height: 52,
    },
    nomeSlot: {
        color: cores.texto,
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'capitalize',
        marginTop: 2,
    },
    botaoRemoverMembro: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 19,
        height: 19,
        borderRadius: 9.5,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    rodapeCobertura: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.07)',
    },
    labelCobertura: {
        color: cores.textoSecundario,
        fontSize: 11,
        fontWeight: '600',
        marginTop: 4,
    },
    listaTiposCobertura: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    chipTipoCobertura: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 7,
        borderWidth: 1,
    },
    valorCobertura: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'capitalize',
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
    modalSeletorCard: {
        width: '100%',
        maxWidth: 440,
        maxHeight: '82%',
        backgroundColor: '#18181D',
        borderRadius: 18,
        padding: espacos.medio + 2,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.14)',
        gap: 10,
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
    subtituloModalSeletor: {
        color: cores.primaria,
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
    linhaEstilos: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 7,
    },
    chipEstilo: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 9,
        backgroundColor: cores.fundo,
        borderWidth: 1,
        borderColor: cores.borda,
    },
    chipEstiloAtivo: {
        borderColor: cores.primaria,
        backgroundColor: cores.primariaClara,
    },
    textoChipEstilo: {
        color: cores.textoSecundario,
        fontSize: 12,
        fontWeight: '600',
    },
    botaoConfirmarModal: {
        height: 44,
        borderRadius: 11,
        backgroundColor: cores.primaria,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 4,
    },
    abasSeletor: {
        flexDirection: 'row',
        gap: 8,
    },
    abaSeletorBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 9,
        borderRadius: 10,
        backgroundColor: cores.fundo,
        borderWidth: 1,
        borderColor: cores.borda,
    },
    abaSeletorBtnAtiva: {
        borderColor: '#38BDF8',
        backgroundColor: 'rgba(56, 189, 248, 0.14)',
    },
    abaSeletorBtnAtivaDex: {
        borderColor: cores.primaria,
        backgroundColor: cores.primariaClara,
    },
    textoAbaSeletor: {
        color: cores.textoSecundario,
        fontSize: 12,
        fontWeight: '700',
    },
    barraBuscaSeletor: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    caixaBuscaModal: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        height: 40,
        backgroundColor: cores.fundo,
        borderRadius: 10,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: cores.borda,
    },
    inputBuscaModal: {
        flex: 1,
        color: cores.texto,
        fontSize: 13,
        outlineStyle: 'none',
    },
    botaoShinySeletor: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        height: 40,
        paddingHorizontal: 11,
        borderRadius: 10,
        backgroundColor: cores.fundo,
        borderWidth: 1,
        borderColor: cores.borda,
    },
    botaoShinySeletorAtivo: {
        borderColor: 'rgba(250, 204, 21, 0.65)',
        backgroundColor: 'rgba(250, 204, 21, 0.16)',
    },
    textoShinySeletor: {
        color: cores.textoSecundario,
        fontSize: 12,
        fontWeight: '700',
    },
    loadingSeletor: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    listaSeletor: {
        maxHeight: 340,
    },
    vazioSeletor: {
        paddingVertical: 32,
        alignItems: 'center',
    },
    itemPokemonSeletor: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: cores.fundo,
        padding: 9,
        borderRadius: 11,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        marginBottom: 7,
    },
    itemPokemonSeletorShiny: {
        borderColor: 'rgba(250, 204, 21, 0.5)',
        backgroundColor: '#1A1811',
    },
    spriteItemSeletor: {
        width: 44,
        height: 44,
    },
    infoItemSeletor: {
        flex: 1,
    },
    nomeItemSeletor: {
        color: cores.texto,
        fontSize: 14,
        fontWeight: '700',
        textTransform: 'capitalize',
    },
    numItemSeletor: {
        color: cores.textoSecundario,
        fontSize: 12,
    },
    tiposItemSeletor: {
        color: cores.textoSecundario,
        fontSize: 11,
        textTransform: 'capitalize',
        marginTop: 2,
    },
    tagShinyLista: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 7,
        backgroundColor: 'rgba(250, 204, 21, 0.16)',
        borderWidth: 1,
        borderColor: 'rgba(250, 204, 21, 0.5)',
    },
    textoTagShinyLista: {
        color: '#FACC15',
        fontSize: 9,
        fontWeight: '800',
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
    },
    botaoTentar: {
        backgroundColor: cores.primaria,
        paddingHorizontal: 16,
        paddingVertical: 9,
        borderRadius: 10,
    },
    textoBotao: {
        color: cores.texto,
        fontSize: fontes.normal,
        fontWeight: '700',
    },
});