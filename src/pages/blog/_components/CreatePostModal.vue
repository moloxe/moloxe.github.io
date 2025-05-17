<template>
  <div v-if="show" class="fixed z-10 flex top-0 bottom-0 right-0 left-0">
    <div
      class="absolute flex top-0 bottom-0 right-0 left-0 bg-black bg-opacity-80"
      @click="closeModal"
    />
    <div
      class="flex flex-col gap-2 z-30 p-4 m-auto max-w-md bg-neutral-900 rounded"
    >
      <h1 class="title">Create post</h1>

      <div class="flex gap-2 flex-nowrap">
        <input
          class="grow-[6]"
          placeholder="Title..."
          v-model="newPostTitle"
          :disabled="loadingState"
          type="text"
          required
          @keydown.enter="createPost"
        />

        <button :disabled="loadingState" @click="createPost" title="create">
          ✅
        </button>

        <button :disabled="loadingState" @click="closeModal" title="cancel">
          ❌
        </button>
      </div>

      <div v-if="errorMessage" class="bg-red-700 text-white">
        {{ errorMessage }}
      </div>

      <p v-if="loadingState">Loading...</p>
    </div>
  </div>

  <button
    class="bg-white text-black absolute right-0 opacity-50"
    @click="openModal"
  >
    New post
  </button>
</template>

<script setup lang="ts">
import PostService from '@src/pages/blog/_services/posts'
import { ref } from 'vue'

const show = ref(false)
const newPostTitle = ref('')
const errorMessage = ref('')
const loadingState = ref(false)

function openModal() {
  errorMessage.value = ''
  show.value = true
}

function closeModal() {
  errorMessage.value = ''
  show.value = false
}

async function createPost() {
  loadingState.value = true

  const title = newPostTitle.value
  newPostTitle.value = ''

  try {
    const slugUrl = await PostService.createPost(title)
    window.location.href = `/blog/${slugUrl}`
    closeModal()
  } catch (error) {
    errorMessage.value = String(error)
  } finally {
    loadingState.value = false
  }
}
</script>
