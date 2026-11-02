const BaseModel = require('./BaseModel');

class BudgetModel extends BaseModel {
  constructor() {
    super('budgets', []);
  }
}

module.exports = new BudgetModel();

