import { ref, computed, type CSSProperties } from 'vue';

export function useImagePreview() {
  
  const isHovering = ref<boolean>(false);
  const previewSrc = ref<string>('');
  const previewX = ref<number>(0);
  const previewY = ref<number>(0);

  const previewStyle = computed<CSSProperties>(() => ({
    position: 'fixed',
    zIndex: 9999,
    pointerEvents: 'none',
    top: `${previewY.value + 15}px`,
    left: `${previewX.value + 15}px`,
  }));

  function updatePreviewPosition(event: MouseEvent): void {
    const cursorX = event.clientX;
    const cursorY = event.clientY;
    const viewportHeight = window.innerHeight;
    const offset = 15;
    const previewHeight = 300; // Altura máxima estimada

    let newY = cursorY + offset;

    if (newY + previewHeight > viewportHeight) {
      newY = cursorY - previewHeight - offset;
      if (newY < 0) {
        newY = 0;
      }
    }
    previewX.value = cursorX;
    previewY.value = newY;
  }

  function handleMouseOver(event: MouseEvent, src: string): void {
    isHovering.value = true;
    previewSrc.value = src;
    updatePreviewPosition(event);
  }

  function handleMouseMove(event: MouseEvent): void {
    if (isHovering.value) {
      updatePreviewPosition(event);
    }
  }

  function handleMouseLeave(): void {
    isHovering.value = false;
  }

  return {
    isHovering,
    previewSrc,
    previewStyle,
    handleMouseOver,
    handleMouseMove,
    handleMouseLeave,
  };
}