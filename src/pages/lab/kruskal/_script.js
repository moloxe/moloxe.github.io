function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function findSet(parent, u) {
  if (parent[u] == u) return u
  parent[u] = findSet(parent, parent[u])
  return parent[u]
}

function unionSet(parent, rnk, u, v) {
  u = findSet(parent, u)
  v = findSet(parent, v)
  if (u != v) {
    if (rnk[u] < rnk[v]) {
      temp = u
      u = v
      v = temp
    }
    parent[v] = u
    if (rnk[u] == rnk[v]) rnk[u] += 1
  }
}

function setup() {
  const cnv = createCanvas(windowHeight, windowHeight)
  cnv.parent('kruskal-cnv')
}

async function draw() {
  noLoop()
  background(255)

  let n = 10
  let node = []
  for (let i = 0; i < n; i++) {
    node.push([20 + random(width - 40), 20 + random(height - 40)])
  }

  let edge = []
  let cont = 0
  stroke(222)
  strokeWeight(1)
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      let w = Math.sqrt(
        (node[i][0] - node[j][0]) ** 2 + (node[i][1] - node[j][1]) ** 2
      )
      edge.push([w, i, j])
      let x1 = node[edge[cont][1]][0]
      let y1 = node[edge[cont][1]][1]
      let x2 = node[edge[cont][2]][0]
      let y2 = node[edge[cont][2]][1]
      line(x1, y1, x2, y2)
      cont++
    }
  }

  stroke(0)
  fill(255)
  for (let i = 0; i < n; i++) circle(node[i][0], node[i][1], 8)

  let path = []
  {
    let restore = []
    let vis = []
    let parent = []
    let rnk = []
    for (let i = 0; i < n; i++) {
      parent.push(i)
      rnk.push(0)
      vis.push(false)
    }

    noStroke()
    fill(255)
    cont = 0
    while (cont < n - 1) {
      // 2*n

      edge.sort(function (a, b) {
        if (a[0] === b[0]) {
          return 0
        } else {
          return a[0] > b[0] ? -1 : 1
        }
      })

      let e = edge.pop()

      if (findSet(parent, e[1]) != findSet(parent, e[2]) || cont >= n - 1) {
        vis[e[1]] = vis[e[2]] = true
        unionSet(parent, rnk, e[1], e[2])

        let x1 = node[e[1]][0]
        let y1 = node[e[1]][1]
        let x2 = node[e[2]][0]
        let y2 = node[e[2]][1]

        stroke(200, 0, 0)
        strokeWeight(2)
        line(x1, y1, x2, y2)
        strokeWeight(1)
        stroke(0)
        fill(255)
        circle(x1, y1, 8)
        circle(x2, y2, 8)

        path.push([e[1], e[2]])
        cont++
        await sleep(100)
      } else {
        restore.push(e)
      }
    }
  }

  await sleep(2000)
  loop()
}
