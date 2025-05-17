<template>
  <a
    class="post-card relative flex flex-col items-stretch h-fit no-underline gap-x-3 gap-y-2"
    :title="postCard.title"
    :href="`/blog/${postCard.slugUrl}`"
  >
    <div class="card-image relative flex w-full h-32 opacity-70">
      <img
        loading="lazy"
        class="absolute w-full h-full object-cover object-center"
        :src="postCard.imageURL"
      />
    </div>
    <div class="flex flex-col w-full gap-1">
      <PostDate :creation-date="postCard.creationDate" />

      <h2
        class="card-title text-white whitespace-nowrap overflow-hidden text-ellipsis"
      >
        {{ postCard.title }}
      </h2>

      <div class="flex flex-wrap gap-2 text-neutral-400 text-xs">
        <span v-for="category in sortedCategories" :key="category">
          #{{ category }}
        </span>
      </div>

      <p class="text-neutral-400 text-xs flex gap-1">
        {{ postCard.readingTime }} minuto{{
          postCard.readingTime > 1 ? 's' : ''
        }}
        de lectura
      </p>

      <div class="absolute text-xs flex flex-col top-1 right-1">
        <p
          v-if="postCard.isPinned && showPinned"
          class="flex flex-nowrap gap-1"
        >
          <img class="flex w-2" :src="Thumbtack.src" alt="fijado" />
          Fijado
        </p>
      </div>
    </div>
  </a>
</template>

<script setup lang="ts">
import type { PostCard } from '@src/pages/blog/_types/Post'
import PostDate from './PostDate.vue'
import Thumbtack from '@src/assets/icons/thumbtack.svg'

const isDev = import.meta.env.DEV

const { postCard } = defineProps<{
  postCard: PostCard
  showPinned?: true
}>()

const sortedCategories = [...postCard.categories].sort()
</script>

<style scoped>
.post-card:hover .card-image {
  @apply opacity-100;
}
.post-card:hover .card-title {
  @apply underline;
}
</style>
