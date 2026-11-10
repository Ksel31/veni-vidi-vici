/**
 * Types du modèle (JSDoc uniquement — pas de TypeScript).
 * @typedef {'concert' | 'festival'} EventType
 * @typedef {'planned' | 'attended' | 'missed'} EventStatus
 * @typedef {'up' | 'down' | null} Thumb
 * @typedef {'headliner' | 'support' | null} Billing
 * @typedef {'to_see' | 'seen' | 'missed'} PerformanceStatus
 *
 * @typedef {Object} Venue
 * @property {string} id
 * @property {string} name
 * @property {string} city
 * @property {string} country
 *
 * @typedef {Object} Artist
 * @property {string} id
 * @property {string} name
 *
 * @typedef {Object} Event
 * @property {string} id
 * @property {EventType} type
 * @property {string | null} title
 * @property {string} startDate
 * @property {string | null} endDate
 * @property {string} venueId
 * @property {EventStatus} status
 * @property {boolean} ticketBought
 * @property {string[]} daysAttended
 * @property {Thumb} thumb
 * @property {string} comment
 * @property {string[]} companions
 *
 * @typedef {Object} Performance
 * @property {string} id
 * @property {string} eventId
 * @property {string} artistId
 * @property {Billing} billing
 * @property {string | null} day
 * @property {PerformanceStatus} status
 * @property {Thumb} thumb
 * @property {string} setlist
 *
 * @typedef {Object} AppData
 * @property {Venue[]} venues
 * @property {Artist[]} artists
 * @property {Event[]} events
 * @property {Performance[]} performances
 */

export {};
