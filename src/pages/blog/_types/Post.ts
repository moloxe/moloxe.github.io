import type { Block } from './Blocks'

export type Post = {
  postId?: string
  uid?: string
  username?: string
  title: string
  slugUrl?: string
  imageURL?: string
  description?: string
  categories: string[]
  creationDate: Date
  lastUpdate: Date
  container: Block[]
  isPinned?: boolean
}

export type PostCard = Pick<
  Post,
  'title' | 'slugUrl' | 'categories' | 'creationDate' | 'imageURL' | 'isPinned'
> & {
  readingTime: number
}
