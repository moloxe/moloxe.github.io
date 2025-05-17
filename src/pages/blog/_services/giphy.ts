const GIPHY_URL = 'https://api.giphy.com/v1/gifs'
const GIPHY_API_KEY = 'X5WYqUT7jJRgrnbt0Vj7Rn7duWW54V5Y'

const GiphyService = {
  searchGifs: async function (query: string, lang: string) {
    const urlPath = query ? GIPHY_URL + '/search' : GIPHY_URL + '/trending'
    const params = new URLSearchParams({
      api_key: GIPHY_API_KEY,
      limit: '20',
      q: query,
      lang,
    })

    const res = await fetch(`${urlPath}?${params}`)

    if (res.status === 200) {
      const data = await res.json()
      return data.data
    } else throw new Error('error searching gifs')
  },
  searchGif: async function (query: string) {
    const urlPath = query ? GIPHY_URL + '/search' : GIPHY_URL + '/trending'
    const params = new URLSearchParams({
      api_key: GIPHY_API_KEY,
      limit: '1',
      q: query.slice(0, 50),
      lang: 'en',
    })
    const res = await fetch(`${urlPath}?${params}`)
    if (res.status === 200) {
      const { data } = await res.json()
      const gifUrl = data[0]?.images?.downsized?.url as string
      return gifUrl
    } else throw new Error('error searching gifs')
  },
  getGifById: function (id: string) {
    return `https://media.giphy.com/media/${id}/giphy.gif`
  },
}

export default GiphyService
