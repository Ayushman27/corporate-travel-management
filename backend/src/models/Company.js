const BaseModel = require('./BaseModel');

class CompanyModel extends BaseModel {
  constructor() {
    super('companies', ['policy']);
  }
}

module.exports = new CompanyModel();
