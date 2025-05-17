<template>
  <div :class="`w-full flex flex-col ${editMode ? 'edit-block' : ''}`">
    <input
      v-if="editMode"
      v-model="quote"
      type="text"
      class="flex-1 p-2 w-full"
      placeholder="Write something..."
      aria-label="gif quote input"
    />

    <div
      class="relative flex place-items-center bg-black bg-opacity-30"
      v-if="existUrl"
    >
      <img
        loading="lazy"
        class="m-auto w-auto h-80 object-cover"
        :src="url"
        alt="gif-block"
      />
      <div
        v-if="quote && existUrl"
        class="absolute top-0 left-0 right-0 bottom-0 bg-[#333a]"
      />
      <div v-if="quote && existUrl" class="flex absolute w-full h-full">
        <p class="font-sans m-auto p-4 text-center text-2xl font-bold">
          {{ quote }}
        </p>
      </div>
    </div>

    <div v-if="editMode" class="flex flex-col w-full">
      <div class="flex w-full h-10">
        <input
          v-model="currentQuery"
          type="text"
          placeholder="Search gif (Giphy)"
          aria-label="gifs search input"
          class="flex-1 px-3"
          @keydown.enter="searchGifsAction"
        />
        <button class="bg-primary p-0 w-10" @click="searchGifsAction">
          🔍
        </button>
      </div>

      <div class="flex overflow-x-scroll h-[10rem]">
        <div class="flex">
          <img
            v-for="{ id, url } of samples"
            :key="id"
            :src="url"
            class="block w-[10rem] h-auto object-cover cursor-pointer"
            loading="lazy"
            @click="loadGif(id, url)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { GiphyBlockUtils } from './utils'
import GiphyService from '@src/pages/blog/_services/giphy'
import type { Block } from '@src/pages/blog/_types/Blocks'

type Props = { editMode: boolean; block: Block }
const props = defineProps<Props>()
const url = ref(getFirstGifLoad())
const currentQuery = ref('')
const samples = ref<{ id: string; url: string }[]>([])

const existUrl = computed(() => {
  return url.value !== '' && typeof url.value === 'string'
})

const quote = computed({
  get() {
    return GiphyBlockUtils.getQuoteFromGiphyBlock(props.block.text) ?? ''
  },
  set(newQuote: string) {
    const id = GiphyBlockUtils.getIdFromGiphyBlock(props.block.text)
    props.block.text = GiphyBlockUtils.formatGiphyBlock(id, newQuote)
  },
})

async function searchGifsAction() {
  const query = currentQuery.value
  const newSamples: { id: string; url: string }[] = []

  const gifs = await GiphyService.searchGifs(query, navigator.language)

  for (const gif of gifs) {
    const url = gif?.images?.fixed_height?.url
    newSamples.push({
      id: gif?.id,
      url,
    })
  }

  samples.value = newSamples
}

function loadGif(id: string, newUrl?: string) {
  if (!newUrl) newUrl = GiphyService.getGifById(id)

  url.value = newUrl
  props.block.text = GiphyBlockUtils.formatGiphyBlock(id, quote.value)
}

function getFirstGifLoad() {
  const id = GiphyBlockUtils.getIdFromGiphyBlock(props.block.text)
  const newUrl = GiphyService.getGifById(id)
  return newUrl
}

onMounted(() => {
  if (props.editMode) searchGifsAction()
})

watch(
  () => props.editMode,
  (newEditMode) => {
    if (newEditMode) searchGifsAction()
  }
)
</script>
