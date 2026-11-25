const router = require('express').Router();
const supabase = require('../db/supabase');
const authMiddleware = require('../view/middleware/auth');

const USER_POKEMON_SELECT = `
  id,
  id_user,
  id_pokemon,
  catch,
  catch_shiny,
  favority,
  favority_shiny,
  pokemons (
    id,
    name,
    image,
    shiny,
    pokemon_types (
      slot,
      types (
        name
      )
    )
  )
`;

function formatUserPokemons(rows) {
  if (!Array.isArray(rows)) return rows;

  return rows.map((row) => {
    if (!row.pokemons) return row;

    const types = Array.isArray(row.pokemons.pokemon_types)
      ? row.pokemons.pokemon_types
        .slice()
        .sort((a, b) => a.slot - b.slot)
        .map((pt) => pt.types?.name)
        .filter(Boolean)
      : [];

    const { pokemon_types, ...restPokemon } = row.pokemons;

    return {
      ...row,
      pokemons: {
        ...restPokemon,
        shiny: Boolean(restPokemon.shiny),
        types
      }
    };
  });
}

router.get('/users/me', authMiddleware, async (req, res) => {
  const id_user = req.usuario.id;

  const { data, error } = await supabase
    .from('users')
    .select('id, name')
    .eq('id', id_user)
    .maybeSingle();

  if (error) {
    return res.status(400).json({ erro: error.message, error: error.message });
  }

  if (!data) {
    return res.status(404).json({ erro: 'Usuário não encontrado', error: 'Usuário não encontrado' });
  }

  return res.status(200).json(data);
});

router.get('/users/me/favorites', authMiddleware, async (req, res) => {
  const id_user = req.usuario.id;

  const { data, error } = await supabase
    .from('pokemon_user')
    .select(USER_POKEMON_SELECT)
    .eq('id_user', id_user)
    .or('favority.eq.true,favority_shiny.eq.true')
    .order('id', { ascending: true });

  if (error) {
    return res.status(400).json({ erro: error.message });
  }

  const formatados = formatUserPokemons(data);
  const resultado = formatados.flatMap((row) => {
    if (!row.pokemons) return [];
    const lista = [];
    if (row.favority) {
      lista.push({ ...row, pokemons: { ...row.pokemons, shiny: false } });
    }
    if (row.favority_shiny) {
      lista.push({ ...row, pokemons: { ...row.pokemons, shiny: true } });
    }
    return lista;
  });

  return res.status(200).json(resultado);
});
router.get('/users/me/captured', authMiddleware, async (req, res) => {
  const id_user = req.usuario.id;

  const { data, error } = await supabase
    .from('pokemon_user')
    .select(USER_POKEMON_SELECT)
    .eq('id_user', id_user)
    .or('catch.eq.true,catch_shiny.eq.true')
    .order('id', { ascending: true });

  if (error) {
    return res.status(400).json({ erro: error.message });
  }

  const formatado = data.flatMap((row) => {
    if (!row.pokemons) return [];
    const base = formatUserPokemons([row])[0].pokemons;
    const entradas = [];

    if (row.catch) {
      entradas.push({ ...row, pokemons: { ...base, shiny: false } });
    }
    if (row.catch_shiny) {
      entradas.push({ ...row, pokemons: { ...base, shiny: true } });
    }
    return entradas;
  });

  return res.status(200).json(formatado);
});

module.exports = router;