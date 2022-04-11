const FRAGMENT_SHADER_SOURCE = `
  precision highp float;

  const int NUMBER_OF_TEXTURES = 9;
  const float SQRT_2 = 1.414213562373;

  uniform sampler2D textures[9];
  uniform int nextSlideIdx;
  uniform int activeSlideIdx;
  uniform float slideMixFactor;
  uniform vec2 canvasSize;
  uniform vec2 videoSize;
  uniform int backgroundSizeMode;

  varying vec2 v_uv;

  vec4 sampleFromTextureAtIndex (sampler2D textures[NUMBER_OF_TEXTURES], int textureIndex, vec2 uv) {
    vec4 outputColor = vec4(0.0);
    for (int i = 0; i < NUMBER_OF_TEXTURES; i++) {
      vec4 textureColorAtIndex = texture2D(textures[i], uv);
      if (i == textureIndex) {
        outputColor = textureColorAtIndex;
      }
    }
    return outputColor;
  }

  void main () {


    vec2 s = canvasSize; // Screen
    vec2 i = videoSize; // Image
    float rs = s.x / s.y;
    float ri = i.x / i.y;
    vec2 new = rs < ri ? vec2(i.x * s.y / i.y, s.y) : vec2(s.x, i.y * s.x / i.x);
    vec2 offset = (rs < ri ? vec2((new.x - s.x) / 2.0, 0.0) : vec2(0.0, (new.y - s.y) / 2.0)) / new;
    vec2 uv = backgroundSizeMode == 0 ? v_uv : (v_uv * s / new + offset);


    vec4 ca = sampleFromTextureAtIndex(textures, activeSlideIdx, uv);
    vec4 cb = sampleFromTextureAtIndex(textures, nextSlideIdx, uv);
    
    vec2 oa = (((ca.rg+ca.b)*0.5)*2.0-1.0);
    vec2 ob = (((cb.rg+cb.b)*0.5)*2.0-1.0);
    vec2 oc = mix(oa,ob,0.5)*2.0;
    
    float w0 = slideMixFactor;
    float w1 = 1.0-w0;
  
    vec4 activeTextureColor = sampleFromTextureAtIndex(textures, activeSlideIdx, uv+oc*w0);
    vec4 nextTextureColor = sampleFromTextureAtIndex(textures, nextSlideIdx, uv-oc*w1);

    gl_FragColor = mix(activeTextureColor, nextTextureColor, slideMixFactor);

  }
`

const FRAGMENT_SHADER_SOURCE_2 = `
  precision highp float;

  const int NUMBER_OF_TEXTURES = 7;
  const float SQRT_2 = 1.414213562373;

  uniform sampler2D textures[7];
  uniform int nextSlideIdx;
  uniform int activeSlideIdx;
  uniform float slideMixFactor;
  uniform vec2 canvasSize;
  uniform vec2 videoSize;
  uniform int backgroundSizeMode;
  
  varying vec2 v_uv;

  vec4 sampleFromTextureAtIndex (sampler2D textures[NUMBER_OF_TEXTURES], int textureIndex, vec2 uv) {
    vec4 outputColor = vec4(0.0);
    for (int i = 0; i < NUMBER_OF_TEXTURES; i++) {
      vec4 textureColorAtIndex = texture2D(textures[i], uv);
      if (i == textureIndex) {
        outputColor = textureColorAtIndex;
      }
    }
    return outputColor;
  }

  void main () {


    vec2 s = canvasSize; // Screen
    vec2 i = videoSize; // Image
    float rs = s.x / s.y;
    float ri = i.x / i.y;
    vec2 new = rs < ri ? vec2(i.x * s.y / i.y, s.y) : vec2(s.x, i.y * s.x / i.x);
    vec2 offset = (rs < ri ? vec2((new.x - s.x) / 2.0, 0.0) : vec2(0.0, (new.y - s.y) / 2.0)) / new;
    vec2 uv = backgroundSizeMode == 0 ? v_uv : (v_uv * s / new + offset);


    float dots = 100.0;
    vec2 center = vec2(0.0);

    bool nextImage = distance(fract(uv * dots), vec2(0.5, 0.5)) < ( slideMixFactor / distance(uv, center));

    vec4 activeTextureColor = sampleFromTextureAtIndex(textures, activeSlideIdx, uv);
    vec4 nextTextureColor = sampleFromTextureAtIndex(textures, nextSlideIdx, uv);
    // gl_FragColor = mix(activeTextureColor, nextTextureColor, slideMixFactor);
    gl_FragColor = nextImage ? nextTextureColor : activeTextureColor;

  }
`


const FRAGMENT_SHADER_SOURCE_3 = `
  precision highp float;

  const int NUMBER_OF_TEXTURES = 7;
  const float SQRT_2 = 1.414213562373;

  uniform sampler2D textures[7];
  uniform int nextSlideIdx;
  uniform int activeSlideIdx;
  uniform float slideMixFactor;
  uniform vec2 canvasSize;
  uniform vec2 videoSize;
  uniform int backgroundSizeMode;
  
  varying vec2 v_uv;

  vec4 sampleFromTextureAtIndex (sampler2D textures[NUMBER_OF_TEXTURES], int textureIndex, vec2 uv) {
    vec4 outputColor = vec4(0.0);
    for (int i = 0; i < NUMBER_OF_TEXTURES; i++) {
      vec4 textureColorAtIndex = texture2D(textures[i], uv);
      if (i == textureIndex) {
        outputColor = textureColorAtIndex;
      }
    }
    return outputColor;
  }

  float rand(vec2 co) {
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
  }

  void main () {


    vec2 s = canvasSize; // Screen
    vec2 i = videoSize; // Image
    float rs = s.x / s.y;
    float ri = i.x / i.y;
    vec2 new = rs < ri ? vec2(i.x * s.y / i.y, s.y) : vec2(s.x, i.y * s.x / i.x);
    vec2 offset = (rs < ri ? vec2((new.x - s.x) / 2.0, 0.0) : vec2(0.0, (new.y - s.y) / 2.0)) / new;
    vec2 uv = backgroundSizeMode == 0 ? v_uv : (v_uv * s / new + offset);


    vec2 center = vec2(0.5);
    float threshold = 3.0;
    float fadeEdge = 0.1;



    vec4 activeTextureColor = sampleFromTextureAtIndex(textures, activeSlideIdx, uv);
    vec4 nextTextureColor = sampleFromTextureAtIndex(textures, nextSlideIdx, uv);

    float dist = distance(center, uv) / threshold;
    float r = slideMixFactor - min(rand(vec2(uv.y, 0.0)), rand(vec2(0.0, uv.x)));
    gl_FragColor =  mix(activeTextureColor, nextTextureColor, mix(0.0, mix(step(dist, r), 1.0, smoothstep(1.0-fadeEdge, 1.0, slideMixFactor)), smoothstep(0.0, fadeEdge, slideMixFactor)));    

  }
`
