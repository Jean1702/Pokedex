import { request } from './api';

export const buscarUsuarioLogado = (token) =>
    request('/users/me', { token });