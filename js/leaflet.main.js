var CCX_GlobalNodeMap = (function () {
  var markerClusters = null;
  var myIcon = null;
  var mbAttr = null;
  var map = null;

  function Initialize() {
    var self = this;
  }

  Initialize.load = function (container, callback) {
    if (!map) {
      map = L.map(container, {
        center: [10.0, 5.0],
        minZoom: 2,
        zoom: 2
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        subdomains: ['a', 'b', 'c']
      }).addTo(map);


      mbAttr = 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
        '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        mbUrl = 'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';

      L.tileLayer(mbUrl, { id: 'mapbox.light', attribution: mbAttr }).addTo(map);
      //L.tileLayer(mbUrl, {id: 'mapbox.streets',   attribution: mbAttr});

      myIcon = L.icon({
        iconUrl: 'img/pin24.png',
        iconRetinaUrl: 'img/pin48.png',
        iconSize: [29, 24],
        iconAnchor: [9, 21],
        popupAnchor: [0, -14]
      });

      var mapTypeControl = L.Control.extend({
        options: {
          position: 'topleft'
        },

        onAdd: function (map) {
          var container = L.DomUtil.create('div', 'leaflet-control-fullscreen leaflet-bar leaflet-control');
          var mapType = 0;

          container.style.backgroundColor = 'white';
          container.style.backgroundImage = "url(img/cluster.png)";
          container.style.backgroundSize = "30px 30px";
          container.style.cursor = "pointer";
          container.style.width = '35px';
          container.style.height = '35px';

          container.onclick = function () {
            if (mapType == 0) {
              markerClusters.disableClustering();
              mapType = 1;
            } else {
              markerClusters.enableClustering();
              mapType = 0;
            }
          }

          return container;
        }
      });

      markerClusters = L.markerClusterGroup();
      map.addControl(new mapTypeControl());
      map.addControl(new L.Control.Fullscreen());
    }

    $.getJSON("https://explorer.conceal.network/services/nodes/geodata", function (data) {
      $("#nodesNumber").html("(" + data.length + " online)");

      if (markerClusters) {
        markerClusters.clearLayers();
        map.removeLayer(markerClusters);
      }

      for (var i = 0; i < data.length; ++i) {
        if (data[i].geoData) {
          var popup = '<b>city:</b> ' + data[i].geoData.city + '<br/>' +
            '<b>region:</b> ' + data[i].geoData.region + '<br/>' +
            '<b>country:</b> ' + data[i].geoData.country;

          var m = L.marker([data[i].geoData.ll[0], data[i].geoData.ll[1]], { icon: myIcon }).bindPopup(popup);
          markerClusters.addLayer(m);
        }
      }

      map.addLayer(markerClusters);
      callback(true);
    });
  };


  return Initialize;
})();