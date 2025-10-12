<template>
  <div class="flex-1 flex flex-col gap-6 p-2 w-full">
    <div class="flex flex-col gap-4 text-sm">
      <input
        type="text"
        class="rounded"
        v-model="searchTerm"
        placeholder="Buscar..."
      />
      <button
        v-if="searchTerm.length > 0"
        class="underline text-yellow-200 w-fit"
        @click="clearSerchTerm"
      >
        ✘ limpiar búsqueda
      </button>
      <p>Categorías:</p>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="category of categories"
          :key="category"
          :class="`flex rounded-full px-2 border border-primary ${
            selectedCategories.includes(category)
              ? 'bg-primary text-contrast'
              : 'text-primary'
          }`"
          @click="() => onClickCategory(category)"
        >
          {{ category }}
        </button>
      </div>
      <button
        v-if="selectedCategories.length > 0"
        class="underline text-yellow-200 w-fit"
        @click="clearSelectedCategories"
      >
        ✘ limpiar selección
      </button>
    </div>

    <div
      class="grid grid-cols-2 gap-12 max-sm:grid-cols-1"
      v-if="filteredPostCards.length > 0"
      v-for="posctCards in filteredPostCards"
    >
      <div class="border-b [grid-area:1/1/2/3] max-sm:[grid-area:auto]">
        {{ posctCards[0]?.creationDate.getFullYear() }}
      </div>

      <PostCardComponent
        v-for="postCard in posctCards"
        :key="`${postCard.slugUrl}`"
        :post-card="postCard"
        :show-pinned="true"
      />
    </div>

    <GiphyBlock
      v-else
      :block="{
        text: `1EmBoG0IL50VIJLWTs$%&${noResultsMessage}`,
        type: 'GiphyBlock',
      }"
      :edit-mode="false"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import GiphyBlock from '@src/pages/blog/_components/BlockList/blocks/GiphyBlock.vue'
import PostCardComponent from '@src/pages/blog/_components/PostCard.vue'
import fuse from 'fuse.js'
import type { PostCard } from '@src/pages/blog/_types/Post'

function searchByTerm<T>(list: T[], query: string, keys: string[]): T[] {
  const fuseInstance = new fuse(list, {
    keys,
    threshold: 0.5,
  })

  const filteredResults = fuseInstance
    .search(query)
    .sort((a, b) => (a.score ?? 0) - (b.score ?? 0))
    .map((result) => list[result.refIndex])

  return filteredResults
}

const props = defineProps<{
  postCards: PostCard[]
  categories: string[]
}>()

const searchParams = new URLSearchParams(window.location.search)
const cParam = searchParams.get('c') ?? ''
const selectedCategories = ref<string[]>(
  cParam?.length > 0 ? cParam.split(',') : []
)
const searchTerm = ref(searchParams.get('s') ?? '')

watch([searchTerm, selectedCategories], () => {
  const categories = selectedCategories.value.join(',')
  let href = '/blog'
  const params = new URLSearchParams({})
  if (categories) params.set('c', categories)
  if (searchTerm.value) params.set('s', searchTerm.value)
  const search = params.toString()
  if (search) href += `?${search}`
  window.history.pushState({ path: href }, '', href)
})

const filteredPostCards = computed(() => {
  let filtered =
    props.postCards.filter((post) => {
      if (selectedCategories.value.length === 0) return true
      return selectedCategories.value.every((category) =>
        post.categories.includes(category)
      )
    }) ?? []

  if (searchTerm.value) {
    filtered = searchByTerm<PostCard>(filtered, searchTerm.value, [
      'title',
      'categories',
    ])
  }

  const years = Array.from(
    new Set(filtered.map((p) => p.creationDate.getFullYear()))
  )

  years.sort().reverse()

  const postsByYear = years
    .map((year) =>
      filtered.filter(({ creationDate }) => creationDate.getFullYear() === year)
    )
    .filter((posts) => posts.length > 0)

  return postsByYear
})

const noResultsMessage = computed(() => {
  let message = 'Sin resultados'
  if (searchTerm.value) {
    message += ` para "${searchTerm.value}"`
  }
  return message
})

function onClickCategory(category: string) {
  if (selectedCategories.value.includes(category)) {
    selectedCategories.value = selectedCategories.value.filter(
      (c) => c !== category
    )
  } else {
    selectedCategories.value = [...selectedCategories.value, category]
  }
}

function clearSerchTerm() {
  searchTerm.value = ''
}

function clearSelectedCategories() {
  selectedCategories.value = []
}
</script>
