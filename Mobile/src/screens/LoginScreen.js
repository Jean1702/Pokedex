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

export default function LoginScreen({ navigation }) {
    const { entrar } = useContext(AuthContext);

    const [usuario, setUsuario] = useState('');
    const [senha, setSenha] = useState('');
    const [carregando, setCarregando] = useState(false);
    const [erroLogin, setErroLogin] = useState('');

    const handleEntrar = async () => {
        if (!usuario.trim() || !senha.trim()) {
            setErroLogin('Preencha usuário e senha para continuar.');
            return;
        }

        try {
            setCarregando(true);
            setErroLogin('');
            await entrar(usuario.trim(), senha);
        } catch (e) {
            setErroLogin(e.message || 'Usuário ou senha inválidos');
        } finally {
            setCarregando(false);
        }
    };

    if (erroLogin) {
        return (
            <View style={styles.containerErro}>
                <View style={styles.cardErro}>
                    <Text style={styles.tituloErro}>ERROR</Text>
                    <Text style={styles.mensagemErro}>{erroLogin}</Text>

                    <TouchableOpacity
                        style={styles.botaoVoltarErro}
                        activeOpacity={0.85}
                        onPress={() => setErroLogin('')}
                    >
                        <Text style={styles.textoBotaoAmarelo}>VOLTAR</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <LinearGradient
                colors={[cores.fundo, '#121318', cores.fundo]}
                style={StyleSheet.absoluteFill}
            />

            {/* Botão discreto para voltar à Pokédex */}
            <TouchableOpacity
                style={styles.botaoFechar}
                onPress={() => navigation.goBack()}
            >
                <Text style={styles.textoFechar}>‹ Pokédex</Text>
            </TouchableOpacity>

            <View style={styles.cabecalho}>
                <Text style={styles.logoTitulo}>POKÉMON</Text>
                <Text style={styles.subtitulo}>Login</Text>
            </View>

            <View style={styles.cardFormulario}>
                <Text style={styles.label}>USUÁRIO</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Digite seu usuário..."
                    placeholderTextColor={cores.textoSecundario}
                    value={usuario}
                    onChangeText={setUsuario}
                    autoCapitalize="none"
                    autoCorrect={false}
                />

                <Text style={styles.label}>SENHA</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Digite sua senha..."
                    placeholderTextColor={cores.textoSecundario}
                    value={senha}
                    onChangeText={setSenha}
                    secureTextEntry
                />

                {/* Botão Registrar -> Seta "Ir para tela de Registro" */}
                <TouchableOpacity
                    style={styles.botaoRegistrar}
                    activeOpacity={0.85}
                    disabled={carregando}
                    onPress={() => navigation.navigate('RegisterScreen')}
                >
                    <Text style={styles.textoBotaoAzul}>Registrar</Text>
                </TouchableOpacity>

                {/* Botão ENTRAR -> Chama POST /auth/login */}
                <TouchableOpacity
                    style={styles.botaoEntrar}
                    activeOpacity={0.85}
                    disabled={carregando}
                    onPress={handleEntrar}
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
    botaoFechar: {
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
    textoFechar: {
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
    botaoRegistrar: {
        backgroundColor: '#38BDF8',
        paddingVertical: 13,
        borderRadius: bordas.raio,
        alignItems: 'center',
        marginTop: espacos.pequeno,
        marginBottom: 10,
    },
    textoBotaoAzul: {
        color: '#090D16',
        fontSize: fontes.normal,
        fontWeight: '800',
    },
    botaoEntrar: {
        backgroundColor: '#FACC15',
        paddingVertical: 13,
        borderRadius: bordas.raio,
        alignItems: 'center',
    },
    textoBotaoAmarelo: {
        color: '#111827',
        fontSize: fontes.normal,
        fontWeight: '900',
        letterSpacing: 0.8,
    },
    containerErro: {
        flex: 1,
        backgroundColor: '#DC2626',
        justifyContent: 'center',
        alignItems: 'center',
        padding: espacos.grande,
    },
    cardErro: {
        width: '100%',
        maxWidth: 360,
        backgroundColor: cores.superficie,
        borderRadius: bordas.raio + 6,
        padding: espacos.grande * 1.2,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FCA5A5',
    },
    tituloErro: {
        color: '#EF4444',
        fontSize: 32,
        fontWeight: '900',
        letterSpacing: 2,
        marginBottom: espacos.medio,
    },
    mensagemErro: {
        color: cores.texto,
        fontSize: fontes.grande,
        textAlign: 'center',
        marginBottom: espacos.grande * 1.5,
        lineHeight: 24,
    },
    botaoVoltarErro: {
        width: '100%',
        backgroundColor: '#FACC15',
        paddingVertical: 14,
        borderRadius: bordas.raio,
        alignItems: 'center',
    },
});