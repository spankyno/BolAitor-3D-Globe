import rawLocationInfo from './locationInfo.json';

export interface LocationItem {
  id: number;
  name: string;
  country: string;
  flag: string;
  region: string;
  imageUrl: string;
  fallbackUrl: string;
  info: string;
  coordinates?: string;
  bestTime?: string;
}

const locationDescriptions: Record<string, string> = rawLocationInfo;

export const LOCATIONS_LIST: LocationItem[] = [
  {
    id: 0,
    name: "Eiffel Tower, Paris",
    country: "France",
    flag: "🇫🇷",
    region: "Europe",
    coordinates: "48.8584° N, 2.2945° E",
    bestTime: "April - October",
    imageUrl: "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?auto=format&fit=crop&w=900&q=80",
    fallbackUrl: "https://picsum.photos/id/10/800/1000",
    info: locationDescriptions["Eiffel Tower, Paris"] || ""
  },
  {
    id: 1,
    name: "Taj Mahal, India",
    country: "India",
    flag: "🇮🇳",
    region: "Asia",
    coordinates: "27.1751° N, 78.0421° E",
    bestTime: "October - March",
    imageUrl: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=900&q=80",
    fallbackUrl: "https://picsum.photos/id/11/800/1000",
    info: locationDescriptions["Taj Mahal, India"] || ""
  },
  {
    id: 2,
    name: "Statue of Liberty, New York",
    country: "United States",
    flag: "🇺🇸",
    region: "North America",
    coordinates: "40.6892° N, 74.0445° W",
    bestTime: "May - September",
    imageUrl: "https://images.unsplash.com/photo-1605130284535-11dd9eedc58a?auto=format&fit=crop&w=900&q=80",
    fallbackUrl: "https://picsum.photos/id/12/800/1000",
    info: locationDescriptions["Statue of Liberty, New York"] || ""
  },
  {
    id: 3,
    name: "Great Wall of China",
    country: "China",
    flag: "🇨🇳",
    region: "Asia",
    coordinates: "40.4319° N, 116.5704° E",
    bestTime: "September - November",
    imageUrl: "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=900&q=80",
    fallbackUrl: "https://picsum.photos/id/13/800/1000",
    info: locationDescriptions["Great Wall of China"] || ""
  },
  {
    id: 4,
    name: "Machu Picchu, Peru",
    country: "Peru",
    flag: "🇵🇪",
    region: "South America",
    coordinates: "13.1631° S, 72.5450° W",
    bestTime: "May - October",
    imageUrl: "https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=900&q=80",
    fallbackUrl: "https://picsum.photos/id/14/800/1000",
    info: locationDescriptions["Machu Picchu, Peru"] || ""
  },
  {
    id: 5,
    name: "Colosseum, Rome",
    country: "Italy",
    flag: "🇮🇹",
    region: "Europe",
    coordinates: "41.8902° N, 12.4922° E",
    bestTime: "April - June, September - October",
    imageUrl: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=900&q=80",
    fallbackUrl: "https://picsum.photos/id/15/800/1000",
    info: locationDescriptions["Colosseum, Rome"] || ""
  },
  {
    id: 6,
    name: "Pyramids of Giza, Egypt",
    country: "Egypt",
    flag: "🇪🇬",
    region: "Africa",
    coordinates: "29.9792° N, 31.1342° E",
    bestTime: "October - April",
    imageUrl: "https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=900&q=80",
    fallbackUrl: "https://picsum.photos/id/16/800/1000",
    info: locationDescriptions["Pyramids of Giza, Egypt"] || ""
  },
  {
    id: 7,
    name: "Sydney Opera House",
    country: "Australia",
    flag: "🇦🇺",
    region: "Oceania",
    coordinates: "33.8568° S, 151.2153° E",
    bestTime: "September - November, March - May",
    imageUrl: "https://images.unsplash.com/photo-1624138784614-87fd1b6528f8?auto=format&fit=crop&w=900&q=80",
    fallbackUrl: "https://picsum.photos/id/17/800/1000",
    info: locationDescriptions["Sydney Opera House"] || ""
  },
  {
    id: 8,
    name: "Mount Fuji, Japan",
    country: "Japan",
    flag: "🇯🇵",
    region: "Asia",
    coordinates: "35.3606° N, 138.7274° E",
    bestTime: "July - September (Climbing), Spring (Views)",
    imageUrl: "https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?auto=format&fit=crop&w=900&q=80",
    fallbackUrl: "https://picsum.photos/id/28/800/1000",
    info: locationDescriptions["Mount Fuji, Japan"] || ""
  },
  {
    id: 9,
    name: "Santorini, Greece",
    country: "Greece",
    flag: "🇬🇷",
    region: "Europe",
    coordinates: "36.3932° N, 25.4615° E",
    bestTime: "April - November",
    imageUrl: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=900&q=80",
    fallbackUrl: "https://picsum.photos/id/29/800/1000",
    info: locationDescriptions["Santorini, Greece"] || ""
  },
  {
    id: 10,
    name: "Stonehenge, UK",
    country: "United Kingdom",
    flag: "🇬🇧",
    region: "Europe",
    coordinates: "51.1789° N, 1.8262° W",
    bestTime: "June - September",
    imageUrl: "https://images.unsplash.com/photo-1599833975787-5c143f373c30?auto=format&fit=crop&w=900&q=80",
    fallbackUrl: "https://picsum.photos/id/37/800/1000",
    info: locationDescriptions["Stonehenge, UK"] || ""
  },
  {
    id: 11,
    name: "Petra, Jordan",
    country: "Jordan",
    flag: "🇯🇴",
    region: "Middle East",
    coordinates: "30.3285° N, 35.4444° E",
    bestTime: "March - May, September - November",
    imageUrl: "https://images.unsplash.com/photo-1579606032836-db4055de0e0d?auto=format&fit=crop&w=900&q=80",
    fallbackUrl: "https://picsum.photos/id/39/800/1000",
    info: locationDescriptions["Petra, Jordan"] || ""
  },
  {
    id: 12,
    name: "Burj Khalifa, Dubai",
    country: "United Arab Emirates",
    flag: "🇦🇪",
    region: "Middle East",
    coordinates: "25.1972° N, 55.2744° E",
    bestTime: "November - March",
    imageUrl: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=900&q=80",
    fallbackUrl: "https://picsum.photos/id/43/800/1000",
    info: locationDescriptions["Burj Khalifa, Dubai"] || ""
  },
  {
    id: 13,
    name: "Niagara Falls, Canada",
    country: "Canada",
    flag: "🇨🇦",
    region: "North America",
    coordinates: "43.0962° N, 79.0377° W",
    bestTime: "June - August",
    imageUrl: "https://images.unsplash.com/photo-1533094602577-199e35114234?auto=format&fit=crop&w=900&q=80",
    fallbackUrl: "https://picsum.photos/id/49/800/1000",
    info: locationDescriptions["Niagara Falls, Canada"] || ""
  },
  {
    id: 14,
    name: "Mount Everest, Himalayas",
    country: "Nepal",
    flag: "🇳🇵",
    region: "Asia",
    coordinates: "27.9881° N, 86.9250° E",
    bestTime: "April - May, September - November",
    imageUrl: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=900&q=80",
    fallbackUrl: "https://picsum.photos/id/50/800/1000",
    info: locationDescriptions["Mount Everest, Himalayas"] || ""
  },
  {
    id: 15,
    name: "Golden Gate Bridge, San Francisco",
    country: "United States",
    flag: "🇺🇸",
    region: "North America",
    coordinates: "37.8199° N, 122.4783° W",
    bestTime: "September - November",
    imageUrl: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=900&q=80",
    fallbackUrl: "https://picsum.photos/id/54/800/1000",
    info: locationDescriptions["Golden Gate Bridge, San Francisco"] || ""
  },
  {
    id: 16,
    name: "Acropolis of Athens",
    country: "Greece",
    flag: "🇬🇷",
    region: "Europe",
    coordinates: "37.9715° N, 23.7257° E",
    bestTime: "April - June, September - October",
    imageUrl: "https://images.unsplash.com/photo-1555993539-1732b0258235?auto=format&fit=crop&w=900&q=80",
    fallbackUrl: "https://picsum.photos/id/57/800/1000",
    info: locationDescriptions["Acropolis of Athens"] || ""
  },
  {
    id: 17,
    name: "Angkor Wat, Cambodia",
    country: "Cambodia",
    flag: "🇰🇭",
    region: "Asia",
    coordinates: "13.4125° N, 103.8670° E",
    bestTime: "November - March",
    imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80",
    fallbackUrl: "https://picsum.photos/id/58/800/1000",
    info: locationDescriptions["Angkor Wat, Cambodia"] || ""
  },
  {
    id: 18,
    name: "Sagrada Familia, Barcelona",
    country: "Spain",
    flag: "🇪🇸",
    region: "Europe",
    coordinates: "41.4036° N, 2.1744° E",
    bestTime: "May - June, September - October",
    imageUrl: "https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=900&q=80",
    fallbackUrl: "https://picsum.photos/id/59/800/1000",
    info: locationDescriptions["Sagrada Familia, Barcelona"] || ""
  },
  {
    id: 19,
    name: "Venice Canals, Italy",
    country: "Italy",
    flag: "🇮🇹",
    region: "Europe",
    coordinates: "45.4408° N, 12.3155° E",
    bestTime: "April - June, September - October",
    imageUrl: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=900&q=80",
    fallbackUrl: "https://picsum.photos/id/61/800/1000",
    info: locationDescriptions["Venice Canals, Italy"] || ""
  },
  {
    id: 20,
    name: "Victoria Falls, Zambia",
    country: "Zambia",
    flag: "🇿🇲",
    region: "Africa",
    coordinates: "17.9243° S, 25.8572° E",
    bestTime: "February - May (Peak Flow)",
    imageUrl: "https://images.unsplash.com/photo-1609198092458-38a293c7ac4b?auto=format&fit=crop&w=900&q=80",
    fallbackUrl: "https://picsum.photos/id/62/800/1000",
    info: locationDescriptions["Victoria Falls, Zambia"] || ""
  },
  {
    id: 21,
    name: "Galapagos Islands",
    country: "Ecuador",
    flag: "🇪🇨",
    region: "South America",
    coordinates: "0.9538° S, 90.9656° W",
    bestTime: "December - May",
    imageUrl: "https://images.unsplash.com/photo-1548567117-042976090a18?auto=format&fit=crop&w=900&q=80",
    fallbackUrl: "https://picsum.photos/id/63/800/1000",
    info: locationDescriptions["Galapagos Islands"] || ""
  },
  {
    id: 22,
    name: "Easter Island statues",
    country: "Chile",
    flag: "🇨🇱",
    region: "South America",
    coordinates: "27.1127° S, 109.3497° W",
    bestTime: "October - April",
    imageUrl: "https://images.unsplash.com/photo-1510097467424-192d713fd8c2?auto=format&fit=crop&w=900&q=80",
    fallbackUrl: "https://picsum.photos/id/64/800/1000",
    info: locationDescriptions["Easter Island statues"] || ""
  },
  {
    id: 23,
    name: "Chichen Itza, Mexico",
    country: "Mexico",
    flag: "🇲🇽",
    region: "North America",
    coordinates: "20.6843° N, 88.5678° W",
    bestTime: "November - April",
    imageUrl: "https://images.unsplash.com/photo-1518638150340-f706e86654de?auto=format&fit=crop&w=900&q=80",
    fallbackUrl: "https://picsum.photos/id/65/800/1000",
    info: locationDescriptions["Chichen Itza, Mexico"] || ""
  },
  {
    id: 24,
    name: "Yellowstone Grand Prismatic Spring",
    country: "United States",
    flag: "🇺🇸",
    region: "North America",
    coordinates: "44.5250° N, 110.8382° W",
    bestTime: "June - September",
    imageUrl: "https://images.unsplash.com/photo-1578637387939-43c525550085?auto=format&fit=crop&w=900&q=80",
    fallbackUrl: "https://picsum.photos/id/68/800/1000",
    info: locationDescriptions["Yellowstone Grand Prismatic Spring"] || ""
  },
  {
    id: 25,
    name: "Aurora Borealis in Iceland",
    country: "Iceland",
    flag: "🇮🇸",
    region: "Europe",
    coordinates: "64.9631° N, 19.0208° W",
    bestTime: "September - March",
    imageUrl: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=900&q=80",
    fallbackUrl: "https://picsum.photos/id/69/800/1000",
    info: locationDescriptions["Aurora Borealis in Iceland"] || ""
  },
  {
    id: 26,
    name: "Serengeti Park, Tanzania",
    country: "Tanzania",
    flag: "🇹🇿",
    region: "Africa",
    coordinates: "2.3333° S, 34.8333° E",
    bestTime: "June - October (Great Migration)",
    imageUrl: "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=900&q=80",
    fallbackUrl: "https://picsum.photos/id/71/800/1000",
    info: locationDescriptions["Serengeti Park, Tanzania"] || ""
  },
  {
    id: 27,
    name: "Banff National Park, Canada",
    country: "Canada",
    flag: "🇨🇦",
    region: "North America",
    coordinates: "51.4968° N, 115.9281° W",
    bestTime: "June - August, December - March",
    imageUrl: "https://images.unsplash.com/photo-1503614472-8c93d56e92ce?auto=format&fit=crop&w=900&q=80",
    fallbackUrl: "https://picsum.photos/id/74/800/1000",
    info: locationDescriptions["Banff National Park, Canada"] || ""
  },
  {
    id: 28,
    name: "Salar de Uyuni, Bolivia",
    country: "Bolivia",
    flag: "🇧🇴",
    region: "South America",
    coordinates: "20.1338° S, 67.4891° W",
    bestTime: "May - November (Dry), Jan - April (Mirror Effect)",
    imageUrl: "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=900&q=80",
    fallbackUrl: "https://picsum.photos/id/82/800/1000",
    info: locationDescriptions["Salar de Uyuni, Bolivia"] || ""
  },
  {
    id: 29,
    name: "Bora Bora overwater bungalows",
    country: "French Polynesia",
    flag: "🇵🇫",
    region: "Oceania",
    coordinates: "16.5004° S, 151.7415° W",
    bestTime: "May - October",
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80",
    fallbackUrl: "https://picsum.photos/id/87/800/1000",
    info: locationDescriptions["Bora Bora overwater bungalows"] || ""
  },
  {
    id: 30,
    name: "Maldives beaches",
    country: "Maldives",
    flag: "🇲🇻",
    region: "Asia",
    coordinates: "3.2028° N, 73.2207° E",
    bestTime: "November - April",
    imageUrl: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=900&q=80",
    fallbackUrl: "https://picsum.photos/id/91/800/1000",
    info: locationDescriptions["Maldives beaches"] || ""
  },
  {
    id: 31,
    name: "Christ the Redeemer, Brazil",
    country: "Brazil",
    flag: "🇧🇷",
    region: "South America",
    coordinates: "22.9519° S, 43.2105° W",
    bestTime: "December - March, May - September",
    imageUrl: "https://images.unsplash.com/photo-1598970434795-0c54fe7c0648?auto=format&fit=crop&w=900&q=80",
    fallbackUrl: "https://picsum.photos/id/111/800/1000",
    info: locationDescriptions["Christ the Redeemer, Brazil"] || ""
  },
  {
    id: 32,
    name: "Table Mountain, South Africa",
    country: "South Africa",
    flag: "🇿🇦",
    region: "Africa",
    coordinates: "33.9628° S, 18.4098° E",
    bestTime: "November - March",
    imageUrl: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=900&q=80",
    fallbackUrl: "https://picsum.photos/id/112/800/1000",
    info: locationDescriptions["Table Mountain, South Africa"] || ""
  },
  {
    id: 33,
    name: "Neuschwanstein Castle, Germany",
    country: "Germany",
    flag: "🇩🇪",
    region: "Europe",
    coordinates: "47.5576° N, 10.7498° E",
    bestTime: "May - October",
    imageUrl: "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?auto=format&fit=crop&w=900&q=80",
    fallbackUrl: "https://picsum.photos/id/113/800/1000",
    info: locationDescriptions["Neuschwanstein Castle, Germany"] || ""
  },
  {
    id: 34,
    name: "St. Basil's Cathedral, Moscow",
    country: "Russia",
    flag: "🇷🇺",
    region: "Europe",
    coordinates: "55.7525° N, 37.6231° E",
    bestTime: "May - September",
    imageUrl: "https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?auto=format&fit=crop&w=900&q=80",
    fallbackUrl: "https://picsum.photos/id/114/800/1000",
    info: locationDescriptions["St. Basil's Cathedral, Moscow"] || ""
  },
  {
    id: 35,
    name: "Forbidden City, Beijing",
    country: "China",
    flag: "🇨🇳",
    region: "Asia",
    coordinates: "39.9163° N, 116.3972° E",
    bestTime: "September - October, April - May",
    imageUrl: "https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?auto=format&fit=crop&w=900&q=80",
    fallbackUrl: "https://picsum.photos/id/115/800/1000",
    info: locationDescriptions["Forbidden City, Beijing"] || ""
  },
  {
    id: 36,
    name: "Halong Bay, Vietnam",
    country: "Vietnam",
    flag: "🇻🇳",
    region: "Asia",
    coordinates: "20.9101° N, 107.1839° E",
    bestTime: "March - April, September - November",
    imageUrl: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=900&q=80",
    fallbackUrl: "https://picsum.photos/id/119/800/1000",
    info: locationDescriptions["Halong Bay, Vietnam"] || ""
  },
  {
    id: 37,
    name: "Times Square, New York at night",
    country: "United States",
    flag: "🇺🇸",
    region: "North America",
    coordinates: "40.7580° N, 73.9855° W",
    bestTime: "Year-round",
    imageUrl: "https://images.unsplash.com/photo-1534430480872-3498386e7856?auto=format&fit=crop&w=900&q=80",
    fallbackUrl: "https://picsum.photos/id/122/800/1000",
    info: locationDescriptions["Times Square, New York at night"] || ""
  },
  {
    id: 38,
    name: "Grand Canyon, Arizona",
    country: "United States",
    flag: "🇺🇸",
    region: "North America",
    coordinates: "36.0544° N, 112.1401° W",
    bestTime: "March - May, September - November",
    imageUrl: "https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?auto=format&fit=crop&w=900&q=80",
    fallbackUrl: "https://picsum.photos/id/129/800/1000",
    info: locationDescriptions["Grand Canyon, Arizona"] || ""
  },
  {
    id: 39,
    name: "Big Ben, London",
    country: "United Kingdom",
    flag: "🇬🇧",
    region: "Europe",
    coordinates: "51.5007° N, 0.1246° W",
    bestTime: "May - September",
    imageUrl: "https://images.unsplash.com/photo-1529655683826-aba9b3e77383?auto=format&fit=crop&w=900&q=80",
    fallbackUrl: "https://picsum.photos/id/133/800/1000",
    info: locationDescriptions["Big Ben, London"] || ""
  },
  {
    id: 40,
    name: "Louvre Museum pyramid, Paris",
    country: "France",
    flag: "🇫🇷",
    region: "Europe",
    coordinates: "48.8606° N, 2.3376° E",
    bestTime: "April - October",
    imageUrl: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=900&q=80",
    fallbackUrl: "https://picsum.photos/id/134/800/1000",
    info: locationDescriptions["Louvre Museum pyramid, Paris"] || ""
  },
  {
    id: 41,
    name: "Blue Lagoon, Iceland",
    country: "Iceland",
    flag: "🇮🇸",
    region: "Europe",
    coordinates: "63.8804° N, 22.4495° W",
    bestTime: "Year-round",
    imageUrl: "https://images.unsplash.com/photo-1529963183134-61a90db47eaf?auto=format&fit=crop&w=900&q=80",
    fallbackUrl: "https://picsum.photos/id/136/800/1000",
    info: locationDescriptions["Blue Lagoon, Iceland"] || ""
  },
  {
    id: 42,
    name: "Mount Kilimanjaro",
    country: "Tanzania",
    flag: "🇹🇿",
    region: "Africa",
    coordinates: "3.0674° S, 37.3556° E",
    bestTime: "January - March, June - October",
    imageUrl: "https://images.unsplash.com/photo-1589553416260-f586c8f1514f?auto=format&fit=crop&w=900&q=80",
    fallbackUrl: "https://picsum.photos/id/139/800/1000",
    info: locationDescriptions["Mount Kilimanjaro"] || ""
  },
  {
    id: 43,
    name: "Cinque Terre, Italy",
    country: "Italy",
    flag: "🇮🇹",
    region: "Europe",
    coordinates: "44.1461° N, 9.6439° E",
    bestTime: "May - September",
    imageUrl: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=900&q=80",
    fallbackUrl: "https://picsum.photos/id/142/800/1000",
    info: locationDescriptions["Cinque Terre, Italy"] || ""
  },
  {
    id: 44,
    name: "Lake Como, Italy",
    country: "Italy",
    flag: "🇮🇹",
    region: "Europe",
    coordinates: "45.9936° N, 9.2572° E",
    bestTime: "April - October",
    imageUrl: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=900&q=80",
    fallbackUrl: "https://picsum.photos/id/146/800/1000",
    info: locationDescriptions["Lake Como, Italy"] || ""
  },
  {
    id: 45,
    name: "The Alhambra, Spain",
    country: "Spain",
    flag: "🇪🇸",
    region: "Europe",
    coordinates: "37.1773° N, 3.5986° W",
    bestTime: "April - June, September - October",
    imageUrl: "https://images.unsplash.com/photo-1568084680786-a84f91d1153c?auto=format&fit=crop&w=900&q=80",
    fallbackUrl: "https://picsum.photos/id/152/800/1000",
    info: locationDescriptions["The Alhambra, Spain"] || ""
  },
  {
    id: 46,
    name: "Cappadocia hot air balloons, Turkey",
    country: "Turkey",
    flag: "🇹🇷",
    region: "Europe / Asia",
    coordinates: "38.6431° N, 34.8289° E",
    bestTime: "April - November",
    imageUrl: "https://images.unsplash.com/photo-1609865138885-a95f87a48d8d?auto=format&fit=crop&w=900&q=80",
    fallbackUrl: "https://picsum.photos/id/153/800/1000",
    info: locationDescriptions["Cappadocia hot air balloons, Turkey"] || ""
  },
  {
    id: 47,
    name: "Antelope Canyon, Arizona",
    country: "United States",
    flag: "🇺🇸",
    region: "North America",
    coordinates: "36.8619° N, 111.3743° W",
    bestTime: "March - October",
    imageUrl: "https://images.unsplash.com/photo-1492305175278-3b3afaa2f31f?auto=format&fit=crop&w=900&q=80",
    fallbackUrl: "https://picsum.photos/id/154/800/1000",
    info: locationDescriptions["Antelope Canyon, Arizona"] || ""
  }
];

export function getLocationByIndex(index: number): LocationItem {
  const safeIndex = ((index % LOCATIONS_LIST.length) + LOCATIONS_LIST.length) % LOCATIONS_LIST.length;
  return LOCATIONS_LIST[safeIndex];
}
