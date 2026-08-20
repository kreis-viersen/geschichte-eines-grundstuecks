import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import MaplibreGeocoder from '@maplibre/maplibre-gl-geocoder';
import '@maplibre/maplibre-gl-geocoder/dist/maplibre-gl-geocoder.css';
import proj4 from 'proj4';
import { jsPDF } from 'jspdf';
import { PDFDocument, rgb } from 'pdf-lib';
import { booleanPointInPolygon } from '@turf/boolean-point-in-polygon';
import locationCursorUrl from './assets/location-cursor.svg?url';
import './styles.css';

const A4_LANDSCAPE_RATIO = 297 / 210;
const PRINT_PIXEL_WIDTH = 2475;
const PRINT_PIXEL_HEIGHT = 1750;
const EARTH_RADIUS_METERS = 6_371_008.8;
const NRW_BOUNDARY_ASSET_URL = `${import.meta.env.BASE_URL}assets/nrw.geojson`;
const KREIS_VIERSEN_COVERAGE_ASSET_URL = `${import.meta.env.BASE_URL}assets/coverage/kreis-viersen.geojson`;
const KREIS_VIERSEN_TIMELINE_ASSET_URL = `${import.meta.env.BASE_URL}assets/pdf/kreis-viersen-zeitstrahl.png`;
const KREIS_VIERSEN_URGEMARKUNGEN_PDF_URL = `${import.meta.env.BASE_URL}assets/pdf/kreis-viersen-urgemarkungen.pdf`;
const GEOBASIS_NRW_CURRENT_AERIAL_INFO_URL = 'https://www.bezreg-koeln.nrw.de/geobasis-nrw/produkte-und-dienste/luftbild-und-satellitenbildinformationen/aktuelle-luftbild-und';
const GEOBASIS_NRW_HISTORICAL_AERIAL_INFO_URL = 'https://www.bezreg-koeln.nrw.de/geobasis-nrw/produkte-und-dienste/luftbild-und-satellitenbildinformationen/historische-luftbild-1';
const KREIS_VIERSEN_HISTORICAL_MAP_DOWNLOAD_URL = 'https://opendata-kreis-viersen.de/histKarten/';
const KREIS_VIERSEN_GEOPORTAL_URGEMARKUNGEN_URL = 'https://geoportal-niederrhein.de/Verband/?MAPS=%7B%22center%22:%5B305336.6666698497,5683425.000008335%5D,%22mode%22:%222D%22,%22zoom%22:2%7D&MENU=%7B%22main%22:%7B%22currentComponent%22:%22root%22%7D,%22secondary%22:%7B%22currentComponent%22:%22root%22%7D%7D&LAYERS=%5B%7B%22id%22:%2229112-29111-29110-29109%22,%22visibility%22:true%7D,%7B%22id%22:%22200370%22,%22visibility%22:true%7D,%7B%22id%22:%2220070%22,%22visibility%22:true%7D,%7B%22id%22:%2220071%22,%22visibility%22:true%7D,%7B%22id%22:%2220522%22,%22visibility%22:true%7D%5D#';
const KREIS_VIERSEN_GEOPORTAL_URFLUREN_URL = 'https://geoportal-niederrhein.de/Verband/?MAPS=%7B%22center%22:%5B305336.6666698497,5683425.000008335%5D,%22mode%22:%222D%22,%22zoom%22:2%7D&MENU=%7B%22main%22:%7B%22currentComponent%22:%22root%22%7D,%22secondary%22:%7B%22currentComponent%22:%22root%22%7D%7D&LAYERS=%5B%7B%22id%22:%2229112-29111-29110-29109%22,%22visibility%22:true%7D,%7B%22id%22:%22200370%22,%22visibility%22:true%7D,%7B%22id%22:%2220070%22,%22visibility%22:true%7D,%7B%22id%22:%2220071%22,%22visibility%22:true%7D,%7B%22id%22:%2220523%22,%22visibility%22:true%7D%5D#';
const KREIS_VIERSEN_GEOPORTAL_AMTSKARTEN_URL = 'https://geoportal-niederrhein.de/Verband/?MAPS=%7B%22center%22:%5B305336.6666698497,5683425.000008335%5D,%22mode%22:%222D%22,%22zoom%22:2%7D&MENU=%7B%22main%22:%7B%22currentComponent%22:%22layerInformation%22,%22attributes%22:%7B%22layerInfo%22:%7B%22cswUrl%22:%22https%253A%252F%252Fgeodatenkatalog-niederrhein.de%252Fcsw%22,%22id%22:%2220524%22,%22layername%22:%22Amtskarten%20Kreis%20Viersen%22,%22showDocUrl%22:%22https%253A%252F%252Fgeodatenkatalog-niederrhein.de%252Ftrefferanzeige%253Fcmd%253DdoShowDocument%2526docuuid%253D%22,%22typ%22:%22WMS%22,%22metaID%22:%22400d1a9d-6496-4a06-8e00-d4adea7a7992%22,%22url%22:%22https%253A%252F%252Fgeo.kreis-viersen.de%252Fows%252Fsammeldienst%22%7D%7D%7D,%22secondary%22:%7B%22currentComponent%22:%22root%22%7D%7D&LAYERS=%5B%7B%22id%22:%2229112-29111-29110-29109%22,%22visibility%22:true%7D,%7B%22id%22:%22200370%22,%22visibility%22:true%7D,%7B%22id%22:%2220070%22,%22visibility%22:true%7D,%7B%22id%22:%2220071%22,%22visibility%22:true%7D,%7B%22id%22:%2220524%22,%22visibility%22:true%7D%5D#';
const KREIS_VIERSEN_METADATA_AMTSKARTEN_URL = 'https://geodatenkatalog-niederrhein.de/trefferanzeige?docuuid=400d1a9d-6496-4a06-8e00-d4adea7a7992';
const KREIS_VIERSEN_METADATA_GEMARKUNGEN_URL = 'https://geodatenkatalog-niederrhein.de/trefferanzeige?docuuid=70363ac9-8f5a-4ea7-a73e-de3a58de94c1';
const KREIS_VIERSEN_METADATA_FLUREN_URL = 'https://geodatenkatalog-niederrhein.de/trefferanzeige?docuuid=341d7d17-ffc6-46bd-82db-dcc85976668b';
const KREIS_VIERSEN_METADATA_REINKARTEN_URL = 'https://geodatenkatalog-niederrhein.de/trefferanzeige?docuuid=6482ca27-f7e6-4024-a5de-1dd189ad0580&q=reinkarte&f=';
const KREIS_VIERSEN_METADATA_URKARTEN_URL = 'https://geodatenkatalog-niederrhein.de/trefferanzeige?docuuid=f184589b-b9b4-4622-aa00-2f6819dd7e29&q=urkarte&f=';
const KREIS_VIERSEN_CONTACT_PHONE_URL = 'tel:+492162391130';
const KREIS_VIERSEN_CONTACT_EMAIL_URL = 'mailto:katasteramt@kreis-viersen.de';
const KREIS_VIERSEN_HISTORICAL_TRACE_URL = 'https://www.kreis-viersen.de/service/dienstleistungen/historische-rueckverfolgung';
const WMS_BASE_URL = 'https://www.wms.nrw.de/geobasis';
const COVERAGE_NRW = 'nrw';
const COVERAGE_KREIS_VIERSEN = 'kreis-viersen';
const NRW_BOUNDARY_SOURCE_ID = 'nrw-boundary-source';
const NRW_BOUNDARY_CASING_LAYER_ID = 'nrw-boundary-casing';
const NRW_BOUNDARY_LINE_LAYER_ID = 'nrw-boundary-line';
const NRW_FIT_PADDING_MIN_PX = 28;
const NRW_FIT_PADDING_MAX_PX = 72;
const NRW_FIT_PADDING_VIEWPORT_SHARE = 0.07;
const PHOTON_API_URL = 'https://photon.komoot.io/api/';
const PHOTON_RESULT_LIMIT = 5;
const PHOTON_FALLBACK_NRW_BBOX = [5.75, 50.25, 9.65, 52.65];
const PHOTON_ERROR_TOAST_INTERVAL_MS = 10_000;
const APP_MODE_SIMPLE = 'simple';
const APP_MODE_ADVANCED = 'advanced';
const SIMPLE_SCALE_AERIAL_AND_PARCEL = 1_000;
const SIMPLE_SCALE_BASE_MAP = 2_500;
const SIMPLE_SCALE_ABK = 2_500;
const SIMPLE_SCALE_ALKIS_PARCEL = 1_000;
const SIMPLE_SCALE_HISTORICAL = 10_000;
const STARTUP_PRINT_PARAM = 'print';
const STARTUP_PRINT_DIALOG = 'dialog';
const STARTUP_PRINT_AUTO = 'auto';
const PERMALINK_POINT_PARAM = 'point';
const PERMALINK_LAYERS_PARAM = 'layers';
const SIMPLE_DIALOG_MOBILE_BREAKPOINT_PX = 760;
const SIMPLE_DIALOG_MAP_GAP_PX = 20;
const PDF_FRONT_MATTER_PAGE_COUNT = 3;
const PDF_GENERAL_APPENDIX_PAGE_COUNT = 1;
const PDF_KREIS_VIERSEN_APPENDIX_PAGE_COUNT = 4;
const PDF_PAGE_WIDTH_MM = 297;
const PDF_PAGE_HEIGHT_MM = 210;
const OSM_TILE_SIZE = 256;
const OSM_OVERVIEW_ZOOM = 12;
const OSM_OVERVIEW_WIDTH = 1080;
const OSM_OVERVIEW_HEIGHT = 760;
const OSM_MAX_TILE_ZOOM = 19;
const WEB_MERCATOR_HALF_WORLD_METERS = 20_037_508.342789244;
const WEB_MERCATOR_WORLD_METERS = WEB_MERCATOR_HALF_WORLD_METERS * 2;

function parseMapHash(hash = window.location.hash) {
  const parts = String(hash).replace(/^#/, '').split('/');
  if (parts.length < 3) return null;

  const zoom = Number(parts[0]);
  const lat = Number(parts[1]);
  const lng = Number(parts[2]);
  if (!Number.isFinite(zoom) || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (zoom < 0 || zoom > 24 || lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

  return { zoom, lat, lng };
}

function getStartupPrintAction(search = window.location.search) {
  const value = new URLSearchParams(search).get(STARTUP_PRINT_PARAM);
  return value === STARTUP_PRINT_DIALOG || value === STARTUP_PRINT_AUTO ? value : null;
}

function parsePermalinkLayerToken(value) {
  const token = String(value ?? '').trim();
  if (!token) return null;

  let id = token;
  let visible = true;
  let opacity = 1;
  const opacityMatch = token.match(/^([a-z0-9-]+)_(0(?:\.\d+)?|1(?:\.0+)?)$/i);
  if (opacityMatch) {
    id = opacityMatch[1];
    const parsedOpacity = Number(opacityMatch[2]);
    if (!Number.isFinite(parsedOpacity) || parsedOpacity < 0 || parsedOpacity > 1) return null;
    if (parsedOpacity === 0) {
      visible = false;
      opacity = 1;
    } else {
      opacity = parsedOpacity;
    }
  }

  if (!/^[a-z0-9-]+$/i.test(id)) return null;
  return { id: id.toLowerCase(), visible, opacity };
}

function parseAdvancedPermalink(search = window.location.search) {
  const params = new URLSearchParams(search);
  const pointValue = params.get(PERMALINK_POINT_PARAM);
  if (!pointValue) return null;

  const pointParts = pointValue.split(',');
  if (pointParts.length !== 2) return null;
  const lng = Number(pointParts[0]);
  const lat = Number(pointParts[1]);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  if (lng < -180 || lng > 180 || lat < -90 || lat > 90) return null;

  const hasLayerList = params.has(PERMALINK_LAYERS_PARAM);
  const rawLayers = params.get(PERMALINK_LAYERS_PARAM) ?? '';
  const layers = rawLayers
    ? rawLayers.split(',').map(parsePermalinkLayerToken).filter(Boolean)
    : [];

  return {
    point: { lng, lat },
    layers,
    hasLayerList
  };
}

const startupMapView = parseMapHash();
const startupPermalink = parseAdvancedPermalink();
const startupPrintAction = getStartupPrintAction();



// MapLibre GL JS 6 benötigt bei Bundlern eine explizite Worker-URL.
// ?worker&url lässt Vite einen eigenständigen Worker-Chunk mit korrektem
// Dateipfad und JavaScript-MIME-Typ erzeugen.
maplibregl.setWorkerUrl(maplibreWorkerUrl);

proj4.defs(
  'EPSG:25832',
  '+proj=utm +zone=32 +ellps=GRS80 +units=m +no_defs +type=crs'
);
proj4.defs(
  'EPSG:3857',
  '+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs +type=crs'
);

const services = [
  {
    id: 'wms_nw_hist_dop',
    url: `${WMS_BASE_URL}/wms_nw_hist_dop`,
    label: 'Historische DOP',
    shortLabel: 'hist. DOP',
    infoLayer: 'nw_hist_dop_info',
    imageLayer: year => `nw_hist_dop_${year}`
  },
  {
    id: 'wms_nw_hist_idop',
    url: `${WMS_BASE_URL}/wms_nw_hist_idop`,
    label: 'Historische iDOP',
    shortLabel: 'hist. iDOP',
    infoLayer: 'nw_hist_idop_info',
    imageLayer: year => `nw_hist_idop_${year}`
  },
  {
    id: 'wms_nw_dop',
    url: `${WMS_BASE_URL}/wms_nw_dop`,
    label: 'Aktuelle DOP',
    shortLabel: 'DOP',
    infoLayer: 'nw_dop_utm_info',
    imageLayer: () => 'nw_dop_rgb'
  },
  {
    id: 'wms_nw_idop',
    url: `${WMS_BASE_URL}/wms_nw_idop`,
    label: 'Aktuelle iDOP',
    shortLabel: 'iDOP',
    infoLayer: 'nw_idop_info',
    imageLayer: () => 'nw_idop_rgb'
  },
  {
    id: 'wms_nw_vdop',
    url: `${WMS_BASE_URL}/wms_nw_vdop`,
    label: 'Vorläufige DOP',
    shortLabel: 'vDOP',
    infoLayer: 'nw_vdop_info',
    imageLayer: () => 'nw_vdop_rgb'
  }
];

const supplementalMapServices = [
  {
    id: 'wms_nw_tranchot',
    url: `${WMS_BASE_URL}/wms_nw_tranchot`,
    label: 'Tranchot / v. Müffling',
    shortLabel: 'Tranchot',
    wmsLayer: 'nw_tranchot',
    selectionDetail: 'Kartenaufnahme der Rheinlande 1801–1828',
    hoverDetail: 'Kartenaufnahme der Rheinlande 1801–1828',
    pdfTitle: 'Tranchot / v. Müffling',
    pdfSubtitle: 'Kartenaufnahme der Rheinlande 1801–1828',
    coverage: COVERAGE_KREIS_VIERSEN,
    sortYear: 1828,
    minZoom: 10.7,
    attribution: 'Geobasis NRW',
    pdfAttribution: 'Geobasis NRW · Datenlizenz Deutschland – Zero – Version 2.0'
  },
  {
    id: 'wms_nw_uraufnahme',
    url: `${WMS_BASE_URL}/wms_nw_uraufnahme`,
    label: 'Preußische Uraufnahme',
    shortLabel: 'Uraufnahme',
    wmsLayer: 'nw_uraufnahme_rw',
    selectionDetail: 'Preußische Kartenaufnahme 1:25.000 · 1836–1850',
    hoverDetail: 'Preußische Kartenaufnahme 1836–1850',
    pdfTitle: 'Preußische Uraufnahme',
    pdfSubtitle: 'Preußische Kartenaufnahme 1:25.000 · 1836–1850',
    coverage: COVERAGE_KREIS_VIERSEN,
    sortYear: 1850,
    minZoom: 10.7,
    attribution: 'Geobasis NRW',
    pdfAttribution: 'Geobasis NRW · Datenlizenz Deutschland – Zero – Version 2.0'
  },
  {
    id: 'flurkarte_nw_viersen',
    url: 'https://gdi-niederrhein-geodienste.de/flurkarte_verb_sammeldienst/service',
    label: 'Flurkarte Kreis Viersen',
    shortLabel: 'Flurkarte',
    wmsLayer: 'FlurkarteNW_Viersen',
    selectionDetail: 'tagesaktueller Stand',
    hoverDetail: 'Flurkarte Kreis Viersen',
    pdfTitle: 'Flurkarte Kreis Viersen',
    pdfSubtitle: 'tagesaktueller Stand',
    coverage: COVERAGE_KREIS_VIERSEN,
    sortYear: 9999,
    minZoom: 14,
    attribution: 'KRZN ,
    pdfAttribution: 'KRZN · Datenlizenz Deutschland – Zero – Version 2.0'
  },
  {
    id: 'wms_nw_alkis_flurkarte',
    url: `${WMS_BASE_URL}/wms_nw_alkis`,
    label: 'Flurkarte NRW',
    shortLabel: 'Flurkarte NRW',
    // Fachliche Reihenfolge wie in der Layerliste: erster Eintrag liegt oben.
    // Für den WMS-GetMap-Request wird diese Liste später umgedreht, weil
    // WMS die zuerst angegebene Ebene zuerst (also unten) zeichnet.
    wmsLayersTopToBottom: [
      'adv_alkis_flurstuecke',
      'adv_alkis_gebaeude',
      'adv_alkis_bauw_einricht',
      'adv_alkis_gewaesser',
      'adv_alkis_siedlung',
      'adv_alkis_vegetation',
      'adv_alkis_verkehr'
    ],
    selectionDetail: 'Liegenschaftskarte NRW · ALKIS',
    hoverDetail: 'Liegenschaftskarte NRW · ALKIS',
    pdfTitle: 'Flurkarte NRW',
    pdfSubtitle: 'Liegenschaftskarte NRW · ALKIS',
    coverage: COVERAGE_NRW,
    excludeKreisViersen: true,
    sortYear: 9999,
    minZoom: 14,
    attribution: 'Geobasis NRW',
    pdfAttribution: 'Geobasis NRW · Datenlizenz Deutschland – Zero – Version 2.0'
  },
  {
    id: 'wms_nw_abk',
    url: `${WMS_BASE_URL}/wms_nw_abk`,
    label: 'Amtliche Basiskarte NRW',
    shortLabel: 'ABK',
    wmsLayer: 'WMS_NW_ABK',
    selectionDetail: 'Amtliche Basiskarte',
    hoverDetail: 'Amtliche Basiskarte',
    pdfTitle: 'Amtliche Basiskarte NRW',
    pdfSubtitle: 'Amtliche Basiskarte',
    simpleListSubtitle: 'Amtliche Basiskarte',
    coverage: COVERAGE_NRW,
    sortYear: 9998,
    minZoom: 14.5,
    attribution: 'Geobasis NRW',
    pdfAttribution: 'Geobasis NRW · Datenlizenz Deutschland – Zero – Version 2.0'
  },
  {
    id: 'fluren_historisch_kvie',
    url: 'https://geo.kreis-viersen.de/ows/sammeldienst',
    label: 'Historische Fluren Kreis Viersen',
    shortLabel: 'Hist. Fluren',
    wmsLayer: 'fluren_historisch_kvie',
    selectionDetail: 'Urfluren bei der Erstaufstellung des Liegenschaftskatasters',
    hoverDetail: 'Historische Fluren des Urkatasters',
    pdfTitle: 'Historische Fluren Kreis Viersen',
    pdfSubtitle: 'Urfluren bei der Erstaufstellung des Liegenschaftskatasters',
    coverage: COVERAGE_KREIS_VIERSEN,
    minZoom: 12,
    attribution: 'Kreis Viersen',
    pdfAttribution: 'Kreis Viersen · Datenlizenz Deutschland – Zero – Version 2.0'
  },
  {
    id: 'wms_nw_neuaufnahme',
    url: `${WMS_BASE_URL}/wms_nw_neuaufnahme`,
    label: 'Preußische Neuaufnahme',
    shortLabel: 'Neuaufnahme',
    wmsLayer: 'nw_neuaufnahme',
    selectionDetail: 'Preußische Kartenaufnahme 1:25.000 · 1891–1912',
    hoverDetail: 'Preußische Kartenaufnahme 1891–1912',
    pdfTitle: 'Preußische Neuaufnahme',
    pdfSubtitle: 'Preußische Kartenaufnahme 1:25.000 · 1891–1912',
    coverage: COVERAGE_NRW,
    sortYear: 1912,
    minZoom: 10.7,
    attribution: 'Geobasis NRW',
    pdfAttribution: 'Geobasis NRW · Datenlizenz Deutschland – Zero – Version 2.0'
  },
  {
    id: 'wms_nw_tk25_1936-1945',
    url: `${WMS_BASE_URL}/wms_nw_tk25_1936-1945`,
    label: 'TK25 1936–1945',
    shortLabel: 'TK25 1936–1945',
    wmsLayer: 'nw_tk25_1936-1945',
    selectionDetail: 'Topographische Karte 1:25.000 · Fortführungsstände 1936–1945',
    hoverDetail: 'Topographische Karte 1:25.000 · 1936–1945',
    pdfTitle: 'Topographische Karte 1:25.000',
    pdfSubtitle: 'Fortführungsstände 1936–1945',
    coverage: COVERAGE_NRW,
    sortYear: 1945,
    minZoom: 13.5,
    maxZoom: 17.5,
    maxZoomInclusive: true,
    attribution: 'Geobasis NRW',
    pdfAttribution: 'Geobasis NRW · Datenlizenz Deutschland – Zero – Version 2.0'
  },
  {
    id: 'wms_nw_dgk5',
    url: `${WMS_BASE_URL}/wms_nw_dgk5`,
    label: 'Deutsche Grundkarte 1:5.000',
    shortLabel: 'DGK5',
    wmsLayer: 'nw_dgk5_grundriss',
    selectionDetail: 'Letzte Ausgabe je Kartenblatt',
    hoverDetail: 'Letzte Ausgabe je Kartenblatt',
    pdfTitle: 'Deutsche Grundkarte 1:5.000',
    pdfSubtitle: 'Letzte Ausgabe je Kartenblatt',
    coverage: COVERAGE_NRW,
    sortYear: 2016,
    minZoom: 14.5,
    maxZoom: 17,
    attribution: 'Geobasis NRW',
    pdfAttribution: 'Geobasis NRW · Datenlizenz Deutschland – Zero – Version 2.0'
  }
];

function compareSupplementalMapsByYearDescending(a, b) {
  const yearA = Number.isFinite(a.sortYear) ? a.sortYear : Number.NEGATIVE_INFINITY;
  const yearB = Number.isFinite(b.sortYear) ? b.sortYear : Number.NEGATIVE_INFINITY;
  return yearB - yearA || a.label.localeCompare(b.label, 'de');
}

function sortSupplementalMapsByYearDescending(items) {
  return [...items].sort(compareSupplementalMapsByYearDescending);
}

function isSupplementalServiceAvailableAtPoint(service, insideKreisViersen) {
  if (service.coverage === COVERAGE_KREIS_VIERSEN) return insideKreisViersen;
  if (service.coverage === COVERAGE_NRW && service.excludeKreisViersen) return !insideKreisViersen;
  return service.coverage === COVERAGE_NRW;
}

function getWmsLayersParam(layer) {
  if (Array.isArray(layer.wmsLayersTopToBottom) && layer.wmsLayersTopToBottom.length > 0) {
    return [...layer.wmsLayersTopToBottom].reverse().join(',');
  }
  return layer.wmsLayer;
}

function getWmsStylesParam(layer) {
  const layerCount = Array.isArray(layer.wmsLayersTopToBottom)
    ? layer.wmsLayersTopToBottom.length
    : String(layer.wmsLayer ?? '').split(',').filter(Boolean).length;
  return layerCount > 1 ? ','.repeat(layerCount - 1) : '';
}

const hoverCoverageDefinitions = new Map([
  ['aerial-images-nrw', {
    title: 'Luftbilder NRW',
    detail: 'Jahrgänge nach Klick ermitteln'
  }],
  ...supplementalMapServices.map(service => [service.id, {
    title: service.label,
    detail: service.hoverDetail
  }])
]);

function getWmsService(serviceId) {
  return services.find(item => item.id === serviceId)
    ?? supplementalMapServices.find(item => item.id === serviceId);
}

// Permalinks verwenden bewusst kurze Alias-IDs. Die fachlichen/interne Layer-IDs
// bleiben davon unberührt. Historische Luftbilder brauchen nur das Jahr; bei den
// aktuellen DOP/iDOP/vDOP reicht der Dienstname, weil es je Punkt jeweils nur den
// aktuellen Stand wiederherzustellen gilt.
const aerialPermalinkAliases = new Map([
  ['wms_nw_hist_dop', { alias: 'hdop', historical: true }],
  ['wms_nw_hist_idop', { alias: 'hidop', historical: true }],
  ['wms_nw_dop', { alias: 'dop', historical: false }],
  ['wms_nw_idop', { alias: 'idop', historical: false }],
  ['wms_nw_vdop', { alias: 'vdop', historical: false }]
]);

const metadataPermalinkAliases = new Map([
  ['wms_nw_hist_dop', 'mhdop'],
  ['wms_nw_hist_idop', 'mhidop'],
  ['wms_nw_dop', 'mdop'],
  ['wms_nw_idop', 'midop'],
  ['wms_nw_vdop', 'mvdop']
]);

const supplementalPermalinkAliases = new Map([
  ['wms_nw_tranchot', 'tranchot'],
  ['wms_nw_uraufnahme', 'ur'],
  ['flurkarte_nw_viersen', 'flurkv'],
  ['wms_nw_alkis_flurkarte', 'flurnrw'],
  ['wms_nw_abk', 'abk'],
  ['fluren_historisch_kvie', 'histflurkv'],
  ['wms_nw_neuaufnahme', 'neu'],
  ['wms_nw_tk25_1936-1945', 'tk25'],
  ['wms_nw_dgk5', 'dgk']
]);

// Alte 2.2.41-Permalinks bleiben lesbar. Neu erzeugte Links verwenden immer
// die kompakten Alias-IDs oben.
const legacyAerialPermalinkServiceTokens = new Map([
  ['wms_nw_hist_dop', 'hist-dop'],
  ['wms_nw_hist_idop', 'hist-idop'],
  ['wms_nw_dop', 'dop'],
  ['wms_nw_idop', 'idop'],
  ['wms_nw_vdop', 'vdop']
]);

function getAerialPermalinkId(item) {
  const definition = aerialPermalinkAliases.get(item?.serviceId);
  if (!definition) return null;
  if (!definition.historical) return definition.alias;

  const year = String(item?.year ?? item?.date ?? '').slice(0, 4);
  if (!/^\d{4}$/.test(year)) return null;
  return `${definition.alias}-${year}`;
}

function getLegacyAerialPermalinkId(item) {
  const serviceToken = legacyAerialPermalinkServiceTokens.get(item?.serviceId);
  const date = String(item?.date ?? '');
  if (!serviceToken || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  return `aerial-${serviceToken}-${date}`;
}

function getMetadataPermalinkId(serviceId) {
  return metadataPermalinkAliases.get(serviceId) ?? null;
}

function getLegacyMetadataPermalinkId(serviceId) {
  const serviceToken = legacyAerialPermalinkServiceTokens.get(serviceId);
  return serviceToken ? `metadata-${serviceToken}` : null;
}

function getSupplementalPermalinkId(serviceId) {
  return supplementalPermalinkAliases.get(serviceId) ?? null;
}

function getLegacySupplementalPermalinkId(serviceId) {
  const normalized = String(serviceId ?? '')
    .toLowerCase()
    .replace(/_/g, '-')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return normalized ? `map-${normalized}` : null;
}

function getLoadedLayerPermalinkId(layer) {
  if (layer?.metadata) return getMetadataPermalinkId(layer.serviceId) ?? layer.permalinkId ?? null;
  if (layer?.category === 'supplemental-map') {
    return getSupplementalPermalinkId(layer.serviceId) ?? layer.permalinkId ?? null;
  }
  return getAerialPermalinkId(layer) ?? layer?.permalinkId ?? null;
}

function formatPermalinkOpacity(value) {
  const normalized = Math.max(0, Math.min(1, Number(value)));
  return String(Number(normalized.toFixed(2)));
}

function getPermalinkLayerToken(layer) {
  const id = getLoadedLayerPermalinkId(layer);
  if (!id) return null;
  if (!layer.visible) return `${id}_0`;

  const opacity = Number.isFinite(layer.opacity) ? Math.max(0, Math.min(1, layer.opacity)) : 1;
  if (opacity >= 0.999) return id;
  return `${id}_${formatPermalinkOpacity(opacity)}`;
}

const osmStyle = () => ({
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      maxzoom: 19,
      attribution: '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap-Mitwirkende · ODbL</a>'
    }
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }]
});

const state = {
  results: [],
  selectedKeys: new Set(),
  sortOrder: 'desc',
  marker: null,
  selectedPoint: null,
  selectedPointInsideKreisViersen: false,
  loadedLayers: [],
  querySerial: 0,
  exporting: false,
  toastTimer: null,
  nrwBoundaryFeature: null,
  nrwBoundaryBounds: null,
  nrwBoundaryPromise: null,
  nrwBoundaryError: null,
  kreisViersenCoverageFeature: null,
  kreisViersenCoveragePromise: null,
  kreisViersenCoverageError: null,
  availableSupplementalMapIds: new Set(),
  selectedSupplementalMapIds: new Set(),
  availabilityStatusKey: null,
  photonAbortController: null,
  photonLastErrorAt: 0,
  geocoderHighlightMarker: null,
  geocoderHighlightTimer: null,
  geocoderHighlightSerial: 0,
  appMode: APP_MODE_SIMPLE,
  simpleQuerySerial: 0,
  simpleExportLayers: [],
  simpleExporting: false,
  simpleAutoExportActive: false,
  autoPrintStatusTimer: null,
  simpleDialogCamera: null
};

const elements = Object.fromEntries([
  'introCard', 'resultsPanel', 'resultTitle', 'coordinateText', 'closeResultsButton',
  'loadingState', 'loadingDetail', 'emptyState', 'errorState', 'errorText',
  'selectionContent', 'dateList', 'selectAllButton', 'selectNoneButton',
  'invertSelectionButton', 'metadataCheckbox', 'selectionCount', 'addLayersButton',
  'layersPanel', 'layerList', 'removeAllLayersButton', 'toast', 'aboutButton', 'aboutDialog',
  'printFrame', 'includePointPdfCheckbox', 'advancedPdfScaleView', 'advancedPdfScaleRecommended', 'exportPdfButton', 'exportQlrButton', 'copyPermalinkButton', 'exportStatus',
  'availabilityStatus', 'availabilityList', 'aerialSelectionControls',
  'additionalMapsSection', 'additionalMapsList', 'geocoderContainer',
  'simpleModeButton', 'advancedModeButton', 'simpleExportDialog', 'simpleExportTitle',
  'closeSimpleExportButton', 'simpleCoordinateText', 'simpleLoadingState',
  'simpleErrorState', 'simpleErrorText', 'simpleEmptyState', 'simpleExportContent',
  'simpleExportFooter', 'simplePageList', 'simpleIncludePointCheckbox', 'simpleExportButton',
  'simpleExportStatus', 'simpleShareSection', 'simpleShareDialogUrl',
  'simpleShareAutoUrl', 'copySimpleShareDialogButton', 'copySimpleShareAutoButton',
  'autoPrintStatusPanel', 'autoPrintStatusSpinner', 'autoPrintStatusTitle',
  'autoPrintStatusText', 'autoPrintProgress'
].map(id => [id, document.getElementById(id)]));

const map = new maplibregl.Map({
  container: 'map',
  style: osmStyle(),
  center: startupMapView
    ? [startupMapView.lng, startupMapView.lat]
    : startupPermalink
      ? [startupPermalink.point.lng, startupPermalink.point.lat]
      : [7.35, 51.45],
  zoom: startupMapView?.zoom ?? (startupPermalink ? 16 : 7.1),
  minZoom: 0,
  maxZoom: 21,
  hash: true,
  dragRotate: false,
  pitchWithRotate: false,
  touchPitch: false,
  maxPitch: 0,
  attributionControl: false
});

map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
map.addControl(new maplibregl.GeolocateControl({
  positionOptions: { enableHighAccuracy: true },
  trackUserLocation: false,
  showUserHeading: true
}), 'top-right');
map.addControl(new maplibregl.FullscreenControl(), 'top-right');
map.addControl(new maplibregl.ScaleControl({ maxWidth: 120, unit: 'metric' }), 'bottom-left');
map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

const photonGeocoder = new MaplibreGeocoder(createPhotonGeocoderApi(), {
  maplibregl,
  marker: false,
  flyTo: false,
  collapsed: false,
  clearOnBlur: false,
  clearAndBlurOnEsc: true,
  showResultsWhileTyping: true,
  debounceSearch: 350,
  minLength: 3,
  limit: PHOTON_RESULT_LIMIT,
  language: 'de',
  countries: 'de',
  bbox: PHOTON_FALLBACK_NRW_BBOX,
  placeholder: 'Adresse in NRW suchen',
  enableEventLogging: false,
  trackProximity: false,
  showResultMarkers: false,
  popup: false
});
photonGeocoder.addTo(elements.geocoderContainer);
photonGeocoder.on('result', event => zoomToGeocoderResult(event?.result));

map.getCanvas().style.cursor = `url("${locationCursorUrl}") 11 11, crosshair`;
map.on('click', event => handleMapClick(event.lngLat));
map.on('error', event => {
  const message = event?.error?.message ?? '';
  if (message.includes('www.wms.nrw.de')
    || message.includes('gdi-niederrhein-geodienste.de')
    || message.includes('geo.kreis-viersen.de')
    || message.includes('wms_nw_')) {
    showToast('Ein Kartenlayer konnte nicht vollständig geladen werden.');
  }
});

map.on('style.load', () => {
  // Sichtbare NRW-Grenze nach einem Style-Neuladen zuverlässig wiederherstellen.
  if (state.nrwBoundaryFeature) installNrwBoundaryLayer();
});

map.on('load', async () => {
  map.jumpTo({ bearing: 0, pitch: 0 });
  showPrintFrame();
  requestAnimationFrame(updatePrintFrameSize);

  try {
    await ensureNrwBoundaryLoaded();
    installNrwBoundaryLayer();
    photonGeocoder.setBbox(getNrwSearchBbox());
    if (startupMapView) {
      map.jumpTo({
        center: [startupMapView.lng, startupMapView.lat],
        zoom: startupMapView.zoom,
        bearing: 0,
        pitch: 0
      });
    } else if (startupPermalink) {
      map.jumpTo({
        center: [startupPermalink.point.lng, startupPermalink.point.lat],
        zoom: 16,
        bearing: 0,
        pitch: 0
      });
    } else {
      applyInitialNrwView();
    }
  } catch (error) {
    console.error('NRW-Grenze konnte nicht geladen werden:', error);
    showToast('Die NRW-Grenze konnte nicht geladen werden. Die Luftbildabfrage ist derzeit nicht möglich.');
  }

  try {
    await ensureKreisViersenCoverageLoaded();
  } catch (error) {
    console.error('Kreis-Viersen-Abdeckung konnte nicht geladen werden:', error);
    showToast('Die Abdeckung des Kreises Viersen konnte nicht geladen werden.');
  }

  if (startupPermalink) await runStartupPermalinkAction();
  else await runStartupPrintAction();
});
map.on('mousemove', event => updateAvailabilityStatus(event.lngLat));
map.on('zoom', updateZoomLevelUi);
map.getCanvas().addEventListener('mouseleave', resetAvailabilityStatus);
map.on('resize', () => {
  updatePrintFrameSize();
  if (elements.simpleExportDialog.open) positionMapForSimpleDialog({ animate: false });
});
window.addEventListener('resize', () => {
  updatePrintFrameSize();
  if (elements.simpleExportDialog.open) {
    requestAnimationFrame(() => positionMapForSimpleDialog({ animate: false }));
  }
});
applyAppMode(startupPermalink ? APP_MODE_ADVANCED : APP_MODE_SIMPLE);
updateZoomLevelUi();

function createPhotonGeocoderApi() {
  return {
    forwardGeocode: async config => {
      const query = String(config?.query ?? '').trim();
      if (query.length < 3) return { features: [] };

      state.photonAbortController?.abort();
      const controller = new AbortController();
      state.photonAbortController = controller;

      try {
        const nrwBoundary = await ensureNrwBoundaryLoaded();
        const bbox = getNrwSearchBbox();
        const params = new URLSearchParams({
          q: query,
          lang: 'de',
          limit: String(PHOTON_RESULT_LIMIT),
          bbox: bbox.join(','),
          countrycode: 'DE'
        });

        const response = await fetch(`${PHOTON_API_URL}?${params.toString()}`, {
          headers: { Accept: 'application/geo+json,application/json' },
          signal: controller.signal
        });
        if (!response.ok) throw new Error(`Photon: HTTP ${response.status}`);

        const geojson = await response.json();
        const features = (Array.isArray(geojson?.features) ? geojson.features : [])
          .map(toCarmenFeature)
          .filter(Boolean)
          .filter(feature => isCoordinateInsideFeature(feature.center, nrwBoundary))
          .slice(0, PHOTON_RESULT_LIMIT);

        return { features };
      } catch (error) {
        if (error?.name === 'AbortError') return { features: [] };
        console.error('Photon-Adresssuche fehlgeschlagen:', error);
        showPhotonErrorToast();
        return { features: [] };
      } finally {
        if (state.photonAbortController === controller) {
          state.photonAbortController = null;
        }
      }
    }
  };
}

function getNrwSearchBbox() {
  if (!state.nrwBoundaryBounds || state.nrwBoundaryBounds.isEmpty()) {
    return PHOTON_FALLBACK_NRW_BBOX;
  }

  return [
    state.nrwBoundaryBounds.getWest(),
    state.nrwBoundaryBounds.getSouth(),
    state.nrwBoundaryBounds.getEast(),
    state.nrwBoundaryBounds.getNorth()
  ];
}

function normalizePhotonExtent(extent) {
  if (!Array.isArray(extent) || extent.length < 4) return null;
  const values = extent.slice(0, 4).map(Number);
  if (!values.every(Number.isFinite)) return null;

  const [firstLng, firstLat, secondLng, secondLat] = values;
  return [
    Math.min(firstLng, secondLng),
    Math.min(firstLat, secondLat),
    Math.max(firstLng, secondLng),
    Math.max(firstLat, secondLat)
  ];
}

function buildPhotonPlaceName(properties = {}) {
  const compact = value => typeof value === 'string' ? value.trim() : '';
  const uniqueParts = [];
  const append = value => {
    const normalized = compact(value);
    if (normalized && !uniqueParts.includes(normalized)) uniqueParts.push(normalized);
  };

  const street = compact(properties.street);
  const houseNumber = compact(properties.housenumber);
  const streetAddress = [street, houseNumber].filter(Boolean).join(' ');
  const placeName = compact(properties.name);
  const postcode = compact(properties.postcode);
  const city = compact(properties.city || properties.locality || properties.county);
  const locality = [postcode, city].filter(Boolean).join(' ');

  append(placeName || streetAddress || city || properties.district || properties.county);
  if (streetAddress && streetAddress !== placeName) append(streetAddress);
  append(locality);
  if (!city) append(properties.district);
  append(properties.state);

  return uniqueParts.join(', ') || 'Unbenannter Treffer';
}

function toCarmenFeature(feature) {
  const coordinates = feature?.geometry?.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length < 2) return null;
  const center = [Number(coordinates[0]), Number(coordinates[1])];
  if (!center.every(Number.isFinite)) return null;

  const properties = feature.properties ?? {};
  const placeName = buildPhotonPlaceName(properties);
  const mainText = String(properties.name || properties.street || properties.city || placeName).trim();
  const bbox = normalizePhotonExtent(properties.extent ?? feature.bbox);
  const osmType = properties.osm_type ? String(properties.osm_type).toLowerCase() : 'feature';
  const osmId = properties.osm_id ?? `${center[0]}-${center[1]}`;

  return {
    type: 'Feature',
    id: `photon.${osmType}.${osmId}`,
    geometry: { type: 'Point', coordinates: center },
    center,
    ...(bbox ? { bbox } : {}),
    place_name: placeName,
    text: mainText || placeName,
    place_type: [properties.type || properties.osm_value || properties.osm_key || 'place'],
    properties: {
      ...properties,
      photon: true
    }
  };
}

