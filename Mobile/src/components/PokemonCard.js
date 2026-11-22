import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    Image,
    TouchableOpacity,
    LayoutAnimation,
    Platform,
    UIManager,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { cores, fontes, espacos, bordas } from '../styles/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const CORES_TIPO = {
    normal: { principal: '#A8A77A', fundo: '#4A4936', borda: 'rgba(168, 167, 122, 0.55)' },
    fire: { principal: '#FB923C', fundo: '#7C2D12', borda: 'rgba(251, 146, 60, 0.55)' },
    fogo: { principal: '#FB923C', fundo: '#7C2D12', borda: 'rgba(251, 146, 60, 0.55)' },
    water: { principal: '#38BDF8', fundo: '#0C4A6E', borda: 'rgba(56, 189, 248, 0.55)' },
    agua: { principal: '#38BDF8', fundo: '#0C4A6E', borda: 'rgba(56, 189, 248, 0.55)' },
    grass: { principal: '#4ADE80', fundo: '#14532D', borda: 'rgba(74, 222, 128, 0.55)' },
    planta: { principal: '#4ADE80', fundo: '#14532D', borda: 'rgba(74, 222, 128, 0.55)' },
    electric: { principal: '#FACC15', fundo: '#713F12', borda: 'rgba(250, 204, 21, 0.55)' },
    eletrico: { principal: '#FACC15', fundo: '#713F12', borda: 'rgba(250, 204, 21, 0.55)' },
    ice: { principal: '#67E8F9', fundo: '#164E63', borda: 'rgba(103, 232, 249, 0.55)' },
    gelo: { principal: '#67E8F9', fundo: '#164E63', borda: 'rgba(103, 232, 249, 0.55)' },
    fighting: { principal: '#F87171', fundo: '#7F1D1D', borda: 'rgba(248, 113, 113, 0.55)' },
    lutador: { principal: '#F87171', fundo: '#7F1D1D', borda: 'rgba(248, 113, 113, 0.55)' },
    poison: { principal: '#C084FC', fundo: '#581C87', borda: 'rgba(192, 132, 252, 0.55)' },
    venenoso: { principal: '#C084FC', fundo: '#581C87', borda: 'rgba(192, 132, 252, 0.55)' },
    ground: { principal: '#FBBF24', fundo: '#78350F', borda: 'rgba(251, 191, 36, 0.55)' },
    terra: { principal: '#FBBF24', fundo: '#78350F', borda: 'rgba(251, 191, 36, 0.55)' },
    flying: { principal: '#93C5FD', fundo: '#1E3A8A', borda: 'rgba(147, 197, 253, 0.55)' },
    voador: { principal: '#93C5FD', fundo: '#1E3A8A', borda: 'rgba(147, 197, 253, 0.55)' },
    psychic: { principal: '#F472B6', fundo: '#831843', borda: 'rgba(244, 114, 182, 0.55)' },
    psiquico: { principal: '#F472B6', fundo: '#831843', borda: 'rgba(244, 114, 182, 0.55)' },
    bug: { principal: '#A3E635', fundo: '#365314', borda: 'rgba(163, 230, 53, 0.55)' },
    inseto: { principal: '#A3E635', fundo: '#365314', borda: 'rgba(163, 230, 53, 0.55)' },
    rock: { principal: '#D6D3D1', fundo: '#44403C', borda: 'rgba(214, 211, 209, 0.55)' },
    pedra: { principal: '#D6D3D1', fundo: '#44403C', borda: 'rgba(214, 211, 209, 0.55)' },
    ghost: { principal: '#A855F7', fundo: '#3B0764', borda: 'rgba(168, 85, 247, 0.55)' },
    fantasma: { principal: '#A855F7', fundo: '#3B0764', borda: 'rgba(168, 85, 247, 0.55)' },
    dragon: { principal: '#818CF8', fundo: '#312E81', borda: 'rgba(129, 140, 248, 0.55)' },
    dragao: { principal: '#818CF8', fundo: '#312E81', borda: 'rgba(129, 140, 248, 0.55)' },
    dark: { principal: '#A1A1AA', fundo: '#27272A', borda: 'rgba(161, 161, 170, 0.55)' },
    sombrio: { principal: '#A1A1AA', fundo: '#27272A', borda: 'rgba(161, 161, 170, 0.55)' },
    steel: { principal: '#CBD5E1', fundo: '#334155', borda: 'rgba(203, 213, 225, 0.55)' },
    aco: { principal: '#CBD5E1', fundo: '#334155', borda: 'rgba(203, 213, 225, 0.55)' },
    fairy: { principal: '#F9A8D4', fundo: '#701A75', borda: 'rgba(249, 168, 212, 0.55)' },
    fada: { principal: '#F9A8D4', fundo: '#701A75', borda: 'rgba(249, 168, 212, 0.55)' },
    default: { principal: cores.primaria, fundo: '#2A1815', borda: 'rgba(217, 80, 50, 0.5)' },
};

