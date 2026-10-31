/**
 * Planning Agent
 * Generates multi-modal travel route options for a trip request.
 * Calls mock transport APIs and returns raw route candidates.
 */

const { searchFlights, searchTrains, searchMetro, searchBuses } = require('../services/mockApiService');
const logger = require('../utils/logger');

// Distance matrix (km) — used to pick relevant transport modes
const CITY_DISTANCE = {
  'Mumbai-Delhi':    1400, 'Delhi-Mumbai':    1400,
  'Mumbai-Bangalore': 980, 'Bangalore-Mumbai': 980,
  'Delhi-Bangalore': 2150, 'Bangalore-Delhi': 2150,
  'Mumbai-Pune':      150, 'Pune-Mumbai':      150,
  'Delhi-Agra':       200, 'Agra-Delhi':       200,
  'Mumbai-Goa':       590, 'Goa-Mumbai':       590,
  'Chennai-Bangalore': 350,'Bangalore-Chennai': 350,
  'Hyderabad-Bangalore': 575, 'Bangalore-Hyderabad': 575,
  'Delhi-Jaipur':      270, 'Jaipur-Delhi':     270,
  'Kolkata-Bhubaneswar': 440, 'Bhubaneswar-Kolkata': 440,
};

const getDistance = (from, to) => {
  const key = `${from}-${to}`;
  return CITY_DISTANCE[key] || 800; // default 800 km
};

/**
 * Builds route segments for a given transport mode combination.
 */
const buildRoute = (mode, transportData, from, to) => {
  switch (mode) {
    case 'flight':
      return transportData.flights.map(f => ({
        segments: [
          { mode: 'metro', from: `${from} Office`, to: `${from} Airport`, operator: 'Metro', durationMins: 45, cost: 60, departureTime: subtractMins(f.departureTime, 120), arrivalTime: subtractMins(f.departureTime, 75) },
          { mode: 'flight', from: `${from} Airport`, to: `${to} Airport`, operator: f.airline, flightNo: f.flightNo, departureTime: f.departureTime, arrivalTime: f.arrivalTime, durationMins: f.durationMins, cost: f.economyCost, class: 'economy' },
          { mode: 'cab',   from: `${to} Airport`,   to: `${to} City Centre`, operator: 'Cab', durationMins: 45, cost: 350, departureTime: f.arrivalTime, arrivalTime: addMins(f.arrivalTime, 45) }
        ],
        rawData: f
      }));

    case 'train':
      return transportData.trains.map(t => ({
        segments: [
          { mode: 'metro', from: `${from} Office`, to: `${from} Station`, operator: 'Metro', durationMins: 30, cost: 40, departureTime: subtractMins(t.departureTime, 60), arrivalTime: subtractMins(t.departureTime, 30) },
          { mode: 'train', from: `${from} Station`, to: `${to} Station`, operator: t.operator, flightNo: t.trainNo, departureTime: t.departureTime, arrivalTime: t.arrivalTime, durationMins: t.durationMins, cost: t.classes['3A'] || t.classes['2A'], class: '3A AC' },
          { mode: 'bus',   from: `${to} Station`,   to: `${to} City Centre`, operator: 'Local Bus', durationMins: 30, cost: 30, departureTime: t.arrivalTime, arrivalTime: addMins(t.arrivalTime, 30) }
        ],
        rawData: t
      }));

    case 'bus':
      return transportData.buses.map(b => ({
        segments: [
          { mode: 'metro', from: `${from} Office`, to: `${from} Bus Terminal`, operator: 'Metro', durationMins: 30, cost: 35, departureTime: subtractMins(b.departureTime, 60), arrivalTime: subtractMins(b.departureTime, 30) },
          { mode: 'bus', from: `${from} Bus Terminal`, to: `${to} Bus Terminal`, operator: b.operator, departureTime: b.departureTime, arrivalTime: b.arrivalTime, durationMins: b.durationMins, cost: b.cost, class: b.class },
          { mode: 'cab', from: `${to} Bus Terminal`, to: `${to} City Centre`, operator: 'Auto/Cab', durationMins: 20, cost: 150, departureTime: b.arrivalTime, arrivalTime: addMins(b.arrivalTime, 20) }
        ],
        rawData: b
      }));

    default:
      return [];
  }
};

