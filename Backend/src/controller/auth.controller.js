const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../db'); 

router.post('/auth/register', async (req, res) => {
  const { name, password } = req.body;

  if (!name || !password) {
    return res.status(400).json({ erro: 'Nome e senha são obrigatórios' });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const { data, error } = await supabase
    .from('users')
    .insert([{ name, password: passwordHash }])
    .select('id, name') 
    .single();

  if (error) {
    return res.status(400).json({ erro: error.message });
  }

  return res.status(201).json(data);
});

router.post('/auth/login', async (req, res) => {
  const { name, password } = req.body;

  if (!name || !password) {
    return res.status(400).json({ erro: 'Nome e senha são obrigatórios' });
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('name', name)
    .single();

  if (error || !user) {
    return res.status(401).json({ erro: 'Credenciais inválidas' });
  }

  const senhaValida = await bcrypt.compare(password, user.password);
  if (!senhaValida) {
    return res.status(401).json({ erro: 'Credenciais inválidas' });
  }

  const token = jwt.sign(
    { id: user.id, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );

  return res.status(200).json({ token });
});

module.exports = router;