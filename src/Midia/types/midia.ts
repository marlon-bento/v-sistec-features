/*
========
Definições de tipos e interfaces para os componentes de mídia (VImagemBlur e VCarrossel)
da biblioteca v-sistec-features.
========
*/

export type TipoMidiaCarrossel = 1 | 2 | 'imagem' | 'video';

export interface ItemMidiaCarrossel {
  id?: string | number;
  // Aceita 1 ou 'imagem' para fotos, e 2 ou 'video' para vídeos do YouTube
  tipo?: TipoMidiaCarrossel;
  type?: number | string;
  // URL principal da mídia ou ID do vídeo
  src?: string;
  media?: string;
  image_url?: string;
  video_id?: string;
  // Suporte específico para banners responsivos (Desktop / Mobile)
  srcDesktop?: string;
  srcMobile?: string;
  media_web?: string;
  media_mobile?: string;
  // Link de redirecionamento ao clicar no slide e textos descritivos
  url?: string;
  alt?: string;
  titulo?: string;
}