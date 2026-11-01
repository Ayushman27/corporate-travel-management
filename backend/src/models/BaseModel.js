const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const toSnakeCase = (str) => {
  if (str === '_id') return 'id';
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
};

const toCamelCase = (str) => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

class Query {
  constructor(modelClass, filter = {}, isSingle = false) {
    this.modelClass = modelClass;
    this.filter = filter || {};
    this.isSingle = isSingle;
    this._selectFields = null;
    this._sortFields = null;
    this._limitVal = null;
    this._skipVal = null;
    this._isLean = false;
    this._populates = [];
  }

  select(fields) {
    this._selectFields = fields;
    return this;
  }

  sort(sortObj) {
    this._sortFields = sortObj;
    return this;
  }

  limit(n) {
    this._limitVal = Number(n);
    return this;
  }

  skip(n) {
    this._skipVal = Number(n);
    return this;
  }

  lean() {
    this._isLean = true;
    return this;
  }

  populate(field, selectFields) {
    this._populates.push({ field, selectFields });
    return this;
  }

  async exec() {
    return await this.modelClass._runQuery(this);
  }

  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }

  catch(reject) {
    return this.exec().catch(reject);
  }
}

class BaseModel {
  constructor(tableName, jsonFields = []) {
    this.tableName = tableName;
    this.jsonFields = new Set(jsonFields);
  }

  _rowToDoc(row) {
    if (!row) return null;
    const doc = {};
    for (const [col, val] of Object.entries(row)) {
      const camel = toCamelCase(col);
      let parsedVal = val;
      if (this.jsonFields.has(camel) && typeof val === 'string') {
        try {
          parsedVal = JSON.parse(val);
        } catch (_) {}
      }
      doc[camel] = parsedVal;
    }

    if (row.id) {
      doc._id = row.id;
      doc.id = row.id;
    }

    // Array subdocument helper for bills or items
    if (Array.isArray(doc.bills)) {
      doc.bills.forEach((b) => {
        if (!b._id && !b.id) b._id = uuidv4();
        if (!b.id) b.id = b._id;
      });
      doc.bills.id = function (subId) {
        return this.find((b) => b._id === subId || b.id === subId);
      };
    }

    // Attach instance methods
    const model = this;
    const instance = {
      ...doc,
      save: async function () {
        return await model._saveInstance(this);
      },
      comparePassword: async function (candidate) {
        const hash = this.password || this.headPassword;
        if (!hash) return false;
        return await bcrypt.compare(candidate, hash);
      },
      toJSON: function () {
        const copy = { ...this };
        delete copy.password;
        delete copy.headPassword;
        delete copy.save;
        delete copy.comparePassword;
        delete copy.toJSON;
        delete copy.toObject;
        return copy;
      },
      toObject: function () {
        const copy = { ...this };
        delete copy.save;
        delete copy.comparePassword;
        delete copy.toJSON;
        delete copy.toObject;
        return copy;
      }
    };

    return instance;
  }

  _buildWhere(filter) {
    const clauses = [];
    const params = [];
    let idx = 1;

    for (let [key, val] of Object.entries(filter || {})) {
      if (val === undefined) continue;

      if (key === '_id' || key === 'id') {
        clauses.push(`id = $${idx++}`);
        params.push(val);
        continue;
      }

      // Check regex / object condition
      if (val && typeof val === 'object' && !(val instanceof Date)) {
        if (val.$regex) {
          clauses.push(`${toSnakeCase(key)} ILIKE $${idx++}`);
          params.push(`%${val.$regex}%`);
          continue;
        }
        if (val.$in && Array.isArray(val.$in)) {
          clauses.push(`${toSnakeCase(key)} = ANY($${idx++})`);
          params.push(val.$in);
          continue;
        }
      }

      clauses.push(`${toSnakeCase(key)} = $${idx++}`);
      params.push(val);
    }

    const whereClause = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
    return { whereClause, params, nextIdx: idx };
  }

  async _runQuery(queryObj) {
    const { whereClause, params, nextIdx } = this._buildWhere(queryObj.filter);

    let selectClause = '*';
    if (typeof queryObj._selectFields === 'string') {
      const parts = queryObj._selectFields.trim().split(/\s+/);
      const isExclude = parts.some((p) => p.startsWith('-'));
      if (!isExclude && parts.length > 0 && parts[0] !== '') {
        const cols = parts.map((p) => toSnakeCase(p));
        if (!cols.includes('id')) cols.unshift('id');
        selectClause = cols.join(', ');
      }
    }

    let sortClause = '';
    if (queryObj._sortFields) {
      const sortParts = [];
      for (const [k, dir] of Object.entries(queryObj._sortFields)) {
        const direction = dir === 1 || dir === 'asc' ? 'ASC' : 'DESC';
        sortParts.push(`${toSnakeCase(k)} ${direction}`);
      }
      if (sortParts.length > 0) {
        sortClause = `ORDER BY ${sortParts.join(', ')}`;
      }
    }

    let limitClause = '';
    let currentIdx = nextIdx;
    if (queryObj.isSingle) {
      limitClause = 'LIMIT 1';
    } else if (queryObj._limitVal) {
      limitClause = `LIMIT $${currentIdx++}`;
      params.push(queryObj._limitVal);
    }

    let offsetClause = '';
    if (queryObj._skipVal) {
      offsetClause = `OFFSET $${currentIdx++}`;
      params.push(queryObj._skipVal);
    }

    const sql = `SELECT ${selectClause} FROM ${this.tableName} ${whereClause} ${sortClause} ${limitClause} ${offsetClause}`;
    const { rows } = await pool.query(sql, params);

    // Apply populate if requested
    if (queryObj._populates.length > 0) {
      for (const pop of queryObj._populates) {
        if (pop.field === 'employeeId') {
          for (const row of rows) {
            const empId = row.employee_id;
            if (empId) {
              const uRes = await pool.query('SELECT * FROM users WHERE id = $1 OR employee_id = $1 LIMIT 1', [empId]);
              if (uRes.rows[0]) {
                const u = uRes.rows[0];
                row.employee_id = {
                  _id: u.id,
                  id: u.id,
                  name: u.name,
                  email: u.email,
                  employeeId: u.employee_id,
                  department: u.department
                };
              }
            }
          }
        }
      }
    }

    if (queryObj.isSingle) {
      if (rows.length === 0) return null;
      const doc = this._rowToDoc(rows[0]);
      return queryObj._isLean ? doc.toObject() : doc;
    }

    return rows.map((r) => {
      const doc = this._rowToDoc(r);
      return queryObj._isLean ? doc.toObject() : doc;
    });
  }