function isCoordinateInsideFeature(coordinates, polygonFeature) {
  if (!Array.isArray(coordinates) || coordinates.length < 2 || !polygonFeature) return false;
  return booleanPointInPolygon({
    type: 'Feature',
    properties: {},
    geometry: { type: 'Point', coordinates }
  }, polygonFeature, { ignoreBoundary: false });
}

function clearGeocoderHighlight() {
  if (state.geocoderHighlightTimer) {
    window.clearTimeout(state.geocoderHighlightTimer);
    state.geocoderHighlightTimer = null;
  }

  state.geocoderHighlightMarker?.remove();
  state.geocoderHighlightMarker = null;
}

function showGeocoderHighlight(center) {
  clearGeocoderHighlight();

  const element = document.createElement('div');
  element.className = 'geocoder-highlight-marker';
  element.setAttribute('aria-hidden', 'true');

  state.geocoderHighlightMarker = new maplibregl.Marker({
    element,
    anchor: 'center'
  })
    .setLngLat(center)
    .addTo(map);

  state.geocoderHighlightTimer = window.setTimeout(() => {
    clearGeocoderHighlight();
  }, 5000);
}

function zoomToGeocoderResult(result) {
  if (!result || !Array.isArray(result.center)) return;

  clearGeocoderHighlight();
  const highlightSerial = ++state.geocoderHighlightSerial;
  map.once('moveend', () => {
    if (highlightSerial !== state.geocoderHighlightSerial) return;
    showGeocoderHighlight(result.center);
  });

  if (Array.isArray(result.bbox) && result.bbox.length >= 4) {
    map.fitBounds([
      [result.bbox[0], result.bbox[1]],
      [result.bbox[2], result.bbox[3]]
    ], {
      padding: 72,
      maxZoom: 18,
      duration: 900
    });
  } else {
    map.flyTo({
      center: result.center,
      zoom: 17,
      duration: 900,
      essential: true
    });
  }

  showToast('Adresse gefunden. Für die Luftbildauswahl anschließend auf die Karte klicken.');
}

function showPhotonErrorToast() {
  const now = Date.now();
  if (now - state.photonLastErrorAt < PHOTON_ERROR_TOAST_INTERVAL_MS) return;
  state.photonLastErrorAt = now;
  showToast('Die Photon-Adresssuche ist derzeit nicht erreichbar.');
}

function createBoundsFromFeature(feature) {
  const bounds = new maplibregl.LngLatBounds();
  let coordinateCount = 0;

  const visitCoordinates = coordinates => {
    if (!Array.isArray(coordinates)) return;

    if (
      coordinates.length >= 2
      && Number.isFinite(coordinates[0])
      && Number.isFinite(coordinates[1])
    ) {
      bounds.extend([coordinates[0], coordinates[1]]);
      coordinateCount += 1;
      return;
    }

    coordinates.forEach(visitCoordinates);
  };

  visitCoordinates(feature?.geometry?.coordinates);

  if (coordinateCount === 0 || bounds.isEmpty()) {
    throw new Error('Aus dem NRW-GeoJSON konnte keine Kartenausdehnung bestimmt werden.');
  }

  return bounds;
}

function getNrwFitPadding() {
  const container = map.getContainer();
  const shortestSide = Math.min(container.clientWidth, container.clientHeight);
  return Math.round(Math.max(
    NRW_FIT_PADDING_MIN_PX,
    Math.min(NRW_FIT_PADDING_MAX_PX, shortestSide * NRW_FIT_PADDING_VIEWPORT_SHARE)
  ));
}

function getNrwFitCamera() {
  if (!state.nrwBoundaryBounds) return null;

  return map.cameraForBounds(state.nrwBoundaryBounds, {
    padding: getNrwFitPadding(),
    maxZoom: 21
  });
}

function applyInitialNrwView() {
  const camera = getNrwFitCamera();
  if (!camera) return;

  // NRW beim Start vollständig mit Padding anzeigen. Danach bleiben Zoom und
  // Verschiebung uneingeschränkt; insbesondere ist weiteres Herauszoomen möglich.
  map.jumpTo({
    center: camera.center,
    zoom: camera.zoom,
    bearing: 0,
    pitch: 0
  });
}

function geodesicDistanceMeters(first, second) {
  const toRadians = value => value * Math.PI / 180;
  const latitude1 = toRadians(first.lat);
  const latitude2 = toRadians(second.lat);
  const deltaLatitude = latitude2 - latitude1;
  let deltaLongitude = toRadians(second.lng - first.lng);
  deltaLongitude = ((deltaLongitude + Math.PI) % (2 * Math.PI)) - Math.PI;

  const haversine = Math.sin(deltaLatitude / 2) ** 2
    + Math.cos(latitude1) * Math.cos(latitude2) * Math.sin(deltaLongitude / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(haversine)));
}

async function ensureNrwBoundaryLoaded() {
  if (state.nrwBoundaryFeature) return state.nrwBoundaryFeature;
  if (state.nrwBoundaryError) throw state.nrwBoundaryError;

  if (!state.nrwBoundaryPromise) {
    state.nrwBoundaryPromise = fetch(NRW_BOUNDARY_ASSET_URL, {
      headers: { Accept: 'application/geo+json,application/json' }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status} beim Laden von ${NRW_BOUNDARY_ASSET_URL}`);
        }
        return response.json();
      })
      .then(geojson => {
        const feature = geojson?.type === 'FeatureCollection'
          ? geojson.features?.find(item => ['Polygon', 'MultiPolygon'].includes(item?.geometry?.type))
          : geojson?.type === 'Feature'
            ? geojson
            : null;

        if (!feature || !['Polygon', 'MultiPolygon'].includes(feature.geometry?.type)) {
          throw new Error('Das NRW-Asset enthält keine Polygon- oder MultiPolygon-Fläche.');
        }

        state.nrwBoundaryFeature = feature;
        state.nrwBoundaryBounds = createBoundsFromFeature(feature);
        return feature;
      })
      .catch(error => {
        state.nrwBoundaryError = error;
        throw error;
      });
  }

  return state.nrwBoundaryPromise;
}

async function ensureKreisViersenCoverageLoaded() {
  if (state.kreisViersenCoverageFeature) return state.kreisViersenCoverageFeature;
  if (state.kreisViersenCoverageError) throw state.kreisViersenCoverageError;

  if (!state.kreisViersenCoveragePromise) {
    state.kreisViersenCoveragePromise = fetch(KREIS_VIERSEN_COVERAGE_ASSET_URL, {
      headers: { Accept: 'application/geo+json,application/json' }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status} beim Laden von ${KREIS_VIERSEN_COVERAGE_ASSET_URL}`);
        }
        return response.json();
      })
      .then(geojson => {
        const feature = geojson?.type === 'FeatureCollection'
          ? geojson.features?.find(item => ['Polygon', 'MultiPolygon'].includes(item?.geometry?.type))
          : geojson?.type === 'Feature'
            ? geojson
            : null;

        if (!feature || !['Polygon', 'MultiPolygon'].includes(feature.geometry?.type)) {
          throw new Error('Das Kreis-Viersen-Coverage-Asset enthält keine Polygon- oder MultiPolygon-Fläche.');
        }

        state.kreisViersenCoverageFeature = feature;
        return feature;
      })
      .catch(error => {
        state.kreisViersenCoverageError = error;
        throw error;
      });
  }

  return state.kreisViersenCoveragePromise;
}

function isPointInsideCoverage(lngLat, feature) {
  if (!lngLat || !feature) return false;

  const point = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Point',
      coordinates: [lngLat.lng, lngLat.lat]
    }
  };

  return booleanPointInPolygon(point, feature, { ignoreBoundary: false });
}

function updateAvailabilityStatus(lngLat) {
  if (state.appMode !== APP_MODE_ADVANCED) return;
  if (!lngLat || !elements.availabilityList) return;

  const availableServices = [];
  let loadedCoverageCount = 0;
  let insideNrw = false;
  let insideKreisViersen = false;

  // Kreisabdeckung zuerst auswerten, damit NRW-Angebote mit explizitem
  // Kreis-Viersen-Ausschluss (Flurkarte NRW) dort nicht kurzzeitig erscheinen.
  if (state.kreisViersenCoverageFeature) {
    loadedCoverageCount += 1;
    insideKreisViersen = isPointInsideCoverage(lngLat, state.kreisViersenCoverageFeature);
  }

  if (state.nrwBoundaryFeature) {
    loadedCoverageCount += 1;
    insideNrw = isPointInsideCoverage(lngLat, state.nrwBoundaryFeature);
    if (insideNrw) {
      availableServices.push(hoverCoverageDefinitions.get('aerial-images-nrw'));

      // Im Kreis Viersen steht die lokale Flurkarte – analog zur PDF-Reihenfolge –
      // unmittelbar hinter den Luftbildern. Die übrigen Angebote behalten ihre
      // bisherige Sortierung.
      if (insideKreisViersen) {
        availableServices.push(hoverCoverageDefinitions.get('flurkarte_nw_viersen'));
      }

      for (const service of sortSupplementalMapsByYearDescending(supplementalMapServices)) {
        if (service.coverage === COVERAGE_NRW && isSupplementalServiceAvailableAtPoint(service, insideKreisViersen)) {
          availableServices.push(hoverCoverageDefinitions.get(service.id));
        }
      }
    }
  }

  if (insideKreisViersen) {
    for (const service of sortSupplementalMapsByYearDescending(supplementalMapServices)) {
      if (service.coverage === COVERAGE_KREIS_VIERSEN && service.id !== 'flurkarte_nw_viersen') {
        availableServices.push(hoverCoverageDefinitions.get(service.id));
      }
    }
  }

  if (loadedCoverageCount === 0) {
    renderAvailabilityStatus([], 'Abdeckungen werden geladen …');
    return;
  }

  renderAvailabilityStatus(availableServices.filter(Boolean));
}

function renderAvailabilityStatus(services, fallbackText = 'Keine eingebundenen Angebote verfügbar') {
  if (!elements.availabilityList) return;

  const statusKey = services.length > 0
    ? services.map(service => `${service.title}|${service.detail}`).join('||')
    : `empty:${fallbackText}`;

  if (state.availabilityStatusKey === statusKey) return;
  state.availabilityStatusKey = statusKey;

  if (services.length === 0) {
    const item = document.createElement('li');
    item.className = 'availability-empty';
    item.textContent = fallbackText;
    elements.availabilityList.replaceChildren(item);
    return;
  }

  elements.availabilityList.replaceChildren(...services.map(service => {
    const item = document.createElement('li');
    const marker = document.createElement('span');
    marker.className = 'availability-marker';
    marker.textContent = '✓';
    marker.setAttribute('aria-hidden', 'true');

    const text = document.createElement('span');
    const title = document.createElement('strong');
    title.textContent = service.title;
    const detail = document.createElement('small');
    detail.textContent = service.detail;
    text.append(title, detail);
    item.append(marker, text);
    return item;
  }));
}

