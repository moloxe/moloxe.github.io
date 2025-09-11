import fs from 'fs'
import type { Post } from '../_types/Post'
import { parsePost } from './post'

const BLOG_DATA_PATH = './local/blog-data-server/data'

export function getBlogPosts() {
  const postFileNames = fs.readdirSync(BLOG_DATA_PATH)

  let posts: Post[] = []

  for (let index = 0; index < postFileNames.length; index++) {
    const fileName = postFileNames[index]
    const path = `${BLOG_DATA_PATH}/${fileName}/post.json`
    const file = fs.readFileSync(path, { encoding: 'utf8' })

    const post = JSON.parse(file) as Post
    post.slugUrl = fileName.split('.json')[0]
    posts.push(parsePost(post))
  }

  posts.sort((p1, p2) => {
    const d1 = new Date(p1.creationDate).getTime()
    const d2 = new Date(p2.creationDate).getTime()
    return d2 - d1
  })

  return posts
}
