import { request } from './api';

export const listarTimes = (token) =>
  request('/teams', { token });

export const buscarTimePorId = (token, teamId) =>
  request(`/teams/${teamId}`, { token });

export const criarTime = (token, { name, style = null, image = null }) =>
  request('/teams', {
    method: 'POST',
    body: { name, style, image },
    token,
  });

export const atualizarTime = (token, teamId, { name, style }) =>
  request(`/teams/${teamId}`, {
    method: 'PUT',
    body: { name, style },
    token,
  });

export const adicionarPokemonAoTime = (token, teamId, { id_pokemon, shiny = false }) =>
  request(`/teams/${teamId}/pokemons`, {
    method: 'POST',
    body: { id_pokemon, shiny: Boolean(shiny) },
    token,
  });

export const removerPokemonDoTime = (token, teamId, pokemonTeamId) =>
  request(`/teams/${teamId}/pokemons/${pokemonTeamId}`, {
    method: 'DELETE',
    token,
  });

export const excluirTime = (token, teamId) =>
  request(`/teams/${teamId}`, {
    method: 'DELETE',
    token,
  });