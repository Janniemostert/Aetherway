import { PAR } from './par.js';

// Map legend: o rune on a tile, _ rune with no tile, . hole, X iron block, # boulder,
// I frozen rune, S source, A altar, T beam launcher
// The 3-star move target for each level lives in par.js, written by tools/balance.mjs --write.

export const BOOKS = [
  {
    id: 'earth', name: 'Book of Earth',
    levels: [
      {
        name: 'First Spark', colors: 4, powers: [],
        tip: 'Drag a line through 3 or more touching runes of one colour, then let go. Clearing a rune also lifts the tile under it, and energy flows through the gap. Carve a channel to the altar.',
        map: [
          'oooooSoooooo', 'oooooooooooo', 'oooooooooooo', 'oooooooooooo',
          'oooooooooooo', 'oooooooooooo', 'oooooooooooo', 'oooooooooooo',
          'oooooooooooo', 'oooooooooooo', 'oooooooooooo', 'oooooooooooo',
          'oooooooooooo', 'oooooooooooo', 'oooooooooooo', 'ooooooAooooo',
        ],
      },
      {
        name: 'Deep Furrow', powers: ['spade'],
        tip: 'A chain of 5 or more ends in an explosion, and longer chains make bigger ones. Clearing leaf runes charges the spade, which removes any single tile.',
        map: [
          'Sooooooooooo', 'oooooooooooo', 'oooXXoooXXoo', 'oooXXoooXXoo',
          'oooooooooooo', 'oooooooooooo', 'XXooooXXoooo', 'XXooooXXoooo',
          'oooooooooooo', 'oooooooooooo', 'ooooXXooooXX', 'ooooXXooooXX',
          'oooooooooooo', 'oooooooooooo', 'oooooooooooo', 'oooooooooooA',
        ],
      },
      {
        name: 'Standing Stones', powers: ['spade', 'bomb'],
        tip: 'Boulders block energy and cannot be chained. Explosions crack them. Clearing ember runes charges the bomb.',
        map: [
          'ooooooSooooo', 'oooooooooooo', 'oooooooooooo', 'oo########oo',
          'oooooooooooo', 'oooooooooooo', 'oooooooooooo', 'oooooooooooo',
          '####oooo####', 'oooooooooooo', 'oooooooooooo', 'oooooooooooo',
          'oooooooooooo', 'ooo######ooo', 'oooooooooooo', 'AooooooooooA',
        ],
      },
      {
        name: 'Heartstone', powers: ['spade', 'bomb'],
        tip: 'Send energy into a launcher and it fires beams along its row and column. An explosion will set one off too.',
        map: [
          'SoooooXooooo', 'ooooooXooooo', 'ooooooXooooo', 'oooTooXooooo',
          'ooooooXoooAo', 'ooooooXooooo', 'ooooooXooooo', 'ooooooXooooo',
          'ooooooXXXXoo', 'oooooooooooo', 'oooooooooooo', 'XXXXoooooooo',
          'oooooooToooo', 'oooooooooooo', 'oooooooooooo', 'oooooooooooo',
        ],
      },
    ],
  },
  {
    id: 'water', name: 'Book of Water',
    levels: [
      {
        name: 'Frozen Stream', powers: ['spade', 'bomb', 'swap'],
        tip: 'Frozen runes stay in place until you chain them or blast them. Clearing droplet runes charges the swap, which trades two touching runes.',
        map: [
          'oooooSoooooo', 'oooooooooooo', 'ooIIoooIIooo', 'ooIIoooIIooo',
          'oooooooooooo', 'oooooooooooo', 'IIIIooooIIII', 'oooooooooooo',
          'oooooooooooo', 'ooIIIIIIIIoo', 'oooooooooooo', 'oooooooooooo',
          'ooooIIIIoooo', 'oooooooooooo', 'oooooooooooo', 'ooooooAooooo',
        ],
      },
      {
        name: 'The Weir', powers: ['spade', 'bomb', 'swap'],
        map: [
          'SoooXoooXooA', 'ooooXoooXooo', 'ooooXoooXooo', 'ooooXoooXooo',
          'ooooXoooXooo', 'ooooXoooXooo', 'ooooXoooXooo', 'ooooXoooXooo',
          'ooooXoooXooo', 'ooooXoooXooo', 'ooooIoooIooo', 'ooooIoooIooo',
          'ooooXoooXooo', 'ooooXoooXooo', 'ooooXoooXooo', 'ooooXoooXooo',
        ],
      },
      {
        name: 'Twin Rivers', powers: ['spade', 'bomb', 'swap'],
        map: [
          'AooooooooooA', 'oooooooooooo', 'ooIIooooIIoo', 'oXXXXooXXXXo',
          'oooooooooooo', 'oooooooooooo', 'ooooTooooooo', 'oooooooooooo',
          'oXXXXXoXXXXX', 'oooooooooooo', 'oooooooooooo', 'ooooooooTooo',
          'oooooooooooo', 'XXXXXoXXXXXo', 'oooooooooooo', 'oooooSoooooo',
        ],
      },
      {
        name: 'Sunken Gate', powers: ['spade', 'bomb', 'swap'],
        map: [
          'oooooAoooooo', 'oooooooooooo', 'XXXXX##XXXXX', 'oooooIIooooo',
          'oooooooooooo', 'oooooooooooo', 'XX##XXXX##XX', 'ooIIooooIIoo',
          'oooooooooooo', 'oooooooooooo', 'XXXXX##XXXXX', 'oooooIIooooo',
          'oooooooooooo', 'oooooooooooo', 'oooooooooooo', 'ooooooSooooo',
        ],
      },
    ],
  },
  {
    id: 'air', name: 'Book of Air',
    levels: [
      {
        name: 'Cloudsteps', powers: ['spade', 'bomb', 'swap', 'shuffle'],
        tip: 'Runes fall straight through gaps in the sky. Clearing wind runes charges the shuffle, which remixes the whole board.',
        map: [
          '...oooooAooo', '...ooooooooo', '...ooooooooo', '...ooooooooo',
          'oooooooo....', 'oooooooo....', 'oooooooo....', 'oooooooo....',
          '....oooooooo', '....oooooooo', '....oooooooo', '....oooooooo',
          'oooooooo....', 'oooooooo....', 'oooooooo....', 'Sooooooo....',
        ],
      },
      {
        name: 'Broken Sky', powers: ['spade', 'bomb', 'swap', 'shuffle'],
        map: [
          'Aooo....oooA', 'oooo....oooo', 'oooo....oooo', 'oooo....oooo',
          'oooooooooooo', 'oooooooooooo', '...oooooo...', '...oooooo...',
          '...oooToo...', '...oooooo...', 'oooooooooooo', 'oooooooooooo',
          'oooo....oooo', 'oooo....oooo', 'oooo....oooo', 'oooS....oooo',
        ],
      },
      {
        name: 'Spiral Updraft', powers: ['spade', 'bomb', 'swap', 'shuffle'],
        map: [
          'oooooooooooo', 'oooooooooooo', 'oo........oo', 'oo.oooooo.oo',
          'oo.oooooo.oo', 'oo.oo..oo.oo', 'oo.ooAooo.oo', 'oo.oo..oo.oo',
          'oo.oo.ooo.oo', 'oo.oo.ooo.oo', 'oo.oo.ooo.oo', 'oo.oooooo.oo',
          'oo.oooooo.oo', 'oo.ooo....oo', 'oooooooooooo', 'Sooooooooooo',
        ],
      },
      {
        name: 'Eye of the Storm', powers: ['spade', 'bomb', 'swap', 'shuffle'],
        map: [
          '...ooAooo...', '..oooooooo..', '.oooooooooo.', 'oooIIIIIIooo',
          'oooI####Iooo', 'oooI#oo#Iooo', 'oooI#oo#Iooo', 'oooI#oT#Iooo',
          'oooI#oo#Iooo', 'oooI#oo#Iooo', 'oooI####Iooo', 'oooIIIIIIooo',
          '.oooooooooo.', '..oooooooo..', '...oooooo...', '.....So.....',
        ],
      },
    ],
  },
  {
    id: 'fire', name: 'Book of Fire',
    levels: [
      {
        name: 'Cinder Road', powers: ['spade', 'bomb', 'swap', 'shuffle'],
        map: [
          'oooooAoooooo', 'oooooooooooo', '###oo##oo###', 'oooooooooooo',
          'oooooooooooo', 'ooTooooooToo', 'oooooooooooo', '##oo####oo##',
          'oooooooooooo', 'oooooooooooo', 'oToooooooooo', 'oooooooooooo',
          '###oo##oo###', 'oooooooooooo', 'oooooooooooo', 'ooooooSooooo',
        ],
      },
      {
        name: 'Ash Fields', powers: ['spade', 'bomb', 'swap', 'shuffle'],
        map: [
          'Aoo#oo#oo#oo', 'oo#oo#oo#ooo', 'o#oo#oo#oo#o', '#oo#oo#oo#oo',
          'oo#oo#oo#oo#', 'o#oo#oo#oo#o', '#oo#oo#oo#oo', 'oo#oo#oo#oo#',
          'o#oo#oo#oo#o', '#oo#oo#oo#oo', 'oo#oo#oo#oo#', 'o#oo#oo#oo#o',
          '#oo#oo#oo#oo', 'oo#oo#oo#oo#', 'o#oo#oo#oooo', 'oo#oo#oo#ooS',
        ],
      },
      {
        name: 'Forge Door', powers: ['spade', 'bomb', 'swap', 'shuffle'],
        map: [
          'oooooooooooo', 'oXXXXXXXXXXo', 'oXooooooooXo', 'oXoXXXXXXoXo',
          'oXoXooooXoXo', 'oXoXoAooXoXo', 'oXoXooooXoXo', 'oXoXX##XXoXo',
          'oXooooooooXo', 'oXXXXX##XXXo', 'oooooooooooo', 'oooooooooooo',
          'oooIIIIIIooo', 'oooooooooooo', 'oooooooooooo', 'Sooooooooooo',
        ],
      },
      {
        name: 'The Last Flame', powers: ['spade', 'bomb', 'swap', 'shuffle'],
        map: [
          'AoXooooooXoA', 'ooXoo##ooXoo', 'ooXooIIooXoo', '##XXXooXXX##',
          'oooooooooooo', 'ooTooooooToo', 'oooooooooooo', 'oooIIooIIooo',
          'XX###oo###XX', 'oooooooooooo', 'ooooToTooooo', 'oooooooooooo',
          '##XXXooXXX##', 'ooXooIIooXoo', 'ooXooooooXoo', 'AoXooSoooXoA',
        ],
      },
    ],
  },
];

export const LEVELS = BOOKS.flatMap((book, bookIndex) =>
  book.levels.map((level, levelIndex) => {
    const id = `${book.id}-${levelIndex + 1}`;
    return { ...level, id, index: levelIndex, bookIndex, par: PAR[id] ?? 20 };
  }),
);

export const timeLimit = (level) => Math.round(level.par * 9 + 40);

export function starsFor(level, moves) {
  if (moves <= level.par) return 3;
  if (moves <= Math.ceil(level.par * 1.5)) return 2;
  return 1;
}
