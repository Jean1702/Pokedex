const BASE_URL = 'http://localhost:3000';

export const request = async (caminho, { method = 'GET', body, token } = {}) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${caminho}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const dados = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    const erro = new Error(dados?.erro || dados?.error || 'Erro inesperado');
    erro.status = response.status;
    throw erro;
  }

  return dados;
};