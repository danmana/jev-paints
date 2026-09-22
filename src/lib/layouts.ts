import type { Box, Layout, Phase, Region } from './types';

const r = (id: string, name: string, description: string, box: Box): Region => ({ id, name, description, box });
const ph = (layer: string, description: string, share: number): Phase => ({ layer, description, share });

const FULL: Box = [0, 0, 1, 1];

/**
 * Composition templates. Regions are generic (sky, ground, subject...) so any prompt fits;
 * phases are the plan the program walks through while Jev paints. Jev may still paint anywhere
 * in any phase: the phase is told to Jev as state, never enforced.
 */
export const LAYOUTS: Layout[] = [
  {
    id: 'centered_subject',
    name: 'Centred subject',
    description: 'one main subject in the middle of the canvas with the background all around it',
    regions: [
      r('background', 'background', 'the whole canvas behind everything', FULL),
      r('subject', 'main subject', 'the middle of the canvas where the subject sits', [0.25, 0.2, 0.75, 0.8]),
      r('halo', 'around the subject', 'the ring of space just around the subject', [0.12, 0.08, 0.88, 0.92]),
      r('top_edge', 'top edge', 'the strip along the top', [0, 0, 1, 0.18]),
      r('bottom_edge', 'bottom edge', 'the strip along the bottom', [0, 0.82, 1, 1]),
    ],
    phases: [
      ph('background', 'the ground the subject will sit on', 0.25),
      ph('main subject', 'the main subject itself', 0.4),
      ph('details', 'smaller shapes and details on and around the subject', 0.25),
      ph('accents', 'final touches, highlights and outlines', 0.1),
    ],
  },
  {
    id: 'landscape_low_horizon',
    name: 'Landscape, low horizon',
    description: 'a wide view with a big sky over a narrower band of ground',
    regions: [
      r('sky', 'sky', 'the upper part of the canvas, above the horizon', [0, 0, 1, 0.62]),
      r('horizon', 'horizon band', 'the thin band where sky meets ground', [0, 0.56, 1, 0.68]),
      r('distance', 'far distance', 'the far ground just below the horizon', [0, 0.62, 1, 0.78]),
      r('ground', 'ground', 'the land in the lower part of the canvas', [0, 0.62, 1, 1]),
      r('foreground', 'foreground', 'the nearest ground at the very bottom', [0, 0.82, 1, 1]),
      r('focal', 'focal point', 'a spot slightly left of centre on the horizon for a main element', [0.25, 0.3, 0.6, 0.8]),
    ],
    phases: [
      ph('sky', 'the sky', 0.25),
      ph('ground', 'the land below the horizon', 0.25),
      ph('horizon and distance', 'the horizon line and far shapes', 0.15),
      ph('main subject', 'the main element of the scene', 0.2),
      ph('details', 'small shapes, textures and highlights', 0.15),
    ],
  },
  {
    id: 'landscape_high_horizon',
    name: 'Landscape, high horizon',
    description: 'a thin strip of sky over a large expanse of ground or water',
    regions: [
      r('sky', 'sky', 'the narrow strip at the top', [0, 0, 1, 0.3]),
      r('horizon', 'horizon band', 'where the sky meets the ground', [0, 0.25, 1, 0.36]),
      r('ground', 'ground', 'the large lower area', [0, 0.3, 1, 1]),
      r('foreground', 'foreground', 'the nearest part at the bottom', [0, 0.7, 1, 1]),
      r('focal', 'focal point', 'the area a little above centre for a main element', [0.3, 0.2, 0.7, 0.65]),
    ],
    phases: [
      ph('sky', 'the strip of sky', 0.15),
      ph('ground', 'the wide ground', 0.3),
      ph('horizon', 'the horizon', 0.1),
      ph('main subject', 'the main element', 0.25),
      ph('details', 'textures, small shapes, highlights', 0.2),
    ],
  },
  {
    id: 'portrait_bust',
    name: 'Portrait bust',
    description: 'a head and shoulders filling the canvas: a tall oval head in the upper middle over a wide mound of shoulders, background behind',
    regions: [
      r('background', 'background', 'everything behind the figure', FULL),
      r('shoulders', 'shoulders and torso', 'the wide mound across the lower third where the shoulders and chest sit', [0.05, 0.62, 0.95, 1]),
      r('neck', 'neck', 'the narrow strip joining the head to the shoulders', [0.42, 0.52, 0.58, 0.68]),
      r('head', 'head', 'the tall oval of the head in the upper middle', [0.32, 0.1, 0.68, 0.58]),
      r('hair', 'hair or top of the head', 'the top of the head and just above it', [0.26, 0.04, 0.74, 0.32]),
      r('eyes', 'eyes', 'the narrow band across the middle of the head where the eyes are', [0.37, 0.28, 0.63, 0.36]),
      r('mouth', 'mouth and chin', 'the small area low on the head where the mouth and chin are', [0.42, 0.42, 0.58, 0.54]),
      r('left_side', 'left of the figure', 'the background to the left of the head', [0, 0.05, 0.3, 0.62]),
      r('right_side', 'right of the figure', 'the background to the right of the head', [0.7, 0.05, 1, 0.62]),
    ],
    phases: [
      ph('background', 'the background behind the figure', 0.2),
      ph('shoulders', 'the mass of the shoulders and torso', 0.15),
      ph('head', 'the solid shape of the head, then the hair', 0.3),
      ph('face', 'eyes, mouth and other features of the face', 0.25),
      ph('accents', 'final highlights and outlines', 0.1),
    ],
  },
  {
    id: 'all_over_pattern',
    name: 'All-over pattern',
    description: 'no single subject: marks spread evenly across the whole canvas',
    regions: [
      r('canvas', 'whole canvas', 'the entire surface', FULL),
      r('top_left', 'top-left quarter', 'the upper left quarter', [0, 0, 0.5, 0.5]),
      r('top_right', 'top-right quarter', 'the upper right quarter', [0.5, 0, 1, 0.5]),
      r('bottom_left', 'bottom-left quarter', 'the lower left quarter', [0, 0.5, 0.5, 1]),
      r('bottom_right', 'bottom-right quarter', 'the lower right quarter', [0.5, 0.5, 1, 1]),
      r('center', 'centre', 'the middle of the canvas', [0.3, 0.3, 0.7, 0.7]),
    ],
    phases: [
      ph('base layer', 'the first layer of marks over the surface', 0.3),
      ph('second layer', 'a second layer on top', 0.3),
      ph('third layer', 'a third layer', 0.25),
      ph('accents', 'final small accents', 0.15),
    ],
  },
  {
    id: 'diagonal_split',
    name: 'Diagonal split',
    description: 'the canvas divided along a diagonal into two contrasting halves',
    regions: [
      r('upper_left', 'upper-left half', 'the triangle above the diagonal', [0, 0, 0.75, 0.75]),
      r('lower_right', 'lower-right half', 'the triangle below the diagonal', [0.25, 0.25, 1, 1]),
      r('diagonal', 'the diagonal band', 'the band running from top-left to bottom-right', [0.1, 0.1, 0.9, 0.9]),
      r('top_right_corner', 'top-right corner', 'the far corner above the diagonal', [0.6, 0, 1, 0.4]),
      r('bottom_left_corner', 'bottom-left corner', 'the far corner below the diagonal', [0, 0.6, 0.4, 1]),
    ],
    phases: [
      ph('first half', 'the upper-left half', 0.3),
      ph('second half', 'the lower-right half', 0.3),
      ph('the divide', 'the diagonal where the halves meet', 0.2),
      ph('accents', 'final touches', 0.2),
    ],
  },
  {
    id: 'subject_left',
    name: 'Subject on the left third',
    description: 'the main subject stands in the left third, open space to the right',
    regions: [
      r('background', 'background', 'the whole canvas behind everything', FULL),
      r('subject', 'main subject', 'the left third where the subject stands', [0.05, 0.12, 0.42, 0.88]),
      r('open_space', 'open space', 'the right two thirds', [0.42, 0, 1, 1]),
      r('ground', 'ground', 'the strip along the bottom', [0, 0.76, 1, 1]),
      r('top', 'upper area', 'the upper part of the canvas', [0, 0, 1, 0.35]),
    ],
    phases: [
      ph('background', 'the background', 0.3),
      ph('main subject', 'the subject on the left', 0.35),
      ph('open space', 'the space on the right', 0.15),
      ph('details', 'details and accents', 0.2),
    ],
  },
  {
    id: 'subject_right',
    name: 'Subject on the right third',
    description: 'the main subject stands in the right third, open space to the left',
    regions: [
      r('background', 'background', 'the whole canvas behind everything', FULL),
      r('subject', 'main subject', 'the right third where the subject stands', [0.58, 0.12, 0.95, 0.88]),
      r('open_space', 'open space', 'the left two thirds', [0, 0, 0.58, 1]),
      r('ground', 'ground', 'the strip along the bottom', [0, 0.76, 1, 1]),
      r('top', 'upper area', 'the upper part of the canvas', [0, 0, 1, 0.35]),
    ],
    phases: [
      ph('background', 'the background', 0.3),
      ph('main subject', 'the subject on the right', 0.35),
      ph('open space', 'the space on the left', 0.15),
      ph('details', 'details and accents', 0.2),
    ],
  },
  {
    id: 'vertical_bands',
    name: 'Three vertical bands',
    description: 'the canvas split into left, middle and right columns',
    regions: [
      r('left', 'left column', 'the left third', [0, 0, 0.34, 1]),
      r('middle', 'middle column', 'the middle third', [0.33, 0, 0.67, 1]),
      r('right', 'right column', 'the right third', [0.66, 0, 1, 1]),
      r('canvas', 'whole canvas', 'all three columns together', FULL),
    ],
    phases: [
      ph('left column', 'the left band', 0.3),
      ph('middle column', 'the middle band', 0.3),
      ph('right column', 'the right band', 0.3),
      ph('accents', 'touches across the bands', 0.1),
    ],
  },
  {
    id: 'horizontal_bands',
    name: 'Three horizontal bands',
    description: 'the canvas split into top, middle and bottom bands',
    regions: [
      r('top', 'top band', 'the upper third', [0, 0, 1, 0.34]),
      r('middle', 'middle band', 'the middle third', [0, 0.33, 1, 0.67]),
      r('bottom', 'bottom band', 'the lower third', [0, 0.66, 1, 1]),
      r('canvas', 'whole canvas', 'all three bands together', FULL),
    ],
    phases: [
      ph('top band', 'the upper band', 0.3),
      ph('middle band', 'the middle band', 0.3),
      ph('bottom band', 'the lower band', 0.3),
      ph('accents', 'touches across the bands', 0.1),
    ],
  },
  {
    id: 'radial',
    name: 'Radial',
    description: 'everything organised around the centre in rings',
    regions: [
      r('outer', 'outer ring', 'the edges and corners of the canvas', FULL),
      r('inner', 'inner ring', 'the ring around the core', [0.18, 0.18, 0.82, 0.82]),
      r('core', 'core', 'the very centre', [0.36, 0.36, 0.64, 0.64]),
      r('top_half', 'upper half', 'the upper half of the canvas', [0, 0, 1, 0.5]),
      r('bottom_half', 'lower half', 'the lower half of the canvas', [0, 0.5, 1, 1]),
    ],
    phases: [
      ph('outer ring', 'the edges', 0.3),
      ph('inner ring', 'the ring around the centre', 0.3),
      ph('core', 'the centre', 0.25),
      ph('accents', 'final touches', 0.15),
    ],
  },
  {
    id: 'framed',
    name: 'Framed panel',
    description: 'a decorated border around an inner picture',
    regions: [
      r('frame', 'frame border', 'the border along all four edges', FULL),
      r('panel', 'inner panel', 'the picture area inside the border', [0.15, 0.15, 0.85, 0.85]),
      r('panel_subject', 'panel centre', 'the centre of the inner picture', [0.3, 0.3, 0.7, 0.7]),
      r('top_border', 'top border', 'the border strip along the top', [0, 0, 1, 0.15]),
      r('bottom_border', 'bottom border', 'the border strip along the bottom', [0, 0.85, 1, 1]),
    ],
    phases: [
      ph('frame', 'the border', 0.25),
      ph('panel background', 'the ground of the inner picture', 0.25),
      ph('panel subject', 'the subject inside the frame', 0.3),
      ph('details', 'ornament and details', 0.2),
    ],
  },
  {
    id: 'still_life',
    name: 'Still life on a table',
    description: 'objects on a table surface with a backdrop behind',
    regions: [
      r('backdrop', 'backdrop', 'the wall or cloth behind the table', [0, 0, 1, 0.6]),
      r('table', 'table surface', 'the table top in the lower part', [0, 0.58, 1, 1]),
      r('objects', 'objects', 'the zone where the objects stand', [0.15, 0.28, 0.85, 0.76]),
      r('shadows', 'shadows', 'the table just under the objects', [0.12, 0.66, 0.9, 0.84]),
      r('table_edge', 'table edge', 'the front edge of the table at the bottom', [0, 0.86, 1, 1]),
    ],
    phases: [
      ph('backdrop', 'the backdrop', 0.25),
      ph('table', 'the table surface', 0.15),
      ph('objects', 'the objects', 0.35),
      ph('shadows and details', 'shadows, highlights, small details', 0.25),
    ],
  },
  {
    id: 'seascape',
    name: 'Seascape',
    description: 'sky over water with a shoreline at the bottom',
    regions: [
      r('sky', 'sky', 'the upper part above the horizon', [0, 0, 1, 0.45]),
      r('horizon', 'horizon line', 'the thin line between sky and sea', [0, 0.41, 1, 0.5]),
      r('sea', 'sea', 'the water in the middle', [0, 0.45, 1, 0.85]),
      r('shore', 'shore', 'the strip of shore at the bottom', [0, 0.8, 1, 1]),
      r('focal', 'focal point', 'a spot on the water slightly right of centre', [0.45, 0.3, 0.8, 0.7]),
    ],
    phases: [
      ph('sky', 'the sky', 0.25),
      ph('sea', 'the water', 0.3),
      ph('shore', 'the shore', 0.15),
      ph('main subject', 'the main element on or over the water', 0.15),
      ph('details', 'waves, reflections, highlights', 0.15),
    ],
  },
  {
    id: 'birds_eye',
    name: "Bird's-eye view",
    description: 'looking straight down: no horizon, shapes spread over a ground plane',
    regions: [
      r('ground', 'ground plane', 'the whole surface seen from above', FULL),
      r('center_cluster', 'central cluster', 'the group of shapes in the middle', [0.25, 0.25, 0.75, 0.75]),
      r('path', 'path band', 'a band crossing the canvas', [0, 0.4, 1, 0.6]),
      r('upper_area', 'upper area', 'the top part', [0, 0, 1, 0.4]),
      r('lower_area', 'lower area', 'the bottom part', [0, 0.6, 1, 1]),
    ],
    phases: [
      ph('ground', 'the ground plane', 0.35),
      ph('large shapes', 'the big shapes seen from above', 0.3),
      ph('small shapes', 'smaller shapes', 0.2),
      ph('accents', 'final marks', 0.15),
    ],
  },
  {
    id: 'night_sky',
    name: 'Night sky over silhouette',
    description: 'a large dark sky above a low silhouette of land or buildings',
    regions: [
      r('sky', 'sky', 'the large upper area', [0, 0, 1, 0.75]),
      r('moon_area', 'moon area', 'the upper right where a moon or light source may sit', [0.55, 0.08, 0.88, 0.4]),
      r('silhouette', 'silhouette', 'the dark shapes along the bottom', [0, 0.68, 1, 1]),
      r('skyline', 'skyline edge', 'where the silhouette meets the sky', [0, 0.62, 1, 0.78]),
      r('lights', 'lights', 'the lower band where windows or lights would glow', [0, 0.72, 1, 0.95]),
    ],
    phases: [
      ph('sky', 'the night sky', 0.35),
      ph('silhouette', 'the land or buildings', 0.2),
      ph('lights and stars', 'stars, moon, glowing lights', 0.25),
      ph('details', 'final details', 0.2),
    ],
  },
];

export const LAYOUT_BY_ID: Record<string, Layout> = Object.fromEntries(LAYOUTS.map((x) => [x.id, x]));

export function layoutChoiceCriteria(): Record<string, string> {
  return Object.fromEntries(
    LAYOUTS.map((l) => [l.id, `${l.name}: ${l.description}. Regions: ${l.regions.map((x) => x.name).join(', ')}. Painted in this order: ${l.phases.map((x) => x.layer).join(', ')}.`]),
  );
}
