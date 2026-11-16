import '@maplibre/maplibre-gl-leaflet';
import L from 'leaflet';
import { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import { SATELLITE_CREDIT, SATELLITE_URL, STREET_CREDIT, STREET_STYLE } from '../lib/tiles';

type Look = 'street' | 'satellite';
const KEY = 'pinpoint.maplook';

function savedLook(): Look {
  try {
    return localStorage.getItem(KEY) === 'satellite' ? 'satellite' : 'street';
  } catch {
    return 'street';
  }
}

/** The picture under the pins, with a small Street / Satellite switch in the corner. Put it inside a MapContainer. */
export function BaseMap() {
  const map = useMap();
  const [look, setLook] = useState<Look>(savedLook);

  useEffect(() => {
    const layer: L.Layer =
      look === 'street'
        ? L.maplibreGL({ style: STREET_STYLE, attributionControl: false } as L.LeafletMaplibreGLOptions)
        : L.tileLayer(SATELLITE_URL, { maxZoom: 19 });
    layer.addTo(map);
    map.attributionControl.addAttribution(look === 'street' ? STREET_CREDIT : SATELLITE_CREDIT);
    try {
      localStorage.setItem(KEY, look);
    } catch {
      /* private window: the choice just is not remembered */
    }
    return () => {
      map.removeLayer(layer);
      map.attributionControl.removeAttribution(look === 'street' ? STREET_CREDIT : SATELLITE_CREDIT);
    };
  }, [map, look]);

  useEffect(() => {
    const control = new L.Control({ position: 'topright' });
    control.onAdd = () => {
      const box = L.DomUtil.create('div', 'leaflet-bar look-switch');
      (['street', 'satellite'] as Look[]).forEach((name) => {
        const button = L.DomUtil.create('button', name === look ? 'on' : '', box) as HTMLButtonElement;
        button.type = 'button';
        button.textContent = name === 'street' ? 'Street' : 'Satellite';
        button.setAttribute('aria-pressed', String(name === look));
        L.DomEvent.on(button, 'click', (e) => {
          L.DomEvent.stop(e);
          setLook(name);
        });
      });
      L.DomEvent.disableClickPropagation(box);
      return box;
    };
    control.addTo(map);
    return () => {
      control.remove();
    };
  }, [map, look]);

  return null;
}
