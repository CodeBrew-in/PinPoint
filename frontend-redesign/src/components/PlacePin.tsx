import L from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import { PinMascot } from './Art';

const MASCOT_W = 62;
const MASCOT_H = Math.round(MASCOT_W * (280 / 264));

/**
 * Leaflet marker for a place. The selected place is the mascot standing on its spot;
 * the others are numbered orange pins.
 */
export function placePinIcon(n: number, active: boolean) {
  if (active) {
    const html = renderToStaticMarkup(<PinMascot waving={false} className="block h-full w-full" />);
    return L.divIcon({
      className: '',
      iconSize: [MASCOT_W, MASCOT_H],
      // The mascot's pin tip sits at (0.44, 0.857) of its box.
      iconAnchor: [Math.round(MASCOT_W * 0.44), Math.round(MASCOT_H * 0.857)],
      html: `<div style="width:${MASCOT_W}px;height:${MASCOT_H}px;filter:drop-shadow(0 3px 0 rgba(0,0,0,.22))">${html}</div>`,
    });
  }
  return L.divIcon({
    className: '',
    iconSize: [40, 50],
    iconAnchor: [20, 50],
    html: `<div style="position:relative;width:40px;height:50px">
      <div style="width:40px;height:40px;border-radius:50%;border:3px solid #2D2D2F;background:#E5432D;color:#fff;display:grid;place-items:center;font:800 17px Outfit,sans-serif">${n}</div>
      <div style="position:absolute;left:13px;top:37px;width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:11px solid #2D2D2F"></div>
    </div>`,
  });
}
