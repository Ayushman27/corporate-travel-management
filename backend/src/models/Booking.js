const BaseModel = require('./BaseModel');

class BookingModel extends BaseModel {
  constructor() {
    super('bookings', ['tickets']);
  }
}

module.exports = new BookingModel();