function resetAvailabilityStatus() {
  if (state.appMode !== APP_MODE_ADVANCED) return;
  renderAvailabilityStatus([], 'Maus über die Karte bewegen');
}

function installNrwBoundaryLayer() {
  if (!state.nrwBoundaryFeature || !map.isStyleLoaded()) return;

  if (!map.getSource(NRW_BOUNDARY_SOURCE_ID)) {
    map.addSource(NRW_BOUNDARY_SOURCE_ID, {
      type: 'geojson',
      data: state.nrwBoundaryFeature
    });
  }

  if (!map.getLayer(NRW_BOUNDARY_CASING_LAYER_ID)) {
    map.addLayer({
      id: NRW_BOUNDARY_CASING_LAYER_ID,
      type: 'line',
      source: NRW_BOUNDARY_SOURCE_ID,
      layout: {
        'line-cap': 'round',
        'line-join': 'round'
      },
      paint: {
        'line-color': '#3b1028',
        'line-opacity': 0.9,
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          4, 4.2,
          8, 5.8,
          13, 7.8
        ]
      }
    });
  }

  if (!map.getLayer(NRW_BOUNDARY_LINE_LAYER_ID)) {
    map.addLayer({
      id: NRW_BOUNDARY_LINE_LAYER_ID,
      type: 'line',
      source: NRW_BOUNDARY_SOURCE_ID,
      layout: {
        'line-cap': 'round',
        'line-join': 'round'
      },
      paint: {
        'line-color': '#d81b60',
        'line-opacity': 1,
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          4, 2.2,
          8, 3.2,
          13, 4.6
        ]
      }
    });
  }

  // Beide Grenzlayer immer oberhalb der dynamischen Luftbildlayer halten.
  if (map.getLayer(NRW_BOUNDARY_CASING_LAYER_ID)) {
    map.moveLayer(NRW_BOUNDARY_CASING_LAYER_ID);
  }
  if (map.getLayer(NRW_BOUNDARY_LINE_LAYER_ID)) {
    map.moveLayer(NRW_BOUNDARY_LINE_LAYER_ID);
  }
}


function findAerialResultForPermalinkId(permalinkId) {
  return state.results.find(result => (
    getAerialPermalinkId(result) === permalinkId
    || getLegacyAerialPermalinkId(result) === permalinkId
  )) ?? null;
}

function getServiceForMetadataPermalinkId(permalinkId) {
  return services.find(service => (
    getMetadataPermalinkId(service.id) === permalinkId
    || getLegacyMetadataPermalinkId(service.id) === permalinkId
  )) ?? null;
}

function getSupplementalServiceForPermalinkId(permalinkId) {
  return supplementalMapServices.find(service => (
    getSupplementalPermalinkId(service.id) === permalinkId
    || getLegacySupplementalPermalinkId(service.id) === permalinkId
  )) ?? null;
}

function buildPermalinkLayerConfig(item, batchId, index) {
  const common = {
    id: `permalink-${batchId}-${index}`,
    permalinkId: item.id,
    visible: item.visible,
    opacity: item.opacity
  };

  const result = findAerialResultForPermalinkId(item.id);
  if (result) {
    return {
      ...common,
      title: `${formatDate(result.date)} · ${result.serviceShortLabel}`,
      subtitle: result.imageLayer,
      date: result.date,
      year: result.year,
      serviceShortLabel: result.serviceShortLabel,
      serviceId: result.serviceId,
      wmsLayer: result.imageLayer,
      metadata: false,
      resultKey: result.key
    };
  }

  const metadataService = getServiceForMetadataPermalinkId(item.id);
  if (metadataService) {
    return {
      ...common,
      title: `Luftbild-Metadaten · ${metadataService.shortLabel}`,
      subtitle: metadataService.infoLayer,
      serviceShortLabel: metadataService.shortLabel,
      serviceId: metadataService.id,
      wmsLayer: metadataService.infoLayer,
      metadata: true
    };
  }

  const supplementalService = getSupplementalServiceForPermalinkId(item.id);
  if (supplementalService) {
    if (!state.availableSupplementalMapIds.has(supplementalService.id)) return null;
    return {
      ...common,
      title: supplementalService.label,
      subtitle: supplementalService.selectionDetail,
      pdfTitle: supplementalService.pdfTitle ?? supplementalService.label,
      pdfSubtitle: supplementalService.pdfSubtitle ?? supplementalService.selectionDetail,
      pdfAttribution: supplementalService.pdfAttribution,
      serviceShortLabel: supplementalService.shortLabel,
      serviceId: supplementalService.id,
      wmsLayer: supplementalService.wmsLayer,
      wmsLayersTopToBottom: supplementalService.wmsLayersTopToBottom,
      category: 'supplemental-map',
      metadata: false,
      minZoom: supplementalService.minZoom,
      maxZoom: supplementalService.maxZoom,
      maxZoomInclusive: supplementalService.maxZoomInclusive === true
    };
  }

  return null;
}

