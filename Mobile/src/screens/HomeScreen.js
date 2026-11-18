import React, { useEffect, useRef } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Animated,
    Easing,
    Dimensions,
} from 'react-native';

const { width, height } = Dimensions.get('window');

// Componente interno de Pokébola minimalista animada (sem precisar de imagem externa)
function PokebolaFundo({ tamanho, top, left, duracao, atraso }) {
    const rotacao = useRef(new Animated.Value(0)).current;
    const flutuacao = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.timing(rotacao, {
                toValue: 1,
                duration: duracao,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(flutuacao, {
                    toValue: -18,
                    duration: 2800,
                    delay: atraso,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(flutuacao, {
                    toValue: 0,
                    duration: 2800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [rotacao, flutuacao, duracao, atraso]);

    const girar = rotacao.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <Animated.View
            pointerEvents="none"
            style={[
                styles.pokebola,
                {
                    width: tamanho,
                    height: tamanho,
                    borderRadius: tamanho / 2,
                    top,
                    left,
                    transform: [{ translateY: flutuacao }, { rotate: girar }],
                },
            ]}
        >
            <View style={styles.pokebolaLinha} />
            <View
                style={[
                    styles.pokebolaCentro,
                    {
                        width: tamanho * 0.3,
                        height: tamanho * 0.3,
                        borderRadius: (tamanho * 0.3) / 2,
                    },
                ]}
            />
        </Animated.View>
    );
}

export default function HomeScreen({ navigation }) {
    const escalaBotao = useRef(new Animated.Value(1)).current;

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

    return (
        <View style={styles.container}>
            {/* Camada de animação de fundo */}
            <PokebolaFundo tamanho={220} top={height * 0.08} left={-60} duracao={26000} atraso={0} />
            <PokebolaFundo tamanho={300} top={height * 0.55} left={width * 0.35} duracao={34000} atraso={600} />
            <PokebolaFundo tamanho={130} top={height * 0.28} left={width * 0.68} duracao={20000} atraso={1200} />

            {/* Conteúdo central conforme o wireframe */}
            <View style={styles.conteudo}>
                <Text style={styles.tag}>POKÉDEX SYSTEM</Text>
                <Text style={styles.titulo}>Explore a Dex</Text>

                <Animated.View style={{ transform: [{ scale: escalaBotao }], width: '100%' }}>
                    <TouchableOpacity
                        style={styles.botaoEntrar}
                        activeOpacity={0.85}
                        onPress={() => animarClique('PokedexScreen')}
                    >
                        <Text style={styles.textoBotao}>Entrar</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0D0D0D',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    pokebola: {
        position: 'absolute',
        borderWidth: 2,
        borderColor: 'rgba(217, 80, 50, 0.16)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pokebolaLinha: {
        position: 'absolute',
        width: '100%',
        height: 2,
        backgroundColor: 'rgba(217, 80, 50, 0.16)',
    },
    pokebolaCentro: {
        backgroundColor: '#0D0D0D',
        borderWidth: 2,
        borderColor: 'rgba(217, 80, 50, 0.22)',
    },
    conteudo: {
        width: '100%',
        paddingHorizontal: 36,
        alignItems: 'center',
        zIndex: 10,
    },
    tag: {
        color: '#D95032',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 2,
        marginBottom: 8,
    },
    titulo: {
        color: '#F2F2F2',
        fontSize: 32,
        fontWeight: 'bold',
        letterSpacing: -0.5,
        marginBottom: 32,
    },
    botaoEntrar: {
        backgroundColor: '#D95032',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.12)',
        shadowColor: '#D95032',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 6,
    },
    textoBotao: {
        color: '#F2F2F2',
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});