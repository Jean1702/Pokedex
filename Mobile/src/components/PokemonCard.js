import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    Image,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { obterConfigTipo } from '../constants/tiposPokemon';
import { cores, fontes, bordas } from '../styles/theme';

const cacheHabilidades = new Map();

function obterUrlsSprite(id, shiny) {
    const pasta = shiny ? 'shiny/' : '';
    return {
        gif: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/${pasta}${id}.gif`,
        artwork: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pasta}${id}.png`,
    };
}

function formatarHabilidade(slug) {
    return String(slug || '')
        .split('-')
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(' ');
}

export default function PokemonCard({
    item,
    modoShiny = false,
    bloqueadoBlur = false,
    onAbrirDetalhe,
}) {
    const [usarFallbackArtwork, setUsarFallbackArtwork] = useState(false);
    const [expandido, setExpandido] = useState(false);
    const [habilidades, setHabilidades] = useState(() =>
        cacheHabilidades.get(Number(item?.id)) || null
    );
    const [carregandoHabilidades, setCarregandoHabilidades] = useState(false);

    const ehShiny = Boolean(modoShiny || item?.shiny);

    useEffect(() => {
        setUsarFallbackArtwork(false);
    }, [item?.id, ehShiny]);

    useEffect(() => {
        const idNum = Number(item?.id);
        if (!expandido || !idNum) return;

        if (cacheHabilidades.has(idNum)) {
            setHabilidades(cacheHabilidades.get(idNum));
            return;
        }

        let ativo = true;
        const buscarHabilidades = async () => {
            try {
                setCarregandoHabilidades(true);
                const resp = await fetch(`https://pokeapi.co/api/v2/pokemon/${idNum}`);
                if (!resp.ok) return;
                const dados = await resp.json();

                const lista = Array.isArray(dados?.abilities)
                    ? dados.abilities.map((ab) => ({
                        nome: formatarHabilidade(ab.ability?.name),
                        oculta: Boolean(ab.is_hidden),
                    }))
                    : [];

                cacheHabilidades.set(idNum, lista);
                if (ativo) setHabilidades(lista);
            } catch {
                if (ativo) setHabilidades([]);
            } finally {
                if (ativo) setCarregandoHabilidades(false);
            }
        };

        buscarHabilidades();
        return () => {
            ativo = false;
        };
    }, [expandido, item?.id]);

    const tipos =
        Array.isArray(item?.types) && item.types.length > 0
            ? item.types
            : ['Normal'];

    const tema1 = obterConfigTipo(tipos[0]);
    const tema2 = tipos[1] ? obterConfigTipo(tipos[1]) : tema1;
    const numeroFormatado = `#${String(item.id).padStart(2, '0')}`;
    const sprites = obterUrlsSprite(item.id, ehShiny);

    const handlePressCard = () => {
        if (bloqueadoBlur) {
            onAbrirDetalhe && onAbrirDetalhe(item);
            return;
        }

        if (!expandido) {
            setExpandido(true);
            return;
        }

        onAbrirDetalhe && onAbrirDetalhe(item);
    };

    return (
        <TouchableOpacity
            activeOpacity={0.88}
            onPress={handlePressCard}
            style={[
                styles.cardContainer,
                ehShiny && !bloqueadoBlur && styles.cardShiny,
            ]}
        >
            <LinearGradient
                colors={
                    bloqueadoBlur
                        ? ['#15151A', '#111115']
                        : [tema1.fundo, tema2.fundo, '#141418']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradienteCard}
            >
                {expandido && !bloqueadoBlur ? (
                    <View style={styles.cardExpandidoWrapper}>
                        {/* Palco Superior com Sprite Grande */}
                        <View style={styles.palcoGrande}>
                            {ehShiny && (
                                <View style={styles.pilulaShinyTopo}>
                                    <Ionicons name="sparkles" size={11} color="#FACC15" />
                                    <Text style={styles.textoShiny}>SHINY</Text>
                                </View>
                            )}

                            <TouchableOpacity
                                activeOpacity={0.75}
                                onPress={(e) => {
                                    e.stopPropagation?.();
                                    setExpandido(false);
                                }}
                                style={styles.botaoRecolher}
                                hitSlop={8}
                            >
                                <Ionicons name="chevron-up" size={16} color={cores.texto} />
                            </TouchableOpacity>

                            <Image
                                source={{ uri: sprites.artwork || sprites.gif || item.image }}
                                resizeMode="contain"
                                style={styles.spriteGrande}
                            />
                        </View>

                        {/* Linha Divisória igual ao Excalidraw */}
                        <View style={styles.divisorHorizontal} />

                        {/* Rodapé em 3 colunas: Nome #01 | Tipos | Habilidades */}
                        <View style={styles.rodapeExpandido}>
                            <View style={styles.colunaNomeExpandido}>
                                <Text style={styles.nomeExpandido} numberOfLines={2}>
                                    {item.name}{' '}
                                    <Text
                                        style={[
                                            styles.numeroExpandido,
                                            ehShiny && { color: '#FACC15' },
                                        ]}
                                    >
                                        {numeroFormatado}
                                    </Text>
                                </Text>
                            </View>

                            <View style={styles.colunaTiposExpandido}>
                                {tipos.map((tipo) => {
                                    const cfg = obterConfigTipo(tipo);
                                    return (
                                        <View
                                            key={tipo}
                                            style={[
                                                styles.pilulaTipo,
                                                {
                                                    backgroundColor: `${cfg.fundo}E6`,
                                                    borderColor: cfg.borda,
                                                },
                                            ]}
                                        >
                                            <MaterialCommunityIcons
                                                name={cfg.icone}
                                                size={12}
                                                color={cfg.cor}
                                            />
                                            <Text style={[styles.textoTipo, { color: cfg.cor }]}>
                                                {cfg.label}
                                            </Text>
                                        </View>
                                    );
                                })}
                            </View>

                            <View style={styles.colunaHabilidades}>
                                {carregandoHabilidades ? (
                                    <ActivityIndicator size="small" color={tema1.cor} />
                                ) : Array.isArray(habilidades) && habilidades.length > 0 ? (
                                    habilidades.map((hab, idx) => (
                                        <Text
                                            key={`${hab.nome}-${idx}`}
                                            style={[
                                                styles.textoHabilidade,
                                                hab.oculta && styles.textoHabilidadeOculta,
                                            ]}
                                            numberOfLines={1}
                                        >
                                            {hab.oculta ? `H-${hab.nome}` : hab.nome}
                                        </Text>
                                    ))
                                ) : (
                                    <Text style={styles.textoHabilidade}>—</Text>
                                )}
                            </View>
                        </View>
                    </View>
                ) : (
                    /* Estado Recolhido (Padrão da Lista) */
                    <View style={styles.linhaPrincipal}>
                        <View
                            style={[
                                styles.palcoSprite,
                                {
                                    borderColor: bloqueadoBlur
                                        ? 'rgba(255,255,255,0.08)'
                                        : ehShiny
                                            ? 'rgba(250, 204, 21, 0.45)'
                                            : tema1.borda,
                                },
                            ]}
                        >
                            <Image
                                source={{
                                    uri: usarFallbackArtwork
                                        ? sprites.artwork
                                        : sprites.gif || item.image,
                                }}
                                resizeMode="contain"
                                onError={() => {
                                    if (!usarFallbackArtwork) {
                                        setUsarFallbackArtwork(true);
                                    }
                                }}
                                style={[
                                    styles.sprite,
                                    bloqueadoBlur && styles.spriteBloqueado,
                                ]}
                            />
                        </View>

                        <View style={styles.infoColuna}>
                            <View style={styles.topoInfo}>
                                <Text
                                    style={[
                                        styles.nomePokemon,
                                        bloqueadoBlur && styles.textoBloqueado,
                                    ]}
                                    numberOfLines={1}
                                >
                                    {item.name}
                                </Text>

                                <Text
                                    style={[
                                        styles.numeroPokemon,
                                        ehShiny && !bloqueadoBlur && { color: '#FACC15' },
                                    ]}
                                >
                                    {numeroFormatado}
                                </Text>
                            </View>

                            <View style={styles.rodapeInfo}>
                                <View style={styles.listaTipos}>
                                    {tipos.map((tipo) => {
                                        const cfg = obterConfigTipo(tipo);
                                        return (
                                            <View
                                                key={tipo}
                                                style={[
                                                    styles.pilulaTipo,
                                                    {
                                                        backgroundColor: `${cfg.fundo}E6`,
                                                        borderColor: cfg.borda,
                                                    },
                                                ]}
                                            >
                                                <MaterialCommunityIcons
                                                    name={cfg.icone}
                                                    size={12}
                                                    color={cfg.cor}
                                                />
                                                <Text style={[styles.textoTipo, { color: cfg.cor }]}>
                                                    {cfg.label}
                                                </Text>
                                            </View>
                                        );
                                    })}

                                    {ehShiny && !bloqueadoBlur && (
                                        <View style={styles.pilulaShiny}>
                                            <Ionicons name="sparkles" size={10} color="#FACC15" />
                                            <Text style={styles.textoShiny}>SHINY</Text>
                                        </View>
                                    )}
                                </View>

                                <TouchableOpacity
                                    activeOpacity={0.75}
                                    onPress={(e) => {
                                        e.stopPropagation?.();
                                        setExpandido(true);
                                    }}
                                    style={styles.botaoExpandir}
                                    hitSlop={8}
                                >
                                    <Ionicons name="chevron-down" size={14} color={cores.texto} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}

                {bloqueadoBlur && (
                    <BlurView intensity={24} tint="dark" style={styles.overlayBlur}>
                        <View style={styles.tagNaoCapturado}>
                            <MaterialCommunityIcons
                                name="pokeball"
                                size={13}
                                color={cores.textoSecundario}
                            />
                            <Text style={styles.textoNaoCapturado}>Não registrado na Dex</Text>
                        </View>
                    </BlurView>
                )}
            </LinearGradient>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    cardContainer: {
        marginBottom: 10,
        borderRadius: bordas.raio + 4,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    cardShiny: {
        borderColor: 'rgba(250, 204, 21, 0.55)',
    },
    gradienteCard: {
        padding: 12,
        position: 'relative',
    },
    /* --- Estilos Estado Recolhido --- */
    linhaPrincipal: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    palcoSprite: {
        width: 72,
        height: 72,
        borderRadius: 14,
        backgroundColor: 'rgba(0, 0, 0, 0.28)',
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 4,
    },
    sprite: {
        width: 60,
        height: 60,
    },
    spriteBloqueado: {
        opacity: 0.22,
        tintColor: '#000000',
    },
    infoColuna: {
        flex: 1,
        justifyContent: 'space-between',
        gap: 10,
    },
    topoInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    nomePokemon: {
        flex: 1,
        color: cores.texto,
        fontSize: fontes.grande + 1,
        fontWeight: '800',
        textTransform: 'capitalize',
    },
    textoBloqueado: {
        color: cores.textoSecundario,
    },
    numeroPokemon: {
        color: cores.textoSecundario,
        fontSize: fontes.grande,
        fontWeight: '800',
    },
    rodapeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 6,
    },
    listaTipos: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 6,
    },
    botaoExpandir: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: 'rgba(0, 0, 0, 0.35)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.12)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    /* --- Estilos Estado Expandido (Excalidraw) --- */
    cardExpandidoWrapper: {
        gap: 10,
    },
    palcoGrande: {
        height: 155,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    spriteGrande: {
        width: 142,
        height: 142,
    },
    pilulaShinyTopo: {
        position: 'absolute',
        top: 0,
        left: 0,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: 'rgba(250, 204, 21, 0.14)',
        borderWidth: 1,
        borderColor: 'rgba(250, 204, 21, 0.55)',
    },
    botaoRecolher: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.14)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
    },
    divisorHorizontal: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.14)',
        marginHorizontal: -4,
    },
    rodapeExpandido: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        paddingTop: 2,
    },
    colunaNomeExpandido: {
        flex: 1.15,
    },
    nomeExpandido: {
        color: cores.texto,
        fontSize: fontes.normal + 1,
        fontWeight: '800',
        textTransform: 'capitalize',
    },
    numeroExpandido: {
        color: cores.textoSecundario,
        fontWeight: '700',
    },
    colunaTiposExpandido: {
        flex: 1.1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
    },
    colunaHabilidades: {
        flex: 1.15,
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: 3,
    },
    textoHabilidade: {
        color: cores.texto,
        fontSize: 11,
        fontWeight: '600',
        textAlign: 'right',
    },
    textoHabilidadeOculta: {
        color: '#FACC15',
        fontWeight: '700',
    },
    /* --- Pílulas Compartilhadas --- */
    pilulaTipo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: 999,
        borderWidth: 1,
    },
    textoTipo: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'capitalize',
    },
    pilulaShiny: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: 'rgba(250, 204, 21, 0.14)',
        borderWidth: 1,
        borderColor: 'rgba(250, 204, 21, 0.55)',
    },
    textoShiny: {
        color: '#FACC15',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.4,
    },
    overlayBlur: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tagNaoCapturado: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: 'rgba(15, 15, 20, 0.78)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.12)',
    },
    textoNaoCapturado: {
        color: cores.textoSecundario,
        fontSize: 11,
        fontWeight: '700',
    },
});