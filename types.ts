
export type CardTone = 'Heartfelt' | 'Funny' | 'Professional' | 'Poetic' | 'Short & Sweet';
export type FrameStyle = 'Classic' | 'Candy Cane' | 'Winter Frost';

export interface CardData {
  recipient: string;
  sender: string;
  tone: CardTone;
  frameStyle: FrameStyle;
  message: string;
  imageUrl?: string;
  isGeneratingMessage: boolean;
  isGeneratingImage: boolean;
}

export interface AppState {
  card: CardData;
  isCustomizing: boolean;
}
