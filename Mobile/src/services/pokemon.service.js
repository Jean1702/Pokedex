import { request } from './api';

export const listarPokemons = (type) => {
    const query = type && type !== 'Todos' ? `?type=${encodeURIComponent(type)}` : '';
    return request(`/pokemons${query}`);
};

export const buscarPokemonPorId = (id) =>
    request(`/pokemons/${id}`);

export const favoritarPokemon = (token, id) =>
    request(`/pokemons/${id}/favorite`, { method: 'PUT', token });

export const capturarPokemon = (token, id) =>
    request(`/pokemons/${id}/catch`, { method: 'PUT', token });