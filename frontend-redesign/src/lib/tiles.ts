/** One place that says which map pictures ("tiles") the site shows, so every map looks the same.
 *  CARTO Voyager: clean colours and readable labels, free to use with credit. If this host is ever changed,
 *  also change img-src in render.yaml and frontend-redesign/nginx.conf. */
export const TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
export const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
export const TILE_OPTIONS = { subdomains: 'abcd', maxZoom: 20 } as const;
