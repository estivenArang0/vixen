export interface BannerSlide {
  title: string;
  subtitle: string;
  bg: string;
  position: string;
  height: string;
}

const DEFAULT_SLIDES: BannerSlide[] = [
  {
    title: 'Descubre tu estilo',
    subtitle: 'Los mejores bodis y blusas con entrega rápida.',
    bg: 'https://i.imgur.com/kUyyqId.png',
    position: '50% 40%',
    height: '250px',
  },
  {
    title: 'Nueva colección',
    subtitle: 'Conjuntos exclusivos para mujeres elegantes.',
    bg: 'https://i.imgur.com/kUyyqId.png',
    position: '50% 50%',
    height: '250px',
  },
  {
    title: 'Envío a todo Colombia',
    subtitle: 'Recibe tu pedido en la puerta de tu casa.',
    bg: 'https://i.imgur.com/WPNaUHY.jpeg',
    position: '50% 75%',
    height: '250px',
  },
];

const STORAGE_KEY = 'Vixen_banners';

export function getSlides(): BannerSlide[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_SLIDES;
  } catch {
    return DEFAULT_SLIDES;
  }
}

export function saveSlides(slides: BannerSlide[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(slides));
}