<template>
  <div
    :class="`w-full flex flex-col items-center bg-black bg-opacity-30 ${
      editMode ? 'edit-block' : ''
    }`"
  >
    <div class="flex flex-col w-full">
      <div class="w-full p-2 flex flex-col font-sans" v-if="editMode">
        Usefull templates:
        <ul>
          <li>https://www.youtube.com/embed/__id__</li>
          <li>https://www.instagram.com/_path_/embed</li>
        </ul>
        <input
          class="w-full px-2"
          type="text"
          v-model="url"
          placeholder="http://example.com/"
        />
        <div class="flex w-full gap-1 px-2">
          Height:
          <label>
            <input type="radio" value="base" v-model="heightProp" />
            Base
          </label>
          <label>
            <input type="radio" value="large" v-model="heightProp" />
            Large
          </label>
          <label>
            <input type="radio" value="extra-large" v-model="heightProp" />
            Extra large
          </label>
        </div>
        <div class="flex w-full gap-1 px-2">
          Width:
          <label>
            <input type="radio" value="small" v-model="widthProp" />
            Small
          </label>
          <label>
            <input type="radio" value="full" v-model="widthProp" />
            Full
          </label>
        </div>
        <div class="flex w-full gap-1 px-2">
          Scale:
          <label>
            <input type="radio" value="0.8" v-model="scaleProp" />
            80%
          </label>
          <label>
            <input type="radio" value="1" v-model="scaleProp" />
            100%
          </label>
        </div>
      </div>
    </div class="flex flex-col w-full">
    <iframe
      :src="url"
      frameborder="0"
      allowfullscreen
      scrolling="auto"
      :class="frameStyles"
    />
  </div>
</template>

<script setup lang="ts">
import type { Block } from '@src/pages/blog/_types/Blocks';
import { computed } from 'vue'

const BLOCK_SEPARATOR = '$eb-sep$'
type HeightSize = 'base' | 'large' | 'extra-large'
type WidthSize = 'full' | 'small'
type Scale = '0.8' | '1'

type Props = {
  editMode: boolean
  block: Block
}

const props = defineProps<Props>()
const isDev = import.meta.env.DEV

const url = computed({
  get() {
    const url = props.block.text.split(BLOCK_SEPARATOR)[0] ?? ''
    return url
  },
  set(newUrl: string) {
    props.block.text = `${newUrl}${BLOCK_SEPARATOR}${heightProp.value}${BLOCK_SEPARATOR}${widthProp.value}`
  },
})

const heightProp = computed<HeightSize>({
  get() {
    return (props.block.text.split(BLOCK_SEPARATOR)[1] ?? 'base') as HeightSize
  },
  set(newH: HeightSize) {
    props.block.text = `${url.value}${BLOCK_SEPARATOR}${newH}${BLOCK_SEPARATOR}${widthProp.value}`
  },
})

const widthProp = computed<WidthSize>({
  get() {
    return (props.block.text.split(BLOCK_SEPARATOR)[2] ?? 'full') as WidthSize
  },
  set(newW: WidthSize) {
    props.block.text = `${url.value}${BLOCK_SEPARATOR}${heightProp.value}${BLOCK_SEPARATOR}${newW}`
  },
})

const scaleProp = computed({
  get() {
    return (props.block.text.split(BLOCK_SEPARATOR)[3] ?? '1') as Scale
  },
  set(newScale: Scale) {
    props.block.text = `${url.value}${BLOCK_SEPARATOR}${heightProp.value}${BLOCK_SEPARATOR}${widthProp.value}${BLOCK_SEPARATOR}${newScale}`
  },
})

const frameStyles = computed(() => {
  const heights = {
    base: 'h-[20rem] max-sm:h-[14rem]',
    large: 'h-[30rem] max-sm:h-[21rem]',
    'extra-large': 'h-[40rem] max-sm:h-[28rem]',
  }
  const height = heights[heightProp.value]

  const widths = {
    full: 'w-full',
    small: 'w-full max-w-sm',
  }
  const width = widths[widthProp.value]

  const scales = {
    '0.8': '[transform:scale(0.8)] [width:calc(1/0.8*100%)]',
    '1': '',
  }
  const scale = scales[scaleProp.value]

  return `${width} ${height} ${scale}`
})
</script>
