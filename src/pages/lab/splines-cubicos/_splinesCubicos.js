let points = []
function setup() {
  const cnv = createCanvas(min(window.innerWidth * 0.95, 640), 420)
  cnv.parent('cnv')

  document.getElementById('matriz').style.maxWidth = `${width}px`

  const inputN = createInput(8)
  inputN.id('inputN')

  const docInput = document.getElementById('inputN')
  docInput.type = 'number'
  docInput.min = 4
  docInput.max = 50

  const buttonN = createButton('Generar')
  buttonN.id('buttonN')
  buttonN.class('bg-primary px-2')
  let docButton = document.getElementById('buttonN')
  docButton.onclick = () => drawSpline()

  inputN.parent('interactive')
  buttonN.parent('interactive')

  drawSpline()
}

function mouseClicked() {
  let x = mouseX
  let y = mouseY

  if (x < 0 || width < x) return
  if (y < 0 || height < y) return

  for (let i = 0; i < n; i++) {
    if (x < points[i][0]) {
      let pos = i
      points.splice(pos, 0, [x, y])
      n++
      break
    }
  }
  document.getElementById('inputN').value = n
  scubics()
}

function getZi(Matriz_A, Matriz_B) {
  let n = Matriz_A.length
  let s = 0,
    q = 0
  let C = []

  let Matriz_I = []
  for (let i = 0; i < n; i++) {
    Matriz_I.push([])
    for (let j = 0; j < n; j++) {
      Matriz_I[i].push([])
      if (i == j) Matriz_I[i][j] = 1
      else Matriz_I[i][j] = 0
    }
  }

  for (let k = 1; k <= n - 1; k++) {
    C = []
    for (let i = 0; i < n; i++) {
      C.push([])
      for (let j = 0; j < n; j++) {
        C[i].push(0)
      }
    }

    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++)
        for (let z = 0; z < n; z++) {
          C[i][j] = C[i][j] + Matriz_A[i][z] * Matriz_I[z][j]
        }

    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        if (i == j) s = s + C[i][j]
      }
    q = s / k

    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        if (i == j) {
          Matriz_I[i][j] = C[i][j] - q
        } else {
          Matriz_I[i][j] = C[i][j]
        }
      }
    s = 0
  }

  C = []
  for (let i = 0; i < n; i++) {
    C.push([])
    for (let j = 0; j < n; j++) {
      C[i].push(0)
    }
  }

  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++)
      for (let z = 0; z < n; z++)
        C[i][j] = C[i][j] + Matriz_A[i][z] * Matriz_I[z][j]
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      if (i == j) s = s + C[i][j]
    }

  if (s / n != 0) {
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) Matriz_I[i][j] = Matriz_I[i][j] / (s / n)
  }

  let Matriz_X = []
  for (let i = 0; i < n; i++) {
    Matriz_X.push(0)
  }

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i == 0) Matriz_X[i] += Matriz_I[i][j] * Matriz_B[j]
      else Matriz_X[i] += Matriz_I[i][j] * Matriz_B[j]
    }
  }
  return Matriz_X
}

function drawSpline() {
  n = inputN.value
  points = []
  for (let i = 0; i < n; i++) {
    let x = random((i * width) / n, ((i + 1) * width) / n)
    let y = height / 3 + random(0, height / 3)
    points.push([x, y])
  }
  scubics()
}

function scubics() {
  let h = []
  for (let i = 0; i < n - 1; i++) h.push(points[i + 1][0] - points[i][0])

  let mat = []
  for (let i = 0; i < n - 2; i++) {
    mat.push([])
    for (let j = 0; j < n - 2; j++) mat[i].push(0)
  }

  mat[0][0] = 2 * (h[0] + h[1])
  mat[0][1] = h[1]
  for (let i = 1; i < mat.length - 1; i++) {
    mat[i][i - 1] = h[i]
    mat[i][i] = 2 * (h[i] + h[i + 1])
    mat[i][i + 1] = h[i + 1]
  }
  mat[mat.length - 1][mat.length - 2] = h[h.length - 2]
  mat[mat.length - 1][mat.length - 1] = 2 * (h[h.length - 2] + h[h.length - 1])

  const matrizEle = document.getElementById('matriz')
  matrizEle.innerHTML = ''
  for (let m of mat) {
    for (let v of m) {
      let str = ''
      for (let i = 0; i < 7 - v.toFixed(2).length; i++) str += '&nbsp;'
      matrizEle.innerHTML += str
      matrizEle.innerHTML += v.toFixed(2)
    }
    matrizEle.innerHTML += '<br />'
  }

  let fi = []
  document.getElementById('arregloRes').innerHTML = ''
  for (let i = 1; i < n - 1; i++) {
    fi.push(
      6 *
        ((points[i + 1][1] - points[i][1]) / h[i] -
          (points[i][1] - points[i - 1][1]) / h[i - 1])
    )
    document.getElementById('arregloRes').innerHTML +=
      fi[i - 1].toFixed(2) + '<br />'
  }

  let temp = getZi(mat, fi)
  let z = [0]
  for (let t of temp) z.push(t)
  z.push(0)

  document.getElementById('arregloInc').innerHTML = ''
  for (let t of z) {
    document.getElementById('arregloInc').innerHTML += t.toFixed(2) + '<br>'
  }
  noFill()
  clear()
  background(0)
  stroke(255)
  strokeWeight(3)

  beginShape()
  for (let i = 0; i < n - 1; i++) {
    let str = points[i][0]
    let end = points[i + 1][0]

    let A = (1 / (6 * h[i])) * (z[i + 1] - z[i])
    let B = z[i] / 2
    let C =
      (-h[i] / 6) * z[i + 1] -
      (h[i] / 3) * z[i] +
      (1 / h[i]) * (points[i + 1][1] - points[i][1])
    let ti = points[i][0]
    let yi = points[i][1]

    for (let x = str; x < end; x++) {
      let y = yi + (x - ti) * (C + (x - ti) * (B + (x - ti) * A))
      vertex(x, y)
    }
  }
  endShape()

  strokeWeight(2)
  stroke(250)
  fill(0)
  for (let p of points) ellipse(p[0], p[1], 7, 7)
}
