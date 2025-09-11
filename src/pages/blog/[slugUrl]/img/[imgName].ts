import PostService from '@src/pages/blog/_services/posts'
import type { APIRoute } from 'astro'

export const GET: APIRoute = async ({ params }) => {
  const { slugUrl, imgName } = params
  if (!slugUrl || !imgName) throw new Error('Some param is undefined.')
  const image = await PostService.getPostImage(slugUrl, imgName)
  return new Response(image as any) // 'Buffer' is allowed as response only for 'node'
}

export async function getStaticPaths() {
  const posts = await PostService.getPosts()
  const paths: { params: { slugUrl: string; imgName: string } }[] = []
  posts.forEach(({ container, slugUrl }) => {
    if (!slugUrl) return
    container.forEach((block) => {
      if (block.type === 'ImageBlock') {
        const isLocal = block.text.startsWith('/')
        if (isLocal) {
          const imgName = block.text.substring(1)
          paths.push({
            params: {
              imgName,
              slugUrl,
            },
          })
        }
      }
    })
  })
  return paths
}
