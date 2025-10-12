<template>
  <div
    :class="`flex w-full justify-between text-lg ${
      editMode ? 'edit-block' : ''
    }`"
  >
    <textarea
      v-if="editMode"
      v-model="block.text"
      class="w-full p-2 font-sans [resize:none] [field-sizing:content]"
      aria-label="markdown textarea"
    />
    <div v-else class="font-sans w-full" v-html="parsedHTML" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Marked } from 'marked'
import hljs from 'highlight.js/lib/core'
import { markedHighlight } from 'marked-highlight'
import type { Block } from '@src/pages/blog/_types/Blocks'
import { slugifyForPost } from '@src/pages/blog/_utils/post'
import 'highlight.js/styles/atom-one-dark.min.css'

import plaintext from 'highlight.js/lib/languages/plaintext'
hljs.registerLanguage('plaintext', plaintext)
import typescript from 'highlight.js/lib/languages/typescript'
hljs.registerLanguage('typescript', typescript)
import javascript from 'highlight.js/lib/languages/javascript'
hljs.registerLanguage('javascript', javascript)
import shell from 'highlight.js/lib/languages/shell'
hljs.registerLanguage('shell', shell)
import bash from 'highlight.js/lib/languages/bash'
hljs.registerLanguage('bash', bash)
import json from 'highlight.js/lib/languages/json'
hljs.registerLanguage('json', json)
import markdown from 'highlight.js/lib/languages/markdown'
hljs.registerLanguage('markdown', markdown)
import glsl from 'highlight.js/lib/languages/glsl'
hljs.registerLanguage('glsl', glsl)
import xml from 'highlight.js/lib/languages/xml'
hljs.registerLanguage('xml', xml)

const marked = new Marked(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext'
      return hljs.highlight(code, { language }).value
    },
  })
)

marked.use({
  renderer: {
    link(href, title, text) {
      return `<a href="${href}" title="${title}" class="text-primary [word-break:break-word]" target="_blank">${text}</a>`
    },
  },
})

marked.use({
  renderer: {
    heading(text, level) {
      const firstLine = props.block.text.split('\n')[0]
      const id = slugifyForPost(firstLine)
      return `<h${level} class="font-mono" id="${id}">${text}</h${level}>`
    },
  },
})

type Props = {
  editMode: boolean
  block: Block
}
const props = withDefaults(defineProps<Props>(), {
  block: () => ({
    text: '',
    type: 'MarkdownBlock',
  }),
})

const parsedHTML = computed(() => {
  const text = props.block.text
  const dirtyHTML = marked.parse(text)
  return dirtyHTML
})
</script>
