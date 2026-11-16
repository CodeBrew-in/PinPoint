/** Where the map pictures come from. Change the hosts here AND in img-src / connect-src / worker-src of
 *  render.yaml and nginx.conf, or the browser will block them.
 *  Street: OpenFreeMap "bright" (free, no key, looks like the common web maps).
 *  Satellite: Esri World Imagery (free for light use, credit required). */
export const STREET_STYLE = 'https://tiles.openfreemap.org/styles/bright';
export const STREET_CREDIT = '<a href="https://openfreemap.org">OpenFreeMap</a> &copy; <a href="https://www.openmaptiles.org/">OpenMapTiles</a> data from <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
export const SATELLITE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
export const SATELLITE_CREDIT = 'Imagery &copy; Esri, Maxar, Earthstar Geographics';
