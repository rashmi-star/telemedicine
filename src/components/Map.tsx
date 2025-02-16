import React, { useEffect, useRef, useState } from 'react';
import { Loader } from 'lucide-react';

interface MapProps {
  zipCode: string;
  specialty: string;
}

interface Place {
  name: string;
  vicinity: string;
  rating?: number;
  distance?: number;
  placeId: string;
}

export function Map({ zipCode, specialty }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initMap = async () => {
      try {
        setLoading(true);
        setError(null);

        // First, convert ZIP code to coordinates
        const geocoder = new google.maps.Geocoder();
        const geocodeResult = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
          geocoder.geocode(
            { address: zipCode },
            (results, status) => {
              if (status === 'OK' && results) {
                resolve(results);
              } else {
                reject(new Error('Failed to geocode ZIP code'));
              }
            }
          );
        });

        const location = geocodeResult[0].geometry.location;
        
        // Initialize the map
        const map = new google.maps.Map(mapRef.current!, {
          center: location,
          zoom: 13,
          styles: [
            {
              featureType: 'poi.medical',
              stylers: [{ visibility: 'on' }]
            },
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ]
        });

        // Search for nearby specialists
        const service = new google.maps.places.PlacesService(map);
        const searchQuery = `${specialty.toLowerCase()} doctor`;
        
        const searchResult = await new Promise<google.maps.places.PlaceResult[]>((resolve, reject) => {
          service.nearbySearch(
            {
              location,
              radius: 5000, // 5km radius
              keyword: searchQuery,
              type: 'doctor'
            },
            (results, status) => {
              if (status === 'OK' && results) {
                resolve(results);
              } else {
                reject(new Error('No specialists found nearby'));
              }
            }
          );
        });

        // Process and display results
        const processedPlaces = await Promise.all(
          searchResult.map(async (place) => {
            // Calculate distance
            const placeLocation = place.geometry?.location;
            const distance = placeLocation
              ? google.maps.geometry.spherical.computeDistanceBetween(location, placeLocation) / 1000 // Convert to km
              : undefined;

            // Create marker
            if (placeLocation) {
              const marker = new google.maps.Marker({
                position: placeLocation,
                map,
                title: place.name,
                icon: {
                  url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
                }
              });

              // Add info window
              const infoWindow = new google.maps.InfoWindow({
                content: `
                  <div class="p-2">
                    <h3 class="font-semibold">${place.name}</h3>
                    <p>${place.vicinity}</p>
                    ${place.rating ? `<p>Rating: ${place.rating} ⭐</p>` : ''}
                    ${distance ? `<p>Distance: ${distance.toFixed(1)} km</p>` : ''}
                  </div>
                `
              });

              marker.addListener('click', () => {
                infoWindow.open(map, marker);
              });
            }

            return {
              name: place.name || 'Unknown',
              vicinity: place.vicinity || 'No address available',
              rating: place.rating,
              distance,
              placeId: place.place_id!
            };
          })
        );

        setPlaces(processedPlaces.sort((a, b) => (a.distance || 0) - (b.distance || 0)));
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load map');
        setLoading(false);
      }
    };

    if (zipCode && specialty) {
      initMap();
    }
  }, [zipCode, specialty]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-800 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div ref={mapRef} className="w-full h-64 rounded-lg shadow-md" />
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Nearby {specialty}s</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {places.map((place) => (
            <div
              key={place.placeId}
              className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <h4 className="font-semibold">{place.name}</h4>
              <p className="text-gray-600 text-sm">{place.vicinity}</p>
              <div className="mt-2 flex items-center justify-between text-sm">
                {place.rating && (
                  <span className="text-yellow-600">
                    {place.rating} ⭐
                  </span>
                )}
                {place.distance && (
                  <span className="text-gray-500">
                    {place.distance.toFixed(1)} km away
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}