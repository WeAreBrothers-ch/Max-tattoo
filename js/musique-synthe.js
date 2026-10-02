/**
 * Musique lugubre, jouée en direct par le navigateur (Web Audio), sans
 * fichier : un bourdon grave de cordes en ré, et de loin en loin une phrase
 * de violon lente, en mode phrygien, qui glisse parfois d'un demi-ton vers le
 * bas. Le tout dans une longue réverbération d'église. Rien ne se répète à
 * l'identique. Ce module mène l'ensemble (volume, fondus, calendrier des
 * phrases) ; les voix sont dans js/musique-voix.js.
 */

import { bourdon, entre, phrase, reponseEglise } from "./musique-voix.js";

const VOLUME = 0.32;
const FONDU_ENTREE_S = 4;
const FONDU_SORTIE_S = 1.6;
const PAUSE_MIN_S = 5;
const PAUSE_MAX_S = 11;

/**
 * @returns {{ jouer: () => Promise<void>, couper: () => void }}
 */
export function createSynthe() {
  /** @type {AudioContext | null} */
  let ctx = null;
  /** @type {GainNode | null} */
  let sortie = null;
  let prochaineNote = 0;
  let minuteur = 0;

  function construire() {
    const AudioCtx = window.AudioContext ?? /** @type {typeof AudioContext | undefined} */ (window.webkitAudioContext);
    if (!AudioCtx) {
      throw new Error("Web Audio indisponible");
    }
    const contexte = new AudioCtx();
    const maitre = contexte.createGain();
    maitre.gain.value = 0;
    const reverb = contexte.createConvolver();
    reverb.buffer = reponseEglise(contexte);
    const mouille = contexte.createGain();
    mouille.gain.value = 0.75;
    const sec = contexte.createGain();
    sec.gain.value = 0.35;
    maitre.connect(sec).connect(contexte.destination);
    maitre.connect(reverb).connect(mouille).connect(contexte.destination);
    bourdon(contexte, maitre);
    ctx = contexte;
    sortie = maitre;
  }

  function planifier() {
    if (!ctx || !sortie) {
      return;
    }
    // Les phrases sont posées quelques secondes à l'avance.
    while (prochaineNote < ctx.currentTime + 4) {
      prochaineNote += phrase(ctx, sortie, prochaineNote) + entre(PAUSE_MIN_S, PAUSE_MAX_S);
    }
  }

  async function jouer() {
    if (!ctx) {
      construire();
    }
    if (!ctx || !sortie) {
      return;
    }
    await ctx.resume();
    const maintenant = ctx.currentTime;
    sortie.gain.cancelScheduledValues(maintenant);
    sortie.gain.setValueAtTime(sortie.gain.value, maintenant);
    sortie.gain.linearRampToValueAtTime(VOLUME, maintenant + FONDU_ENTREE_S);
    prochaineNote = Math.max(prochaineNote, maintenant + 2.5);
    planifier();
    window.clearInterval(minuteur);
    minuteur = window.setInterval(planifier, 1000);
  }

  function couper() {
    if (!ctx || !sortie) {
      return;
    }
    const contexte = ctx;
    const maintenant = contexte.currentTime;
    window.clearInterval(minuteur);
    sortie.gain.cancelScheduledValues(maintenant);
    sortie.gain.setValueAtTime(sortie.gain.value, maintenant);
    sortie.gain.linearRampToValueAtTime(0, maintenant + FONDU_SORTIE_S);
    window.setTimeout(() => {
      if (sortie && sortie.gain.value < 0.001) {
        contexte.suspend().catch(() => undefined);
      }
    }, FONDU_SORTIE_S * 1000 + 100);
  }

  return { jouer, couper };
}
