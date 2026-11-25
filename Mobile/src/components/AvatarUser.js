import React, { useContext, useEffect, useState } from 'react';
import { StyleSheet, View, Image, TouchableOpacity, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../contexts/AuthContext';
import { cores } from '../styles/theme';

function obterIniciais(nome) {
    if (!nome) return '';
    const partes = String(nome).trim().split(/\s+/);
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
    return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase();
}

export default function AvatarUser({
    tamanho = 46,
    uriOverride,
    nome = '',
    editavel = false,
    mostrarStatus = false,
    onPress,
}) {
    const { token, fotoUsuario } = useContext(AuthContext);
    const [erroImagem, setErroImagem] = useState(false);

    const uriFinal = uriOverride !== undefined ? uriOverride : fotoUsuario;

    useEffect(() => {
        setErroImagem(false);
    }, [uriFinal]);

    const raio = tamanho / 2;
    const tamanhoInterno = tamanho - 6;
    const raioInterno = tamanhoInterno / 2;
    const iniciais = obterIniciais(nome);

    const Conteudo = (
        <View style={[styles.wrapperExterno, { width: tamanho, height: tamanho, borderRadius: raio }]}>
            <LinearGradient
                colors={
                    token
                        ? ['#F97316', cores.primaria, '#9A3412']
                        : ['rgba(255,255,255,0.28)', 'rgba(255,255,255,0.08)']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.anelGradiente, { width: tamanho, height: tamanho, borderRadius: raio }]}
            >
                <LinearGradient
                    colors={['#23232B', '#141418']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                        styles.mioloAvatar,
                        {
                            width: tamanhoInterno,
                            height: tamanhoInterno,
                            borderRadius: raioInterno,
                        },
                    ]}
                >
                    {uriFinal && !erroImagem ? (
                        <Image
                            source={{ uri: uriFinal }}
                            resizeMode="cover"
                            onError={() => setErroImagem(true)}
                            style={{
                                width: tamanhoInterno,
                                height: tamanhoInterno,
                                borderRadius: raioInterno,
                            }}
                        />
                    ) : iniciais ? (
                        <Text style={[styles.textoIniciais, { fontSize: Math.max(13, tamanho * 0.34) }]}>
                            {iniciais}
                        </Text>
                    ) : (
                        <Ionicons
                            name={token ? 'person' : 'person-outline'}
                            size={Math.round(tamanho * 0.46)}
                            color={token ? '#FDBA74' : cores.textoSecundario}
                        />
                    )}
                </LinearGradient>
            </LinearGradient>

            {editavel && (
                <View style={styles.badgeCamera}>
                    <Ionicons name="camera" size={12} color={cores.texto} />
                </View>
            )}

            {!editavel && mostrarStatus && (
                <View
                    style={[
                        styles.badgeStatus,
                        { backgroundColor: token ? '#22C55E' : '#71717A' },
                    ]}
                />
            )}
        </View>
    );

    if (!onPress) return Conteudo;

    return (
        <TouchableOpacity activeOpacity={0.82} onPress={onPress}>
            {Conteudo}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    wrapperExterno: {
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    anelGradiente: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 2,
    },
    mioloAvatar: {
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.65)',
    },
    textoIniciais: {
        color: '#FED7AA',
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    badgeCamera: {
        position: 'absolute',
        bottom: -1,
        right: -1,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: cores.primaria,
        borderWidth: 2,
        borderColor: '#141418',
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeStatus: {
        position: 'absolute',
        bottom: 1,
        right: 1,
        width: 11,
        height: 11,
        borderRadius: 5.5,
        borderWidth: 2,
        borderColor: cores.fundo,
    },
});