function restorePermalinkLayers(permalink) {
  if (!permalink?.hasLayerList) return;

  clearLoadedLayers();
  const batchId = `link-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const seenIds = new Set();
  const selectedAerialKeys = new Set();
  const selectedSupplementalIds = new Set();
  let hasMetadata = false;
  let missingCount = 0;

  permalink.layers.forEach((item, index) => {
    if (seenIds.has(item.id)) return;
    seenIds.add(item.id);
    const config = buildPermalinkLayerConfig(item, batchId, index);
    if (!config) {
      missingCount += 1;
      return;
    }
    addWmsLayer(config, { preserveOrder: true });
    if (config.resultKey) selectedAerialKeys.add(config.resultKey);
    if (config.category === 'supplemental-map') selectedSupplementalIds.add(config.serviceId);
    if (config.metadata) hasMetadata = true;
  });

  state.selectedKeys = selectedAerialKeys;
  state.selectedSupplementalMapIds = selectedSupplementalIds;
  elements.metadataCheckbox.checked = hasMetadata;
  syncMapLayerOrder();
  renderResults();
  renderLayerList();

  if (state.loadedLayers.length > 0) {
    elements.resultsPanel.hidden = true;
    elements.layersPanel.hidden = false;
    elements.introCard.hidden = true;
  }

  if (missingCount > 0) {
    showToast(`${missingCount} ${missingCount === 1 ? 'gespeichertes Thema ist' : 'gespeicherte Themen sind'} nicht mehr verfügbar.`);
  } else if (state.loadedLayers.length > 0) {
    showToast('Permalink wurde geladen.');
  }
}

async function runStartupPermalinkAction() {
  if (!startupPermalink) return;
  applyAppMode(APP_MODE_ADVANCED);
  await queryAtPositionAdvanced(startupPermalink.point);
  if (state.appMode !== APP_MODE_ADVANCED || !state.selectedPoint) return;
  restorePermalinkLayers(startupPermalink);
}

async function runStartupPrintAction() {
  if (!startupPrintAction) return;
  if (!startupMapView) {
    showToast('Für den URL-Druck ist eine Position im Karten-Hash erforderlich.');
    return;
  }

  applyAppMode(APP_MODE_SIMPLE);
  const lngLat = { lng: startupMapView.lng, lat: startupMapView.lat };
  await queryAtPositionSimple(lngLat, {
    showDialog: startupPrintAction === STARTUP_PRINT_DIALOG,
    autoExport: startupPrintAction === STARTUP_PRINT_AUTO
  });
}

function handleMapClick(lngLat) {
  if (state.simpleAutoExportActive || state.simpleExporting) {
    showToast('Die PDF-Erstellung läuft bereits.');
    return;
  }
  if (state.appMode === APP_MODE_SIMPLE) {
    queryAtPositionSimple(lngLat);
    return;
  }
  queryAtPositionAdvanced(lngLat);
}

function applyLoadedLayerVisibilityForMode() {
  const advancedMode = state.appMode === APP_MODE_ADVANCED;
  for (const layer of state.loadedLayers) {
    if (!map.getLayer(layer.layerId)) continue;
    const visible = advancedMode && layer.visible;
    map.setLayoutProperty(layer.layerId, 'visibility', visible ? 'visible' : 'none');
  }
}

function applyAppMode(mode) {
  const normalizedMode = mode === APP_MODE_ADVANCED ? APP_MODE_ADVANCED : APP_MODE_SIMPLE;
  state.appMode = normalizedMode;
  const simpleMode = normalizedMode === APP_MODE_SIMPLE;

  document.body.dataset.appMode = normalizedMode;
  elements.simpleModeButton.setAttribute('aria-pressed', String(simpleMode));
  elements.advancedModeButton.setAttribute('aria-pressed', String(!simpleMode));

  // Die Adresssuche steht in beiden Modi zur Verfügung.
  elements.geocoderContainer.hidden = false;
  elements.availabilityStatus.hidden = simpleMode;
  elements.resultsPanel.hidden = true;
  elements.layersPanel.hidden = simpleMode || state.loadedLayers.length === 0;

  const introStrong = elements.introCard.querySelector('strong');
  const introText = elements.introCard.querySelector('span');
  if (simpleMode) {
    state.querySerial += 1;
    introStrong.textContent = 'PDF erstellen';
    introText.textContent = 'Adresse suchen oder Karte verschieben/zoomen. Anschließend innerhalb der NRW-Grenze auf den gewünschten Punkt klicken und die automatisch ermittelten Seiten bestätigen.';
    elements.printFrame.hidden = true;
    elements.printFrame.setAttribute('aria-hidden', 'true');
  } else {
    introStrong.textContent = 'Position auswählen';
    introText.textContent = 'Klicken Sie innerhalb der dargestellten NRW-Landesgrenze auf die Karte.';
    showPrintFrame();
    resetAvailabilityStatus();
  }
  elements.introCard.hidden = false;

  if (!simpleMode && elements.simpleExportDialog.open) {
    elements.simpleExportDialog.close();
  }

  applyLoadedLayerVisibilityForMode();
  requestAnimationFrame(() => {
    map.resize();
    updatePrintFrameSize();
  });
}

function getSimpleScaleForSupplementalService(service) {
  if (service.id === 'flurkarte_nw_viersen') return SIMPLE_SCALE_AERIAL_AND_PARCEL;
  if (service.id === 'wms_nw_alkis_flurkarte') return SIMPLE_SCALE_ALKIS_PARCEL;
  if (service.id === 'wms_nw_abk') return SIMPLE_SCALE_ABK;
  if (service.id === 'wms_nw_dgk5') return SIMPLE_SCALE_BASE_MAP;
  return SIMPLE_SCALE_HISTORICAL;
}

function getRecommendedScaleForPdfLayer(layer) {
  if (layer.category !== 'supplemental-map') return null;
  const service = getWmsService(layer.serviceId);
  if (!service) return null;
  return getSimpleScaleForSupplementalService(service);
}

function formatScaleDenominator(scaleDenominator) {
  return `ca. 1 : ${Math.round(scaleDenominator).toLocaleString('de-DE')}`;
}


function captureMapCamera() {
  const center = map.getCenter();
  const padding = map.getPadding();
  return {
    center: [center.lng, center.lat],
    zoom: map.getZoom(),
    bearing: map.getBearing(),
    pitch: map.getPitch(),
    padding: {
      top: padding.top,
      right: padding.right,
      bottom: padding.bottom,
      left: padding.left
    }
  };
}

function getSimpleDialogMapPadding() {
  const dialogRect = elements.simpleExportDialog.getBoundingClientRect();
  const mapRect = map.getContainer().getBoundingClientRect();
  const mobileLayout = window.innerWidth <= SIMPLE_DIALOG_MOBILE_BREAKPOINT_PX;

  if (mobileLayout) {
    return {
      top: 0,
      right: 0,
      bottom: Math.min(
        Math.max(0, mapRect.height - 40),
        Math.ceil(dialogRect.height + SIMPLE_DIALOG_MAP_GAP_PX)
      ),
      left: 0
    };
  }

  return {
    top: 0,
    right: Math.min(
      Math.max(0, mapRect.width - 80),
      Math.ceil(dialogRect.width + SIMPLE_DIALOG_MAP_GAP_PX)
    ),
    bottom: 0,
    left: 0
  };
}

function positionMapForSimpleDialog({ animate = true } = {}) {
  if (!elements.simpleExportDialog.open || !state.selectedPoint) return;

  const padding = getSimpleDialogMapPadding();
  map.easeTo({
    center: [state.selectedPoint.lng, state.selectedPoint.lat],
    padding,
    duration: animate ? 320 : 0,
    essential: true
  });
}

function restoreMapAfterSimpleDialog({ animate = true } = {}) {
  const camera = state.simpleDialogCamera;
  state.simpleDialogCamera = null;
  if (!camera) return;

  map.easeTo({
    center: camera.center,
    zoom: camera.zoom,
    bearing: camera.bearing,
    pitch: camera.pitch,
    padding: camera.padding,
    duration: animate ? 280 : 0,
    essential: true
  });
}

function getWebAppUrl() {
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = '';
  return url.toString();
}

function buildPrintShareUrl(printAction, lngLat = state.selectedPoint) {
  if (!lngLat) return '';
  const url = new URL(window.location.href);
  url.search = '';
  url.searchParams.set(STARTUP_PRINT_PARAM, printAction);
  const zoom = Math.min(24, Math.max(0, map.getZoom()));
  url.hash = `${zoom.toFixed(2)}/${Number(lngLat.lat).toFixed(5)}/${Number(lngLat.lng).toFixed(5)}`;
  return url.toString();
}

function updateSimpleShareLinks(lngLat = state.selectedPoint) {
  elements.simpleShareDialogUrl.value = buildPrintShareUrl(STARTUP_PRINT_DIALOG, lngLat);
  elements.simpleShareAutoUrl.value = buildPrintShareUrl(STARTUP_PRINT_AUTO, lngLat);
}

function buildAdvancedPermalinkUrl() {
  if (state.appMode !== APP_MODE_ADVANCED || !state.selectedPoint) return '';

  const layerTokens = state.loadedLayers.map(getPermalinkLayerToken).filter(Boolean);
  const center = map.getCenter();
  const zoom = Math.min(24, Math.max(0, map.getZoom()));
  const pointValue = `${Number(state.selectedPoint.lng).toFixed(6)},${Number(state.selectedPoint.lat).toFixed(6)}`;
  const queryParts = [
    `${PERMALINK_POINT_PARAM}=${pointValue}`,
    `${PERMALINK_LAYERS_PARAM}=${layerTokens.join(',')}`
  ];
  const url = new URL(window.location.href);
  url.search = `?${queryParts.join('&')}`;
  url.hash = `${zoom.toFixed(2)}/${Number(center.lat).toFixed(5)}/${Number(center.lng).toFixed(5)}`;
  return url.toString();
}

async function copyTextToClipboard(value) {
  if (!value) return false;
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch (error) {
      console.warn('Text konnte nicht über die Clipboard-API kopiert werden:', error);
    }
  }

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.append(textarea);
  textarea.select();
  let copied = false;
  try {
    copied = document.execCommand('copy');
  } finally {
    textarea.remove();
  }
  return copied;
}

async function handleCopyPermalinkClick() {
  const permalink = buildAdvancedPermalinkUrl();
  if (!permalink) return;
  const copied = await copyTextToClipboard(permalink);
  if (copied) {
    const originalText = elements.copyPermalinkButton.textContent;
    elements.copyPermalinkButton.textContent = 'Permalink kopiert';
    showToast('Permalink wurde kopiert.');
    setTimeout(() => { elements.copyPermalinkButton.textContent = originalText; }, 1600);
  } else {
    showToast('Permalink konnte nicht automatisch kopiert werden.');
  }
}

async function copyShareLink(input, button) {
  const value = input.value;
  if (!value) return;
  let copied = false;

  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(value);
      copied = true;
    } catch (error) {
      console.warn('Link konnte nicht über die Clipboard-API kopiert werden:', error);
    }
  }

  if (!copied) {
    input.focus();
    input.select();
    copied = document.execCommand('copy');
  }

  if (copied) {
    const originalText = button.textContent;
    button.textContent = 'Kopiert';
    showToast('Link wurde kopiert.');
    setTimeout(() => { button.textContent = originalText; }, 1600);
  } else {
    input.focus();
    input.select();
    showToast('Bitte den markierten Link manuell kopieren.');
  }
}

function setAutoPrintStatus({ title, text, current = 0, total = 0, stateClass = '' }) {
  clearTimeout(state.autoPrintStatusTimer);
  elements.autoPrintStatusPanel.hidden = false;
  elements.autoPrintStatusPanel.classList.remove('is-complete', 'is-error');
  if (stateClass) elements.autoPrintStatusPanel.classList.add(stateClass);
  elements.autoPrintStatusTitle.textContent = title;
  elements.autoPrintStatusText.textContent = text;
  const hasProgress = Number.isFinite(total) && total > 0;
  elements.autoPrintProgress.hidden = !hasProgress;
  if (hasProgress) {
    elements.autoPrintProgress.max = total;
    elements.autoPrintProgress.value = Math.max(0, Math.min(total, current));
  }
}

function hideAutoPrintStatus(delay = 0) {
  clearTimeout(state.autoPrintStatusTimer);
  state.autoPrintStatusTimer = setTimeout(() => {
    elements.autoPrintStatusPanel.hidden = true;
    elements.autoPrintStatusPanel.classList.remove('is-complete', 'is-error');
  }, delay);
}

function buildSimpleExportLayers(results, supplementalServices) {
  const sortedAerialResults = [...results].sort((a, b) => (
    b.date.localeCompare(a.date)
    || a.serviceLabel.localeCompare(b.serviceLabel, 'de')
  ));
  const addedImageKeys = new Set();
  const aerialLayers = [];

  for (const result of sortedAerialResults) {
    const imageKey = `${result.serviceId}|${result.imageLayer}`;
    if (addedImageKeys.has(imageKey)) continue;
    addedImageKeys.add(imageKey);
    aerialLayers.push({
      id: `simple-aerial-${aerialLayers.length}`,
      title: `${formatDate(result.date)} · ${result.serviceShortLabel}`,
      subtitle: result.imageLayer,
      date: result.date,
      year: result.year,
      serviceShortLabel: result.serviceShortLabel,
      serviceId: result.serviceId,
      wmsLayer: result.imageLayer,
      category: 'aerial-image',
      metadata: false,
      targetScale: SIMPLE_SCALE_AERIAL_AND_PARCEL
    });
  }

  const supplementalLayers = sortSupplementalMapsByYearDescending(supplementalServices).map(service => ({
    id: `simple-supplemental-${service.id}`,
    title: service.label,
    subtitle: service.selectionDetail,
    pdfTitle: service.pdfTitle ?? service.label,
    pdfSubtitle: service.pdfSubtitle ?? service.selectionDetail,
    simpleListSubtitle: service.simpleListSubtitle ?? service.pdfSubtitle ?? service.selectionDetail,
    pdfAttribution: service.pdfAttribution,
    serviceShortLabel: service.shortLabel,
    serviceId: service.id,
    wmsLayer: service.wmsLayer,
    wmsLayersTopToBottom: service.wmsLayersTopToBottom,
    category: 'supplemental-map',
    metadata: false,
    targetScale: getSimpleScaleForSupplementalService(service)
  }));

  return [...aerialLayers, ...supplementalLayers];
}

function openSimpleLoadingDialog(east, north, { showDialog = true } = {}) {
  elements.simpleCoordinateText.textContent = `ETRS89 / UTM 32N: ${Math.round(east)} E · ${Math.round(north)} N`;
  updateSimpleShareLinks();
  elements.simpleLoadingState.hidden = false;
  elements.simpleErrorState.hidden = true;
  elements.simpleEmptyState.hidden = true;
  elements.simpleExportContent.hidden = true;
  elements.simpleExportFooter.hidden = true;
  elements.simpleExportStatus.textContent = '';
  elements.simplePageList.replaceChildren();
  elements.simpleExportButton.disabled = true;
  elements.simpleExportButton.textContent = 'PDF erstellen';
  if (showDialog && !elements.simpleExportDialog.open) {
    state.simpleDialogCamera = captureMapCamera();
    elements.simpleExportDialog.showModal();
    elements.simpleExportTitle.focus({ preventScroll: true });
    requestAnimationFrame(() => positionMapForSimpleDialog());
  }
}

function renderSimplePageList(layers) {
  const frontMatterPages = [
    {
      title: 'Übersicht und Auswahlpunkt',
      detail: ''
    },
    {
      title: 'Inhaltsverzeichnis',
      detail: ''
    },
    {
      title: 'OpenStreetMap',
      detail: 'ca. 1 : 1.000'
    }
  ];
  const pageEntries = [
    ...frontMatterPages,
    ...layers.map(layer => ({
      title: layer.title,
      detail: [
        layer.category === 'supplemental-map' ? layer.simpleListSubtitle ?? layer.pdfSubtitle ?? layer.subtitle : 'Luftbild',
        formatScaleDenominator(layer.targetScale)
      ].filter(Boolean).join(' · ')
    })),
    ...getPdfAppendixDefinitions().map(page => ({
      title: page.title,
      detail: page.subtitle ?? ''
    }))
  ];

  elements.simplePageList.replaceChildren(...pageEntries.map((page, index) => {
    const item = document.createElement('li');
    const number = document.createElement('span');
    number.className = 'simple-page-number';
    number.textContent = String(index + 1);

    const text = document.createElement('span');
    const title = document.createElement('strong');
    title.textContent = page.title;
    text.append(title);
    if (page.detail) {
      const detail = document.createElement('small');
      detail.textContent = page.detail;
      text.append(detail);
    }
    item.append(number, text);
    return item;
  }));
}

async function queryAtPositionSimple(lngLat, { showDialog = true, autoExport = false } = {}) {
  state.simpleAutoExportActive = autoExport;
  if (autoExport) {
    elements.simpleModeButton.disabled = true;
    elements.advancedModeButton.disabled = true;
    setAutoPrintStatus({
      title: 'PDF wird vorbereitet',
      text: 'Position und verfügbare Inhalte werden geprüft.'
    });
  }

  let nrwBoundary;
  try {
    nrwBoundary = await ensureNrwBoundaryLoaded();
    installNrwBoundaryLayer();
  } catch (error) {
    console.error(error);
    showToast('Die NRW-Grenze ist nicht verfügbar. Die PDF-Abfrage wurde nicht gestartet.');
    if (autoExport) {
      setAutoPrintStatus({
        title: 'PDF konnte nicht vorbereitet werden',
        text: 'Die NRW-Grenze ist nicht verfügbar.',
        stateClass: 'is-error'
      });
      hideAutoPrintStatus(7000);
      state.simpleAutoExportActive = false;
      elements.simpleModeButton.disabled = false;
      elements.advancedModeButton.disabled = false;
    }
    return;
  }

  const clickPoint = {
    type: 'Feature',
    properties: {},
    geometry: { type: 'Point', coordinates: [lngLat.lng, lngLat.lat] }
  };
  if (!booleanPointInPolygon(clickPoint, nrwBoundary, { ignoreBoundary: false })) {
    showToast('Bitte eine Position innerhalb Nordrhein-Westfalens auswählen.');
    if (autoExport) {
      setAutoPrintStatus({
        title: 'Kein PDF-Export',
        text: 'Der URL-Punkt liegt außerhalb Nordrhein-Westfalens.',
        stateClass: 'is-error'
      });
      hideAutoPrintStatus(7000);
      state.simpleAutoExportActive = false;
      elements.simpleModeButton.disabled = false;
      elements.advancedModeButton.disabled = false;
    }
    return;
  }

  let insideKreisViersen = false;
  try {
    const coverage = await ensureKreisViersenCoverageLoaded();
    insideKreisViersen = isPointInsideCoverage(lngLat, coverage);
  } catch (error) {
    console.error('Kreis-Viersen-Abdeckung konnte bei der einfachen PDF-Abfrage nicht geprüft werden:', error);
  }
  state.selectedPointInsideKreisViersen = insideKreisViersen;

  const supplementalServicesAtPoint = supplementalMapServices.filter(service => (
    isSupplementalServiceAvailableAtPoint(service, insideKreisViersen)
  ));
  const serial = ++state.simpleQuerySerial;
  const [east, north] = proj4('EPSG:4326', 'EPSG:25832', [lngLat.lng, lngLat.lat]);
  setMarker(lngLat);
  state.simpleExportLayers = [];
  openSimpleLoadingDialog(east, north, { showDialog });
  if (autoExport) {
    setAutoPrintStatus({
      title: 'Inhalte werden ermittelt',
      text: 'Die fünf Luftbilddienste werden parallel abgefragt.'
    });
  }

  const settled = await Promise.allSettled(
    services.map(service => queryService(service, east, north))
  );
  if (serial !== state.simpleQuerySerial || state.appMode !== APP_MODE_SIMPLE) {
    if (autoExport) {
      state.simpleAutoExportActive = false;
      elements.simpleModeButton.disabled = false;
      elements.advancedModeButton.disabled = false;
      hideAutoPrintStatus();
    }
    return;
  }

  const results = settled.flatMap(item => item.status === 'fulfilled' ? item.value : []);
  const failures = settled.filter(item => item.status === 'rejected');
  const unique = new Map();
  for (const result of results) unique.set(result.key, result);
  const aerialResults = preferCurrentDopForSameDate([...unique.values()]);
  state.simpleExportLayers = buildSimpleExportLayers(aerialResults, supplementalServicesAtPoint);

  elements.simpleLoadingState.hidden = true;
  elements.simpleEmptyState.hidden = state.simpleExportLayers.length > 0;
  elements.simpleExportContent.hidden = state.simpleExportLayers.length === 0;
  elements.simpleExportFooter.hidden = state.simpleExportLayers.length === 0;
  elements.simpleErrorState.hidden = failures.length === 0;

  if (failures.length === services.length) {
    elements.simpleErrorText.textContent = supplementalServicesAtPoint.length > 0
      ? 'Keiner der fünf Luftbilddienste konnte ausgewertet werden. Die verfügbaren Kartenwerke können dennoch exportiert werden.'
      : 'Keiner der fünf Luftbilddienste konnte ausgewertet werden.';
  } else if (failures.length > 0) {
    elements.simpleErrorText.textContent = `${failures.length} von ${services.length} Luftbilddiensten konnten nicht ausgewertet werden. Die übrigen Inhalte werden angeboten.`;
  }

  renderSimplePageList(state.simpleExportLayers);
  elements.simpleExportButton.disabled = state.simpleExportLayers.length === 0;
  elements.simpleExportButton.textContent = state.simpleExportLayers.length > 0
    ? `PDF erstellen (${formatPdfDocumentPageLabel(state.simpleExportLayers.length)})`
    : 'PDF erstellen';

  if (autoExport) {
    if (state.simpleExportLayers.length === 0) {
      setAutoPrintStatus({
        title: 'Keine PDF erstellt',
        text: 'Am URL-Punkt wurden keine exportierbaren Inhalte gefunden.',
        stateClass: 'is-error'
      });
      hideAutoPrintStatus(7000);
      state.simpleAutoExportActive = false;
      elements.simpleModeButton.disabled = false;
      elements.advancedModeButton.disabled = false;
      return;
    }
    elements.simpleIncludePointCheckbox.checked = true;
    setAutoPrintStatus({
      title: 'PDF wird erstellt',
      text: `PDF mit ${formatPdfDocumentPageLabel(state.simpleExportLayers.length)} wird vorbereitet.`,
      current: 0,
      total: getPdfDocumentPageCount(state.simpleExportLayers.length)
    });
    await exportSimpleLayersToPdf({ isAuto: true });
  }
}

async function queryAtPositionAdvanced(lngLat) {
  let nrwBoundary;
  try {
    nrwBoundary = await ensureNrwBoundaryLoaded();
    installNrwBoundaryLayer();
  } catch (error) {
    console.error(error);
    showToast('Die NRW-Grenze ist nicht verfügbar. Die Luftbildabfrage wurde nicht gestartet.');
    return;
  }

  const clickPoint = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Point',
      coordinates: [lngLat.lng, lngLat.lat]
    }
  };

  if (!booleanPointInPolygon(clickPoint, nrwBoundary, { ignoreBoundary: false })) {
    showToast('Bitte eine Position innerhalb Nordrhein-Westfalens auswählen.');
    return;
  }

  let insideKreisViersen = false;
  try {
    const coverage = await ensureKreisViersenCoverageLoaded();
    insideKreisViersen = isPointInsideCoverage(lngLat, coverage);
  } catch (error) {
    console.error('Kreis-Viersen-Abdeckung konnte bei der Punktauswahl nicht geprüft werden:', error);
  }
  state.selectedPointInsideKreisViersen = insideKreisViersen;

  const availableSupplementalServices = supplementalMapServices.filter(service => (
    isSupplementalServiceAvailableAtPoint(service, insideKreisViersen)
  ));
  state.availableSupplementalMapIds = new Set(availableSupplementalServices.map(service => service.id));
  state.selectedSupplementalMapIds = new Set(availableSupplementalServices.map(service => service.id));

  const serial = ++state.querySerial;
  const [east, north] = proj4('EPSG:4326', 'EPSG:25832', [lngLat.lng, lngLat.lat]);
  setMarker(lngLat);
  openLoadingPanel(east, north);

  const settled = await Promise.allSettled(
    services.map(service => queryService(service, east, north))
  );
  if (serial !== state.querySerial || state.appMode !== APP_MODE_ADVANCED) return;

  const results = settled.flatMap(item => item.status === 'fulfilled' ? item.value : []);
  const failures = settled.filter(item => item.status === 'rejected');

  const unique = new Map();
  for (const result of results) unique.set(result.key, result);

  // Liefert der aktuelle DOP-Dienst und der historische DOP-Dienst für den
  // angeklickten Punkt dasselbe Bildflugdatum, ist der aktuelle DOP-Eintrag
  // maßgeblich. Der historische Doppel-Eintrag wird bereits vor der Anzeige
  // entfernt und kann dadurch auch nicht als zusätzlicher Kartenlayer geladen
  // werden.
  state.results = preferCurrentDopForSameDate([...unique.values()]);
  state.selectedKeys = new Set(state.results.map(item => item.key));

  renderResults();
  elements.loadingState.hidden = true;

  const hasSupplementalMaps = state.availableSupplementalMapIds.size > 0;
  const hasSelectableContent = state.results.length > 0 || hasSupplementalMaps;

  elements.selectionContent.hidden = !hasSelectableContent;
  elements.emptyState.hidden = state.results.length > 0 || failures.length === services.length;
  elements.errorState.hidden = failures.length === 0;

  if (failures.length === services.length) {
    elements.errorState.hidden = false;
    elements.errorText.textContent = hasSupplementalMaps
      ? 'Keiner der fünf Luftbilddienste konnte abgefragt werden. Die verfügbaren weiteren Karten können dennoch geladen werden.'
      : 'Keiner der fünf NRW-WMS konnte abgefragt werden. Prüfen Sie Serverzugang und Netzwerkverbindung.';
  } else if (failures.length) {
    elements.errorText.textContent = `${failures.length} von ${services.length} Luftbilddiensten konnten nicht ausgewertet werden; die übrigen Ergebnisse werden angezeigt.`;
  }

  if (state.results.length === 0 && hasSupplementalMaps) {
    elements.emptyState.hidden = false;
  }
}

async function queryService(service, east, north) {
  const buffer = 10;
  const params = new URLSearchParams({
    language: 'ger',
    SERVICE: 'WMS',
    VERSION: '1.3.0',
    REQUEST: 'GetFeatureInfo',
    BBOX: `${east - buffer},${north - buffer},${east + buffer},${north + buffer}`,
    CRS: 'EPSG:25832',
    WIDTH: '101',
    HEIGHT: '101',
    LAYERS: service.infoLayer,
    STYLES: '',
    FORMAT: 'image/png',
    QUERY_LAYERS: service.id,
    INFO_FORMAT: 'text/html',
    I: '50',
    J: '50',
    FEATURE_COUNT: '100'
  });

  const response = await fetch(`${service.url}?${params.toString()}`, {
    headers: { Accept: 'text/html,application/xhtml+xml' }
  });
  if (!response.ok) throw new Error(`${service.label}: HTTP ${response.status}`);

  const html = await response.text();
  return extractDates(html).map(date => {
    const year = date.slice(0, 4);
    const imageLayer = service.imageLayer(year);
    return {
      key: `${service.id}|${imageLayer}|${date}`,
      year,
      date,
      serviceId: service.id,
      serviceLabel: service.label,
      serviceShortLabel: service.shortLabel,
      infoLayer: service.infoLayer,
      imageLayer
    };
  });
}

function extractDates(html) {
  const documentNode = new DOMParser().parseFromString(html, 'text/html');
  const candidates = [];

  for (const row of documentNode.querySelectorAll('tr')) {
    if (!row.textContent?.toLowerCase().includes('bildflugdatum')) continue;
    const cells = row.querySelectorAll('td, th');
    const value = cells.length >= 2 ? cells[cells.length - 1].textContent : row.textContent;
    candidates.push(value ?? '');
  }

  if (candidates.length === 0) candidates.push(documentNode.body?.textContent ?? html);

  const matches = candidates.join(' ').match(/\b(?:\d{2}\.\d{2}\.\d{4}|\d{4}-\d{2}-\d{2})\b/g) ?? [];
  return [...new Set(matches.map(normalizeDate).filter(Boolean))];
}

function normalizeDate(value) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const match = value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : null;
}

function openLoadingPanel(east, north) {
  elements.introCard.hidden = true;
  elements.resultsPanel.hidden = false;
  elements.loadingState.hidden = false;
  elements.emptyState.hidden = true;
  elements.errorState.hidden = true;
  elements.selectionContent.hidden = true;
  elements.coordinateText.textContent = `ETRS89 / UTM 32N: ${Math.round(east)} E · ${Math.round(north)} N`;
  elements.loadingDetail.textContent = 'Historische und aktuelle Bilddienste werden parallel geprüft.';
}

function renderResults() {
  const sorted = [...state.results].sort((a, b) => {
    const comparison = a.date.localeCompare(b.date) || a.serviceLabel.localeCompare(b.serviceLabel, 'de');
    return state.sortOrder === 'asc' ? comparison : -comparison;
  });

  elements.aerialSelectionControls.hidden = sorted.length === 0;
  renderAdditionalMapOptions();

  elements.dateList.replaceChildren(...sorted.map(result => {
    const label = document.createElement('label');
    label.className = 'date-row';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = state.selectedKeys.has(result.key);
    input.addEventListener('change', () => {
      if (input.checked) state.selectedKeys.add(result.key);
      else state.selectedKeys.delete(result.key);
      updateSelectionCount();
    });

    const date = document.createElement('span');
    date.className = 'date-row-date';
    date.textContent = formatDate(result.date);

    const badge = document.createElement('span');
    badge.className = 'service-badge';
    badge.textContent = result.serviceShortLabel;
    badge.title = result.serviceLabel;

    label.append(input, date, badge);
    return label;
  }));

  updateSelectionCount();
  updateZoomLevelUi();
}

function renderAdditionalMapOptions() {
  const availableServices = sortSupplementalMapsByYearDescending(
    supplementalMapServices.filter(service => state.availableSupplementalMapIds.has(service.id))
  );
  elements.additionalMapsSection.hidden = availableServices.length === 0;

  elements.additionalMapsList.replaceChildren(...availableServices.map(service => {
    const label = document.createElement('label');
    label.className = 'additional-map-option';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = state.selectedSupplementalMapIds.has(service.id);
    input.addEventListener('change', () => {
      if (input.checked) state.selectedSupplementalMapIds.add(service.id);
      else state.selectedSupplementalMapIds.delete(service.id);
      updateSelectionCount();
    });

    const text = document.createElement('span');
    const title = document.createElement('strong');
    title.textContent = service.label;
    const detail = document.createElement('small');
    detail.dataset.baseDetail = service.selectionDetail ?? '';
    if (Number.isFinite(service.minZoom)) detail.dataset.minZoom = String(service.minZoom);
    if (Number.isFinite(service.maxZoom)) detail.dataset.maxZoom = String(service.maxZoom);
    if (service.maxZoomInclusive) detail.dataset.maxZoomInclusive = 'true';
    updateSupplementalSelectionZoomStatus(detail);
    text.append(title, detail);
    label.append(input, text);
    return label;
  }));
}

function updateSelectionCount() {
  const aerialCount = state.selectedKeys.size;
  const supplementalCount = [...state.selectedSupplementalMapIds].filter(id => (
    state.availableSupplementalMapIds.has(id)
  )).length;
  const parts = [`${aerialCount} von ${state.results.length} Luftbildern`];
  if (supplementalCount) {
    parts.push(`${supplementalCount} ${supplementalCount === 1 ? 'weitere Karte' : 'weitere Karten'}`);
  }
  elements.selectionCount.textContent = `${parts.join(' · ')} ausgewählt`;
  elements.addLayersButton.disabled = aerialCount + supplementalCount === 0;
}

function formatDate(isoDate) {
  const [year, month, day] = isoDate.split('-');
  if (month === '00' || day === '00') return year;
  return `${day}.${month}.${year}`;
}

function setMarker(lngLat) {
  state.selectedPoint = { lng: lngLat.lng, lat: lngLat.lat };
  state.marker?.remove();
  const markerElement = document.createElement('div');
  markerElement.style.cssText = 'width:18px;height:18px;border-radius:50%;background:#d62525;border:3px solid white;box-shadow:0 2px 9px rgb(0 0 0 / 45%);';
  markerElement.setAttribute('aria-hidden', 'true');
  state.marker = new maplibregl.Marker({ element: markerElement, anchor: 'center' })
    .setLngLat(lngLat)
    .addTo(map);
}

function addSelectedLayers() {
  const selected = state.results
    .filter(item => state.selectedKeys.has(item.key))
    .sort((a, b) => {
      const comparison = a.date.localeCompare(b.date) || a.serviceLabel.localeCompare(b.serviceLabel, 'de');
      return state.sortOrder === 'asc' ? comparison : -comparison;
    });
  const selectedSupplementalServices = sortSupplementalMapsByYearDescending(
    supplementalMapServices.filter(service => (
      state.availableSupplementalMapIds.has(service.id)
      && state.selectedSupplementalMapIds.has(service.id)
    ))
  );

  // „Auswahl anzeigen“ bildet immer den aktuellen Auswahlzustand ab. Alte
  // Luftbilder, Metadaten und Zusatzkarten werden daher vollständig ersetzt.
  clearLoadedLayers();

  const batchId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const addedImageKeys = new Set();
  let addedCount = 0;

  for (const result of selected) {
    const imageKey = `${result.serviceId}|${result.imageLayer}`;
    if (addedImageKeys.has(imageKey)) continue;
    addedImageKeys.add(imageKey);
    addWmsLayer({
      id: `image-${batchId}-${addedCount}`,
      title: `${formatDate(result.date)} · ${result.serviceShortLabel}`,
      subtitle: result.imageLayer,
      date: result.date,
      year: result.year,
      serviceShortLabel: result.serviceShortLabel,
      serviceId: result.serviceId,
      wmsLayer: result.imageLayer,
      metadata: false,
      visible: true,
      opacity: 1
    });
    addedCount += 1;
  }

  if (elements.metadataCheckbox.checked) {
    const metadataServices = new Map(selected.map(result => [result.serviceId, result]));
    let metadataIndex = 0;
    for (const result of metadataServices.values()) {
      addWmsLayer({
        id: `metadata-${batchId}-${metadataIndex}`,
        title: `Luftbild-Metadaten · ${result.serviceShortLabel}`,
        subtitle: result.infoLayer,
        serviceId: result.serviceId,
        wmsLayer: result.infoLayer,
        metadata: true,
        visible: false,
        opacity: .75
      });
      metadataIndex += 1;
    }
  }

  let addedSupplementalCount = 0;

  for (const service of selectedSupplementalServices) {
    addWmsLayer({
      id: `supplemental-${service.id}-${batchId}`,
      title: service.label,
      subtitle: service.selectionDetail,
      pdfTitle: service.pdfTitle ?? service.label,
      pdfSubtitle: service.pdfSubtitle ?? service.selectionDetail,
      pdfAttribution: service.pdfAttribution,
      serviceShortLabel: service.shortLabel,
      serviceId: service.id,
      wmsLayer: service.wmsLayer,
      wmsLayersTopToBottom: service.wmsLayersTopToBottom,
      category: 'supplemental-map',
      metadata: false,
      visible: true,
      opacity: 1,
      minZoom: service.minZoom,
      maxZoom: service.maxZoom,
      maxZoomInclusive: service.maxZoomInclusive === true
    });
    addedSupplementalCount += 1;
  }

  // Die Ergebnisreihenfolge wird auch als sichtbare Kartenreihenfolge übernommen.
  // state.loadedLayers ist von oben nach unten sortiert; MapLibre benötigt zum
  // Umsortieren dagegen die Layer von unten nach oben.
  syncMapLayerOrder();

  elements.resultsPanel.hidden = true;
  elements.layersPanel.hidden = state.loadedLayers.length === 0;
  renderLayerList();
  const addedParts = [];
  if (addedCount) addedParts.push(`${addedCount} Luftbildlayer`);
  if (addedSupplementalCount) addedParts.push(`${addedSupplementalCount} ${addedSupplementalCount === 1 ? 'weitere Karte' : 'weitere Karten'}`);
  if (addedParts.length) showToast(`Auswahl angezeigt: ${addedParts.join(' und ')}.`);
  else showToast('Die bisherige Kartenanzeige wurde geleert.');
}

function addWmsLayer(layerConfig, { preserveOrder = false } = {}) {
  const layer = {
    ...layerConfig,
    sourceId: `source-${layerConfig.id}`,
    layerId: `layer-${layerConfig.id}`
  };
  installWmsLayer(layer);

  if (preserveOrder) {
    state.loadedLayers.push(layer);
    return;
  }

  // Weitere Karten werden zunächst unter den Luftbild- und Metadatenlayern einsortiert.
  // Anschließend kann die Reihenfolge über die Pfeiltasten frei verändert werden.
  if (layer.category === 'supplemental-map') {
    state.loadedLayers.push(layer);
  } else {
    const firstSupplementalMapIndex = state.loadedLayers.findIndex(
      item => item.category === 'supplemental-map'
    );
    if (firstSupplementalMapIndex < 0) state.loadedLayers.push(layer);
    else state.loadedLayers.splice(firstSupplementalMapIndex, 0, layer);
  }
}

function installWmsLayer(layer) {
  const params = new URLSearchParams({
    SERVICE: 'WMS',
    REQUEST: 'GetMap',
    VERSION: '1.3.0',
    LAYERS: getWmsLayersParam(layer),
    STYLES: getWmsStylesParam(layer),
    FORMAT: 'image/png',
    TRANSPARENT: 'true',
    CRS: 'EPSG:3857',
    BBOX: '{bbox-epsg-3857}',
    WIDTH: '256',
    HEIGHT: '256'
  });
  const service = getWmsService(layer.serviceId);
  if (!service) throw new Error(`Unbekannter WMS-Dienst: ${layer.serviceId}`);
  const tileUrl = `${service.url}?${params.toString().replace('%7Bbbox-epsg-3857%7D', '{bbox-epsg-3857}')}`;

  if (!map.getSource(layer.sourceId)) {
    map.addSource(layer.sourceId, {
      type: 'raster',
      tiles: [tileUrl],
      tileSize: 256,
      attribution: service.attribution ?? 'Geobasis NRW'
    });
  }
  if (!map.getLayer(layer.layerId)) {
    const beforeId = map.getLayer(NRW_BOUNDARY_CASING_LAYER_ID)
      ? NRW_BOUNDARY_CASING_LAYER_ID
      : undefined;
    const mapLayerDefinition = {
      id: layer.layerId,
      type: 'raster',
      source: layer.sourceId,
      layout: { visibility: layer.visible ? 'visible' : 'none' },
      paint: {
        'raster-opacity': layer.opacity,
        'raster-fade-duration': 0
      }
    };
    if (Number.isFinite(layer.minZoom)) mapLayerDefinition.minzoom = layer.minZoom;
    if (Number.isFinite(layer.maxZoom)) {
      // MapLibre behandelt maxzoom exklusiv. Für fachlich inklusive Grenzen wird
      // ein sehr kleiner Zuschlag verwendet, damit exakt Zoom 17,5 noch sichtbar ist.
      mapLayerDefinition.maxzoom = layer.maxZoomInclusive
        ? layer.maxZoom + Number.EPSILON * 100
        : layer.maxZoom;
    }
    map.addLayer(mapLayerDefinition, beforeId);
  }
}

function formatZoomLevel(zoom) {
  return zoom.toLocaleString('de-DE', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  });
}

function formatConfiguredZoomLevel(zoom) {
  return zoom.toLocaleString('de-DE', {
    minimumFractionDigits: Number.isInteger(zoom) ? 0 : 1,
    maximumFractionDigits: 1
  });
}

function getZoomLevelText(minZoom, maxZoom, maxZoomInclusive = false) {
  const currentZoom = map.getZoom();
  const currentLabel = formatZoomLevel(currentZoom);
  const minimumLabel = Number.isFinite(minZoom) ? formatConfiguredZoomLevel(minZoom) : null;
  const maximumLabel = Number.isFinite(maxZoom) ? formatConfiguredZoomLevel(maxZoom) : null;
  const maximumWording = maxZoomInclusive ? 'bis einschließlich' : 'bis unter';

  let rangeText = '';
  if (minimumLabel !== null && maximumLabel !== null) {
    rangeText = `sichtbar bei Zoom ${minimumLabel} ${maximumWording} ${maximumLabel}`;
  } else if (minimumLabel !== null) {
    rangeText = `sichtbar ab Zoom ${minimumLabel}`;
  } else if (maximumLabel !== null) {
    rangeText = `sichtbar ${maximumWording} Zoom ${maximumLabel}`;
  }

  let stateText = 'sichtbar';
  if (Number.isFinite(minZoom) && currentZoom < minZoom) stateText = 'weiter hineinzoomen';
  else if (Number.isFinite(maxZoom) && (maxZoomInclusive ? currentZoom > maxZoom : currentZoom >= maxZoom)) {
    stateText = 'weiter herauszoomen';
  }

  return `${rangeText} · aktuell ${currentLabel} · ${stateText}`;
}

function updateSupplementalSelectionZoomStatus(element) {
  const baseDetail = element.dataset.baseDetail ?? '';
  const minZoom = Number(element.dataset.minZoom);
  const maxZoom = Number(element.dataset.maxZoom);
  const maxZoomInclusive = element.dataset.maxZoomInclusive === 'true';
  const hasZoomRange = Number.isFinite(minZoom) || Number.isFinite(maxZoom);
  element.textContent = [
    baseDetail,
    hasZoomRange ? getZoomLevelText(minZoom, maxZoom, maxZoomInclusive) : ''
  ].filter(Boolean).join(' · ');
}

function isZoomWithinLayerRange(minZoom, maxZoom, maxZoomInclusive = false) {
  const currentZoom = map.getZoom();
  const aboveMinimum = !Number.isFinite(minZoom) || currentZoom >= minZoom;
  const belowMaximum = !Number.isFinite(maxZoom)
    || (maxZoomInclusive ? currentZoom <= maxZoom : currentZoom < maxZoom);
  return aboveMinimum && belowMaximum;
}

function updateLayerZoomStatusElement(element) {
  const baseDetail = element.dataset.baseDetail ?? '';
  const minZoom = Number(element.dataset.minZoom);
  const maxZoom = Number(element.dataset.maxZoom);
  const maxZoomInclusive = element.dataset.maxZoomInclusive === 'true';
  const parts = [baseDetail];
  if (Number.isFinite(minZoom) || Number.isFinite(maxZoom)) {
    parts.push(getZoomLevelText(minZoom, maxZoom, maxZoomInclusive));
  }
  element.textContent = parts.filter(Boolean).join(' · ');

  const item = element.closest('.layer-item');
  if (!item) return;
  const isEnabled = item.dataset.visible === 'true';
  const outsideZoomRange = isEnabled && !isZoomWithinLayerRange(minZoom, maxZoom, maxZoomInclusive);
  item.classList.toggle('zoom-out-of-range', outsideZoomRange);
  if (outsideZoomRange) {
    item.title = 'Der Layer ist eingeschaltet, wird in der aktuellen Zoomstufe aber nicht dargestellt.';
  } else {
    item.removeAttribute('title');
  }
}

function updateZoomLevelUi() {
  for (const element of elements.additionalMapsList.querySelectorAll('small[data-min-zoom], small[data-max-zoom]')) {
    updateSupplementalSelectionZoomStatus(element);
  }

  for (const element of elements.layerList.querySelectorAll('small[data-min-zoom], small[data-max-zoom]')) {
    updateLayerZoomStatusElement(element);
  }
}

function renderLayerList() {
  elements.layersPanel.hidden = state.loadedLayers.length === 0;
  elements.layerList.replaceChildren(...state.loadedLayers.map((layer, index) => {
    const item = document.createElement('article');
    item.className = 'layer-item';
    item.dataset.visible = String(layer.visible);
    if (layer.category === 'supplemental-map') item.classList.add('supplemental-map-layer');

    const topLine = document.createElement('div');
    topLine.className = 'layer-topline';

    const visibility = document.createElement('button');
    visibility.type = 'button';
    visibility.className = 'visibility-button';
    visibility.textContent = layer.visible ? '◉' : '○';
    visibility.title = layer.visible ? 'Layer ausblenden' : 'Layer einblenden';
    visibility.setAttribute('aria-pressed', String(layer.visible));
    visibility.addEventListener('click', () => {
      layer.visible = !layer.visible;
      map.setLayoutProperty(layer.layerId, 'visibility', layer.visible ? 'visible' : 'none');
      renderLayerList();
    });

    const title = document.createElement('div');
    title.className = 'layer-title';
    const strong = document.createElement('strong');
    strong.textContent = layer.title;
    const small = document.createElement('small');
    const baseDetail = layer.metadata ? `${layer.subtitle} · Luftbild-Metadaten` : layer.subtitle;
    small.dataset.baseDetail = baseDetail ?? '';
    if (Number.isFinite(layer.minZoom)) small.dataset.minZoom = String(layer.minZoom);
    if (Number.isFinite(layer.maxZoom)) small.dataset.maxZoom = String(layer.maxZoom);
    if (layer.maxZoomInclusive) small.dataset.maxZoomInclusive = 'true';
    updateLayerZoomStatusElement(small);
    title.append(strong, small);

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'remove-layer-button';
    remove.textContent = '×';
    remove.title = 'Layer entfernen';
    remove.addEventListener('click', () => removeLayer(layer.id));

    topLine.append(visibility, title, remove);

    const controls = document.createElement('div');
    controls.className = 'layer-controls';
    const opacity = document.createElement('input');
    opacity.type = 'range';
    opacity.min = '0';
    opacity.max = '1';
    opacity.step = '0.05';
    opacity.value = String(layer.opacity);
    opacity.title = 'Deckkraft';
    opacity.addEventListener('input', () => {
      layer.opacity = Number(opacity.value);
      map.setPaintProperty(layer.layerId, 'raster-opacity', layer.opacity);
    });

    const orderButtons = document.createElement('div');
    orderButtons.className = 'order-buttons';
    const up = makeOrderButton('↑', 'Nach oben', () => moveLayer(index, -1));
    const down = makeOrderButton('↓', 'Nach unten', () => moveLayer(index, 1));
    up.disabled = !canMoveLayer(index, -1);
    down.disabled = !canMoveLayer(index, 1);
    orderButtons.append(up, down);

    controls.append(opacity, orderButtons);
    item.append(topLine, controls);
    return item;
  }));
  updatePdfExportUi();
}

function makeOrderButton(text, title, handler) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'order-button';
  button.textContent = text;
  button.title = title;
  button.addEventListener('click', handler);
  return button;
}

function canMoveLayer(index, delta) {
  const target = index + delta;
  return target >= 0 && target < state.loadedLayers.length;
}

function moveLayer(index, delta) {
  if (!canMoveLayer(index, delta)) return;
  const target = index + delta;
  [state.loadedLayers[index], state.loadedLayers[target]] = [state.loadedLayers[target], state.loadedLayers[index]];
  syncMapLayerOrder();
  renderLayerList();
}

function syncMapLayerOrder() {
  // MapLibre zeichnet später platzierte Layer oben. Die UI-Liste zeigt oben ebenfalls den obersten Layer.
  // Die NRW-Grenze bleibt als feste Orientierung über allen WMS-Layern sichtbar.
  const bottomToTop = [...state.loadedLayers].reverse();
  const beforeId = map.getLayer(NRW_BOUNDARY_CASING_LAYER_ID)
    ? NRW_BOUNDARY_CASING_LAYER_ID
    : undefined;
  for (const layer of bottomToTop) map.moveLayer(layer.layerId, beforeId);
}

function removeLayer(id) {
  const index = state.loadedLayers.findIndex(layer => layer.id === id);
  if (index < 0) return;
  const [layer] = state.loadedLayers.splice(index, 1);
  if (map.getLayer(layer.layerId)) map.removeLayer(layer.layerId);
  if (map.getSource(layer.sourceId)) map.removeSource(layer.sourceId);
  renderLayerList();
}

function clearLoadedLayers() {
  for (const layer of state.loadedLayers) {
    if (map.getLayer(layer.layerId)) map.removeLayer(layer.layerId);
    if (map.getSource(layer.sourceId)) map.removeSource(layer.sourceId);
  }
  state.loadedLayers = [];
}

function removeAllLayers() {
  clearLoadedLayers();
  renderLayerList();
  showToast('Alle geladenen Kartenlayer wurden entfernt.');
}

function preferCurrentDopForSameDate(items) {
  const currentDopDates = new Set(
    items
      .filter(item => item.serviceId === 'wms_nw_dop' && item.date)
      .map(item => item.date)
  );

  return items.filter(item => !(
    item.serviceId === 'wms_nw_hist_dop'
    && item.date
    && currentDopDates.has(item.date)
  ));
}

function getExportableLayers() {
  // Zusätzliche Absicherung für bereits geladene Layer: Auch wenn ein Nutzer
  // eine ältere Anwendungsversion ohne diese Filterung verwendet hat oder
  // Layer mehrfach hinzufügt, enthält die PDF bei gleichem Datum nur den DOP-
  // und nicht zusätzlich den hist.-DOP-Layer.
  return preferCurrentDopForSameDate(
    state.loadedLayers.filter(layer => !layer.metadata)
  );
}

function updatePdfExportUi() {
  const count = getExportableLayers().length;
  showPrintFrame();
  elements.exportPdfButton.disabled = count === 0 || state.exporting;
  elements.exportPdfButton.textContent = state.exporting
    ? 'PDF wird erstellt …'
    : count > 0
      ? `Alle Karten als PDF (${formatPdfDocumentPageLabel(count)})`
      : 'Alle Karten als PDF';

  if (elements.exportQlrButton) {
    elements.exportQlrButton.disabled = state.loadedLayers.length === 0 || !state.selectedPoint || state.exporting;
  }
  if (elements.copyPermalinkButton) {
    elements.copyPermalinkButton.disabled = state.loadedLayers.length === 0 || !state.selectedPoint || state.exporting;
  }

  if (!state.exporting && count === 0) elements.exportStatus.textContent = '';
  updatePrintFrameSize();
}

function showPrintFrame() {
  if (!elements.printFrame) return;
  if (state.appMode !== APP_MODE_ADVANCED) {
    elements.printFrame.hidden = true;
    elements.printFrame.setAttribute('aria-hidden', 'true');
    return;
  }
  elements.printFrame.hidden = false;
  elements.printFrame.removeAttribute('hidden');
  elements.printFrame.setAttribute('aria-hidden', 'false');
}

function updatePrintFrameSize() {
  if (state.appMode !== APP_MODE_ADVANCED) return;
  const container = map.getContainer();
  if (!container || !elements.printFrame) return;

  const compact = window.matchMedia('(max-width: 760px)').matches;
  const horizontalPadding = compact ? 18 : 56;
  const verticalPadding = compact ? 42 : 58;
  const availableWidth = Math.max(120, container.clientWidth - horizontalPadding * 2);
  const availableHeight = Math.max(85, container.clientHeight - verticalPadding * 2);

  let width = availableWidth;
  let height = width / A4_LANDSCAPE_RATIO;
  if (height > availableHeight) {
    height = availableHeight;
    width = height * A4_LANDSCAPE_RATIO;
  }

  elements.printFrame.style.width = `${Math.round(width)}px`;
  elements.printFrame.style.height = `${Math.round(height)}px`;
}

function getPrintGeometry() {
  updatePrintFrameSize();

  const containerRect = map.getContainer().getBoundingClientRect();
  const frameRect = elements.printFrame.getBoundingClientRect();
  const innerLeft = frameRect.left + elements.printFrame.clientLeft;
  const innerTop = frameRect.top + elements.printFrame.clientTop;
  const innerWidth = elements.printFrame.clientWidth;
  const innerHeight = elements.printFrame.clientHeight;

  if (innerWidth <= 0 || innerHeight <= 0) {
    throw new Error('Der PDF-Ausschnitt ist nicht verfügbar.');
  }

  const mapLeft = innerLeft - containerRect.left;
  const mapTop = innerTop - containerRect.top;
  const northWest = map.unproject([mapLeft, mapTop]);
  const southEast = map.unproject([mapLeft + innerWidth, mapTop + innerHeight]);
  const centerY = mapTop + innerHeight / 2;
  const centerWest = map.unproject([mapLeft, centerY]);
  const centerEast = map.unproject([mapLeft + innerWidth, centerY]);
  const groundWidthMeters = geodesicDistanceMeters(centerWest, centerEast);
  const [minX, maxY] = proj4('EPSG:4326', 'EPSG:3857', [northWest.lng, northWest.lat]);
  const [maxX, minY] = proj4('EPSG:4326', 'EPSG:3857', [southEast.lng, southEast.lat]);

  return {
    screenRect: { left: innerLeft, top: innerTop, width: innerWidth, height: innerHeight },
    bbox3857: [minX, minY, maxX, maxY],
    northWest,
    southEast,
    centerWest,
    centerEast,
    groundWidthMeters
  };
}


function getFixedScalePrintGeometry(lngLat, scaleDenominator) {
  if (!lngLat || !Number.isFinite(scaleDenominator) || scaleDenominator <= 0) {
    throw new Error('Der feste PDF-Maßstab konnte nicht bestimmt werden.');
  }

  const pageWidthMeters = 0.297 * scaleDenominator;
  const pageHeightMeters = 0.210 * scaleDenominator;
  const [centerEast, centerNorth] = proj4('EPSG:4326', 'EPSG:25832', [lngLat.lng, lngLat.lat]);
  const halfWidth = pageWidthMeters / 2;
  const halfHeight = pageHeightMeters / 2;

  const northWestCoordinates = proj4(
    'EPSG:25832',
    'EPSG:4326',
    [centerEast - halfWidth, centerNorth + halfHeight]
  );
  const southEastCoordinates = proj4(
    'EPSG:25832',
    'EPSG:4326',
    [centerEast + halfWidth, centerNorth - halfHeight]
  );
  const centerWestCoordinates = proj4(
    'EPSG:25832',
    'EPSG:4326',
    [centerEast - halfWidth, centerNorth]
  );
  const centerEastCoordinates = proj4(
    'EPSG:25832',
    'EPSG:4326',
    [centerEast + halfWidth, centerNorth]
  );

  const [minX, maxY] = proj4('EPSG:4326', 'EPSG:3857', northWestCoordinates);
  const [maxX, minY] = proj4('EPSG:4326', 'EPSG:3857', southEastCoordinates);

  return {
    bbox3857: [minX, minY, maxX, maxY],
    northWest: { lng: northWestCoordinates[0], lat: northWestCoordinates[1] },
    southEast: { lng: southEastCoordinates[0], lat: southEastCoordinates[1] },
    centerWest: { lng: centerWestCoordinates[0], lat: centerWestCoordinates[1] },
    centerEast: { lng: centerEastCoordinates[0], lat: centerEastCoordinates[1] },
    groundWidthMeters: pageWidthMeters,
    targetScale: scaleDenominator
  };
}

function buildPrintWmsUrl(layer, bbox, width, height) {
  const params = new URLSearchParams({
    SERVICE: 'WMS',
    REQUEST: 'GetMap',
    VERSION: '1.3.0',
    LAYERS: getWmsLayersParam(layer),
    STYLES: getWmsStylesParam(layer),
    FORMAT: 'image/png',
    TRANSPARENT: 'true',
    CRS: 'EPSG:3857',
    BBOX: bbox.join(','),
    WIDTH: String(width),
    HEIGHT: String(height)
  });
  const service = getWmsService(layer.serviceId);
  if (!service) throw new Error(`Unbekannter WMS-Dienst: ${layer.serviceId}`);
  return `${service.url}?${params.toString()}`;
}

async function blobToDrawable(blob) {
  if ('createImageBitmap' in globalThis) return createImageBitmap(blob);

  const objectUrl = URL.createObjectURL(blob);
  try {
    return await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Das WMS-Bild konnte nicht dekodiert werden.'));
      image.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function fetchPrintWmsImage(layer, bbox) {
  const sizes = [
    [PRINT_PIXEL_WIDTH, PRINT_PIXEL_HEIGHT],
    [1800, Math.round(1800 / A4_LANDSCAPE_RATIO)],
    [1200, Math.round(1200 / A4_LANDSCAPE_RATIO)]
  ];
  let lastError = null;

  for (const [width, height] of sizes) {
    try {
      const response = await fetch(buildPrintWmsUrl(layer, bbox, width, height), {
        headers: { Accept: 'image/png,image/*;q=0.9' }
      });
      const contentType = response.headers.get('content-type') ?? '';
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      if (!contentType.toLowerCase().startsWith('image/')) {
        throw new Error(`Unerwarteter Inhaltstyp: ${contentType || 'unbekannt'}`);
      }
      return await blobToDrawable(await response.blob());
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error('Der WMS-Druckabruf ist fehlgeschlagen.');
}

function chooseScaleBarDistance(maximumMeters) {
  if (!Number.isFinite(maximumMeters) || maximumMeters <= 0) return null;
  const exponent = 10 ** Math.floor(Math.log10(maximumMeters));
  const normalized = maximumMeters / exponent;
  const factor = normalized >= 5 ? 5 : normalized >= 2 ? 2 : 1;
  return factor * exponent;
}

function formatGroundDistance(meters) {
  if (meters >= 1_000_000) {
    const value = meters / 1_000_000;
    return `${value.toLocaleString('de-DE', { maximumFractionDigits: value < 10 ? 1 : 0 })} Tsd. km`;
  }
  if (meters >= 1_000) {
    const value = meters / 1_000;
    return `${value.toLocaleString('de-DE', { maximumFractionDigits: value < 10 ? 1 : 0 })} km`;
  }
  if (meters >= 1) return `${Math.round(meters).toLocaleString('de-DE')} m`;
  return `${Math.round(meters * 100).toLocaleString('de-DE')} cm`;
}

function drawPdfScale(context, geometry, canvasWidth, canvasHeight) {
  if (!Number.isFinite(geometry.groundWidthMeters) || geometry.groundWidthMeters <= 0) return;

  const margin = 30;
  const maximumBarWidth = Math.min(560, canvasWidth * 0.24);
  const maximumGroundDistance = geometry.groundWidthMeters * maximumBarWidth / canvasWidth;
  const barDistance = chooseScaleBarDistance(maximumGroundDistance);
  if (!barDistance) return;

  const barWidth = barDistance / geometry.groundWidthMeters * canvasWidth;
  const boxWidth = Math.max(260, barWidth + 38);
  const boxHeight = 58;
  const boxX = margin;
  const boxY = canvasHeight - margin - boxHeight;
  const barX = boxX + 19;
  const barY = boxY + 14;
  const barHeight = 15;
  const segments = 4;
  const segmentWidth = barWidth / segments;

  context.save();
  context.fillStyle = 'rgba(255, 255, 255, 0.90)';
  context.fillRect(boxX, boxY, boxWidth, boxHeight);

  for (let index = 0; index < segments; index += 1) {
    context.fillStyle = index % 2 === 0 ? '#2f2e30' : '#ffffff';
    context.fillRect(barX + index * segmentWidth, barY, segmentWidth, barHeight);
  }
  context.strokeStyle = '#2f2e30';
  context.lineWidth = 2;
  context.strokeRect(barX, barY, barWidth, barHeight);
  for (let index = 0; index <= segments; index += 1) {
    const tickX = barX + index * segmentWidth;
    context.beginPath();
    context.moveTo(tickX, barY - 4);
    context.lineTo(tickX, barY + barHeight + 4);
    context.stroke();
  }

  const distanceLabel = formatGroundDistance(barDistance);
  context.fillStyle = '#2f2e30';
  context.font = '18px system-ui, sans-serif';
  context.textBaseline = 'alphabetic';
  context.fillText('0', barX, boxY + 51);
  const labelWidth = context.measureText(distanceLabel).width;
  context.fillText(distanceLabel, barX + barWidth - labelWidth, boxY + 51);
  context.restore();
}

function getPdfMarkerPosition(geometry, canvasWidth, canvasHeight) {
  if (!state.selectedPoint) return null;

  const [pointX, pointY] = proj4(
    'EPSG:4326',
    'EPSG:3857',
    [state.selectedPoint.lng, state.selectedPoint.lat]
  );
  const [minX, minY, maxX, maxY] = geometry.bbox3857;
  if (pointX < minX || pointX > maxX || pointY < minY || pointY > maxY) return null;

  return {
    x: ((pointX - minX) / (maxX - minX)) * canvasWidth,
    y: ((maxY - pointY) / (maxY - minY)) * canvasHeight
  };
}

function drawSelectedPoint(context, geometry, canvasWidth, canvasHeight) {
  const position = getPdfMarkerPosition(geometry, canvasWidth, canvasHeight);
  if (!position) return;

  context.save();
  context.shadowColor = 'rgba(0, 0, 0, 0.45)';
  context.shadowBlur = 7;
  context.shadowOffsetY = 3;

  context.beginPath();
  context.arc(position.x, position.y, 16, 0, Math.PI * 2);
  context.fillStyle = '#ffffff';
  context.fill();

  context.shadowColor = 'transparent';
  context.beginPath();
  context.arc(position.x, position.y, 11, 0, Math.PI * 2);
  context.fillStyle = '#d62525';
  context.fill();
  context.lineWidth = 2;
  context.strokeStyle = '#8e1111';
  context.stroke();
  context.restore();
}

function getPdfLayerLabels(layer, includeSelectedPoint) {
  if (layer.category === 'supplemental-map') {
    return {
      title: layer.pdfTitle ?? layer.title,
      subtitle: layer.pdfSubtitle ?? layer.subtitle ?? ''
    };
  }

  const year = layer.year ?? layer.date?.slice(0, 4) ?? layer.title.match(/\b\d{4}\b/)?.[0] ?? 'Luftbild';
  const serviceLabel = layer.serviceShortLabel ?? layer.title.replace(/^.*?·\s*/, '') ?? 'Luftbild';

  if (includeSelectedPoint && layer.date) {
    return {
      title: `${year} · ${serviceLabel}`,
      subtitle: `Bildflugdatum am markierten Punkt: ${formatDate(layer.date)}`
    };
  }

  return {
    title: `${year} · ${serviceLabel}`,
    subtitle: ''
  };
}

function createPageCanvas(wmsImage, layer, pageNumber, pageCount, geometry, exportOptions) {
  const canvas = document.createElement('canvas');
  canvas.width = PRINT_PIXEL_WIDTH;
  canvas.height = PRINT_PIXEL_HEIGHT;
  const context = canvas.getContext('2d', { alpha: false });
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);

  // Luftbildseiten werden absichtlich auf weißem Hintergrund aufgebaut.
  // Transparente bzw. nicht abgedeckte Bereiche des WMS bleiben dadurch weiß.
  if (wmsImage) context.drawImage(wmsImage, 0, 0, canvas.width, canvas.height);
  if (exportOptions.includeSelectedPoint) {
    drawSelectedPoint(context, geometry, canvas.width, canvas.height);
  }

  const labels = getPdfLayerLabels(layer, exportOptions.includeSelectedPoint);
  const margin = 30;
  const titleHeight = labels.subtitle ? 92 : 58;
  context.fillStyle = 'rgba(255, 255, 255, 0.90)';
  context.fillRect(margin, margin, Math.min(980, canvas.width - margin * 2), titleHeight);
  context.fillStyle = '#2f2e30';
  context.font = '700 34px system-ui, sans-serif';
  context.fillText(labels.title, margin + 22, margin + 39);
  if (labels.subtitle) {
    context.fillStyle = '#5d5b5e';
    context.font = '24px system-ui, sans-serif';
    context.fillText(labels.subtitle, margin + 22, margin + 72);
  }

  const service = getWmsService(layer.serviceId);
  const footerSource = layer.pdfAttribution
    ?? service?.pdfAttribution
    ?? 'Geobasis NRW · Datenlizenz Deutschland – Zero – Version 2.0';
  const footer = `${footerSource} · Seite ${pageNumber}/${pageCount}`;
  context.font = '19px system-ui, sans-serif';
  const footerWidth = context.measureText(footer).width;
  const footerBoxWidth = Math.min(canvas.width - margin * 2, footerWidth + 28);
  context.fillStyle = 'rgba(255, 255, 255, 0.88)';
  context.fillRect(
    canvas.width - margin - footerBoxWidth,
    canvas.height - margin - 38,
    footerBoxWidth,
    38
  );
  context.fillStyle = '#454346';
  context.fillText(
    footer,
    canvas.width - margin - footerBoxWidth + 14,
    canvas.height - margin - 12
  );

  drawPdfScale(context, geometry, canvas.width, canvas.height);
  return canvas;
}

function createErrorPageCanvas(layer, pageNumber, pageCount, error, exportOptions, geometry) {
  const canvas = document.createElement('canvas');
  canvas.width = PRINT_PIXEL_WIDTH;
  canvas.height = PRINT_PIXEL_HEIGHT;
  const context = canvas.getContext('2d', { alpha: false });
  const labels = getPdfLayerLabels(layer, exportOptions.includeSelectedPoint);
  context.fillStyle = '#f5f5f6';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#2f2e30';
  context.font = '700 48px system-ui, sans-serif';
  context.fillText(labels.title, 90, 130);
  if (labels.subtitle) {
    context.fillStyle = '#5d5b5e';
    context.font = '25px system-ui, sans-serif';
    context.fillText(labels.subtitle, 90, 175);
  }
  context.fillStyle = '#a12b2b';
  context.font = '700 34px system-ui, sans-serif';
  context.fillText('Dieser Kartenlayer konnte nicht gerendert werden.', 90, 250);
  context.fillStyle = '#5d5b5e';
  context.font = '25px system-ui, sans-serif';
  const message = String(error?.message ?? error ?? 'Unbekannter Fehler').slice(0, 180);
  context.fillText(message, 90, 305);
  context.fillText(`Seite ${pageNumber}/${pageCount}`, 90, canvas.height - 90);
  drawPdfScale(context, geometry, canvas.width, canvas.height);
  canvas.dataset.renderError = 'true';
  return canvas;
}

async function renderPdfPage(layer, geometry, pageNumber, pageCount, exportOptions) {
  try {
    const wmsImage = await fetchPrintWmsImage(layer, geometry.bbox3857);
    try {
      return createPageCanvas(wmsImage, layer, pageNumber, pageCount, geometry, exportOptions);
    } finally {
      if (typeof wmsImage.close === 'function') wmsImage.close();
    }
  } catch (printError) {
    console.error('PDF-Seite konnte nicht erzeugt werden:', layer.title, printError);
    return createErrorPageCanvas(layer, pageNumber, pageCount, printError, exportOptions, geometry);
  }
}


function getPdfAppendixDefinitions() {
  const pages = [
    {
      id: 'general-sources',
      title: 'Datenquellen und weiterführende Informationen',
      subtitle: 'Bezug aktueller und historischer Luftbilder bei Geobasis NRW'
    }
  ];

  if (state.selectedPointInsideKreisViersen) {
    pages.push(
      {
        id: 'kreis-viersen-historical-maps',
        title: 'Historische Karten im Kreis Viersen',
        subtitle: 'Downloads, Findehilfen und Metadaten'
      },
      {
        id: 'kreis-viersen-timeline',
        title: 'Zeitstrahl Kartenwerk im Liegenschaftskataster',
        subtitle: 'Kreis Viersen'
      },
      {
        id: 'kreis-viersen-urgemarkungen',
        title: 'Übersicht der Urgemarkungen im Kreis Viersen',
        subtitle: ''
      },
      {
        id: 'kreis-viersen-contact',
        title: 'Kontakt - Amt für Kataster und Geoinformation',
        subtitle: 'Geobasisdaten und GIS'
      }
    );
  }

  return pages;
}

function getPdfAppendixPageCount() {
  return PDF_GENERAL_APPENDIX_PAGE_COUNT
    + (state.selectedPointInsideKreisViersen ? PDF_KREIS_VIERSEN_APPENDIX_PAGE_COUNT : 0);
}

function getPdfAppendixEntries(layerCount) {
  const firstPageNumber = PDF_FRONT_MATTER_PAGE_COUNT + Math.max(0, Number(layerCount) || 0) + 1;
  return getPdfAppendixDefinitions().map((page, index) => ({
    ...page,
    pageNumber: firstPageNumber + index
  }));
}

function getPdfDocumentPageCount(layerCount) {
  return PDF_FRONT_MATTER_PAGE_COUNT
    + Math.max(0, Number(layerCount) || 0)
    + getPdfAppendixPageCount();
}

function formatPdfDocumentPageLabel(layerCount) {
  const pageCount = getPdfDocumentPageCount(layerCount);
  return `${pageCount} ${pageCount === 1 ? 'Seite' : 'Seiten'}`;
}

function formatPdfCoordinate(value, fractionDigits = 6) {
  return Number(value).toLocaleString('de-DE', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
    useGrouping: false
  });
}

function getPdfCoordinateDetails(lngLat) {
  const [east, north] = proj4('EPSG:4326', 'EPSG:25832', [lngLat.lng, lngLat.lat]);
  return {
    longitude: lngLat.lng,
    latitude: lngLat.lat,
    east,
    north,
    wgs84Text: `${formatPdfCoordinate(lngLat.lng)}° E · ${formatPdfCoordinate(lngLat.lat)}° N`,
    utmText: `${Math.round(east).toLocaleString('de-DE', { useGrouping: false })} E · ${Math.round(north).toLocaleString('de-DE', { useGrouping: false })} N`
  };
}

function getPdfLayerSummary(exportLayers) {
  const aerialCount = exportLayers.filter(layer => layer.category !== 'supplemental-map').length;
  const mapCount = exportLayers.length - aerialCount;
  const years = exportLayers.flatMap(layer => {
    const explicitYears = [layer.year, layer.date?.slice(0, 4)]
      .map(Number)
      .filter(Number.isFinite);
    const textYears = `${layer.title ?? ''} ${layer.subtitle ?? ''} ${layer.pdfSubtitle ?? ''}`
      .match(/\b(?:17|18|19|20)\d{2}\b/g)
      ?.map(Number) ?? [];
    return [...explicitYears, ...textYears];
  });
  const earliestYear = years.length > 0 ? Math.min(...years) : null;
  const latestYear = years.length > 0 ? Math.max(...years) : null;
  return {
    aerialCount,
    mapCount,
    yearRange: Number.isFinite(earliestYear) && Number.isFinite(latestYear)
      ? earliestYear === latestYear ? String(earliestYear) : `${earliestYear}–${latestYear}`
      : null
  };
}

function lonLatToOsmWorldPixel(lng, lat, zoom) {
  const worldSize = OSM_TILE_SIZE * (2 ** zoom);
  const safeLatitude = Math.max(-85.05112878, Math.min(85.05112878, lat));
  const latitudeRadians = safeLatitude * Math.PI / 180;
  const x = (lng + 180) / 360 * worldSize;
  const y = (0.5 - Math.log((1 + Math.sin(latitudeRadians)) / (1 - Math.sin(latitudeRadians))) / (4 * Math.PI)) * worldSize;
  return { x, y, worldSize };
}

function normalizeOsmTileX(tileX, zoom) {
  const tileCount = 2 ** zoom;
  return ((tileX % tileCount) + tileCount) % tileCount;
}

async function fetchOsmOverviewTile(zoom, tileX, tileY) {
  const tileCount = 2 ** zoom;
  if (tileY < 0 || tileY >= tileCount) return null;
  const normalizedX = normalizeOsmTileX(tileX, zoom);
  const response = await fetch(`https://tile.openstreetmap.org/${zoom}/${normalizedX}/${tileY}.png`, {
    headers: { Accept: 'image/png,image/*;q=0.9' }
  });
  const contentType = response.headers.get('content-type') ?? '';
  if (!response.ok) throw new Error(`OSM-Kachel: HTTP ${response.status}`);
  if (!contentType.toLowerCase().startsWith('image/')) {
    throw new Error(`OSM-Kachel: unerwarteter Inhaltstyp ${contentType || 'unbekannt'}`);
  }
  return blobToDrawable(await response.blob());
}

