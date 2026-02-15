import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Icon } from 'leaflet';

// Fix for default marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = new Icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

export function LocationMap({ locations }: { locations: any[] }) {
    // Default center (London)
    const center: [number, number] = [51.505, -0.09];

    // Filter locations with valid coordinates
    const validLocations = locations.filter(loc => loc.latitude && loc.longitude);

    // If we have locations, center on the first one
    const mapCenter = validLocations.length > 0
        ? [validLocations[0].latitude, validLocations[0].longitude] as [number, number]
        : center;

    return (
        <div className="h-[300px] w-full rounded-md overflow-hidden z-0">
            <MapContainer center={mapCenter} zoom={2} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {validLocations.map((loc) => (
                    <Marker
                        key={loc.id}
                        position={[loc.latitude, loc.longitude]}
                        icon={DefaultIcon}
                    >
                        <Popup>
                            <div className="text-sm font-semibold">{loc.name}</div>
                            <div className="text-xs text-muted-foreground">{loc.city}, {loc.country}</div>
                            {loc.employeeCount && <div className="text-xs mt-1">Staff: {loc.employeeCount}</div>}
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
