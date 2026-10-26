/*
  AWWFY STUDIOS: SITE CONTENT
  This is the only file you need to edit to change games, text and links.

  To add a game:
  1. Put a phone screenshot in assets/shots/ named after the game's web address,
     for example assets/shots/my-new-game.jpg
  2. Copy one of the game blocks below, paste it in the right list and change the details.
  3. Save. That's it.

  Fields:
    id       the game's folder on awwfy.com (awwfy.com/<id>/). Also the screenshot name.
    name     title shown on the card
    sub      optional small line under the title (used for English names of Arabic games)
    subject  physics | chemistry | biology | space | maths | reading
    lang     en | ar
    kids     true for the younger version of a game (shows a "Kids" tag)
    line     one short sentence about the game
    soon     true to show "Coming soon" instead of a Play link
    url      optional full link, only if the game is NOT on awwfy.com
*/
window.AWWFY = {
  site: "https://awwfy.com/",
  contact: {
    hello: "hello@awwfy.com",
    careers: "join@awwfy.com"
  },

  /* Phones in the showcase row, in this order (use game ids from the lists below) */
  showcase: ["solar-system", "gravity-hopper", "periodic-fighter", "spark-lab", "beam-lab", "trait-quest"],

  valence: {
    title: "Valence",
    tagline: "Elements are your partners",
    status: "Coming soon",
    blurb: "A chemistry adventure where atoms become creatures. Join two hydrogen and one oxygen, and a Water Wolf is born.",
    cta: "Get early access"
  },

  /* Plans section. Prices start on 1 July 2027; everything is free until 30 June 2027. */
  plans: {
    label: "( Plans )",
    heading: "Free to play until 30 June 2027.",
    intro: "Every game is free for now. Paid plans start on 1 July 2027.",
    cards: [
      { label: "( Free )", name: "Free", price: "US$0", period: "forever",
        points: ["Maths and reading games", "No sign-up"] },
      { label: "( Teacher or parent )", name: "Teacher or parent", price: "US$99", period: "a year from 1 July 2027",
        points: ["All science games", "Free until then"], featured: true },
      { label: "( School )", name: "School", price: "US$999", period: "a year from 1 July 2027",
        points: ["All science games for every teacher and student", "Free until then"] }
    ],
    custom: {
      text: "Need a game for a topic that is hard to teach? Order a custom game.",
      cta: "Email hello@awwfy.com",
      mailSubject: "Custom game request"
    },
    smallPrint: "No logins for children. No ads. No late fees or interest. If a payment is late, access pauses."
  },

  science: [
    { id: "solar-system", name: "Solar System", subject: "space", lang: "en",
      line: "Explore orbiting planets in 3D, learn NASA facts and zoom into Earth to discover countries." },
    { id: "solar-system-kids", name: "Solar System for Kids", subject: "space", lang: "en", kids: true,
      line: "A simpler space trip with a friendly voice and fun facts for every planet." },
    { id: "solar-system-arabic", name: "مستكشف النظام الشمسي", sub: "Solar System (Arabic)", subject: "space", lang: "ar",
      line: "The 3D Solar System explorer, fully in Arabic." },
    { id: "solar-system-arabic-kids", name: "النظام الشمسي للأطفال", sub: "Solar System for Kids (Arabic)", subject: "space", lang: "ar", kids: true,
      line: "The kids' space trip, fully in Arabic." },
    { id: "gravity-hopper", name: "Gravity Hopper", subject: "physics", lang: "en",
      line: "Guide robot Bolt through a platformer about gravity, friction and energy." },
    { id: "periodic-fighter", name: "Periodic Fighter", subject: "chemistry", lang: "en",
      line: "Battle all 118 elements and learn their names, symbols and numbers." },
    { id: "spark-lab", name: "Spark Lab", subject: "physics", lang: "en",
      line: "Complete circuits to power devices and light up the night." },
    { id: "beam-lab", name: "Beam Lab", subject: "physics", lang: "en",
      line: "Guide light rays, test materials and shape shadow puzzles." },
    { id: "trait-quest", name: "Trait Quest", subject: "biology", lang: "en",
      line: "Collect animals, classify traits and breed offspring to see inheritance." },
    { id: "valence", name: "Valence", subject: "chemistry", lang: "en", soon: true,
      line: "Atoms become creatures in a chemistry adventure." },
    { id: "nutrient-run", name: "Nutrient Run", subject: "biology", lang: "en", soon: true,
      line: "A new biology game." }
  ],

  free: [
    { id: "math-racer-v2", name: "Math Racer", subject: "maths", lang: "en",
      line: "Race your car by solving quick sums." },
    { id: "math-racer-ar", name: "بطل الحساب السريع", sub: "Math Racer (Arabic)", subject: "maths", lang: "ar",
      line: "The racing maths game with a Jeddah theme, fully in Arabic." },
    { id: "number-meadow", name: "Number Meadow", subject: "maths", lang: "en",
      line: "Adding, taking away, groups and sharing with friendly buddies." },
    { id: "balloon-minus", name: "Balloon Minus", subject: "maths", lang: "en",
      line: "Pop rising balloons by solving subtraction." },
    { id: "little-creatures-english-animals", name: "Little Creatures: Animals", subject: "reading", lang: "en",
      line: "Learn animal names with pictures and sound." },
    { id: "little-creatures-english-birds", name: "Little Creatures: Birds", subject: "reading", lang: "en",
      line: "Learn bird names with pictures and sound." },
    { id: "little-creatures-english-aquatic", name: "Little Creatures: Sea", subject: "reading", lang: "en",
      line: "Learn water animal names with pictures and sound." },
    { id: "little-creatures-arabic-animals", name: "مغامرات حيوانات البرّ", sub: "Little Creatures: Animals (Arabic)", subject: "reading", lang: "ar",
      line: "Animal names with pictures and sound, in Arabic." },
    { id: "little-creatures-arabic-birds", name: "مغامرات الطيور", sub: "Little Creatures: Birds (Arabic)", subject: "reading", lang: "ar",
      line: "Bird names with pictures and sound, in Arabic." },
    { id: "little-creatures-arabic-aquatic", name: "مغامرات الحيوانات المائية", sub: "Little Creatures: Sea (Arabic)", subject: "reading", lang: "ar",
      line: "Water animal names with pictures and sound, in Arabic." },
    { id: "caeser-legion-master", name: "Caesar Legion Master", subject: "reading", lang: "en",
      line: "Julius Caesar's life through legion collecting, battles and lore." }
  ]
};
