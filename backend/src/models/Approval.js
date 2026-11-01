const BaseModel = require('./BaseModel');

class ApprovalModel extends BaseModel {
  constructor() {
    super('approvals', []);
  }
}

module.exports = new ApprovalModel();
