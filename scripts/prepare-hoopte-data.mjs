import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const dataDir = resolve(root, 'public', 'data');

const BSH_TIDES_URL = 'https://gezeiten.bsh.de/data/DE__731P_tides.json';
const WGMN_BUNTHAUS_URL = 'https://www.wgmn-hamburg.de/daten-2/ReportAktuelleMesswerte-BU-2.html';

const bshOut = resolve(dataDir, 'hoopte-bsh-tides.json');
const waterQualityOut = resolve(dataDir, 'hoopte-water-quality.json');

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

async function fetchWindows1252Text(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  const buffer = await response.arrayBuffer();
  return new TextDecoder('windows-1252').decode(buffer);
}

async function writeJson(path, data) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function keepExistingOrWriteFallback(path, fallback) {
  try {
    await readFile(path, 'utf8');
  } catch {
    await writeJson(path, fallback);
  }
}

function parseNumber(value) {
  const normalized = String(value).trim().replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseWgmnRows(html) {
  return [...html.matchAll(/<tr>\s*<td>\s*([^<]+?)\s*<\/td>\s*<td>\s*([^<]+?)\s*<\/td>\s*<td>\s*([^<]+?)\s*<\/td>\s*<td>\s*([^<]+?)\s*<\/td>\s*<\/tr>/gis)]
    .map((match) => ({
      timestamp: match[1].trim(),
      metric: match[2].trim(),
      value: parseNumber(match[3]),
      unit: match[4].trim(),
    }))
    .filter((row) => row.value !== null);
}

function findMetric(rows, matcher) {
  const row = rows.find((entry) => matcher(entry.metric));
  if (!row || row.value === null) return undefined;
  return {
    value: row.value,
    unit: row.unit,
    timestamp: row.timestamp,
  };
}

async function prepareBshTides() {
  try {
    const data = await fetchJson(BSH_TIDES_URL);
    const years = Array.isArray(data.years) ? data.years : [];
    const events = years
      .flatMap((yearEntry) => Object.values(yearEntry))
      .flatMap((yearData) => yearData?.hwnw_prediction?.data ?? [])
      .filter((event) => event?.timestamp && (event.type === 'HW' || event.type === 'NW'))
      .map((event) => ({
        timestamp: event.timestamp,
        height: event.height,
        type: event.type,
        phase: event.phase ?? null,
      }));

    await writeJson(bshOut, {
      station: data.station_name ?? 'Hamburg, Zollenspieker, Elbe',
      bshnr: data.bshnr ?? '731P',
      sourceUrl: BSH_TIDES_URL,
      fetchedAt: new Date().toISOString(),
      events,
    });
    console.log(`Wrote ${events.length} BSH tide events`);
  } catch (error) {
    console.warn(`Could not refresh BSH tide data: ${error.message}`);
    await keepExistingOrWriteFallback(bshOut, {
      station: 'Hamburg, Zollenspieker, Elbe',
      bshnr: '731P',
      sourceUrl: BSH_TIDES_URL,
      fetchedAt: null,
      events: [],
    });
  }
}

async function prepareWaterQuality() {
  try {
    const html = await fetchWindows1252Text(WGMN_BUNTHAUS_URL);
    const rows = parseWgmnRows(html);
    const measurements = {
      oxygenMgL: findMetric(rows, (metric) => metric.toLowerCase().includes('sauerstoffkonzentration')),
      oxygenSaturationPercent: findMetric(rows, (metric) => metric.toLowerCase().includes('sauerstoffsättigung')),
      waterTemperatureC: findMetric(rows, (metric) => metric.toLowerCase().includes('wassertemperatur')),
      turbidityFnu: findMetric(rows, (metric) => metric.toLowerCase().includes('trübung')),
    };

    await writeJson(waterQualityOut, {
      station: 'WGMN Bunthaus',
      sourceUrl: WGMN_BUNTHAUS_URL,
      fetchedAt: new Date().toISOString(),
      proxyNote: 'Proxy-Wert: Messstation Bunthaus, nicht exakt am Spot Hoopte/Zollenspieker.',
      measurements,
    });
    console.log('Wrote WGMN Bunthaus water-quality snapshot');
  } catch (error) {
    console.warn(`Could not refresh WGMN water-quality data: ${error.message}`);
    await keepExistingOrWriteFallback(waterQualityOut, {
      station: 'WGMN Bunthaus',
      sourceUrl: WGMN_BUNTHAUS_URL,
      fetchedAt: null,
      proxyNote: 'Proxy-Wert: Messstation Bunthaus, nicht exakt am Spot Hoopte/Zollenspieker.',
      measurements: {},
    });
  }
}

await mkdir(dataDir, { recursive: true });
await prepareBshTides();
await prepareWaterQuality();
