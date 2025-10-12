<template>
  <div :class="`${editMode ? 'edit-block' : ''}`">
    <p>Deprecated block 🚧</p>
    <a :href="gmLink" class="text-primary" target="_blank">{{ gmLink }}</a>
    <!-- <div v-if="editMode" class="p-4">Drag the marker to change location:</div>
    <div ref="mapContainer" class="flex h-80 w-full border-0"></div> -->
  </div>
</template>

<script setup lang="ts">
// import { Loader } from '@googlemaps/js-api-loader'
import type { Block } from '@src/pages/blog/_types/Blocks'
import { computed } from 'vue'

// const GOOGLE_MAPS_API_KEY = ''

type Props = {
  editMode: boolean
  block: Block
}
const props = defineProps<Props>()
// const marker = ref<google.maps.Marker>()

// const mapContainer = ref<HTMLDivElement>()

// watch(
//   () => props.editMode,
//   (newEditMode) => {
//     if (marker.value) marker.value.setOptions({ draggable: newEditMode })
//   }
// )

const gmLink = computed(() => {
  const [lat, lng] = props.block.text.split(',')
  let coords = ''
  if (!!lat && !!lng) coords = `@${lat},${lng},16z`
  return `https://google.com/maps/${coords}`
})

// const getCoords = async () => {
//   const {
//     coords: { latitude: lat, longitude: lng },
//   }: {
//     coords: { latitude: number; longitude: number }
//   } = await new Promise((resolve, reject) => {
//     navigator.geolocation.getCurrentPosition(resolve, reject)
//   })
//   return { lat, lng }
// }

// async function loadMap() {
//   if (!mapContainer) return
//   const iframeMap = mapContainer.value
//   if (!iframeMap) return

//   const loader = new Loader({ apiKey: GOOGLE_MAPS_API_KEY })
//   const google = await loader.load()

//   const defaultPosition = new google.maps.LatLng(37.9715323, 23.7235605)

//   let position

//   if (props.block.text.split(',').length === 2) {
//     const [lat, lng] = props.block.text.split(',')
//     position = new google.maps.LatLng(parseFloat(lat), parseFloat(lng))
//   } else if (navigator.geolocation) {
//     try {
//       const { lat, lng } = await getCoords()
//       position = new google.maps.LatLng(lat, lng)
//     } catch {
//       position = defaultPosition
//     }
//   }

//   const map = new google.maps.Map(iframeMap, {
//     center: position,
//     zoom: 16,
//     fullscreenControl: false,
//     streetViewControl: false,
//   })

//   marker.value = new google.maps.Marker({
//     title: 'new marker',
//     map,
//     draggable: props.editMode,
//     animation: google.maps.Animation.DROP,
//     position,
//   })

//   const clickListener = google.maps.event.addListener(
//     map,
//     'click',
//     ({ latLng }: any) => {
//       if (!props.editMode) return
//       const lat = latLng.lat()
//       const lng = latLng.lng()
//       if (!marker.value) return
//       marker.value.setPosition({
//         lat,
//         lng,
//       })
//       props.block.text = `${lat},${lng}`
//     }
//   )

//   const dragEndListener = google.maps.event.addListener(
//     marker.value,
//     'dragend',
//     () => {
//       if (!props.editMode) return
//       if (!marker.value) return
//       const lat = marker.value.getPosition()?.lat?.toString() ?? ''
//       const lng = marker.value.getPosition()?.lng?.toString() ?? ''
//       props.block.text = `${lat},${lng}`
//     }
//   )

//   return () => {
//     google.maps.event.removeListener(clickListener)
//     google.maps.event.removeListener(dragEndListener)
//   }
// }

// onMounted(() => {
//   loadMap()
// })
</script>
