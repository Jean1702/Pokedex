import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { cores, espacos } from '../styles/theme';

const ABAS_FICHA = [
    {
        id: 'pokemon',
        label: 'Ficha',
        rota: 'PokemonScreen',
        familia: 'mci',
        iconeAtivo: 'pokeball',
        iconeInativo: 'pokeball',
    },
    {
        id: 'ataques',
        label: 'Ataques',
        rota: 'AttacksPokemonScreen',
        familia: 'mci',
        iconeAtivo: 'sword-cross',
        iconeInativo: 'sword-cross',
    },
    {
        id: 'info',
        label: 'Info',
        rota: 'InfoPokemonScreen',
        familia: 'ion',
        iconeAtivo: 'information-circle',
        iconeInativo: 'information-circle-outline',
    },
];

export default function BottomHudPokemon({
    abaAtiva = 'pokemon',
    navigation,
    pokemon,
    shiny = false,
}) {
    const navegarParaAba = (rota) => {
        if (!navigation || !pokemon?.id) return;
        navigation.replace(rota, {
            id: pokemon.id,
            pokemon,
            shiny: Boolean(shiny),
        });
    };

    return (
        <View style={styles.container}>
            {ABAS_FICHA.map((aba) => {
                const ativa = abaAtiva === aba.id;
                const corItem = ativa ? cores.primaria : cores.textoSecundario;

                return (
                    <TouchableOpacity
                        key={aba.id}
                        activeOpacity={0.8}
                        disabled={ativa}
                        onPress={() => navegarParaAba(aba.rota)}
                        style={[styles.itemAba, ativa && styles.itemAbaAtiva]}
                    >
                        {aba.familia === 'mci' ? (
                            <MaterialCommunityIcons
                                name={ativa ? aba.iconeAtivo : aba.iconeInativo}
                                size={20}
                                color={corItem}
                            />
                        ) : (
                            <Ionicons
                                name={ativa ? aba.iconeAtivo : aba.iconeInativo}
                                size={20}
                                color={corItem}
                            />
                        )}
                        <Text
                            style={[
                                styles.labelAba,
                                { color: corItem },
                                ativa && styles.labelAbaAtiva,
                            ]}
                        >
                            {aba.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        backgroundColor: cores.superficie,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
        paddingVertical: 8,
        paddingHorizontal: espacos.medio,
    },
    itemAba: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 6,
        marginHorizontal: 6,
        borderRadius: 12,
        gap: 3,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    itemAbaAtiva: {
        backgroundColor: cores.primariaClara,
        borderColor: 'rgba(217, 80, 50, 0.45)',
    },
    labelAba: {
        fontSize: 11,
        fontWeight: '600',
    },
    labelAbaAtiva: {
        fontWeight: '800',
    },
});