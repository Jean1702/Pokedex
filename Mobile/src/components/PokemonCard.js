import React, { useState } from 'react';
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

// Paleta temática por tipo para dar vida aos cards e botões
const CORES_TIPO = {
    fire: { principal: '#F97316', fundo: 'rgba(249, 115, 22, 0.16)', borda: 'rgba(249, 115, 22, 0.45)' },
    water: { principal: '#38BDF8', fundo: 'rgba(56, 189, 248, 0.16)', borda: 'rgba(56, 189, 248, 0.45)' },
    grass: { principal: '#22C55E', fundo: 'rgba(34, 197, 94, 0.16)', borda: 'rgba(34, 197, 94, 0.45)' },
    electric: { principal: '#FACC15', fundo: 'rgba(250, 204, 21, 0.16)', borda: 'rgba(250, 204, 21, 0.45)' },
    psychic: { principal: '#EC4899', fundo: 'rgba(236, 72, 153, 0.16)', borda: 'rgba(236, 72, 153, 0.45)' },
    ghost: { principal: '#A855F7', fundo: 'rgba(168, 85, 247, 0.16)', borda: 'rgba(168, 85, 247, 0.45)' },
    poison: { principal: '#C084FC', fundo: 'rgba(192, 132, 252, 0.16)', borda: 'rgba(192, 132, 252, 0.45)' },
    dragon: { principal: '#6366F1', fundo: 'rgba(99, 102, 241, 0.16)', borda: 'rgba(99, 102, 241, 0.45)' },
    default: { principal: cores.primaria, fundo: cores.primariaClara, borda: 'rgba(217, 80, 50, 0.4)' },
};

function obterEstiloTipo(tipoString) {
    if (!tipoString) return CORES_TIPO.default;
    const primeiroTipo = tipoString.split('/')[0].trim().toLowerCase();
    return CORES_TIPO[primeiroTipo] || CORES_TIPO.default;
}

