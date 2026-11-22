const router = require('express').Router();
const supabase = require('../db/supabase');
const authMiddleware = require('../view/middleware/auth');

async function attachPokemonsToTeams(teams) {
  if (!Array.isArray(teams) || teams.length === 0) return teams || [];

  const allPokemonIds = [
    ...new Set(
      teams.flatMap((team) =>
        Array.isArray(team.pokemon_team)
          ? team.pokemon_team.map((pt) => pt.id_pokemon).filter((id) => id != null)
          : []
      )
    )
  ];

  let pokemonById = new Map();

  if (allPokemonIds.length > 0) {
    const { data: pokemonsData, error: pokeError } = await supabase
      .from('pokemons')
      .select(`
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
      `)
      .in('id', allPokemonIds);

    if (pokeError) {
      throw pokeError;
    }

    pokemonById = new Map(
      (pokemonsData || []).map((poke) => {
        const types = Array.isArray(poke.pokemon_types)
          ? poke.pokemon_types
              .slice()
              .sort((a, b) => a.slot - b.slot)
              .map((pt) => pt.types?.name)
              .filter(Boolean)
          : [];

        const { pokemon_types, ...rest } = poke;

        return [
          poke.id,
          {
            ...rest,
            shiny: Boolean(rest.shiny),
            types
          }
        ];
      })
    );
  }

  return teams.map((team) => ({
    ...team,
    pokemon_team: Array.isArray(team.pokemon_team)
      ? team.pokemon_team
          .slice()
          .sort((a, b) => a.id - b.id)
          .map((item) => ({
            ...item,
            pokemons: pokemonById.get(item.id_pokemon) || null
          }))
      : []
  }));
}

router.get('/teams', authMiddleware, async (req, res) => {
  const id_user = req.usuario.id;

  const { data, error } = await supabase
    .from('team')
    .select(`
      *,
      pokemon_team (
        id,
        id_pokemon,
        id_team
      )
    `)
    .eq('id_user', id_user)
    .order('id', { ascending: true });

  if (error) {
    return res.status(400).json({ erro: error.message, error: error.message });
  }

  try {
    const formatted = await attachPokemonsToTeams(data);
    return res.status(200).json(formatted);
  } catch (err) {
    return res.status(400).json({ erro: err.message, error: err.message });
  }
});

router.get('/teams/:id', authMiddleware, async (req, res) => {
  const teamId = Number(req.params.id);
  const id_user = req.usuario.id;

  if (!Number.isInteger(teamId) || teamId <= 0) {
    return res.status(400).json({ erro: 'ID do time inválido', error: 'ID do time inválido' });
  }

  const { data, error } = await supabase
    .from('team')
    .select(`
      *,
      pokemon_team (
        id,
        id_pokemon,
        id_team
      )
    `)
    .eq('id', teamId)
    .eq('id_user', id_user)
    .maybeSingle();

  if (error) {
    return res.status(400).json({ erro: error.message, error: error.message });
  }

  if (!data) {
    return res.status(404).json({ erro: 'Time não encontrado', error: 'Time não encontrado' });
  }

  try {
    const [formatted] = await attachPokemonsToTeams([data]);
    return res.status(200).json(formatted);
  } catch (err) {
    return res.status(400).json({ erro: err.message, error: err.message });
  }
});

router.post('/teams', authMiddleware, async (req, res) => {
  const { name, style = null, image = null } = req.body;
  const id_user = req.usuario.id;

  if (!name || !String(name).trim()) {
    return res.status(400).json({ erro: 'Informe o nome do time', error: 'Informe o nome do time' });
  }

  const { data, error } = await supabase
    .from('team')
    .insert([{
      name: String(name).trim(),
      style,
      image,
      id_user
    }])
    .select()
    .single();

  if (error) {
    return res.status(400).json({ erro: error.message, error: error.message });
  }

  return res.status(201).json(data);
});

router.delete('/teams/:id', authMiddleware, async (req, res) => {
  const teamId = Number(req.params.id);
  const id_user = req.usuario.id;

  if (!Number.isInteger(teamId) || teamId <= 0) {
    return res.status(400).json({ erro: 'ID do time inválido', error: 'ID do time inválido' });
  }

  const { data: existingTeam, error: findError } = await supabase
    .from('team')
    .select('id')
    .eq('id', teamId)
    .eq('id_user', id_user)
    .maybeSingle();

  if (findError) {
    return res.status(400).json({ erro: findError.message, error: findError.message });
  }

  if (!existingTeam) {
    return res.status(404).json({ erro: 'Time não encontrado', error: 'Time não encontrado' });
  }

  const { error: unlinkError } = await supabase
    .from('pokemon_team')
    .delete()
    .eq('id_team', teamId);

  if (unlinkError) {
    return res.status(400).json({ erro: unlinkError.message, error: unlinkError.message });
  }

  const { error: deleteError } = await supabase
    .from('team')
    .delete()
    .eq('id', teamId)
    .eq('id_user', id_user);

  if (deleteError) {
    return res.status(400).json({ erro: deleteError.message, error: deleteError.message });
  }

  return res.status(200).json({ message: 'Time excluído com sucesso', id: teamId });
});

module.exports = router;