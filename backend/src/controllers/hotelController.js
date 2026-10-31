const axios = require('axios');
const Hotel = require('../models/Hotel');

/**
 * GET /api/hotels/:city
 * Returns hotel data for a city using MongoDB cache, SerpApi fallback, and mock fallback.
 */
exports.getHotelsByCityEndpoint = async (req, res) => {
  try {
    const { city } = req.params;
    if (!city) {
      return res.status(400).json({ success: false, message: 'City parameter is required.' });
    }

    const hotels = await getHotelsByCity(city);
    return res.status(200).json({ success: true, data: hotels });
  } catch (error) {
    console.error('[HotelController] Endpoint error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch hotels. Please try again later.' });
  }
};

/**
 * Core caching logic: DB first → SerpApi fallback → Mock fallback
 */
async function getHotelsByCity(city) {
  const normalizedCity = city.toLowerCase().trim();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const cutoffTime = new Date(Date.now() - ONE_DAY_MS);

  // ─── STEP 1: Check MongoDB for fresh cached data ──────────────────
  try {
    const cachedHotels = await Hotel.find({
      city: normalizedCity,
      createdAt: { $gte: cutoffTime }
    }).sort({ rating: -1 }).limit(10);

    if (cachedHotels && cachedHotels.length > 0) {
      console.log(`[Hotels] ✅ Fetched from DB for city: ${city} (${cachedHotels.length} results)`);
      return cachedHotels;
    }
  } catch (dbErr) {
    console.error('[Hotels] DB read error:', dbErr.message);
  }

  // ─── STEP 2: Fetch from SerpApi ────────────────────────────────────
  const apiKey = process.env.SERP_API_KEY;
  if (apiKey) {
    try {
      // Build check-in / check-out dates (tomorrow + day after)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);

      const checkIn = tomorrow.toISOString().split('T')[0];   // YYYY-MM-DD
      const checkOut = dayAfter.toISOString().split('T')[0];

      console.log(`[Hotels] 🔍 Calling SerpApi for city: ${city} (${checkIn} → ${checkOut})`);

      const response = await axios.get('https://serpapi.com/search', {
        params: {
          engine: 'google_hotels',
          q: `hotels in ${city}`,
          check_in_date: checkIn,
          check_out_date: checkOut,
          adults: 1,
          currency: 'INR',
          gl: 'in',
          hl: 'en',
          api_key: apiKey
        },
        timeout: 15000
      });

      console.log('[Hotels] SerpApi response keys:', Object.keys(response.data));

      const results = response.data.properties || [];
      console.log(`[Hotels] SerpApi returned ${results.length} properties`);

      if (results.length > 0) {
        const hotelsToSave = [];
        const topResults = results.slice(0, 10);

        for (const item of topResults) {
          const name = item.name;
          if (!name) continue;

          // Extract price — handle string like "$150", "₹5,000" or numeric
          let price = '5000';
          const priceRaw = item.rate_per_night?.lowest
            || item.rate_per_night?.extracted_lowest
            || item.total_rate?.lowest
            || null;
          if (typeof priceRaw === 'string') {
            const nums = priceRaw.replace(/[^0-9]/g, '');
            if (nums) price = nums;
          } else if (typeof priceRaw === 'number') {
            price = priceRaw.toString();
          }

          hotelsToSave.push({
            name,
            city: normalizedCity,
            state: null,
            price,
            rating: item.overall_rating || item.rating || 4.0,
            amenities: item.amenities || [],
            address: item.address || null,
            source: 'serpapi'
          });
        }

        if (hotelsToSave.length > 0) {
          // Clear old cache for this city and insert fresh data
          await Hotel.deleteMany({ city: normalizedCity });
          await Hotel.insertMany(hotelsToSave);
          console.log(`[Hotels] ✅ Fetched from SerpApi for city: ${city} (${hotelsToSave.length} saved)`);

          return await Hotel.find({ city: normalizedCity }).sort({ rating: -1 }).limit(10);
        }
      }
    } catch (apiErr) {
      console.error('[Hotels] ❌ SerpApi error:', apiErr.response?.data || apiErr.message);
    }
  } else {
    console.warn('[Hotels] ⚠️  SERP_API_KEY is not set in environment');
  }

  // ─── STEP 3: Check for any old (expired) DB data as fallback ───────
  try {
    const oldData = await Hotel.find({ city: normalizedCity }).sort({ rating: -1 }).limit(10);
    if (oldData.length > 0) {
      console.log(`[Hotels] ♻️  Fetched from DB (expired fallback) for city: ${city}`);
      return oldData;
    }
  } catch (dbErr) {
    console.error('[Hotels] DB fallback read error:', dbErr.message);
  }

  // ─── STEP 4: Generate mock data so the UI never breaks ─────────────
  console.log(`[Hotels] 🏨 Using mock data for city: ${city}`);
  const capitalCity = city.charAt(0).toUpperCase() + city.slice(1);
  const mockHotels = [
    { name: `Taj ${capitalCity}`,             price: '8500',  rating: 4.7, amenities: ['WiFi', 'Pool', 'Spa', 'Restaurant', 'Gym'],        address: `MG Road, ${capitalCity}` },
    { name: `ITC Grand ${capitalCity}`,       price: '7200',  rating: 4.6, amenities: ['WiFi', 'Pool', 'Fine Dining', 'Business Center'], address: `Station Road, ${capitalCity}` },
    { name: `Hyatt Regency ${capitalCity}`,   price: '6800',  rating: 4.5, amenities: ['WiFi', 'Pool', 'Spa', 'Bar'],                     address: `Central ${capitalCity}` },
    { name: `Marriott ${capitalCity}`,        price: '6500',  rating: 4.4, amenities: ['WiFi', 'Gym', 'Restaurant', 'Parking'],           address: `Business District, ${capitalCity}` },
    { name: `Novotel ${capitalCity}`,         price: '5200',  rating: 4.3, amenities: ['WiFi', 'Pool', 'Restaurant'],                     address: `Airport Road, ${capitalCity}` },
    { name: `Radisson Blu ${capitalCity}`,    price: '5800',  rating: 4.3, amenities: ['WiFi', 'Spa', 'Bar', 'Restaurant'],               address: `Lake View, ${capitalCity}` },
    { name: `Holiday Inn ${capitalCity}`,     price: '4200',  rating: 4.1, amenities: ['WiFi', 'Breakfast', 'Parking'],                   address: `NH Road, ${capitalCity}` },
    { name: `Lemon Tree ${capitalCity}`,      price: '3500',  rating: 4.0, amenities: ['WiFi', 'Restaurant', 'Gym'],                      address: `Tech Park, ${capitalCity}` },
    { name: `OYO Townhouse ${capitalCity}`,   price: '2200',  rating: 3.8, amenities: ['WiFi', 'AC', 'TV'],                               address: `Market Area, ${capitalCity}` },
    { name: `FabHotel Prime ${capitalCity}`,  price: '1800',  rating: 3.6, amenities: ['WiFi', 'AC', 'Parking'],                          address: `Old City, ${capitalCity}` },
  ];

  // Save mock data to DB so next time it loads from cache
  const docsToSave = mockHotels.map(h => ({
    ...h,
    city: normalizedCity,
    state: null,
    source: 'mock'
  }));

  try {
    await Hotel.deleteMany({ city: normalizedCity });
    await Hotel.insertMany(docsToSave);
  } catch (saveErr) {
    console.error('[Hotels] Failed to save mock data:', saveErr.message);
  }

  return await Hotel.find({ city: normalizedCity }).sort({ rating: -1 }).limit(10);
}

exports.getHotelsByCity = getHotelsByCity;
