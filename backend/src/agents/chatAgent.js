/**
 * Chat Agent
 * Conversational interface for trip modification.
 * Supports Groq / OpenAI / Gemini / mock (context-aware rule-based) backends.
 *
 * FIX: Mock is now fully context-aware (reads last assistant message to handle
 *      yes/no replies). After any tripUpdates, plans are regenerated automatically.
 */

const axios            = require('axios');
const Trip             = require('../models/Trip');
const logger           = require('../utils/logger');
const { generateRoutes }  = require('./planningAgent');
const { optimizeRoutes }  = require('./optimizationAgent');

const PROVIDER = process.env.LLM_PROVIDER || 'mock';

// ── LLM Call abstraction ─────────────────────────────────────────────────────

const callLLM = async (messages) => {
  if (PROVIDER === 'groq') {
    const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model:       process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.4,
      max_tokens:  600
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type':  'application/json'
      }
    });
    return res.data.choices[0].message.content;
  }

  if (PROVIDER === 'openai') {
    const res = await axios.post('https://api.openai.com/v1/chat/completions', {
      model:       'gpt-4o-mini',
      messages,
      temperature: 0.4,
      max_tokens:  600
    }, {
      headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` }
    });
    return res.data.choices[0].message.content;
  }

  if (PROVIDER === 'gemini') {
    const contents = messages.filter(m => m.role !== 'system').map(m => ({
      role:  m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));
    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      { contents },
      { headers: { 'Content-Type': 'application/json' } }
    );
    return res.data.candidates[0].content.parts[0].text;
  }

  // ── Context-aware mock fallback ────────────────────────────────────────────
  return mockResponse(messages);
};

/**
 * Context-aware rule-based mock — reads the full conversation so it can
 * handle affirmative / negative replies correctly and emit TRIP_UPDATE blocks.
 */
const mockResponse = (messages) => {
  const lastUserMsg = messages[messages.length - 1].content.toLowerCase().trim();

  // Find the most recent assistant turn
  const assistantTurns = messages.filter(m => m.role === 'assistant');
  const lastBot = assistantTurns.length > 0
    ? assistantTurns[assistantTurns.length - 1].content.toLowerCase()
    : '';

  // ── Affirmative intent ───────────────────────────────────────────────────
  const isYes = /^(yes|yeah|yep|sure|ok|okay|please|do it|go ahead|confirm|agree|sounds good|perfect|great|fine|alright|yup|absolutely)/.test(lastUserMsg);
  // ── Negative intent ──────────────────────────────────────────────────────
  const isNo  = /^(no|nope|nah|don't|dont|cancel|skip|stop|never mind|nevermind|not really|na)/.test(lastUserMsg);

  // ── Context: bot suggested train → user says yes ─────────────────────────
  if (isYes && (lastBot.includes('train') || lastBot.includes('ac 2-tier') || lastBot.includes('3-tier') || lastBot.includes('rajdhani') || lastBot.includes('shatabdi'))) {
    return 'Perfect! Switching your travel mode to train — this typically saves 40–60% over flights. Regenerating your plans now.\nTRIP_UPDATE: {"travelMode":"train"}';
  }

  // ── Context: bot suggested flight → user says yes ────────────────────────
  if (isYes && (lastBot.includes('flight') || lastBot.includes('fly') || lastBot.includes('airline') || lastBot.includes('airport'))) {
    return 'Great! Switching your travel mode to flight for faster travel. Regenerating your plans now.\nTRIP_UPDATE: {"travelMode":"flight"}';
  }

  // ── Context: bot suggested bus → user says yes ───────────────────────────
  if (isYes && lastBot.includes('bus')) {
    return 'Got it! Switching to bus — most economical option. Regenerating plans now.\nTRIP_UPDATE: {"travelMode":"bus"}';
  }

  // ── Context: bot suggested lowest-cost / cheapest → user says yes ────────
  if (isYes && (lastBot.includes('lower-cost') || lastBot.includes('cheapest') || lastBot.includes('economical') || lastBot.includes('budget'))) {
    return 'Done! Setting your preference to lowest cost. Switching to train and regenerating plans.\nTRIP_UPDATE: {"travelMode":"train","preferenceNote":"lowest cost preferred"}';
  }

  // ── Context: bot suggested fastest route → user says yes ─────────────────
  if (isYes && (lastBot.includes('fastest') || lastBot.includes('direct flight') || lastBot.includes('quickest'))) {
    return 'Done! Setting your preference to fastest route and switching to flight. Regenerating plans.\nTRIP_UPDATE: {"travelMode":"flight","preferenceNote":"fastest route preferred"}';
  }

  // ── Generic yes with some previous context ───────────────────────────────
  if (isYes && lastBot.length > 0) {
    return 'Got it! Applying the change and regenerating your plans now.\nTRIP_UPDATE: {"preferenceNote":"user confirmed update"}';
  }

  // ── User says no ─────────────────────────────────────────────────────────
  if (isNo) {
    return 'No problem! Is there anything else you\'d like to change — destination, date, budget, or travel mode?';
  }

  // ── Direct mode / preference requests (no prior context needed) ──────────

  if (lastUserMsg === 'cheapest option' || lastUserMsg.includes('cheapest') || lastUserMsg.includes('lowest cost')) {
    return 'I can get you the cheapest option — train travel is the most economical. Switching now and regenerating plans.\nTRIP_UPDATE: {"travelMode":"train","preferenceNote":"lowest cost preferred"}';
  }

  if (lastUserMsg === 'use flight instead' || lastUserMsg.includes('use flight') || lastUserMsg.includes('book flight')) {
    return 'Switching to flight for a faster journey. Regenerating plans now.\nTRIP_UPDATE: {"travelMode":"flight"}';
  }

  if (lastUserMsg === 'fastest route' || lastUserMsg.includes('fastest') || lastUserMsg.includes('quickest')) {
    return 'Switching to fastest route — this will prioritise flights. Regenerating plans.\nTRIP_UPDATE: {"travelMode":"flight","preferenceNote":"fastest route preferred"}';
  }

  if (lastUserMsg === 'change travel date' || (lastUserMsg.includes('date') && (lastUserMsg.includes('change') || lastUserMsg.includes('reschedule')))) {
    return 'Sure! Please share the new travel date (e.g. "20 June 2025") and I\'ll update your trip and regenerate plans.';
  }

  // ── Detect new date in message ────────────────────────────────────────────
  const dateMatch = lastUserMsg.match(/(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*(\d{4})?/i);
  if (dateMatch && lastBot.includes('date')) {
    const month = dateMatch[2];
    const day   = dateMatch[1].padStart(2, '0');
    const year  = dateMatch[3] || new Date().getFullYear();
    const MONTHS = { jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12' };
    const iso = `${year}-${MONTHS[month.toLowerCase().slice(0,3)]}-${day}`;
    return `Perfect! Updating your travel date to ${day} ${month} ${year}. Regenerating plans.\nTRIP_UPDATE: {"travelDate":"${iso}"}`;
  }

  // ── Budget / cost intent (ask clarifying q) ───────────────────────────────
  if (lastUserMsg.includes('budget') || lastUserMsg.includes('cost') || lastUserMsg.includes('cheap') || lastUserMsg.includes('expensive')) {
    return 'I can find lower-cost options for you. Train travel typically saves 40–60% compared to flights. Would you like me to switch your travel mode to train?';
  }

  if (lastUserMsg.includes('flight') || lastUserMsg.includes('fly') || lastUserMsg.includes('plane')) {
    return 'Switching your travel mode to flight for faster travel. Regenerating your plans now.\nTRIP_UPDATE: {"travelMode":"flight"}';
  }

  if (lastUserMsg.includes('train') || lastUserMsg.includes('rail')) {
    return 'Switching your travel mode to train — comfortable and eco-friendly. Regenerating plans.\nTRIP_UPDATE: {"travelMode":"train"}';
  }

  if (lastUserMsg.includes('bus') || lastUserMsg.includes('road')) {
    return 'Switching your travel mode to bus — most economical for the route. Regenerating plans.\nTRIP_UPDATE: {"travelMode":"bus"}';
  }

  if (lastUserMsg.includes('hotel') || lastUserMsg.includes('accommodation') || lastUserMsg.includes('stay')) {
    return 'I can note your accommodation preference. Would you like budget, business, or luxury hotel options?';
  }

  if (lastUserMsg.includes('cancel')) {
    return 'To cancel the trip, please use the "Cancel Trip" button on the trip details page. Would you like to modify the dates instead?';
  }

  return 'What would you like to change? I can update the travel mode (flight/train/bus), travel date, budget preference, or route — just let me know!';
};

// ── System prompt ─────────────────────────────────────────────────────────────

const buildSystemPrompt = (trip) => `
You are a corporate travel assistant for a Travel Management System.
Help employees modify their business trips.

Current trip:
- Route: ${trip.fromCity} → ${trip.toCity}
- Date: ${trip.travelDate?.toDateString() || 'Not set'}
- Mode: ${trip.travelMode}
- Purpose: ${trip.purpose}
- Status: ${trip.status}
- Budget: ₹${trip.estimatedBudget?.toLocaleString('en-IN') || '—'}

Rules:
1. Only help with travel-related modifications.
2. Be concise and action-oriented — act immediately when the user confirms.
3. When user says yes/ok/sure/please/confirmed, act on your previous suggestion without asking again.
4. When making a change, always output a TRIP_UPDATE block in this exact format:
   TRIP_UPDATE: {"travelMode":"train"}
   Valid fields: fromCity, toCity, travelDate (ISO string YYYY-MM-DD), travelMode (flight/train/bus/mixed), estimatedBudget (number), preferenceNote (string)
5. After outputting TRIP_UPDATE, confirm what you changed in plain text.
6. Never ask the same clarifying question twice.

Example:
User: "switch to train"
Assistant: "Switching to train — this saves ~45% vs flight. Regenerating your plans.
TRIP_UPDATE: {"travelMode":"train"}"
`.trim();

// ── Extract structured changes from AI response ───────────────────────────────

const extractTripUpdates = (response) => {
  const match = response.match(/TRIP_UPDATE:\s*(\{[\s\S]*?\})/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch (_) {
    return null;
  }
};

// ── Strip TRIP_UPDATE block from reply shown to user ─────────────────────────

const cleanReply = (response) => response.replace(/TRIP_UPDATE:\s*\{[\s\S]*?\}/g, '').trim();

// ── Regenerate plans after trip update ───────────────────────────────────────

const regeneratePlans = async (trip) => {
  try {
    logger.info(`[ChatAgent] Regenerating plans for trip ${trip.tripId} with mode: ${trip.travelMode}`);
    const routes = await generateRoutes(
      {
        fromCity:       trip.fromCity,
        toCity:         trip.toCity,
        travelDate:     trip.travelDate,
        returnDate:     trip.returnDate,
        travelMode:     trip.travelMode,
        preferenceNote: trip.preferenceNote,
      },
      'employee'
    );
    const plans = await optimizeRoutes(trip.tripId, routes);
    logger.info(`[ChatAgent] Plans regenerated: ${plans.length} plans saved for ${trip.tripId}`);
    return plans;
  } catch (err) {
    logger.error(`[ChatAgent] Plan regeneration failed: ${err.message}`);
    return null;
  }
};

// ── Main chat function ────────────────────────────────────────────────────────

/**
 * @param {string} tripId
 * @param {string} userMessage
 * @param {Object} user
 * @returns {{ reply: string, tripUpdates: Object|null, updatedTrip: Object }}
 */
const chat = async (tripId, userMessage, user) => {
  const trip = await Trip.findOne({ tripId });
  if (!trip) throw new Error(`Trip ${tripId} not found`);

  const systemPrompt = buildSystemPrompt(trip);
  const history = trip.chatHistory.map(h => ({ role: h.role, content: h.content }));

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user',   content: userMessage }
  ];

  logger.info(`[ChatAgent] Processing message for trip ${tripId}: "${userMessage}"`);

  let rawReply;
  try {
    rawReply = await callLLM(messages);
  } catch (err) {
    logger.error(`[ChatAgent] LLM call failed: ${err.message} — using fallback`);
    rawReply = mockResponse(messages);
  }

  // Clean the reply shown to the user (remove TRIP_UPDATE block)
  const reply = cleanReply(rawReply);

  // Persist chat history (store clean reply)
  trip.chatHistory.push({ role: 'user',      content: userMessage });
  trip.chatHistory.push({ role: 'assistant', content: reply });

  // Apply any structured updates
  const tripUpdates = extractTripUpdates(rawReply);
  if (tripUpdates) {
    logger.info(`[ChatAgent] Applying trip updates: ${JSON.stringify(tripUpdates)}`);
    if (tripUpdates.fromCity)        trip.fromCity        = tripUpdates.fromCity;
    if (tripUpdates.toCity)          trip.toCity          = tripUpdates.toCity;
    if (tripUpdates.travelDate)      trip.travelDate      = new Date(tripUpdates.travelDate);
    if (tripUpdates.travelMode)      trip.travelMode      = tripUpdates.travelMode;
    if (tripUpdates.estimatedBudget) trip.estimatedBudget = tripUpdates.estimatedBudget;
    if (tripUpdates.preferenceNote)  trip.preferenceNote  = tripUpdates.preferenceNote;

    await trip.save();

    // ── Regenerate plans with updated parameters ───────────────────────────
    await regeneratePlans(trip);
  } else {
    await trip.save();
  }

  return { reply, tripUpdates, updatedTrip: trip };
};

module.exports = { chat };
