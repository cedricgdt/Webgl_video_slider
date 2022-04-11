let CANVAS_WIDTH = window.innerWidth
let CANVAS_HEIGHT = window.innerHeight
const SLIDE_VIDEO_URLS = new Array(9).fill(null).map((_, i) => `video_${i + 1}.mp4`)
let nextSlideIdx = 0
let activeSlideIdx = 0
let slideMixFactor = 0
let slideTransitionPlayback

const canvas = document.getElementById('canvas')
canvas.width = CANVAS_WIDTH * devicePixelRatio
canvas.height = CANVAS_HEIGHT * devicePixelRatio
canvas.style.setProperty('width', `${CANVAS_WIDTH}px`)
canvas.style.setProperty('height', `${CANVAS_HEIGHT}px`)

const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')

// Create and compile vertex & fragment shaders on GPU
const vertexShader = createShader(gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE)
const fragmentShader = createShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE)

// Create a WebGLProgram and link the vertex & fragment shaders to it on the GPU
const drawingProgram = createProgram(vertexShader, fragmentShader)

// Create a array holding the positions of our point to be rendered
const QUAD_WIDTH = 2
const QUAD_HEIGHT = 2
const positions = new Float32Array([
  -QUAD_WIDTH / 2, -QUAD_HEIGHT / 2,
  QUAD_WIDTH / 2, -QUAD_HEIGHT / 2,
  QUAD_WIDTH / 2, QUAD_HEIGHT / 2,
  -QUAD_WIDTH / 2, QUAD_HEIGHT / 2,
])

// Create a WebGLBuffer that will hold our positions to be supplied to the GPU (vertex shader)
const vertexBuffer = gl.createBuffer()

// Create a webGLBuffer that will hold our UVs to be supplied to the GPU
const uvBuffer = gl.createBuffer()

// Create a anrry that holds our uvs as float with 32 bit precision
const uvs = new Float32Array([
  0, 0,
  1, 0,
  1, 1,
  0, 1
])

// Create an array holding the indices that describe our vertex connectivity  
const indices = new Uint16Array([
  1, 2, 0,
  0, 2, 3
]) 

// Create a special webGLBuffer that will hold the indices describing our 2 triangles
const indexBuffer = gl.createBuffer()

// Look up "position" attribute variable location on our GPU
const positionAttributeLocationOnGPU = gl.getAttribLocation(drawingProgram, 'position') // 0

// Look up "uv" attribute variable location on our GPU
const uvAttributeLocationOnGPU = gl.getAttribLocation(drawingProgram, 'uv') // 1

// Look up "textures" attribute variable location on our GPU
const texturesUniformLocationOnGPU = gl.getUniformLocation(drawingProgram, 'textures')

// Look up "activeSlideIdx" attribute variable location on our GPU
const activeSlideIdxUniformLocationOnGPU = gl.getUniformLocation(drawingProgram, 'activeSlideIdx')

// Look up "nextSlideIdx" attribute variable location on our GPU
const nextSlideIdxUniformLocationOnGPU = gl.getUniformLocation(drawingProgram, 'nextSlideIdx')

// Look up "slideMixFactor" attribute variable location on our GPU
const slideMixFactorUniformLocationOnGPU = gl.getUniformLocation(drawingProgram, 'slideMixFactor')

const canvasSizeLocationOnGPU = gl.getUniformLocation(drawingProgram, "canvasSize") 
const videoSizeLocationOnGPU = gl.getUniformLocation(drawingProgram, "videoSize") 
const backgroundSizeModeLocationOnGPU = gl.getUniformLocation(drawingProgram, "backgroundSizeMode") 


// Create a webgl texture
let textures 

// Videos
let videos

// LOAD VIDEOS
Promise.all(SLIDE_VIDEO_URLS.map(urlOfVideoToBeLoaded => loadVideo(`/webgl-slider-video/${urlOfVideoToBeLoaded}`))).then((arrayOfVideos) => {
  videos = arrayOfVideos
  textures = arrayOfVideos.map(createWebGLTexture)
}).catch((err) => console.log(err))


  // Buttons
  const prevButtonSlider = document.getElementById("prev-button")
  const nextButtonSlider = document.getElementById("next-button")

  prevButtonSlider.addEventListener("click", onButtonSliderClick)
  nextButtonSlider.addEventListener("click", onButtonSliderClick)

  function onButtonSliderClick(e) {
    const clickedButtonID = e.target.getAttribute("id")

    if (slideTransitionPlayback) {
      slideTransitionPlayback.stop()
    }

    if (clickedButtonID === "prev-button") {
      nextSlideIdx--
      if (nextSlideIdx === -1) {
        nextSlideIdx = SLIDE_VIDEO_URLS.length - 1
      }
      slideTransitionPlayback = popmotion.animate({
        duration: 500,
        ease: popmotion.easeIn,
        onUpdate: v => {
          slideMixFactor = v
        },
        onComplete: () => {
          activeSlideIdx--
          if (activeSlideIdx === -1) {
            activeSlideIdx = SLIDE_VIDEO_URLS.length - 1
          }
          slideMixFactor = 0
        }
      })
    } else if (clickedButtonID === "next-button") {
      nextSlideIdx++
      if (nextSlideIdx === SLIDE_VIDEO_URLS.length) {
        nextSlideIdx = 0
      }
      slideTransitionPlayback = popmotion.animate({
        duration: 500,
        ease: popmotion.easeIn,
        onUpdate: v => {
          slideMixFactor =  v
        },
        onComplete: () => {
          activeSlideIdx = nextSlideIdx
          slideMixFactor = 0
        }
      })
    }
  }

