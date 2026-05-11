interface LatLng {
  latitude: number;
  longitude: number;
}

export const fetchRoute = async (start: LatLng, end: LatLng): Promise<LatLng[]> => {
  try {
    const url = `http://router.project-osrm.org/route/v1/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?overview=full&geometries=geojson`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.code !== 'Ok') {
      console.warn('[Routing Service] OSRM Route failed:', data.code);
      return [start, end]; // Fallback to straight line
    }

    const coordinates = data.routes[0].geometry.coordinates;
    return coordinates.map((coord: [number, number]) => ({
      latitude: coord[1],
      longitude: coord[0],
    }));
  } catch (error) {
    console.error('[Routing Service] Fetch route error:', error);
    return [start, end];
  }
};

export const optimizeRoute = async (start: LatLng, waypoints: LatLng[]): Promise<number[]> => {
  try {
    if (waypoints.length === 0) return [];
    
    // Construct coordinate string: start point + all waypoints
    const allCoords = [
      `${start.longitude},${start.latitude}`,
      ...waypoints.map(wp => `${wp.longitude},${wp.latitude}`)
    ].join(';');

    const url = `http://router.project-osrm.org/trip/v1/driving/${allCoords}?source=first&destination=any&roundtrip=false&geometries=geojson`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.code !== 'Ok') {
      console.warn('[Routing Service] OSRM Trip failed:', data.code);
      return waypoints.map((_, i) => i); // Fallback to original order
    }

    // OSRM returns waypoints in the optimized order.
    // Each waypoint in the response has a 'waypoint_index' which corresponds to the index in the input list.
    // Index 0 is the start point (driverPos), which we skip.
    const optimizedIndices = data.waypoints
      .filter((wp: any) => wp.waypoint_index !== 0) // Remove the starting driver location
      .sort((a: any, b: any) => a.trips_index - b.trips_index) // Sort by their position in the trip
      .map((wp: any) => wp.waypoint_index - 1); // Normalize index to match waypoints array (0-based after removing start)

    return optimizedIndices;
  } catch (error) {
    console.error('[Routing Service] Optimize route error:', error);
    return waypoints.map((_, i) => i);
  }
};
