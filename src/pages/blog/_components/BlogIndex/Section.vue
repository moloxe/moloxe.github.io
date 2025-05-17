<template>
  <component :is="getElement()">
    <a
      v-if="props.isSubSection"
      :href="indexTree.href"
      v-html="title"
      class="flex w-fit no-underline hover:underline cursor-pointer mb-2"
      :title="props.indexTree.title"
    />
    <ul v-if="props.indexTree.children.length > 0">
      <SubSection
        v-for="child in props.indexTree.children"
        :key="child.title"
        :index-tree="child"
        :is-sub-section="true"
      />
    </ul>
  </component>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { type IndexTree } from './types'
import { Marked } from 'marked'

const marked = new Marked()

const SubSection = defineAsyncComponent(() => import('./Section.vue'))

const props = defineProps<{
  indexTree: IndexTree
  isSubSection?: boolean
}>()

function getElement() {
  return props.isSubSection ? 'li' : 'div'
}

const title = computed(() => marked.parse(props.indexTree.title) as string)
</script>
