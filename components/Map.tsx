'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const defaultIcon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.setIcon(defaultIcon);

export default function Map() {
  const center: [number, number] = [-23.5505, -46.6333];

  return (
    // ✅ isolation: isolate cria um stacking context novo
    // impedindo o z-index do Leaflet de vazar pro resto da página
    <div
      className="w-full h-[300px] rounded-lg overflow-hidden border border-[var(--color-border-secondary)]"
      style={{ isolation: 'isolate' }}
    >
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={center}>
          <Popup>
            Centro de Distribuição LogiTrack <br /> São Paulo, Brasil
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}