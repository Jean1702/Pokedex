import React, { useEffect, useRef, useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    Image,
    TouchableOpacity,
    Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { obterConfigTipo } from '../constants/tiposPokemon';
import { cores, fontes, espacos } from '../styles/theme';

export function obterEstiloTipo(nomeTipo) {
    const cfg = obterConfigTipo(nomeTipo);
    return {
        principal: cfg.cor,
        fundo: cfg.fundo,
        borda: cfg.borda,
        icone: cfg.icone,
        label: cfg.label,
    };
}

export default function PokemonHeaderBanner({
    pokemon,
    shiny = false,
    onAlternarShiny,
    capturado = false,
    onVoltar,
    onCapturar,
    alturaPalco = 145,
}) {
    const [indiceSprite, setIndiceSprite] = useState(0);
    const [erroSprite, setErroSprite] = useState(false);

    const animSprite = useRef(new Animated.Value(1)).current;
    const largurasIndicadores = useRef([
        new Animated.Value(18),
        new Animated.Value(6),
        new Animated.Value(6),
    ]).current;

    useEffect(() => {
        setErroSprite(false);
    }, [pokemon?.id, shiny, indiceSprite]);

    useEffect(() => {
        largurasIndicadores.forEach((anim, idx) => {
            Animated.spring(anim, {
                toValue: idx === indiceSprite ? 18 : 6,
                friction: 7,
                tension: 90,
                useNativeDriver: false,
            }).start();
        });

        animSprite.setValue(0.86);
        Animated.spring(animSprite, {
            toValue: 1,
            friction: 6,
            tension: 100,
            useNativeDriver: true,
        }).start();
    }, [indiceSprite, animSprite, largurasIndicadores]);

    const tipos =
        Array.isArray(pokemon?.types) && pokemon.types.length > 0
            ? pokemon.types
            : ['Normal'];

    const tema1 = obterEstiloTipo(tipos[0]);
    const tema2 = tipos[1] ? obterEstiloTipo(tipos[1]) : tema1;
    const numeroFormatado = `#${String(pokemon?.id || 0).padStart(2, '0')}`;
    const pasta = shiny ? 'shiny/' : '';

    const listaSprites = [
        `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/${pasta}${pokemon?.id}.gif`,
        `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pasta}${pokemon?.id}.png`,
        `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pasta}${pokemon?.id}.png`,
    ];

    const uriAtual = erroSprite
        ? listaSprites[1]
        : listaSprites[indiceSprite] || listaSprites[1];

    return (
        <LinearGradient
            colors={[tema1.fundo, tema2.fundo]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.bannerContainer}
        >
            <View style={styles.barraSuperior}>
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={onVoltar}
                    style={styles.botaoCircular}
                >
                    <Ionicons name="arrow-back" size={18} color={cores.texto} />
                </TouchableOpacity>

                <Text style={styles.tituloTopo} numberOfLines={1}>
                    {pokemon?.name} {numeroFormatado}
                </Text>

                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={onCapturar}
                    style={[
                        styles.botaoCircular,
                        capturado && styles.botaoCapturadoAtivo,
                    ]}
                >
                    <MaterialCommunityIcons
                        name="pokeball"
                        size={20}
                        color={capturado ? '#38BDF8' : cores.textoSecundario}
                    />
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => setIndiceSprite((prev) => (prev + 1) % listaSprites.length)}
                style={[styles.palcoCentral, { height: alturaPalco }]}
            >
                <View style={styles.circuloDestaque}>
                    <Animated.View
                        style={{
                            transform: [{ scale: animSprite }],
                            opacity: animSprite,
                        }}
                    >
                        <Image
                            source={{ uri: uriAtual }}
                            resizeMode="contain"
                            onError={() => setErroSprite(true)}
                            style={styles.spritePrincipal}
                        />
                    </Animated.View>
                </View>
            </TouchableOpacity>

            <View style={styles.barraInferior}>
                <View style={styles.slotLateralEsquerdo}>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={onAlternarShiny}
                        style={[styles.botaoShiny, shiny && styles.botaoShinyAtivo]}
                    >
                        <Ionicons
                            name={shiny ? 'sparkles' : 'sparkles-outline'}
                            size={13}
                            color={shiny ? '#FACC15' : cores.texto}
                        />
                        <Text style={[styles.textoShiny, shiny && { color: '#FACC15' }]}>
                            Shiny
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.indicadoresCarrossel}>
                    {listaSprites.map((_, idx) => {
                        const ativo = indiceSprite === idx;
                        return (
                            <TouchableOpacity
                                key={idx}
                                activeOpacity={0.8}
                                onPress={() => setIndiceSprite(idx)}
                                hitSlop={6}
                            >
                                <Animated.View
                                    style={[
                                        styles.pontoCarrossel,
                                        {
                                            width: largurasIndicadores[idx],
                                            backgroundColor: ativo
                                                ? cores.texto
                                                : 'rgba(255, 255, 255, 0.3)',
                                        },
                                    ]}
                                />
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <View style={styles.slotLateralDireito}>
                    <View style={styles.grupoTipos}>
                        {tipos.map((tipo) => {
                            const estilo = obterEstiloTipo(tipo);
                            return (
                                <View
                                    key={tipo}
                                    style={[
                                        styles.pilulaTipo,
                                        {
                                            backgroundColor: `${estilo.fundo}D9`,
                                            borderColor: estilo.borda,
                                        },
                                    ]}
                                >
                                    <MaterialCommunityIcons
                                        name={estilo.icone}
                                        size={12}
                                        color={estilo.principal}
                                    />
                                    <Text style={[styles.textoTipo, { color: estilo.principal }]}>
                                        {estilo.label}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                </View>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    bannerContainer: {
        paddingTop: espacos.medio,
        paddingBottom: 12,
        paddingHorizontal: espacos.medio,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    barraSuperior: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
    },
    botaoCircular: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(0, 0, 0, 0.32)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.16)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    botaoCapturadoAtivo: {
        borderColor: 'rgba(56, 189, 248, 0.65)',
        backgroundColor: 'rgba(56, 189, 248, 0.18)',
    },
    tituloTopo: {
        flex: 1,
        color: cores.texto,
        fontSize: fontes.grande + 2,
        fontWeight: '800',
        textAlign: 'center',
        textTransform: 'capitalize',
    },
    palcoCentral: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    circuloDestaque: {
        width: 118,
        height: 118,
        borderRadius: 59,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    spritePrincipal: {
        width: 98,
        height: 98,
    },
    barraInferior: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    slotLateralEsquerdo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    slotLateralDireito: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    botaoShiny: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 11,
        paddingVertical: 5,
        borderRadius: 9,
        backgroundColor: 'rgba(0, 0, 0, 0.36)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.16)',
    },
    botaoShinyAtivo: {
        borderColor: 'rgba(250, 204, 21, 0.65)',
        backgroundColor: 'rgba(250, 204, 21, 0.18)',
    },
    textoShiny: {
        color: cores.texto,
        fontSize: 11,
        fontWeight: '700',
    },
    indicadoresCarrossel: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        paddingHorizontal: 6,
    },
    pontoCarrossel: {
        height: 6,
        borderRadius: 3,
    },
    grupoTipos: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    pilulaTipo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
        borderWidth: 1,
    },
    textoTipo: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'capitalize',
    },
});