  find(filter) {
    return new Query(this, filter, false);
  }

  findOne(filter) {
    return new Query(this, filter, true);
  }

  findById(id) {
    return new Query(this, { id }, true);
  }

  async create(data) {
    if (Array.isArray(data)) {
      return await this.insertMany(data);
    }

    const docId = data.id || data._id || uuidv4();
    const docData = { ...data, id: docId };

    if (docData.password && !docData.password.startsWith('$2')) {
      docData.password = await bcrypt.hash(docData.password, 12);
    }
    if (docData.headPassword && !docData.headPassword.startsWith('$2')) {
      docData.headPassword = await bcrypt.hash(docData.headPassword, 12);
    }

    const cols = [];
    const valPlaceholders = [];
    const values = [];
    let idx = 1;

    for (const [key, val] of Object.entries(docData)) {
      if (key === '_id') continue;
      const col = toSnakeCase(key);
      cols.push(col);
      valPlaceholders.push(`$${idx++}`);
      const isJson = this.jsonFields.has(key) || (typeof val === 'object' && val !== null && !(val instanceof Date));
      values.push(isJson ? JSON.stringify(val) : val);
    }

    const sql = `INSERT INTO ${this.tableName} (${cols.join(', ')}) VALUES (${valPlaceholders.join(', ')}) RETURNING *`;
    const { rows } = await pool.query(sql, values);
    return this._rowToDoc(rows[0]);
  }

  async insertMany(docs) {
    const results = [];
    for (const d of docs) {
      const created = await this.create(d);
      results.push(created);
    }
    return results;
  }

  async countDocuments(filter = {}) {
    const { whereClause, params } = this._buildWhere(filter);
    const sql = `SELECT COUNT(*) FROM ${this.tableName} ${whereClause}`;
    const { rows } = await pool.query(sql, params);
    return parseInt(rows[0].count, 10);
  }

  async findOneAndUpdate(filter, update, options = {}) {
    let existing = await this.findOne(filter);
    const updatePayload = update.$set ? { ...update.$set } : { ...update };
    delete updatePayload.$set;

    if (!existing) {
      if (options.upsert) {
        return await this.create({ ...filter, ...updatePayload });
      }
      return null;
    }

    // Apply updates
    for (const [k, v] of Object.entries(updatePayload)) {
      existing[k] = v;
    }
    await this._saveInstance(existing);
    return existing;
  }

  async findByIdAndUpdate(id, update, options = {}) {
    return await this.findOneAndUpdate({ id }, update, options);
  }

  async updateOne(filter, update) {
    const doc = await this.findOneAndUpdate(filter, update);
    return { modifiedCount: doc ? 1 : 0 };
  }

  async updateMany(filter, update) {
    const updatePayload = update.$set ? { ...update.$set } : { ...update };
    const docs = await this.find(filter);
    let count = 0;
    for (const doc of docs) {
      for (const [k, v] of Object.entries(updatePayload)) {
        doc[k] = v;
      }
      await this._saveInstance(doc);
      count++;
    }
    return { modifiedCount: count };
  }

  async deleteOne(filter) {
    const { whereClause, params } = this._buildWhere(filter);
    const sql = `DELETE FROM ${this.tableName} WHERE id IN (SELECT id FROM ${this.tableName} ${whereClause} LIMIT 1)`;
    const res = await pool.query(sql, params);
    return { deletedCount: res.rowCount };
  }

  async deleteMany(filter) {
    const { whereClause, params } = this._buildWhere(filter);
    const sql = `DELETE FROM ${this.tableName} ${whereClause}`;
    const res = await pool.query(sql, params);
    return { deletedCount: res.rowCount };
  }

  async _saveInstance(instance) {
    const docId = instance.id || instance._id;
    const cols = [];
    const values = [];
    let idx = 1;

    for (const [key, val] of Object.entries(instance)) {
      if (['_id', 'id', 'save', 'comparePassword', 'toJSON', 'toObject', 'updatedAt', 'updated_at'].includes(key)) continue;
      const col = toSnakeCase(key);
      cols.push(`${col} = $${idx++}`);
      const isJson = this.jsonFields.has(key) || (typeof val === 'object' && val !== null && !(val instanceof Date));
      values.push(isJson ? JSON.stringify(val) : val);
    }

    cols.push(`updated_at = NOW()`);
    values.push(docId);

    const sql = `UPDATE ${this.tableName} SET ${cols.join(', ')} WHERE id = $${idx} RETURNING *`;
    const { rows } = await pool.query(sql, values);
    if (rows.length > 0) {
      const updatedDoc = this._rowToDoc(rows[0]);
      Object.assign(instance, updatedDoc);
    }
    return instance;
  }
}

module.exports = BaseModel;
