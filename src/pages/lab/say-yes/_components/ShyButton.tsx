import { useRef, useState, type FC } from 'react'

function easeInOut(t: number) {
  t = Math.max(0, Math.min(1, t))
  return 0.5 * (1 - Math.cos(Math.PI * t))
}

type Props = {
  title: string
}

const ShyButton: FC<Props> = ({ title }) => {
  const ref = useRef<HTMLButtonElement>(null)
  const [isHidding, setIsHidding] = useState(false)

  function handleOnClick() {
    setIsHidding(true)

    if (!ref.current) {
      alert('Lo rompiste pndj 💀')
      return
    }

    const {
      top: initY,
      left: initX,
      width,
      height,
    } = ref.current.getBoundingClientRect()
    const targetX = (window.innerWidth - width) * Math.random()
    const targetY = (window.innerHeight - height) * Math.random()
    const distance = Math.sqrt((targetX - initX) ** 2 + (targetY - initY) ** 2)

    let ini = 0
    let end = 0
    const step = (time: number) => {
      if (end === 0) {
        ini = time
        end = time + distance
      }
      let progress = (time - ini) / (end - ini)
      progress = easeInOut(progress)

      if (!ref.current) {
        alert('Lo rompiste pndj 💀')
        return
      }

      ref.current.style.top = `${initY * (1 - progress) + targetY * progress}px`
      ref.current.style.left = `${initX * (1 - progress) + targetX * progress
        }px`
      if (time < end) window.requestAnimationFrame(step)
    }

    window.requestAnimationFrame(step)
  }

  return (
    <button
      ref={ref}
      onClick={handleOnClick}
      className={`
        ${isHidding ? 'absolute' : ''}
        bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500
        rounded-lg px-4 py-2 text-lg
      `}
    >
      {title}
    </button>
  )
}

export default ShyButton
