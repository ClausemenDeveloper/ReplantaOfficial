import { useCallback, useEffect, useRef, useState, memo } from "react";
import { Wrapper, Status } from "@googlemaps/react-wrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Navigation,
  Layers,
  Search,
  Filter,
  TreePine,
  Flower,
  Leaf,
  Sprout,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types for our gardening-specific map features
interface GardenLocation {
  id: string;
  name: string;
  type: "project" | "nursery" | "supplier" | "maintenance" | "client";
  coordinates: google.maps.LatLngLiteral;
  description?: string;
  status?: "active" | "pending" | "completed";
  priority?: "high" | "medium" | "low";
  assignedTo?: string;
  estimatedDuration?: string;
}

interface GoogleMapsProps {
  locations?: GardenLocation[];
  center?: google.maps.LatLngLiteral;
  zoom?: number;
  height?: string;
  showControls?: boolean;
  showFilters?: boolean;
  onLocationSelect?: (location: GardenLocation) => void;
  onLocationCreate?: (coordinates: google.maps.LatLngLiteral) => void;
  userRole?: "client" | "admin" | "collaborator";
  className?: string;
}

// Map component that handles the actual Google Maps instance
const MapComponent = memo(
  ({
    locations = [],
    center = { lat: 38.7223, lng: -9.1393 }, // Lisbon, Portugal
    zoom = 10,
    onLocationSelect,
    onLocationCreate,
    userRole = "client",
  }: Omit<
    GoogleMapsProps,
    "height" | "showControls" | "showFilters" | "className"
  >) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [markers, setMarkers] = useState<google.maps.Marker[]>([]);

    // Initialize map
    useEffect(() => {
      if (!mapRef.current) return;

      const mapInstance = new google.maps.Map(mapRef.current, {
        center,
        zoom,
        styles: [
          // Garden-themed map styling
          {
            featureType: "landscape.natural",
            stylers: [{ color: "#f0f9f0" }],
          },
          {
            featureType: "landscape.natural.landcover",
            stylers: [{ color: "#e8f5e8" }],
          },
          {
            featureType: "poi.park",
            stylers: [{ color: "#d4edda" }],
          },
          {
            featureType: "water",
            stylers: [{ color: "#b3e5fc" }],
          },
          {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ color: "#ffffff" }],
          },
          {
            featureType: "road",
            elementType: "labels.text.fill",
            stylers: [{ color: "#2d5a2d" }],
          },
        ],
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
      });

      setMap(mapInstance);

      // Add click listener for creating new locations (admin/collaborator only)
      if (userRole !== "client" && onLocationCreate) {
        mapInstance.addListener("click", (event: google.maps.MapMouseEvent) => {
          if (event.latLng) {
            onLocationCreate({
              lat: event.latLng.lat(),
              lng: event.latLng.lng(),
            });
          }
        });
      }

      return () => {
        mapInstance.unbindAll();
      };
    }, [center, zoom, onLocationCreate, userRole]);

    // Update markers when locations change
    useEffect(() => {
      if (!map) return;

      // Clear existing markers
      markers.forEach((marker) => marker.setMap(null));

      // Create new markers
      const newMarkers = locations.map((location) => {
        const icon = getLocationIcon(location.type, location.status);

        const marker = new google.maps.Marker({
          position: location.coordinates,
          map,
          title: location.name,
          icon: {
            url: `data:image/svg+xml,${encodeURIComponent(icon)}`,
            scaledSize: new google.maps.Size(40, 40),
            anchor: new google.maps.Point(20, 40),
          },
        });

        // Create info window
        const infoWindow = new google.maps.InfoWindow({
          content: createInfoWindowContent(location),
        });

        marker.addListener("click", () => {
          infoWindow.open(map, marker);
          onLocationSelect?.(location);
        });

        return marker;
      });

      setMarkers(newMarkers);

      // Fit map to show all markers
      if (newMarkers.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        newMarkers.forEach((marker) => {
          const position = marker.getPosition();
          if (position) bounds.extend(position);
        });
        map.fitBounds(bounds);
      }
    }, [map, locations, onLocationSelect]);

    return <div ref={mapRef} className="w-full h-full rounded-lg" />;
  },
);

MapComponent.displayName = "MapComponent";

