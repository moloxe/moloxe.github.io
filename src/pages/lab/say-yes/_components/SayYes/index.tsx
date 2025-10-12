import { useEffect, useState } from 'react'
import ShyButton from '../ShyButton'

function loadConfettiScript() {
  const confettiScript = document.createElement('script')
  confettiScript.src =
    'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js'
  document.head.appendChild(confettiScript)
}

declare var confetti: any
function runConfetti() {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
  })
}

const baseButton =
  'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg px-4 py-2 text-lg'

const SayYes = () => {
  const [question, setQuestion] = useState('')
  const [input, setInput] = useState('')
  const [celebrating, setCelebrating] = useState(false)

  function onGo() {
    const text = input || 'Say yes!'
    const obfuscatedUtf8 = btoa(encodeURIComponent(text))
    window.location.href = `${window.location.pathname}?q=${encodeURIComponent(
      obfuscatedUtf8
    )}`
  }

  function onYes() {
    if (celebrating) return
    setCelebrating(true)
    runConfetti()
    setInterval(runConfetti, 2000)
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const obfuscatedUtf8 = params.get('q')
    if (obfuscatedUtf8) {
      const text = decodeURIComponent(atob(obfuscatedUtf8))
      setQuestion(text)
    }
    loadConfettiScript()
  }, [])

  return (
    <div className="relative p-4 flex-1 flex flex-col gap-8 justify-center items-center">
      {celebrating && (
        <div className="grid grid-cols-2 h-[20rem]">
          <img
            className="h-full w-auto object-cover"
            src="https://i.giphy.com/K3Sbp8fOgKye4.webp"
            alt="lisa dancing"
          />
          <img
            className="h-full w-auto object-cover"
            src="https://i.giphy.com/blSTtZehjAZ8I.webp"
            alt="kid dancing"
          />
        </div>
      )}
      {!celebrating && question && (
        <>
          <h1 className="font-extrabold text-2xl">{question}</h1>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={onYes} className={`${baseButton} animate-bounce`}>
              Yes
            </button>
            <ShyButton title="No" />
          </div>
        </>
      )}
      {!celebrating && !question && (
        <div className="flex gap-4">
          <input
            className="px-2 rounded"
            placeholder="Write something..."
            type="text"
            value={input}
            onChange={({ currentTarget: { value } }) => setInput(value)}
          />
          <button onClick={onGo} className={baseButton}>
            Go
          </button>
        </div>
      )}
    </div>
  )
}

export default SayYes
