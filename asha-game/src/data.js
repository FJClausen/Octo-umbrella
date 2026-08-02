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
// Questions marked DRAFT are our first guesses. Rewrite the text, the answers
// and the hints freely -- nothing else in the game needs to change.
// ---------------------------------------------------------------------------

export const chapters = [
  {
    id: 'dc2011',
    title: 'Where It Started',
    year: '2011',
    place: 'Washington, DC',
    theme: 'dc',
    intro:
      'A summer in Washington. Marble, humidity, and a job at the World Bank. ' +
      'Somewhere in this city, Mama is about to meet Papa.',
    outro: 'Two people, one very lucky coincidence.',
    checkpoints: [
      {
        // DRAFT
        question: 'Where did Mama and Papa first meet in 2011?',
        answers: ['At the World Bank', 'At a coffee shop', 'On a plane', 'At a wedding'],
        correct: 0,
        hint: 'It was work. Very romantic, we know.',
        photos: ['ch1-a.jpg', 'ch1-b.jpg'],
        caption: 'Washington, DC — 2011',
      },
      {
        // DRAFT
        question: 'Which city did we both live in when we met?',
        answers: ['Washington, DC', 'New York', 'Vienna', 'San José'],
        correct: 0,
        hint: 'The one with the monuments.',
        photos: ['ch1-c.jpg', 'ch1-d.jpg'],
        caption: 'The DC years',
      },
    ],
  },

  {
    id: 'tulum2015',
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
        // DRAFT
        question: 'Where did we get married?',
        answers: ['Tulum, Mexico', 'Cancún, Mexico', 'Goa, India', 'Salzburg, Austria'],
        correct: 0,
        hint: 'White sand, Yucatán peninsula.',
        photos: ['ch2-a.jpg', 'ch2-b.jpg'],
        caption: 'The wedding weekend — Tulum, 2015',
      },
      {
        // DRAFT
        question: 'Roughly how many guests came to the wedding?',
        answers: ['About 30', 'About 80', 'About 150', 'Just the two of us'],
        correct: 0,
        hint: 'Small enough that everyone fit at one very long table.',
        photos: ['ch2-c.jpg', 'ch2-d.jpg'],
        caption: 'Married on the beach',
      },
    ],
  },

  {
    id: 'house2016',
    title: 'The House',
    year: '2016',
    place: 'Washington, DC',
    theme: 'house',
    intro:
      'Keys, boxes, and a mortgage. Climb up to the front door — this one is ours.',
    outro: 'Not just an address. A home.',
    checkpoints: [
      {
        // DRAFT
        question: 'What did we buy in 2016?',
        answers: ['Our house in DC', 'A car', 'A boat', 'A dog'],
        correct: 0,
        hint: 'It has a front door and a lot of stairs.',
        photos: ['ch3-a.jpg', 'ch3-b.jpg'],
        caption: 'Moving day — 2016',
      },
      {
        // DRAFT
        question: 'In which city did we buy our first house together?',
        answers: ['Washington, DC', 'Berlin', 'Vienna', 'Mexico City'],
        correct: 0,
        hint: 'Same city where it all started.',
        photos: ['ch3-c.jpg', 'ch3-d.jpg'],
        caption: 'Home',
      },
    ],
  },

  {
    id: 'naomi2017',
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
        // DRAFT
        question: 'What year was Naomi born?',
        answers: ['2017', '2015', '2018', '2019'],
        correct: 0,
        hint: 'One year after the house.',
        photos: ['ch4-a.jpg', 'ch4-b.jpg'],
        caption: 'Hello, Naomi',
      },
      {
        // DRAFT
        question: 'Where was Naomi born?',
        answers: ['Washington, DC', 'Munich', 'Tulum', 'San José'],
        correct: 0,
        hint: 'She is a DC kid.',
        photos: ['ch4-c.jpg', 'ch4-d.jpg'],
        caption: 'The first days',
      },
    ],
  },

  {
    id: 'arboretum',
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
        // DRAFT
        question: 'Which DC spot did we walk to over and over during the pandemic?',
        answers: ['The National Arboretum', 'The National Zoo', 'The Mall', 'Rock Creek Park'],
        correct: 0,
        hint: 'It has the famous old columns standing in a field.',
        photos: ['ch5-a.jpg', 'ch5-b.jpg'],
        caption: 'The Arboretum',
      },
      {
        // DRAFT
        question: 'What stands in the middle of the Arboretum meadow?',
        answers: ['The Capitol Columns', 'A lighthouse', 'A carousel', 'A windmill'],
        correct: 0,
        hint: 'Twenty-two of them, and they used to hold up the Capitol.',
        photos: ['ch5-c.jpg', 'ch5-d.jpg'],
        caption: 'Under the columns',
      },
    ],
  },

  {
    id: 'germany',
    title: 'Papa’s Germany',
    year: '',
    place: 'Germany',
    theme: 'germany',
    intro:
      'Over the ocean to where Papa is from. Timber houses, cold mornings, ' +
      'and mountains at the far end of the road.',
    outro: 'Family on the other side of the world.',
    checkpoints: [
      {
        // DRAFT
        question: 'Which country is Papa from?',
        answers: ['Germany', 'Austria', 'Switzerland', 'Denmark'],
        correct: 0,
        hint: 'You have been there many times.',
        photos: ['ch6-a.jpg', 'ch6-b.jpg'], // ch6-b still to come
        caption: 'Germany',
      },
      {
        // DRAFT
        question: 'Who do we visit on our trips to Germany?',
        answers: ['Papa’s family', 'Old colleagues', 'Nobody, just us', 'Friends from Tulum'],
        correct: 0,
        hint: 'The other half of Naomi’s grandparents.',
        photos: ['ch6-c.jpg', 'ch6-d.jpg'],
        caption: 'With the family',
      },
    ],
  },

  {
    id: 'costarica',
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
        // DRAFT
        question: 'Which country do we keep going back to for vacation?',
        answers: ['Costa Rica', 'Panama', 'Belize', 'Colombia'],
        correct: 0,
        hint: 'Pura vida.',
        photos: ['ch7-a.jpg', 'ch7-b.jpg'],
        caption: 'Costa Rica',
      },
      {
        // DRAFT
        question: 'What is the Costa Rican saying we always bring home?',
        answers: ['Pura vida', 'Hakuna matata', 'La dolce vita', 'C’est la vie'],
        correct: 0,
        hint: 'It means pure life.',
        photos: ['ch7-c.jpg', 'ch7-d.jpg'],
        caption: 'The last vacation',
      },
    ],
  },
];

// The final scene. No questions here -- just a short walk to the family.
export const finale = {
  title: 'Happy Birthday, Mama',
  groupPhoto: 'family.jpg',
  message:
    'Fourteen years, one wedding on a beach, one house, one Naomi, and a lot ' +
    'of airports. Thank you for all of it.\n\nWe love you.\n\n— Fabian & Naomi',
};
