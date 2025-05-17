<template>
  <div :class="`w-full flex flex-col bg-black ${editMode ? 'edit-block' : ''}`">
    <p v-if="editMode" class="font-sans p-2 italic">
      *Head y body necesarios para insertar: JS y CSS.
    </p>
    <div v-if="editMode" class="w-full grid grid-cols-[auto,1fr]">
      <p class="pt-4 border-b [writing-mode:vertical-lr]">Html</p>
      <textarea class="border-b" v-model="html" rows="4" />
      <p class="pt-4 border-b [writing-mode:vertical-lr]">Javascript</p>
      <textarea class="border-b" v-model="js" rows="4" />
      <p class="pt-4 [writing-mode:vertical-lr]">Css</p>
      <textarea v-model="css" rows="4" />
    </div>
    <button class="bg-primary" @click="run" title="Reiniciar">►</button>
    <iframe
      ref="iframeRef"
      class="h-80"
      :srcdoc="showContent ? srcdoc : emptyHtml"
    />
  </div>
</template>

<script setup lang="ts">
import type { Block } from '@src/pages/blog/_types/Blocks'
import { LiveCodeBlockUtils } from './utils'
import { computed, onMounted, ref } from 'vue'

type BlockTextProp = 'html' | 'js' | 'css'

type Props = {
  editMode: boolean
  block: Block
}
const props = defineProps<Props>()
const iframeRef = ref<HTMLIFrameElement | null>(null)

function getProp(prop: BlockTextProp) {
  return (JSON.parse(props.block.text || '{}')[prop] as string) ?? ''
}

function setProp(prop: BlockTextProp, value: string) {
  const obj = JSON.parse(props.block.text || '{}')
  obj[prop] = value
  props.block.text = JSON.stringify(obj)
}

const html = computed<string>({
  get() {
    return getProp('html')
  },
  set(value: string) {
    setProp('html', value)
  },
})

const js = computed<string>({
  get() {
    return getProp('js')
  },
  set(value: string) {
    setProp('js', value)
  },
})

const css = computed<string>({
  get() {
    return getProp('css')
  },
  set(value: string) {
    setProp('css', value)
  },
})

const srcdoc = ref<string | undefined>()
const showContent = ref(false)
const emptyHtml =
  '<html><head><style>body{background-color:black}</style></head><body></body></html>'

function run() {
  srcdoc.value = undefined
  setTimeout(() => {
    srcdoc.value = LiveCodeBlockUtils.parseLiveCodeBlock(props.block.text)
  }, 100)
}

onMounted(() => {
  run()

  const options = {
    root: null,
    rootMargin: '0px',
    threshold: 0.2,
  }

  const iframe = iframeRef.value

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.intersectionRatio <= options.threshold) {
        showContent.value = false
      } else {
        showContent.value = true
      }
    })
  }, options)

  if (iframe) observer.observe(iframe)
})
</script>
