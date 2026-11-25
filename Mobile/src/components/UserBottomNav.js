import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { cores, espacos } from '../styles/theme';

export default function UserBottomNav({ abaAtiva, navigation: navProp }) {
    const navHook = useNavigation();
    const navigation = typeof navProp?.navigate === 'function' ? navProp : navHook;

    const irPara = (nomeRota) => {
        if (!navigation || typeof navigation.navigate !== 'function') return;
        navigation.navigate(nomeRota);
    };

    return (
        <View style={styles.barraInferiorUsuario}>
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => abaAtiva !== 'favoritos' && irPara('UserFavoritesScreen')}
                style={[
                    styles.botaoNavInferior,
                    abaAtiva === 'favoritos' && styles.botaoFavoritosAtivo,
                ]}
            >
                <Ionicons
                    name={abaAtiva === 'favoritos' ? 'star' : 'star-outline'}
                    size={22}
                    color={abaAtiva === 'favoritos' ? '#FACC15' : cores.textoSecundario}
                />
                <Text
                    style={[
                        styles.labelNavInferior,
                        abaAtiva === 'favoritos' && { color: '#FACC15', fontWeight: '800' },
                    ]}
                >
                    Favoritos
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => irPara('PokedexScreen')}
                style={styles.botaoNavInferior}
            >
                <MaterialCommunityIcons
                    name="pokeball"
                    size={24}
                    color={cores.primaria}
                />
                <Text style={styles.labelNavInferior}>Pokédex</Text>
            </TouchableOpacity>

            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => abaAtiva !== 'capturados' && irPara('UserCapturedScreen')}
                style={[
                    styles.botaoNavInferior,
                    abaAtiva === 'capturados' && styles.botaoCapturadosAtivo,
                ]}
            >
                <Ionicons
                    name={abaAtiva === 'capturados' ? 'checkmark-circle' : 'checkmark-circle-outline'}
                    size={22}
                    color={abaAtiva === 'capturados' ? '#38BDF8' : cores.textoSecundario}
                />
                <Text
                    style={[
                        styles.labelNavInferior,
                        abaAtiva === 'capturados' && { color: '#38BDF8', fontWeight: '800' },
                    ]}
                >
                    Capturados
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    barraInferiorUsuario: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        backgroundColor: '#141418',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.12)',
        paddingVertical: 10,
        paddingHorizontal: espacos.medio,
    },
    botaoNavInferior: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        minWidth: 84,
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 12,
    },
    botaoFavoritosAtivo: {
        backgroundColor: 'rgba(250, 204, 21, 0.12)',
    },
    botaoCapturadosAtivo: {
        backgroundColor: 'rgba(56, 189, 248, 0.12)',
    },
    labelNavInferior: {
        color: cores.textoSecundario,
        fontSize: 11,
        fontWeight: '600',
    },
});