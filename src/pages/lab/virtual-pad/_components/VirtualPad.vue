<template>
  <div class="flex-1 grid grid-cols-6 gap-2 p-2">
    <button
      class="border rounded-xl p-3 hover:bg-neutral-700 active:bg-neutral-700 select-none"
      v-for="(key, index) in keys"
      :style="`grid-area: ${getGridArea(index)};`"
      :key="key.text"
      @mousedown="key.onMouseDown"
      @mouseover="key.onMouseOver"
    >
      {{ key.text.split('/')[0] }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { mapKey, notes } from '../_utils/constants'

type KeyDown = { [key: string]: boolean }
type Key = {
  text: string
  onMouseDown: (payload: MouseEvent) => void
  onMouseOver: (payload: MouseEvent) => void
}

const audioContext = ref<AudioContext>(0 as any)
const isKeyDown = ref<KeyDown>({})
const keys = ref<Key[]>(
  Object.keys(notes).map((note) => ({
    text: note,
    onMouseDown: () => {
      PlayNote(notes[note])
    },
    onMouseOver: ({ buttons }: MouseEvent) => {
      if (buttons === 1) PlayNote(notes[note])
    },
  }))
)

function getGridArea(index: number) {
  const n = keys.value.length
  const mid = Math.floor(n / 2)
  const width = 3
  const height = Math.floor(mid / width)
  let col = (index % width) + 1
  let row = Math.ceil((index + 1) / width)
  if (index >= mid) {
    col += width
    row -= height
  }
  return `${row}/${col}/${row}/${col + 1}`
}

const getGain = () => {
  const amplitude = 0.1
  const primaryGainControl = audioContext.value.createGain()
  primaryGainControl.gain.setValueAtTime(amplitude, 0)
  primaryGainControl.connect(audioContext.value.destination)
  return primaryGainControl
}

const PlayNote = (freq: number) => {
  const PLAY_TIME = 3
  const FREQ_LOW = 0.0001
  const kickOscillator = audioContext.value.createOscillator()
  kickOscillator.frequency.setValueAtTime(freq, 0)
  // kickOscillator.type = 'custom';

  const imag = new Float32Array([0, 0, 1, 0, 1])
  const real = new Float32Array(imag.length)
  const wave = audioContext.value.createPeriodicWave(real, imag)
  kickOscillator.setPeriodicWave(wave)

  const kickGain = audioContext.value.createGain()
  kickGain.gain.setValueAtTime(1, 0)
  kickGain.gain.exponentialRampToValueAtTime(
    FREQ_LOW,
    audioContext.value.currentTime + PLAY_TIME
  )

  kickOscillator.connect(kickGain)
  kickGain.connect(getGain())
  kickOscillator.start()
  kickOscillator.stop(audioContext.value.currentTime + PLAY_TIME)
  kickOscillator.addEventListener('ended', () => {
    kickOscillator.disconnect()
  })
}

function onKeyDown({ code }: KeyboardEvent) {
  if (!isKeyDown.value[code] && mapKey[code] !== undefined) {
    isKeyDown.value[code] = true
    PlayNote(notes[mapKey[code]])
  }
}

function onKeyUp({ code }: KeyboardEvent) {
  if (isKeyDown.value[code]) {
    isKeyDown.value[code] = false
  }
}

onMounted(() => {
  audioContext.value = new AudioContext()
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
})
</script>
