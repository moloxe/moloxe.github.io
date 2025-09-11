<template>
  <div :class="`flex flex-col w-full ${editMode ? 'edit-block' : ''}`">
    <img
      loading="lazy"
      class="w-auto h-80 object-contain bg-black bg-opacity-30"
      v-if="block.text !== ''"
      :src="url"
    />

    <input
      v-if="editMode && isDev"
      class="py-4 px-2"
      type="file"
      accept="image/*"
      label="Upload image"
      prepend-icon="mdi-file-image-outline"
      aria-label="image upload input"
      @change="uploadImage"
    />
  </div>
</template>

<script setup lang="ts">
import PostService from '@src/pages/blog/_services/posts'
import type { Block } from '@src/pages/blog/_types/Blocks'
import { computed, onMounted, ref, watch } from 'vue'

type Props = {
  editMode: boolean
  block: Block
  slugUrl: string
}
const isDev = import.meta.env.DEV
const props = defineProps<Props>()

const url = computed(() => {
  if (props.block.text.startsWith('/'))
    return `/blog/${props.slugUrl}/img${props.block.text}`
  return props.block.text
})

async function uploadImage(event: Event) {
  const targe = event?.target as HTMLInputElement & EventTarget
  if (!targe?.files) return
  const image = targe.files[0]
  props.block.text = await PostService.uploadPostImage(props.slugUrl, image)
}
</script>
