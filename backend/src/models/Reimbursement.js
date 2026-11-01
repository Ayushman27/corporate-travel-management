const BaseModel = require('./BaseModel');

class ReimbursementModel extends BaseModel {
  constructor() {
    super('reimbursements', ['bills']);
  }
}

module.exports = new ReimbursementModel();