// ── Time helpers ─────────────────────────────────────────────────────────────

const timeToMins = (timeStr) => {
  const [h, m] = (timeStr || '08:00').replace('+1', '').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

const minsToTime = (mins) => {
  const h = Math.floor(((mins % 1440) + 1440) % 1440 / 60);
  const m = ((mins % 1440) + 1440) % 1440 % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const subtractMins = (timeStr, mins) => minsToTime(timeToMins(timeStr) - mins);
const addMins      = (timeStr, mins) => minsToTime(timeToMins(timeStr) + mins);

// ── Main planning function ───────────────────────────────────────────────────

/**
 * @param {Object} tripParams - { fromCity, toCity, travelDate, returnDate, travelMode, preferenceNote }
 * @param {string} userRole   - for mode filtering
 * @returns {Array}           - array of route candidates
 */
const generateRoutes = async (tripParams, userRole = 'employee') => {
  const { fromCity, toCity, travelDate } = tripParams;
  logger.info(`[PlanningAgent] Generating routes: ${fromCity} → ${toCity} on ${travelDate}`);

  const distance = getDistance(fromCity, toCity);
  logger.info(`[PlanningAgent] Estimated distance: ${distance} km`);

  // Determine which modes are feasible
  const modesAvailable = [];
  if (distance > 400 && ['manager', 'finance', 'admin'].includes(userRole)) modesAvailable.push('flight');
  if (distance < 1500) modesAvailable.push('train');
  if (distance < 600)  modesAvailable.push('bus');

  if (modesAvailable.length === 0) modesAvailable.push('train', 'flight');

  // Fetch all transport options in parallel
  const [flights, trains, buses] = await Promise.all([
    modesAvailable.includes('flight') ? searchFlights(fromCity, toCity, travelDate) : Promise.resolve([]),
    modesAvailable.includes('train')  ? searchTrains(fromCity, toCity, travelDate)  : Promise.resolve([]),
    modesAvailable.includes('bus')    ? searchBuses(fromCity, toCity, travelDate)   : Promise.resolve([])
  ]);

  const transportData = { flights, trains, buses };
  let allRoutes = [];

  if (flights.length) allRoutes.push(...buildRoute('flight', transportData, fromCity, toCity));
  if (trains.length)  allRoutes.push(...buildRoute('train',  transportData, fromCity, toCity));
  if (buses.length)   allRoutes.push(...buildRoute('bus',    transportData, fromCity, toCity));

  if (tripParams.returnDate) {
    allRoutes = allRoutes.map(route => {
      const returnSegments = [...route.segments].reverse().map(seg => {
        return {
          ...seg,
          from: seg.to,
          to: seg.from,
          departureTime: addMins(seg.departureTime, 720), // 12 hours later
          arrivalTime: addMins(seg.arrivalTime, 720)
        };
      });
      return {
        ...route,
        segments: [...route.segments, ...returnSegments]
      };
    });
  }

  // Annotate each route with totals
  const annotatedRoutes = allRoutes.map(r => {
    const totalCost     = r.segments.reduce((s, seg) => s + (seg.cost || 0), 0);
    const totalDuration = r.segments.reduce((s, seg) => s + (seg.durationMins || 0), 0);
    const mainSegment   = r.segments.find(s => ['flight', 'train', 'bus'].includes(s.mode));
    return {
      ...r,
      totalCost,
      totalDuration,
      primaryMode: mainSegment?.mode || 'mixed',
      operator:    mainSegment?.operator,
      flightNo:    mainSegment?.flightNo
    };
  });

  logger.info(`[PlanningAgent] Generated ${annotatedRoutes.length} route candidates`);
  return annotatedRoutes;
};

module.exports = { generateRoutes };
