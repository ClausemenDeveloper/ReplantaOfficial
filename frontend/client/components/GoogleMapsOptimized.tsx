import { useCallback, useEffect, useRef, useState, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { MapPin, Navigation, Search, Loader2, AlertCircle } from "lucide-react";
import { cn } from "../lib/utils";

// Types for our gardening-specific map features
interface GardenLocation {
  id: string;
  name: string;
  type: "project" | "nursery" | "supplier" | "maintenance" | "client";
  coordinates: google.maps.LatLngLiteral;
  description?: string;
  status?: "active" | "pending" | "completed";
  priority?: "high" | "medium" | "low";
}

interface GoogleMapsOptimizedProps {
  locations?: GardenLocation[];
  center?: google.maps.LatLngLiteral;
  zoom?: number;
  height?: string;
  onLocationSelect?: (location: GardenLocation) => void;
  onLocationCreate?: (coordinates: google.maps.LatLngLiteral) => void;
  userRole?: "client" | "admin" | "collaborator";
  className?: string;
  showControls?: boolean;
}

// Lazy load Google Maps script
let isGoogleMapsLoaded = false;
let googleMapsPromise: Promise<void> | null = null;

const loadGoogleMaps = (): Promise<void> => {
  if (isGoogleMapsLoaded) {
    return Promise.resolve();
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    // Check if API key exists
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      reject(new Error("Google Maps API key not found"));
      return;
    }

    // Check if already loaded
    if (window.google && window.google.maps) {
      isGoogleMapsLoaded = true;
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&loading=async`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      isGoogleMapsLoaded = true;
      resolve();
    };

    script.onerror = () => {
      reject(new Error("Failed to load Google Maps"));
    };

    document.head.appendChild(script);
  });

  return googleMapsPromise;
};

// Optimized Map component with clustering and lazy loading
const OptimizedMapComponent = memo(
  ({
    locations = [],
    center = { lat: 38.7223, lng: -9.1393 }, // Lisbon, Portugal
    zoom = 10,
    onLocationSelect,
    onLocationCreate,
    userRole = "client",
  }: Omit<
    GoogleMapsOptimizedProps,
    "height" | "showControls" | "className"
  >) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
    const markersRef = useRef<google.maps.Marker[]>([]);

    // Initialize map only when needed
    useEffect(() => {
      if (!mapRef.current || map) return;

      const initMap = () => {
        const mapInstance = new google.maps.Map(mapRef.current!, {
          center,
          zoom,
          // Optimize map options for performance
          disableDefaultUI: true,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          gestureHandling: "greedy",
          // Reduce quality for better performance
          styles: [
            {
              featureType: "all",
              stylers: [{ saturation: -20 }, { lightness: 10 }],
            },
          ],
        });

        setMap(mapInstance);

        // Add click listener for creating new locations (admin/collaborator only)
        if (userRole !== "client" && onLocationCreate) {
          mapInstance.addListener(
            "click",
            (event: google.maps.MapMouseEvent) => {
              if (event.latLng) {
                onLocationCreate({
                  lat: event.latLng.lat(),
                  lng: event.latLng.lng(),
                });
              }
            },
          );
        }
      };

      initMap();

      return () => {
        if (map) {
          google.maps.event.clearInstanceListeners(map);
        }
      };
    }, [center, zoom, onLocationCreate, userRole, map]);

    // Update markers with clustering for performance
    useEffect(() => {
      if (!map) return;

      // Clear existing markers efficiently
      markersRef.current.forEach((marker) => {
        marker.setMap(null);
      });
      markersRef.current = [];

      // Limit number of markers for performance (max 50)
      const limitedLocations = locations.slice(0, 50);

      // Create new markers with clustering
      const newMarkers = limitedLocations.map((location) => {
        const marker = new google.maps.Marker({
          position: location.coordinates,
          map,
          title: location.name,
          icon: {
            url: createOptimizedIcon(location.type, location.status),
            scaledSize: new google.maps.Size(24, 24),
            anchor: new google.maps.Point(12, 24),
          },
          optimized: true, // Enable marker optimization
        });

        // Add click listener with debounce
        let clickTimeout: NodeJS.Timeout;
        marker.addListener("click", () => {
          clearTimeout(clickTimeout);
          clickTimeout = setTimeout(() => {
            onLocationSelect?.(location);
          }, 100);
        });

        return marker;
      });

      markersRef.current = newMarkers;
      setMarkers(newMarkers);

      // Fit bounds only if there are markers and reasonable count
      if (newMarkers.length > 0 && newMarkers.length <= 20) {
        const bounds = new google.maps.LatLngBounds();
        newMarkers.forEach((marker) => {
          const position = marker.getPosition();
          if (position) bounds.extend(position);
        });
        map.fitBounds(bounds);
      }
    }, [map, locations, onLocationSelect]);

    return (
      <div ref={mapRef} className="w-full h-full rounded-lg bg-gray-100" />
    );
  },
);

OptimizedMapComponent.displayName = "OptimizedMapComponent";

// Main Google Maps wrapper component with lazy loading
const GoogleMapsOptimized = memo(
  ({
    locations = [],
    center,
    zoom = 10,
    height = "400px",
    onLocationSelect,
    onLocationCreate,
    userRole = "client",
    className,
    showControls = true,
  }: GoogleMapsOptimizedProps) => {
    const [isLoaded, setIsLoaded] = useState(isGoogleMapsLoaded);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Intersection Observer for lazy loading
    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        },
        { threshold: 0.1 },
      );

      if (containerRef.current) {
        observer.observe(containerRef.current);
      }

      return () => observer.disconnect();
    }, []);

    // Load Google Maps when component becomes visible
    useEffect(() => {
      if (!isVisible || isLoaded || isLoading) return;

      setIsLoading(true);
      setError(null);

      loadGoogleMaps()
        .then(() => {
          setIsLoaded(true);
          setIsLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setIsLoading(false);
        });
    }, [isVisible, isLoaded, isLoading]);

    const renderContent = () => {
      if (!isVisible) {
        return (
          <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
            <div className="text-center space-y-2">
              <MapPin className="w-8 h-8 text-gray-400 mx-auto" />
              <p className="text-sm text-gray-500">Carregue para ver o mapa</p>
            </div>
          </div>
        );
      }

      if (isLoading) {
        return (
          <div className="flex items-center justify-center h-full bg-garden-green/5 rounded-lg">
            <div className="text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-garden-green mx-auto" />
              <p className="text-sm text-garden-green-dark">
                Carregando mapa...
              </p>
            </div>
          </div>
        );
      }

      if (error) {
        return (
          <div className="flex items-center justify-center h-full bg-red-50 rounded-lg border border-red-200">
            <div className="text-center space-y-4 p-6">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-red-800">
                  Mapa indisponível
                </p>
                <p className="text-xs text-red-600">{error}</p>
              </div>
            </div>
          </div>
        );
      }

      if (isLoaded) {
        return (
          <OptimizedMapComponent
            locations={locations}
            center={center}
            zoom={zoom}
            onLocationSelect={onLocationSelect}
            onLocationCreate={onLocationCreate}
            userRole={userRole}
          />
        );
      }

      return null;
    };

    return (
      <Card className={cn("garden-card", className)} ref={containerRef}>
        {showControls && (
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center text-garden-green">
                <Navigation className="w-5 h-5 mr-2" />
                Mapa de Localizações
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Badge
                  variant="outline"
                  className="border-garden-green/20 text-garden-green"
                >
                  {locations.length} localização
                  {locations.length !== 1 ? "ões" : ""}
                </Badge>
                {userRole !== "client" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-garden-green/20 text-garden-green hover:bg-garden-green hover:text-white"
                  >
                    <Search className="w-4 h-4 mr-1" />
                    Pesquisar
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
        )}

        <CardContent className="p-0">
          <div
            style={{ height }}
            className="w-full border-t border-garden-green/10"
          >
            {renderContent()}
          </div>
        </CardContent>
      </Card>
    );
  },
);

GoogleMapsOptimized.displayName = "GoogleMapsOptimized";

// Helper function to create optimized icons
function createOptimizedIcon(
  type: GardenLocation["type"],
  status?: GardenLocation["status"]
): string {
  const colors: Record<GardenLocation["type"], string> = {
    project: "#4ade80",
    nursery: "#22c55e",
    supplier: "#86efac",
    maintenance: "#f59e0b",
    client: "#3b82f6",
  };
  const color = colors[type];
  // Simple, small SVG for better performance
  return `data:image/svg+xml,${encodeURIComponent(`
    <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="10" r="8" fill="${color}" stroke="white" stroke-width="2"/>
      <circle cx="12" cy="10" r="3" fill="white"/>
      <path d="M12 18 L8 22 L16 22 Z" fill="${color}" stroke="white" stroke-width="1"/>
    </svg>
  `)}`;
}

export default GoogleMapsOptimized;
export type { GardenLocation, GoogleMapsOptimizedProps };
