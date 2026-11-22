<<<<<<< HEAD
const BASE_URL = 'http://localhost:3000';
=======
const BASE_URL = 'http://localhost:3000/';
>>>>>>> dd7392e019e100518b8df6a861fd6f7075599433

export const request = async (caminho, { method = 'GET', body, token } = {}) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
<<<<<<< HEAD
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${caminho}`, {
=======
    headers.Authorization = Bearer ${token};
  }

  const response = await fetch(${BASE_URL}${caminho}, {
>>>>>>> dd7392e019e100518b8df6a861fd6f7075599433
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const dados = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
<<<<<<< HEAD
    const erro = new Error(dados?.erro || dados?.error || 'Erro inesperado');
=======
    const erro = new Error(dados?.erro  dados?.error  'Erro inesperado');
>>>>>>> dd7392e019e100518b8df6a861fd6f7075599433
    erro.status = response.status;
    throw erro;
  }

  return dados;
};