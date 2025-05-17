<template>
  <div class="flex-1 flex gap-8 flex-col w-full mx-auto p-2" v-if="post">
    <div class="flex flex-col gap-2">
      <div class="flex justify-between">
        <PostDate :creation-date="post.creationDate" />

        <p class="text-neutral-400 text-xs flex gap-1">
          {{ readingTime }} minuto{{ readingTime > 1 ? 's' : '' }}
          de lectura
        </p>
      </div>

      <h1>
        {{ post.title }}
      </h1>

      <div v-if="editMode" class="flex gap-2 w-full">
        <button @click="updateTitle" class="bg-primary px-2">Actualizar</button>
        <div class="flex-1 flex flex-col">
          <input
            class="flex-1"
            v-model="newPostTitle"
            type="text"
            :rules="postTitleRules"
          />
          <p class="text-xs">slug: /{{ slugifyForPost(newPostTitle) }}</p>
        </div>
      </div>

      <div class="flex gap-2 text-sm">
        <div
          v-for="category in sortedCategories"
          :key="category"
          class="flex gap-1"
        >
          <a
            class="text-neutral-400 nounderline hover:underline hover:text-white"
            :href="`/blog/?c=${category}`"
          >
            #{{ category }}
          </a>
          <button
            class="text-red-500"
            v-if="editMode"
            @click="deleteCategory(category)"
          >
            x
          </button>
        </div>
        <button
          @click="addCategory"
          class="text-neutral-400 underline"
          v-if="editMode"
        >
          add-new-category
        </button>
      </div>

      <PostManager v-if="isDev" :post="post" />
    </div>

    <BlogIndex :post="post" />

    <hr />

    <BlockList
      v-if="post.slugUrl"
      :container="post.container"
      :slug-url="post.slugUrl"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import BlockList from '@src/pages/blog/_components/BlockList/index.vue'
import PostDate from '@src/pages/blog/_components/PostDate.vue'
import BlogIndex from '@src/pages/blog/_components/BlogIndex/index.vue'
import PostManager from '@src/pages/blog/_components/PostManager.vue'
import type { Post } from '@src/pages/blog/_types/Post'
import PostService from '@src/pages/blog/_services/posts'
import { calcReadingTime, slugifyForPost } from '../../_utils/post'

const isDev = import.meta.env.DEV
const postTitleRegExp = /^(?=.{1,72}$)/
const categoryRegExp = /^(?=.{3,24}$)([a-z-]*)$/

const props = defineProps<{
  post: Post
}>()

const post = ref<Post>(props.post)
const editMode = ref(false)
const newPostTitle = ref(post.value.title)
const readingTime = computed(() => calcReadingTime(post.value))
const sortedCategories = computed(() => [...post.value.categories].sort())

async function updateTitle() {
  if (!post.value) return

  if (!postTitleRegExp.test(newPostTitle.value)) {
    alert('Try with other lenght.')
    return
  }

  const confirmed = window.confirm(
    'Any unsaved changes will be deleted. Continue?'
  )

  if (!confirmed) return

  const oldTitle = post.value.title
  const newTitle = newPostTitle.value
  const newSlugUrl = await PostService.updateTitle(oldTitle, newTitle)
  window.location.href = `/blog/${newSlugUrl}`
}

const postTitleRules = [
  (v: string) =>
    postTitleRegExp.test(v) || 'Minimum 1 characters and maximum 72.',
]

async function addCategory() {
  if (!post.value) return
  const newCategory = window.prompt('New category') ?? ''
  if (
    newCategory.length > 0 &&
    categoryRegExp.test(newCategory) &&
    !post.value.categories.includes(newCategory)
  ) {
    post.value.categories.push(newCategory)
    await PostService.updatePost(post.value)
  }
}

async function deleteCategory(category: string) {
  if (!post.value) return
  if (confirm('Do you want to remove this category?')) {
    const idx = post.value.categories.indexOf(category)
    post.value.categories.splice(idx, 1)
    await PostService.updatePost(post.value)
  }
}

async function onKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
    e.preventDefault()
    editMode.value = !editMode.value
  }
  if ((e.metaKey || e.ctrlKey) && e.key === 's') {
    e.preventDefault()
    await PostService.updatePost(post.value)
  }
}

onMounted(() => {
  if (isDev) {
    window.addEventListener('keydown', onKeydown)
  }
})

onUnmounted(() => {
  if (isDev) {
    window.removeEventListener('keydown', onKeydown)
  }
})
</script>
