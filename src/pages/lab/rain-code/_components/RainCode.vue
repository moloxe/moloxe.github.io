<template>
  <div class="easter-egg-content w-full h-full">
    <canvas id="code-rain" class="opacity-80" />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

onMounted(() => {
  const canvas = document.getElementById('code-rain') as HTMLCanvasElement
  const container = document.getElementsByClassName(
    'easter-egg-content'
  )[0] as HTMLDivElement
  const ctx = canvas.getContext('2d')

  const letters = '0123456789abcdef!"·$%&/(=?¿'.split('')

  const fontSize = 14
  const drops: number[] = []

  const init = () => {
    canvas.height = container.offsetHeight
    canvas.width = container.offsetWidth
    const columns = canvas.width / fontSize
    if (drops.length > columns) drops.splice(columns, drops.length - columns)
    for (let x = 0; x < columns; x++) {
      if (drops[x] === undefined) drops[x] = canvas.height
    }
  }

  init()

  setInterval(() => {
    if (!ctx) return

    ctx.fillStyle = '#100e2120'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#db543c'
    ctx.font = fontSize + 'px arial'

    for (let i = 0; i < drops.length; i++) {
      const text = letters[Math.floor(Math.random() * letters.length)]

      if (drops[i] * fontSize < canvas.height)
        ctx.fillText(text, i * fontSize, drops[i] * fontSize)

      if (drops[i] * fontSize > canvas.height && Math.random() > 0.99)
        drops[i] = 0
      else drops[i]++
    }
  }, 80)
})
</script>