function normalizarChave(texto) {
    return String(texto)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

function extrairTipos(item) {
    // 1. Suporte ao relacionamento N:N do Supabase (pokemon_types -> types.name)
    if (Array.isArray(item.pokemon_types) && item.pokemon_types.length > 0) {
        const nomes = item.pokemon_types
            .map((pt) => pt?.types?.name || pt?.name)
            .filter(Boolean);
        if (nomes.length > 0) return nomes;
    }

    // 2. Suporte a array direto (item.types = ['Grass', 'Poison'])
    if (Array.isArray(item.types) && item.types.length > 0) {
        return item.types.map((t) => (typeof t === 'string' ? t : t?.name)).filter(Boolean);
    }

    // 3. Suporte à coluna texto (item.type = 'Grass / Poison' ou 'Grass')
    if (item.type) {
        if (Array.isArray(item.type)) return item.type.filter(Boolean);
        const separados = String(item.type)
            .split(/[/,|•-]+/)
            .map((t) => t.trim())
            .filter(Boolean);
        if (separados.length > 0) return separados;
    }

    return ['Normal'];
}

function obterEstiloTipo(nomeTipo) {
    const chave = normalizarChave(nomeTipo);
    return CORES_TIPO[chave] || CORES_TIPO.default;
}

function obterSpriteAnimado(id, shiny) {
    const pasta = shiny ? 'shiny/' : '';
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/${pasta}${id}.gif`;
}

export default function PokemonCard({ item, onAbrirDetalhe }) {
    const [expandido, setExpandido] = useState(false);
    const [falhouGif, setFalhouGif] = useState(false);

    useEffect(() => {
        setFalhouGif(false);
    }, [item.id, item.shiny]);

    const numeroFormatado = String(item.id).padStart(2, '0');
    const listaTipos = extrairTipos(item);

    const temaPrimario = obterEstiloTipo(listaTipos[0]);
    const temaSecundario = listaTipos[1] ? obterEstiloTipo(listaTipos[1]) : temaPrimario;

    // Gradiente de fundo: se tiver 2 tipos, mistura as 2 cores; se tiver 1, cria degrade profundo
    const coresGradienteFundo = listaTipos[1]
        ? [temaPrimario.fundo, temaSecundario.fundo]
        : [temaPrimario.fundo, '#121216'];

    const uriImagem =
        !falhouGif && item.id
            ? obterSpriteAnimado(item.id, item.shiny)
            : item.image;

    const alternarExpansao = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandido((prev) => !prev);
    };

    return (
        <View style={[styles.cardWrapper, item.shiny && styles.cardShiny]}>
            {!expandido ? (
                /* MODO COMPACTO (Fiel ao wireframe 01-Pokedex) */
                <TouchableOpacity
                    style={styles.cardCompacto}
                    activeOpacity={0.85}
                    onPress={alternarExpansao}
                >
                    {/* Caixa Esquerda inteira colorida com o Tipo / Gradiente */}
                    <LinearGradient
                        colors={coresGradienteFundo}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.colunaImagem}
                    >
                        {uriImagem ? (
                            <Image
                                source={{ uri: uriImagem }}
                                resizeMode="contain"
                                style={styles.imagemCompacta}
                                onError={() => setFalhouGif(true)}
                            />
                        ) : (
                            <Text style={styles.semImagem}>?</Text>
                        )}
                    </LinearGradient>

                    {/* Divisória Vertical */}
                    <View style={styles.divisorVertical} />

                    {/* Coluna Direita com Nome, Número e Pílulas de Tipo */}
                    <View style={styles.colunaDados}>
                        <View style={styles.linhaSuperior}>
                            <Text style={styles.nome} numberOfLines={1}>
                                {item.name}
                            </Text>
                            <Text style={styles.numero}>{numeroFormatado}</Text>
                        </View>

                        <View style={styles.linhaInferior}>
                            <View style={styles.grupoPilulas}>
                                {listaTipos.map((tipoNome, index) => {
                                    const tema = obterEstiloTipo(tipoNome);
                                    return (
                                        <View
                                            key={`${tipoNome}-${index}`}
                                            style={[
                                                styles.pilulaTipo,
                                                {
                                                    backgroundColor: `${tema.fundo}CC`,
                                                    borderColor: tema.borda,
                                                },
                                            ]}
                                        >
                                            <View style={[styles.pontoTipo, { backgroundColor: tema.principal }]} />
                                            <Text style={[styles.textoTipo, { color: tema.principal }]}>
                                                {tipoNome}
                                            </Text>
                                        </View>
                                    );
                                })}
                            </View>

                            {item.shiny && (
                                <View style={styles.badgeShiny}>
                                    <Text style={styles.textoShiny}>✦</Text>
                                </View>
                            )}

                            <View style={styles.botaoChevron}>
                                <Text style={styles.chevron}>⌄</Text>
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>
            ) : (
                /* MODO EXPANDIDO (Fiel ao bloco intermediário do wireframe) */
                <View style={styles.cardExpandido}>
                    {/* Topo inteiro preenchido com a cor / gradiente do tipo do Pokémon */}
                    <TouchableOpacity
                        activeOpacity={0.92}
                        onPress={() => onAbrirDetalhe && onAbrirDetalhe(item)}
                    >
                        <LinearGradient
                            colors={coresGradienteFundo}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.palcoExpandido}
                        >
                            {/* Reflexo suave no fundo para destacar o sprite animado */}
                            <View style={styles.luzCentralPalco} />

                            {uriImagem ? (
                                <Image
                                    source={{ uri: uriImagem }}
                                    resizeMode="contain"
                                    style={styles.imagemExpandida}
                                    onError={() => setFalhouGif(true)}
                                />
                            ) : null}

                            {item.shiny && (
                                <View style={styles.tagShinyExpandida}>
                                    <Text style={styles.textoShinyExpandida}>✦ SHINY</Text>
                                </View>
                            )}

                            <TouchableOpacity
                                style={styles.botaoRecolher}
                                onPress={alternarExpansao}
                                hitSlop={8}
                            >
                                <Text style={styles.chevronRecolher}>⌃</Text>
                            </TouchableOpacity>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Rodapé Escuro com Nome #01, Pílulas de Tipo e Habilidades */}
                    <TouchableOpacity
                        style={styles.rodapeExpandido}
                        activeOpacity={0.85}
                        onPress={() => onAbrirDetalhe && onAbrirDetalhe(item)}
                    >
                        <View style={styles.blocoEsquerdoExpandido}>
                            <Text style={styles.nomeExpandido}>
                                {item.name} <Text style={styles.numeroExpandido}>#{numeroFormatado}</Text>
                            </Text>

                            <View style={[styles.grupoPilulas, { marginTop: 8 }]}>
                                {listaTipos.map((tipoNome, index) => {
                                    const tema = obterEstiloTipo(tipoNome);
                                    return (
                                        <View
                                            key={`${tipoNome}-exp-${index}`}
                                            style={[
                                                styles.pilulaTipo,
                                                {
                                                    backgroundColor: `${tema.fundo}CC`,
                                                    borderColor: tema.borda,
                                                },
                                            ]}
                                        >
                                            <View style={[styles.pontoTipo, { backgroundColor: tema.principal }]} />
                                            <Text style={[styles.textoTipo, { color: tema.principal }]}>
                                                {tipoNome}
                                            </Text>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>

                        <View style={styles.blocoHabilidades}>
                            <Text style={styles.labelHabilidade}>Habilidades</Text>
                            <Text style={styles.valorHabilidade}>Ver ficha completa</Text>
                            <Text style={styles.linkAbrirPagina}>Abrir página ›</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    cardWrapper: {
        backgroundColor: '#16161A',
        borderRadius: bordas.raio + 6,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.12)',
        marginBottom: espacos.pequeno + 6,
        overflow: 'hidden',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 5,
    },
    cardShiny: {
        borderColor: 'rgba(250, 204, 21, 0.55)',
    },
    cardCompacto: {
        flexDirection: 'row',
        alignItems: 'stretch',
        minHeight: 96,
    },
    colunaImagem: {
        width: 104,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 8,
    },
    imagemCompacta: {
        width: 68,
        height: 68,
    },
    semImagem: {
        color: cores.texto,
        fontSize: fontes.titulo,
        fontWeight: 'bold',
    },
    divisorVertical: {
        width: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.14)',
    },
    colunaDados: {
        flex: 1,
        paddingHorizontal: espacos.medio,
        paddingVertical: 12,
        justifyContent: 'space-between',
        backgroundColor: '#16161A',
    },
    linhaSuperior: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    nome: {
        flex: 1,
        color: cores.texto,
        fontSize: fontes.grande,
        fontWeight: '700',
        textTransform: 'capitalize',
        letterSpacing: -0.3,
    },
    numero: {
        color: cores.texto,
        fontSize: fontes.grande + 2,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    linhaInferior: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: espacos.pequeno,
    },
    grupoPilulas: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    pilulaTipo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 11,
        paddingVertical: 4,
        borderRadius: 9,
        borderWidth: 1,
    },
    pontoTipo: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    textoTipo: {
        fontSize: fontes.pequena - 1,
        fontWeight: '700',
        textTransform: 'capitalize',
    },
    badgeShiny: {
        marginLeft: 6,
        paddingHorizontal: 7,
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: 'rgba(250, 204, 21, 0.16)',
        borderWidth: 1,
        borderColor: 'rgba(250, 204, 21, 0.45)',
    },
    textoShiny: {
        color: '#FACC15',
        fontSize: 11,
        fontWeight: '800',
    },
    botaoChevron: {
        marginLeft: 'auto',
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(255, 255, 255, 0.07)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    chevron: {
        color: cores.texto,
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: -6,
    },
    // Modo Expandido
    cardExpandido: {
        width: '100%',
    },
    palcoExpandido: {
        height: 155,
        justifyContent: 'center',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.14)',
        position: 'relative',
    },
    luzCentralPalco: {
        position: 'absolute',
        width: 115,
        height: 115,
        borderRadius: 57.5,
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
    },
    imagemExpandida: {
        width: 96,
        height: 96,
    },
    tagShinyExpandida: {
        position: 'absolute',
        top: 12,
        left: 12,
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        borderWidth: 1,
        borderColor: 'rgba(250, 204, 21, 0.5)',
    },
    textoShinyExpandida: {
        color: '#FACC15',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.8,
    },
    botaoRecolher: {
        position: 'absolute',
        top: 10,
        right: 12,
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(0, 0, 0, 0.35)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.18)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    chevronRecolher: {
        color: cores.texto,
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 4,
    },
    rodapeExpandido: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: espacos.medio,
        backgroundColor: '#16161A',
    },
    blocoEsquerdoExpandido: {
        flex: 1,
    },
    nomeExpandido: {
        color: cores.texto,
        fontSize: fontes.grande + 1,
        fontWeight: '700',
        textTransform: 'capitalize',
    },
    numeroExpandido: {
        color: cores.textoSecundario,
        fontWeight: '800',
    },
    blocoHabilidades: {
        alignItems: 'flex-end',
        paddingLeft: 12,
        borderLeftWidth: 1,
        borderLeftColor: 'rgba(255, 255, 255, 0.1)',
    },
    labelHabilidade: {
        color: cores.textoSecundario,
        fontSize: 11,
        fontWeight: '600',
    },
    valorHabilidade: {
        color: cores.texto,
        fontSize: 12,
        fontWeight: '600',
        marginTop: 2,
    },
    linkAbrirPagina: {
        color: cores.primaria,
        fontSize: 12,
        fontWeight: '700',
        marginTop: 4,
    },
});