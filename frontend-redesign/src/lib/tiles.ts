/** One place that says which map pictures ("tiles") the site shows, so every map looks the same.
 *  OpenStreetMap's own tiles: no key needed, fine for light use with the credit shown.
 *  (CARTO tiles were tried and refuse requests from websites without an API key.)
 *  If this host is ever changed, also change img-src in render.yaml and frontend-redesign/nginx.conf. */
export const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
export const TILE_OPTIONS = { maxZoom: 19 } as const;
