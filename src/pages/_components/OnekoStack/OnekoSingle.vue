<template>
  <div
    :style="{
      width: '32px',
      height: '32px',
      position: 'absolute',
      backgroundImage: `url(${OnekoGif.src})`,
      imageRendering: 'pixelated',
    }"
    ref="onekoRef"
    class="z-40 print:hidden"
    @mouseover="hovered = true"
    @mouseleave="hovered = false"
  >
    <span
      v-if="showMessage"
      class="z-50 absolute top-[-1rem] flex gap-1 w-max text-xs bg-white text-black"
    >
      <p>
        {{ props.oneko.message }}
      </p>
    </span>
  </div>
</template>

<script setup lang="ts">
// Credits: https://github.com/adryd325/oneko.js
import { onMounted, onUnmounted, ref, watch } from 'vue'
import type { Oneko, OnekoSprite } from './types'
import { MIN_DISTANCE_TO_STOP, SPEED, SPRITES } from './constants'
import OnekoGif from './assets/oneko.gif'

const props = defineProps<{
  oneko: Oneko
  allowAlert: boolean
  forceAlert: boolean
}>()

const onekoRef = ref<HTMLDivElement>()
const hovered = ref(false)
const showMessage = ref(false)
const animationInvervalId = ref<any>()

watch(hovered, () => {
  if (hovered.value) {
    showMessage.value = true
  } else {
    showMessage.value = false
  }
})

onMounted(() => {
  const nekoEl = onekoRef.value
  if (!nekoEl) return

  nekoEl.style.left = props.oneko.posX + 'px'
  nekoEl.style.top = props.oneko.posY + 'px'

  let frameCount = 0
  let idleTime = 0
  let idleAnimation: string | null = null
  let idleAnimationFrame = 0

  function setSprite(frame: number) {
    const sprite =
      SPRITES[props.oneko.sprite][frame % SPRITES[props.oneko.sprite].length]
    if (!nekoEl) return
    nekoEl.style.backgroundPosition = `${sprite[0] * 32}px ${sprite[1] * 32}px`
  }

  function animationInverval() {
    frameCount += 1
    const diffX = props.oneko.posX - props.oneko.targetX
    const diffY = props.oneko.posY - props.oneko.targetY
    const distance = Math.sqrt(diffX ** 2 + diffY ** 2)

    if (props.forceAlert) {
      props.oneko.sprite = 'alert'
      setSprite(0)
      return
    }

    if (distance < SPEED || distance < MIN_DISTANCE_TO_STOP) {
      idleTime += 1

      // every ~ 20 seconds
      if (
        idleTime > 10 &&
        Math.floor(Math.random() * 200) == 0 &&
        idleAnimation == null
      ) {
        idleAnimation = ['sleeping', 'scratch'][Math.floor(Math.random() * 2)]
      }

      switch (idleAnimation) {
        case 'sleeping':
          if (idleAnimationFrame < 8) {
            props.oneko.sprite = 'tired'
            setSprite(0)
            break
          }
          props.oneko.sprite = 'sleeping'
          setSprite(Math.floor(idleAnimationFrame / 4))
          if (idleAnimationFrame > 192) {
            idleAnimation = null
            idleAnimationFrame = 0
          }
          break
        case 'scratch':
          props.oneko.sprite = 'scratch'
          setSprite(idleAnimationFrame)
          if (idleAnimationFrame > 9) {
            idleAnimation = null
            idleAnimationFrame = 0
          }
          break
        default:
          props.oneko.sprite = 'idle'
          setSprite(0)
          return
      }
      idleAnimationFrame += 1

      return
    }

    idleAnimation = null
    idleAnimationFrame = 0

    if (idleTime > 1) {
      if (props.allowAlert) {
        props.oneko.sprite = 'alert'
        setSprite(0)
        // count down after being alerted before moving
        idleTime = Math.min(idleTime, 7)
        idleTime -= 1
      } else {
        props.oneko.sprite = 'idle'
        setSprite(0)
        idleTime = 0
      }
      return
    }

    let direction: OnekoSprite = 'idle'
    if (diffY / distance > 0.5) {
      direction = 'N'
      if (diffX / distance > 0.5) {
        direction = 'NW'
      } else if (diffX / distance < -0.5) {
        direction = 'NE'
      }
    } else if (diffY / distance < -0.5) {
      direction = 'S'
      if (diffX / distance > 0.5) {
        direction = 'SW'
      } else if (diffX / distance < -0.5) {
        direction = 'SE'
      }
    } else if (diffX / distance > 0.5) {
      direction = 'W'
    } else if (diffX / distance < -0.5) {
      direction = 'E'
    }

    props.oneko.sprite = direction

    setSprite(frameCount)

    if (!nekoEl) return
    nekoEl.style.left = `${props.oneko.posX - 16}px`
    nekoEl.style.top = `${props.oneko.posY - 16}px`
  }

  animationInvervalId.value = setInterval(animationInverval, 100)
})

onUnmounted(() => {
  clearInterval(animationInvervalId.value)
})
</script>
