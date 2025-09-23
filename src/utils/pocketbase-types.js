/**
 * Collections definitions for PocketBase
 */
export const Collections = {
  Svg: "svg",
  // Vous pouvez ajouter d'autres collections ici au fur et à mesure
};

/**
 * Type definitions for the SVG collection
 * @typedef {Object} SvgRecord
 * @property {string} id - Record ID
 * @property {string} nom - Name of the SVG
 * @property {string} code - SVG code content
 * @property {string} chat_history - Chat history as JSON string
 * @property {string} created - Creation timestamp
 * @property {string} updated - Update timestamp
 */

export interface SvgRecord {
  id: string;
  nom: string;
  code: string;
  chat_history?: string;
  created: string;
  updated: string;
}
