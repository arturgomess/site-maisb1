export type DaySchedule = {
  label: string;
  open: string;
  close: string;
  text: string;
};

export type StoreUnit = {
  id: string;
  name: string;
  shortName: string;
  address: string;
  category: string;
  services: string[];
  subbrands: string[];
  rating: string;
  reviewsCount: string;
  image: string;
  thumbOnline: string;
  mapsUrl: string;
  latitude: number;
  longitude: number;
  schedule: Record<number, DaySchedule>;
  instagramUrl?: string;
  facebookUrl?: string;
};

export const storeUnits: readonly StoreUnit[] = [
  {
    id: 'alcindo',
    name: '+B SUPERMERCADOS (ALCINDO CACELA)',
    shortName: '+B Supermercados (Alcindo Cacela)',
    address: 'Av. Alcindo Cacela, 1848',
    category: '+B Supermercados',
    services: ['SUPERMERCADOS +B', 'THE WINE EXPERIENCE', '+B FARMA'],
    subbrands: ['SUPERMERCADOS +B', 'THE WINE EXPERIENCE', '+B FARMA'],
    rating: '4,8',
    reviewsCount: '1.240',
    image: 'Fotografias/Supermercado +B/00_CardHome/1-foto-supermercado.webp',
    thumbOnline: 'https://www.grupomaisbarato.com.br/assets/Fotografias/Supermercado%20+B/00_CardHome/1-foto-supermercado.webp',
    mapsUrl: 'https://maps.app.goo.gl/BUbRXApXKgTSYXKG8',
    instagramUrl: 'https://www.instagram.com/maisbsupermercados',
    facebookUrl: 'https://www.facebook.com/maisbsupermercados',
    latitude: -1.4516,
    longitude: -48.4779,
    schedule: {
      0: { label: 'domingo', open: '07:00', close: '20:00', text: '07:00–20:00' },
      1: { label: 'segunda-feira', open: '07:00', close: '22:00', text: '07:00–22:00' },
      2: { label: 'terça-feira', open: '07:00', close: '22:00', text: '07:00–22:00' },
      3: { label: 'quarta-feira', open: '07:00', close: '22:00', text: '07:00–22:00' },
      4: { label: 'quinta-feira', open: '07:00', close: '22:00', text: '07:00–22:00' },
      5: { label: 'sexta-feira', open: '07:00', close: '22:00', text: '07:00–22:00' },
      6: { label: 'sábado', open: '07:00', close: '22:00', text: '07:00–22:00' },
    },
  },
  {
    id: 'tapana',
    name: '+B SUPERMERCADOS (TAPANÃ)',
    shortName: '+B Supermercados (Tapanã)',
    address: 'Rod. Tapanã, 597',
    category: '+B Supermercados',
    services: ['SUPERMERCADOS +B', '+B FARMA'],
    subbrands: ['SUPERMERCADOS +B', '+B FARMA'],
    rating: '4,5',
    reviewsCount: '850',
    image: 'Fotografias/Supermercado +B/00_CardHome/2-foto-supermercado.webp',
    thumbOnline: 'https://www.grupomaisbarato.com.br/assets/Fotografias/Supermercado%20+B/00_CardHome/2-foto-supermercado.webp',
    mapsUrl: 'https://maps.app.goo.gl/aKm2MGrDTNMum9nk7',
    instagramUrl: 'https://www.instagram.com/maisbsupermercados',
    facebookUrl: 'https://www.facebook.com/maisbsupermercados',
    latitude: -1.353381,
    longitude: -48.468711,
    schedule: {
      0: { label: 'domingo', open: '08:00', close: '14:00', text: '08:00–14:00' },
      1: { label: 'segunda-feira', open: '07:00', close: '21:00', text: '07:00–21:00' },
      2: { label: 'terça-feira', open: '07:00', close: '21:00', text: '07:00–21:00' },
      3: { label: 'quarta-feira', open: '07:00', close: '21:00', text: '07:00–21:00' },
      4: { label: 'quinta-feira', open: '07:00', close: '21:00', text: '07:00–21:00' },
      5: { label: 'sexta-feira', open: '07:00', close: '21:00', text: '07:00–21:00' },
      6: { label: 'sábado', open: '07:00', close: '21:00', text: '07:00–21:00' },
    },
  },
  {
    id: 'plaza',
    name: '+B SUPERMERCADOS (PLAZA)',
    shortName: '+B Supermercados (Plaza)',
    address: 'Av. Gov. José Malcher, 2388',
    category: '+B Supermercados',
    services: ['SUPERMERCADOS +B', 'VILLA PLAZA', 'VILLA PLAZA PARK', '+B FARMA'],
    subbrands: ['SUPERMERCADOS +B', 'VILLA PLAZA', 'VILLA PLAZA PARK', '+B FARMA'],
    rating: '4,2',
    reviewsCount: '6.740',
    image: 'Fotografias/Supermercado +B/00_CardHome/3-foto-supermercado.webp',
    thumbOnline: 'https://www.grupomaisbarato.com.br/assets/Fotografias/Supermercado%20+B/00_CardHome/3-foto-supermercado.webp',
    mapsUrl: 'https://maps.app.goo.gl/wHYfn9JPun4pZ28Z8',
    instagramUrl: 'https://www.instagram.com/maisbsupermercados',
    facebookUrl: 'https://www.facebook.com/maisbsupermercados',
    latitude: -1.448574,
    longitude: -48.473539,
    schedule: {
      0: { label: 'domingo', open: '07:30', close: '21:00', text: '07:30–21:00' },
      1: { label: 'segunda-feira', open: '07:00', close: '22:00', text: '07:00–22:00' },
      2: { label: 'terça-feira', open: '07:00', close: '22:00', text: '07:00–22:00' },
      3: { label: 'quarta-feira', open: '07:00', close: '22:00', text: '07:00–22:00' },
      4: { label: 'quinta-feira', open: '07:00', close: '22:00', text: '07:00–22:00' },
      5: { label: 'sexta-feira', open: '07:00', close: '22:00', text: '07:00–22:00' },
      6: { label: 'sábado', open: '07:00', close: '22:00', text: '07:00–22:00' },
    },
  },
  {
    id: 'villa-plaza-park',
    name: 'VILLA PLAZA PARK',
    shortName: 'Villa Plaza Park',
    address: 'Av. Gov. José Malcher, 2388',
    category: 'Villa Plaza Park',
    services: ['VILLA PLAZA PARK', 'LAZER & INFANTIL'],
    subbrands: ['VILLA PLAZA PARK', 'VILLA PLAZA'],
    rating: '4,7',
    reviewsCount: '380',
    image: 'Fotografias/Villa Plaza (Park Infantil)/foto-park-infantil (1).webp',
    thumbOnline: 'https://www.grupomaisbarato.com.br/assets/Fotografias/Villa%20Plaza%20(Park%20Infantil)/foto-park-infantil%20(1).webp',
    mapsUrl: 'https://maps.app.goo.gl/Kddc5dd9eqmiSmWFA',
    instagramUrl: 'https://www.instagram.com/villaplazapark/',
    facebookUrl: 'https://www.facebook.com/people/Villa-Park-Plaza/61574115326244/',
    latitude: -1.4484939,
    longitude: -48.4721471,
    schedule: {
      0: { label: 'domingo', open: '16:00', close: '22:00', text: '16:00–22:00' },
      1: { label: 'segunda-feira', open: '16:00', close: '22:00', text: '16:00–22:00' },
      2: { label: 'terça-feira', open: '16:00', close: '22:00', text: '16:00–22:00' },
      3: { label: 'quarta-feira', open: '16:00', close: '22:00', text: '16:00–22:00' },
      4: { label: 'quinta-feira', open: '16:00', close: '22:00', text: '16:00–22:00' },
      5: { label: 'sexta-feira', open: '16:00', close: '22:00', text: '16:00–22:00' },
      6: { label: 'sábado', open: '16:00', close: '22:00', text: '16:00–22:00' },
    },
  },
  {
    id: 'restaurante-villa-plaza',
    name: 'RESTAURANTE VILLA PLAZA',
    shortName: 'Restaurante Villa Plaza',
    address: 'Av. Gov. José Malcher, 2388',
    category: 'Villa Plaza',
    services: ['VILLA PLAZA', 'RESTAURANTE & BUFFET'],
    subbrands: ['VILLA PLAZA', 'RESTAURANTE'],
    rating: '4,6',
    reviewsCount: '420',
    image: 'Fotografias/Villa Plaza (Restaurante)/vila-plaza-restaurante-ambiente.webp',
    thumbOnline: 'https://www.grupomaisbarato.com.br/assets/Fotografias/Villa%20Plaza%20(Restaurante)/vila-plaza-restaurante-ambiente.webp',
    mapsUrl: 'https://maps.app.goo.gl/mGVgZy3jEXLZcyBD7',
    instagramUrl: 'https://www.instagram.com/villaplazabelem/',
    facebookUrl: 'https://www.facebook.com/villaplazabelem/',
    latitude: -1.4486161,
    longitude: -48.4717386,
    schedule: {
      0: { label: 'domingo', open: '11:30', close: '22:00', text: '11:30–22:00' },
      1: { label: 'segunda-feira', open: '11:30', close: '22:00', text: '11:30–22:00' },
      2: { label: 'terça-feira', open: '11:30', close: '22:00', text: '11:30–22:00' },
      3: { label: 'quarta-feira', open: '11:30', close: '22:00', text: '11:30–22:00' },
      4: { label: 'quinta-feira', open: '11:30', close: '22:00', text: '11:30–22:00' },
      5: { label: 'sexta-feira', open: '11:30', close: '22:00', text: '11:30–22:00' },
      6: { label: 'sábado', open: '11:30', close: '22:00', text: '11:30–22:00' },
    },
  },
  {
    id: 'the-wine-experience',
    name: 'THE WINE EXPERIENCE',
    shortName: 'The Wine Experience',
    address: 'Av. Alcindo Cacela, 1848',
    category: 'The Wine Experience',
    services: ['THE WINE EXPERIENCE', 'VINHOS & GASTRONOMIA'],
    subbrands: ['THE WINE EXPERIENCE'],
    rating: '4,9',
    reviewsCount: '290',
    image: 'Fotografias/The Wine Experience/salao-principal-clientes.webp',
    thumbOnline: 'https://www.grupomaisbarato.com.br/assets/Fotografias/The%20Wine%20Experience/salao-principal-clientes.webp',
    mapsUrl: 'https://maps.app.goo.gl/c4pED9jGM82CZ5w39',
    instagramUrl: 'https://www.instagram.com/thewinebelem/',
    facebookUrl: 'https://www.facebook.com/thewinebelem',
    latitude: -1.4528985,
    longitude: -48.4777266,
    schedule: {
      0: { label: 'domingo', open: '10:00', close: '20:00', text: '10:00–20:00' },
      1: { label: 'segunda-feira', open: '10:00', close: '22:00', text: '10:00–22:00' },
      2: { label: 'terça-feira', open: '10:00', close: '22:00', text: '10:00–22:00' },
      3: { label: 'quarta-feira', open: '10:00', close: '22:00', text: '10:00–22:00' },
      4: { label: 'quinta-feira', open: '10:00', close: '22:00', text: '10:00–22:00' },
      5: { label: 'sexta-feira', open: '10:00', close: '22:00', text: '10:00–22:00' },
      6: { label: 'sábado', open: '10:00', close: '22:00', text: '10:00–22:00' },
    },
  },
  {
    id: 'farma-plaza',
    name: '+B FARMA (PLAZA)',
    shortName: '+B Farma (Plaza)',
    address: 'Av. Gov. José Malcher, 2388',
    category: '+B Farma',
    services: ['+B FARMA', 'FARMÁCIA & SAÚDE'],
    subbrands: ['+B FARMA'],
    rating: '4,6',
    reviewsCount: '210',
    image: 'Fotografias/Mais B Farma/foto-banner-maisb-farmacia.webp',
    thumbOnline: 'https://www.grupomaisbarato.com.br/assets/Fotografias/Mais%20B%20Farma/foto-banner-maisb-farmacia.webp',
    mapsUrl: 'https://maps.app.goo.gl/6CKT62iiSHVMG8eB9',
    instagramUrl: 'https://www.instagram.com/maisbfarma/',
    facebookUrl: 'https://www.facebook.com/maisbfarmapa/',
    latitude: -1.4484939,
    longitude: -48.4721471,
    schedule: {
      0: { label: 'domingo', open: '07:30', close: '21:00', text: '07:30–21:00' },
      1: { label: 'segunda-feira', open: '07:00', close: '22:00', text: '07:00–22:00' },
      2: { label: 'terça-feira', open: '07:00', close: '22:00', text: '07:00–22:00' },
      3: { label: 'quarta-feira', open: '07:00', close: '22:00', text: '07:00–22:00' },
      4: { label: 'quinta-feira', open: '07:00', close: '22:00', text: '07:00–22:00' },
      5: { label: 'sexta-feira', open: '07:00', close: '22:00', text: '07:00–22:00' },
      6: { label: 'sábado', open: '07:00', close: '22:00', text: '07:00–22:00' },
    },
  },
  {
    id: 'farma-tapana',
    name: '+B FARMA (TAPANÃ)',
    shortName: '+B Farma (Tapanã)',
    address: 'Rod. Tapanã, 597',
    category: '+B Farma',
    services: ['+B FARMA', 'FARMÁCIA & SAÚDE'],
    subbrands: ['+B FARMA'],
    rating: '4,5',
    reviewsCount: '150',
    image: 'Fotografias/Mais B Farma/foto-farma-b (1).webp',
    thumbOnline: 'https://www.grupomaisbarato.com.br/assets/Fotografias/Mais%20B%20Farma/foto-farma-b%20(1).webp',
    mapsUrl: 'https://maps.app.goo.gl/xpZyG2ypdfeMRAMH8',
    instagramUrl: 'https://www.instagram.com/maisbfarma/',
    facebookUrl: 'https://www.facebook.com/maisbfarmapa/',
    latitude: -1.3458206,
    longitude: -48.4679503,
    schedule: {
      0: { label: 'domingo', open: '08:00', close: '14:00', text: '08:00–14:00' },
      1: { label: 'segunda-feira', open: '07:00', close: '21:00', text: '07:00–21:00' },
      2: { label: 'terça-feira', open: '07:00', close: '21:00', text: '07:00–21:00' },
      3: { label: 'quarta-feira', open: '07:00', close: '21:00', text: '07:00–21:00' },
      4: { label: 'quinta-feira', open: '07:00', close: '21:00', text: '07:00–21:00' },
      5: { label: 'sexta-feira', open: '07:00', close: '21:00', text: '07:00–21:00' },
      6: { label: 'sábado', open: '07:00', close: '21:00', text: '07:00–21:00' },
    },
  },
];

export function getStoreUnit(id: string): StoreUnit | undefined {
  return storeUnits.find((unit) => unit.id === id);
}
