const BaseModel = require('./BaseModel');

class HotelModel extends BaseModel {
  constructor() {
    super('hotels', ['amenities']);
  }
}

module.exports = new HotelModel();