async function createOsmOverviewCanvas(lngLat) {
  const canvas = document.createElement('canvas');
  canvas.width = OSM_OVERVIEW_WIDTH;
  canvas.height = OSM_OVERVIEW_HEIGHT;
  const context = canvas.getContext('2d', { alpha: false });
  context.fillStyle = '#e9e9ea';
  context.fillRect(0, 0, canvas.width, canvas.height);

  const center = lonLatToOsmWorldPixel(lngLat.lng, lngLat.lat, OSM_OVERVIEW_ZOOM);
  const topLeftX = center.x - canvas.width / 2;
  const topLeftY = center.y - canvas.height / 2;
  const firstTileX = Math.floor(topLeftX / OSM_TILE_SIZE);
  const lastTileX = Math.floor((topLeftX + canvas.width - 1) / OSM_TILE_SIZE);
  const firstTileY = Math.floor(topLeftY / OSM_TILE_SIZE);
  const lastTileY = Math.floor((topLeftY + canvas.height - 1) / OSM_TILE_SIZE);
  const tileJobs = [];

  for (let tileY = firstTileY; tileY <= lastTileY; tileY += 1) {
    for (let tileX = firstTileX; tileX <= lastTileX; tileX += 1) {
      tileJobs.push((async () => {
        const drawable = await fetchOsmOverviewTile(OSM_OVERVIEW_ZOOM, tileX, tileY);
        return { drawable, tileX, tileY };
      })());
    }
  }

  const settledTiles = await Promise.allSettled(tileJobs);
  let renderedTileCount = 0;
  for (const tileResult of settledTiles) {
    if (tileResult.status !== 'fulfilled' || !tileResult.value.drawable) continue;
    const { drawable, tileX, tileY } = tileResult.value;
    const drawX = tileX * OSM_TILE_SIZE - topLeftX;
    const drawY = tileY * OSM_TILE_SIZE - topLeftY;
    context.drawImage(drawable, Math.round(drawX), Math.round(drawY), OSM_TILE_SIZE, OSM_TILE_SIZE);
    renderedTileCount += 1;
    if (typeof drawable.close === 'function') drawable.close();
  }

  if (renderedTileCount === 0) {
    context.fillStyle = '#f5f5f6';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#5d5b5e';
    context.font = '700 34px system-ui, sans-serif';
    context.textAlign = 'center';
    context.fillText('Übersichtskarte konnte nicht geladen werden', canvas.width / 2, canvas.height / 2 - 12);
    context.font = '24px system-ui, sans-serif';
    context.fillText('Der Auswahlpunkt ist über die Koordinaten dokumentiert.', canvas.width / 2, canvas.height / 2 + 34);
    context.textAlign = 'start';
  }

  const groundMetersPerPixel = 156543.03392804097
    * Math.cos(lngLat.lat * Math.PI / 180)
    / (2 ** OSM_OVERVIEW_ZOOM);
  drawPdfScale(context, {
    groundWidthMeters: groundMetersPerPixel * canvas.width
  }, canvas.width, canvas.height);

  drawSelectedPointAtCanvasPosition(context, canvas.width / 2, canvas.height / 2, 13);
  context.strokeStyle = '#9b989c';
  context.lineWidth = 3;
  context.strokeRect(1.5, 1.5, canvas.width - 3, canvas.height - 3);
  return canvas;
}


