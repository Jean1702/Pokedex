import { request } from './api';

const cacheAtaques = new Map();

const TABELA_DEFESA_TIPOS = {
    normal: { fighting: 2, ghost: 0 },
    fire: { water: 2, ground: 2, rock: 2, fire: 0.5, grass: 0.5, ice: 0.5, bug: 0.5, steel: 0.5, fairy: 0.5 },
    water: { electric: 2, grass: 2, fire: 0.5, water: 0.5, ice: 0.5, steel: 0.5 },
    electric: { ground: 2, electric: 0.5, flying: 0.5, steel: 0.5 },
    grass: { fire: 2, ice: 2, poison: 2, flying: 2, bug: 2, water: 0.5, electric: 0.5, grass: 0.5, ground: 0.5 },
    ice: { fire: 2, fighting: 2, rock: 2, steel: 2, ice: 0.5 },
    fighting: { flying: 2, psychic: 2, fairy: 2, bug: 0.5, rock: 0.5, dark: 0.5 },
    poison: { ground: 2, psychic: 2, grass: 0.5, fighting: 0.5, poison: 0.5, bug: 0.5, fairy: 0.5 },
    ground: { water: 2, grass: 2, ice: 2, poison: 0.5, rock: 0.5, electric: 0 },
    flying: { electric: 2, ice: 2, rock: 2, grass: 0.5, fighting: 0.5, bug: 0.5, ground: 0 },
    psychic: { bug: 2, ghost: 2, dark: 2, fighting: 0.5, psychic: 0.5 },
    bug: { fire: 2, flying: 2, rock: 2, grass: 0.5, fighting: 0.5, ground: 0.5 },
    rock: { water: 2, grass: 2, fighting: 2, ground: 2, steel: 2, normal: 0.5, fire: 0.5, poison: 0.5, flying: 0.5 },
    ghost: { ghost: 2, dark: 2, poison: 0.5, bug: 0.5, normal: 0, fighting: 0 },
    dragon: { ice: 2, dragon: 2, fairy: 2, fire: 0.5, water: 0.5, electric: 0.5, grass: 0.5 },
    dark: { fighting: 2, bug: 2, fairy: 2, ghost: 0.5, dark: 0.5, psychic: 0 },
    steel: { fire: 2, fighting: 2, ground: 2, normal: 0.5, grass: 0.5, ice: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 0.5, dragon: 0.5, steel: 0.5, fairy: 0.5, poison: 0 },
    fairy: { poison: 2, steel: 2, fighting: 0.5, bug: 0.5, dark: 0.5, dragon: 0 },
};

const TODOS_OS_TIPOS = Object.keys(TABELA_DEFESA_TIPOS);

function calcularEfetividadeDefensiva(tiposPokemon) {
    const fraquezas = [];
    const resistencias = [];
    const imunidades = [];

    TODOS_OS_TIPOS.forEach((tipoAtacante) => {
        let multiplicador = 1;

        tiposPokemon.forEach((tipoDefensor) => {
            const chaveDef = String(tipoDefensor || '').toLowerCase().trim();
            const mapaDef = TABELA_DEFESA_TIPOS[chaveDef] || {};
            const fator = mapaDef[tipoAtacante] !== undefined ? mapaDef[tipoAtacante] : 1;
            multiplicador *= fator;
        });

        if (multiplicador === 0) {
            imunidades.push({ type: tipoAtacante, multiplier: '0x' });
        } else if (multiplicador > 1) {
            fraquezas.push({ type: tipoAtacante, multiplier: `${multiplicador}x` });
        } else if (multiplicador < 1) {
            resistencias.push({ type: tipoAtacante, multiplier: `${multiplicador}x` });
        }
    });

    fraquezas.sort((a, b) => parseFloat(b.multiplier) - parseFloat(a.multiplier));
    resistencias.sort((a, b) => parseFloat(a.multiplier) - parseFloat(b.multiplier));

    return { fraquezas, resistencias, imunidades };
}

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

export const buscarInformacoesExtrasPokemon = async (id) => {
    const dadosBase = await buscarPokemonPorId(id);
    const tipos = Array.isArray(dadosBase.types) && dadosBase.types.length > 0
        ? dadosBase.types
        : ['normal'];

    const efetividade = calcularEfetividadeDefensiva(tipos);

    const evYield = Array.isArray(dadosBase.stats)
        ? dadosBase.stats
            .filter((s) => s.effort > 0)
            .map((s) => ({
                stat: s.stat?.name || '',
                effort: s.effort,
            }))
        : [];

    let especieInfo = {
        captureRate: null,
        baseHappiness: null,
        growthRate: null,
        eggGroups: [],
        genderRate: -1,
        hatchCounter: null,
        isLegendary: false,
        isMythical: false,
    };

    try {
        const respEspecie = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`);
        if (respEspecie.ok) {
            const dadosEspecie = await respEspecie.json();
            especieInfo = {
                captureRate: dadosEspecie.capture_rate ?? null,
                baseHappiness: dadosEspecie.base_happiness ?? null,
                growthRate: dadosEspecie.growth_rate?.name || null,
                eggGroups: Array.isArray(dadosEspecie.egg_groups)
                    ? dadosEspecie.egg_groups.map((g) => g.name)
                    : [],
                genderRate: dadosEspecie.gender_rate ?? -1,
                hatchCounter: dadosEspecie.hatch_counter ?? null,
                isLegendary: Boolean(dadosEspecie.is_legendary),
                isMythical: Boolean(dadosEspecie.is_mythical),
            };
        }
    } catch {
    }

    return {
        ...dadosBase,
        efetividade,
        treinamento: {
            baseExperience: dadosBase.base_experience ?? null,
            evYield,
            ivRange: '0 – 31 (Máx. 186 total)',
            ...especieInfo,
        },
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
