import type { Palette } from './types';

/** Colour ids are the lowercase name with spaces replaced by underscores; Jev sees the names only. */
function p(id: string, name: string, mood: string, paper: [string, string], colors: Array<[string, string]>): Palette {
  return {
    id,
    name,
    mood,
    paperName: paper[0],
    paper: paper[1],
    colors: colors.map(([n, hex]) => ({ id: n.toLowerCase().replace(/[^a-z0-9]+/g, '_'), name: n, hex })),
  };
}

export const PALETTES: Palette[] = [
  p('sunset_coast', 'Sunset coast', 'warm evening light over water', ['warm cream', '#f6efe1'], [['coral', '#ef6f5a'], ['amber', '#f2a93b'], ['plum', '#6b3a6e'], ['deep navy', '#1d2b53'], ['pale rose', '#f7c9c0']]),
  p('nordic_winter', 'Nordic winter', 'cold, quiet, pale light', ['snow white', '#f4f6f8'], [['ice blue', '#a9c8dc'], ['slate', '#5b6b7a'], ['pine green', '#2f5d50'], ['birch grey', '#c9c4bb'], ['dusk violet', '#8a7ea8']]),
  p('mediterranean_noon', 'Mediterranean noon', 'hot sun, white walls, blue sea', ['bright white', '#fbfaf5'], [['azure', '#1f6fb2'], ['turquoise', '#3fb8b0'], ['terracotta', '#c9603a'], ['lemon', '#f4d35e'], ['olive', '#6e7f3c']]),
  p('autumn_forest', 'Autumn forest', 'falling leaves, damp earth', ['oat', '#efe6d4'], [['rust', '#b0452b'], ['ochre', '#d99a2b'], ['moss', '#5f6b2e'], ['bark brown', '#4a3527'], ['burgundy', '#6d1f2c']]),
  p('spring_meadow', 'Spring meadow', 'fresh, light, flowering', ['pale cream', '#f9f6ec'], [['grass green', '#6fb04a'], ['buttercup', '#f5d033'], ['lilac', '#b493d6'], ['blush pink', '#f2a8b8'], ['sky blue', '#8fc5ea']]),
  p('desert_dusk', 'Desert dusk', 'dry warmth turning cool', ['sand', '#efe3cf'], [['dune', '#d9a066'], ['clay red', '#a6442f'], ['sage', '#8ea08a'], ['violet dusk', '#5a4a7a'], ['pale gold', '#eed58a']]),
  p('deep_ocean', 'Deep ocean', 'dark water and cold light', ['pale grey', '#eef1f2'], [['abyss blue', '#0f2740'], ['teal', '#1e7a86'], ['sea foam', '#b6e3d4'], ['kelp green', '#2f5e3a'], ['silver', '#c7ced3']]),
  p('tropical_market', 'Tropical market', 'loud, joyful, saturated', ['white', '#fbfbf7'], [['mango', '#f7941d'], ['hot pink', '#e8367a'], ['lime', '#8fd14f'], ['electric blue', '#2a6df4'], ['purple', '#7b2cbf']]),
  p('monochrome_ink', 'Monochrome ink', 'black ink on paper, no colour', ['rice paper', '#f5f1e6'], [['ink black', '#15161a'], ['charcoal grey', '#4a4c52'], ['ash grey', '#8f9298'], ['mist grey', '#cfd1d3'], ['warm sepia', '#6a5340']]),
  p('sepia_memory', 'Sepia memory', 'old photograph, faded warmth', ['aged paper', '#eadfc8'], [['sepia', '#7a5a3a'], ['umber', '#4d3421'], ['faded rose', '#c69b8a'], ['bone', '#e2d3b4'], ['dusty olive', '#8a8360']]),
  p('neon_night', 'Neon night', 'city lights on wet asphalt', ['near black', '#14121c'], [['neon pink', '#ff3ca6'], ['cyan glow', '#2ee6ff'], ['electric violet', '#8b5cff'], ['acid yellow', '#e8ff3c'], ['wet asphalt', '#2c2a3a']]),
  p('midnight_garden', 'Midnight garden', 'moonlit leaves and blooms', ['midnight', '#141b2b'], [['moon silver', '#dfe4ec'], ['night leaf', '#2f6b4a'], ['dark rose', '#a3405b'], ['indigo', '#33418f'], ['pale lavender', '#c8bfe6']]),
  p('candy_shop', 'Candy shop', 'sweet pastels, playful', ['vanilla', '#fdf8f0'], [['bubblegum', '#f6a5c0'], ['mint', '#a8e6cf'], ['lemon drop', '#fff3a3'], ['lavender candy', '#c8b6f0'], ['peach', '#ffc8a2']]),
  p('storm_at_sea', 'Storm at sea', 'heavy, dramatic, dark', ['grey paper', '#dcdfe1'], [['storm grey', '#4a5561'], ['thunder blue', '#243b55'], ['foam white', '#eef2f4'], ['sea green', '#3b6d6a'], ['lightning yellow', '#f2d675']]),
  p('golden_hour', 'Golden hour', 'low sun, long shadows', ['ivory', '#f8f2e4'], [['gold', '#e6b04a'], ['honey', '#d98e2a'], ['warm shadow', '#6b4a3a'], ['soft peach', '#f5c9a6'], ['dusty blue', '#8aa2b8']]),
  p('arctic_aurora', 'Arctic aurora', 'green and violet light over snow', ['deep night', '#0d1424'], [['aurora green', '#5ef2a7'], ['aurora violet', '#a066ff'], ['ice white', '#e7f0f7'], ['polar blue', '#3c7fd1'], ['dark pine', '#1c3d33']]),
  p('rustic_kitchen', 'Rustic kitchen', 'bread, copper, herbs', ['linen', '#f1e9da'], [['copper', '#b8622e'], ['flour white', '#f7f3ea'], ['herb green', '#5c7a3d'], ['walnut', '#5a3e2b'], ['tomato red', '#c33d2e']]),
  p('rainy_city', 'Rainy city', 'grey streets, reflections', ['pale grey', '#ecedee'], [['rain grey', '#8d949c'], ['wet stone', '#4c5158'], ['taxi yellow', '#f0c531'], ['umbrella red', '#c8332f'], ['neon sign blue', '#3b8ad9']]),
  p('lavender_fields', 'Lavender fields', 'purple rows under a soft sky', ['cream', '#f8f4ea'], [['lavender', '#9b7fd1'], ['deep violet', '#5b3d99'], ['field green', '#7a9c56'], ['warm haze', '#f3dcc3'], ['soft sky', '#bcd6ee']]),
  p('cherry_blossom', 'Cherry blossom', 'pink petals, spring softness', ['blossom white', '#fdf7f7'], [['sakura pink', '#f5b7c8'], ['deep pink', '#d86a8c'], ['branch brown', '#5a463b'], ['spring sky', '#a9d3f0'], ['pale green', '#c8e2b8']]),
  p('volcanic', 'Volcanic', 'black rock and molten light', ['charcoal black', '#1b1a1a'], [['lava orange', '#ff5a1f'], ['ember red', '#c4161c'], ['ash', '#6d6a66'], ['sulphur yellow', '#f2c318'], ['basalt', '#2e2d2f']]),
  p('jungle_canopy', 'Jungle canopy', 'dense greens, hidden colour', ['pale moss', '#eef0e2'], [['canopy green', '#1f6b3a'], ['leaf green', '#5fa04b'], ['parrot red', '#e0362f'], ['orchid purple', '#9a4fbf'], ['dark soil', '#3b2a1f']]),
  p('coral_reef', 'Coral reef', 'bright life under clear water', ['aqua white', '#f0f9f9'], [['reef coral', '#ff7f66'], ['lagoon', '#25b3c7'], ['sunfish yellow', '#f9d648'], ['anemone purple', '#9c6ade'], ['deep water', '#134f6b']]),
  p('vintage_poster', 'Vintage poster', 'flat printed colours, a bit faded', ['cream', '#f2e9d5'], [['poster red', '#c8402f'], ['mustard', '#d9a826'], ['teal ink', '#2a6f77'], ['midnight ink', '#23283a'], ['faded cream', '#e7dcc0']]),
  p('bauhaus_primary', 'Bauhaus primary', 'red, yellow, blue, black: pure and flat', ['white', '#f7f7f4'], [['signal red', '#d12a2a'], ['primary yellow', '#f2c400'], ['primary blue', '#1f4fb4'], ['black', '#1a1a1a'], ['grey', '#a0a0a0']]),
  p('earth_pigments', 'Earth pigments', 'ochres and iron oxides, ancient', ['raw canvas', '#e9dcc4'], [['yellow ochre', '#c9962b'], ['red ochre', '#a6462a'], ['burnt umber', '#5a3a26'], ['bone white', '#efe5d0'], ['charcoal', '#2b2926']]),
  p('pastel_dawn', 'Pastel dawn', 'first light, gentle gradients', ['pale pink white', '#fbf5f3'], [['dawn pink', '#f4c2c2'], ['apricot', '#f8cfa8'], ['powder blue', '#bcd4e6'], ['soft lilac', '#d5c6e8'], ['pale lemon', '#f8efb8']]),
  p('royal_velvet', 'Royal velvet', 'rich, dark, luxurious', ['dark plum', '#221626'], [['royal purple', '#5d2e8c'], ['gold leaf', '#d4a437'], ['crimson', '#9b1b30'], ['emerald', '#1e6f4c'], ['ivory', '#f1e9d8']]),
  p('scandinavian_home', 'Scandinavian home', 'muted, calm, natural', ['warm white', '#f6f3ee'], [['oak', '#c9a97a'], ['dusty blue', '#8fa6b8'], ['soft grey', '#b9b7b2'], ['clay pink', '#d9a99a'], ['forest', '#3f5a4a']]),
  p('pop_art', 'Pop art', 'flat, loud, comic-book', ['white', '#ffffff'], [['pop red', '#e4002b'], ['pop yellow', '#ffd400'], ['pop blue', '#0057b8'], ['pop pink', '#ff5fa2'], ['black', '#111111']]),
  p('foggy_harbour', 'Foggy harbour', 'soft greys, hints of colour', ['fog white', '#eceeed'], [['harbour grey', '#9aa3a8'], ['boat red', '#b04a3a'], ['rope beige', '#d6c6a8'], ['water green', '#6f8f8a'], ['deep fog', '#5e6a70']]),
  p('wildflower', 'Wildflower', 'scattered bright colour on green', ['cream', '#faf6ec'], [['poppy red', '#d9302c'], ['cornflower', '#6f8fdc'], ['daisy yellow', '#f6d33c'], ['meadow green', '#5f9a3f'], ['clover pink', '#e58fb0']]),
  p('smoke_and_ember', 'Smoke and ember', 'grey smoke with warm sparks', ['smoke grey', '#d8d5d0'], [['smoke', '#7d7a76'], ['ember', '#e0602a'], ['soot', '#2a2725'], ['warm ash', '#b7a99a'], ['glow orange', '#f4a24a']]),
  p('ice_cream_summer', 'Ice cream summer', 'bright and sweet', ['white', '#fffdf8'], [['strawberry', '#f2647c'], ['pistachio', '#a4d18a'], ['vanilla yellow', '#f9e79f'], ['blueberry', '#6c7bd9'], ['chocolate', '#5c3b2e']]),
  p('mountain_morning', 'Mountain morning', 'cool rock and clear air', ['pale cream', '#f5f5ef'], [['granite', '#7d8288'], ['glacier blue', '#a8cde0'], ['alpine green', '#4d7a52'], ['snow', '#f7f9fa'], ['dawn rose', '#e8b4a6']]),
  p('honey_and_wheat', 'Honey and wheat', 'golden fields, late summer', ['pale wheat', '#f6efdc'], [['wheat', '#e3c46a'], ['honey', '#d29a2c'], ['straw', '#f0dfa4'], ['harvest brown', '#8a5a2b'], ['summer sky', '#9ec4e8']]),
  p('ink_and_gold', 'Ink and gold', 'black ink with gold accents', ['ivory', '#f4eee0'], [['ink black', '#191919'], ['gold', '#d4af37'], ['warm grey', '#8c857a'], ['dark gold', '#a67c1f'], ['bone', '#e9e0cb']]),
  p('blue_hour', 'Blue hour', 'the blue minutes after sunset', ['pale blue grey', '#e6ebf1'], [['blue hour', '#2c4a7a'], ['dusk blue', '#5f7fb0'], ['window amber', '#f0b45a'], ['rooftop grey', '#5d6068'], ['pale blue', '#b7c9e2']]),
  p('circus', 'Circus', 'stripes, bold, festive', ['cream', '#fbf5e8'], [['circus red', '#d62828'], ['sunflower', '#f7b32b'], ['royal blue', '#2b4ea2'], ['emerald green', '#2a9d5c'], ['black', '#1c1c1c']]),
  p('moss_and_stone', 'Moss and stone', 'quiet forest floor', ['pale stone', '#ecebe4'], [['moss green', '#6b7f3a'], ['wet stone', '#6b6f6c'], ['lichen', '#b9c19a'], ['dark earth', '#3d3128'], ['fern', '#3f6b45']]),
  p('rose_garden', 'Rose garden', 'reds and pinks with deep green', ['cream', '#faf4ee'], [['rose red', '#c0304a'], ['pink rose', '#eb8fa8'], ['leaf green', '#3f7a4a'], ['thorn brown', '#5b4232'], ['cream rose', '#f7e6d6']]),
  p('electric_pastel', 'Electric pastel', 'soft colours turned up bright', ['white', '#fbfbff'], [['electric mint', '#7af5d0'], ['electric lilac', '#c79bff'], ['electric peach', '#ffb38a'], ['electric sky', '#8ad4ff'], ['electric lemon', '#f8ff8a']]),
  p('old_map', 'Old map', 'parchment, ink, faded sea', ['parchment', '#eadcb8'], [['map ink', '#3a2f24'], ['faded sea blue', '#8fb0b8'], ['land ochre', '#c9a465'], ['compass red', '#a54a3a'], ['forest ink', '#5d6b45']]),
  p('rainbow_bright', 'Rainbow bright', 'every hue, all saturated', ['white', '#ffffff'], [['red', '#e63946'], ['orange', '#f77f00'], ['yellow', '#fcbf49'], ['green', '#2a9d8f'], ['blue', '#3a6ea5'], ['violet', '#7b3fa0']]),
  p('grey_dawn', 'Grey dawn', 'muted, almost colourless', ['pale grey', '#efefed'], [['dawn grey', '#a9aaa6'], ['cool grey', '#7a7f85'], ['faint blue', '#c3cdd6'], ['faint rose', '#d9c6c2'], ['dark grey', '#45474b']]),
  p('saffron_and_indigo', 'Saffron and indigo', 'spice colours, strong contrast', ['ivory', '#f6efdf'], [['saffron', '#f2a51e'], ['indigo', '#2d3a8c'], ['chilli red', '#c32d1e'], ['turmeric', '#e0c341'], ['deep brown', '#4a2f1f']]),
  p('sea_glass', 'Sea glass', 'worn, translucent greens and blues', ['sand white', '#f5f2ea'], [['sea glass green', '#9fd3c0'], ['glass blue', '#8fbfd8'], ['frosted white', '#e8efec'], ['driftwood', '#b8a58c'], ['deep teal', '#2f7c78']]),
  p('warm_neutrals', 'Warm neutrals', 'beige, taupe, soft brown', ['ivory', '#f7f2ea'], [['taupe', '#a89685'], ['camel', '#c3a072'], ['mocha', '#6e5241'], ['oatmeal', '#e5dbc8'], ['soft black', '#2f2a26']]),
  p('carnival_night', 'Carnival night', 'bright colours against dark', ['deep navy', '#0f1b33'], [['carnival orange', '#ff8c1a'], ['magenta', '#e91e8c'], ['lime green', '#a6f22c'], ['gold', '#f5c542'], ['sky cyan', '#33c9ff']]),
  p('frozen_lake', 'Frozen lake', 'white, blue and a hint of pink', ['white', '#f9fbfc'], [['lake ice', '#cfe3ee'], ['deep ice', '#7fa8c4'], ['winter pink', '#eac4cf'], ['bare tree', '#6b6360'], ['cold shadow', '#3f5872']]),
  p('citrus', 'Citrus', 'orange, lemon, lime: zesty', ['white', '#fffef7'], [['orange peel', '#ff8c00'], ['lemon', '#ffe135'], ['lime', '#8fd400'], ['grapefruit', '#ff6b6b'], ['leaf', '#2e7d32']]),
  p('velvet_night_sky', 'Velvet night sky', 'stars over dark blue', ['deep blue black', '#0b1026'], [['star white', '#f6f4ea'], ['night blue', '#1e2d6b'], ['moon gold', '#e8c872'], ['nebula violet', '#6d4fa3'], ['horizon teal', '#2a6b78']]),
  p('terracotta_and_teal', 'Terracotta and teal', 'warm clay against cool teal', ['cream', '#f5efe4'], [['terracotta', '#c66a45'], ['teal', '#2b7a78'], ['sand', '#e6d2b0'], ['dark teal', '#17494a'], ['warm white', '#faf5ee']]),
  p('watercolour_sketchbook', 'Watercolour sketchbook', 'light washes, lots of white paper', ['cold press white', '#fbfaf6'], [['wash blue', '#7fa7d1'], ['wash green', '#8db888'], ['wash rose', '#e7a3a6'], ['wash ochre', '#dcb56a'], ['ink grey', '#5a5f66']]),
  p('graffiti_wall', 'Graffiti wall', 'spray paint on concrete', ['concrete grey', '#b9b6b0'], [['spray red', '#e5322d'], ['spray blue', '#2f6fe0'], ['spray yellow', '#f5d000'], ['spray white', '#f7f7f7'], ['spray black', '#161616']]),
  p('dusty_pink_and_sage', 'Dusty pink and sage', 'soft, modern, calm', ['warm white', '#f8f4f0'], [['dusty pink', '#d8a7a0'], ['sage', '#9caf88'], ['clay', '#b5836a'], ['cream', '#efe6d9'], ['charcoal', '#3d3b3a']]),
  p('fireworks', 'Fireworks', 'bursts of colour on black', ['night black', '#0a0a12'], [['firework red', '#ff3b3b'], ['firework gold', '#ffcf40'], ['firework green', '#4dff91'], ['firework blue', '#4d9fff'], ['firework pink', '#ff66c4'], ['smoke grey', '#5a5a66']]),
  p('koi_pond', 'Koi pond', 'orange fish, green water', ['pale green white', '#f2f6ee'], [['koi orange', '#f26b1d'], ['pond green', '#4e7d5b'], ['lily pink', '#e8a0b4'], ['dark water', '#22443f'], ['koi white', '#f7f3ea']]),
  p('chalk_on_slate', 'Chalk on slate', 'pale chalk marks on dark board', ['slate black', '#2b2f33'], [['chalk white', '#eeeeea'], ['chalk pink', '#e9b7c0'], ['chalk blue', '#9fc3dd'], ['chalk yellow', '#efe0a0'], ['chalk green', '#a9d4b0']]),
  p('sun_bleached', 'Sun-bleached', 'faded by years of sun', ['bleached white', '#f7f4ee'], [['faded red', '#d68e82'], ['faded blue', '#9db7c6'], ['faded yellow', '#e9d79a'], ['faded green', '#a9bfa2'], ['pale driftwood', '#c9bba5']]),
  p('plum_and_mustard', 'Plum and mustard', 'moody with a warm accent', ['cream', '#f4eee2'], [['plum', '#5c2a4a'], ['mustard', '#d3a12a'], ['dusty mauve', '#a67b93'], ['dark olive', '#4f5a2f'], ['bone', '#e9e0cf']]),
];

export const PALETTE_BY_ID: Record<string, Palette> = Object.fromEntries(PALETTES.map((x) => [x.id, x]));

export function paletteChoiceCriteria(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const pal of PALETTES) {
    out[pal.id] = `${pal.name}: ${pal.mood}. Colours: ${pal.colors.map((c) => c.name).join(', ')}; on ${pal.paperName} paper.`;
  }
  return out;
}