function webMercatorToOsmWorldPixel(x, y, zoom) {
  const worldSize = OSM_TILE_SIZE * (2 ** zoom);
  return {
    x: (x + WEB_MERCATOR_HALF_WORLD_METERS) / WEB_MERCATOR_WORLD_METERS * worldSize,
    y: (WEB_MERCATOR_HALF_WORLD_METERS - y) / WEB_MERCATOR_WORLD_METERS * worldSize,
    worldSize
  };
}

function chooseOsmRenderZoom(geometry, canvasWidth) {
  const [minX, , maxX] = geometry.bbox3857;
  const bboxWidth = maxX - minX;
  if (!Number.isFinite(bboxWidth) || bboxWidth <= 0) return OSM_OVERVIEW_ZOOM;
  const idealZoom = Math.log2(canvasWidth * WEB_MERCATOR_WORLD_METERS / (bboxWidth * OSM_TILE_SIZE));
  return Math.max(0, Math.min(OSM_MAX_TILE_ZOOM, Math.ceil(idealZoom)));
}

async function createOsmPdfPageCanvas(geometry, pageNumber, pageCount, exportOptions) {
  const canvas = document.createElement('canvas');
  canvas.width = PRINT_PIXEL_WIDTH;
  canvas.height = PRINT_PIXEL_HEIGHT;
  const context = canvas.getContext('2d', { alpha: false });
  context.fillStyle = '#e9e9ea';
  context.fillRect(0, 0, canvas.width, canvas.height);

  const [minX, minY, maxX, maxY] = geometry.bbox3857;
  const zoom = chooseOsmRenderZoom(geometry, canvas.width);
  const topLeft = webMercatorToOsmWorldPixel(minX, maxY, zoom);
  const bottomRight = webMercatorToOsmWorldPixel(maxX, minY, zoom);
  const sourceWidth = bottomRight.x - topLeft.x;
  const sourceHeight = bottomRight.y - topLeft.y;
  const firstTileX = Math.floor(topLeft.x / OSM_TILE_SIZE);
  const lastTileX = Math.floor((bottomRight.x - 0.0001) / OSM_TILE_SIZE);
  const firstTileY = Math.floor(topLeft.y / OSM_TILE_SIZE);
  const lastTileY = Math.floor((bottomRight.y - 0.0001) / OSM_TILE_SIZE);
  const tileJobs = [];

  for (let tileY = firstTileY; tileY <= lastTileY; tileY += 1) {
    for (let tileX = firstTileX; tileX <= lastTileX; tileX += 1) {
      tileJobs.push((async () => ({
        drawable: await fetchOsmOverviewTile(zoom, tileX, tileY),
        tileX,
        tileY
      }))());
    }
  }

  const settledTiles = await Promise.allSettled(tileJobs);
  let renderedTileCount = 0;
  for (const tileResult of settledTiles) {
    if (tileResult.status !== 'fulfilled' || !tileResult.value.drawable) continue;
    const { drawable, tileX, tileY } = tileResult.value;
    const drawX = (tileX * OSM_TILE_SIZE - topLeft.x) / sourceWidth * canvas.width;
    const drawY = (tileY * OSM_TILE_SIZE - topLeft.y) / sourceHeight * canvas.height;
    const drawWidth = OSM_TILE_SIZE / sourceWidth * canvas.width + 1;
    const drawHeight = OSM_TILE_SIZE / sourceHeight * canvas.height + 1;
    context.drawImage(drawable, drawX, drawY, drawWidth, drawHeight);
    renderedTileCount += 1;
    if (typeof drawable.close === 'function') drawable.close();
  }

  if (renderedTileCount === 0) {
    context.fillStyle = '#f5f5f6';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#a12b2b';
    context.font = '700 42px system-ui, sans-serif';
    context.textAlign = 'center';
    context.fillText('Die OpenStreetMap-Karte konnte nicht geladen werden.', canvas.width / 2, canvas.height / 2 - 20);
    context.fillStyle = '#5d5b5e';
    context.font = '25px system-ui, sans-serif';
    context.fillText('Die übrigen PDF-Seiten werden weiterhin erstellt.', canvas.width / 2, canvas.height / 2 + 35);
    context.textAlign = 'start';
    canvas.dataset.renderError = 'true';
  }

  if (exportOptions.includeSelectedPoint) {
    drawSelectedPoint(context, geometry, canvas.width, canvas.height);
  }

  const margin = 30;
  context.fillStyle = 'rgba(255, 255, 255, 0.90)';
  context.fillRect(margin, margin, 390, 58);
  context.fillStyle = '#2f2e30';
  context.font = '700 34px system-ui, sans-serif';
  context.fillText('OpenStreetMap', margin + 22, margin + 39);

  const footer = `© OpenStreetMap-Mitwirkende · Seite ${pageNumber}/${pageCount}`;
  context.font = '19px system-ui, sans-serif';
  const footerWidth = context.measureText(footer).width;
  const footerBoxWidth = footerWidth + 28;
  const footerArea = {
    x: canvas.width - margin - footerBoxWidth,
    y: canvas.height - margin - 38,
    width: footerBoxWidth,
    height: 38
  };
  context.fillStyle = 'rgba(255, 255, 255, 0.90)';
  context.fillRect(footerArea.x, footerArea.y, footerArea.width, footerArea.height);
  context.fillStyle = '#454346';
  context.fillText(footer, footerArea.x + 14, footerArea.y + 26);

  drawPdfScale(context, geometry, canvas.width, canvas.height);
  return { canvas, attributionArea: footerArea };
}

function drawSelectedPointAtCanvasPosition(context, x, y, radius = 12) {
  context.save();
  context.shadowColor = 'rgba(0, 0, 0, 0.4)';
  context.shadowBlur = 7;
  context.shadowOffsetY = 3;
  context.beginPath();
  context.arc(x, y, radius + 5, 0, Math.PI * 2);
  context.fillStyle = '#ffffff';
  context.fill();
  context.shadowColor = 'transparent';
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fillStyle = '#d62525';
  context.fill();
  context.lineWidth = 2;
  context.strokeStyle = '#8e1111';
  context.stroke();
  context.restore();
}

function fitCanvasText(context, text, maximumWidth) {
  const source = String(text ?? '');
  if (context.measureText(source).width <= maximumWidth) return source;
  let shortened = source;
  while (shortened.length > 1 && context.measureText(`${shortened}…`).width > maximumWidth) {
    shortened = shortened.slice(0, -1);
  }
  return `${shortened}…`;
}

function createPdfCoverCanvas(exportLayers, overviewCanvas, generatedAt) {
  const canvas = document.createElement('canvas');
  canvas.width = PRINT_PIXEL_WIDTH;
  canvas.height = PRINT_PIXEL_HEIGHT;
  const context = canvas.getContext('2d', { alpha: false });
  const totalPageCount = getPdfDocumentPageCount(exportLayers.length);
  const coordinates = getPdfCoordinateDetails(state.selectedPoint);
  const summary = getPdfLayerSummary(exportLayers);

  context.fillStyle = '#f5f5f6';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#478bca';
  context.fillRect(0, 0, canvas.width, 170);

  context.fillStyle = '#ffffff';
  context.font = '700 54px system-ui, sans-serif';
  context.fillText('Die Geschichte eines Grundstücks', 100, 108);
  context.font = '25px system-ui, sans-serif';
  context.fillText('Karten, Luftbilder und Katasterinformationen im Wandel der Zeit', 103, 148);

  context.fillStyle = '#2f2e30';
  context.font = '700 34px system-ui, sans-serif';
  context.fillText('Auswahlpunkt', 105, 285);

  const infoX = 100;
  const infoWidth = 880;
  const drawInfoBox = (y, heading, value, detail = '', heightOverride = null) => {
    const boxHeight = heightOverride ?? (detail ? 158 : 128);
    context.fillStyle = '#ffffff';
    context.fillRect(infoX, y, infoWidth, boxHeight);
    context.fillStyle = '#478bca';
    context.fillRect(infoX, y, 10, boxHeight);
    context.fillStyle = '#5d5b5e';
    context.font = '700 23px system-ui, sans-serif';
    context.fillText(heading, infoX + 34, y + 40);
    context.fillStyle = '#2f2e30';
    context.font = '700 29px system-ui, sans-serif';
    context.fillText(fitCanvasText(context, value, infoWidth - 70), infoX + 34, y + 82);
    if (detail) {
      context.fillStyle = '#5d5b5e';
      context.font = '22px system-ui, sans-serif';
      context.fillText(fitCanvasText(context, detail, infoWidth - 70), infoX + 34, y + 122);
    }
  };

  drawInfoBox(325, 'WGS 84 (EPSG:4326)', coordinates.wgs84Text, 'Längengrad · Breitengrad');
  drawInfoBox(515, 'ETRS89 / UTM Zone 32N (EPSG:25832)', coordinates.utmText, 'Rechtswert · Hochwert');

  context.fillStyle = '#2f2e30';
  context.font = '700 34px system-ui, sans-serif';
  context.fillText('Dokument', 105, 765);
  drawInfoBox(
    805,
    'Umfang',
    `${totalPageCount} Seiten`,
    `3 vorangestellte Seiten · ${exportLayers.length} ${exportLayers.length === 1 ? 'Karten- oder Luftbildseite' : 'Karten- und Luftbildseiten'} · ${getPdfAppendixPageCount()} ${getPdfAppendixPageCount() === 1 ? 'Informationsseite' : 'Informationsseiten'}`
  );
  drawInfoBox(
    995,
    'Inhalte',
    `${summary.aerialCount} ${summary.aerialCount === 1 ? 'Luftbild' : 'Luftbilder'} · ${summary.mapCount} ${summary.mapCount === 1 ? 'Kartenwerk' : 'Kartenwerke'}`,
    summary.yearRange ? `Bild- und Kartenstände: ${summary.yearRange}` : 'Bild- und Kartenstände gemäß Inhaltsverzeichnis'
  );
  drawInfoBox(
    1185,
    'Erstellt',
    new Intl.DateTimeFormat('de-DE', { dateStyle: 'long', timeStyle: 'short' }).format(generatedAt),
    'Automatisch erzeugt mit „Die Geschichte eines Grundstücks“',
    180
  );
  const webAppUrl = getWebAppUrl();
  const webAppLinkText = 'Webapp öffnen  →';
  const webAppLinkArea = { x: infoX + 34, y: 1317, width: 245, height: 38 };
  context.fillStyle = '#3679b8';
  context.font = '700 19px system-ui, sans-serif';
  context.fillText(webAppLinkText, webAppLinkArea.x, 1342);
  const webAppLinkTextWidth = context.measureText(webAppLinkText).width;
  context.fillRect(webAppLinkArea.x, 1347, webAppLinkTextWidth, 2);
  webAppLinkArea.width = Math.ceil(webAppLinkTextWidth);

  const mapX = 1080;
  const mapY = 265;
  const mapWidth = 1290;
  const mapHeight = Math.round(mapWidth * OSM_OVERVIEW_HEIGHT / OSM_OVERVIEW_WIDTH);
  context.fillStyle = '#2f2e30';
  context.font = '700 34px system-ui, sans-serif';
  context.fillText('Übersichtskarte', mapX, 225);
  context.fillStyle = '#ffffff';
  context.fillRect(mapX - 12, mapY - 12, mapWidth + 24, mapHeight + 24);
  context.drawImage(overviewCanvas, mapX, mapY, mapWidth, mapHeight);

  const attributionText = '© OpenStreetMap-Mitwirkende';
  context.font = '20px system-ui, sans-serif';
  const attributionWidth = context.measureText(attributionText).width + 30;
  const attributionHeight = 40;
  const attributionX = mapX + mapWidth - attributionWidth - 12;
  const attributionY = mapY + mapHeight - attributionHeight - 12;
  context.fillStyle = 'rgba(255, 255, 255, 0.92)';
  context.fillRect(attributionX, attributionY, attributionWidth, attributionHeight);
  context.fillStyle = '#454346';
  context.fillText(attributionText, attributionX + 15, attributionY + 27);

  const contentsArea = { x: 1080, y: 1390, width: 470, height: 90 };
  // Linkflächen bewusst neutral halten: PDF.js/Firefox legt beim Hover
  // einen gelben Annotation-Layer darüber. Auf blauem Grund wirkte das grünlich.
  context.fillStyle = '#f5f5f6';
  context.fillRect(contentsArea.x, contentsArea.y, contentsArea.width, contentsArea.height);
  context.fillStyle = '#478bca';
  context.fillRect(contentsArea.x, contentsArea.y, 8, contentsArea.height);
  context.strokeStyle = '#dedcdf';
  context.lineWidth = 2;
  context.strokeRect(contentsArea.x, contentsArea.y, contentsArea.width, contentsArea.height);
  context.fillStyle = '#3679b8';
  context.font = '700 27px system-ui, sans-serif';
  context.fillText('Zum Inhaltsverzeichnis  →', contentsArea.x + 32, contentsArea.y + 57);

  context.fillStyle = '#5d5b5e';
  context.font = '21px system-ui, sans-serif';
  context.fillText(`Seite 1/${totalPageCount}`, canvas.width - 205, canvas.height - 55);

  return {
    canvas,
    contentsArea,
    webAppLinkArea,
    webAppUrl,
    osmAttributionArea: {
      x: attributionX,
      y: attributionY,
      width: attributionWidth,
      height: attributionHeight
    }
  };
}

function createPdfContentsCanvas(exportLayers, exportOptions) {
  const canvas = document.createElement('canvas');
  canvas.width = PRINT_PIXEL_WIDTH;
  canvas.height = PRINT_PIXEL_HEIGHT;
  const context = canvas.getContext('2d', { alpha: false });
  const totalPageCount = getPdfDocumentPageCount(exportLayers.length);
  const coordinates = getPdfCoordinateDetails(state.selectedPoint);
  const linkAreas = [];
  const entries = [
    {
      title: 'OpenStreetMap',
      subtitle: exportOptions.osmContentsSubtitle ?? '',
      pageNumber: 3
    },
    ...exportLayers.map((layer, index) => {
      const labels = getPdfLayerLabels(layer, exportOptions.includeSelectedPoint);
      return {
        ...labels,
        pageNumber: PDF_FRONT_MATTER_PAGE_COUNT + index + 1
      };
    }),
    ...getPdfAppendixEntries(exportLayers.length).map(page => ({
      title: page.title,
      subtitle: page.subtitle ?? '',
      pageNumber: page.pageNumber
    }))
  ];

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#478bca';
  context.fillRect(0, 0, canvas.width, 150);
  context.fillStyle = '#ffffff';
  context.font = '700 52px system-ui, sans-serif';
  context.fillText('Inhaltsverzeichnis', 100, 98);

  context.fillStyle = '#edf4fa';
  context.fillRect(100, 200, canvas.width - 200, 118);
  context.fillStyle = '#2f2e30';
  context.font = '700 22px system-ui, sans-serif';
  context.fillText('Auswahlpunkt', 130, 244);
  context.font = '23px system-ui, sans-serif';
  context.fillText(`WGS 84: ${coordinates.wgs84Text}`, 130, 286);
  context.fillText(`EPSG:25832: ${coordinates.utmText}`, 1020, 286);

  context.fillStyle = '#5d5b5e';
  context.font = '22px system-ui, sans-serif';
  context.fillText('Einträge sind anklickbar und führen direkt zur jeweiligen Seite.', 105, 365);

  const columnGap = 70;
  const leftMargin = 100;
  const rightMargin = 100;
  const columnWidth = (canvas.width - leftMargin - rightMargin - columnGap) / 2;
  const contentTop = 405;
  const contentBottom = 1630;
  const rowsPerColumn = Math.max(1, Math.ceil(entries.length / 2));
  const rowHeight = Math.min(118, (contentBottom - contentTop) / rowsPerColumn);
  const titleFontSize = Math.max(20, Math.min(27, rowHeight * 0.29));
  const subtitleFontSize = Math.max(16, Math.min(20, rowHeight * 0.22));

  entries.forEach((entry, index) => {
    const column = Math.floor(index / rowsPerColumn);
    const row = index % rowsPerColumn;
    const x = leftMargin + column * (columnWidth + columnGap);
    const y = contentTop + row * rowHeight;

    context.fillStyle = row % 2 === 0 ? '#f5f5f6' : '#ffffff';
    context.fillRect(x, y, columnWidth, Math.max(52, rowHeight - 6));
    context.fillStyle = '#478bca';
    context.fillRect(x, y, 7, Math.max(52, rowHeight - 6));

    context.fillStyle = '#2f2e30';
    context.font = `700 ${titleFontSize}px system-ui, sans-serif`;
    const pageNumberWidth = 78;
    context.fillText(
      fitCanvasText(context, entry.title, columnWidth - 65 - pageNumberWidth),
      x + 28,
      y + Math.min(42, rowHeight * 0.43)
    );

    if (entry.subtitle && rowHeight >= 78) {
      context.fillStyle = '#5d5b5e';
      context.font = `${subtitleFontSize}px system-ui, sans-serif`;
      context.fillText(
        fitCanvasText(context, entry.subtitle, columnWidth - 65 - pageNumberWidth),
        x + 28,
        y + Math.min(78, rowHeight * 0.76)
      );
    }

    context.fillStyle = '#478bca';
    context.font = `700 ${titleFontSize}px system-ui, sans-serif`;
    context.textAlign = 'right';
    context.fillText(String(entry.pageNumber), x + columnWidth - 24, y + Math.min(54, rowHeight * 0.55));
    context.textAlign = 'start';

    linkAreas.push({
      x,
      y,
      width: columnWidth,
      height: Math.max(52, rowHeight - 6),
      pageNumber: entry.pageNumber
    });
  });

  context.fillStyle = '#5d5b5e';
  context.font = '21px system-ui, sans-serif';
  context.fillText(`Seite 2/${totalPageCount}`, canvas.width - 205, canvas.height - 55);
  return { canvas, linkAreas };
}


