import { MapContainer, TileLayer, Polygon, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { ParcelTooltip } from './ParcelTooltip';

export function CadastralMap({ parcels }: { parcels: any[] }) {
  const center: [number, number] = [28.7523, 77.4988]; // KIET roughly

  return (
    <div className="w-full h-full rounded-xl overflow-hidden border">
      <MapContainer center={center} zoom={16} className="w-full h-full" zoomControl={false}>
        <TileLayer
          attribution='&copy; <a href="https://bhuvan.nrsc.gov.in">ISRO Bhuvan</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {parcels?.map((parcel, idx) => (
          <Polygon 
            key={idx} 
            positions={parcel.coordinates} 
            pathOptions={{ 
              color: parcel.status === 'validated' ? '#10b981' : (parcel.status === 'needs_review' ? '#f59e0b' : '#ef4444'),
              weight: 2,
              fillOpacity: 0.4
            }}
          >
            <Popup>
              <ParcelTooltip parcel={parcel} />
            </Popup>
          </Polygon>
        ))}
      </MapContainer>
    </div>
  );
}
