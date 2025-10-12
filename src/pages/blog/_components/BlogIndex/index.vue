<template>
  <div v-if="indexTree.children.length > 0" class="font-sans mb-[-0.5rem]">
    <h2 class="mb-3">Índice:</h2>
    <Section :index-tree="indexTree" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { type IndexTree } from './types'
import Section from './Section.vue'
import type { Post } from '@src/pages/blog/_types/Post'
import { slugifyForPost } from '@src/pages/blog/_utils/post'

const props = defineProps<{
  post: Post
}>()

function getHref(title: string) {
  return `/blog/${props.post.slugUrl}/#${slugifyForPost(title)}`
}

function getChildTree(
  curIndex: number,
  curLevel: number
): [IndexTree[], number] {
  const children: IndexTree[] = []
  while (curIndex < props.post.container.length) {
    const block = props.post.container[curIndex]
    if (block.type === 'MarkdownBlock') {
      const line = block.text.split('\n')[0]
      const level = line.match(/^#+/)?.[0].length ?? 0
      if (level > 0) {
        if (level < curLevel) {
          curIndex--
          break
        } else if (level === curLevel) {
          const title = line
            .replace(/^#+/, '')
            .trim()
            .replace(/<[^>]*>/g, '')
          const child: IndexTree = {
            title,
            children: [],
            href: getHref(title),
          }
          ;[child.children, curIndex] = getChildTree(curIndex + 1, curLevel + 1)
          children.push(child)
        } else {
          const [grandChildren, newIndex] = getChildTree(curIndex, curLevel + 1)
          if (children.at(-1))
            children[children.length - 1].children = grandChildren
          else children.push(...grandChildren)
          curIndex = newIndex
        }
      }
    }
    curIndex++
  }
  return [children, curIndex]
}

const indexTree = computed(() => {
  const tree: IndexTree = {
    title: props.post.title,
    children: [],
    href: getHref(props.post.title),
  }
  ;[tree.children] = getChildTree(0, 1)
  return tree
})
</script>