function wrapCanvasText(context, text, maximumWidth) {
  const words = String(text ?? '').split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (!line || context.measureText(candidate).width <= maximumWidth) {
      line = candidate;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawCanvasParagraph(context, text, x, y, maximumWidth, {
  font = '25px system-ui, sans-serif',
  lineHeight = 36,
  color = '#454346'
} = {}) {
  context.font = font;
  context.fillStyle = color;
  const lines = wrapCanvasText(context, text, maximumWidth);
  lines.forEach((line, index) => context.fillText(line, x, y + index * lineHeight));
  return y + lines.length * lineHeight;
}

function createPdfInfoPageCanvas(title, pageNumber, pageCount, eyebrow = 'Weiterführende Informationen') {
  const canvas = document.createElement('canvas');
  canvas.width = PRINT_PIXEL_WIDTH;
  canvas.height = PRINT_PIXEL_HEIGHT;
  const context = canvas.getContext('2d', { alpha: false });
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#478bca';
  context.fillRect(0, 0, canvas.width, 170);
  context.fillStyle = '#dcecf8';
  context.font = '700 22px system-ui, sans-serif';
  context.fillText(eyebrow, 100, 58);
  context.fillStyle = '#ffffff';
  context.font = '700 48px system-ui, sans-serif';
  context.fillText(fitCanvasText(context, title, canvas.width - 200), 100, 122);
  context.fillStyle = '#5d5b5e';
  context.font = '21px system-ui, sans-serif';
  context.fillText(`Seite ${pageNumber}/${pageCount}`, canvas.width - 205, canvas.height - 55);
  return { canvas, context, linkAreas: [] };
}

function drawPdfCanvasLink(context, linkAreas, x, y, width, label, url, {
  fontSize = 28,
  height = 58
} = {}) {
  context.fillStyle = '#f5f5f6';
  context.fillRect(x, y, width, height);
  context.fillStyle = '#478bca';
  context.fillRect(x, y, 7, height);
  context.fillStyle = '#3679b8';
  context.font = `700 ${fontSize}px system-ui, sans-serif`;
  const text = fitCanvasText(context, label, width - 55);
  context.fillText(text, x + 28, y + Math.round(height * 0.66));
  const textWidth = Math.min(context.measureText(text).width, width - 55);
  context.fillRect(x + 28, y + Math.round(height * 0.72), textWidth, 2);
  linkAreas.push({ x, y, width, height, url });
  return y + height;
}

function createGeneralSourcesPdfCanvas(pageNumber, pageCount) {
  const page = createPdfInfoPageCanvas(
    'Datenquellen und weiterführende Informationen',
    pageNumber,
    pageCount,
    'Luftbilder in Nordrhein-Westfalen'
  );
  const { context, linkAreas } = page;

  context.fillStyle = '#2f2e30';
  context.font = '700 34px system-ui, sans-serif';
  context.fillText('Bezug der verwendeten Luftbilder', 120, 300);
  let y = drawCanvasParagraph(
    context,
    'Die hier verwendeten aktuellen und historischen Luftbilder können kostenfrei bei Geobasis NRW als Download oder per Geodatendienst (WMS) bezogen werden:',
    120,
    360,
    2050,
    { font: '27px system-ui, sans-serif', lineHeight: 42 }
  ) + 38;

  y = drawPdfCanvasLink(
    context,
    linkAreas,
    120,
    y,
    1600,
    'Aktuelle Luftbild- und Satellitenbildinformationen',
    GEOBASIS_NRW_CURRENT_AERIAL_INFO_URL,
    { fontSize: 30, height: 72 }
  ) + 28;
  y = drawPdfCanvasLink(
    context,
    linkAreas,
    120,
    y,
    1600,
    'Historische Digitale Orthophotos',
    GEOBASIS_NRW_HISTORICAL_AERIAL_INFO_URL,
    { fontSize: 30, height: 72 }
  ) + 58;

  context.fillStyle = '#f5f5f6';
  context.fillRect(120, y, 2050, 250);
  context.fillStyle = '#478bca';
  context.font = '700 28px system-ui, sans-serif';
  context.fillText('Hinweis', 155, y + 56);
  drawCanvasParagraph(
    context,
    'Die Quellen- und Lizenzangaben der einzelnen Karten- und Luftbildseiten stehen zusätzlich direkt im jeweiligen Seitenfuß.',
    155,
    y + 110,
    1930,
    { font: '25px system-ui, sans-serif', lineHeight: 38, color: '#454346' }
  );
  return page;
}

function createKreisViersenHistoricalInfoPdfCanvas(pageNumber, pageCount) {
  const page = createPdfInfoPageCanvas(
    'Historische Karten im Kreis Viersen',
    pageNumber,
    pageCount,
    'Kreis Viersen'
  );
  const { context, linkAreas } = page;
  const leftX = 100;
  const rightX = 1285;
  const columnWidth = 1085;

  context.fillStyle = '#2f2e30';
  context.font = '700 32px system-ui, sans-serif';
  context.fillText('Weitere digitalisierte Karten', leftX, 280);
  let leftY = drawCanvasParagraph(
    context,
    'Neben den hier abgebildeten Karten und Luftbildern stehen weitere historische Karten digitalisiert als Download in verschiedenen Formaten zur Verfügung, darunter:',
    leftX,
    340,
    columnWidth,
    { font: '25px system-ui, sans-serif', lineHeight: 37 }
  ) + 20;

  context.font = '26px system-ui, sans-serif';
  context.fillStyle = '#454346';
  ['Urkarten', 'Reinkarten', 'Amtskarten (Digitalisierungsprojekt noch nicht abgeschlossen)'].forEach(item => {
    context.fillText('•', leftX + 8, leftY);
    const lines = wrapCanvasText(context, item, columnWidth - 58);
    lines.forEach((line, index) => context.fillText(line, leftX + 42, leftY + index * 35));
    leftY += Math.max(44, lines.length * 35 + 8);
  });
  leftY += 12;
  leftY = drawPdfCanvasLink(
    context,
    linkAreas,
    leftX,
    leftY,
    columnWidth,
    'Historische Karten online herunterladen',
    KREIS_VIERSEN_HISTORICAL_MAP_DOWNLOAD_URL,
    { fontSize: 27, height: 66 }
  ) + 46;

  context.fillStyle = '#2f2e30';
  context.font = '700 30px system-ui, sans-serif';
  context.fillText('Findehilfen im Geoportal Niederrhein', leftX, leftY);
  leftY += 34;
  [
    ['Urgemarkungen Kreis Viersen', KREIS_VIERSEN_GEOPORTAL_URGEMARKUNGEN_URL],
    ['Urfluren Kreis Viersen', KREIS_VIERSEN_GEOPORTAL_URFLUREN_URL],
    ['Amtskarten Kreis Viersen', KREIS_VIERSEN_GEOPORTAL_AMTSKARTEN_URL]
  ].forEach(([label, url]) => {
    leftY = drawPdfCanvasLink(context, linkAreas, leftX, leftY + 18, columnWidth, label, url, {
      fontSize: 25,
      height: 60
    });
  });

  context.fillStyle = '#2f2e30';
  context.font = '700 32px system-ui, sans-serif';
  context.fillText('Informationen zu den digitalen Kartenangeboten', rightX, 280);
  context.fillStyle = '#5d5b5e';
  context.font = '25px system-ui, sans-serif';
  context.fillText('Metadaten im Geodatenkatalog Niederrhein:', rightX, 337);
  let rightY = 385;
  [
    ['Historische Amtskarten Kreis Viersen', KREIS_VIERSEN_METADATA_AMTSKARTEN_URL],
    ['Historische Gemarkungen Kreis Viersen', KREIS_VIERSEN_METADATA_GEMARKUNGEN_URL],
    ['Historische Fluren Kreis Viersen', KREIS_VIERSEN_METADATA_FLUREN_URL],
    ['Historische Reinkarten Kreis Viersen', KREIS_VIERSEN_METADATA_REINKARTEN_URL],
    ['Historische Urkarten Kreis Viersen', KREIS_VIERSEN_METADATA_URKARTEN_URL]
  ].forEach(([label, url]) => {
    rightY = drawPdfCanvasLink(context, linkAreas, rightX, rightY, columnWidth, label, url, {
      fontSize: 24,
      height: 68
    }) + 22;
  });

  return page;
}

function drawDrawableFitted(context, drawable, x, y, width, height) {
  const sourceWidth = drawable.width ?? drawable.naturalWidth;
  const sourceHeight = drawable.height ?? drawable.naturalHeight;
  if (!sourceWidth || !sourceHeight) return;
  const scale = Math.min(width / sourceWidth, height / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  const drawX = x + (width - drawWidth) / 2;
  const drawY = y + (height - drawHeight) / 2;
  context.drawImage(drawable, drawX, drawY, drawWidth, drawHeight);
}

async function fetchPdfAssetDrawable(url) {
  const response = await fetch(url, { headers: { Accept: 'image/png,image/*;q=0.9' } });
  const contentType = response.headers.get('content-type') ?? '';
  if (!response.ok) throw new Error(`PDF-Bild: HTTP ${response.status}`);
  if (!contentType.toLowerCase().startsWith('image/')) {
    throw new Error(`PDF-Bild: unerwarteter Inhaltstyp ${contentType || 'unbekannt'}`);
  }
  return blobToDrawable(await response.blob());
}

async function createKreisViersenImagePdfCanvas(assetUrl, pageNumber, pageCount, fallbackTitle) {
  const canvas = document.createElement('canvas');
  canvas.width = PRINT_PIXEL_WIDTH;
  canvas.height = PRINT_PIXEL_HEIGHT;
  const context = canvas.getContext('2d', { alpha: false });
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  try {
    const drawable = await fetchPdfAssetDrawable(assetUrl);
    try {
      drawDrawableFitted(context, drawable, 70, 160, canvas.width - 140, canvas.height - 280);
    } finally {
      if (typeof drawable.close === 'function') drawable.close();
    }
  } catch (error) {
    console.error(`${fallbackTitle} konnte nicht in das PDF eingebettet werden:`, error);
    context.fillStyle = '#f5f5f6';
    context.fillRect(120, 250, canvas.width - 240, 950);
    context.fillStyle = '#a12b2b';
    context.font = '700 42px system-ui, sans-serif';
    context.textAlign = 'center';
    context.fillText(fallbackTitle, canvas.width / 2, 650);
    context.fillStyle = '#5d5b5e';
    context.font = '27px system-ui, sans-serif';
    context.fillText('Die Abbildung konnte nicht geladen werden.', canvas.width / 2, 720);
    context.textAlign = 'start';
    canvas.dataset.renderError = 'true';
  }
  context.fillStyle = '#5d5b5e';
  context.font = '21px system-ui, sans-serif';
  context.fillText(`Kreis Viersen · Seite ${pageNumber}/${pageCount}`, canvas.width - 360, canvas.height - 45);
  return { canvas, linkAreas: [] };
}

function createKreisViersenUrgemarkungenPlaceholderCanvas(pageNumber, pageCount) {
  const canvas = document.createElement('canvas');
  canvas.width = PRINT_PIXEL_WIDTH;
  canvas.height = PRINT_PIXEL_HEIGHT;
  const context = canvas.getContext('2d', { alpha: false });
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);

  const contentX = 70;
  const contentY = 160;
  const contentWidth = canvas.width - 140;
  const contentHeight = canvas.height - 280;
  context.fillStyle = '#f5f5f6';
  context.fillRect(contentX, contentY, contentWidth, contentHeight);
  context.fillStyle = '#5d5b5e';
  context.font = '700 34px system-ui, sans-serif';
  context.textAlign = 'center';
  context.fillText('Übersicht der Urgemarkungen im Kreis Viersen', canvas.width / 2, contentY + contentHeight / 2 - 15);
  context.font = '24px system-ui, sans-serif';
  context.fillText('Original-PDF wird eingebettet …', canvas.width / 2, contentY + contentHeight / 2 + 35);
  context.textAlign = 'start';

  context.fillStyle = '#5d5b5e';
  context.font = '21px system-ui, sans-serif';
  context.fillText(`Kreis Viersen · Seite ${pageNumber}/${pageCount}`, canvas.width - 360, canvas.height - 45);
  return { canvas, linkAreas: [] };
}

function createKreisViersenContactPdfCanvas(pageNumber, pageCount) {
  const page = createPdfInfoPageCanvas(
    'Kontakt',
    pageNumber,
    pageCount,
    'Kreis Viersen'
  );
  const { context, linkAreas } = page;
  const cardX = 420;
  const cardY = 365;
  const cardWidth = 1635;
  const cardHeight = 880;
  context.fillStyle = '#f5f5f6';
  context.fillRect(cardX, cardY, cardWidth, cardHeight);
  context.fillStyle = '#478bca';
  context.fillRect(cardX, cardY, 12, cardHeight);

  context.fillStyle = '#2f2e30';
  context.font = '700 43px system-ui, sans-serif';
  context.fillText('Amt für Kataster und Geoinformation', cardX + 75, cardY + 125);
  context.fillStyle = '#5d5b5e';
  context.font = '700 31px system-ui, sans-serif';
  context.fillText('Geobasisdaten und GIS', cardX + 75, cardY + 190);

  context.fillStyle = '#2f2e30';
  context.font = '700 27px system-ui, sans-serif';
  context.fillText('Telefon', cardX + 75, cardY + 350);
  drawPdfCanvasLink(
    context,
    linkAreas,
    cardX + 75,
    cardY + 385,
    720,
    '02162 39-1130',
    KREIS_VIERSEN_CONTACT_PHONE_URL,
    { fontSize: 32, height: 76 }
  );

  context.fillStyle = '#2f2e30';
  context.font = '700 27px system-ui, sans-serif';
  context.fillText('E-Mail', cardX + 75, cardY + 565);
  drawPdfCanvasLink(
    context,
    linkAreas,
    cardX + 75,
    cardY + 600,
    1110,
    'katasteramt@kreis-viersen.de',
    KREIS_VIERSEN_CONTACT_EMAIL_URL,
    { fontSize: 31, height: 76 }
  );

  context.fillStyle = '#2f2e30';
  context.font = '700 27px system-ui, sans-serif';
  context.fillText('Historische Rückverfolgung', cardX + 75, cardY + 745);
  drawPdfCanvasLink(
    context,
    linkAreas,
    cardX + 75,
    cardY + 780,
    1260,
    'Informationen zur historischen Rückverfolgung',
    KREIS_VIERSEN_HISTORICAL_TRACE_URL,
    { fontSize: 29, height: 76 }
  );
  return page;
}

async function addPdfAppendixPages(pdf, exportLayers, statusCallback = () => {}) {
  const entries = getPdfAppendixEntries(exportLayers.length);
  const pageCount = getPdfDocumentPageCount(exportLayers.length);
  let renderErrorCount = 0;

  for (const entry of entries) {
    statusCallback(`Seite ${entry.pageNumber} von ${pageCount}: ${entry.title}`);
    let page;
    if (entry.id === 'general-sources') {
      page = createGeneralSourcesPdfCanvas(entry.pageNumber, pageCount);
    } else if (entry.id === 'kreis-viersen-historical-maps') {
      page = createKreisViersenHistoricalInfoPdfCanvas(entry.pageNumber, pageCount);
    } else if (entry.id === 'kreis-viersen-timeline') {
      page = await createKreisViersenImagePdfCanvas(
        KREIS_VIERSEN_TIMELINE_ASSET_URL,
        entry.pageNumber,
        pageCount,
        'Zeitstrahl Kartenwerk im Liegenschaftskataster'
      );
    } else if (entry.id === 'kreis-viersen-urgemarkungen') {
      page = createKreisViersenUrgemarkungenPlaceholderCanvas(
        entry.pageNumber,
        pageCount
      );
    } else if (entry.id === 'kreis-viersen-contact') {
      page = createKreisViersenContactPdfCanvas(entry.pageNumber, pageCount);
    } else {
      continue;
    }

    if (page.canvas.dataset?.renderError === 'true') renderErrorCount += 1;
    pdf.addPage('a4', 'landscape');
    pdf.addImage(page.canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, PDF_PAGE_WIDTH_MM, PDF_PAGE_HEIGHT_MM, undefined, 'FAST');
    page.linkAreas?.forEach(linkArea => {
      addCanvasRectPdfLink(pdf, linkArea, { url: linkArea.url });
    });
    addPdfContentsBackLink(pdf, entry.pageNumber);
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  return { renderErrorCount };
}

function addCanvasRectPdfLink(pdf, rect, options) {
  const scaleX = PDF_PAGE_WIDTH_MM / PRINT_PIXEL_WIDTH;
  const scaleY = PDF_PAGE_HEIGHT_MM / PRINT_PIXEL_HEIGHT;
  pdf.link(rect.x * scaleX, rect.y * scaleY, rect.width * scaleX, rect.height * scaleY, options);
}

function setPdfDocumentMetadata(pdf, exportLayers) {
  const coordinates = getPdfCoordinateDetails(state.selectedPoint);
  pdf.setDocumentProperties({
    title: 'Die Geschichte eines Grundstücks',
    subject: `Auswahlpunkt ${coordinates.wgs84Text}; ${exportLayers.length} Karten- und Luftbildthemen`,
    author: 'Kreis Viersen',
    creator: 'Die Geschichte eines Grundstücks',
    keywords: 'Luftbilder, historische Karten, Nordrhein-Westfalen, OpenStreetMap, Geobasis NRW'
  });
}

async function addPdfFrontMatter(
  pdf,
  exportLayers,
  exportOptions,
  osmGeometry,
  statusCallback = () => {}
) {
  statusCallback('Übersichtskarte und Deckblätter werden erstellt …');
  let overviewCanvas;
  try {
    overviewCanvas = await createOsmOverviewCanvas(state.selectedPoint);
  } catch (error) {
    console.error('OSM-Übersichtskarte konnte nicht geladen werden:', error);
    overviewCanvas = document.createElement('canvas');
    overviewCanvas.width = OSM_OVERVIEW_WIDTH;
    overviewCanvas.height = OSM_OVERVIEW_HEIGHT;
    const context = overviewCanvas.getContext('2d', { alpha: false });
    context.fillStyle = '#f5f5f6';
    context.fillRect(0, 0, overviewCanvas.width, overviewCanvas.height);
    context.fillStyle = '#5d5b5e';
    context.font = '700 34px system-ui, sans-serif';
    context.textAlign = 'center';
    context.fillText('Übersichtskarte konnte nicht geladen werden', overviewCanvas.width / 2, overviewCanvas.height / 2 - 10);
    context.font = '24px system-ui, sans-serif';
    context.fillText('Die Koordinaten des Auswahlpunkts sind links angegeben.', overviewCanvas.width / 2, overviewCanvas.height / 2 + 36);
    context.textAlign = 'start';
    drawSelectedPointAtCanvasPosition(context, overviewCanvas.width / 2, overviewCanvas.height / 2, 13);
  }

  const generatedAt = new Date();
  const cover = createPdfCoverCanvas(exportLayers, overviewCanvas, generatedAt);
  pdf.addImage(cover.canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, PDF_PAGE_WIDTH_MM, PDF_PAGE_HEIGHT_MM, undefined, 'FAST');

  const contents = createPdfContentsCanvas(exportLayers, exportOptions);
  pdf.addPage('a4', 'landscape');
  pdf.addImage(contents.canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, PDF_PAGE_WIDTH_MM, PDF_PAGE_HEIGHT_MM, undefined, 'FAST');

  statusCallback('OpenStreetMap-Seite wird erstellt …');
  const osmExportOptions = exportOptions.osmIncludeSelectedPoint === undefined
    ? exportOptions
    : { ...exportOptions, includeSelectedPoint: exportOptions.osmIncludeSelectedPoint };
  const osmPage = await createOsmPdfPageCanvas(
    osmGeometry,
    3,
    getPdfDocumentPageCount(exportLayers.length),
    osmExportOptions
  );
  pdf.addPage('a4', 'landscape');
  pdf.addImage(osmPage.canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, PDF_PAGE_WIDTH_MM, PDF_PAGE_HEIGHT_MM, undefined, 'FAST');

  return {
    coverContentsArea: cover.contentsArea,
    coverWebAppLinkArea: cover.webAppLinkArea,
    coverWebAppUrl: cover.webAppUrl,
    osmAttributionArea: cover.osmAttributionArea,
    osmPageAttributionArea: osmPage.attributionArea,
    osmPageHadError: osmPage.canvas.dataset?.renderError === 'true',
    contentsLinkAreas: contents.linkAreas
  };
}

function addPdfContentsBackLink(pdf, pageNumber) {
  pdf.setPage(pageNumber);
  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(93, 91, 94);
  pdf.roundedRect(257, 7, 30, 10, 2, 2, 'FD');
  pdf.setTextColor(71, 139, 202);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text('Inhalt', 272, 13.5, { align: 'center' });
  pdf.link(257, 7, 30, 10, { pageNumber: 2 });
}

function addPdfNavigationLinks(pdf, navigation, exportLayerCount) {
  pdf.setPage(1);
  addCanvasRectPdfLink(pdf, navigation.coverContentsArea, { pageNumber: 2 });
  addCanvasRectPdfLink(pdf, navigation.coverWebAppLinkArea, { url: navigation.coverWebAppUrl });
  addCanvasRectPdfLink(pdf, navigation.osmAttributionArea, { url: 'https://www.openstreetmap.org/copyright' });

  pdf.setPage(2);
  navigation.contentsLinkAreas.forEach(linkArea => {
    addCanvasRectPdfLink(pdf, linkArea, { pageNumber: linkArea.pageNumber });
  });

  pdf.setPage(3);
  addCanvasRectPdfLink(pdf, navigation.osmPageAttributionArea, { url: 'https://www.openstreetmap.org/copyright' });
  addPdfContentsBackLink(pdf, 3);

  for (let index = 0; index < exportLayerCount; index += 1) {
    addPdfContentsBackLink(pdf, PDF_FRONT_MATTER_PAGE_COUNT + index + 1);
  }
}

function escapeQlrXml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function makeQgisLayerId(title, index, exportToken) {
  const base = String(title ?? 'layer')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 42) || 'layer';
  return `${base}_${exportToken}_${index}`;
}

function qgisLayerChecked(visible) {
  return visible === false ? 'Qt::Unchecked' : 'Qt::Checked';
}

function makeQgisWmsDatasource(layer) {
  const service = getWmsService(layer.serviceId);
  if (!service?.url) throw new Error(`WMS-Dienst für „${layer.title}“ ist nicht definiert.`);

  const layers = Array.isArray(layer.wmsLayersTopToBottom) && layer.wmsLayersTopToBottom.length > 0
    ? [...layer.wmsLayersTopToBottom]
    : String(layer.wmsLayer ?? '').split(',').map(item => item.trim()).filter(Boolean);
  if (layers.length === 0) throw new Error(`WMS-Layer für „${layer.title}“ ist nicht definiert.`);

  // QGIS speichert kombinierte WMS-Layer als wiederholte layers/styles-Parameter.
  // Die Reihenfolge ist wie in QGIS von oben nach unten; der WMS-Provider baut
  // daraus den gemeinsamen GetMap-Request.
  const parts = [
    'contextualWMSLegend=0',
    'crs=EPSG:25832',
    'dpiMode=7',
    'featureCount=10',
    'format=image/png'
  ];
  layers.forEach(layerName => parts.push(`layers=${encodeURIComponent(layerName)}`));
  layers.forEach(() => parts.push('styles='));
  parts.push(`url=${encodeURIComponent(service.url)}`);
  return parts.join('&');
}

function getQgisSrsXml(authId) {
  if (authId === 'EPSG:4326') {
    return `<srs><spatialrefsys nativeFormat="Wkt"><wkt>GEOGCS[&quot;WGS 84&quot;,DATUM[&quot;WGS_1984&quot;,SPHEROID[&quot;WGS 84&quot;,6378137,298.257223563,AUTHORITY[&quot;EPSG&quot;,&quot;7030&quot;]],AUTHORITY[&quot;EPSG&quot;,&quot;6326&quot;]],PRIMEM[&quot;Greenwich&quot;,0,AUTHORITY[&quot;EPSG&quot;,&quot;8901&quot;]],UNIT[&quot;degree&quot;,0.0174532925199433,AUTHORITY[&quot;EPSG&quot;,&quot;9122&quot;]],AXIS[&quot;Latitude&quot;,NORTH],AXIS[&quot;Longitude&quot;,EAST],AUTHORITY[&quot;EPSG&quot;,&quot;4326&quot;]]</wkt><proj4>+proj=longlat +datum=WGS84 +no_defs</proj4><srsid>4326</srsid><srid>4326</srid><authid>EPSG:4326</authid><description>WGS 84</description><projectionacronym>longlat</projectionacronym><ellipsoidacronym>WGS84</ellipsoidacronym><geographicflag>true</geographicflag></spatialrefsys></srs>`;
  }

  if (authId === 'EPSG:25832') {
    return `<srs><spatialrefsys nativeFormat="Wkt"><wkt>PROJCS[&quot;ETRS89 / UTM zone 32N&quot;,GEOGCS[&quot;ETRS89&quot;,DATUM[&quot;European_Terrestrial_Reference_System_1989&quot;,SPHEROID[&quot;GRS 1980&quot;,6378137,298.257222101,AUTHORITY[&quot;EPSG&quot;,&quot;7019&quot;]],AUTHORITY[&quot;EPSG&quot;,&quot;6258&quot;]],PRIMEM[&quot;Greenwich&quot;,0,AUTHORITY[&quot;EPSG&quot;,&quot;8901&quot;]],UNIT[&quot;degree&quot;,0.0174532925199433,AUTHORITY[&quot;EPSG&quot;,&quot;9122&quot;]],AUTHORITY[&quot;EPSG&quot;,&quot;4258&quot;]],PROJECTION[&quot;Transverse_Mercator&quot;],PARAMETER[&quot;latitude_of_origin&quot;,0],PARAMETER[&quot;central_meridian&quot;,9],PARAMETER[&quot;scale_factor&quot;,0.9996],PARAMETER[&quot;false_easting&quot;,500000],PARAMETER[&quot;false_northing&quot;,0],UNIT[&quot;metre&quot;,1,AUTHORITY[&quot;EPSG&quot;,&quot;9001&quot;]],AXIS[&quot;Easting&quot;,EAST],AXIS[&quot;Northing&quot;,NORTH],AUTHORITY[&quot;EPSG&quot;,&quot;25832&quot;]]</wkt><proj4>+proj=utm +zone=32 +ellps=GRS80 +units=m +no_defs</proj4><srsid>25832</srsid><srid>25832</srid><authid>EPSG:25832</authid><description>ETRS89 / UTM zone 32N</description><projectionacronym>utm</projectionacronym><ellipsoidacronym>GRS80</ellipsoidacronym><geographicflag>false</geographicflag></spatialrefsys></srs>`;
  }

  return `<srs><spatialrefsys nativeFormat="Wkt"><wkt>PROJCS[&quot;WGS 84 / Pseudo-Mercator&quot;,GEOGCS[&quot;WGS 84&quot;,DATUM[&quot;WGS_1984&quot;,SPHEROID[&quot;WGS 84&quot;,6378137,298.257223563,AUTHORITY[&quot;EPSG&quot;,&quot;7030&quot;]],AUTHORITY[&quot;EPSG&quot;,&quot;6326&quot;]],PRIMEM[&quot;Greenwich&quot;,0,AUTHORITY[&quot;EPSG&quot;,&quot;8901&quot;]],UNIT[&quot;degree&quot;,0.0174532925199433,AUTHORITY[&quot;EPSG&quot;,&quot;9122&quot;]],AUTHORITY[&quot;EPSG&quot;,&quot;4326&quot;]],PROJECTION[&quot;Mercator_1SP&quot;],PARAMETER[&quot;central_meridian&quot;,0],PARAMETER[&quot;scale_factor&quot;,1],PARAMETER[&quot;false_easting&quot;,0],PARAMETER[&quot;false_northing&quot;,0],UNIT[&quot;metre&quot;,1,AUTHORITY[&quot;EPSG&quot;,&quot;9001&quot;]],AXIS[&quot;X&quot;,EAST],AXIS[&quot;Y&quot;,NORTH],EXTENSION[&quot;PROJ4&quot;,&quot;+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs&quot;],AUTHORITY[&quot;EPSG&quot;,&quot;3857&quot;]]</wkt><proj4>+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs</proj4><srsid>3857</srsid><srid>3857</srid><authid>EPSG:3857</authid><description>WGS 84 / Pseudo-Mercator</description><projectionacronym>merc</projectionacronym><ellipsoidacronym>WGS84</ellipsoidacronym><geographicflag>false</geographicflag></spatialrefsys></srs>`;
}

function makeQgisLayerTreeNode({ id, name, providerKey, datasource, visible = true }) {
  return `<layer-tree-layer expanded="1" checked="${qgisLayerChecked(visible)}" id="${escapeQlrXml(id)}" name="${escapeQlrXml(name)}" source="${escapeQlrXml(datasource)}" providerKey="${escapeQlrXml(providerKey)}"><customproperties/></layer-tree-layer>`;
}

function getQgisLayerDisplayName(layer) {
  if (!layer?.date) return layer?.title ?? 'Layer';

  const year = layer.year ?? String(layer.date).slice(0, 4);
  const serviceLabel = layer.serviceShortLabel
    ?? String(layer.title ?? '').replace(/^(?:\d{2}\.\d{2}\.\d{4}|\d{4}-\d{2}-\d{2})\s*·?\s*/, '');
  return serviceLabel ? `${year} · ${serviceLabel}` : String(year);
}

function makeQgisRasterMapLayerXml({ id, layer }) {
  const datasource = makeQgisWmsDatasource(layer);
  const opacity = Number.isFinite(layer.opacity) ? Math.max(0, Math.min(1, layer.opacity)) : 1;
  const displayName = getQgisLayerDisplayName(layer);
  return `<maplayer type="raster" styleCategories="AllStyleCategories" hasScaleBasedVisibilityFlag="0" autoRefreshTime="0" autoRefreshMode="Disabled"><id>${escapeQlrXml(id)}</id><datasource>${escapeQlrXml(datasource)}</datasource><layername>${escapeQlrXml(displayName)}</layername>${getQgisSrsXml('EPSG:25832')}<provider>wms</provider><map-layer-style-manager current="default"><map-layer-style name="default"/></map-layer-style-manager><flags><Identifiable>1</Identifiable><Removable>1</Removable><Searchable>1</Searchable></flags><customproperties/><pipe><provider><resampling enabled="false" zoomedInResamplingMethod="nearestNeighbour" zoomedOutResamplingMethod="nearestNeighbour" maxOversampling="2"/></provider><rasterrenderer type="singlebandcolordata" band="1" alphaBand="-1" opacity="${opacity}" nodataColor=""><rasterTransparency/><minMaxOrigin><limits>None</limits><extent>WholeRaster</extent><statAccuracy>Estimated</statAccuracy></minMaxOrigin></rasterrenderer><brightnesscontrast brightness="0" contrast="0" gamma="1"/><huesaturation colorizeOn="0" colorizeRed="255" colorizeGreen="128" colorizeBlue="128" colorizeStrength="100" grayscaleMode="0" saturation="0" invertColors="0"/><rasterresampler maxOversampling="2"/></pipe><blendMode>0</blendMode></maplayer>`;
}

function makeQgisSelectionPointDatasource(point) {
  const details = getPdfCoordinateDetails(point);
  const rw = Number(details.east.toFixed(3));
  const hw = Number(details.north.toFixed(3));
  const lon = Number(details.longitude.toFixed(8));
  const lat = Number(details.latitude.toFixed(8));

  // Der Auswahlpunkt wird direkt in ETRS89 / UTM Zone 32N erzeugt. Damit
  // haben Punktlayer und alle WMS-Layer in der QLR einheitlich EPSG:25832.
  // WGS-84-Koordinaten bleiben zusätzlich als Attribute erhalten.
  const sql = `SELECT 1 AS id, MakePoint(${rw}, ${hw}, 25832) AS geometry, 'Auswahlpunkt' AS Name, ${rw} AS Rechtswert, ${hw} AS Hochwert, ${lon} AS Laengengrad, ${lat} AS Breitengrad`;
  return `?query=${encodeURIComponent(sql)}&uid=id&geometry=geometry:point:25832`;
}

function makeQgisSelectionPointMapLayerXml({ id, point }) {
  const datasource = makeQgisSelectionPointDatasource(point);
  return `<maplayer type="vector" geometry="Point" wkbType="Point" styleCategories="AllStyleCategories" hasScaleBasedVisibilityFlag="0" labelsEnabled="0" autoRefreshTime="0" autoRefreshMode="Disabled"><id>${escapeQlrXml(id)}</id><datasource>${escapeQlrXml(datasource)}</datasource><layername>Auswahlpunkt</layername>${getQgisSrsXml('EPSG:25832')}<provider encoding="UTF-8">virtual</provider><map-layer-style-manager current="default"><map-layer-style name="default"/></map-layer-style-manager><flags><Identifiable>1</Identifiable><Removable>1</Removable><Searchable>1</Searchable></flags><renderer-v2 type="singleSymbol" symbollevels="0" forceraster="0" enableorderby="0"><symbols><symbol name="0" type="marker" alpha="1" clip_to_extent="1" force_rhr="0"><layer class="SimpleMarker" enabled="1" locked="0" pass="0"><prop k="name" v="circle"/><prop k="color" v="204,0,0,255"/><prop k="outline_color" v="255,255,255,255"/><prop k="outline_style" v="solid"/><prop k="outline_width" v="0.6"/><prop k="outline_width_unit" v="MM"/><prop k="size" v="4"/><prop k="size_unit" v="MM"/></layer></symbol></symbols><rotation/><sizescale/></renderer-v2><customproperties/><blendMode>0</blendMode><featureBlendMode>0</featureBlendMode><layerOpacity>1</layerOpacity></maplayer>`;
}

function buildQgisQlr(layers, point) {
  if (!point) throw new Error('Kein Auswahlpunkt vorhanden.');
  if (!Array.isArray(layers) || layers.length === 0) throw new Error('Keine geladenen Themen vorhanden.');

  const coordinates = getPdfCoordinateDetails(point);
  const groupName = `Die Geschichte eines Grundstücks – ${Math.round(coordinates.east)} ${Math.round(coordinates.north)}`;
  const exportToken = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  const pointDatasource = makeQgisSelectionPointDatasource(point);
  const pointItem = {
    id: makeQgisLayerId('Auswahlpunkt', 0, exportToken),
    name: 'Auswahlpunkt',
    providerKey: 'virtual',
    datasource: pointDatasource,
    visible: true
  };
  const layerItems = layers.map((layer, index) => {
    const displayName = getQgisLayerDisplayName(layer);
    return {
    id: makeQgisLayerId(displayName, index + 1, exportToken),
    name: displayName,
    providerKey: 'wms',
    datasource: makeQgisWmsDatasource(layer),
    visible: layer.visible !== false,
    layer
    };
  });

  const treeNodes = [
    makeQgisLayerTreeNode(pointItem),
    ...layerItems.map(makeQgisLayerTreeNode)
  ].join('');
  const mapLayers = [
    makeQgisSelectionPointMapLayerXml({ id: pointItem.id, point }),
    ...layerItems.map(item => makeQgisRasterMapLayerXml({ id: item.id, layer: item.layer }))
  ].join('');

  // QLR-Dateien enthalten technisch eine namenlose Wurzelgruppe. Die eigentliche
  // Projektgruppe muss darunter liegen, damit QGIS sie beim Laden als Gruppe
  // erhält und nicht nur deren einzelne Kinder in den bestehenden Layerbaum setzt.
  return `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE qgis-layer-definition>\n<qlr><layer-tree-group name="" expanded="1" checked="Qt::Checked"><customproperties/><layer-tree-group name="${escapeQlrXml(groupName)}" expanded="1" checked="Qt::Checked"><customproperties/>${treeNodes}</layer-tree-group></layer-tree-group><maplayers>${mapLayers}</maplayers></qlr>\n`;
}

function makeQlrFilename() {
  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    '-',
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0')
  ].join('');
  return `geschichte-eines-grundstuecks-nrw-${stamp}.qlr`;
}

function handleQlrExportClick() {
  if (state.appMode !== APP_MODE_ADVANCED) return;
  if (!state.selectedPoint) {
    showToast('Bitte zuerst einen Auswahlpunkt in der Karte setzen.');
    return;
  }
  if (state.loadedLayers.length === 0) {
    showToast('Bitte zuerst mindestens ein Thema laden.');
    return;
  }

  try {
    const qlr = buildQgisQlr(state.loadedLayers, state.selectedPoint);
    triggerBlobDownload(new Blob([qlr], { type: 'application/xml;charset=utf-8' }), makeQlrFilename());
    const count = state.loadedLayers.length;
    elements.exportStatus.textContent = `QGIS-Layerdefinition mit Auswahlpunkt und ${count} ${count === 1 ? 'Thema' : 'Themen'} heruntergeladen.`;
    showToast('QGIS-Layerdefinition (.qlr) wurde heruntergeladen.');
  } catch (error) {
    console.error(error);
    elements.exportStatus.textContent = 'QLR konnte nicht erstellt werden.';
    showToast('QLR konnte nicht erstellt werden.');
  }
}

function makePdfFilename() {
  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    '-',
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0')
  ].join('');
  return `luftbilder-und-karten-nrw-${stamp}.pdf`;
}

