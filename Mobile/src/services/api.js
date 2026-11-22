const API_URL = 'http://localhost:3000';

async function request(endpoint, options = {}) {
  const { token, headers, ...rest } = options;

  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...rest,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const mensagemErro = data?.erro || data?.error || 'Erro ao comunicar com o servidor.';
    throw new Error(mensagemErro);
  }

  return data;
}

export const pokemonService = {
  listarTodos: () => request('/pokemons'),
  buscarPorId: (id) => request(`/pokemons/${id}`),
  alternarFavorito: (id, token) =>
    request(`/pokemons/${id}/favorite`, { method: 'PUT', token }),
  alternarCapturado: (id, token) =>
    request(`/pokemons/${id}/catch`, { method: 'PUT', token }),
};