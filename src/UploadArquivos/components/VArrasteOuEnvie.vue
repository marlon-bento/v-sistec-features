<!--
========
Componente unificado de upload por clique ou arrasto (VArrasteOuEnvie) para imagens e arquivos.
Mantém a classe .image-drop-zone exigida pelo v-required, adapta-se automaticamente aos temas
claro e escuro e aceita tanto as propriedades novas em português quanto as legadas do ICEI.
========
-->
<template>
  <div
    class="image-drop-zone v-arraste-ou-envie"
    :class="{
      'is-dragging': arrastandoSobre,
      'tem-preview': exibirPreviewImagem || exibirCardArquivo,
      'is-disabled': props.desabilitado
    }"
    @dragenter.prevent="aoEntrarArrasto"
    @dragover.prevent="aoEntrarArrasto"
    @dragleave.prevent="aoSairArrasto"
    @drop.prevent="aoSoltarArquivo"
    @click="acionarSeletorArquivo"
  >
    <input
      ref="inputArquivoRef"
      type="file"
      :accept="listaMimeTypes.join(',')"
      :disabled="props.desabilitado"
      style="display: none;"
      @change="aoSelecionarInput"
    />

    <!-- ESTADO 1: Vazio -->
    <div v-if="!exibirPreviewImagem && !exibirCardArquivo" class="dropzone-prompt">
      <div class="icone-upload-circulo">
        <IconCloudUpload :size="26" stroke="1.8" />
      </div>
      <div class="texto-principal-dropzone fw-semibold">
        {{ arrastandoSobre ? textoSoltarFinal : textoArrastarFinal }}
      </div>
      <div class="subtexto-dropzone small">
        {{ subtextoFinal }}
      </div>
    </div>

    <!-- ESTADO 2: Pré-visualização de Imagem -->
    <div v-else-if="exibirPreviewImagem" class="preview-imagem-wrapper">
      <img :src="urlImagemAtiva || ''" alt="" class="preview-img-fundo" aria-hidden="true" />
      <img :src="urlImagemAtiva || ''" alt="Pré-visualização" class="preview-img-principal" />

      <div class="barra-topo-preview">
        <span class="badge-estado-imagem">
          {{ urlPreviewBlob ? 'Nova imagem selecionada' : 'Imagem atual' }}
        </span>

        <div class="acoes-preview" @click.stop>
          <button
            type="button"
            class="btn-acao-preview"
            title="Trocar imagem"
            :disabled="props.desabilitado"
            @click="forcarAberturaSeletor"
          >
            <IconReplace :size="16" stroke="2" />
            <span>Trocar</span>
          </button>

          <button
            v-if="urlPreviewBlob"
            type="button"
            class="btn-acao-preview btn-acao-remover"
            title="Remover seleção"
            :disabled="props.desabilitado"
            @click="removerArquivo"
          >
            <IconTrash :size="16" stroke="2" />
            <span>Remover</span>
          </button>
        </div>
      </div>

      <div v-if="ehObjetoFile" class="rodape-metadados-preview">
        <span class="text-truncate">{{ nomeArquivoFormatado }}</span>
        <span class="badge-tamanho">{{ tamanhoArquivoFormatado }}</span>
      </div>
    </div>

    <!-- ESTADO 3: Pré-visualização de Documento/Arquivo -->
    <div v-else-if="exibirCardArquivo" class="preview-arquivo-card" @click.stop>
      <div class="icone-arquivo-box">
        <IconFileDescription :size="28" stroke="1.8" />
      </div>

      <div class="info-arquivo-textos min-w-0 flex-grow-1 text-start">
        <div class="fw-semibold text-truncate" :title="nomeArquivoFormatado">
          {{ nomeArquivoFormatado }}
        </div>
        <div class="text-secondary small">
          {{ tamanhoArquivoFormatado }}
        </div>
      </div>

      <div class="d-flex align-items-center gap-2">
        <button
          type="button"
          class="btn-acao-preview"
          title="Trocar arquivo"
          :disabled="props.desabilitado"
          @click="forcarAberturaSeletor"
        >
          <IconReplace :size="16" stroke="2" />
        </button>
        <button
          type="button"
          class="btn-acao-preview btn-acao-remover"
          title="Remover arquivo"
          :disabled="props.desabilitado"
          @click="removerArquivo"
        >
          <IconTrash :size="16" stroke="2" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue';
