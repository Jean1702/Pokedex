const router = require('express').Router();
const supabase = require('../db/supabase');
const authMiddleware = require('../view/middleware/auth');

router.get('/teams', authMiddleware, async (req, res) => {
  const id_user = req.usuario.id;

  const { data, error } = await supabase
    .from('team')
    .select('*, pokemon_team(*, pokemons(*))')
    .eq('id_user', id_user);
    
  if (error) return res.status(400).json({ erro: error.message, error: error.message });
  return res.status(200).json(data);
});

router.get('/teams/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const id_user = req.usuario.id;

  const { data, error } = await supabase
    .from('team')
    .select('*, pokemon_team(*, pokemons(*))')
    .eq('id', id)
    .eq('id_user', id_user)
    .single();
    
  if (error || !data) return res.status(404).json({ erro: 'Time não encontrado', error: 'Time não encontrado' });
  return res.status(200).json(data);
});

router.post('/teams', authMiddleware, async (req, res) => {
  const { name } = req.body;
  const id_user = req.usuario.id;

  if (!name) {
    return res.status(400).json({ erro: 'Informe o nome do time', error: 'Informe o nome do time' });
  }

  const { data, error } = await supabase
    .from('team')
    .insert([{ name, id_user }])
    .select()
    .single();

  if (error) return res.status(400).json({ erro: error.message, error: error.message });
  return res.status(201).json(data);
});

module.exports = router;