import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import {
  createPost,
  getPostImage,
  updatePost,
  updatePostTitle,
  uploadPostImage,
} from './actions'
import { Post } from '../../src/pages/blog/_types/Post'

const app = new Elysia()
  .use(cors())
  .post('/post', ({ body }) => {
    const { title } = JSON.parse(body as any)
    const slugUrl = createPost(title)
    return { slugUrl }
  })
  .put('/post', ({ body }) => {
    const post = JSON.parse(body as any).post as Post
    const slugUrl = updatePost(post)
    return { slugUrl }
  })
  .patch('/post-title', async ({ body }) => {
    const { oldTitle, newTitle } = JSON.parse(body as any)
    const slugUrl = await updatePostTitle(oldTitle, newTitle)
    return { slugUrl }
  })
  .post('/image/:slugUrl', async ({ request, params: { slugUrl } }) => {
    const formData = await request.formData()
    const image = formData.get('image') as File
    const name = await uploadPostImage(slugUrl, image)
    return name
  })
  .listen(6969)

console.log(`Blog: ${app.server?.url}`)
