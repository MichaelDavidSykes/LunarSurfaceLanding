Offline continents data for the interactive globe

Place one of the following files in this folder so the globe can render country polygons without any network requests:

1) GeoJSON (preferred)
   - File name: countries-110m.geojson
   - Source (example): Natural Earth or the three-globe example dataset
   - Expected shape: FeatureCollection with Polygon/MultiPolygon features

2) TopoJSON (fallback)
   - File name: countries-110m.json
   - Source (example): world-atlas (Mike Bostock)
   - Contains: an object named `countries` under `objects`

The app first tries to load `countries-110m.geojson`. If not found, it tries `countries-110m.json` and converts it to GeoJSON at runtime.

Notes
- Typical world-atlas packages: countries-110m.json (~500KB)
- For best performance on mobile, smaller/simplified datasets are fine.
- Ensure the file is UTF-8 encoded and valid JSON.

