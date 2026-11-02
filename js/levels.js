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
      {
        name: 'Hollow Hill', powers: ['spade', 'bomb'],
        map: [
          'Sooooooooooo', 'oooooooooooo', 'oooooooooooo', 'oooooooooooo',
          'oooooooooooo', 'oooooooooooo', 'oooooooooooo', 'oooooooooooo',
          'oo########oo', 'oo#oooooo#oo', 'oo#oooooo#oo', 'oo#ooAooo#oo',
          'oo#oooooo#oo', 'oo#oooooo#oo', 'oo########oo', 'oooooooooooo',
        ],
      },
      {
        name: 'Mossy Steps', powers: ['spade', 'bomb'],
        map: [
          'ooSooooooooo', 'oooooooooooo', 'XXXXoooooooo', 'oooooooooooo',
          'oooooooooooo', 'ooooXXXXoooo', 'oooooooooooo', 'oooooooooooo',
          'ooooooooXXXX', 'oooooooooooo', 'oooooooooooo', 'ooooXXXXoooo',
          'oooooooooooo', 'oooooooooooo', 'XXXXoooooooo', 'oooooooooAoo',
        ],
      },
      {
        name: 'Root Cellar', powers: ['spade', 'bomb'],
        map: [
          'ooooooooooSo', 'oooooooooooo', 'oo##oooo##oo', 'oo##oooo##oo',
          'oooooooooooo', 'oooooooooooo', 'oooo####oooo', 'oooo####oooo',
          'oooooooooooo', 'oooooooooooo', 'oo##oooo##oo', 'oo##oooo##oo',
          'oooooooooooo', 'oooooooooooo', 'oooooooooooo', 'oAoooooooooo',
        ],
      },
      {
        name: 'Stone Circle', powers: ['spade', 'bomb'],
        map: [
          'Sooooooooooo', 'oooooooooooo', 'ooo##oo##ooo', 'oo#oooooo#oo',
          'o#oooooooo#o', 'o#oooToooo#o', 'oo#oooooo#oo', 'ooo##oo##ooo',
          'oooooooooooo', 'oooooooooooo', 'XXXXXXXXooXX', 'oooooooooooo',
          'oooooooooooo', 'ooToooooooTo', 'oooooooooooo', 'oooooooooAoo',
        ],
      },
      {
        name: "Giants' Table", powers: ['spade', 'bomb'],
        map: [
          'ooooooSooooo', 'oooooooooooo', '############', 'oooooooooooo',
          'oooooooooooo', '############', 'oooooooooooo', 'oooooooooooo',
          '############', 'oooooooooooo', 'oooooooooooo', '############',
          'oooooooooooo', 'oooooooooooo', 'oooooooooooo', 'ooooooAooooo',
        ],
      },
      {
        name: 'Two Wells', powers: ['spade', 'bomb'],
        map: [
          'oooooSoooooo', 'oooooooooooo', 'oooooooooooo', 'ooXXXXXXXXoo',
          'oooooooooooo', 'oooooooooooo', 'oooooooooooo', 'XXXXooooXXXX',
          'oooooooooooo', 'oooooooooooo', 'oooooooooooo', 'ooXXXXXXXXoo',
          'oooooooooooo', 'oooooooooooo', 'oooooooooooo', 'AooooooooooA',
        ],
      },
      {
        name: 'Buried Road', powers: ['spade', 'bomb'],
        map: [
          'ooooooooSooo', 'oooooooooooo', 'oooooooooooo', 'XX####XXXXXX',
          'oooooooooooo', 'oooooooooooo', 'oooooooooooo', 'XXXXXX####XX',
          'oooooooooooo', 'oooooooooooo', 'oooooooooooo', 'XX####XXXXXX',
          'oooooooooooo', 'oooooooooooo', 'oooooooooooo', 'ooooooAooooo',
        ],
      },
      {
        name: 'Badger Run', powers: ['spade', 'bomb'],
        map: [
          'Sooooooooooo', 'oooooooooooo', 'XXXXXXXXoooo', 'oooooooooooo',
          'oooooooooooo', 'oooooooooooo', 'ooooXXXXXXXX', 'oooooooooooo',
          'oooooooooooo', 'oooooooooooo', 'XXXXXXXXoooo', 'oooooooooooo',
          'oooooooooooo', 'oooooooooooo', 'oooooooooooo', 'Aooooooooooo',
        ],
      },
      {
        name: 'Three Cairns', powers: ['spade', 'bomb'],
        map: [
          'oooooSoooooo', 'oooooooooooo', 'oo##oooo##oo', 'oo##oooo##oo',
          'oooooooooooo', 'XXXXooooXXXX', 'Aooo####oooA', 'oooo####oooo',
          'oooooooooooo', 'XXooooooooXX', 'oooooooooooo', 'ooo##oo##ooo',
          'oooooooooooo', 'ooooXXXXoooo', 'oooooooooooo', 'oooooAoooooo',
        ],
      },
      {
        name: 'Old Mine', powers: ['spade', 'bomb'],
        map: [
          'SooXoooooooo', 'oooXoooooooo', 'oooXoooXoooo', 'oooXoooXoooo',
          'oooXoooXoooo', 'oooXoooXoooo', 'oooXoooXoooo', 'oooXoooXoooo',
          'oooXoooXoooo', 'oooXoooXoooo', 'oooXoooXoooo', 'oooXoooXoooo',
          'oooXoooXoooo', 'oooooooXoooo', 'oooooooXoooo', 'oooooooXoooA',
        ],
      },
      {
        name: 'Heart of the Mountain', powers: ['spade', 'bomb'],
        map: [
          'AooXooSooXoA', 'oooXoooooXoo', 'oooXX##XXXoo', 'oooooooooooo',
          'ooToooooooTo', 'oooooooooooo', 'XX###oo###XX', 'oooooooooooo',
          'oooooooooooo', 'ooXXX##XXXoo', 'ooXooooooXoo', 'ooXooAoooXoo',
          'ooXooooooXoo', 'ooXXXXXXXXoo', 'oooooooooooo', 'AooooooooooA',
        ],
      },
      {
        name: 'Orchard Rows', powers: ['spade', 'bomb'],
        map: [
          'SoXoooooXooo', 'ooXoooooXooo', 'ooXooXooXooo', 'ooXooXooXooo',
          'ooXooXooXooo', 'ooXooXooXooo', 'ooXooXooXooo', 'ooXooXooXooo',
          'ooXooXooXooo', 'ooXooXooXooo', 'ooXooXooXooo', 'ooXooXooXooo',
          'ooXooXooXooo', 'oooooXoooooo', 'oooooXoooooo', 'oooooXoooAoo',
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
        name: 'Ice Shelf', powers: ['spade', 'bomb', 'swap'],
        map: [
          'ooooSooooooo', 'oooooooooooo', 'IIIIIIIIoooo', 'oooooooooooo',
          'oooooooooooo', 'ooooIIIIIIII', 'oooooooooooo', 'oooooooooooo',
          'IIIIIIIIoooo', 'oooooooooooo', 'oooooooooooo', 'ooooIIIIIIII',
          'oooooooooooo', 'oooooooooooo', 'oooooooooooo', 'ooooooooAooo',
        ],
      },
      {
        name: 'Ice Road', powers: ['spade', 'bomb', 'swap'],
        map: [
          'SooooIIIIooo', 'ooooooIIIIoo', 'oooooooIIIIo', '###ooooooIII',
          'oooooooooooo', 'IIIoooooo###', 'oIIIIooooooo', 'ooIIIIoooooo',
          'oooIIIIooooo', '####ooooo###', 'oooooooooooo', 'oooooIIIIooo',
          'ooooooIIIIoo', '###ooooooIII', 'oooooooooooo', 'oooooooooooA',
        ],
      },
      {
        name: 'Whirlpools', powers: ['spade', 'bomb', 'swap'],
        map: [
          'ooooooooSooo', 'oooooooooooo', 'oo..oooo..oo', 'oo..oooo..oo',
          'oooooooooooo', 'oooo....oooo', 'oooo....oooo', 'oooooooooooo',
          '..oooooooo..', '..oooooooo..', 'oooooooooooo', 'oooo....oooo',
          'oooo....oooo', 'oooooooooooo', 'oooooooooooo', 'ooAooooooooo',
        ],
      },
      {
        name: "Leviathan's Gate", powers: ['spade', 'bomb', 'swap'],
        map: [
          'AooXXooXXooA', 'oooXXooXXooo', 'oooX####Xooo', 'oooIIIIIIooo',
          'XX##XXXX##XX', 'oooooooooooo', 'ooTooooooToo', 'oooooooooooo',
          'XXXIIXXIIXXX', 'oooooooooooo', '..oooooooo..', '..ooIIIIoo..',
          'XX##XXXX##XX', 'oooooooooooo', 'oooooooooooo', 'oooooSoooooo',
        ],
      },
      {
        name: 'Black Tide', powers: ['spade', 'bomb', 'swap'],
        map: [
          'SooXoooooXoo', 'oooXoooooXoo', 'oooXooXooXoo', 'oooXooXooXoo',
          'oooXooXooXoo', 'oooXooXooXoo', 'oooXooXooXoo', 'oooXooXooXoo',
          'oooXooXooXoo', 'oooXoooooXoo', 'oooXoooooXoo', 'oooXoooooXoo',
          'oooXoooooXoo', 'oooIoooooIoo', 'oooIoooooIoo', 'oooXoooooXoA',
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
        name: 'Canal Locks', powers: ['spade', 'bomb', 'swap'],
        map: [
          'SoooXoooXooo', 'ooooXoooXooo', 'ooooXoooXooo', 'ooooXoooXooo',
          'ooooIoooXooo', 'ooooXoooXooo', 'ooooXoooXooo', 'ooooXoooXooo',
          'ooooXoooXooo', 'ooooXoooXooo', 'ooooXoooXooo', 'ooooXoooIooo',
          'ooooXoooXooo', 'ooooXoooXooo', 'ooooXoooXooo', 'ooooXoooXooA',
        ],
      },
      {
        name: 'Two Streams', powers: ['spade', 'bomb', 'swap'],
        map: [
          'oooooSoooooo', 'oooooooooooo', 'oooooXXooooo', 'oooooXXooooo',
          'oooooXXooooo', 'IIIIoXXoIIII', 'oooooXXooooo', 'oooooXXooooo',
          'oooooXXooooo', 'oooooXXooooo', 'IIIIoXXoIIII', 'oooooXXooooo',
          'oooooXXooooo', 'oooooXXooooo', 'oooooXXooooo', 'AooooXXooooA',
        ],
      },
      {
        name: 'Reservoir', powers: ['spade', 'bomb', 'swap'],
        map: [
          'ooooooooooSo', 'oooooooooooo', 'oooooooooooo', '........oooo',
          'oooooooooooo', 'oooooooooooo', 'oooooooooooo', 'oooo........',
          'oooooooooooo', 'oooooooooooo', 'oooooooooooo', '........oooo',
          'oooooooooooo', 'oooooooooooo', 'oooooooooooo', 'ooAooooooooo',
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
        name: 'Flood Gate', powers: ['spade', 'bomb', 'swap'],
        map: [
          'ooooSooooooo', 'oooooooooooo', 'XXXXXXXXIIXX', 'oooooooooooo',
          'ooTooooooooo', 'oooooooooooo', 'XXIIXXXXXXXX', 'oooooooooooo',
          'oooooooooToo', 'oooooooooooo', 'XXXXXXXXIIXX', 'oooooooooooo',
          'ooTooooooooo', 'oooooooooooo', 'XXIIXXXXXXXX', 'oooooooooAoo',
        ],
      },
      {
        name: 'Cold Harbour', powers: ['spade', 'bomb', 'swap'],
        map: [
          'Sooooooooooo', 'oooooooooooo', 'ooIIIIIIIIoo', 'ooIooooooIoo',
          'ooIoXXXXoIoo', 'ooIoXAoXoIoo', 'ooIoXooXoIoo', 'ooIoX##XoIoo',
          'ooIooooooIoo', 'ooIIIIIIIIoo', 'oooooooooooo', 'oooooooooooo',
          'XXXX####XXXX', 'oooooooooooo', 'oooooooooooo', 'oooooooooooA',
        ],
      },
      {
        name: 'Twin Locks', powers: ['spade', 'bomb', 'swap'],
        map: [
          'AoooXooXoooA', 'ooooXooXoooo', 'ooooXooXoooo', 'XX##XooXXX##',
          'oooooooooooo', 'oooIIIIIIooo', 'oooooooooooo', 'XXXXXooXXXXX',
          'oooooooooooo', 'ooIIoooooIIo', 'oooooooooooo', 'XXXooXXooXXX',
          'oooooooooooo', 'ooToooooooTo', 'oooooooooooo', 'oooooSoooooo',
        ],
      },
      {
        name: 'Drowned Hall', powers: ['spade', 'bomb', 'swap'],
        map: [
          'ooooooSooooo', 'XXXoXXXXoXXX', 'oooooooooooo', 'oooooooooooo',
          'XoXXXXXXXXoX', 'oooooooooooo', 'oooooooooooo', 'XXXXXooXXXXX',
          'oooooooooooo', 'oooooooooooo', 'XoXXXXXXXXoX', 'oooooooooooo',
          'oooooooooooo', 'XXXoXXXXoXXX', 'oooooooooooo', 'ooooooAooooo',
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
        name: 'Eye of the Storm', powers: ['spade', 'bomb', 'swap', 'shuffle'],
        map: [
          '...ooAooo...', '..oooooooo..', '.oooooooooo.', 'oooIIIIIIooo',
          'oooI####Iooo', 'oooI#oo#Iooo', 'oooI#oo#Iooo', 'oooI#oT#Iooo',
          'oooI#oo#Iooo', 'oooI#oo#Iooo', 'oooI####Iooo', 'oooIIIIIIooo',
          '.oooooooooo.', '..oooooooo..', '...oooooo...', '.....So.....',
        ],
      },
      {
        name: 'Zephyr Gate', powers: ['spade', 'bomb', 'swap', 'shuffle'],
        map: [
          'oooooAoooooo', 'oooooooooooo', '.....oo.....', '.....oo.....',
          'oooooooooooo', 'ooTooooooToo', 'oooooooooooo', '..oo....oo..',
          '..oo....oo..', 'oooooooooooo', 'oooooToooooo', 'oooooooooooo',
          '....oooo....', '....oooo....', 'oooooooooooo', 'oooooSoooooo',
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
        name: 'Gale Front', powers: ['spade', 'bomb', 'swap', 'shuffle'],
        map: [
          'Soooooo..ooo', 'oooooo..oooo', 'ooooo..ooooo', 'oooo..oooooo',
          'oooooooooooo', 'oo..oooooooo', 'o..ooooooooo', '..oooooo..oo',
          'oooooo..oooo', 'ooooo..ooooo', 'oooo..oooooo', 'ooo..ooooooo',
          'oooooooooooo', 'o..ooooooooo', '..ooooooo..o', 'oooooooo..oA',
        ],
      },
      {
        name: 'Cloud Ladder', powers: ['spade', 'bomb', 'swap', 'shuffle'],
        map: [
          'Sooo....oooo', 'oooo....oooo', 'oooooooooooo', 'oooo....oooo',
          'oooo....oooo', 'oooo....oooo', 'oooooooooooo', 'oooo....oooo',
          'oooo....oooo', 'oooo....oooo', 'oooooooooooo', 'oooo....oooo',
          'oooo....oooo', 'oooo....oooo', 'oooooooooooo', 'oooo....oooA',
        ],
      },
      {
        name: 'Sky Bridge', powers: ['spade', 'bomb', 'swap', 'shuffle'],
        map: [
          '.....So.....', '....oooo....', '...oooooo...', '..ooo..ooo..',
          '.ooo....ooo.', 'ooo......ooo', 'ooo......ooo', 'ooo..oo..ooo',
          'oooooooooooo', 'ooo..oo..ooo', 'ooo......ooo', 'ooo......ooo',
          '.ooo....ooo.', '..ooo..ooo..', '...oooooo...', '....oAAo....',
        ],
      },
      {
        name: 'Storm Wall', powers: ['spade', 'bomb', 'swap', 'shuffle'],
        map: [
          'Aoo......ooA', 'ooo......ooo', '###......###', 'ooo......ooo',
          'oooooooooooo', 'ooooo##ooooo', 'oooo####oooo', 'ooo##TT##ooo',
          'oooo####oooo', 'ooooo##ooooo', 'oooooooooooo', '...oooooo...',
          '...oooooo...', '....oooo....', '....oooo....', '.....So.....',
        ],
      },
      {
        name: 'Hailstones', powers: ['spade', 'bomb', 'swap', 'shuffle'],
        map: [
          'Sooo.oooo.oo', 'oooo.oooo.oo', '##oo.##oo.##', 'oooooooooooo',
          'oo.oooo.oooo', 'oo.oooo.oooo', 'oo.##oo.##oo', 'oooooooooooo',
          'oooo.oooo.oo', 'oooo.oooo.oo', '##oo.##oo.##', 'oooooooooooo',
          'oo.oooo.oooo', 'oo.oooo.oooo', 'oo.oooo.oooo', 'oo.oooo.oooA',
        ],
      },
      {
        name: 'Wind Tunnel', powers: ['spade', 'bomb', 'swap', 'shuffle'],
        map: [
          'ooooooSooooo', 'oooooooooooo', 'XXXXXXXXoooo', '........oooo',
          'oooooooooooo', 'oooooooooooo', 'ooooXXXXXXXX', 'oooo........',
          'oooooooooooo', 'oooooooooooo', 'XXXXXXXXoooo', '........oooo',
          'oooooooooooo', 'oooooooooooo', 'oooooooooooo', 'Aooooooooooo',
        ],
      },
      {
        name: 'Crown of Heaven', powers: ['spade', 'bomb', 'swap', 'shuffle'],
        map: [
          'A..oooooo..A', 'oo.oo##oo.oo', 'oo.oo##oo.oo', 'oooooooooooo',
          '..oo.oo.oo..', '..oo.oo.oo..', 'oooooToooooo', 'oo..oooo..oo',
          'oo..#AA#..oo', 'oo..####..oo', 'oooooooooooo', '..oo.oo.oo..',
          '..oo.oo.oo..', 'oooooooooooo', 'XXoooooooXXX', '..ooooSooo..',
        ],
      },
      {
        name: 'Thin Air', powers: ['spade', 'bomb', 'swap', 'shuffle'],
        map: [
          'Soo.........', 'ooo.........', 'oooooooooooo', 'oooooooooooo',
          '.........ooo', '.........ooo', 'oooooooooooo', 'oooooooooooo',
          'ooo.........', 'ooo.........', 'oooooooooooo', 'oooooooooooo',
          '.........ooo', '.........ooo', '.........ooo', '.........ooA',
        ],
      },
      {
        name: 'Floating Isles', powers: ['spade', 'bomb', 'swap', 'shuffle'],
        map: [
          'Sooo........', 'oooo........', 'oooo........', 'oooooooo....',
          '....oooo....', '....oooooooo', '........oooo', '........oooo',
          'oooooooooooo', 'oooo........', 'oooo........', 'oooooooo....',
          '....oooo....', '....oooooooo', '........oooo', '........oooA',
        ],
      },
      {
        name: 'Feather Walk', powers: ['spade', 'bomb', 'swap', 'shuffle'],
        map: [
          'Sooo........', 'oooo........', 'oooooooooooo', 'oooooooooooo',
          '........oooo', 'oooooooooooo', 'oooooooooooo', 'oooo........',
          'oooooooooooo', 'oooooooooooo', '........oooo', 'oooooooooooo',
          'oooooooooooo', 'oooo........', 'oooooooooooo', '...........A',
        ],
      },
      {
        name: "Crow's Nest", powers: ['spade', 'bomb', 'swap', 'shuffle'],
        map: [
          'Sooooooooooo', 'o..........o', 'oooooooooo.o', 'o........o.o',
          'o.oooooo.o.o', 'o.o....o.o.o', 'o.o.Aooo.o.o', 'o.o......o.o',
          'o.oooooooo.o', 'o..........o', 'oooooooooooo', 'oooooooooooo',
          'oooooooooooo', 'oooooooooooo', 'oooooooooooo', 'oooooooooooo',
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
        name: 'Forge Door', powers: ['spade', 'bomb', 'swap', 'shuffle'],
        map: [
          'oooooooooooo', 'oXXXXXXXXXXo', 'oXooooooooXo', 'oXoXXXXXXoXo',
          'oXoXooooXoXo', 'oXoXoAooXoXo', 'oXoXooooXoXo', 'oXoXX##XXoXo',
          'oXooooooooXo', 'oXXXXX##XXXo', 'oooooooooooo', 'oooooooooooo',
          'oooIIIIIIooo', 'oooooooooooo', 'oooooooooooo', 'Sooooooooooo',
        ],
      },
      {
        name: 'Scorched Stair', powers: ['spade', 'bomb', 'swap', 'shuffle'],
        map: [
          'Sooo#XXXXXXX', 'oooo#XXXXXXX', 'oooooo#XXXXX', 'oooooo#XXXXX',
          'XXoooooo#XXX', 'XXoooooo#XXX', 'XXXXoooooo#X', 'XXXXoooooo#X',
          'XXXXXXoooooo', 'XXXXXXoooooo', 'XXXX#ooooooo', 'XX#ooooooooo',
          '#ooooooooooo', 'oooooooooooo', 'oooooo#####o', 'Aooooo#ooooo',
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
        name: 'Smoulder', powers: ['spade', 'bomb', 'swap', 'shuffle'],
        map: [
          'ooooooooSooo', 'oooooooooooo', '##########oo', 'oooooooooooo',
          'oooooooooooo', 'oo##########', 'oooooooooooo', 'oooooooooooo',
          '##########oo', 'oooooooooooo', 'oooooooooooo', 'oo##########',
          'oooooooooooo', 'oooooooooooo', 'oooooooooooo', 'oAoooooooooo',
        ],
      },
      {
        name: 'Burning Bridge', powers: ['spade', 'bomb', 'swap', 'shuffle'],
        map: [
          'AoXooooooXoA', 'ooXooooooXoo', 'ooX##XX##Xoo', 'oooooooooooo',
          'ooo.oo.oo.oo', 'ooo.oo.oo.oo', 'oooooooooooo', 'XX##XXXX##XX',
          'oooooooooooo', 'ooTooooooToo', 'oooooooooooo', '.oo.oo.oo.oo',
          'oooooooooooo', 'XXXX####XXXX', 'oooooooooooo', 'oooooSoooooo',
        ],
      },
      {
        name: 'Phoenix Nest', powers: ['spade', 'bomb', 'swap', 'shuffle'],
        map: [
          'oooooSoooooo', 'oooooooooooo', 'oT...oo...To', 'oo...oo...oo',
          'oooooooooooo', '###oo##oo###', 'oooooooooooo', '..oo#AA#oo..',
          '..oo####oo..', 'oooooooooooo', '###oo##oo###', 'oooooooooooo',
          'oo...oo...oo', 'oT...oo...To', 'oooooooooooo', 'AooooooooooA',
        ],
      },
      {
        name: 'Ember Crown', powers: ['spade', 'bomb', 'swap', 'shuffle'],
        map: [
          'AoXooooooXoA', 'ooXoo##ooXoo', 'ooXooIIooXoo', '##XXXooXXX##',
          'oooooooooooo', 'ooTooooooToo', 'oooooooooooo', 'oooIIooIIooo',
          'XX###oo###XX', 'oooooooooooo', 'ooooToTooooo', 'oooooooooooo',
          '##XXXooXXX##', 'ooXooIIooXoo', 'ooXooooooXoo', 'AoXooSoooXoA',
        ],
      },
      {
        name: 'Lava Tubes', powers: ['spade', 'bomb', 'swap', 'shuffle'],
        map: [
          'Soo.oooooooo', 'ooo.oooooooo', 'ooo.ooo.oooo', 'ooo.ooo.oooo',
          'ooo.ooo.oooo', 'ooo.ooo.oooo', 'ooo.ooo.oooo', 'ooo.ooo.oooo',
          'ooo.ooo.oooo', 'ooo.ooo.oooo', 'ooo.ooo.oooo', 'ooo.ooo.oooo',
          'ooo.ooo.oooo', 'ooooooo.oooo', 'ooooooo.oooo', 'ooooooo.oooA',
        ],
      },
      {
        name: 'The Furnace', powers: ['spade', 'bomb', 'swap', 'shuffle'],
        map: [
          'oooooSoooooo', 'oooooooooooo', 'o####oo####o', 'o#To#oo#oT#o',
          'o####oo####o', 'oooooooooooo', 'XXXXX##XXXXX', 'oooooooooooo',
          'o####oo####o', 'o#oT#oo#To#o', 'o####oo####o', 'oooooooooooo',
          'XXXXX##XXXXX', 'oooooooooooo', 'oooooooooooo', 'AooooooooooA',
        ],
      },
      {
        name: 'Slag Heap', powers: ['spade', 'bomb', 'swap', 'shuffle'],
        map: [
          'S#oo#oo#o#oo', 'oo#oo#o#oo#o', '#oo#o#oo#oo#', 'o#oo#oo#o#oo',
          'oo#o#oo#oo#o', '#oo#oo#o#oo#', 'o#oo#oo#o#oo', 'oo#oo#o#oo#o',
          '#oo#o#oo#oo#', 'o#oo#oo#o#oo', 'oo#o#oo#oo#o', '#oo#oo#o#oo#',
          'o#oo#oo#o#oo', 'oo#oo#o#oo#o', '#oo#o#oo#oo#', 'o#oo#oo#o#oA',
        ],
      },
      {
        name: 'Ember Maze', powers: ['spade', 'bomb', 'swap', 'shuffle'],
        map: [
          'SoXooooooooo', 'ooXooooooooo', 'ooXooXXXXXoo', 'ooXooXoooooo',
          'ooXooXoooooo', 'ooXooXooXXXX', 'ooooXXoo#ooo', 'ooooXXoo#ooo',
          'ooXXXXoo#ooo', 'ooXooooo#ooo', 'ooXooooo#ooo', 'ooXooXXXXXXX',
          'ooXoo#oooooo', 'ooXooXoooooo', 'oooooXoooooo', 'oooooXoooooA',
        ],
      },
      {
        name: 'The Crucible', powers: ['spade', 'bomb', 'swap', 'shuffle'],
        map: [
          'Aoo##oo##ooA', 'ooo##oo##ooo', 'oooooooooooo', '##oXXXXXXo##',
          'oooX####Xooo', 'oooX#oo#Xooo', 'oooX#So#Xooo', 'oooX#oo#Xooo',
          'oooX####Xooo', '##oXX##XXo##', 'oooooooooooo', 'oooooooooooo',
          'oo##oooo##oo', 'oo##oooo##oo', 'oooooooooooo', 'AooooooooooA',
        ],
      },
      {
        name: 'Molten Core', powers: ['spade', 'bomb', 'swap', 'shuffle'],
        map: [
          'oooooooooooo', 'oXXXXX##XXXo', 'oX########Xo', 'oX#oooooo#Xo',
          'oX#oX##Xo#Xo', 'oX#oXooXo#Xo', 'oX#oXAoXo#Xo', 'oX#oXooXo#Xo',
          'oX#oXXXXo#Xo', 'oX#oooooo#Xo', 'oX####XX##Xo', 'oXXXX##XXXXo',
          'oooooooooooo', 'oooooooooooo', 'oooIIIIIIooo', 'Sooooooooooo',
        ],
      },
      {
        name: 'The Kiln', powers: ['spade', 'bomb', 'swap', 'shuffle'],
        map: [
          'SoXooooooXoo', 'ooXooooooXoo', 'ooXXXX##XXoo', 'oooooooooooo',
          'oooooooooooo', 'XX##XXXXXXXX', 'oooooooooooo', 'oooooooooooo',
          'XXXXXXXX##XX', 'oooooooooooo', 'oooooooooooo', 'XX##XXXXXXXX',
          'oooooooooooo', 'oooooooooooo', 'XXXXXXXX##XX', 'oooooAoooooo',
        ],
      },
      {
        name: 'The Last Flame', powers: ['spade', 'bomb', 'swap', 'shuffle'],
        map: [
          'AoX##oo##XoA', 'ooX##oo##Xoo', 'ooXXX##XXXoo', '##XX####XX##',
          '##XXXooXXX##', 'oooooooooooo', 'oo.oo##oo.oo', 'oo.o#AA#o.oo',
          'oo.o####o.oo', 'oooooooooooo', '##XXX##XXX##', 'oooooooooooo',
          'XXX##XX##XXX', 'oooooooooooo', 'AooIIooIIooA', 'oooooSoooooo',
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