// Main Google Maps wrapper component
const GoogleMaps = memo(
  ({
    locations = [],
    center,
    zoom = 10,
    height = "500px",
    showControls = true,
    showFilters = true,
    onLocationSelect,
    onLocationCreate,
    userRole = "client",
    className,
  }: GoogleMapsProps) => {
    const [filteredLocations, setFilteredLocations] = useState(locations);
    const [activeFilter, setActiveFilter] = useState<string>("all");
    const [isLoading, setIsLoading] = useState(true);
    const [mapStatus, setMapStatus] = useState<Status>(Status.LOADING);

    useEffect(() => {
      setFilteredLocations(locations);
    }, [locations]);

    // Handle map status changes
    useEffect(() => {
      if (mapStatus === Status.SUCCESS) {
        setIsLoading(false);
      }
    }, [mapStatus]);

    const handleFilterChange = useCallback(
      (filter: string) => {
        setActiveFilter(filter);
        if (filter === "all") {
          setFilteredLocations(locations);
        } else {
          setFilteredLocations(
            locations.filter((location) => location.type === filter),
          );
        }
      },
      [locations],
    );

    const render = useCallback(
      (status: Status) => {
        // Update status without causing re-render
        if (status !== mapStatus) {
          setTimeout(() => setMapStatus(status), 0);
        }

        switch (status) {
          case Status.LOADING:
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
          case Status.FAILURE:
            return (
              <div className="flex items-center justify-center h-full bg-red-50 rounded-lg border border-red-200">
                <div className="text-center space-y-4 p-6">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-red-800">
                      Mapa indisponível
                    </p>
                    <p className="text-xs text-red-600">
                      Chave da API do Google Maps não configurada ou inválida.
                    </p>
                    <p className="text-xs text-gray-500">
                      Configure VITE_GOOGLE_MAPS_API_KEY nas variáveis de
                      ambiente.
                    </p>
                  </div>
                </div>
              </div>
            );
          case Status.SUCCESS:
            return (
              <MapComponent
                locations={filteredLocations}
                center={center}
                zoom={zoom}
                onLocationSelect={onLocationSelect}
                onLocationCreate={onLocationCreate}
                userRole={userRole}
              />
            );
          default:
            return null;
        }
      },
      [
        filteredLocations,
        center,
        zoom,
        onLocationSelect,
        onLocationCreate,
        userRole,
        mapStatus,
      ],
    );

    const filterOptions = [
      { key: "all", label: "Todos", icon: <MapPin className="w-4 h-4" /> },
      {
        key: "project",
        label: "Projetos",
        icon: <TreePine className="w-4 h-4" />,
      },
      {
        key: "nursery",
        label: "Viveiros",
        icon: <Sprout className="w-4 h-4" />,
      },
      {
        key: "supplier",
        label: "Fornecedores",
        icon: <Leaf className="w-4 h-4" />,
      },
      {
        key: "maintenance",
        label: "Manutenção",
        icon: <Flower className="w-4 h-4" />,
      },
      {
        key: "client",
        label: "Clientes",
        icon: <MapPin className="w-4 h-4" />,
      },
    ];

    return (
      <Card className={cn("garden-card", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-garden-green">
              <Navigation className="w-5 h-5 mr-2" />
              Mapa de Localizações
            </CardTitle>
            {showControls && (
              <div className="flex items-center space-x-2">
                <Badge
                  variant="outline"
                  className="border-garden-green/20 text-garden-green"
                >
                  {filteredLocations.length} localização
                  {filteredLocations.length !== 1 ? "ões" : ""}
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
            )}
          </div>

          {showFilters && (
            <div className="flex flex-wrap gap-2 mt-3">
              {filterOptions.map((option) => (
                <Button
                  key={option.key}
                  size="sm"
                  variant={activeFilter === option.key ? "default" : "outline"}
                  onClick={() => handleFilterChange(option.key)}
                  className={cn(
                    "text-xs",
                    activeFilter === option.key
                      ? "bg-garden-green text-white"
                      : "border-garden-green/20 text-garden-green hover:bg-garden-green hover:text-white",
                  )}
                >
                  {option.icon}
                  <span className="ml-1">{option.label}</span>
                </Button>
              ))}
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          <div
            style={{ height }}
            className="w-full border-t border-garden-green/10"
          >
            {import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? (
              <Wrapper
                apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
                render={render}
                libraries={["places", "geometry"]}
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="text-center space-y-4 p-6">
                  <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-yellow-800">
                      Google Maps não configurado
                    </p>
                    <p className="text-xs text-yellow-600">
                      A chave da API do Google Maps não foi encontrada.
                    </p>
                    <p className="text-xs text-gray-500">
                      Configure VITE_GOOGLE_MAPS_API_KEY nas variáveis de
                      ambiente para activar o mapa.
                    </p>
                  </div>
                  <div className="pt-2">
                    <Badge variant="outline" className="text-xs">
                      Funcionalidade: Visualização de localizações
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  },
);

GoogleMaps.displayName = "GoogleMaps";

// Helper function to create custom icons based on location type and status
function getLocationIcon(
  type: GardenLocation["type"],
  status?: GardenLocation["status"],
): string {
  const colors = {
    project: "#4ade80", // garden-green
    nursery: "#22c55e", // garden-green-dark
    supplier: "#86efac", // garden-green-light
    maintenance: "#f59e0b", // orange
    client: "#3b82f6", // blue
  };

  const statusColors = {
    active: colors[type],
    pending: "#f59e0b",
    completed: "#10b981",
  };

  const color = status ? statusColors[status] : colors[type];

  return `<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="15" r="12" fill="${color}" stroke="white" stroke-width="2"/>
    <circle cx="20" cy="15" r="6" fill="white"/>
    <path d="M20 25 L15 35 L25 35 Z" fill="${color}" stroke="white" stroke-width="1"/>
  </svg>`;
}

// Helper function to create info window content
function createInfoWindowContent(location: GardenLocation): string {
  const statusBadge = location.status
    ? `<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${
        location.status === "active"
          ? "green"
          : location.status === "pending"
            ? "yellow"
            : "blue"
      }-100 text-${
        location.status === "active"
          ? "green"
          : location.status === "pending"
            ? "yellow"
            : "blue"
      }-800">${
        location.status === "active"
          ? "Ativo"
          : location.status === "pending"
            ? "Pendente"
            : "Concluído"
      }</span>`
    : "";

  return `
    <div class="p-2 max-w-xs">
      <h3 class="font-semibold text-lg mb-2">${location.name}</h3>
      <p class="text-sm text-gray-600 mb-2">${location.description || "Sem descrição disponível"}</p>
      <div class="flex items-center space-x-2 mb-2">
        <span class="text-xs font-medium px-2 py-1 bg-gray-100 rounded">${location.type}</span>
        ${statusBadge}
      </div>
      ${location.assignedTo ? `<p class="text-xs text-gray-500">Responsável: ${location.assignedTo}</p>` : ""}
      ${location.estimatedDuration ? `<p class="text-xs text-gray-500">Duração estimada: ${location.estimatedDuration}</p>` : ""}
    </div>
  `;
}

export default GoogleMaps;
export type { GardenLocation, GoogleMapsProps };
