const router = require('express').Router();
const supabase = require('../db/supabase');

router.post('/auth/register', async (req, res) => {
  const { name, password } = req.body;
  const { data, error } = await supabase.from('users').insert([{ name, password }]).select();
  
  if (error) return res.status(400).json({ error: error.message });
  return res.status(201).json(data[0]);
});

router.post('/auth/login', async (req, res) => {
  const { name, password } = req.body;
  const { data, error } = await supabase.from('users').select('*').eq('name', name).eq('password', password).single();
  
  if (error || !data) return res.status(401).json({ error: 'Credenciais inválidas' });
  return res.json({ message: 'Login bem-sucedido', user: data });
});

module.exports = router;