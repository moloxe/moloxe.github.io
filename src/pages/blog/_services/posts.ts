import type { Post, PostCard } from '@src/pages/blog/_types/Post'
import { parsePost, toPostCard } from '@src/pages/blog/_utils/post'
import {
  getBlogPostImage,
  getBlogPostImages,
  getBlogPosts,
} from '../_utils/posts-folder-queries'

const BASE_ULR = 'http://localhost:6969'

const PostService = {
  async getPosts() {
    let posts = getBlogPosts()
    posts = posts.map(parsePost)
    return posts
  },
  async getCategories() {
    const posts = await PostService.getPosts()
    const categoriesFreq: { [category: string]: number } = {}

    const flatCategories = posts.map(({ categories }) => categories).flat()
    const uniqueCategories = new Set(flatCategories)
    const categories = Array.from(uniqueCategories)

    flatCategories.forEach((category) => {
      categoriesFreq[category] = (categoriesFreq[category] ?? 0) + 1
    })

    categories.sort((catA, catB) => {
      const freqA = categoriesFreq[catA]
      const freqB = categoriesFreq[catB]
      if (freqA === freqB) return catA.localeCompare(catB)
      return freqB - freqA
    })

    return categories
  },
  async getPostCards() {
    const posts = await PostService.getPosts()
    const cards: PostCard[] = []
    for (let index = 0; index < posts.length; index++) {
      const card = await toPostCard(posts[index])
      cards.push(card)
    }
    return cards
  },
  async getPinnedPostCard() {
    let postCards = await PostService.getPostCards()
    postCards = postCards.filter((card) => card.isPinned)
    return postCards
  },
  async getPost(slugUrl: string) {
    const posts = await PostService.getPosts()
    const post = posts.find((post) => post.slugUrl === slugUrl)
    if (!post) throw new Error('Post not found.')
    return post
  },
  async getPinnedPostCards() {
    const posts = await PostService.getPosts()
    const filteredPosts = posts.filter((post) => post.isPinned)
    return filteredPosts
  },
  async createPost(title: string) {
    const res = await fetch(`${BASE_ULR}/post`, {
      method: 'POST',
      body: JSON.stringify({ title }),
    })
    if (!res.ok) throw new Error('Error creating post.')
    const slugUrl = (await res.json()).slugUrl as string
    return slugUrl
  },
  async updatePost(post: Post) {
    const res = await fetch(`${BASE_ULR}/post`, {
      method: 'PUT',
      body: JSON.stringify({ post }),
    })
    if (!res.ok) throw new Error('Error updating post.')
    const slugUrl = (await res.json()).slugUrl as string
    return slugUrl
  },
  async updateTitle(oldTitle: string, newTitle: string) {
    const res = await fetch(`${BASE_ULR}/post-title`, {
      method: 'PATCH',
      body: JSON.stringify({ oldTitle, newTitle }),
    })
    if (!res.ok) throw new Error('Error updating post title.')
    const slugUrl = (await res.json()).slugUrl as string
    return slugUrl
  },
  async getPostImages(slugUrl: string) {
    const images = getBlogPostImages(slugUrl)
    return images
  },
  getPostImage(slugUrl: string, imgName: string) {
    const imageBuffer = getBlogPostImage(slugUrl, imgName)
    return imageBuffer
  },
  async uploadPostImage(slugUrl: string, image: File) {
    const formData = new FormData()
    formData.append('image', image)
    const res = await fetch(`${BASE_ULR}/image/${slugUrl}`, {
      method: 'POST',
      body: formData,
    })
    const url = await res.text()
    return url
  },
}

export default PostService
