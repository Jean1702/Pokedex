import { request } from './api';

export const login = (name, password) =>
  request('/auth/login', {
    method: 'POST',
    body: { name, password },
  });

export const registrar = (name, password) =>
  request('/auth/register', {
    method: 'POST',
    body: { name, password },
  });