import {
  IconCloudUpload,
  IconTrash,
  IconReplace,
  IconFileDescription
} from '@tabler/icons-vue';
import type { ModoUploadArquivo } from '../types/upload';

const props = withDefaults(defineProps<{
  modelValue?: File | string | null;
  modo?: ModoUploadArquivo;
  urlInicial?: string | null;
  initialDisplayImageUrl?: string | null;
  initialDisplayarquivoUrl?: string | null;
  textoArrastar?: string;
  textToDrag?: string;
  textoSoltar?: string;
  textToDrop?: string;
  subtexto?: string;
  subText?: string;
  tiposAceitos?: string[];
  acceptedMimeTypes?: string[];
  tamanhoMaximoMb?: number | null;
  desabilitado?: boolean;
  transformarUrl?: ((url: string) => string) | null;
}>(), {
  modelValue: null,
  modo: 'auto',
  urlInicial: null,
  initialDisplayImageUrl: null,
  initialDisplayarquivoUrl: null,
  textoArrastar: '',
  textToDrag: '',
  textoSoltar: '',
  textToDrop: '',
  subtexto: '',
  subText: '',
  tiposAceitos: undefined,
  acceptedMimeTypes: undefined,
  tamanhoMaximoMb: null,
  desabilitado: false,
  transformarUrl: null
});

const emit = defineEmits<{
  (e: 'update:modelValue', valor: File | string | null): void;
  (e: 'error', codigo: string, mensagem: string): void;
}>();

const inputArquivoRef = ref<HTMLInputElement | null>(null);
const urlPreviewBlob = ref<string | null>(null);
const arrastandoSobre = ref(false);

