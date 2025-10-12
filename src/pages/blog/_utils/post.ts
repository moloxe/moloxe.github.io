import type { BlockType } from '@src/pages/blog/_types/Blocks'
import type { Post, PostCard } from '@src/pages/blog/_types/Post'
import GenericImg from '@src/assets/img/generic.jpg'
import GiphyService from '@src/pages/blog/_services/giphy'
import { GiphyBlockUtils } from '../_components/BlockList/blocks/utils'

export function calcReadingTime({ title, categories, container }: Post) {
  const TIME_TO_UNDERSTAND = 2.5 // between 2 and 3 times
  const WORDS_PER_MIN = 200 / TIME_TO_UNDERSTAND
  const WORDS_PER_CONTENT = 35 // betweenn 20 and 50 words
  const completeContentLength = `${title} ${categories.join(' ')} ${container
    .map(({ text, type }) => {
      if (type === 'MarkdownBlock') return text.length
      return 'x '.repeat(WORDS_PER_CONTENT)
    })
    .join(' ')}`.split(' ').length
  const readingTime = Math.ceil(completeContentLength / WORDS_PER_MIN)
  return readingTime
}

export const getPosterFromPost = ({ container, slugUrl }: Post) => {
  const blockImgSource = container.find(({ type }) =>
    (['ImageBlock', 'GiphyBlock', 'LinkBlock'] as BlockType[]).includes(type)
  )
  let imageURL: string | undefined
  if (blockImgSource?.type === 'ImageBlock' && blockImgSource?.text) {
    imageURL = `/blog/${slugUrl}/img${blockImgSource.text}`
  }
  if (blockImgSource?.type === 'GiphyBlock') {
    imageURL = GiphyService.getGifById(
      GiphyBlockUtils.getIdFromGiphyBlock(blockImgSource?.text ?? '')
    )
  }
  if (!imageURL) imageURL = GenericImg.src
  return imageURL
}

export const toPostCard = async (post: Post) => {
  const { title, creationDate, categories, slugUrl, isPinned } = post
  const readingTime = calcReadingTime(post)
  const imageURL = getPosterFromPost(post)

  const card: PostCard = {
    title,
    creationDate,
    categories,
    slugUrl,
    imageURL,
    readingTime,
    isPinned,
  }

  return card
}

export const parsePost = (post: any): Post => ({
  ...post,
  creationDate: new Date(post.creationDate),
  lastUpdate: new Date(post.lastUpdate),
})

export function slugifyForPost(title: string) {
  let slugUrl = title
    .toLowerCase()
    .replaceAll(' ', '-')
    .split('')
    .filter((char) => {
      if (char === '-') return true
      const code = char.charCodeAt(0)
      const isAlpha = code >= 97 && code <= 122
      const isNumeric = code >= 48 && code <= 57
      return isAlpha || isNumeric
    })
    .join('')
  while (slugUrl.includes('--')) {
    slugUrl = slugUrl.replaceAll('--', '-')
  }
  while (slugUrl.startsWith('-')) {
    slugUrl = slugUrl.substring(1)
  }
  while (slugUrl.endsWith('-')) {
    slugUrl = slugUrl.substring(0, slugUrl.length - 1)
  }
  return slugUrl
}

export function stringifyPost(postWithExtraProps: Post) {
  const { slugUrl, ...post } = postWithExtraProps
  return JSON.stringify(post, null, 2)
}
