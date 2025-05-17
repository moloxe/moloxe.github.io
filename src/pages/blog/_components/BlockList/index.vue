<template>
  <div class="flex flex-col justify-center gap-6 w-full">
    <AutoBlock
      v-for="(block, index) in container"
      :key="block.id"
      :block="block"
      :index="index"
      :addBlock="addBlock"
      :removeBlock="() => removeBlock(index)"
      :isNew="newBlockId === block.id"
      :slugUrl="slugUrl"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import AutoBlock from './AutoBlock.vue'
import { LiveCodeBlockUtils } from './blocks/utils'
import type { Block, BlockType } from '@src/pages/blog/_types/Blocks'

type Props = {
  slugUrl: string
  container: Block[]
}
const props = defineProps<Props>()
const newBlockId = ref('')

const container = computed(() => {
  return props.container
})

function addBlock(index: number, type: BlockType) {
  let text = ''
  if (type === 'LiveCodeBlock') text = LiveCodeBlockUtils.DEFAULT_TEXT
  newBlockId.value = Math.random().toString()
  container.value.splice(index + 1, 0, {
    text,
    type,
    id: newBlockId.value,
  })
}

function removeBlock(index: number) {
  if (container.value.length !== 1) container.value.splice(index, 1)
}
</script>
