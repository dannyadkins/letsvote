enum States {
  Alabama = "Alabama",
  Alaska = "Alaska",
  Arizona = "Arizona",
  Arkansas = "Arkansas",
  California = "California",
  Colorado = "Colorado",
  Connecticut = "Connecticut",
  Delaware = "Delaware",
  Florida = "Florida",
  Georgia = "Georgia",
  Hawaii = "Hawaii",
  Idaho = "Idaho",
  Illinois = "Illinois",
  Indiana = "Indiana",
  Iowa = "Iowa",
  Kansas = "Kansas",
  Kentucky = "Kentucky",
  Louisiana = "Louisiana",
  Maine = "Maine",
  Maryland = "Maryland",
  Massachusetts = "Massachusetts",
  Michigan = "Michigan",
  Minnesota = "Minnesota",
  Mississippi = "Mississippi",
  Missouri = "Missouri",
  Montana = "Montana",
  Nebraska = "Nebraska",
  Nevada = "Nevada",
  NewHampshire = "New Hampshire",
  NewJersey = "New Jersey",
  NewMexico = "New Mexico",
  NewYork = "New York",
  NorthCarolina = "North Carolina",
  NorthDakota = "North Dakota",
  Ohio = "Ohio",
  Oklahoma = "Oklahoma",
  Oregon = "Oregon",
  Pennsylvania = "Pennsylvania",
  RhodeIsland = "Rhode Island",
  SouthCarolina = "South Carolina",
  SouthDakota = "South Dakota",
  Tennessee = "Tennessee",
  Texas = "Texas",
  Utah = "Utah",
  Vermont = "Vermont",
  Virginia = "Virginia",
  Washington = "Washington",
  WestVirginia = "West Virginia",
  Wisconsin = "Wisconsin",
  Wyoming = "Wyoming",
}

interface ILink {
  href: string;
  title?: string;
  type:
    | "official"
    | "wikipedia"
    | "ballotpedia"
    | "twitter"
    | "facebook"
    | "instagram"
    | "youtube"
    | "twitch"
    | "reddit"
    | "linkedin"
    | "website";
}

interface ICandidate {
  name: string;
  slug: string;
  race: IRace;
  party: "Democrat" | "Republican" | "Libertarian" | "Green" | "Independent";
  links: ILink[];
}

interface IRace {
  name: string;
  slug: string;
  locale: "United States" | keyof typeof States;
  type: "President" | "Senate" | "House";
}

export const races: IRace[] = [
  {
    name: "President",
    slug: "president",
    locale: "United States",
    type: "President",
  },
  { name: "Senate", slug: "senate", locale: "United States", type: "Senate" },
  { name: "House", slug: "house", locale: "United States", type: "House" },
  //   TODO: add one for each state
];

export enum ChunkTypes {
  DirectQuote = "direct_quote",
  Paraphrase = "paraphrase",
  Commentary = "commentary",
  UsefulInfo = "useful_information",
  Other = "other",
}

export const RacesByName: {
  [key: string]: IRace;
} = {
  President: races.find((r) => r.slug === "president") as IRace,
};

// TODO: eventually have these be auto-inserted into a database and then fetched from there
export const canididates: ICandidate[] = [
  {
    name: "Joe Biden",
    slug: "joe-biden",
    race: RacesByName.President,
    party: "Democrat",
    links: [
      {
        href: "https://en.wikipedia.org/wiki/Joe_Biden",
        title: "Wikipedia",
        type: "wikipedia",
      },
      {
        href: "https://joebiden.com",
        title: "Official Website",
        type: "official",
      },
      {
        href: "https://twitter.com/JoeBiden",
        type: "twitter",
      },
    ],
  },
  {
    name: "Nikki Haley",
    slug: "nikki-haley",
    race: RacesByName.President,
    party: "Republican",
    links: [
      {
        href: "https://en.wikipedia.org/wiki/Nikki_Haley",
        title: "Wikipedia",
        type: "wikipedia",
      },
      {
        href: "https://www.nikkihaley.com",
        title: "Official Website",
        type: "official",
      },
      {
        href: "https://twitter.com/NikkiHaley",
        type: "twitter",
      },
    ],
  },
];
