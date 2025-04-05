// Create the 'basemap' tile layer that will be the background of our map.
let aerial = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
  attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
});

let greyscale = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, ' +
    '&copy; <a href="https://carto.com/attributions">CartoDB</a>'
});

// OPTIONAL: Step 2
// Create the 'street' tile layer as a second background of the map
let street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

// Define the basemaps options
let basemaps = {
  "Satellite": aerial,
  "Greyscale": greyscale,
  "Street Map": street
};

// Create the map object with center and zoom options.
let map = L.map("map", {
  center: [39.83, -98.58],
  zoom: 4
});

// Then add the 'basemap' tile layer to the map.
aerial.addTo(map);

// OPTIONAL: Step 2
// Create the layer groups, base maps, and overlays for our two sets of data, earthquakes and tectonic_plates.
// Add a control to the map that will allow the user to change which layers are visible.
let layers = {
  earthquakes: new L.layerGroup(),
  tectonic_plates: new L.layerGroup()
};

let overlays = {
  "Earthquakes": layers.earthquakes,
  "Tectonic Plates": layers.tectonic_plates
};

L.control.layers(basemaps, overlays, {collapsed: false}).addTo(map)

// Make a request that retrieves the earthquake geoJSON data.
url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson"

d3.json(url).then(function (data) {
  createFeatures(data.features);
});

function createFeatures(earthquakeData) {
  
  // This function returns the style data for each of the earthquakes we plot on
  // the map. Pass the magnitude and depth of the earthquake into two separate functions
  // to calculate the color and radius.
  function styleInfo(feature) {
    return {
      opacity: 1,
      fillOpacity: 1,
      fillColor: getColor(feature.geometry.coordinates[2]),
      color: "#000000",
      radius: getRadius(feature.properties.mag),
      stroke: true,
      weight: 0.5
    };
  }

  // This function determines the color of the marker based on the depth of the earthquake.
  function getColor(depth) {
      if (depth > 90) return "#ea2c2c";
      if (depth > 70) return "#ea822c";
      if (depth > 50) return "#ee9c00";
      if (depth > 30) return "#eecc00";
      if (depth > 10) return "#d4ee00";
      return "#98ee00";
  }

  // This function determines the radius of the earthquake marker based on its magnitude.
  function getRadius(magnitude) {
    return magnitude ? magnitude * 4 : 1;
  }

  // Add a GeoJSON layer to the map once the file is loaded.
  L.geoJson(earthquakeData, {
    // Turn each feature into a circleMarker on the map.
    pointToLayer: function (feature, latlng) {
      return L.circleMarker(latlng)
    },
    // Set the style for each circleMarker using our styleInfo function.
    style: styleInfo,
    // Create a popup for each marker to display the magnitude and location of the earthquake after the marker has been created and styled
    onEachFeature: function (feature, layer) {
      layer.bindPopup(
        `<h3>Magnitude: ${feature.properties.mag}</h3>
        <p>Location: ${feature.properties.place}</p>
        <p>Depth: ${feature.geometry.coordinates[2]} km</p>`
      );
    }
  // OPTIONAL: Step 2
  // Add the data to the earthquake layer instead of directly to the map.
  }).addTo(layers.earthquakes);

  layers.earthquakes.addTo(map);

  // Create a legend control object.
  let legend = L.control({
    position: "bottomright"
  });

  // Then add all the details for the legend
  legend.onAdd = function () {
    let div = L.DomUtil.create("div", "info legend");

    // Initialize depth intervals and colors for the legend
    let depths = [-10, 10, 30, 50, 70, 90];
    let colors = [
      "#98ee00",
      "#d4ee00",
      "#eecc00",
      "#ee9c00",
      "#ea822c",
      "#ea2c2c"
    ];

    // Loop through our depth intervals to generate a label with a colored square for each interval.
    for (let i = 0; i < depths.length; i++) {
      let label =(depths[i + 1])
        ? `${depths[i]}&ndash;${depths[i + 1]} km`
        : `${depths[i]}+ km`;

      div.innerHTML +=
      `<div style="display: flex; align-items: center; margin-bottom: 4px;">
         <span style="
           display: inline-block;
           width: 18px;
           height: 18px;
           background:${colors[i]};
           margin-right: 8px;
           border: 1px solid #ccc;">
         </span>
         ${label}
       </div>`;
    }

    return div;
  };

  // Finally, add the legend to the map.
  legend.addTo(map);

  // OPTIONAL: Step 2
  // Make a request to get our Tectonic Plate geoJSON data.
  url2="https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json"

  d3.json(url2).then(function (plate_data) {
    createPlates(plate_data);
  });

  // Save the geoJSON data, along with style information, to the tectonic_plates layer.
  function createPlates(data) {
    L.geoJson(data, {
      style:{
        color: "orange",
        weight: 2
      }
    }).addTo(layers.tectonic_plates);

    // Then add the tectonic_plates layer to the map.
    layers.tectonic_plates.addTo(map);
  };
};
