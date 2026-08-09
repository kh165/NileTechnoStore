import React, { useEffect, useRef, useState } from "react";
import { GeoService } from "../../lib/geoService";
import { MapPin, Search, Compass, Loader2, AlertCircle, Info } from "lucide-react";

const GOOGLE_MAPS_API_KEY =
  (typeof process !== "undefined" && process.env && process.env.GOOGLE_MAPS_PLATFORM_KEY) ||
  (import.meta.env && import.meta.env.VITE_GOOGLE_MAPS_PLATFORM_KEY) ||
  "";

export default function InteractiveMap({
  lat = 30.0444,
  lng = 31.2357,
  onChange,
  height = "250px",
  searchPlaceholder = "ابحث عن شارع، حي، أو منطقة..."
}) {
  const mapContainerRef = useRef(null);
  const inputRef = useRef(null);
  const googleMapRef = useRef(null);
  const googleMarkerRef = useRef(null);
  
  const leafletMapRef = useRef(null);
  const leafletMarkerRef = useRef(null);

  const [isGoogle, setIsGoogle] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState("");
  const [mapLayer, setMapLayer] = useState("streets"); // "streets" | "satellite" | "terrain"
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
  
  const leafletLayerRef = useRef(null);

  // Sync OpenStreetMap dynamic autocomplete suggestions
  useEffect(() => {
    if (isGoogle) return;
    if (!searchQuery || searchQuery.trim().length <= 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingSuggestions(true);
      try {
        const data = await GeoService.searchAddress(searchQuery, "ar", 5);
        setSuggestions(data || []);
      } catch (err) {
        console.error("Failed to fetch suggestions:", err);
      } finally {
        setIsSearchingSuggestions(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, isGoogle]);

  // Sync Google Maps layer type if active
  useEffect(() => {
    if (isGoogle && googleMapRef.current) {
      const maps = window.google.maps;
      if (mapLayer === "streets") {
        googleMapRef.current.setMapTypeId(maps.MapTypeId.ROADMAP);
      } else if (mapLayer === "satellite") {
        googleMapRef.current.setMapTypeId(maps.MapTypeId.HYBRID);
      } else if (mapLayer === "terrain") {
        googleMapRef.current.setMapTypeId(maps.MapTypeId.TERRAIN);
      }
    }
  }, [mapLayer, isGoogle]);

  // Sync Leaflet layer type if active
  useEffect(() => {
    if (!isGoogle && leafletMapRef.current) {
      const L = window.L;
      if (!L) return;

      if (leafletLayerRef.current) {
        leafletMapRef.current.removeLayer(leafletLayerRef.current);
      }

      let url = "https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=ar";
      if (mapLayer === "satellite") {
        url = "https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}&hl=ar";
      } else if (mapLayer === "terrain") {
        url = "https://mt{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}&hl=ar";
      }

      const layer = L.tileLayer(url, {
        maxZoom: 20,
        subdomains: ["0", "1", "2", "3"]
      }).addTo(leafletMapRef.current);

      leafletLayerRef.current = layer;
    }
  }, [mapLayer, isGoogle]);

  // Load Google Maps script if API key is provided
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      setIsGoogle(false);
      // انتظر حتى يتحمل Leaflet من index.html قبل التهيئة
      if (window.L) {
        setMapLoading(false);
        initLeaflet();
      } else {
        const waitForLeaflet = setInterval(() => {
          if (window.L) {
            clearInterval(waitForLeaflet);
            setMapLoading(false);
            initLeaflet();
          }
        }, 100);
        // توقف عن الانتظار بعد 5 ثوانٍ
        setTimeout(() => clearInterval(waitForLeaflet), 5000);
      }
      return;
    }

    const loadScript = () => {
      if (window.google && window.google.maps) {
        initGoogleMap();
        return;
      }

      const existingScript = document.getElementById("google-maps-script");
      if (existingScript) {
        existingScript.addEventListener("load", initGoogleMap);
        return;
      }

      const script = document.createElement("script");
      script.id = "google-maps-script";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&language=ar`;
      script.async = true;
      script.defer = true;
      script.addEventListener("load", initGoogleMap);
      script.addEventListener("error", () => {
        console.error("Failed to load Google Maps script, falling back to Leaflet.");
        setIsGoogle(false);
        setMapLoading(false);
        initLeaflet();
      });
      document.head.appendChild(script);
    };

    loadScript();

    return () => {
      // Cleanup leaflet if it was initialized
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        leafletMarkerRef.current = null;
      }
    };
  }, []);

  // Sync internal marker/view if external coordinates change
  useEffect(() => {
    if (isGoogle && googleMapRef.current && googleMarkerRef.current) {
      const currentPos = googleMarkerRef.current.getPosition();
      if (currentPos) {
        const dLat = Math.abs(currentPos.lat() - lat);
        const dLng = Math.abs(currentPos.lng() - lng);
        if (dLat > 0.0001 || dLng > 0.0001) {
          googleMarkerRef.current.setPosition({ lat, lng });
          googleMapRef.current.setCenter({ lat, lng });
        }
      }
    } else if (!isGoogle && leafletMapRef.current && leafletMarkerRef.current) {
      const currentPos = leafletMarkerRef.current.getLatLng();
      if (currentPos) {
        const dLat = Math.abs(currentPos.lat - lat);
        const dLng = Math.abs(currentPos.lng - lng);
        if (dLat > 0.0001 || dLng > 0.0001) {
          leafletMarkerRef.current.setLatLng([lat, lng]);
          leafletMapRef.current.setView([lat, lng]);
        }
      }
    }
  }, [lat, lng, isGoogle]);

  // Reverse geocoding helper using Google Maps API with maximum precision & component extraction
  const reverseGeocodeGoogle = (latitude, longitude) => {
    if (!window.google || !window.google.maps) return;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (results, status) => {
      if (status === "OK" && results && results.length > 0) {
        const topResult = results[0];
        let gov = "";
        let route = "";
        let neighborhood = "";
        let sublocality = "";
        let locality = "";
        let streetNumber = "";

        if (topResult.address_components) {
          topResult.address_components.forEach(comp => {
            if (comp.types.includes("administrative_area_level_1")) gov = comp.long_name;
            if (comp.types.includes("route")) route = comp.long_name;
            if (comp.types.includes("neighborhood") || comp.types.includes("sublocality_level_1")) neighborhood = comp.long_name;
            if (comp.types.includes("sublocality")) sublocality = comp.long_name;
            if (comp.types.includes("locality")) locality = comp.long_name;
            if (comp.types.includes("street_number")) streetNumber = comp.long_name;
          });
        }

        const streetPart = [streetNumber, route].filter(Boolean).join(" ");
        const parts = [streetPart, neighborhood || sublocality, locality, gov].filter(Boolean);
        const addressText = parts.length >= 2 ? parts.join("، ") : topResult.formatted_address;

        if (onChange) {
          onChange(latitude, longitude, addressText, gov || locality);
        }
      } else {
        if (onChange) {
          onChange(latitude, longitude, `موقع محدد (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`, "");
        }
      }
    });
  };

  // Reverse geocoding helper using Nominatim (Leaflet Fallback)
  const reverseGeocodeLeaflet = async (latitude, longitude) => {
    const geoData = await GeoService.reverseGeocode(latitude, longitude, "ar");
    if (onChange) {
      onChange(latitude, longitude, geoData.formatted, geoData.governorate);
    }
  };

  // Initialize Google Map
  const initGoogleMap = () => {
    if (!mapContainerRef.current) return;
    setIsGoogle(true);
    setMapLoading(false);

    try {
      const map = new window.google.maps.Map(mapContainerRef.current, {
        center: { lat, lng },
        zoom: 15,
        mapId: "DEMO_MAP_ID", // Enables Advanced Markers
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        mapTypeControlOptions: {
          style: window.google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
          position: window.google.maps.ControlPosition.TOP_RIGHT
        }
      });

      googleMapRef.current = map;

      // Add draggable marker
      const marker = new window.google.maps.Marker({
        position: { lat, lng },
        map: map,
        draggable: true,
        title: "موقع التوصيل",
        animation: window.google.maps.Animation.DROP
      });

      googleMarkerRef.current = marker;

      // Listeners
      marker.addListener("dragend", () => {
        const pos = marker.getPosition();
        if (pos) {
          reverseGeocodeGoogle(pos.lat(), pos.lng());
        }
      });

      map.addListener("click", (e) => {
        if (e.latLng) {
          marker.setPosition(e.latLng);
          reverseGeocodeGoogle(e.latLng.lat(), e.latLng.lng());
        }
      });

      // Autocomplete setup if input is available
      if (inputRef.current) {
        const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
          fields: ["formatted_address", "geometry", "name", "address_components"],
          types: ["geocode", "establishment"]
        });

        autocomplete.bindTo("bounds", map);

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (!place.geometry || !place.geometry.location) {
            return;
          }

          if (place.geometry.viewport) {
            map.fitBounds(place.geometry.viewport);
          } else {
            map.setCenter(place.geometry.location);
            map.setZoom(17);
          }

          marker.setPosition(place.geometry.location);
          const newLat = place.geometry.location.lat();
          const newLng = place.geometry.location.lng();
          const addressText = place.formatted_address || place.name;
          
          let gov = "";
          if (place.address_components) {
            const comp = place.address_components.find(c => 
              c.types.includes("administrative_area_level_1") || c.types.includes("locality")
            );
            if (comp) gov = comp.long_name;
          }

          if (onChange) {
            onChange(newLat, newLng, addressText, gov);
          }
        });
      }

      // Initial geocoding to fill the address correctly if missing
      reverseGeocodeGoogle(lat, lng);

      // Force a redraw once layout settles
      setTimeout(() => {
        window.google.maps.event.trigger(map, "resize");
      }, 300);
    } catch (e) {
      console.error("Error initializing Google Map:", e);
      setIsGoogle(false);
      initLeaflet();
    }
  };

  // Initialize Leaflet Map
  const initLeaflet = () => {
    if (!mapContainerRef.current || leafletMapRef.current) return;

    try {
      const L = window.L;
      // لو Leaflet لسه مش جاهز، انتظر وحاول تاني
      if (!L) {
        const retry = setInterval(() => {
          if (window.L) {
            clearInterval(retry);
            initLeaflet();
          }
        }, 150);
        setTimeout(() => clearInterval(retry), 5000);
        return;
      }

      const map = L.map(mapContainerRef.current, {
        center: [lat, lng],
        zoom: 14,
        zoomControl: false,
        attributionControl: false
      });

      let url = "https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=ar";
      if (mapLayer === "satellite") {
        url = "https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}&hl=ar";
      } else if (mapLayer === "terrain") {
        url = "https://mt{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}&hl=ar";
      }

      const layer = L.tileLayer(url, {
        maxZoom: 20,
        subdomains: ["0", "1", "2", "3"]
      }).addTo(map);

      leafletLayerRef.current = layer;

      // Simple HTML pin icon matching style
      const customIcon = L.divIcon({
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute -inset-2 bg-red-500/20 rounded-full animate-ping"></div>
            <div class="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-red-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
          </div>
        `,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      });

      const marker = L.marker([lat, lng], {
        draggable: true,
        icon: customIcon
      }).addTo(map);

      leafletMarkerRef.current = marker;
      leafletMapRef.current = map;

      marker.on("dragend", async (e) => {
        const latlng = e.target.getLatLng();
        await reverseGeocodeLeaflet(latlng.lat, latlng.lng);
      });

      map.on("click", async (e) => {
        const latlng = e.latlng;
        marker.setLatLng(latlng);
        await reverseGeocodeLeaflet(latlng.lat, latlng.lng);
      });

      reverseGeocodeLeaflet(lat, lng);

      // Auto-invalidate size to fix partial gray rendering in Leaflet
      setTimeout(() => { map.invalidateSize(); }, 200);
      setTimeout(() => { map.invalidateSize(); }, 600);
      setTimeout(() => { map.invalidateSize(); }, 1200);
    } catch (e) {
      console.error("Error initializing Leaflet map:", e);
    }
  };

  // GPS Locate me trigger
  const handleGPSLocate = () => {
    if (!navigator.geolocation) {
      setGpsError("مستعرض الويب الخاص بك لا يدعم تحديد الموقع (GPS).");
      return;
    }

    setIsLocating(true);
    setGpsError("");

    const successCallback = async (position) => {
      const { latitude, longitude } = position.coords;
      setIsLocating(false);

      if (isGoogle && googleMapRef.current && googleMarkerRef.current) {
        const latlng = { lat: latitude, lng: longitude };
        googleMapRef.current.setCenter(latlng);
        googleMapRef.current.setZoom(16);
        googleMarkerRef.current.setPosition(latlng);
        reverseGeocodeGoogle(latitude, longitude);
      } else if (leafletMapRef.current && leafletMarkerRef.current) {
        leafletMapRef.current.setView([latitude, longitude], 16);
        leafletMarkerRef.current.setLatLng([latitude, longitude]);
        await reverseGeocodeLeaflet(latitude, longitude);
      }
    };

    const errorCallback = (error) => {
      console.warn("GPS High accuracy failed, trying low accuracy fallback...", error);
      navigator.geolocation.getCurrentPosition(
        successCallback,
        (fallbackError) => {
          setIsLocating(false);
          switch (fallbackError.code) {
            case fallbackError.PERMISSION_DENIED:
              setGpsError("تم رفض إذن الوصول للموقع. يرجى تفعيل الـ GPS في متصفحك وهاتفك وإعطاء صلاحية الوصول.");
              break;
            case fallbackError.POSITION_UNAVAILABLE:
              setGpsError("موقع الـ GPS غير متوفر حالياً. يرجى التأكد من تشغيل تحديد الموقع في جهازك.");
              break;
            case fallbackError.TIMEOUT:
              setGpsError("انتهت مهلة تحديد الموقع تلقائياً. يرجى كتابة عنوانك بالتفصيل يدوياً.");
              break;
            default:
              setGpsError("حدث خطأ غير معروف أثناء تحديد موقعك.");
          }
        },
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
      );
    };

    // First attempt: high accuracy, 5 seconds timeout, 10 seconds maximum age
    navigator.geolocation.getCurrentPosition(
      successCallback,
      errorCallback,
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 }
    );
  };

  // Manual Leaflet Search Submission (only used when not Google)
  const handleLeafletSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchQuery || isGoogle) return;

    try {
      const results = await GeoService.searchAddress(searchQuery, "ar", 1);
      if (results && results.length > 0) {
        const first = results[0];
        const latitude = parseFloat(first.lat);
        const longitude = parseFloat(first.lon);

        if (leafletMapRef.current && leafletMarkerRef.current) {
          leafletMapRef.current.setView([latitude, longitude], 15);
          leafletMarkerRef.current.setLatLng([latitude, longitude]);
          await reverseGeocodeLeaflet(latitude, longitude);
        }
        setShowSuggestions(false);
      }
    } catch (err) {
      console.error("Search error in Leaflet:", err);
    }
  };

  return (
    <div className="w-full space-y-3 text-right">
      {/* Map Control Bar (Search & GPS button) */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        {/* Search Input Box */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          {isGoogle ? (
            <input
              ref={inputRef}
              type="text"
              placeholder={searchPlaceholder}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pr-10 pl-4 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-[#0051a8] transition-all text-right"
              style={{ direction: "rtl" }}
            />
          ) : (
            <div className="relative w-full">
              <form onSubmit={handleLeafletSearchSubmit} className="relative w-full">
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onFocus={() => setShowSuggestions(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pr-10 pl-16 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-[#0051a8] transition-all text-right"
                  style={{ direction: "rtl" }}
                />
                <button
                  type="submit"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-[#0051a8] hover:bg-blue-800 text-white text-[10px] font-black px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                >
                  بحث
                </button>
              </form>

              {/* Autocomplete Suggestions Dropdown */}
              {showSuggestions && (searchQuery.trim().length > 2) && (
                <div className="absolute right-0 left-0 mt-1 bg-white border border-slate-200/80 rounded-2xl shadow-xl z-50 max-h-48 overflow-y-auto text-right divide-y divide-slate-100">
                  {isSearchingSuggestions ? (
                    <div className="p-3 text-center text-slate-400 text-xs flex items-center justify-center gap-1.5 font-bold">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0051a8]" />
                      <span>جاري البحث عن العناوين...</span>
                    </div>
                  ) : suggestions.length === 0 ? (
                    <div className="p-3 text-center text-slate-400 text-xs font-bold">
                      لا توجد نتائج مطابقة لبحثك.
                    </div>
                  ) : (
                    suggestions.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={async (e) => {
                          e.stopPropagation();
                          const latitude = parseFloat(s.lat);
                          const longitude = parseFloat(s.lon);
                          
                          if (leafletMapRef.current && leafletMarkerRef.current) {
                            leafletMapRef.current.setView([latitude, longitude], 16);
                            leafletMarkerRef.current.setLatLng([latitude, longitude]);
                            await reverseGeocodeLeaflet(latitude, longitude);
                          }
                          setSearchQuery("");
                          setSuggestions([]);
                          setShowSuggestions(false);
                        }}
                        className="w-full px-4 py-2.5 hover:bg-slate-50 text-slate-700 hover:text-[#0051a8] transition-colors text-right block text-[10px] font-semibold border-b border-slate-100 last:border-0"
                      >
                        {s.display_name}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Locate Me Button */}
        <button
          type="button"
          onClick={handleGPSLocate}
          disabled={isLocating}
          className="bg-blue-50 hover:bg-blue-100 text-[#0051a8] font-black text-xs py-3 px-4 rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-blue-100 active:scale-98 disabled:opacity-60"
        >
          {isLocating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Compass className="w-4 h-4 animate-pulse" />
          )}
          <span>{isLocating ? "جاري التحديد..." : "تحديد موقعي (GPS)"}</span>
        </button>
      </div>

      {/* GPS Error Alert */}
      {gpsError && (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 p-3 rounded-2xl text-[11px] font-bold flex items-start gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{gpsError}</span>
        </div>
      )}

      {/* Actual Map Container */}
      <div className="relative rounded-3xl border border-slate-200 overflow-hidden shadow-md bg-slate-100" style={{ height }}>
        {mapLoading && (
          <div className="absolute inset-0 z-30 bg-slate-50 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-7 h-7 animate-spin text-[#0051a8]" />
            <span className="text-xs font-bold text-slate-500">جاري تحميل الخريطة...</span>
          </div>
        )}
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Floating Custom Map Style Selector Overlay */}
        {!mapLoading && (
          <div className="absolute top-3 left-3 z-20 flex bg-white/95 backdrop-blur-md p-1 rounded-2xl shadow-lg border border-slate-200/80 gap-1 select-none">
            <button
              type="button"
              onClick={() => setMapLayer("streets")}
              className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black transition-all cursor-pointer ${
                mapLayer === "streets"
                  ? "bg-[#0051a8] text-white shadow-sm scale-102"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              خريطة
            </button>
            <button
              type="button"
              onClick={() => setMapLayer("satellite")}
              className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black transition-all cursor-pointer ${
                mapLayer === "satellite"
                  ? "bg-[#0051a8] text-white shadow-sm scale-102"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              قمر صناعي
            </button>
          </div>
        )}

        {/* Dynamic Zoom Buttons for Leaflet (Google maps has its own built-in) */}
        {!isGoogle && !mapLoading && (
          <div className="absolute bottom-4 left-3 flex flex-col gap-1.5 z-20">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (leafletMapRef.current) leafletMapRef.current.zoomIn();
              }}
              className="w-8 h-8 bg-white hover:bg-slate-50 text-slate-800 rounded-xl shadow-md border border-slate-200 flex items-center justify-center transition-all cursor-pointer font-black active:scale-95"
              title="تكبير"
            >
              +
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (leafletMapRef.current) leafletMapRef.current.zoomOut();
              }}
              className="w-8 h-8 bg-white hover:bg-slate-50 text-slate-800 rounded-xl shadow-md border border-slate-200 flex items-center justify-center transition-all cursor-pointer font-black active:scale-95"
              title="تصغير"
            >
              -
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
