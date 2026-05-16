import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './LiveMap.css';

// Fix for default marker icons in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create custom colored markers
const createCustomIcon = (color) => {
  return new L.DivIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color:${color};" class="marker-pin ${color === '#d65b64' ? 'pulse-danger' : ''}"></div><div class="pulse ${color === '#d65b64' ? 'pulse-danger' : ''}"></div>`,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -35]
  });
};

const DANGER_ICON = createCustomIcon('#d65b64'); // Red
const WARNING_ICON = createCustomIcon('#d2973b'); // Orange
const CAUTION_ICON = createCustomIcon('#ba9f4a'); // Yellow
const SAFE_ICON = createCustomIcon('#6ea86e'); // Green

const getRiskIcon = (risk) => {
  switch (risk) {
    case 'danger': return DANGER_ICON;
    case 'warning': return WARNING_ICON;
    case 'caution': return CAUTION_ICON;
    case 'safe':
    default: return SAFE_ICON;
  }
};

const getRiskColor = (risk) => {
    switch(risk) {
        case 'danger': return '#d65b64';
        case 'warning': return '#d2973b';
        case 'caution': return '#ba9f4a';
        case 'safe': return '#6ea86e';
        default: return '#6ea86e';
    }
}

// Component to handle zoom and center changes
const MapController = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

const LiveMap = ({ stations, center = [7.8731, 80.7718], zoom = 7, mapBase = 'terrain', mapLayers = {}, onStationClick, selectedBasinId = null }) => {
  
  // Choose tile layer based on mapBase prop
  const tileUrl = mapBase === 'satellite' 
    ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    
  const tileAttribution = mapBase === 'satellite'
    ? 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  return (
    <div className={`live-map-container ${mapBase}`}>
      <MapContainer center={center} zoom={zoom} scrollWheelZoom={true} style={{ height: '100%', width: '100%', borderRadius: 'inherit' }}>
        <TileLayer
          attribution={tileAttribution}
          url={tileUrl}
        />
        <MapController center={center} zoom={zoom} />
        
        {stations.map(station => {
            if (!station.latitude || !station.longitude) return null;
            
            const isSelected = selectedBasinId === station.id;
            
            return (
                <React.Fragment key={station.id}>
                    {/* Draw hazard zone if layer is active */}
                    {mapLayers.floodOverlay && station.hazard === 'flood' && (
                        <CircleMarker 
                            center={[station.latitude, station.longitude]}
                            radius={40}
                            pathOptions={{ color: '#0ea5e9', fillColor: '#0ea5e9', fillOpacity: 0.2, weight: 2 }}
                        />
                    )}
                    {mapLayers.landslideZones && station.hazard === 'landslide' && (
                        <CircleMarker 
                            center={[station.latitude, station.longitude]}
                            radius={35}
                            pathOptions={{ color: '#78350f', fillColor: '#78350f', fillOpacity: 0.3, weight: 2 }}
                        />
                    )}
                    
                    <Marker 
                        position={[station.latitude, station.longitude]} 
                        icon={getRiskIcon(station.risk)}
                    >
                        <Popup className={`custom-popup ${station.risk}`}>
                            <div className="popup-content">
                                <div className="popup-header">
                                    <span className="station-id">{station.id}</span>
                                    <span className={`risk-badge ${station.risk}`}>{station.risk.toUpperCase()}</span>
                                </div>
                                <h4 className="station-name">{station.name}</h4>
                                <div className="popup-details">
                                    <p><strong>Hazard:</strong> {station.hazard}</p>
                                    <p><strong>People at risk:</strong> {station.people?.toLocaleString()}</p>
                                    <p><strong>Status:</strong> {station.waterLevel || 'Online'}</p>
                                </div>
                                {onStationClick && (
                                    <button 
                                        className="popup-action-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onStationClick(station.id);
                                        }}
                                    >
                                        Open basin view
                                    </button>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                </React.Fragment>
            );
        })}
      </MapContainer>
    </div>
  );
};

export default LiveMap;
