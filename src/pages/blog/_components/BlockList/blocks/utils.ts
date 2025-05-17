export const GiphyBlockUtils = {
  GIPHY_BLOCK_DIVIDER: '$%&',
  getIdFromGiphyBlock(text: string) {
    return text.split(GiphyBlockUtils.GIPHY_BLOCK_DIVIDER)[0]
  },
  getQuoteFromGiphyBlock(text: string) {
    return text.split(GiphyBlockUtils.GIPHY_BLOCK_DIVIDER)[1]
  },
  formatGiphyBlock(gifId: string, quote: string) {
    return `${gifId}${GiphyBlockUtils.GIPHY_BLOCK_DIVIDER}${quote}`
  },
}

export const LiveCodeBlockUtils = {
  parseLiveCodeBlock(text: string) {
    const obj = JSON.parse(text || '{}')
    let html = obj.html || ''
    const js = `<script>${obj.js || ''}</script>`
    const css = `<style>${obj.css || ''}</style>`
    html = html.replace('</body>', `${js}</body>`)
    html = html.replace('</head>', `${css}</head>`)
    return html
  },
  DEFAULT_TEXT: JSON.stringify({
    html: '<html>\n  <head>\n  </head>\n  <body>\n  </body>\n</html>',
    js: '',
    css: '',
  }),
}
