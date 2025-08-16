function frameCounter() {
  let frameCounter = 0
  const counter = document.createElement('div')

  counter.setAttribute(
    'style',
    `   position: absolute;
        top: 0;
        left: 0;
        color: white;
        font-size: 24px;
        pointer-events: none;
    `
  )

  document.body.appendChild(counter)

  setInterval(() => {
    counter.innerText = `FPS: ${frameCounter}`
    frameCounter = 0
  }, 1000)

  return () => {
    frameCounter++
  }
}

export default frameCounter
