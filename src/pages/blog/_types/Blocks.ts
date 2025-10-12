export type BlockType =
  | 'MarkdownBlock'
  | 'ImageBlock'
  | 'GiphyBlock'
  | 'MapBlock'
  | 'EmbedBlock'
  | 'LiveCodeBlock'
  | 'LinkBlock'

export type Block = {
  text: string
  type: BlockType
  id?: string
}
