"use client";

import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { useEffect, useRef, useState } from "react";

type Coordinates = {
  latitude: number;
  longitude: number;
};

type GoogleMapPinPickerProps = Coordinates & {
  compact?: boolean;
  onChange: (coordinates: Coordinates) => void;
  labels: {
    loading: string;
    unavailable: string;
    loadError: string;
    instructions: string;
    map: string;
  };
};

type GoogleMapsLibraries = {
  Map: typeof google.maps.Map;
  AdvancedMarkerElement: typeof google.maps.marker.AdvancedMarkerElement;
};

let librariesPromise: Promise<GoogleMapsLibraries> | null = null;

function loadGoogleMaps(apiKey: string): Promise<GoogleMapsLibraries> {
  if (!librariesPromise) {
    setOptions({ key: apiKey, v: "weekly" });
    librariesPromise = Promise.all([importLibrary("maps"), importLibrary("marker")]).then(
      ([mapsLibrary, markerLibrary]) => ({
        Map: mapsLibrary.Map,
        AdvancedMarkerElement: markerLibrary.AdvancedMarkerElement,
      }),
    );
  }

  return librariesPromise;
}

export function GoogleMapPinPicker({
  latitude,
  longitude,
  compact = false,
  onChange,
  labels,
}: Readonly<GoogleMapPinPickerProps>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const onChangeRef = useRef(onChange);
  const initialCoordinatesRef = useRef({ latitude, longitude });
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!apiKey || !containerRef.current) return;

    let disposed = false;
    let mapClickListener: google.maps.MapsEventListener | null = null;
    let markerDragHandler: EventListener | null = null;

    loadGoogleMaps(apiKey)
      .then(({ Map, AdvancedMarkerElement }) => {
        if (disposed || !containerRef.current) return;

        const center = { lat: initialCoordinatesRef.current.latitude, lng: initialCoordinatesRef.current.longitude };
        const map = new Map(containerRef.current, {
          center,
          zoom: 16,
          mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID?.trim() || "DEMO_MAP_ID",
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        });
        const marker = new AdvancedMarkerElement({
          map,
          position: center,
          gmpDraggable: true,
          title: labels.map,
        });

        mapClickListener = map.addListener("click", (event: google.maps.MapMouseEvent) => {
          const position = event.latLng;
          if (!position) return;
          const coordinates = { latitude: position.lat(), longitude: position.lng() };
          marker.position = { lat: coordinates.latitude, lng: coordinates.longitude };
          onChangeRef.current(coordinates);
        });
        markerDragHandler = () => {
          const position = marker.position;
          if (!position) return;
          const coordinates = {
            latitude: typeof position.lat === "function" ? position.lat() : Number(position.lat),
            longitude: typeof position.lng === "function" ? position.lng() : Number(position.lng),
          };
          onChangeRef.current(coordinates);
        };
        marker.addEventListener("gmp-dragend", markerDragHandler);

        mapRef.current = map;
        markerRef.current = marker;
        setStatus("ready");
      })
      .catch(() => {
        if (!disposed) setStatus("error");
      });

    return () => {
      disposed = true;
      mapClickListener?.remove();
      if (markerDragHandler && markerRef.current) markerRef.current.removeEventListener("gmp-dragend", markerDragHandler);
      if (markerRef.current) markerRef.current.map = null;
      markerRef.current = null;
      mapRef.current = null;
    };
  }, [apiKey, labels.map]);

  useEffect(() => {
    if (!mapRef.current || !markerRef.current || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
    const position = { lat: latitude, lng: longitude };
    markerRef.current.position = position;
    mapRef.current.panTo(position);
  }, [latitude, longitude]);

  if (!apiKey) {
    return <p className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">{labels.unavailable}</p>;
  }

  return (
    <div className="space-y-2">
      <div className="relative overflow-hidden rounded-2xl border border-[#17382b]/15 bg-[#e8eee9]">
        <div ref={containerRef} aria-label={labels.map} className={`${compact ? "h-40" : "h-72"} w-full`} />
        {status === "loading" ? <div className="absolute inset-0 grid place-items-center bg-[#e8eee9] text-sm font-semibold text-[#52675a]">{labels.loading}</div> : null}
        {status === "error" ? <div className="absolute inset-0 grid place-items-center bg-red-50 px-6 text-center text-sm font-semibold text-red-800">{labels.loadError}</div> : null}
      </div>
      <p className="text-xs text-[#66776c]">{labels.instructions}</p>
    </div>
  );
}