const listaMimeTypes = computed<string[]>(() => {
  if (props.tiposAceitos && props.tiposAceitos.length > 0) return props.tiposAceitos;
  if (props.acceptedMimeTypes && props.acceptedMimeTypes.length > 0) return props.acceptedMimeTypes;
  if (props.modo === 'arquivo') {
    return [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
  }
  return ['image/jpeg', 'image/png', 'image/gif', 'image/jpg', 'image/webp'];
});

const textoArrastarFinal = computed(
  () => props.textoArrastar || props.textToDrag || 'Arraste uma imagem ou clique para selecionar'
);
const textoSoltarFinal = computed(
  () => props.textoSoltar || props.textToDrop || 'Solte o arquivo aqui!'
);
const subtextoFinal = computed(
  () => props.subtexto || props.subText || '(JPG, JPEG, PNG, GIF)'
);

const ehObjetoFile = computed(() => typeof File !== 'undefined' && props.modelValue instanceof File);

const ehArquivoDeImagem = computed(() => {
  if (props.modo === 'imagem') return true;
  if (props.modo === 'arquivo') return false;
  if (ehObjetoFile.value) {
    return (props.modelValue as File).type.startsWith('image/');
  }
  return listaMimeTypes.value.every((t) => t.startsWith('image/'));
});

const urlRemotaResolvida = computed<string | null>(() => {
  const bruta = props.urlInicial || props.initialDisplayImageUrl || props.initialDisplayarquivoUrl || null;
  if (!bruta) return null;
  if (typeof props.transformarUrl === 'function') {
    return props.transformarUrl(bruta);
  }
  return bruta;
});

const urlImagemAtiva = computed<string | null>(() => {
  if (urlPreviewBlob.value && ehArquivoDeImagem.value) {
    return urlPreviewBlob.value;
  }
  if (!props.modelValue && urlRemotaResolvida.value) {
    return urlRemotaResolvida.value;
  }
  return null;
});

const exibirPreviewImagem = computed(() => Boolean(urlImagemAtiva.value));
const exibirCardArquivo = computed(() => Boolean(ehObjetoFile.value && !ehArquivoDeImagem.value));

const nomeArquivoFormatado = computed(() => {
  if (!ehObjetoFile.value) return 'Arquivo selecionado';
  return (props.modelValue as File).name;
});

const tamanhoArquivoFormatado = computed(() => {
  if (!ehObjetoFile.value) return '';
  const bytes = (props.modelValue as File).size;
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
});

function limparBlobLocal() {
  if (urlPreviewBlob.value && urlPreviewBlob.value.startsWith('blob:')) {
    URL.revokeObjectURL(urlPreviewBlob.value);
  }
  urlPreviewBlob.value = null;
}

function limparEstadoInterno() {
  limparBlobLocal();
  if (inputArquivoRef.value) {
    inputArquivoRef.value.value = '';
  }
}

function gerarPreviewLocal(arquivo: File) {
  limparBlobLocal();
  urlPreviewBlob.value = URL.createObjectURL(arquivo);
}

function processarArquivo(arquivo?: File) {
  if (!arquivo || props.desabilitado) return;

  if (!listaMimeTypes.value.includes(arquivo.type)) {
    const extensoesAmigaveis = listaMimeTypes.value
      .map((mime) => (mime.includes('/') ? mime.split('/')[1]?.toUpperCase() || '' : mime.toUpperCase()))
      .filter(Boolean)
      .join(', ');

    const tipoRecebido = arquivo.type.split('/')[1]?.toUpperCase() || 'DESCONHECIDO';
    const msg = `Tipo de arquivo inválido (${tipoRecebido}). Use com extensão ${extensoesAmigaveis}.`;
    emit('error', 'tipo_invalido', msg);
    limparEstadoInterno();
    emit('update:modelValue', null);
    return;
  }

  if (props.tamanhoMaximoMb && arquivo.size > props.tamanhoMaximoMb * 1024 * 1024) {
    emit(
      'error',
      'tamanho_excedido',
      `O arquivo excede o tamanho máximo permitido de ${props.tamanhoMaximoMb} MB.`
    );
    limparEstadoInterno();
    emit('update:modelValue', null);
    return;
  }

  gerarPreviewLocal(arquivo);
  emit('update:modelValue', arquivo);
}

function aoEntrarArrasto() {
  if (!props.desabilitado) arrastandoSobre.value = true;
}

function aoSairArrasto(evento: DragEvent) {
  const atual = evento.currentTarget as HTMLElement | null;
  const relacionado = evento.relatedTarget as Node | null;
  if (atual && relacionado && atual.contains(relacionado)) return;
  arrastandoSobre.value = false;
}

function aoSoltarArquivo(evento: DragEvent) {
  arrastandoSobre.value = false;
  if (props.desabilitado) return;
  const arquivos = evento.dataTransfer?.files;
  if (arquivos && arquivos.length > 0) {
    processarArquivo(arquivos[0]);
  }
}

function acionarSeletorArquivo() {
  if (props.desabilitado) return;
  if (!exibirPreviewImagem.value && !exibirCardArquivo.value) {
    inputArquivoRef.value?.click();
  }
}

function forcarAberturaSeletor() {
  if (props.desabilitado) return;
  inputArquivoRef.value?.click();
}

function aoSelecionarInput(evento: Event) {
  const alvo = evento.target as HTMLInputElement;
  if (alvo.files && alvo.files.length > 0) {
    processarArquivo(alvo.files[0]);
  }
}

function removerArquivo() {
  limparEstadoInterno();
  emit('update:modelValue', null);
}

watch(
  () => props.modelValue,
  (novoValor) => {
    if (typeof File !== 'undefined' && novoValor instanceof File) {
      if (!urlPreviewBlob.value) {
        gerarPreviewLocal(novoValor);
      }
    } else if (!novoValor) {
      limparEstadoInterno();
    }
  },
  { immediate: true }
);

onUnmounted(() => {
  limparBlobLocal();
});

defineExpose({
  clearFile: removerArquivo,
  openFilePicker: forcarAberturaSeletor
});
</script>

<style scoped>
.v-arraste-ou-envie {
  position: relative;
  min-height: 165px;
  border: 2px dashed var(--border-editor, var(--tblr-border-color, #cbd5e1));
  border-radius: 10px;
  background-color: color-mix(in srgb, var(--bg-secondary, var(--tblr-bg-surface-secondary, #f8fafc)) 65%, transparent);
  color: var(--text-primary, var(--tblr-body-color, #1e293b));
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 18px;
  text-align: center;
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
}

.v-arraste-ou-envie:hover:not(.is-disabled):not(.tem-preview) {
  border-color: var(--tblr-primary, #206bc4);
  background-color: color-mix(in srgb, var(--tblr-primary, #206bc4) 6%, transparent);
}

.v-arraste-ou-envie.is-dragging {
  border-color: var(--tblr-primary, #206bc4) !important;
  background-color: color-mix(in srgb, var(--tblr-primary, #206bc4) 12%, transparent) !important;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--tblr-primary, #206bc4) 18%, transparent);
}

.v-arraste-ou-envie.tem-preview {
  padding: 0;
  border-style: solid;
  cursor: default;
}

.v-arraste-ou-envie.is-disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.dropzone-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  max-width: 340px;
}

.icone-upload-circulo {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
  color: var(--tblr-primary, #206bc4);
  background: color-mix(in srgb, var(--tblr-primary, #206bc4) 12%, transparent);
  transition: transform 0.2s ease;
}

.v-arraste-ou-envie:hover .icone-upload-circulo {
  transform: translateY(-2px);
}

.texto-principal-dropzone {
  font-size: 0.92rem;
  line-height: 1.35;
  color: var(--text-primary, var(--tblr-body-color));
}

.subtexto-dropzone {
  color: var(--text-secondary, var(--tblr-secondary, #64748b));
  font-size: 0.78rem;
}

.preview-imagem-wrapper {
  position: relative;
  width: 100%;
  height: 210px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #0f172a;
}

.preview-img-fundo {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: blur(14px) brightness(0.45);
  transform: scale(1.1);
  pointer-events: none;
}

.preview-img-principal {
  position: relative;
  z-index: 1;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.barra-topo-preview {
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.badge-estado-imagem {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
  color: #ffffff;
  background: rgba(15, 23, 42, 0.72);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.16);
}

.acoes-preview {
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-acao-preview {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 7px;
  font-size: 0.76rem;
  font-weight: 600;
  color: #ffffff;
  background: rgba(15, 23, 42, 0.78);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  cursor: pointer;
  transition: background-color 0.15s ease, transform 0.1s ease;
}

.btn-acao-preview:hover:not(:disabled) {
  background: var(--tblr-primary, #206bc4);
  border-color: var(--tblr-primary, #206bc4);
}

.btn-acao-remover {
  background: rgba(220, 38, 38, 0.85);
  border-color: rgba(255, 255, 255, 0.2);
}

.btn-acao-remover:hover:not(:disabled) {
  background: #dc2626 !important;
  border-color: #dc2626 !important;
}

.rodape-metadados-preview {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 3;
  padding: 6px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 0.75rem;
  color: #f8fafc;
  background: linear-gradient(to top, rgba(2, 6, 23, 0.85), transparent);
}

.badge-tamanho {
  font-variant-numeric: tabular-nums;
  opacity: 0.85;
  flex-shrink: 0;
}

.preview-arquivo-card {
  width: 100%;
  padding: 16px 18px;
  display: flex;
  align-items: center;
  gap: 14px;
}

.icone-arquivo-box {
  width: 46px;
  height: 46px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--tblr-primary, #206bc4);
  background: color-mix(in srgb, var(--tblr-primary, #206bc4) 12%, transparent);
  flex-shrink: 0;
}
</style>