function triggerBlobDownload(blob, filename) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  link.style.display = 'none';
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);
}

async function embedKreisViersenUrgemarkungenPdf(pdfBytes, exportLayers) {
  if (!state.selectedPointInsideKreisViersen) {
    return { bytes: pdfBytes, embedError: false };
  }

  const entry = getPdfAppendixEntries(exportLayers.length)
    .find(item => item.id === 'kreis-viersen-urgemarkungen');
  if (!entry) return { bytes: pdfBytes, embedError: false };

  try {
    const response = await fetch(KREIS_VIERSEN_URGEMARKUNGEN_PDF_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`.trim());
    }
    const sourceBytes = await response.arrayBuffer();
    const finalPdf = await PDFDocument.load(pdfBytes);
    const [embeddedPage] = await finalPdf.embedPdf(sourceBytes, [0]);
    const targetPage = finalPdf.getPage(entry.pageNumber - 1);
    const targetSize = targetPage.getSize();

    const contentX = (70 / PRINT_PIXEL_WIDTH) * targetSize.width;
    const contentTop = (160 / PRINT_PIXEL_HEIGHT) * targetSize.height;
    const contentWidth = ((PRINT_PIXEL_WIDTH - 140) / PRINT_PIXEL_WIDTH) * targetSize.width;
    const contentHeight = ((PRINT_PIXEL_HEIGHT - 280) / PRINT_PIXEL_HEIGHT) * targetSize.height;
    const scale = Math.min(
      contentWidth / embeddedPage.width,
      contentHeight / embeddedPage.height
    );
    const drawWidth = embeddedPage.width * scale;
    const drawHeight = embeddedPage.height * scale;
    const x = contentX + (contentWidth - drawWidth) / 2;
    const y = targetSize.height - contentTop - (contentHeight + drawHeight) / 2;

    // Die Originalseite enthält transparente Bereiche. Eine weiße Fläche über
    // die vollständigen Seitenabmessungen verhindert, dass der graue
    // Hintergrund der Anhangseite (z. B. hinter der Überschrift) durchscheint.
    targetPage.drawRectangle({
      x,
      y,
      width: drawWidth,
      height: drawHeight,
      color: rgb(1, 1, 1)
    });
    targetPage.drawPage(embeddedPage, {
      x,
      y,
      width: drawWidth,
      height: drawHeight
    });

    return {
      bytes: await finalPdf.save(),
      embedError: false
    };
  } catch (error) {
    console.error('Original-PDF der Urgemarkungen konnte nicht eingebettet werden:', error);
    return { bytes: pdfBytes, embedError: true };
  }
}

async function deliverPdf(pdf, filename, exportLayers) {
  const initialBytes = pdf.output('arraybuffer');
  const finalized = await embedKreisViersenUrgemarkungenPdf(initialBytes, exportLayers);
  const blob = new Blob([finalized.bytes], { type: 'application/pdf' });
  triggerBlobDownload(blob, filename);
  return { status: 'downloaded', embedError: finalized.embedError };
}

function describePdfDelivery(deliveryResult) {
  return deliveryResult?.status === 'downloaded' ? 'heruntergeladen' : 'erstellt';
}

async function exportLoadedLayersToPdf({ filename = makePdfFilename() } = {}) {
  const exportLayers = getExportableLayers();
  if (state.exporting || exportLayers.length === 0) return;
  state.exporting = true;
  updatePdfExportUi();
  elements.layersPanel.inert = true;
  const mapElement = map.getContainer();
  const previousPointerEvents = mapElement.style.pointerEvents;
  mapElement.style.pointerEvents = 'none';
  let errorPageCount = 0;

  try {
    elements.exportStatus.textContent = 'A4-Ausschnitt wird vorbereitet …';
    const viewGeometry = getPrintGeometry();
    const useRecommendedScales = Boolean(
      elements.advancedPdfScaleRecommended.checked && state.selectedPoint
    );
    const includeSelectedPointRequested = Boolean(elements.includePointPdfCheckbox.checked);
    const markerIsInsidePrintFrame = Boolean(
      getPdfMarkerPosition(viewGeometry, PRINT_PIXEL_WIDTH, PRINT_PIXEL_HEIGHT)
    );
    const exportOptions = {
      includeSelectedPoint: Boolean(
        includeSelectedPointRequested && markerIsInsidePrintFrame
      ),
      osmIncludeSelectedPoint: useRecommendedScales
        ? includeSelectedPointRequested
        : Boolean(includeSelectedPointRequested && markerIsInsidePrintFrame),
      osmContentsSubtitle: useRecommendedScales
        ? `Kartenausschnitt ${formatScaleDenominator(SIMPLE_SCALE_AERIAL_AND_PARCEL)}`
        : 'Kartenausschnitt wie in der Webanwendung'
    };
    const osmGeometry = useRecommendedScales
      ? getFixedScalePrintGeometry(state.selectedPoint, SIMPLE_SCALE_AERIAL_AND_PARCEL)
      : viewGeometry;
    const documentPageCount = getPdfDocumentPageCount(exportLayers.length);
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true
    });
    setPdfDocumentMetadata(pdf, exportLayers);
    const navigation = await addPdfFrontMatter(
      pdf,
      exportLayers,
      exportOptions,
      osmGeometry,
      statusText => { elements.exportStatus.textContent = statusText; }
    );
    if (navigation.osmPageHadError) errorPageCount += 1;

    for (let index = 0; index < exportLayers.length; index += 1) {
      const layer = exportLayers[index];
      const documentPageNumber = PDF_FRONT_MATTER_PAGE_COUNT + index + 1;
      elements.exportStatus.textContent = `Seite ${documentPageNumber} von ${documentPageCount}: ${layer.title}`;
      let pageGeometry = viewGeometry;
      let pageExportOptions = exportOptions;
      if (useRecommendedScales && layer.category === 'supplemental-map') {
        const recommendedScale = getRecommendedScaleForPdfLayer(layer);
        if (Number.isFinite(recommendedScale)) {
          pageGeometry = getFixedScalePrintGeometry(state.selectedPoint, recommendedScale);
          pageExportOptions = {
            ...exportOptions,
            includeSelectedPoint: includeSelectedPointRequested
          };
        }
      }
      const pageCanvas = await renderPdfPage(
        layer,
        pageGeometry,
        documentPageNumber,
        documentPageCount,
        pageExportOptions
      );
      if (pageCanvas.dataset?.renderError === 'true') errorPageCount += 1;
      const imageData = pageCanvas.toDataURL('image/jpeg', 0.9);
      pdf.addPage('a4', 'landscape');
      pdf.addImage(imageData, 'JPEG', 0, 0, PDF_PAGE_WIDTH_MM, PDF_PAGE_HEIGHT_MM, undefined, 'FAST');
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    const appendixResult = await addPdfAppendixPages(
      pdf,
      exportLayers,
      statusText => { elements.exportStatus.textContent = statusText; }
    );
    errorPageCount += appendixResult.renderErrorCount;

    addPdfNavigationLinks(pdf, navigation, exportLayers.length);
    const deliveryResult = await deliverPdf(pdf, filename, exportLayers);
    if (deliveryResult.embedError) errorPageCount += 1;
    const deliveryWord = describePdfDelivery(deliveryResult);
    const pageText = formatPdfDocumentPageLabel(exportLayers.length);
    if (errorPageCount > 0) {
      elements.exportStatus.textContent = `PDF mit ${pageText} ${deliveryWord}; ${errorPageCount} ${errorPageCount === 1 ? 'Seite enthält' : 'Seiten enthalten'} einen Fehlerhinweis.`;
      showToast(`PDF ${deliveryWord}. ${errorPageCount} ${errorPageCount === 1 ? 'Seite konnte' : 'Seiten konnten'} nicht vollständig gerendert werden.`);
    } else {
      elements.exportStatus.textContent = `PDF mit ${pageText} wurde ${deliveryWord}.`;
      showToast(`PDF mit ${pageText} wurde ${deliveryWord}.`);
    }
  } catch (error) {
    console.error(error);
    elements.exportStatus.textContent = 'Die PDF konnte nicht erstellt werden.';
    showToast(`PDF-Export fehlgeschlagen: ${error?.message ?? error}`);
  } finally {
    mapElement.style.pointerEvents = previousPointerEvents;
    elements.layersPanel.inert = false;
    state.exporting = false;
    updatePdfExportUi();
  }
}


async function exportSimpleLayersToPdf({ filename = makePdfFilename(), isAuto = false } = {}) {
  const exportLayers = state.simpleExportLayers;
  if (state.simpleExporting || state.exporting || exportLayers.length === 0 || !state.selectedPoint) return;

  state.simpleExporting = true;
  state.exporting = true;
  elements.simpleExportButton.disabled = true;
  elements.simpleExportButton.textContent = 'PDF wird erstellt …';
  elements.simpleModeButton.disabled = true;
  elements.advancedModeButton.disabled = true;
  const dialogSubmitButtons = elements.simpleExportDialog.querySelectorAll('button[type="submit"]');
  dialogSubmitButtons.forEach(button => { button.disabled = true; });
  let errorPageCount = 0;

  try {
    const exportOptions = {
      includeSelectedPoint: elements.simpleIncludePointCheckbox.checked,
      osmContentsSubtitle: 'Kartenausschnitt ca. 1 : 1.000'
    };
    const osmGeometry = getFixedScalePrintGeometry(
      state.selectedPoint,
      SIMPLE_SCALE_AERIAL_AND_PARCEL
    );
    const documentPageCount = getPdfDocumentPageCount(exportLayers.length);
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true
    });
    setPdfDocumentMetadata(pdf, exportLayers);
    const updateFrontMatterStatus = statusText => {
      elements.simpleExportStatus.textContent = statusText;
      if (isAuto) {
        setAutoPrintStatus({
          title: 'PDF wird erstellt',
          text: statusText,
          current: 0,
          total: documentPageCount
        });
      }
    };
    const navigation = await addPdfFrontMatter(
      pdf,
      exportLayers,
      exportOptions,
      osmGeometry,
      updateFrontMatterStatus
    );
    if (navigation.osmPageHadError) errorPageCount += 1;
    if (isAuto) {
      setAutoPrintStatus({
        title: 'PDF wird erstellt',
        text: 'Übersicht, Inhaltsverzeichnis und OpenStreetMap-Seite wurden erstellt.',
        current: PDF_FRONT_MATTER_PAGE_COUNT,
        total: documentPageCount
      });
    }

    for (let index = 0; index < exportLayers.length; index += 1) {
      const layer = exportLayers[index];
      const documentPageNumber = PDF_FRONT_MATTER_PAGE_COUNT + index + 1;
      const progressText = `Seite ${documentPageNumber} von ${documentPageCount} wird erstellt: ${layer.title}`;
      elements.simpleExportStatus.textContent = progressText;
      if (isAuto) {
        setAutoPrintStatus({
          title: 'PDF wird erstellt',
          text: progressText,
          current: documentPageNumber - 1,
          total: documentPageCount
        });
      }
      const geometry = getFixedScalePrintGeometry(state.selectedPoint, layer.targetScale);
      const pageCanvas = await renderPdfPage(
        layer,
        geometry,
        documentPageNumber,
        documentPageCount,
        exportOptions
      );
      if (pageCanvas.dataset?.renderError === 'true') errorPageCount += 1;
      const imageData = pageCanvas.toDataURL('image/jpeg', 0.9);
      pdf.addPage('a4', 'landscape');
      pdf.addImage(imageData, 'JPEG', 0, 0, PDF_PAGE_WIDTH_MM, PDF_PAGE_HEIGHT_MM, undefined, 'FAST');
      if (isAuto) {
        setAutoPrintStatus({
          title: 'PDF wird erstellt',
          text: `Seite ${documentPageNumber} von ${documentPageCount} wurde erstellt.`,
          current: documentPageNumber,
          total: documentPageCount
        });
      }
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    const appendixResult = await addPdfAppendixPages(
      pdf,
      exportLayers,
      statusText => {
        elements.simpleExportStatus.textContent = statusText;
        if (isAuto) {
          setAutoPrintStatus({
            title: 'PDF wird erstellt',
            text: statusText,
            current: Math.min(documentPageCount, PDF_FRONT_MATTER_PAGE_COUNT + exportLayers.length),
            total: documentPageCount
          });
        }
      }
    );
    errorPageCount += appendixResult.renderErrorCount;

    addPdfNavigationLinks(pdf, navigation, exportLayers.length);
    const deliveryResult = await deliverPdf(pdf, filename, exportLayers);
    if (deliveryResult.embedError) errorPageCount += 1;
    const deliveryWord = describePdfDelivery(deliveryResult);
    const pageText = formatPdfDocumentPageLabel(exportLayers.length);
    if (errorPageCount > 0) {
      elements.simpleExportStatus.textContent = `PDF mit ${pageText} ${deliveryWord}; ${errorPageCount} ${errorPageCount === 1 ? 'Seite enthält' : 'Seiten enthalten'} einen Fehlerhinweis.`;
      if (!isAuto) {
        showToast(`PDF ${deliveryWord}. ${errorPageCount} ${errorPageCount === 1 ? 'Seite konnte' : 'Seiten konnten'} nicht vollständig gerendert werden.`);
      }
    } else {
      elements.simpleExportStatus.textContent = `PDF mit ${pageText} wurde ${deliveryWord}.`;
      if (!isAuto) showToast(`PDF mit ${pageText} wurde ${deliveryWord}.`);
    }
    if (isAuto) {
      setAutoPrintStatus({
        title: 'PDF ist fertig',
        text: errorPageCount > 0
          ? `${pageText}; ${errorPageCount} ${errorPageCount === 1 ? 'Seite enthält' : 'Seiten enthalten'} einen Fehlerhinweis.`
          : `PDF mit ${pageText} ist fertig. Der Download wurde gestartet.`,
        current: documentPageCount,
        total: documentPageCount,
        stateClass: 'is-complete'
      });
      hideAutoPrintStatus(6000);
    }
  } catch (error) {
    console.error(error);
    elements.simpleExportStatus.textContent = 'Die PDF konnte nicht erstellt werden.';
    if (!isAuto) showToast(`PDF-Export fehlgeschlagen: ${error?.message ?? error}`);
    if (isAuto) {
      setAutoPrintStatus({
        title: 'PDF-Export fehlgeschlagen',
        text: String(error?.message ?? error),
        stateClass: 'is-error'
      });
      hideAutoPrintStatus(8000);
    }
  } finally {
    state.simpleExporting = false;
    state.exporting = false;
    if (isAuto) state.simpleAutoExportActive = false;
    elements.simpleExportButton.disabled = state.simpleExportLayers.length === 0;
    elements.simpleExportButton.textContent = state.simpleExportLayers.length > 0
      ? `PDF erstellen (${formatPdfDocumentPageLabel(state.simpleExportLayers.length)})`
      : 'PDF erstellen';
    elements.simpleModeButton.disabled = false;
    elements.advancedModeButton.disabled = false;
    dialogSubmitButtons.forEach(button => { button.disabled = false; });
    updatePdfExportUi();
  }
}

async function handleAdvancedPdfExportClick() {
  await exportLoadedLayersToPdf({ filename: makePdfFilename() });
}

async function handleSimplePdfExportClick() {
  await exportSimpleLayersToPdf({ filename: makePdfFilename(), isAuto: false });
}

function showToast(message) {
  clearTimeout(state.toastTimer);
  elements.toast.textContent = message;
  elements.toast.hidden = false;
  state.toastTimer = setTimeout(() => { elements.toast.hidden = true; }, 3500);
}

for (const radio of document.querySelectorAll('input[name="sortOrder"]')) {
  radio.addEventListener('change', () => {
    if (!radio.checked) return;
    state.sortOrder = radio.value;
    renderResults();
  });
}

elements.selectAllButton.addEventListener('click', () => {
  state.selectedKeys = new Set(state.results.map(item => item.key));
  renderResults();
});
elements.selectNoneButton.addEventListener('click', () => {
  state.selectedKeys.clear();
  renderResults();
});
elements.invertSelectionButton.addEventListener('click', () => {
  state.selectedKeys = new Set(state.results.filter(item => !state.selectedKeys.has(item.key)).map(item => item.key));
  renderResults();
});
elements.addLayersButton.addEventListener('click', addSelectedLayers);
elements.closeResultsButton.addEventListener('click', () => { elements.resultsPanel.hidden = true; });
elements.removeAllLayersButton.addEventListener('click', removeAllLayers);
elements.aboutButton.addEventListener('click', () => elements.aboutDialog.showModal());
elements.exportPdfButton.addEventListener('click', handleAdvancedPdfExportClick);
elements.exportQlrButton.addEventListener('click', handleQlrExportClick);
elements.copyPermalinkButton.addEventListener('click', handleCopyPermalinkClick);
elements.simpleExportButton.addEventListener('click', handleSimplePdfExportClick);
elements.copySimpleShareDialogButton.addEventListener('click', () => (
  copyShareLink(elements.simpleShareDialogUrl, elements.copySimpleShareDialogButton)
));
elements.copySimpleShareAutoButton.addEventListener('click', () => (
  copyShareLink(elements.simpleShareAutoUrl, elements.copySimpleShareAutoButton)
));
for (const input of [elements.simpleShareDialogUrl, elements.simpleShareAutoUrl]) {
  input.addEventListener('focus', () => input.select());
  input.addEventListener('click', () => input.select());
}
elements.simpleModeButton.addEventListener('click', () => applyAppMode(APP_MODE_SIMPLE));
elements.advancedModeButton.addEventListener('click', () => applyAppMode(APP_MODE_ADVANCED));
elements.simpleExportDialog.addEventListener('cancel', event => {
  if (state.simpleExporting) event.preventDefault();
});
elements.simpleExportDialog.addEventListener('close', () => {
  if (state.simpleExporting) return;
  restoreMapAfterSimpleDialog();
  state.simpleQuerySerial += 1;
  state.simpleExportLayers = [];
  elements.simpleExportStatus.textContent = '';
});
