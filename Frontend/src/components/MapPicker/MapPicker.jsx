import { useEffect, useRef, useState } from "react";
import styles from "./MapPicker.module.scss";

const DEFAULT_CENTER = { lat: 14.6349, lng: -90.5069 };
const DEFAULT_ZOOM = 13;
const FOCUSED_ZOOM = 16;
const GOOGLE_SCRIPT_ID = "google-maps-script";

let googleMapsPromise = null;

const loadGoogleMaps = (apiKey) => {
    if (typeof window === "undefined") {
        return Promise.reject(new Error("Google Maps no está disponible en este entorno."));
    }

    if (window.google?.maps) {
        return Promise.resolve(window.google.maps);
    }

    if (!apiKey) {
        return Promise.reject(
            new Error("Configura la variable VITE_GOOGLE_MAPS_API_KEY para habilitar el mapa."),
        );
    }

    if (!googleMapsPromise) {
        googleMapsPromise = new Promise((resolve, reject) => {
            const existingScript = document.getElementById(GOOGLE_SCRIPT_ID);
            if (existingScript) {
                if (window.google?.maps) {
                    resolve(window.google.maps);
                } else {
                    existingScript.addEventListener("load", () => {
                        if (window.google?.maps) {
                            resolve(window.google.maps);
                        } else {
                            reject(new Error("No se pudo inicializar Google Maps."));
                        }
                    });
                    existingScript.addEventListener("error", () =>
                        reject(new Error("No se pudo cargar Google Maps. Revisa la clave API.")),
                    );
                }
                return;
            }

            const script = document.createElement("script");
            script.id = GOOGLE_SCRIPT_ID;
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
            script.async = true;
            script.defer = true;
            script.onload = () => {
                if (window.google?.maps) {
                    resolve(window.google.maps);
                } else {
                    reject(new Error("No se pudo inicializar Google Maps."));
                }
            };
            script.onerror = () =>
                reject(new Error("No se pudo cargar Google Maps. Revisa la clave API."));
            document.head.appendChild(script);
        });
    }

    return googleMapsPromise;
};

export default function MapPicker({ apiKey, value, onChange, disabled = false }) {
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const listenersRef = useRef([]);
    const searchInputRef = useRef(null);
    const searchBoxRef = useRef(null);
    const onChangeRef = useRef(onChange);
    const disabledRef = useRef(disabled);
    const initialValueRef = useRef(value);

    const [status, setStatus] = useState(apiKey ? "Cargando mapa..." : "");
    const [error, setError] = useState(
        apiKey ? null : "Configura VITE_GOOGLE_MAPS_API_KEY para habilitar el mapa.",
    );
    const [ready, setReady] = useState(false);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
        disabledRef.current = disabled;
    }, [disabled]);

    initialValueRef.current = value;

    useEffect(() => {
        if (!apiKey) {
            setReady(false);
            return;
        }

        let cancelled = false;
        setStatus("Cargando mapa...");
        setError(null);

        loadGoogleMaps(apiKey)
            .then((maps) => {
                if (cancelled) return;

                const initialValue = initialValueRef.current;
                const hasCoordinates =
                    initialValue &&
                    typeof initialValue.lat === "number" &&
                    typeof initialValue.lng === "number" &&
                    Number.isFinite(initialValue.lat) &&
                    Number.isFinite(initialValue.lng);

                const map = new maps.Map(mapContainerRef.current, {
                    center: hasCoordinates ? initialValue : DEFAULT_CENTER,
                    zoom: hasCoordinates ? FOCUSED_ZOOM : DEFAULT_ZOOM,
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: true,
                });

                const marker = new maps.Marker({
                    map,
                    position: hasCoordinates ? initialValue : null,
                });

                mapRef.current = map;
                markerRef.current = marker;
                setReady(true);
                setStatus("");

                const handleClick = map.addListener("click", (event) => {
                    if (disabledRef.current) return;
                    const position = event.latLng;
                    if (!position) {
                        return;
                    }
                    marker.setPosition(position);
                    onChangeRef.current?.({ lat: position.lat(), lng: position.lng() });
                });
                listenersRef.current.push(handleClick);

                if (searchInputRef.current) {
                    const searchBox = new maps.places.SearchBox(searchInputRef.current);
                    searchBoxRef.current = searchBox;
                    const searchListener = searchBox.addListener("places_changed", () => {
                        const places = searchBox.getPlaces();
                        if (!places?.length) {
                            return;
                        }
                        const place = places[0];
                        if (!place.geometry?.location) {
                            return;
                        }
                        const location = place.geometry.location;
                        map.panTo(location);
                        map.setZoom(FOCUSED_ZOOM);
                        marker.setPosition(location);
                        if (!disabledRef.current) {
                            onChangeRef.current?.({
                                lat: location.lat(),
                                lng: location.lng(),
                            });
                        }
                    });
                    listenersRef.current.push(searchListener);
                }
            })
            .catch((err) => {
                if (cancelled) return;
                setError(err.message || "No se pudo cargar Google Maps.");
                setStatus("");
                setReady(false);
            });

        return () => {
            cancelled = true;
            listenersRef.current.forEach((listener) => listener.remove?.());
            listenersRef.current = [];
            if (searchBoxRef.current?.unbindAll) {
                searchBoxRef.current.unbindAll();
            }
            searchBoxRef.current = null;
            setReady(false);
        };
    }, [apiKey]);

    useEffect(() => {
        if (!ready || !mapRef.current || !markerRef.current) {
            return;
        }

        if (
            value &&
            typeof value.lat === "number" &&
            typeof value.lng === "number" &&
            Number.isFinite(value.lat) &&
            Number.isFinite(value.lng)
        ) {
            markerRef.current.setPosition(value);
            mapRef.current.panTo(value);
            mapRef.current.setZoom(FOCUSED_ZOOM);
        } else {
            markerRef.current.setPosition(null);
            mapRef.current.setCenter(DEFAULT_CENTER);
            mapRef.current.setZoom(DEFAULT_ZOOM);
        }
    }, [ready, value]);

    return (
        <div className={styles.wrapper}>
            <div className={styles.controls}>
                <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Buscar dirección o negocio"
                    className={styles.searchInput}
                    disabled={!apiKey || !ready || disabled}
                />
            </div>
            <div className={styles.mapContainer}>
                <div ref={mapContainerRef} className={styles.map} aria-label="Selector de ubicación" />
                {(!apiKey || error) && (
                    <div className={styles.placeholder}>
                        {error ||
                            "Configura VITE_GOOGLE_MAPS_API_KEY para habilitar el mapa."}
                    </div>
                )}
            </div>
            {status && !error && <span className={styles.status}>{status}</span>}
            {error && <span className={`${styles.status} ${styles.error}`}>{error}</span>}
        </div>
    );
}
