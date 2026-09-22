/**
 * Outils WebGL du fond : compilation du programme, triangle plein écran,
 * chargement de la gravure en texture. Chaque fonction lève une erreur
 * explicite en cas d'échec, pour que le fond bascule sur sa version fixe.
 */

import { FRAGMENT_SHADER, VERTEX_SHADER } from "./fond-shader.js";

const UNIFORMS = [
  "u_res",
  "u_time",
  "u_scroll",
  "u_pointer",
  "u_pointerForce",
  "u_halo",
  "u_gravure",
  "u_gravureAspect",
  "u_gravureReady",
];

/**
 * @param {HTMLCanvasElement} canvas
 * @returns {{ gl: WebGLRenderingContext, uniforms: Record<string, WebGLUniformLocation | null> }}
 */
export function createScene(canvas) {
  const gl = canvas.getContext("webgl", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "low-power",
    preserveDrawingBuffer: false,
  });
  if (!gl) {
    throw new Error("WebGL indisponible");
  }

  const program = gl.createProgram();
  if (!program) {
    throw new Error("Programme WebGL impossible à créer");
  }
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(`Liaison du programme : ${gl.getProgramInfoLog(program)}`);
  }
  gl.useProgram(program);

  bindFullScreenTriangle(gl, program);

  /** @type {Record<string, WebGLUniformLocation | null>} */
  const uniforms = {};
  UNIFORMS.forEach((name) => {
    uniforms[name] = gl.getUniformLocation(program, name);
  });
  gl.uniform1i(uniforms.u_gravure, 0);
  gl.uniform1f(uniforms.u_gravureReady, 0);
  gl.uniform1f(uniforms.u_gravureAspect, 1);

  return { gl, uniforms };
}

/**
 * @param {WebGLRenderingContext} gl
 * @param {number} type
 * @param {string} source
 * @returns {WebGLShader}
 */
function compile(gl, type, source) {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error("Shader impossible à créer");
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(`Compilation du shader : ${gl.getShaderInfoLog(shader)}`);
  }
  return shader;
}

/**
 * Un seul triangle qui déborde de l'écran suffit à couvrir tous les pixels.
 * @param {WebGLRenderingContext} gl
 * @param {WebGLProgram} program
 */
function bindFullScreenTriangle(gl, program) {
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const location = gl.getAttribLocation(program, "a_position");
  gl.enableVertexAttribArray(location);
  gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);
}

/**
 * Charge la gravure (WebP dont la transparence porte le dessin) dans l'unité 0.
 * @param {WebGLRenderingContext} gl
 * @param {string} src
 * @returns {Promise<number>} le rapport largeur / hauteur de l'image
 */
export function loadGravure(gl, src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      const texture = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      resolve(image.naturalWidth / image.naturalHeight);
    };
    image.onerror = () => reject(new Error(`Gravure introuvable : ${src}`));
    image.src = src;
  });
}
