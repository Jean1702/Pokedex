const supabase = require('./supabase');

require('dotenv').config();
const BATCH_SIZE = 25;

async function syncPokemonsAndTypes() {
  const listResponse = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1350');
  const listData = await listResponse.json();
  const results = listData.results;

  const typeMap = new Map();

  for (let i = 0; i < results.length; i += BATCH_SIZE) {
    const batch = results.slice(i, i + BATCH_SIZE);

    const details = await Promise.all(
      batch.map(async (item) => {
        const res = await fetch(item.url);
        return res.json();
      })
    );

    const pokemonsPayload = [];
    const relationsPayload = [];

    for (const p of details) {
      const formattedName = p.name.charAt(0).toUpperCase() + p.name.slice(1);

      pokemonsPayload.push({
        id: p.id,
        name: formattedName,
        image: p.sprites.front_default
      });

      for (const t of p.types) {
        const typeName = t.type.name;

        if (!typeMap.has(typeName)) {
          const { data: typeRow, error: typeError } = await supabase
            .from('types')
            .upsert({ name: typeName }, { onConflict: 'name' })
            .select('id')
            .single();

          if (typeError) throw typeError;
          typeMap.set(typeName, typeRow.id);
        }

        relationsPayload.push({
          pokemon_id: p.id,
          type_id: typeMap.get(typeName),
          slot: t.slot
        });
      }
    }

    const { error: pokeError } = await supabase
      .from('pokemons')
      .upsert(pokemonsPayload, { onConflict: 'id' });

    if (pokeError) throw pokeError;

    const { error: relError } = await supabase
      .from('pokemon_types')
      .upsert(relationsPayload, { onConflict: 'pokemon_id,type_id' });

    if (relError) throw relError;

    console.log(`Processados ${Math.min(i + BATCH_SIZE, results.length)} de ${results.length}`);
  }

  console.log('Sincronização concluída.');
}

syncPokemonsAndTypes().catch(console.error);