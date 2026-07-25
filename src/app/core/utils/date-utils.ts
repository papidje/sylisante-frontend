/**
 * Utilitaires de formatage de dates/heures sans conversion de fuseau.
 *
 * Règle : ne jamais passer par `new Date(isoString).toLocaleString()` pour afficher
 * un LocalDateTime reçu du backend (format "yyyy-MM-ddTHH:mm:ss" sans Z).
 * Le parsing via `new Date()` sans timezone applique le fuseau du navigateur,
 * ce qui décale les heures pour les utilisateurs hors UTC.
 *
 * Ces fonctions analysent la chaîne directement pour garantir l'affichage correct.
 */

const MONTHS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
                   'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const DAYS_FR   = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

/**
 * Formate un LocalDateTime ISO ("2026-06-29T08:50:00") en texte lisible FR.
 * Ex: "lundi 29 juin 2026 à 08:50"
 */
export function formatLocalDateTime(s: string | null | undefined): string {
  if (!s) return '';
  const [datePart, timePart] = s.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [h, m] = (timePart ?? '00:00').split(':');
  const dow = DAYS_FR[new Date(year, month - 1, day).getDay()];
  return `${dow} ${day} ${MONTHS_FR[month - 1]} ${year} à ${h}:${m}`;
}

/**
 * Formate uniquement la partie date ("2026-06-29" ou "2026-06-29T08:50:00").
 * Ex: "29 juin 2026"
 */
export function formatLocalDate(s: string | null | undefined): string {
  if (!s) return '';
  const datePart = s.split('T')[0];
  const [year, month, day] = datePart.split('-').map(Number);
  return `${day} ${MONTHS_FR[month - 1]} ${year}`;
}

/**
 * Formate la partie heure seule depuis un LocalDateTime.
 * Ex: "08:50"
 */
export function formatLocalTime(s: string | null | undefined): string {
  if (!s) return '';
  const timePart = s.includes('T') ? s.split('T')[1] : s;
  return timePart.slice(0, 5);
}

/**
 * Retourne la date locale du jour au format "yyyy-MM-dd" sans conversion UTC.
 * Utiliser à la place de `new Date().toISOString().split('T')[0]`.
 */
export function todayLocalDateString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Ajoute un nombre de jours à une date ISO locale (yyyy-MM-dd). */
export function addDaysToLocalDate(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

/**
 * Formate un LocalDateTime ISO en "dd/MM/yyyy à HH:mm".
 * Ex : 10/07/2026 à 15:00
 */
export function formatLocalDateTimeShort(s: string | null | undefined): string {
  if (!s) return '';
  const [datePart, timePart] = s.split('T');
  const [year, month, day] = datePart.split('-');
  const [h, m] = (timePart ?? '00:00').split(':');
  return `${day}/${month}/${year} à ${h}:${m}`;
}

/** Remplace les dates ISO dans un texte par le format court FR. */
export function formatIsoDatesInText(text: string | null | undefined): string {
  if (!text) return '';
  return text.replace(
    /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?/g,
    match => formatLocalDateTimeShort(match)
  );
}

/**
 * Retourne un `Date` JavaScript sans décalage pour les comparaisons (tri, filtre).
 * Interprète la chaîne comme heure locale, pas UTC.
 */
export function parseLocalDateTime(s: string): Date {
  if (!s) return new Date(NaN);
  // Ajouter l'offset local pour forcer l'interprétation locale
  const [datePart, timePart = '00:00:00'] = s.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [h, min, sec = 0] = timePart.split(':').map(Number);
  return new Date(year, month - 1, day, h, min, sec);
}
