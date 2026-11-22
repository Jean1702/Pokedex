import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    Image,
    TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { cores, fontes, espacos } from '../styles/theme';

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

export function obterEstiloTipo(tipo) {
    const chave = String(tipo || '').toLowerCase().trim();
    return CORES_TIPO[chave] || CORES_TIPO.default;
}

export default function PokemonHeaderBanner({
    pokemon,
    capturado,
    onVoltar,
    onCapturar,
    alturaPalco = 140,
}) {
    const [modoSprite, setModoSprite] = useState(0);
    const [falhouSprite, setFalhouSprite] = useState(false);

    useEffect(() => {
        setModoSprite(0);
        setFalhouSprite(false);
    }, [pokemon?.id]);

    if (!pokemon) return null;

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

    return (
        <View>
            <LinearGradient
                colors={coresGradiente}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.bannerTopo}
            >
                <View style={styles.barraAcoesTopo}>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={onVoltar}
                        style={styles.botaoVoltar}
                    >
                        <Ionicons name="arrow-back" size={20} color={cores.texto} />
                    </TouchableOpacity>

                    <Text style={styles.tituloCentro} numberOfLines={1}>
                        {pokemon.name} #{String(pokemon.id).padStart(2, '0')}
                    </Text>

                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={onCapturar}
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
                    style={[styles.palcoSprite, { height: alturaPalco }]}
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
        </View>
    );
}

const styles = StyleSheet.create({
    bannerTopo: {
        paddingTop: espacos.medio,
        paddingHorizontal: espacos.medio,
        paddingBottom: espacos.pequeno + 4,
    },
    barraAcoesTopo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
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
    tituloCentro: {
        flex: 1,
        color: cores.texto,
        fontSize: fontes.grande,
        fontWeight: '800',
        textTransform: 'capitalize',
        textAlign: 'center',
    },
    botaoCaptura: {
        width: 40,
        height: 40,
        borderRadius: 20,
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
        width: 15,
        height: 15,
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
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    haloSprite: {
        position: 'absolute',
        width: 118,
        height: 118,
        borderRadius: 59,
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
    },
    spritePrincipal: {
        width: 114,
        height: 114,
    },
    rodapeBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 2,
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
});