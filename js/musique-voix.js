/**
 * Les voix de la musique lugubre (js/musique-synthe.js) : le bourdon de
 * cordes, les phrases de violon et la réverbération d'église.
 */

const REVERB_S = 6;
// Ré phrygien (ré, mi bémol, fa, sol, la, si bémol, do), du ré 4 au ré 5.
const NOTES_VIOLON = [293.66, 311.13, 349.23, 392, 440, 466.16, 523.25, 587.33];

/**
 * Bourdon : ré 2 et la 2 en dents de scie, étouffés par un filtre qui
 * respire très lentement, avec un léger désaccord qui fait battre le son.
 * @param {AudioContext} ctx
 * @param {AudioNode} sortie
 */
export function bourdon(ctx, sortie) {
  const filtre = ctx.createBiquadFilter();
  filtre.type = "lowpass";
  filtre.frequency.value = 320;
  filtre.Q.value = 0.7;
  const souffle = ctx.createOscillator();
  souffle.frequency.value = 0.045;
  const ampleur = ctx.createGain();
  ampleur.gain.value = 140;
  souffle.connect(ampleur).connect(filtre.frequency);
  souffle.start();

  const niveau = ctx.createGain();
  niveau.gain.value = 0.22;
  filtre.connect(niveau).connect(sortie);

  [
    [73.42, 0],
    [73.42, 7],
    [110, -5],
    [36.71, 0],
  ].forEach(([frequence, desaccord]) => {
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = frequence;
    osc.detune.value = desaccord;
    osc.connect(filtre);
    osc.start();
  });
}

/**
 * Une phrase de violon : une ou deux notes longues, attaquées doucement,
 * avec un vibrato qui s'élargit. Parfois la note glisse d'un demi-ton.
 * @param {AudioContext} ctx
 * @param {AudioNode} sortie
 * @param {number} debut
 * @returns {number} durée de la phrase, en secondes
 */
export function phrase(ctx, sortie, debut) {
  const deuxNotes = Math.random() < 0.45;
  const premiere = choisir(NOTES_VIOLON);
  const duree = entre(4, 7);
  note(ctx, sortie, debut, duree, premiere, Math.random() < 0.35);
  if (!deuxNotes) {
    return duree;
  }
  const seconde = choisir(NOTES_VIOLON.filter((f) => f !== premiere));
  const duree2 = entre(3.5, 6);
  note(ctx, sortie, debut + duree * 0.8, duree2, seconde, Math.random() < 0.5);
  return duree * 0.8 + duree2;
}

/**
 * @param {AudioContext} ctx
 * @param {AudioNode} sortie
 * @param {number} debut
 * @param {number} duree
 * @param {number} frequence
 * @param {boolean} glisse la note descend d'un demi-ton en fin de course
 */
function note(ctx, sortie, debut, duree, frequence, glisse) {
  const fin = debut + duree;
  const osc = ctx.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(frequence, debut);
  if (glisse) {
    osc.frequency.setValueAtTime(frequence, fin - 2.2);
    osc.frequency.exponentialRampToValueAtTime(frequence / 1.0595, fin - 0.6);
  }

  // Vibrato : absent à l'attaque, il s'élargit au fil de la note.
  const vibrato = ctx.createOscillator();
  vibrato.frequency.value = entre(4.8, 5.6);
  const profondeur = ctx.createGain();
  profondeur.gain.setValueAtTime(0, debut);
  profondeur.gain.linearRampToValueAtTime(frequence * 0.006, debut + duree * 0.6);
  vibrato.connect(profondeur).connect(osc.frequency);

  // Corps de l'instrument : deux résonances et le haut du spectre adouci.
  const corps = ctx.createBiquadFilter();
  corps.type = "peaking";
  corps.frequency.value = 1100;
  corps.Q.value = 1.2;
  corps.gain.value = 6;
  const brillance = ctx.createBiquadFilter();
  brillance.type = "lowpass";
  brillance.frequency.value = 3200;

  // Archet : attaque lente, tenue, puis extinction.
  const archet = ctx.createGain();
  archet.gain.setValueAtTime(0, debut);
  archet.gain.linearRampToValueAtTime(0.07, debut + 1.4);
  archet.gain.setValueAtTime(0.07, fin - 1.8);
  archet.gain.linearRampToValueAtTime(0, fin);

  osc.connect(corps).connect(brillance).connect(archet).connect(sortie);
  osc.start(debut);
  vibrato.start(debut);
  osc.stop(fin + 0.1);
  vibrato.stop(fin + 0.1);
}

/**
 * Réponse d'une grande église : un bruit qui s'éteint lentement, plus vite
 * dans les aigus, légèrement différent à gauche et à droite.
 * @param {AudioContext} ctx
 */
export function reponseEglise(ctx) {
  const longueur = Math.round(ctx.sampleRate * REVERB_S);
  const tampon = ctx.createBuffer(2, longueur, ctx.sampleRate);
  for (let canal = 0; canal < 2; canal++) {
    const donnees = tampon.getChannelData(canal);
    let lisse = 0;
    for (let i = 0; i < longueur; i++) {
      const t = i / longueur;
      // Un bruit lissé : les aigus meurent avant les graves.
      lisse += (Math.random() * 2 - 1 - lisse) * (0.55 - 0.45 * t);
      donnees[i] = lisse * Math.pow(1 - t, 2.6);
    }
  }
  return tampon;
}

/**
 * @param {number} min
 * @param {number} max
 */
export function entre(min, max) {
  return min + Math.random() * (max - min);
}

/**
 * @template T
 * @param {T[]} liste
 * @returns {T}
 */
function choisir(liste) {
  return liste[Math.floor(Math.random() * liste.length)];
}
