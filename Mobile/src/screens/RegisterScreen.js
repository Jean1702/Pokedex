import React, { useContext, useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../contexts/AuthContext';
import { cores, fontes, espacos, bordas } from '../styles/theme';

export default function RegisterScreen({ navigation }) {
    const { cadastrar } = useContext(AuthContext);

    const [usuario, setUsuario] = useState('');
    const [senha, setSenha] = useState('');
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState('');

    const handleCadastrar = async () => {
        if (!usuario.trim() || !senha.trim()) {
            setErro('Preencha usuário e senha para criar sua conta.');
            return;
        }

        try {
            setCarregando(true);
            setErro('');
            await cadastrar(usuario.trim(), senha);
        } catch (e) {
            setErro(e.message || 'Erro ao registrar usuário.');
        } finally {
            setCarregando(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <LinearGradient
                colors={[cores.fundo, '#121318', cores.fundo]}
                style={StyleSheet.absoluteFill}
            />

            {/* Seta de volta para 05 - Login conforme o protótipo */}
            <TouchableOpacity
                style={styles.botaoVoltar}
                onPress={() => navigation.goBack()}
            >
                <Text style={styles.textoVoltar}>‹ Voltar para Login</Text>
            </TouchableOpacity>

            <View style={styles.cabecalho}>
                <Text style={styles.logoTitulo}>POKÉMON</Text>
                <Text style={styles.subtitulo}>Register</Text>
            </View>

            <View style={styles.cardFormulario}>
                <Text style={styles.label}>USUÁRIO</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Escolha um nome de usuário..."
                    placeholderTextColor={cores.textoSecundario}
                    value={usuario}
                    onChangeText={setUsuario}
                    autoCapitalize="none"
                    autoCorrect={false}
                />

                <Text style={styles.label}>SENHA</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Crie uma senha..."
                    placeholderTextColor={cores.textoSecundario}
                    value={senha}
                    onChangeText={setSenha}
                    secureTextEntry
                />

                {erro ? (
                    <View style={styles.boxErro}>
                        <Text style={styles.textoErro}>{erro}</Text>
                    </View>
                ) : null}

                <TouchableOpacity
                    style={styles.botaoEntrar}
                    activeOpacity={0.85}
                    disabled={carregando}
                    onPress={handleCadastrar}
                >
                    {carregando ? (
                        <ActivityIndicator color="#111827" />
                    ) : (
                        <Text style={styles.textoBotaoAmarelo}>ENTRAR</Text>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: cores.fundo,
        justifyContent: 'center',
        alignItems: 'center',
        padding: espacos.grande,
    },
    botaoVoltar: {
        position: 'absolute',
        top: 24,
        left: 20,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: bordas.raio,
        backgroundColor: cores.superficie,
        borderWidth: 1,
        borderColor: cores.borda,
    },
    textoVoltar: {
        color: cores.texto,
        fontSize: fontes.pequena,
        fontWeight: '600',
    },
    cabecalho: {
        alignItems: 'center',
        marginBottom: espacos.grande,
    },
    logoTitulo: {
        color: '#38BDF8',
        fontSize: 34,
        fontWeight: '900',
        letterSpacing: 2,
    },
    subtitulo: {
        color: '#F59E0B',
        fontSize: fontes.titulo,
        fontWeight: '700',
        marginTop: 4,
    },
    cardFormulario: {
        width: '100%',
        maxWidth: 380,
        backgroundColor: cores.superficie,
        borderRadius: bordas.raio + 6,
        padding: espacos.grande,
        borderWidth: 1,
        borderColor: cores.borda,
    },
    label: {
        color: cores.texto,
        fontSize: fontes.pequena,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 6,
    },
    input: {
        backgroundColor: cores.fundo,
        color: cores.texto,
        fontSize: fontes.normal,
        paddingHorizontal: espacos.medio,
        paddingVertical: 12,
        borderRadius: bordas.raio,
        borderWidth: 1,
        borderColor: cores.borda,
        marginBottom: espacos.medio,
    },
    boxErro: {
        backgroundColor: cores.erroFundo,
        padding: 10,
        borderRadius: bordas.raio,
        borderWidth: 1,
        borderColor: cores.erro,
        marginBottom: espacos.medio,
    },
    textoErro: {
        color: cores.erro,
        fontSize: fontes.pequena,
        textAlign: 'center',
        fontWeight: '600',
    },
    botaoEntrar: {
        backgroundColor: '#FACC15',
        paddingVertical: 13,
        borderRadius: bordas.raio,
        alignItems: 'center',
        marginTop: espacos.pequeno,
    },
    textoBotaoAmarelo: {
        color: '#111827',
        fontSize: fontes.normal,
        fontWeight: '900',
        letterSpacing: 0.8,
    },
});