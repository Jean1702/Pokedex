import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { bordas, espacos } from '../styles/theme';

export default function BottomHudPokemon({ abaAtiva, navigation, pokemon, shiny }) {
    const navegarPara = (rotaDestino) => {
        if (!navigation || !pokemon) return;
        const estadoShiny = shiny !== undefined ? Boolean(shiny) : Boolean(pokemon.shiny);
        navigation.navigate(rotaDestino, {
            id: pokemon.id,
            shiny: estadoShiny,
            pokemon: { ...pokemon, shiny: estadoShiny },
        });
    };

    return (
        <View style={styles.hudContainer}>
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => abaAtiva !== 'detalhe' && navegarPara('PokemonScreen')}
                style={[
                    styles.botaoHud,
                    abaAtiva === 'detalhe' && styles.botaoHudAtivo,
                ]}
            >
                <View
                    style={[
                        styles.iconeCirculo,
                        abaAtiva === 'detalhe' && styles.iconePreenchidoLaranja,
                    ]}
                />
            </TouchableOpacity>

            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => abaAtiva !== 'ataques' && navegarPara('AttacksPokemonScreen')}
                style={[
                    styles.botaoHud,
                    abaAtiva === 'ataques' && styles.botaoHudAtivo,
                ]}
            >
                <View
                    style={[
                        styles.iconeQuadrado,
                        abaAtiva === 'ataques' && styles.iconePreenchidoLaranja,
                    ]}
                />
            </TouchableOpacity>

            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => abaAtiva !== 'info' && navegarPara('InfoPokemonScreen')}
                style={[
                    styles.botaoHud,
                    abaAtiva === 'info' && styles.botaoHudAtivo,
                ]}
            >
                <View
                    style={[
                        styles.iconeLosango,
                        abaAtiva === 'info' && styles.iconePreenchidoLaranja,
                    ]}
                />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    hudContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        backgroundColor: '#141418',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.12)',
        paddingVertical: espacos.pequeno + 4,
        paddingHorizontal: espacos.grande,
    },
    botaoHud: {
        width: 52,
        height: 48,
        borderRadius: bordas.raio + 2,
        backgroundColor: '#1E1E24',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.14)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    botaoHudAtivo: {
        borderColor: '#F59E0B',
        backgroundColor: 'rgba(245, 158, 11, 0.14)',
    },
    iconeCirculo: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#A1A1AA',
        backgroundColor: 'transparent',
    },
    iconeQuadrado: {
        width: 20,
        height: 20,
        borderRadius: 5,
        borderWidth: 2,
        borderColor: '#A1A1AA',
        backgroundColor: 'transparent',
    },
    iconeLosango: {
        width: 18,
        height: 18,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#A1A1AA',
        backgroundColor: 'transparent',
        transform: [{ rotate: '45deg' }],
    },
    iconePreenchidoLaranja: {
        backgroundColor: '#F59E0B',
        borderColor: '#FDE68A',
    },
});