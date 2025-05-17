import { useState, type FC } from 'react'

type Props = {
  photos: string[]
}

const PhotoGallery: FC<Props> = ({ photos }) => {
  const [pickedPhoto, setPickedPhoto] = useState(0)

  function pickPhoto(index: number) {
    setPickedPhoto(index)
  }
  return (
    <div
      className={`photo-gallery relative grid overflow-hidden ${
        photos.length > 1 ? 'grid-rows-[1fr_auto]' : ''
      }`}
    >
      {photos.length > 1 && (
        <div className="z-10 flex overflow-x-auto bg-[#000a]">
          <div className="flex">
            {photos.map((photo, index) => (
              <button
                key={photo}
                className={`
                  flex overflow-hidden w-40 h-40
                  ${pickedPhoto === index ? 'border-2 border-white' : ''}
                `}
                onClick={() => pickPhoto(index)}
              >
                <img
                  className={`
                    flex h-full w-full object-cover
                    transition duration-300 ease-in-out scale-110 hover:scale-100
                  `}
                  draggable="false"
                  src={photo}
                  alt={photo + ' option to select'}
                />
              </button>
            ))}
          </div>
        </div>
      )}
      <img
        className="absolute z-0 top-0 flex h-full w-full aspect-[4/3] object-cover blur-lg"
        src={photos[pickedPhoto]}
        alt="blured cover"
      />
      <div className="z-10 overflow-hidden">
        <img
          className="flex h-auto w-full aspect-[4/3] object-contain transition duration-300 ease-in-out"
          src={photos[pickedPhoto]}
          alt="product"
        />
      </div>
    </div>
  )
}

export default PhotoGallery
