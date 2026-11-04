const router = require('express').Router();
const supabase = require('../db/supabase');

router.get('/teams', async (req, res) => {
  const { data, error } = await supabase
    .from('team')
    .select('*, pokemon_team(*, pokemons(*))');
    
  if (error) return res.status(400).json({ error: error.message });
  return res.json(data);
});

router.get('/teams/:id', async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('team')
    .select('*, pokemon_team(*, pokemons(*))')
    .eq('id', id)
    .single();
    
  if (error) return res.status(404).json({ error: 'Time não encontrado' });
  return res.json(data);
});

module.exports = router;