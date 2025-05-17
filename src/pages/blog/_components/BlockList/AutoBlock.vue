<template>
  <div
    :class="`relative flex flex-col justify-center w-full  ${
      !editMode && isDev ? 'hover:bg-neutral-800' : ''
    } ${isDev ? 'min-h-[1rem]' : ''}`"
    @mouseover="isHovering = true"
    @mouseleave="isHovering = false"
  >
    <component
      :is="getComponent(block.type)"
      :edit-mode="editMode"
      :block="block"
      :slugUrl="slugUrl"
    />

    <div
      v-if="isHovering && isDev"
      @mouseover="isHovering = true"
      @mouseleave="isHovering = false"
      class="absolute z-10 pt-[1rem] bottom-[-2.5rem] left-1"
    >
      <div
        class="shadow-xl shadow-neutral-900 flex items-center gap-3 w-fit px-3 bg-neutral-800 rounded-2xl font-semibold text-neutral-400"
      >
        <button
          @click="editMode = true"
          class="bg-blue-700 text-white rounded px-1 text-sm font-sans flex h-fit"
        >
          Editar
        </button>
        <button
          @click="removeBlock"
          class="bg-red-700 text-white rounded px-1 text-sm font-sans flex h-fit"
        >
          Eliminar
        </button>
        <span class="font-normal font-sans">Añadir:</span>
        <button
          class="font-serif text-lg hover:text-white"
          @click="onAddBlock(index, 'MarkdownBlock')"
          title="add text"
        >
          T
        </button>
        <button @click="onAddBlock(index, 'LinkBlock')" title="add link">
          🔗
        </button>
        <button @click="onAddBlock(index, 'ImageBlock')" title="add image">
          🖼️
        </button>
        <button
          class="font-sans hover:text-white"
          @click="onAddBlock(index, 'GiphyBlock')"
          title="add gif"
        >
          GIF
        </button>
        <button @click="onAddBlock(index, 'EmbedBlock')" title="add embedded">
          🌐
        </button>
        <button @click="onAddBlock(index, 'MapBlock')" title="add location">
          🗺️
        </button>
        <button
          class="hover:text-white"
          @click="onAddBlock(index, 'LiveCodeBlock')"
          title="add location"
        >
          {{ '<' + '/>' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import MarkdownBlock from './blocks/MarkdownBlock.vue'
import ImageBlock from './blocks/ImageBlock.vue'
import GiphyBlock from './blocks/GiphyBlock.vue'
import MapBlock from './blocks/MapBlock.vue'
import EmbedBlock from './blocks/EmbedBlock.vue'
import LiveCodeBlock from './blocks/LiveCodeBlock.vue'
import LinkBlock from './blocks/LinkBlock.vue'
import { onMounted, onUnmounted, ref } from 'vue'
import type { Block, BlockType } from '@src/pages/blog/_types/Blocks'

type Props = {
  slugUrl: string
  block: Block
  index: number
  removeBlock: () => void
  addBlock: (index: number, type: BlockType) => void
  isNew: boolean
}

const props = defineProps<Props>()
const editMode = ref(props.isNew)
const isHovering = ref(props.isNew)
const isDev = import.meta.env.DEV

function onAddBlock(index: number, type: BlockType) {
  editMode.value = false
  props.addBlock(index, type)
}

function getComponent(type: BlockType) {
  switch (type) {
    case 'MarkdownBlock':
      return MarkdownBlock
    case 'ImageBlock':
      return ImageBlock
    case 'GiphyBlock':
      return GiphyBlock
    case 'MapBlock':
      return MapBlock
    case 'EmbedBlock':
      return EmbedBlock
    case 'LiveCodeBlock':
      return LiveCodeBlock
    case 'LinkBlock':
      return LinkBlock
  }
}

const lastClick = ref(0)
function onClick() {
  if (isHovering.value) {
    const time = new Date().getTime()
    if (time - lastClick.value < 300 && editMode.value === false) {
      editMode.value = true
      document.getSelection()?.removeAllRanges()
    }
    lastClick.value = time
  } else {
    editMode.value = false
  }
}

onMounted(() => {
  if (isDev) window.addEventListener('click', onClick)
})

onUnmounted(() => {
  if (isDev) window.removeEventListener('click', onClick)
})
</script>