function createWebGLTexture(image) {
  const texture = gl.createTexture()

  gl.bindTexture(gl.TEXTURE_2D, texture)
  
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

  gl.uniform2f(videoSizeLocationOnGPU, image.videoWidth, image.videoHeight)

  gl.uniform1i(backgroundSizeModeLocationOnGPU, 1)

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image)

  // gl.generateMipmap(gl.TEXTURE_2D)

  gl.bindTexture(gl.TEXTURE_2D, null)

  return texture
}


window.addEventListener('resize', () => {
  console.log("RESIZE")
  CANVAS_WIDTH = window.innerWidth
  CANVAS_HEIGHT = window.innerHeight

  canvas.width = CANVAS_WIDTH * devicePixelRatio
  canvas.height = CANVAS_HEIGHT * devicePixelRatio
  canvas.style.setProperty('width', `${CANVAS_WIDTH}px`)
  canvas.style.setProperty('height', `${CANVAS_HEIGHT}px`)
})

// Rendering loop
requestAnimationFrame(renderFrame)
function renderFrame () {
  requestAnimationFrame(renderFrame)



  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)
  gl.clearColor(0.1, 0.1, 0.1, 1)
  gl.clear(gl.COLOR_BUFFER_BIT)

  // Bind the WebGLBuffer that holds our vertices positions
  {
    // Bind WebGLBuffer (vertexBuffer) to special WebGL bind point (gl.ARRAY_BUFFER)
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)

    // Supply positions float 32 bit array to WebGLBuffer (vertexBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)

    // Explicitly enable this "position" variable on GPU
    gl.enableVertexAttribArray(positionAttributeLocationOnGPU)

    // Instruct the GPU how to unpack our WebGLBuffer to our input attribute variable "position" in the vertex shader
    gl.vertexAttribPointer(positionAttributeLocationOnGPU, 2, gl.FLOAT, false, 0, 0)
  }

  // Bind the WebGLBuffer that holds our vertices UVs
  {
    // Bind WebGLBuffer (uvBuffer) to special WebGL bind point (gl.ARRAY_BUFFER)
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer)

    // Supply UVs float 32 bit array to WebGLBuffer (vertexBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW)

    // Explicitly enable this "uv" variable on GPU
    gl.enableVertexAttribArray(uvAttributeLocationOnGPU)

    // Instruct the GPU how to unpack our WebGLBuffer to our input attribute variable "uv" in the vertex shader
    gl.vertexAttribPointer(uvAttributeLocationOnGPU, 2, gl.FLOAT, false, 0, 0)
  }

  // Bind the WebGLBuffer that holds our vertices indices
  {
    // Bind WebGLBuffer (indexBuffer) to special WebGL bind point (gl.ELEMENT_ARRAY_BUFFER)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)

    // Supply indices unsigned integers with 16 bits precision
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW)
  }

  // Explicitly use my WebGLProgram that I am interested in drawing with
  gl.useProgram(drawingProgram)

  const textureUniformLocationOnGPU = gl.getUniformLocation(drawingProgram, "myTexture")

  gl.uniform1i(textureUniformLocationOnGPU, 0)

  gl.uniform2f(canvasSizeLocationOnGPU, CANVAS_WIDTH, CANVAS_HEIGHT)

  let videosPlayed = true
  videos.map((video) => {
    if (video.paused)
      videosPlayed = false
  })

  if (videosPlayed) {
    if (textures) {
      textures.forEach((texture, i) => {
        gl.activeTexture(gl[`TEXTURE${i}`])
        gl.bindTexture(gl.TEXTURE_2D, texture)

        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
      
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

        gl.uniform2f(videoSizeLocationOnGPU, videos[i].videoWidth, videos[i].videoHeight)
        gl.uniform1i(backgroundSizeModeLocationOnGPU, 1)      

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, videos[i])        
      })
      
      gl.uniform1iv(texturesUniformLocationOnGPU, [0, 1, 2, 3, 4, 5, 6, 7, 8])
      
      gl.uniform1i(nextSlideIdxUniformLocationOnGPU, nextSlideIdx)
      
      gl.uniform1i(activeSlideIdxUniformLocationOnGPU, activeSlideIdx)
      
      gl.uniform1f(slideMixFactorUniformLocationOnGPU, slideMixFactor)
  
      // Issue a draw command using my active WebGLProgram
      gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0)
    }
  }

}

// Load an image with promise
function loadImage (url) {
  // console.log(url)
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = (err) => reject(err)
    image.src = url
  })
}

// Load an video with promise
function loadVideo (url) {
  return new Promise((resolve, reject) => {
    const video123 = document.createElement("video")
    video123.src = url

    video123.loop = true
    video123.muted = true
    video123.autoplay = true
    video123.playsInline = true

    video123.setAttribute('loop', true)
    video123.setAttribute('muted', true)
    video123.setAttribute('autoplay', true)
    video123.setAttribute('playsinline', true)

    video123.play()
    resolve(video123)

  })
}

// WebGL helper methods
function createShader (type, source) { // WebGLShader
  const shader = gl.createShader(type)
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    return shader
  }
  console.error(`
    Error when compiling shader on the GPU:
    ${gl.getShaderInfoLog(shader)}
  `)
  gl.deleteShader(shader)
}

function createProgram (vertexShaderObject, fragmentShaderObject) { // WebGLProgram
  const program = gl.createProgram()
  gl.attachShader(program, vertexShaderObject)
  gl.attachShader(program, fragmentShaderObject)
  gl.linkProgram(program)
  if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
    return program
  }
  console.error(`
    Error when linking program on the GPU:
    ${gl.getProgramInfoLog(program)}
  `)
  gl.deleteProgram(program)
}