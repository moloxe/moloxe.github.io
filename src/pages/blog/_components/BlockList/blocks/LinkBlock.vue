<template>
  <div
    :class="`w-full flex flex-col bg-black bg-opacity-30 font-sans ${
      editMode ? 'edit-block' : ''
    }`"
  >
    <div v-if="isDev" class="flex flex-col w-full">
      <input v-if="editMode" type="text" v-model="url" />
      <div v-if="editMode" class="flex w-full gap-1 px-2">
        Tipo:
        <label>
          <input type="radio" value="url" v-model="type" />
          Url
        </label>
        <label>
          <input type="radio" value="image" v-model="type" />
          Imagen
        </label>
      </div>
    </div>
    <img
      loading="lazy"
      class="h-80 w-fit mx-auto object-contain bg-white"
      :src="url"
      v-if="type === 'image'"
    />
    <p
      class="bg-black text-end text-xs text-ellipsis overflow-hidden whitespace-nowrap"
    >
      <a class="ml-16" :href="url" target="_blank">{{ url }}</a>
    </p>
  </div>
</template>

<script setup lang="ts">
import type { Block } from '@src/pages/blog/_types/Blocks'
import { computed } from 'vue'

type LinkType = 'url' | 'image'
type BlockTextProp = 'url' | 'type'

type Props = {
  editMode: boolean
  block: Block
}
const props = defineProps<Props>()
const isDev = import.meta.env.DEV

function getProp(prop: BlockTextProp) {
  return (JSON.parse(props.block.text || '{}')[prop] as string) ?? ''
}

function setProp(prop: BlockTextProp, value: string) {
  const obj = JSON.parse(props.block.text || '{}')
  obj[prop] = value
  props.block.text = JSON.stringify(obj)
}

const url = computed<string>({
  get() {
    return getProp('url')
  },
  set(value: string) {
    setProp('url', value)
  },
})

const type = computed<LinkType>({
  get() {
    const type = getProp('type') as LinkType
    return type ? type : 'url'
  },
  set(value: LinkType) {
    setProp('type', value)
  },
})
</script>
