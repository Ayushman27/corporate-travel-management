const BaseModel = require('./BaseModel');

class LogModel extends BaseModel {
  constructor() {
    super('logs', ['details']);
  }
}

module.exports = new LogModel();
