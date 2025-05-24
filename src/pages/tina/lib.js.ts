import type { APIRoute } from 'astro'
import fs from 'fs'

const readFile = (path: string) =>
  fs.readFileSync(new URL(path, import.meta.url), 'utf-8')

const TINA = readFile('./_lib/tina.js')
const TINA_COMMON = readFile('./_lib/tina.common.js')
const TINA_RAYMARCH_LIGHT = readFile('./_lib/raymarch/light.js')
const TINA_RAYMARCH_MATERIAL = readFile('./_lib/raymarch/material.js')
const TINA_RAYMARCH_SCENE = readFile('./_lib/raymarch/scene.js')
const TINA_RAYMARCH = readFile('./_lib/raymarch/raymarch.js')
const TINA_RAYMARCH_CAPSULE_COLLISIONS = readFile(
  './_lib/raymarch/collisions.capsule.js'
)
const TINA_KEYBOARD = readFile('./_lib/utils/keyboard.js')

const SCRIPT = [
  TINA_KEYBOARD,
  TINA_COMMON,
  TINA_RAYMARCH_CAPSULE_COLLISIONS,
  TINA_RAYMARCH,
  TINA_RAYMARCH_MATERIAL,
  TINA_RAYMARCH_SCENE,
  TINA_RAYMARCH_LIGHT,
  TINA,
].join('\n')

export const GET: APIRoute = async () => {
  return new Response(SCRIPT, {
    headers: { 'Content-Type': 'application/javascript' },
  })
}
