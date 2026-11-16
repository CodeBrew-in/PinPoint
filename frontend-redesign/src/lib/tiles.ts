/** Where the map pictures come from. If a host changes, change img-src in render.yaml and nginx.conf too,
 *  or the browser will block it.
 *  Street: Esri World Street Map (free for light use, no key, credit required).
 *  Satellite: Esri World Imagery (same terms). */
export const STREET_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
export const STREET_CREDIT = 'Map &copy; Esri, HERE, Garmin, OpenStreetMap contributors';
export const SATELLITE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
export const SATELLITE_CREDIT = 'Imagery &copy; Esri, Maxar, Earthstar Geographics';
