import fs from 'fs'
import { Post } from '../../src/pages/blog/_types/Post'
import {
  parsePost,
  slugifyForPost,
  stringifyPost,
} from '../../src/pages/blog/_utils/post'

const isDev = process.argv[2] === '--dev'
const BLOG_DATA_PATH = 'local/blog-data-server/data'

export function getPosts() {
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

export function createPost(title: string) {
  const slugUrl = slugifyForPost(title)
  const date = new Date()
  const fileContent = stringifyPost({
    title,
    creationDate: date,
    lastUpdate: date,
    categories: [],
    container: [
      {
        text: 'Hi!',
        type: 'MarkdownBlock',
      },
    ],
  })
  const dirPath = `${BLOG_DATA_PATH}/${slugUrl}`
  const existDir = fs.existsSync(dirPath)

  if (existDir) throw new Error(`slug-url '${slugUrl}' already exists.`)

  fs.mkdirSync(dirPath)
  fs.writeFileSync(`${dirPath}/post.json`, fileContent, {
    encoding: 'utf-8',
  })

  return slugUrl
}

export function updatePost(post: Post) {
  const slugUrl = slugifyForPost(post.title)

  post.creationDate = new Date(post.creationDate)
  post.lastUpdate = new Date()
  post.container = post.container.map(({ id, ...block }) => block)
  const fileContent = stringifyPost(post)

  fs.writeFileSync(`${BLOG_DATA_PATH}/${slugUrl}/post.json`, fileContent, {
    encoding: 'utf-8',
  })

  return slugUrl
}

export async function updatePostTitle(oldTitle: string, newTitle: string) {
  const oldSlugUrl = slugifyForPost(oldTitle)
  const oldDirPath = `${BLOG_DATA_PATH}/${oldSlugUrl}`

  const post = JSON.parse(
    fs.readFileSync(`${oldDirPath}/post.json`, {
      encoding: 'utf-8',
    })
  ) as Post

  const newSlugUrl = slugifyForPost(newTitle)

  post.title = newTitle
  post.slugUrl = newSlugUrl
  post.creationDate = new Date(post.creationDate)
  post.lastUpdate = new Date()

  const newDirPath = `${BLOG_DATA_PATH}/${newSlugUrl}`

  if (fs.existsSync(newDirPath))
    throw new Error(`Directory ${newDirPath} already exists.`)

  fs.cpSync(oldDirPath, newDirPath, { recursive: true })
  fs.rmSync(oldDirPath, { recursive: true, force: true })

  await updatePost(post)

  return newSlugUrl
}

export async function uploadPostImage(slugUrl: string, image: File) {
  const postImagesPath = `${BLOG_DATA_PATH}/${slugUrl}/img`

  if (!fs.existsSync(postImagesPath)) fs.mkdirSync(postImagesPath)

  const name = image.name
  const imagePath = `${postImagesPath}/${name}`

  const existFile = fs.existsSync(imagePath)
  if (existFile) if (!image) throw new Error(`File ${imagePath} already exist.`)

  const buffer = await image.arrayBuffer()
  fs.writeFileSync(imagePath, Buffer.from(buffer), {
    encoding: 'utf-8',
  })

  return `/${image.name}`
}

export function getPostImages(slugUrl: string) {
  const dirents = fs.readdirSync(`${BLOG_DATA_PATH}/${slugUrl}/img`, {
    withFileTypes: true,
  })
  const images = dirents.map(({ name }) => name)
  return images
}

export function getPostImage(slugUrl: string, imgName: string) {
  const image = fs.readFileSync(`${BLOG_DATA_PATH}/${slugUrl}/img/${imgName}`)
  return image
}
