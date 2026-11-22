import { request } from './api';

function ensureToken(token) {
  if (!token || typeof token !== 'string' || !token.trim()) {
    throw new Error('Token de autenticação inválido ou ausente.');
  }
}

export const listarTimes = async (token) => {
  ensureToken(token);
  return request('/teams', {
    method: 'GET',
    token,
  });
};

export const buscarTimePorId = async (token, id) => {
  ensureToken(token);
  const teamId = Number(id);
  if (!Number.isInteger(teamId) || teamId <= 0) {
    throw new Error('ID do time inválido.');
  }
  return request(`/teams/${teamId}`, {
    method: 'GET',
    token,
  });
};

export const criarTime = async (token, nome) => {
  ensureToken(token);
  const formattedName = typeof nome === 'string' ? nome.trim() : '';
  if (!formattedName) {
    throw new Error('O nome do time é obrigatório.');
  }

  return request('/teams', {
    method: 'POST',
    body: { name: formattedName },
    token,
  });
};

export const excluirTime = async (token, id) => {
  ensureToken(token);
  const teamId = Number(id);
  if (!Number.isInteger(teamId) || teamId <= 0) {
    throw new Error('ID do time inválido.');
  }

  return request(`/teams/${teamId}`, {
    method: 'DELETE',
    token,
  });
};