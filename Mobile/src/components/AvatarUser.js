import React, { useContext } from 'react';
import { StyleSheet, TouchableOpacity, Image, View, Text } from 'react-native';
import { AuthContext } from '../contexts/AuthContext';
import { cores } from '../styles/theme';

export default function AvatarUser({
    tamanho = 48,
    onPress,
    mostrarBadgeEdicao = false,
}) {
    const { token, avatarUri } = useContext(AuthContext);

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={onPress}
            style={[
                styles.anelExterno,
                {
                    width: tamanho,
                    height: tamanho,
                    borderRadius: tamanho / 2,
                    borderColor: token ? cores.primaria : 'rgba(255, 255, 255, 0.25)',
                },
            ]}
        >
            {token && avatarUri ? (
                <Image
                    source={{ uri: avatarUri }}
                    resizeMode="cover"
                    style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: tamanho / 2,
                    }}
                />
            ) : (
                <View style={styles.placeholder}>
                    <View
                        style={[
                            styles.cabecaIcone,
                            {
                                width: tamanho * 0.3,
                                height: tamanho * 0.3,
                                borderRadius: (tamanho * 0.3) / 2,
                            },
                        ]}
                    />
                    <View
                        style={[
                            styles.corpoIcone,
                            {
                                width: tamanho * 0.52,
                                height: tamanho * 0.24,
                                borderTopLeftRadius: tamanho * 0.26,
                                borderTopRightRadius: tamanho * 0.26,
                            },
                        ]}
                    />
                </View>
            )}

            {mostrarBadgeEdicao && (
                <View style={styles.badgeCamera}>
                    <Text style={styles.textoBadge}>+</Text>
                </View>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    anelExterno: {
        borderWidth: 2,
        backgroundColor: '#1E1E24',
        padding: 2,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    placeholder: {
        flex: 1,
        width: '100%',
        borderRadius: 999,
        backgroundColor: '#131317',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    cabecaIcone: {
        backgroundColor: cores.textoSecundario,
        marginBottom: 3,
    },
    corpoIcone: {
        backgroundColor: cores.textoSecundario,
    },
    badgeCamera: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: cores.primaria,
        borderWidth: 2,
        borderColor: cores.fundo,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textoBadge: {
        color: cores.texto,
        fontSize: 14,
        fontWeight: '900',
        lineHeight: 16,
    },
});