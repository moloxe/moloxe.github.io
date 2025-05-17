<template>
  <OnekoSingle
    v-for="(oneko, index) in onekos"
    :key="oneko.id"
    :oneko="oneko"
    :allowAlert="index === 0"
    :forceAlert="index > 0 && onekos[0]?.sprite === 'alert'"
  />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import OnekoSingle from './OnekoSingle.vue'
import {
  DISTANCE_BETWEEN_ONEKOS,
  MIN_DISTANCE_TO_STOP,
  SPEED,
} from './constants'
import type { Oneko } from './types'

type Pos = { x: number; y: number }

const onekos = ref<Oneko[]>([])
const movementHistory = ref<Pos[]>([])
const mousePos = ref<null | Pos>(null)
const intervalId = ref<any>()

function getOnekoMessage() {
  return 'refresh = kill me 😔'
}

function getRelativePosition(index: number, shift: number = 0) {
  const totalPos = movementHistory.value.length
  const posIndex = Math.max(
    totalPos - 1 - index * DISTANCE_BETWEEN_ONEKOS + shift,
    0
  )
  const pos = movementHistory.value[posIndex]
  return pos
}

function addOnekoToStack() {
  const id = Math.random().toString()
  let posX = Math.floor(document.body.clientWidth / 2) - 16
  let posY = 16
  if (onekos.value.length > 0) {
    const index = onekos.value.length
    const pos = getRelativePosition(index)
    posX = pos.x
    posY = pos.y
  }
  const last = onekos.value[onekos.value.length - 1]
  const targetX = last?.posX ?? posX
  const targetY = last?.posY ?? posY
  onekos.value.push({
    posX,
    posY,
    targetX,
    targetY,
    message: getOnekoMessage(),
    id,
    sprite: 'idle',
  })
}

function onChangeTargets() {
  if (onekos.value.length === 0) return

  let isMoving = false

  if (mousePos.value) {
    const oneko = onekos.value[0]
    const diffX = oneko.posX - oneko.targetX
    const diffY = oneko.posY - oneko.targetY
    const distance = Math.sqrt(diffX ** 2 + diffY ** 2)
    let posX = oneko.posX
    let posY = oneko.posY
    if (distance > MIN_DISTANCE_TO_STOP && oneko.sprite !== 'alert') {
      posX = oneko.posX - (diffX / distance) * SPEED
      posY = oneko.posY - (diffY / distance) * SPEED
      isMoving = true
      movementHistory.value.push({ x: posX, y: posY })
    }
    onekos.value[0] = {
      ...oneko,
      posX,
      posY,
      targetX: mousePos.value.x,
      targetY: mousePos.value.y,
    }
  }

  for (let i = 1; i < onekos.value.length; i++) {
    const pos = getRelativePosition(i)
    const posX = pos.x
    const posY = pos.y
    let targetX = onekos.value[i].posX
    let targetY = onekos.value[i].posY
    if (isMoving) {
      const MIN_WORKING_SHIFT = 3
      const targetPos = getRelativePosition(i, MIN_WORKING_SHIFT)
      targetX = targetPos.x
      targetY = targetPos.y
    }
    onekos.value[i] = {
      ...onekos.value[i],
      posX,
      posY,
      targetX,
      targetY,
    }
  }

  const totalPos = movementHistory.value.length
  const maxPos = onekos.value.length * DISTANCE_BETWEEN_ONEKOS
  if (totalPos > maxPos) {
    movementHistory.value = movementHistory.value.slice(totalPos - maxPos)
  }
}

function killLast() {
  if (onekos.value.length > 0) {
    onekos.value.pop()
  } else {
    movementHistory.value = []
  }
}

function onMouseMove(event: MouseEvent) {
  mousePos.value = {
    x: event.pageX,
    y: event.pageY,
  }
}

function onKeyDown(event: KeyboardEvent) {
  const commandPressed = event.metaKey || event.ctrlKey
  const shiftPressed = event.shiftKey
  if (shiftPressed && commandPressed && event.key === 'x') {
    event.preventDefault()
    addOnekoToStack()
  }
  if (shiftPressed && commandPressed && event.key === 'z') {
    event.preventDefault()
    killLast()
  }
}

const lastTap = ref<null | number>(0)
const tappedTwice = ref(false)
const tappedTrice = ref(false)
const TAP_DELAY = 300
function onTouchStart() {
  const diff = new Date().getTime() - (lastTap?.value ?? 0)
  if (diff < TAP_DELAY) {
    if (tappedTrice.value) return

    if (tappedTwice.value) {
      tappedTwice.value = false
      tappedTrice.value = true
      setTimeout(() => {
        killLast()
        tappedTrice.value = false
      }, TAP_DELAY)
      return
    }

    tappedTwice.value = true
    setTimeout(() => {
      if (tappedTwice.value && !tappedTrice.value) addOnekoToStack()
      tappedTwice.value = false
    }, TAP_DELAY)
  }
  lastTap.value = new Date().getTime()
}

onMounted(() => {
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('keydown', onKeyDown)
  document.addEventListener('touchstart', onTouchStart)
  intervalId.value = setInterval(() => {
    onChangeTargets()
  }, 100)
  const startWithOneko = Math.random() < 1 / 2
  if (startWithOneko) {
    addOnekoToStack()
  }
})

onUnmounted(() => {
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('keydown', onKeyDown)
  document.removeEventListener('touchstart', onTouchStart)
  clearInterval(intervalId.value)
  onekos.value = []
})
</script>
