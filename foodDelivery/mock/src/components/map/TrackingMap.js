"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon issues in Leaflet
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom icons using Leaflet DivIcon with inline SVG/CSS (React-icons equivalents, NO emojis)
const createCustomIcon = (color) => {
  return new L.DivIcon({
    html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>`,
    className: "custom-div-icon",
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
};

const riderIcon = createCustomIcon("#FF4757"); // Primary red for rider
const storeIcon = createCustomIcon("#FFA502"); // Accent amber for store
const homeIcon = createCustomIcon("#2ED573");  // Success green for home

// Component to auto-center map when coordinates change
function RecenterMap({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.setView([coords.latitude, coords.longitude], map.getZoom());
    }
  }, [coords, map]);
  return null;
}

export default function TrackingMap({ riderCoords, restaurantCoords, customerCoords }) {
  const centerLat = riderCoords?.latitude || restaurantCoords?.latitude || 28.6139;
  const centerLng = riderCoords?.longitude || restaurantCoords?.longitude || 77.2090;

  return (
    <div className="w-full h-64 rounded-2xl overflow-hidden border border-white/10 shadow-lg relative z-10">
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={14}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Restaurant Marker */}
        {restaurantCoords && (
          <Marker position={[restaurantCoords.latitude, restaurantCoords.longitude]} icon={storeIcon}>
            <Popup>Restaurant Location</Popup>
          </Marker>
        )}

        {/* Customer Home Marker */}
        {customerCoords && (
          <Marker position={[customerCoords.latitude, customerCoords.longitude]} icon={homeIcon}>
            <Popup>Delivery Address</Popup>
          </Marker>
        )}

        {/* Live Rider Marker */}
        {riderCoords && (
          <Marker position={[riderCoords.latitude, riderCoords.longitude]} icon={riderIcon}>
            <Popup>Delivery Rider (Live)</Popup>
          </Marker>
        )}

        {riderCoords && <RecenterMap coords={riderCoords} />}
      </MapContainer>
    </div>
  );
}
