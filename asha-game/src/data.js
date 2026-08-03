// ---------------------------------------------------------------------------
// THE STORY
//
// This is the only file you need to edit to change the game's content.
// Each chapter has two checkpoints. Each checkpoint asks one question and
// shows up to two photos.
//
// Photos: drop the image files into asha-game/photos/ and write the file name
// here. A missing photo just shows a friendly placeholder, so the game always
// runs even before you've uploaded everything.
//
// Every question here is a real one. Rewrite the text, the answers and the
// hints freely -- nothing else in the game needs to change.
//
// A chapter may have one checkpoint or two; the level builder places a
// checkpoint per question, so deleting one below is all it takes.
//
// reveal: 'after'  keeps the photos hidden until she answers correctly, so the
// photo is the reward rather than the giveaway. Use it whenever the picture
// would answer the question -- and leave it off when the question is about the
// picture ("where was this?").
// ---------------------------------------------------------------------------

export const chapters = [
  {
    id: 'dc2011',
    animal: 'chicken',
    title: 'The Early Days',
    year: '2011',
    place: 'Washington, DC',
    theme: 'dc',
    intro:
      'A summer in Washington. Marble, humidity, and a job at the World Bank. ' +
      'Somewhere in this city, Mama is about to meet Papa.',
    outro: 'Two people, one very lucky coincidence.',
    checkpoints: [
      {
        question: 'What race got Mama and Papa together in 2011?',
        answers: ['The High Heel Race', 'The Marine Corps Marathon', 'The Turkey Trot', 'The Cherry Blossom Ten Miler'],
        correct: 0,
        hint: '17th Street, the week of Halloween. Not exactly running shoes.',
        photos: ['ch1-c.jpg'],
        caption: 'Washington, DC — 2011',
      },
      {
        question: 'What creature ran around our backyard in La Palma?',
        answers: ['A chicken', 'A goat', 'A cat', 'A lizard'],
        correct: 0,
        hint: 'Feathers, and absolutely no manners.',
        photos: ['ch1-a.jpg'],
        caption: 'La Palma',
      },
    ],
  },

  {
    id: 'tulum2015',
    animal: 'pelican',
    title: 'The Wedding',
    year: '2015',
    place: 'Tulum, Mexico',
    theme: 'tulum',
    intro:
      'Thirty people, one beach, and a very long dinner. Careful of the waves, ' +
      'Mama — the dancing starts at the end of the sand.',
    outro: 'Married on a beach, dancing until the music gave up.',
    checkpoints: [
      {
        question: 'What was the main dish at the rehearsal dinner?',
        answers: ['Octopus', 'Suckling pig', 'Ceviche', 'Grilled snapper'],
        correct: 0,
        hint: 'Eight arms, on a wooden board, with a burnt lime.',
        reveal: 'after',
        photos: ['ch2-a.jpg'],
        caption: 'The rehearsal dinner — Tulum, 2015',
      },
      {
        question: 'Which big bird kept patrolling the beach in Tulum?',
        answers: ['A pelican', 'A flamingo', 'A seagull', 'A frigatebird'],
        correct: 0,
        hint: 'Enormous beak. Truly terrible landings.',
        photos: ['ch2-c.jpg'],
        caption: 'Tulum — 2015',
      },
    ],
  },

  {
    id: 'house2016',
    animal: 'raccoon',
    title: 'The House',
    year: '2016',
    place: 'Washington, DC',
    theme: 'house',
    intro:
      'Keys, boxes, and a mortgage. Climb up to the front door — this one is ours.',
    outro: 'Not just an address. A home.',
    checkpoints: [
      {
        question: 'What color was the house before we bought it?',
        answers: ['Red / maroon / salmon / terracotta', 'Blue', 'Green', 'Cream'],
        correct: 0,
        hint: 'Much darker than it is now. The blue one is next door.',
        reveal: 'after',
        photos: ['ch3-a.jpg'],
        caption: 'Before — 2016',
      },
      {
        question:
          'What was our helpful neighbor wearing while advising us on whether to buy in Eckington?',
        answers: ['A bathrobe', 'A three-piece suit', 'A Santa suit', 'Full cycling kit'],
        correct: 0,
        hint: 'Not dressed for company. Not dressed for outside, either.',
        reveal: 'after',
        photos: ['ch3-c.jpg'],
        caption: 'Eckington',
      },
    ],
  },

  {
    id: 'naomi2017',
    animal: 'dodo',
    title: 'Naomi Arrives',
    year: '2017',
    place: 'Washington, DC',
    theme: 'naomi',
    intro:
      'The night everything changed. Follow the stars, Mama — someone very ' +
      'small is waiting at the end.',
    outro: 'And then there were three.',
    checkpoints: [
      {
        question: 'How much did Naomi weigh when she was born?',
        answers: ['7.1 lbs', '6.4 lbs', '8.2 lbs', '9.0 lbs'],
        correct: 0,
        hint: 'Just over seven pounds.',
        photos: ['ch4-a.jpg'],
        caption: 'Hello, Naomi',
      },
      {
        // A whimsical one -- swap in a real memory if you have a better fit.
        question: 'Which flightless bird, long extinct, is tagging along from here?',
        answers: ['The dodo', 'The moa', 'The great auk', 'The passenger pigeon'],
        correct: 0,
        hint: 'From Mauritius, and famously not very quick.',
        photos: ['ch4-b.jpg'],
        caption: 'The first days',
      },
    ],
  },

  {
    id: 'arboretum',
    animal: 'mantis',
    title: 'The Arboretum',
    year: '2020',
    place: 'National Arboretum, DC',
    theme: 'arboretum',
    intro:
      'The world got very quiet that year. So we walked. Past the old stone ' +
      'columns, again and again, until it felt like ours.',
    outro: 'A strange year, made good by small walks.',
    checkpoints: [
      {
        question: 'What is the smallest tree in the Arboretum?',
        answers: ['A bonsai', 'A dogwood', 'A crabapple', 'A cherry tree'],
        correct: 0,
        hint: 'It lives in a tray, and it is older than all of us.',
        reveal: 'after',
        photos: ['ch5-a.jpg'],
        caption: 'The bonsai museum',
      },
      {
        question: 'What insect was all over one particular bush in the Arboretum?',
        answers: ['A praying mantis', 'A stick insect', 'A cicada', 'A firefly'],
        correct: 0,
        hint: 'Stands very still, with its arms folded.',
        photos: ['ch5-c.jpg'],
        caption: 'Under the columns',
      },
    ],
  },

  {
    id: 'germany',
    animal: 'redpanda',
    title: 'Germany',
    year: '',
    place: 'Germany',
    theme: 'germany',
    intro:
      'Over the ocean to where Papa is from. Cold mornings, a train that ' +
      'hangs from the sky, and more matjes than anyone needs.',
    outro: 'Family on the other side of the world.',
    checkpoints: [
      {
        question: 'What is the German sailing capital?',
        answers: ['Kiel', 'Hamburg', 'Rostock', 'Bremen'],
        correct: 0,
        hint: 'On the Baltic, with a famous week named after it.',
        photos: ['ch6-a.jpg'],
        caption: 'Germany',
      },
      {
        question: 'Which animal did we go to see at the zoo in Germany?',
        answers: ['A red panda', 'A giant panda', 'A snow leopard', 'An otter'],
        correct: 0,
        hint: 'Rust-colored, ringed tail, entirely unbothered.',
        reveal: 'after',
        photos: ['ch6-b.jpg'],
        caption: 'At the zoo',
      },
    ],
  },

  {
    id: 'costarica',
    animal: 'capuchin',
    title: 'Pura Vida',
    year: '',
    place: 'Costa Rica',
    theme: 'costarica',
    intro:
      'Jungle, volcano, and the loudest birds in the world. Watch the vines, ' +
      'Mama — this is the last stretch.',
    outro: 'Pura vida. Almost home.',
    checkpoints: [
      {
        question: 'What is the Costa Rican saying we always bring home?',
        answers: ['Pura vida', 'Hakuna matata', 'La dolce vita', 'C’est la vie'],
        correct: 0,
        hint: 'It means pure life.',
        photos: ['ch7-a.jpg'],
        caption: 'Costa Rica',
      },
      {
        question: 'What kind of monkey attacked Papa?',
        answers: ['A capuchin', 'A howler monkey', 'A spider monkey', 'A squirrel monkey'],
        correct: 0,
        hint: 'The little white-faced ones. They want your lunch.',
        photos: ['ch7-b.jpg'],
        caption: 'Costa Rica',
      },
    ],
  },
];

// What each animal is called when it joins the parade.
export const animalNames = {
  chicken: 'A chicken',
  pelican: 'A pelican',
  raccoon: 'A raccoon',
  dodo: 'A dodo',
  mantis: 'A praying mantis',
  redpanda: 'A red panda',
  capuchin: 'A capuchin monkey',
};

// The final scene. No questions here -- just a short walk to the family.
export const finale = {
  title: 'Happy Birthday, Mama',
  groupPhoto: 'family.jpg',
  message:
    'Fourteen years, lots of beaches, even more airports, and a little girl ' +
    'that means the world.\n\nWe love you, Mama.',
};
