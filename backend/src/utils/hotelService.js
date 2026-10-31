const xlsx = require('xlsx');
const path = require('path');
const logger = require('./logger');

class HotelService {
  constructor() {
    this.filePath = path.join(__dirname, '../../data/hotel_data.xlsx');
  }

  getHotelsByCity(city) {
    try {
      const workbook = xlsx.readFile(this.filePath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(sheet);
      
      // Filter by city (case insensitive)
      const targetCity = city.toLowerCase().trim();
      const hotels = data.filter(row => {
        // Assume column might be named 'City', 'Location', 'city', etc.
        const rowCity = row.City || row.city || row.Location || row.location || '';
        return rowCity.toLowerCase().trim() === targetCity;
      });

      return hotels.length > 0 ? hotels : data; // Fallback to all data if city not found for demo purposes
    } catch (err) {
      logger.error(`Error reading hotel data: ${err.message}`);
      return [];
    }
  }
}

module.exports = new HotelService();
