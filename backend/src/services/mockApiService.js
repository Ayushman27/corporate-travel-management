/**
 * Mock external API responses — Flight, Train (IRCTC), Metro, Hotel, WhatsApp.
 * Replace with real API calls in production.
 */

const { withRetry } = require('../utils/retryHelper');
const logger = require('../utils/logger');

const delay = (ms) => new Promise(r => setTimeout(r, ms));

// ── Flight mock ───────────────────────────────────────────────────────────────

const searchFlights = async (from, to, date) => {
  await delay(300); // simulate API latency
  const airlines = ['IndiGo', 'Air India', 'SpiceJet', 'Vistara', 'AkasaAir'];
  const results  = airlines.slice(0, 3).map((airline, i) => ({
    flightNo:      `${airline.substring(0, 2).toUpperCase()}${100 + i * 47}`,
    airline,
    from, to,
    date,
    departureTime: `${6 + i * 3}:${i % 2 === 0 ? '00' : '30'}`,
    arrivalTime:   `${8 + i * 3}:${i % 2 === 0 ? '30' : '00'}`,
    durationMins:  90 + i * 15,
    economyCost:   Math.floor(3500 + Math.random() * 4000 + i * 800),
    businessCost:  Math.floor(10000 + Math.random() * 8000 + i * 1500),
    seatsAvailable: 24 - i * 3,
    class:         'economy'
  }));
  logger.info(`[MockFlight] ${results.length} flights found ${from} → ${to}`);
  return results;
};

// ── Train (IRCTC) mock ────────────────────────────────────────────────────────

const searchTrains = async (from, to, date) => {
  await delay(250);
  const trains = [
    { name: 'Rajdhani Express', no: '12301', sleeper: 800,  ac3: 1800, ac2: 2800, ac1: 4500, durationMins: 480 },
    { name: 'Shatabdi Express', no: '12009', sleeper: null, ac3: 1500, ac2: 2500, ac1: null,  durationMins: 360 },
    { name: 'Duronto Express',  no: '12213', sleeper: 750,  ac3: 1650, ac2: 2650, ac1: 4000, durationMins: 420 },
  ];

  return trains.map(t => ({
    trainNo:  t.no,
    name:     t.name,
    from, to, date,
    departureTime: '06:00',
    arrivalTime:   `${(6 + Math.floor(t.durationMins / 60)) % 24}:${String(t.durationMins % 60).padStart(2, '0')}`,
    durationMins:  t.durationMins,
    classes: {
      sleeper: t.sleeper,
      '3A':    t.ac3,
      '2A':    t.ac2,
      '1A':    t.ac1
    },
    operator: 'Indian Railways'
  }));
};

// ── Metro mock ────────────────────────────────────────────────────────────────

const searchMetro = async (from, to) => {
  await delay(100);
  return [{
    from, to,
    line:          'Metro Line 1',
    durationMins:  30,
    cost:          45,
    operator:      'DMRC / Metro',
    frequency:     '5 mins',
    departureTime: 'Every 5 min (6:00 AM - 11:00 PM)'
  }];
};

// ── Bus mock ──────────────────────────────────────────────────────────────────

const searchBuses = async (from, to, date) => {
  await delay(150);
  return [
    {
      operator:      'KSRTC Airavata',
      from, to, date,
      departureTime: '22:00',
      arrivalTime:   '06:00+1',
      durationMins:  480,
      cost:          900,
      class:         'AC Sleeper',
      seatsAvailable: 12
    },
    {
      operator:      'VRL Travels',
      from, to, date,
      departureTime: '21:30',
      arrivalTime:   '05:30+1',
      durationMins:  480,
      cost:          750,
      class:         'Sleeper',
      seatsAvailable: 8
    }
  ];
};

// ── Hotel mock ────────────────────────────────────────────────────────────────

const searchHotels = async (city, checkIn, checkOut) => {
  await delay(200);
  return [
    { name: 'The Lalit', city, checkIn, checkOut, costPerNight: 6000, rating: 5, type: 'luxury' },
    { name: 'Lemon Tree',city, checkIn, checkOut, costPerNight: 3500, rating: 4, type: 'business' },
    { name: 'OYO Rooms', city, checkIn, checkOut, costPerNight: 1500, rating: 3, type: 'budget' },
  ];
};

// ── WhatsApp mock ─────────────────────────────────────────────────────────────

const sendWhatsApp = async ({ to, message, templateName, params }) => {
  await withRetry(
    async () => {
      await delay(200); // simulate API call
      // In production: axios.post(process.env.WHATSAPP_API_URL, {...})
      logger.info(`[WhatsApp] → ${to}: ${templateName || 'custom'} — ${message?.substring(0, 80)}`);
      return { messageId: `WA_${Date.now()}`, status: 'sent' };
    },
    { maxAttempts: 3, label: 'WhatsApp send' }
  );
  return { success: true, to, timestamp: new Date().toISOString() };
};

// ── Mock booking confirmation ─────────────────────────────────────────────────

const confirmBooking = async (segment) => {
  await delay(400);
  const prefixes = { flight: 'PNR', train: 'TRN', bus: 'BUS', metro: 'MET', cab: 'CAB' };
  const prefix   = prefixes[segment.mode] || 'BKG';
  return {
    refNo:  `${prefix}${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
    status: 'confirmed',
    seat:   `${String.fromCharCode(65 + Math.floor(Math.random() * 6))}${Math.floor(Math.random() * 30) + 1}`
  };
};

module.exports = {
  searchFlights, searchTrains, searchMetro, searchBuses, searchHotels,
  sendWhatsApp, confirmBooking
};
