import { request } from './api';

const cacheAtaques = new Map();

function extrairEvolucoes(noCadeia, lista = []) {
  if (!noCadeia) return lista;

  const partesUrl = noCadeia.species.url.split('/').filter(Boolean);
  const id = Number(partesUrl[partesUrl.length - 1]);

  lista.push({
    id,
    name: noCadeia.species.name,
    image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
  });

  if (Array.isArray(noCadeia.evolves_to)) {
    noCadeia.evolves_to.forEach((proximo) => extrairEvolucoes(proximo, lista));
  }

  return lista;
}

export const listarPokemons = (type) => {
  const query = type && type !== 'Todos' ? `?type=${encodeURIComponent(type)}` : '';
  return request(`/pokemons${query}`);
};

export const buscarPokemonPorId = (id) =>
  request(`/pokemons/${id}`);

export const buscarDetalhesCompletosPokemon = async (id) => {
  const dadosBase = await buscarPokemonPorId(id);

  let descricao = 'Nenhuma descrição registrada na Pokédex para esta espécie.';
  let evolucoes = [];

  try {
    const respEspecie = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`);
    if (respEspecie.ok) {
      const dadosEspecie = await respEspecie.json();

      const entradaTexto =
        dadosEspecie.flavor_text_entries?.find((e) => e.language.name === 'en') ||
        dadosEspecie.flavor_text_entries?.[0];

      if (entradaTexto?.flavor_text) {
        descricao = entradaTexto.flavor_text.replace(/[\n\f\r]+/g, ' ').trim();
      }

      if (dadosEspecie.evolution_chain?.url) {
        const respEvolucao = await fetch(dadosEspecie.evolution_chain.url);
        if (respEvolucao.ok) {
          const dadosEvolucao = await respEvolucao.json();
          evolucoes = extrairEvolucoes(dadosEvolucao.chain);
        }
      }
    }
  } catch {
    evolucoes = [];
  }

  return {
    ...dadosBase,
    descricao,
    evolucoes,
  };
};

export const buscarDetalhesAtaques = async (nomesAtaques) => {
  const resultado = {};
  const pendentes = nomesAtaques.filter((nome) => {
    if (cacheAtaques.has(nome)) {
      resultado[nome] = cacheAtaques.get(nome);
      return false;
    }
    return true;
  });

  const TAMANHO_LOTE = 15;
  for (let i = 0; i < pendentes.length; i += TAMANHO_LOTE) {
    const lote = pendentes.slice(i, i + TAMANHO_LOTE);

    await Promise.all(
      lote.map(async (nome) => {
        try {
          const resp = await fetch(`https://pokeapi.co/api/v2/move/${nome}`);
          if (!resp.ok) return;
          const dados = await resp.json();

          const textoFlavor =
            dados.flavor_text_entries?.find((e) => e.language.name === 'en') ||
            dados.flavor_text_entries?.[0];

          const textoEfeito = dados.effect_entries?.find((e) => e.language.name === 'en');

          let descricao = 'Sem descrição disponível para este movimento.';
          if (textoFlavor?.flavor_text) {
            descricao = textoFlavor.flavor_text.replace(/[\n\f\r]+/g, ' ').trim();
          } else if (textoEfeito?.short_effect) {
            descricao = textoEfeito.short_effect
              .replace(/\$effect_chance/g, String(dados.effect_chance ?? ''))
              .trim();
          }

          const detalhe = {
            name: dados.name,
            type: dados.type?.name || 'normal',
            power: dados.power,
            accuracy: dados.accuracy,
            pp: dados.pp,
            damageClass: dados.damage_class?.name || 'status',
            descricao,
          };

          cacheAtaques.set(nome, detalhe);
          resultado[nome] = detalhe;
        } catch {
          resultado[nome] = null;
        }
      })
    );
  }

  return resultado;
};

export const favoritarPokemon = (token, id, favority) =>
  request(`/pokemons/${id}/favorite`, {
    method: 'PUT',
    body: { favority },
    token,
  });

export const capturarPokemon = (token, id, isCaught) =>
  request(`/pokemons/${id}/catch`, {
    method: 'PUT',
    body: { catch: isCaught },
    token,
  });