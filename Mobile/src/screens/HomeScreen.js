import React, { useEffect, useRef, useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Animated,
    Easing,
    Dimensions,
    Image,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { cores, fontes, espacos, bordas } from '../styles/theme';

const { width, height } = Dimensions.get('window');

// Lâminas de grama orgânicas em 3 camadas de profundidade
const LAMINAS_GRAMA = Array.from({ length: 28 }, (_, i) => {
    const camada = i % 3;
    const altura =
        camada === 0
            ? 105 + (i % 4) * 18
            : camada === 1
                ? 78 + (i % 3) * 15
                : 52 + (i % 4) * 12;

    return {
        id: i,
        left: (width / 26) * i - 14,
        altura,
        larguraBase: camada === 0 ? 19 : camada === 1 ? 15 : 12,
        camada,
        atraso: (i * 130) % 1800,
        inclinacaoBase: ((i % 5) - 2) * 4,
    };
});

// Esporos de luz flutuando sobre o gramado
const ESPOROS = Array.from({ length: 14 }, (_, i) => ({
    id: i,
    left: (width / 14) * i + 8,
    tamanho: 2.5 + (i % 3) * 1.5,
    duracao: 4000 + (i % 4) * 1100,
    atraso: i * 320,
}));

function LaminaGrama({ left, altura, larguraBase, camada, atraso, inclinacaoBase }) {
    const vento = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.delay(atraso),
                Animated.timing(vento, {
                    toValue: 1,
                    duration: 1900 + camada * 250,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(vento, {
                    toValue: -1,
                    duration: 2200 + camada * 250,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(vento, {
                    toValue: 0,
                    duration: 1700,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [vento, atraso, camada]);

    const rotacaoVento = vento.interpolate({
        inputRange: [-1, 1],
        outputRange: [`${inclinacaoBase - 6}deg`, `${inclinacaoBase + 9}deg`],
    });

    const corFolha =
        camada === 0 ? '#091811' : camada === 1 ? '#112B1E' : '#1B4330';

    return (
        <Animated.View
            pointerEvents="none"
            style={[
                styles.laminaWrapper,
                {
                    left,
                    height: altura,
                    width: larguraBase * 2,
                    zIndex: camada === 2 ? 8 : camada === 1 ? 4 : 2,
                    transform: [
                        { translateY: altura / 2 },
                        { rotate: rotacaoVento },
                        { translateY: -altura / 2 },
                    ],
                },
            ]}
        >
            <View
                style={{
                    width: 0,
                    height: 0,
                    backgroundColor: 'transparent',
                    borderStyle: 'solid',
                    borderLeftWidth: larguraBase * 0.7,
                    borderRightWidth: larguraBase * 1.1,
                    borderBottomWidth: altura,
                    borderLeftColor: 'transparent',
                    borderRightColor: 'transparent',
                    borderBottomColor: corFolha,
                }}
            />
        </Animated.View>
    );
}

function EsporoLuz({ left, tamanho, duracao, atraso }) {
    const subida = useRef(new Animated.Value(0)).current;
    const opacidade = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.delay(atraso),
                Animated.parallel([
                    Animated.timing(subida, {
                        toValue: 1,
                        duration: duracao,
                        easing: Easing.out(Easing.quad),
                        useNativeDriver: true,
                    }),
                    Animated.sequence([
                        Animated.timing(opacidade, {
                            toValue: 0.85,
                            duration: duracao * 0.35,
                            useNativeDriver: true,
                        }),
                        Animated.timing(opacidade, {
                            toValue: 0,
                            duration: duracao * 0.65,
                            useNativeDriver: true,
                        }),
                    ]),
                ]),
                Animated.timing(subida, {
                    toValue: 0,
                    duration: 0,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [subida, opacidade, duracao, atraso]);

    const translateY = subida.interpolate({
        inputRange: [0, 1],
        outputRange: [height * 0.92, height * 0.28],
    });

    return (
        <Animated.View
            pointerEvents="none"
            style={[
                styles.esporo,
                {
                    left,
                    width: tamanho,
                    height: tamanho,
                    borderRadius: tamanho / 2,
                    opacity: opacidade,
                    transform: [{ translateY }],
                },
            ]}
        />
    );
}

export default function HomeScreen({ navigation }) {
    const escalaBotao = useRef(new Animated.Value(1)).current;
    const pulsoRespiracao = useRef(new Animated.Value(1)).current;
    const pulsoAura = useRef(new Animated.Value(0.88)).current;
    const transicaoPokemon = useRef(new Animated.Value(1)).current;
    const flashBranco = useRef(new Animated.Value(0)).current;

    const [listaPokemons, setListaPokemons] = useState([
        {
            id: 25,
            sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png',
        },
        {
            id: 6,
            sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png',
        },
        {
            id: 94,
            sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/94.png',
        },
        {
            id: 150,
            sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png',
        },
        {
            id: 133,
            sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/133.png',
        },
    ]);

    const [indiceAtual, setIndiceAtual] = useState(0);

    useEffect(() => {
        let ativo = true;

        async function buscarPokemons() {
            try {
                const resposta = await fetch('https://pokeapi.co/api/v2/pokemon?limit=151');
                const dados = await resposta.json();
                if (!ativo || !dados?.results?.length) return;

                const sorteados = [...dados.results]
                    .sort(() => 0.5 - Math.random())
                    .slice(0, 12)
                    .map((item) => {
                        const partes = item.url.split('/').filter(Boolean);
                        const id = partes[partes.length - 1];
                        return {
                            id,
                            sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
                        };
                    });

                setListaPokemons(sorteados);
            } catch {
                // Fallback silencioso
            }
        }

        buscarPokemons();
        return () => {
            ativo = false;
        };
    }, []);

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulsoRespiracao, {
                    toValue: 1.06,
                    duration: 1400,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(pulsoRespiracao, {
                    toValue: 0.97,
                    duration: 1400,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(pulsoAura, {
                    toValue: 1.16,
                    duration: 1600,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulsoAura, {
                    toValue: 0.88,
                    duration: 1600,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [pulsoRespiracao, pulsoAura]);

    useEffect(() => {
        const intervalo = setInterval(() => {
            Animated.parallel([
                Animated.timing(transicaoPokemon, {
                    toValue: 0,
                    duration: 300,
                    easing: Easing.in(Easing.quad),
                    useNativeDriver: true,
                }),
                Animated.timing(flashBranco, {
                    toValue: 0.85,
                    duration: 260,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                setIndiceAtual((prev) => (prev + 1) % listaPokemons.length);

                Animated.parallel([
                    Animated.spring(transicaoPokemon, {
                        toValue: 1,
                        friction: 6,
                        tension: 70,
                        useNativeDriver: true,
                    }),
                    Animated.timing(flashBranco, {
                        toValue: 0,
                        duration: 520,
                        easing: Easing.out(Easing.quad),
                        useNativeDriver: true,
                    }),
                ]).start();
            });
        }, 4200);

        return () => clearInterval(intervalo);
    }, [listaPokemons.length, transicaoPokemon, flashBranco]);

    const animarClique = (destino) => {
        Animated.sequence([
            Animated.timing(escalaBotao, {
                toValue: 0.94,
                duration: 90,
                useNativeDriver: true,
            }),
            Animated.timing(escalaBotao, {
                toValue: 1,
                duration: 90,
                useNativeDriver: true,
            }),
        ]).start(() => {
            navigation.navigate(destino);
        });
    };

    const pokemonAtual = listaPokemons[indiceAtual];

    return (
        <View style={styles.container}>
            {/* Gradiente atmosférico de fundo (escuro no topo -> verde floresta sutil na base) */}
            <LinearGradient
                colors={[cores.fundo, '#0E1311', '#12241B']}
                locations={[0, 0.65, 1]}
                style={StyleSheet.absoluteFill}
            />

            {/* Esporos luminosos */}
            {ESPOROS.map((esporo) => (
                <EsporoLuz
                    key={esporo.id}
                    left={esporo.left}
                    tamanho={esporo.tamanho}
                    duracao={esporo.duracao}
                    atraso={esporo.atraso}
                />
            ))}

            {/* Cabeçalho discreto no terço superior */}
            <View style={styles.cabecalho}>
                <Text style={styles.tag}>POKÉDEX SYSTEM</Text>
                <Text style={styles.titulo}>Explore a Dex</Text>
            </View>

            {/* PALCO CENTRAL LITERAL (Centro exato da tela) */}
            <View pointerEvents="none" style={styles.palcoCentral}>
                <Animated.View
                    style={[
                        styles.haloExterno,
                        { transform: [{ scale: pulsoAura }] },
                    ]}
                />
                <Animated.View
                    style={[
                        styles.haloInterno,
                        { transform: [{ scale: pulsoRespiracao }] },
                    ]}
                />
                <Animated.View
                    style={[
                        styles.claraoTroca,
                        {
                            opacity: flashBranco,
                            transform: [
                                {
                                    scale: flashBranco.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0.5, 1.45],
                                    }),
                                },
                            ],
                        },
                    ]}
                />

                {pokemonAtual && (
                    <Animated.View
                        style={{
                            opacity: transicaoPokemon,
                            transform: [
                                {
                                    scale: Animated.multiply(
                                        pulsoRespiracao,
                                        transicaoPokemon.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0.65, 1],
                                        })
                                    ),
                                },
                            ],
                        }}
                    >
                        <Image
                            source={{ uri: pokemonAtual.sprite }}
                            resizeMode="contain"
                            style={styles.spritePokemon}
                        />
                    </Animated.View>
                )}
            </View>

            {/* BOTÃO GLASSMORPHISM LOGO ABAIXO DO POKÉMON CENTRAL */}
            <Animated.View
                style={[
                    styles.areaBotao,
                    { transform: [{ scale: escalaBotao }] },
                ]}
            >
                <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => animarClique('PokedexScreen')}
                    style={styles.botaoTouch}
                >
                    <BlurView intensity={35} tint="dark" style={styles.glassContainer}>
                        <LinearGradient
                            colors={[
                                'rgba(255, 255, 255, 0.16)',
                                'rgba(217, 80, 50, 0.22)',
                                'rgba(255, 255, 255, 0.05)',
                            ]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.glassGradiente}
                        >
                            <Text style={styles.textoBotao}>Entrar</Text>
                        </LinearGradient>
                    </BlurView>
                </TouchableOpacity>
            </Animated.View>

            {/* Camadas de grama realista na base */}
            <View pointerEvents="none" style={styles.baseTerra} />
            {LAMINAS_GRAMA.map((lamina) => (
                <LaminaGrama
                    key={lamina.id}
                    left={lamina.left}
                    altura={lamina.altura}
                    larguraBase={lamina.larguraBase}
                    camada={lamina.camada}
                    atraso={lamina.atraso}
                    inclinacaoBase={lamina.inclinacaoBase}
                />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: cores.fundo,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    cabecalho: {
        position: 'absolute',
        top: height * 0.14,
        alignItems: 'center',
        zIndex: 10,
    },
    tag: {
        color: cores.primaria,
        fontSize: fontes.pequena,
        fontWeight: '700',
        letterSpacing: 2.5,
        marginBottom: espacos.pequeno,
    },
    titulo: {
        color: cores.texto,
        fontSize: fontes.titulo + 8,
        fontWeight: 'bold',
        letterSpacing: -0.5,
    },
    palcoCentral: {
        position: 'absolute',
        top: height * 0.5 - 115,
        left: width * 0.5 - 115,
        width: 230,
        height: 230,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 6,
    },
    haloExterno: {
        position: 'absolute',
        width: 210,
        height: 210,
        borderRadius: 105,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        shadowColor: '#FFFFFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 30,
    },
    haloInterno: {
        position: 'absolute',
        width: 145,
        height: 145,
        borderRadius: 72.5,
        backgroundColor: 'rgba(255, 255, 255, 0.16)',
    },
    claraoTroca: {
        position: 'absolute',
        width: 165,
        height: 165,
        borderRadius: 82.5,
        backgroundColor: '#FFFFFF',
    },
    spritePokemon: {
        width: 185,
        height: 185,
    },
    areaBotao: {
        position: 'absolute',
        top: height * 0.5 + 125,
        width: '78%',
        maxWidth: 320,
        zIndex: 15,
    },
    botaoTouch: {
        borderRadius: bordas.raio + 4,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.25)',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.45,
        shadowRadius: 16,
        elevation: 8,
    },
    glassContainer: {
        width: '100%',
        overflow: 'hidden',
    },
    glassGradiente: {
        paddingVertical: espacos.medio + 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textoBotao: {
        color: cores.texto,
        fontSize: fontes.grande,
        fontWeight: '700',
        letterSpacing: 1,
    },
    baseTerra: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        height: 22,
        backgroundColor: '#07120D',
        zIndex: 7,
    },
    laminaWrapper: {
        position: 'absolute',
        bottom: 10,
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    esporo: {
        position: 'absolute',
        top: 0,
        backgroundColor: '#D8F3DC',
        shadowColor: '#FFFFFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 6,
        zIndex: 5,
    },
});