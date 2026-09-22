import type { StyleDef } from './types';

const s = (id: string, name: string, description: string): StyleDef => ({ id, name, description });

/** Painters and movements Jev can lean on. Descriptions say what the work looks like, not how to make it. */
export const STYLES: StyleDef[] = [
  s('van_gogh', 'Vincent van Gogh', 'thick swirling strokes, vibrating colour, skies and fields full of movement'),
  s('monet', 'Claude Monet', 'impressionist light, soft broken colour, water, gardens, haze'),
  s('matisse', 'Henri Matisse', 'flat joyful colour, bold simple shapes, decorative patterns'),
  s('kandinsky', 'Wassily Kandinsky', 'abstract shapes and lines like music, circles and angles in bright colour'),
  s('rothko', 'Mark Rothko', 'large soft-edged fields of colour stacked on top of each other'),
  s('pollock', 'Jackson Pollock', 'energetic drips, splatters and tangled lines over the whole surface'),
  s('klimt', 'Gustav Klimt', 'gold, ornament, mosaic-like patterns around figures'),
  s('hokusai', 'Katsushika Hokusai', 'Japanese woodblock print: flat colour, clear outlines, stylised waves and mountains'),
  s('turner', 'J. M. W. Turner', 'storms and light dissolving into mist, warm glowing atmospheres'),
  s('cezanne', 'Paul Cézanne', 'patchy constructive strokes, forms built from planes of colour'),
  s('picasso_cubist', 'Pablo Picasso (cubism)', 'fragmented forms seen from several angles at once, muted colours'),
  s('miro', 'Joan Miró', 'playful floating shapes, thin black lines, primary colours on a calm ground'),
  s('basquiat', 'Jean-Michel Basquiat', 'raw graffiti energy, scribbled figures, crowns, words, rough marks'),
  s('hopper', 'Edward Hopper', 'quiet realist scenes, strong light and long shadows, empty spaces'),
  s('okeeffe', "Georgia O'Keeffe", 'enlarged flowers and desert forms, smooth gradients, soft edges'),
  s('af_klint', 'Hilma af Klint', 'spiritual diagrams, spirals, circles and pastel geometry'),
  s('munch', 'Edvard Munch', 'expressionist anxiety, wavy skies, elongated figures, strong colour'),
  s('klee', 'Paul Klee', 'childlike geometry, small coloured squares, delicate lines'),
  s('mondrian', 'Piet Mondrian', 'straight black lines and rectangles of primary colour on white'),
  s('twombly', 'Cy Twombly', 'scribbles, smears and scrawled marks on pale grounds'),
  s('frankenthaler', 'Helen Frankenthaler', 'soaked stains of colour, large soft shapes, lots of open canvas'),
  s('chagall', 'Marc Chagall', 'dreamlike floating figures, deep blues and reds, village memories'),
  s('gauguin', 'Paul Gauguin', 'flat areas of warm tropical colour, simplified figures'),
  s('seurat', 'Georges Seurat', 'pointillism: the whole picture built from small dots of colour'),
  s('schiele', 'Egon Schiele', 'angular nervous lines, sparse colour, raw figure drawing'),
  s('hundertwasser', 'Friedensreich Hundertwasser', 'spirals, irregular windows, bright patchwork colour'),
  s('kusama', 'Yayoi Kusama', 'obsessive polka dots and repeated patterns covering everything'),
  s('hockney', 'David Hockney', 'bright flat colour, pools, sunlit California, crisp shapes'),
  s('delaunay', 'Sonia Delaunay', 'rhythmic circles and arcs of contrasting colour'),
  s('agnes_martin', 'Agnes Martin', 'faint grids and horizontal lines, near-empty pale surfaces'),
  s('diebenkorn', 'Richard Diebenkorn', 'abstract landscapes of stacked planes, sun-washed colour'),
  s('joan_mitchell', 'Joan Mitchell', 'dense gestural abstraction, bursts of colour, drips'),
  s('kahlo', 'Frida Kahlo', 'folk-art clarity, symbolic objects, strong outlines, lush plants'),
  s('bacon', 'Francis Bacon', 'distorted figures in bare rooms, smeared paint, dark tension'),
  s('warhol', 'Andy Warhol (pop art)', 'flat printed colour, repetition, high contrast'),
  s('impressionism', 'Impressionism', 'quick visible strokes catching light and weather'),
  s('expressionism', 'Expressionism', 'distorted forms and exaggerated colour driven by feeling'),
  s('fauvism', 'Fauvism', 'wild, unnatural, intense colour in simple shapes'),
  s('abstract_expressionism', 'Abstract expressionism', 'large spontaneous gestures, no recognisable subject'),
  s('minimalism', 'Minimalism', 'very few elements, plain shapes, lots of empty space'),
  s('art_nouveau', 'Art Nouveau', 'flowing organic curves, floral ornament, elegant lines'),
  s('bauhaus', 'Bauhaus', 'geometric primary shapes, clean lines, functional colour'),
  s('ukiyo_e', 'Ukiyo-e', 'Japanese woodblock: flat colour areas, outlines, patterned water and clouds'),
  s('sumi_e', 'Sumi-e ink wash', 'black ink washes, few brushstrokes, empty space matters'),
  s('cave_painting', 'Cave painting', 'ochre and charcoal animals and hands on rough stone'),
  s('childrens_crayon', "Children's crayon drawing", 'naive shapes, bright waxy colour, a sun in the corner, houses and stick figures'),
  s('watercolour_sketch', 'Watercolour travel sketch', 'loose pen lines with light transparent washes, unfinished edges'),
  s('charcoal_drawing', 'Charcoal life drawing', 'smudged black and grey, strong contrasts, no colour'),
  s('street_art', 'Street art / graffiti', 'spray paint, stencils, bold lettering shapes, drips'),
  s('folk_art', 'Folk art', 'flat decorative motifs, symmetrical borders, cheerful colour'),
];

export const STYLE_BY_ID: Record<string, StyleDef> = Object.fromEntries(STYLES.map((x) => [x.id, x]));

export function styleChoiceCriteria(): Record<string, string> {
  return Object.fromEntries(STYLES.map((st) => [st.id, `${st.name}: ${st.description}`]));
}
