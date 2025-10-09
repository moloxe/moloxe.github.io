import {
  createPost,
  getPostImage,
  getPostImages,
  getPosts,
  updatePost,
  updatePostTitle,
  uploadPostImage,
} from './actions'
import { Post } from '../../src/pages/blog/_types/Post'

const PORT = 6969

console.log(`Blog: http://localhost:${PORT}/post`)

Bun.serve({
  port: PORT,
  routes: {
    '/post': {
      GET() {
        const posts = getPosts()
        return Response.json({ posts })
      },
      async POST(req) {
        const { title } = await req.json()
        const slugUrl = createPost(title)
        return Response.json({ slugUrl })
      },
      async PUT(req) {
        const post = (await req.json()).post as Post
        const slugUrl = updatePost(post)
        return Response.json({ slugUrl })
      },
    },
    '/post-title': {
      async PATCH(req) {
        const { oldTitle, newTitle } = await req.json()
        const slugUrl = await updatePostTitle(oldTitle, newTitle)
        return Response.json({ slugUrl })
      },
    },
    '/image/:slugUrl': {
      GET(req) {
        const images = getPostImages(req.params.slugUrl)
        return Response.json({ images })
      },
      async POST(req) {
        const formData = await req.formData()
        const image = formData.get('image') as File
        if (image === null) throw new Error('image is null')
        const name = await uploadPostImage(req.params.slugUrl, image)
        return Response.json({ name })
      },
    },
    '/image/:slugUrl/:imgName': {
      async GET(req) {
        const bytes = await getPostImage(req.params.slugUrl, req.params.imgName)
        return new Response(bytes)
      },
    },
  },
})
