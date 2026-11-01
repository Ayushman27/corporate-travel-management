const BaseModel = require('./BaseModel');

class PlanModel extends BaseModel {
  constructor() {
    super('plans', ['segments', 'highlights', 'warnings']);
  }
}

module.exports = new PlanModel();