export default function PokemonCard({ item, onAbrirDetalhe }) {
    const [expandido, setExpandido] = useState(false);
    const numeroFormatado = String(item.id).padStart(2, '0');
    const temaTipo = obterEstiloTipo(item.type);

    const alternarExpansao = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandido((prev) => !prev);
    };

    return (
        <View style={[styles.cardWrapper, item.shiny && styles.cardShiny]}>
            <LinearGradient
                colors={['#1E1E22', '#141417']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradiente}
            >
                {/* Visão Compacta Padrão */}
                {!expandido ? (
                    <TouchableOpacity
                        style={styles.cardCompacto}
                        activeOpacity={0.85}
                        onPress={alternarExpansao}
                    >
                        {/* Coluna Esquerda: Imagem com brilho radial sutil da cor do tipo */}
                        <View style={styles.colunaImagem}>
                            <View
                                style={[
                                    styles.auraTipo,
                                    { backgroundColor: temaTipo.fundo },
                                ]}
                            />
                            {item.image ? (
                                <Image
                                    source={{ uri: item.image }}
                                    resizeMode="contain"
                                    style={styles.imagemCompacta}
                                />
                            ) : (
                                <Text style={styles.semImagem}>?</Text>
                            )}
                        </View>

                        {/* Divisória Vertical metálica */}
                        <View style={styles.divisorVertical} />

                        {/* Coluna Direita: Nome + 01 em cima | Pílula de Tipo + Chevron embaixo */}
                        <View style={styles.colunaDados}>
                            <View style={styles.linhaSuperior}>
                                <Text style={styles.nome} numberOfLines={1}>
                                    {item.name}
                                </Text>
                                <Text style={styles.numero}>{numeroFormatado}</Text>
                            </View>

                            <View style={styles.linhaInferior}>
                                <LinearGradient
                                    colors={[temaTipo.fundo, 'rgba(13, 13, 13, 0.6)']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={[styles.pilulaTipo, { borderColor: temaTipo.borda }]}
                                >
                                    <View
                                        style={[styles.pontoTipo, { backgroundColor: temaTipo.principal }]}
                                    />
                                    <Text style={[styles.textoTipo, { color: temaTipo.principal }]}>
                                        {item.type || 'Normal'}
                                    </Text>
                                </LinearGradient>

                                {item.shiny && (
                                    <View style={styles.badgeShiny}>
                                        <Text style={styles.textoShiny}>✦ SHINY</Text>
                                    </View>
                                )}

                                <View style={styles.botaoChevron}>
                                    <Text style={styles.chevron}>⌄</Text>
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                ) : (
                    /* Visão Expandida Fiel ao Bloco Intermediário do Wireframe ("Muda a página") */
                    <View style={styles.cardExpandido}>
                        {/* Topo: Palco com sprite maior e botão de recolher */}
                        <TouchableOpacity
                            style={styles.palcoExpandido}
                            activeOpacity={0.9}
                            onPress={() => onAbrirDetalhe && onAbrirDetalhe(item)}
                        >
                            <View
                                style={[
                                    styles.auraExpandida,
                                    { backgroundColor: temaTipo.fundo },
                                ]}
                            />
                            {item.image && (
                                <Image
                                    source={{ uri: item.image }}
                                    resizeMode="contain"
                                    style={styles.imagemExpandida}
                                />
                            )}

                            <TouchableOpacity
                                style={styles.botaoRecolher}
                                onPress={alternarExpansao}
                            >
                                <Text style={styles.chevronRecolher}>⌃</Text>
                            </TouchableOpacity>
                        </TouchableOpacity>

                        {/* Barra Inferior do Card Expandido: Nome #01 | Tipo | Habilidades -> Abre 02-Pokémon */}
                        <TouchableOpacity
                            style={styles.rodapeExpandido}
                            activeOpacity={0.85}
                            onPress={() => onAbrirDetalhe && onAbrirDetalhe(item)}
                        >
                            <View style={styles.blocoEsquerdoExpandido}>
                                <Text style={styles.nomeExpandido}>
                                    {item.name} <Text style={styles.numeroExpandido}>#{numeroFormatado}</Text>
                                </Text>

                                <View
                                    style={[
                                        styles.pilulaTipo,
                                        {
                                            backgroundColor: temaTipo.fundo,
                                            borderColor: temaTipo.borda,
                                            marginTop: 6,
                                        },
                                    ]}
                                >
                                    <Text style={[styles.textoTipo, { color: temaTipo.principal }]}>
                                        {item.type || 'Normal'}
                                    </Text>
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
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    cardWrapper: {
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
    cardGradiente: {
        width: '100%',
    },
    cardCompacto: {
        flexDirection: 'row',
        alignItems: 'stretch',
        minHeight: 96,
    },
    colunaImagem: {
        width: 102,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        backgroundColor: 'rgba(0, 0, 0, 0.25)',
    },
    auraTipo: {
        position: 'absolute',
        width: 64,
        height: 64,
        borderRadius: 32,
    },
    imagemCompacta: {
        width: 74,
        height: 74,
    },
    semImagem: {
        color: cores.textoSecundario,
        fontSize: fontes.titulo,
        fontWeight: 'bold',
    },
    divisorVertical: {
        width: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    colunaDados: {
        flex: 1,
        paddingHorizontal: espacos.medio,
        paddingVertical: 12,
        justifyContent: 'space-between',
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
    pilulaTipo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 5,
        borderRadius: 10,
        borderWidth: 1,
    },
    pontoTipo: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
    },
    textoTipo: {
        fontSize: fontes.pequena,
        fontWeight: '700',
        textTransform: 'capitalize',
    },
    badgeShiny: {
        marginLeft: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: 'rgba(250, 204, 21, 0.14)',
        borderWidth: 1,
        borderColor: 'rgba(250, 204, 21, 0.4)',
    },
    textoShiny: {
        color: '#FACC15',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.6,
    },
    botaoChevron: {
        marginLeft: 'auto',
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    chevron: {
        color: cores.texto,
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: -6,
    },
    // Estilos do Card Expandido (conforme wireframe)
    cardExpandido: {
        width: '100%',
    },
    palcoExpandido: {
        height: 135,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.28)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
        position: 'relative',
    },
    auraExpandida: {
        position: 'absolute',
        width: 110,
        height: 110,
        borderRadius: 55,
    },
    imagemExpandida: {
        width: 112,
        height: 112,
    },
    botaoRecolher: {
        position: 'absolute',
        top: 10,
        right: 12,
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
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
    },
    blocoEsquerdoExpandido: {
        flex: 1,
    },
    nomeExpandido: {
        color: cores.texto,
        fontSize: fontes.grande,
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
        borderLeftColor: 'rgba(255, 255, 255, 0.08)',
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