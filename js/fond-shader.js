/**
 * Shaders du fond : brume qui dérive, rayons de lumière qui la traversent,
 * gravure rouge sang qui apparaît là où la lumière et la brume se rencontrent.
 */

export const VERTEX_SHADER = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

export const FRAGMENT_SHADER = `
precision mediump float;

uniform vec2 u_res;
uniform float u_time;
uniform float u_scroll;
uniform vec2 u_pointer;
uniform float u_pointerForce;
uniform sampler2D u_gravure;
uniform float u_gravureAspect;
uniform float u_gravureReady;

const vec3 SANG = vec3(0.66, 0.086, 0.106);
const vec3 BRUME = vec3(0.78, 0.8, 0.84);

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p = p * 2.03 + vec2(1.7, 9.2);
    amplitude *= 0.5;
  }
  return value;
}

// Brume en deux couches qui dérivent à des vitesses différentes.
float brume(vec2 p, float t) {
  vec2 q = vec2(fbm(p + vec2(0.0, t * 0.07)), fbm(p + vec2(5.2, 1.3) - t * 0.05));
  float lointaine = fbm(p * 0.7 + 2.2 * q + vec2(t * 0.04, t * 0.015));
  float proche = fbm(p * 1.5 - q + vec2(-t * 0.08, t * 0.035));
  return smoothstep(0.34, 0.86, lointaine * 0.6 + proche * 0.5);
}

// Rayons qui tombent d'une source hors écran, en haut, et oscillent lentement.
float rayons(vec2 uv, float aspect, float t) {
  vec2 source = vec2(0.28 + 0.12 * sin(t * 0.045), 1.35);
  vec2 d = vec2((uv.x - source.x) * aspect, uv.y - source.y);
  float angle = atan(d.x, -d.y);
  float bandes = noise(vec2(angle * 9.0 + t * 0.06, t * 0.02));
  bandes *= noise(vec2(angle * 23.0 - t * 0.04, 3.0));
  bandes = smoothstep(0.02, 0.6, bandes);
  float cone = smoothstep(1.1, 0.1, abs(angle));
  float chute = smoothstep(2.2, 0.2, length(d));
  return bandes * cone * chute;
}

vec2 coverUv(vec2 uv, float aspect) {
  float ecran = u_res.x / u_res.y;
  vec2 echelle = ecran > aspect ? vec2(1.0, aspect / ecran) : vec2(ecran / aspect, 1.0);
  return (uv - 0.5) * echelle + 0.5;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float aspect = u_res.x / u_res.y;
  float t = u_time;
  vec2 p = vec2(uv.x * aspect, uv.y) * 1.6 + vec2(0.0, u_scroll);

  float b = brume(p, t);
  float r = rayons(uv, aspect, t);

  vec2 dp = vec2((uv.x - u_pointer.x) * aspect, uv.y - u_pointer.y);
  float lanterne = exp(-dot(dp, dp) * 7.0) * u_pointerForce;

  // La lumière n'existe que dans la brume : c'est elle qui la rend visible.
  float lumiere = r * (0.35 + b * 0.9) + lanterne * (0.25 + b * 0.5);

  vec2 ondulation = vec2(noise(p * 3.0 + t * 0.2), noise(p * 3.0 - t * 0.2)) - 0.5;
  vec2 gUv = coverUv(uv, u_gravureAspect) + ondulation * 0.004;
  gUv.y = 1.0 - gUv.y;
  float encre = texture2D(u_gravure, gUv).a * u_gravureReady;
  float revele = smoothstep(0.08, 0.75, lumiere) + smoothstep(0.35, 0.9, b) * 0.45;

  vec3 couleur = BRUME * (b * 0.1 + r * 0.04 + lanterne * 0.03);
  couleur += SANG * encre * clamp(revele, 0.0, 1.0) * 0.9;

  float vignette = smoothstep(1.25, 0.35, length((uv - 0.5) * vec2(aspect, 1.0)));
  couleur *= mix(0.55, 1.0, vignette);
  couleur += (hash(gl_FragCoord.xy + t) - 0.5) / 255.0;

  gl_FragColor = vec4(couleur, 1.0);
}
`;
