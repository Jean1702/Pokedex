export const TIPOS_OFICIAIS = [
    { nome: 'Normal', label: 'Normal', cor: '#A8A77A', fundo: '#26261E', borda: 'rgba(168, 167, 122, 0.45)', icone: 'record-circle-outline' },
    { nome: 'Fire', label: 'Fire', cor: '#F97316', fundo: '#2E1A10', borda: 'rgba(249, 115, 22, 0.45)', icone: 'fire' },
    { nome: 'Water', label: 'Water', cor: '#38BDF8', fundo: '#102430', borda: 'rgba(56, 189, 248, 0.45)', icone: 'water' },
    { nome: 'Grass', label: 'Grass', cor: '#22C55E', fundo: '#11291B', borda: 'rgba(34, 197, 94, 0.45)', icone: 'leaf' },
    { nome: 'Electric', label: 'Electric', cor: '#FACC15', fundo: '#2B250E', borda: 'rgba(250, 204, 21, 0.45)', icone: 'flash' },
    { nome: 'Ice', label: 'Ice', cor: '#67E8F9', fundo: '#12292E', borda: 'rgba(103, 232, 249, 0.45)', icone: 'snowflake' },
    { nome: 'Fighting', label: 'Fighting', cor: '#EF4444', fundo: '#2E1313', borda: 'rgba(239, 68, 68, 0.45)', icone: 'arm-flex' },
    { nome: 'Poison', label: 'Poison', cor: '#C084FC', fundo: '#241630', borda: 'rgba(192, 132, 252, 0.45)', icone: 'skull' },
    { nome: 'Ground', label: 'Ground', cor: '#D97706', fundo: '#2B1D0E', borda: 'rgba(217, 119, 6, 0.45)', icone: 'image-filter-hdr' },
    { nome: 'Flying', label: 'Flying', cor: '#818CF8', fundo: '#181B30', borda: 'rgba(129, 140, 248, 0.45)', icone: 'feather' },
    { nome: 'Psychic', label: 'Psychic', cor: '#EC4899', fundo: '#2E1322', borda: 'rgba(236, 72, 153, 0.45)', icone: 'eye' },
    { nome: 'Bug', label: 'Bug', cor: '#84CC16', fundo: '#1E2910', borda: 'rgba(132, 204, 22, 0.45)', icone: 'bug' },
    { nome: 'Rock', label: 'Rock', cor: '#B45309', fundo: '#26180D', borda: 'rgba(180, 83, 9, 0.45)', icone: 'diamond-stone' },
    { nome: 'Ghost', label: 'Ghost', cor: '#A855F7', fundo: '#21132E', borda: 'rgba(168, 85, 247, 0.45)', icone: 'ghost' },
    { nome: 'Dragon', label: 'Dragon', cor: '#6366F1', fundo: '#161730', borda: 'rgba(99, 102, 241, 0.45)', icone: 'flare' },
    { nome: 'Dark', label: 'Dark', cor: '#A1A1AA', fundo: '#1F1F24', borda: 'rgba(161, 161, 170, 0.45)', icone: 'moon-waning-crescent' },
    { nome: 'Steel', label: 'Steel', cor: '#94A3B8', fundo: '#1B2129', borda: 'rgba(148, 163, 184, 0.45)', icone: 'shield' },
    { nome: 'Fairy', label: 'Fairy', cor: '#F472B6', fundo: '#2E1624', borda: 'rgba(244, 114, 182, 0.45)', icone: 'auto-fix' },
];

const MAPA_TIPOS = new Map(
    TIPOS_OFICIAIS.map((t) => [t.nome.toLowerCase(), t])
);

export function obterConfigTipo(nomeTipo) {
    const chave = String(nomeTipo || '').toLowerCase().trim();
    return (
        MAPA_TIPOS.get(chave) || {
            nome: nomeTipo || 'Normal',
            label: nomeTipo || 'Normal',
            cor: '#A8A77A',
            fundo: '#1E1E24',
            borda: 'rgba(255, 255, 255, 0.14)',
            icone: 'record-circle-outline',
        }
    );
}