const BaseModel = require('./BaseModel');

class TripModel extends BaseModel {
  constructor() {
    super('trips', ['selectedHotel', 'chatHistory']);
  }
}

module.exports = new TripModel();
