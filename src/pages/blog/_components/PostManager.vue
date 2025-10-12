<template>
  <div class="flex gap-4 text-sm">
    <button class="w-fit bg-white text-black" @click="togglePinned">
      {{ post.isPinned ? 'Unpin' : 'Pin' }}
    </button>
  </div>
</template>

<script lang="ts" setup>
import type { Post } from '@src/pages/blog/_types/Post'
import PostService from '@src/pages/blog/_services/posts'

const { post } = defineProps<{
  post: Post
}>()

async function togglePinned() {
  post.isPinned = !post.isPinned
  await PostService.updatePost(post)
  window.location.reload()
}
</script>
