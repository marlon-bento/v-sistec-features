/*
========
Definições de tipos para o componente de upload e arrasto de arquivos (VDropzone).
Mantém suporte às propriedades em português e aos aliases legados (ArrasteOuEnvie).
========
*/

export type ModoUploadArquivo = 'imagem' | 'arquivo' | 'auto';

export interface PropriedadesDropzone {
  modelValue?: File | string | null;
  modo?: ModoUploadArquivo;
  /** URL da imagem ou arquivo já salvo no servidor (retrocompatível com initialDisplayImageUrl) */
  urlInicial?: string | null;
  initialDisplayImageUrl?: string | null;
  initialDisplayarquivoUrl?: string | null;
  /** Textos customizáveis (com aliases legados) */
  textoArrastar?: string;
  textToDrag?: string;
  textoSoltar?: string;
  textToDrop?: string;
  subtexto?: string;
  subText?: string;
  /** Validações de formato e tamanho */
  tiposAceitos?: string[];
  acceptedMimeTypes?: string[];
  tamanhoMaximoMb?: number | null;
  desabilitado?: boolean;
  transformarUrl?: ((url: string | null) => string | null) | null;
}