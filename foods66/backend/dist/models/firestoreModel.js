import { getFirestore } from '../config/firebase';
import crypto from 'crypto';
export class ObjectIdMock {
    constructor(id) {
        if (id) {
            this._str = id.toString();
        }
        else {
            this._str = crypto.randomBytes(12).toString('hex'); // 24-character hex
        }
    }
    toString() {
        return this._str;
    }
    toHexString() {
        return this._str;
    }
    valueOf() {
        return this._str;
    }
    toJSON() {
        return this._str;
    }
    equals(other) {
        if (!other)
            return false;
        return this._str === other.toString();
    }
    static isValid(val) {
        if (!val)
            return false;
        const str = typeof val === 'string' ? val : (val && typeof val.toString === 'function' ? val.toString() : '');
        if (!str || typeof str !== 'string')
            return false;
        // Valid for 24-hex MongoDB IDs, Firestore 20-char IDs, UUIDs, or general string IDs
        return str.length >= 8 && str.length <= 64;
    }
}
/** Recursively strips undefined keys so Firestore never rejects payloads */
export function removeUndefined(obj) {
    if (obj === null || obj === undefined || typeof obj !== 'object') {
        return obj;
    }
    if (obj instanceof Date || obj instanceof RegExp || obj instanceof ObjectIdMock) {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(removeUndefined);
    }
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
            result[key] = removeUndefined(value);
        }
    }
    return result;
}
// Utility to get nested property safely
export function getNestedValue(obj, path) {
    if (!obj || !path)
        return undefined;
    if (!path.includes('.'))
        return obj[path];
    const parts = path.split('.');
    let current = obj;
    for (const part of parts) {
        if (current === null || current === undefined)
            return undefined;
        current = current[part];
    }
    return current;
}
// Utility to set nested property safely
export function setNestedValue(obj, path, val) {
    if (!obj || !path)
        return;
    const parts = path.split('.');
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!current[part] || typeof current[part] !== 'object') {
            current[part] = {};
        }
        current = current[part];
    }
    current[parts[parts.length - 1]] = val;
}
// Evaluate MongoDB-style filter matching
export function matchesFilter(doc, filter) {
    if (!filter || Object.keys(filter).length === 0)
        return true;
    for (const key of Object.keys(filter)) {
        const condition = filter[key];
        if (key === '$or') {
            if (!Array.isArray(condition))
                return false;
            const anyMatch = condition.some((subFilter) => matchesFilter(doc, subFilter));
            if (!anyMatch)
                return false;
            continue;
        }
        if (key === '$and') {
            if (!Array.isArray(condition))
                return false;
            const allMatch = condition.every((subFilter) => matchesFilter(doc, subFilter));
            if (!allMatch)
                return false;
            continue;
        }
        const docValue = key === '_id' ? (doc._id || doc.id) : getNestedValue(doc, key);
        // If condition is an object with operator keys
        if (condition !== null && typeof condition === 'object' && !(condition instanceof Date) && !(condition instanceof RegExp)) {
            const opKeys = Object.keys(condition).filter(k => k.startsWith('$'));
            if (opKeys.length > 0) {
                for (const op of opKeys) {
                    const target = condition[op];
                    if (op === '$eq') {
                        if (String(docValue) !== String(target))
                            return false;
                    }
                    else if (op === '$ne') {
                        if (String(docValue) === String(target))
                            return false;
                    }
                    else if (op === '$gt') {
                        const dVal = docValue instanceof Date ? docValue.getTime() : (typeof docValue === 'string' && !isNaN(Date.parse(docValue)) ? new Date(docValue).getTime() : Number(docValue));
                        const tVal = target instanceof Date ? target.getTime() : (typeof target === 'string' && !isNaN(Date.parse(target)) ? new Date(target).getTime() : Number(target));
                        if (!(dVal > tVal))
                            return false;
                    }
                    else if (op === '$gte') {
                        const dVal = docValue instanceof Date ? docValue.getTime() : (typeof docValue === 'string' && !isNaN(Date.parse(docValue)) ? new Date(docValue).getTime() : Number(docValue));
                        const tVal = target instanceof Date ? target.getTime() : (typeof target === 'string' && !isNaN(Date.parse(target)) ? new Date(target).getTime() : Number(target));
                        if (!(dVal >= tVal))
                            return false;
                    }
                    else if (op === '$lt') {
                        const dVal = docValue instanceof Date ? docValue.getTime() : (typeof docValue === 'string' && !isNaN(Date.parse(docValue)) ? new Date(docValue).getTime() : Number(docValue));
                        const tVal = target instanceof Date ? target.getTime() : (typeof target === 'string' && !isNaN(Date.parse(target)) ? new Date(target).getTime() : Number(target));
                        if (!(dVal < tVal))
                            return false;
                    }
                    else if (op === '$lte') {
                        const dVal = docValue instanceof Date ? docValue.getTime() : (typeof docValue === 'string' && !isNaN(Date.parse(docValue)) ? new Date(docValue).getTime() : Number(docValue));
                        const tVal = target instanceof Date ? target.getTime() : (typeof target === 'string' && !isNaN(Date.parse(target)) ? new Date(target).getTime() : Number(target));
                        if (!(dVal <= tVal))
                            return false;
                    }
                    else if (op === '$in') {
                        if (!Array.isArray(target))
                            return false;
                        const targetStrings = target.map((t) => String(t && t._id ? t._id : t));
                        const dStr = String(docValue && docValue._id ? docValue._id : docValue);
                        if (!targetStrings.includes(dStr))
                            return false;
                    }
                    else if (op === '$nin') {
                        if (!Array.isArray(target))
                            return true;
                        const targetStrings = target.map((t) => String(t && t._id ? t._id : t));
                        const dStr = String(docValue && docValue._id ? docValue._id : docValue);
                        if (targetStrings.includes(dStr))
                            return false;
                    }
                    else if (op === '$exists') {
                        const exists = docValue !== undefined && docValue !== null;
                        if (Boolean(target) !== exists)
                            return false;
                    }
                    else if (op === '$regex') {
                        const regex = new RegExp(target, condition.$options || '');
                        if (!regex.test(String(docValue || '')))
                            return false;
                    }
                }
                continue;
            }
        }
        if (condition instanceof RegExp) {
            if (!condition.test(String(docValue || '')))
                return false;
            continue;
        }
        if (condition instanceof Date) {
            const d1 = docValue instanceof Date ? docValue.getTime() : new Date(docValue).getTime();
            if (d1 !== condition.getTime())
                return false;
            continue;
        }
        // Direct comparison
        if (key === '_id') {
            const condId = String(condition && condition._id ? condition._id : condition);
            const docId = String(doc._id || doc.id);
            if (condId !== docId)
                return false;
            continue;
        }
        if (docValue !== condition) {
            // Loose string equality check for IDs/numbers if needed
            if (String(docValue) !== String(condition)) {
                return false;
            }
        }
    }
    return true;
}
// Applies updates (supports $set, $inc, $push, direct object)
export function applyUpdate(doc, update) {
    if (!update)
        return doc;
    if (update.$set) {
        for (const k of Object.keys(update.$set)) {
            setNestedValue(doc, k, update.$set[k]);
        }
    }
    if (update.$inc) {
        for (const k of Object.keys(update.$inc)) {
            const current = Number(getNestedValue(doc, k) || 0);
            setNestedValue(doc, k, current + Number(update.$inc[k]));
        }
    }
    if (update.$push) {
        for (const k of Object.keys(update.$push)) {
            const arr = getNestedValue(doc, k) || [];
            if (Array.isArray(arr)) {
                arr.push(update.$push[k]);
                setNestedValue(doc, k, arr);
            }
        }
    }
    // Direct keys that don't start with $
    for (const k of Object.keys(update)) {
        if (!k.startsWith('$')) {
            setNestedValue(doc, k, update[k]);
        }
    }
    doc.updatedAt = new Date();
    return doc;
}
export class FirestoreDocument {
    constructor(collectionName, data) {
        this._collectionName = collectionName;
        const docId = String(data._id || data.id || crypto.randomBytes(12).toString('hex'));
        this._id = docId;
        this.id = docId;
        Object.assign(this, data);
        this._id = docId;
        this.id = docId;
        if (!this.createdAt)
            this.createdAt = new Date();
        if (!this.updatedAt)
            this.updatedAt = new Date();
    }
    async save() {
        const db = getFirestore();
        this.updatedAt = new Date();
        const plain = this.toObject();
        await db.collection(this._collectionName).doc(this._id).set(removeUndefined(plain), { merge: true });
        return this;
    }
    toObject() {
        const obj = {};
        for (const k of Object.keys(this)) {
            if (k === '_collectionName')
                continue;
            obj[k] = this[k];
        }
        obj._id = this._id;
        obj.id = this.id;
        return obj;
    }
    toJSON() {
        return this.toObject();
    }
}
export class QueryBuilder {
    constructor(collectionName, filter = {}, isSingle = false) {
        this._sortObj = null;
        this._limitNum = null;
        this._skipNum = null;
        this._selectedFields = null;
        this._excludedFields = null;
        this._isLean = false;
        this._isSingle = false;
        this._collectionName = collectionName;
        this._filter = filter;
        this._isSingle = isSingle;
    }
    sort(sortObj) {
        this._sortObj = sortObj;
        return this;
    }
    limit(n) {
        this._limitNum = n;
        return this;
    }
    skip(n) {
        this._skipNum = n;
        return this;
    }
    select(fields) {
        const fieldArr = Array.isArray(fields)
            ? fields
            : fields.split(' ').map(s => s.trim()).filter(Boolean);
        const included = [];
        const excluded = [];
        for (const f of fieldArr) {
            if (f.startsWith('-')) {
                excluded.push(f.slice(1));
            }
            else {
                included.push(f);
            }
        }
        if (included.length > 0)
            this._selectedFields = included;
        if (excluded.length > 0)
            this._excludedFields = excluded;
        return this;
    }
    lean() {
        this._isLean = true;
        return this;
    }
    populate(_path, _select) {
        // No-op for compatibility
        return this;
    }
    async exec() {
        const db = getFirestore();
        const colRef = db.collection(this._collectionName);
        // If query has exact _id
        const idVal = this._filter?._id || this._filter?.id;
        if (this._isSingle && typeof idVal === 'string' && Object.keys(this._filter).length === 1) {
            const docSnap = await colRef.doc(idVal).get();
            if (!docSnap.exists) {
                return null;
            }
            const rawData = { ...docSnap.data(), _id: docSnap.id, id: docSnap.id };
            this.projectDoc(rawData);
            if (this._isLean)
                return rawData;
            return new FirestoreDocument(this._collectionName, rawData);
        }
        // Fetch snapshot
        const snapshot = await colRef.get();
        let results = [];
        snapshot.forEach((snap) => {
            const data = snap.data();
            const doc = { ...data, _id: snap.id, id: snap.id };
            // Convert Firestore Timestamps to JS Dates
            for (const k of Object.keys(doc)) {
                if (doc[k] && typeof doc[k].toDate === 'function') {
                    doc[k] = doc[k].toDate();
                }
            }
            if (matchesFilter(doc, this._filter)) {
                results.push(doc);
            }
        });
        // Sorting
        if (this._sortObj) {
            const sortKeys = Object.keys(this._sortObj);
            results.sort((a, b) => {
                for (const k of sortKeys) {
                    const dir = this._sortObj[k] === -1 || this._sortObj[k] === 'desc' ? -1 : 1;
                    const aVal = a[k] instanceof Date ? a[k].getTime() : a[k];
                    const bVal = b[k] instanceof Date ? b[k].getTime() : b[k];
                    if (aVal < bVal)
                        return -1 * dir;
                    if (aVal > bVal)
                        return 1 * dir;
                }
                return 0;
            });
        }
        // Skip
        if (this._skipNum && this._skipNum > 0) {
            results = results.slice(this._skipNum);
        }
        // Limit
        if (this._limitNum !== null && this._limitNum >= 0) {
            results = results.slice(0, this._limitNum);
        }
        // Projection
        for (const r of results) {
            this.projectDoc(r);
        }
        if (this._isSingle) {
            const single = results[0] || null;
            if (!single)
                return null;
            if (this._isLean)
                return single;
            return new FirestoreDocument(this._collectionName, single);
        }
        if (this._isLean) {
            return results;
        }
        return results.map(r => new FirestoreDocument(this._collectionName, r));
    }
    projectDoc(doc) {
        if (!doc)
            return;
        if (this._excludedFields) {
            for (const f of this._excludedFields) {
                delete doc[f];
            }
        }
        if (this._selectedFields && this._selectedFields.length > 0) {
            const keepKeys = new Set([...this._selectedFields, '_id', 'id']);
            for (const k of Object.keys(doc)) {
                if (!keepKeys.has(k)) {
                    delete doc[k];
                }
            }
        }
    }
    then(onfulfilled, onrejected) {
        return this.exec().then(onfulfilled, onrejected);
    }
}
export function createFirestoreModel(collectionName) {
    return class Model {
        constructor(data = {}) {
            this._doc = new FirestoreDocument(collectionName, data);
            Object.assign(this, this._doc.toObject());
            this._id = this._doc._id;
            this.id = this._doc.id;
        }
        async save() {
            const plain = { ...this };
            delete plain._doc;
            Object.assign(this._doc, plain);
            await this._doc.save();
            Object.assign(this, this._doc.toObject());
            return this;
        }
        toObject() {
            return this._doc.toObject();
        }
        toJSON() {
            return this._doc.toJSON();
        }
        static get collectionName() {
            return collectionName;
        }
        static find(filter = {}) {
            return new QueryBuilder(collectionName, filter, false);
        }
        static findOne(filter = {}) {
            return new QueryBuilder(collectionName, filter, true);
        }
        static findById(id) {
            const idStr = String(id && id._id ? id._id : id);
            return new QueryBuilder(collectionName, { _id: idStr }, true);
        }
        static findByIdAndUpdate(id, update, options = {}) {
            const p = (async () => {
                const idStr = String(id && id._id ? id._id : id);
                const db = getFirestore();
                const docRef = db.collection(collectionName).doc(idStr);
                const snap = await docRef.get();
                if (!snap.exists)
                    return null;
                let currentData = { ...snap.data(), _id: snap.id, id: snap.id };
                const original = { ...currentData };
                currentData = applyUpdate(currentData, update);
                await docRef.set(removeUndefined(currentData), { merge: true });
                const res = options.new ? currentData : original;
                return new FirestoreDocument(collectionName, res);
            })();
            p.select = function (fields) {
                return p.then((doc) => {
                    if (!doc)
                        return null;
                    if (typeof fields === 'string') {
                        const fieldArr = fields.split(' ');
                        for (const f of fieldArr) {
                            if (f.startsWith('-')) {
                                delete doc[f.slice(1)];
                            }
                        }
                    }
                    return doc;
                });
            };
            return p;
        }
        static findOneAndUpdate(filter, update, options = {}) {
            const p = (async () => {
                const existing = await this.findOne(filter);
                if (!existing) {
                    if (options.upsert) {
                        const dataToCreate = { ...filter };
                        if (update.$set)
                            Object.assign(dataToCreate, update.$set);
                        for (const k of Object.keys(update)) {
                            if (!k.startsWith('$'))
                                dataToCreate[k] = update[k];
                        }
                        return this.create(dataToCreate);
                    }
                    return null;
                }
                return this.findByIdAndUpdate(existing._id, update, options);
            })();
            p.select = function (fields) {
                return p.then((doc) => {
                    if (!doc)
                        return null;
                    if (typeof fields === 'string') {
                        const fieldArr = fields.split(' ');
                        for (const f of fieldArr) {
                            if (f.startsWith('-')) {
                                delete doc[f.slice(1)];
                            }
                        }
                    }
                    return doc;
                });
            };
            return p;
        }
        static async findByIdAndDelete(id) {
            const idStr = String(id && id._id ? id._id : id);
            const db = getFirestore();
            const docRef = db.collection(collectionName).doc(idStr);
            const snap = await docRef.get();
            if (!snap.exists)
                return null;
            const data = { ...snap.data(), _id: snap.id, id: snap.id };
            await docRef.delete();
            return new FirestoreDocument(collectionName, data);
        }
        static async findOneAndDelete(filter) {
            const existing = await this.findOne(filter);
            if (!existing)
                return null;
            return this.findByIdAndDelete(existing._id);
        }
        static async create(data) {
            const db = getFirestore();
            const isArray = Array.isArray(data);
            const items = isArray ? data : [data];
            const createdList = [];
            for (let i = 0; i < items.length; i += 400) {
                const chunk = items.slice(i, i + 400);
                const batch = db.batch();
                for (const item of chunk) {
                    const id = String(item._id || item.id || crypto.randomBytes(12).toString('hex'));
                    const docData = {
                        ...item,
                        _id: id,
                        id,
                        createdAt: item.createdAt || new Date(),
                        updatedAt: item.updatedAt || new Date(),
                    };
                    const sanitized = removeUndefined(docData);
                    const ref = db.collection(collectionName).doc(id);
                    batch.set(ref, sanitized);
                    createdList.push(new FirestoreDocument(collectionName, sanitized));
                }
                await batch.commit();
            }
            return isArray ? createdList : createdList[0];
        }
        static async insertMany(data) {
            return this.create(data);
        }
        static async deleteMany(filter = {}) {
            const db = getFirestore();
            const items = await this.find(filter).lean();
            let count = 0;
            for (let i = 0; i < items.length; i += 400) {
                const chunk = items.slice(i, i + 400);
                const batch = db.batch();
                for (const item of chunk) {
                    batch.delete(db.collection(collectionName).doc(item._id));
                    count++;
                }
                await batch.commit();
            }
            return { deletedCount: count };
        }
        static async deleteOne(filter = {}) {
            const item = await this.findOne(filter).lean();
            if (!item)
                return { deletedCount: 0 };
            const db = getFirestore();
            await db.collection(collectionName).doc(item._id).delete();
            return { deletedCount: 1 };
        }
        static async updateMany(filter, update) {
            const items = await this.find(filter).lean();
            let count = 0;
            for (const item of items) {
                await this.findByIdAndUpdate(item._id, update);
                count++;
            }
            return { modifiedCount: count };
        }
        static async countDocuments(filter = {}) {
            const items = await this.find(filter).lean();
            return items.length;
        }
        // In-memory Aggregation Pipeline on Firestore collection data
        static async aggregate(pipeline) {
            let data = await this.find({}).lean();
            for (const stage of pipeline) {
                const stageName = Object.keys(stage)[0];
                const stageConfig = stage[stageName];
                if (stageName === '$match') {
                    data = data.filter((item) => matchesFilter(item, stageConfig));
                }
                else if (stageName === '$unwind') {
                    const path = (typeof stageConfig === 'string' ? stageConfig : stageConfig.path).replace(/^\$/, '');
                    const nextData = [];
                    for (const item of data) {
                        const arr = getNestedValue(item, path);
                        if (Array.isArray(arr) && arr.length > 0) {
                            for (const elem of arr) {
                                const clone = JSON.parse(JSON.stringify(item));
                                setNestedValue(clone, path, elem);
                                nextData.push(clone);
                            }
                        }
                    }
                    data = nextData;
                }
                else if (stageName === '$group') {
                    const groups = new Map();
                    const idExpr = stageConfig._id;
                    for (const item of data) {
                        let groupKey = 'null';
                        if (idExpr !== null && idExpr !== undefined) {
                            if (typeof idExpr === 'string' && idExpr.startsWith('$')) {
                                groupKey = String(getNestedValue(item, idExpr.slice(1)));
                            }
                            else {
                                groupKey = String(idExpr);
                            }
                        }
                        if (!groups.has(groupKey)) {
                            const initial = { _id: idExpr === null ? null : groupKey };
                            for (const k of Object.keys(stageConfig)) {
                                if (k === '_id')
                                    continue;
                                initial[k] = 0;
                            }
                            groups.set(groupKey, { result: initial, items: [] });
                        }
                        groups.get(groupKey).items.push(item);
                    }
                    const aggregated = [];
                    for (const [_, entry] of groups.entries()) {
                        const row = { ...entry.result };
                        for (const k of Object.keys(stageConfig)) {
                            if (k === '_id')
                                continue;
                            const opObj = stageConfig[k];
                            const op = Object.keys(opObj)[0];
                            const valExpr = opObj[op];
                            if (op === '$sum') {
                                if (valExpr === 1) {
                                    row[k] = entry.items.length;
                                }
                                else if (typeof valExpr === 'string' && valExpr.startsWith('$')) {
                                    const field = valExpr.slice(1);
                                    row[k] = entry.items.reduce((acc, cur) => acc + (Number(getNestedValue(cur, field)) || 0), 0);
                                }
                                else {
                                    row[k] = Number(valExpr) * entry.items.length;
                                }
                            }
                            else if (op === '$avg') {
                                if (typeof valExpr === 'string' && valExpr.startsWith('$')) {
                                    const field = valExpr.slice(1);
                                    const total = entry.items.reduce((acc, cur) => acc + (Number(getNestedValue(cur, field)) || 0), 0);
                                    row[k] = entry.items.length > 0 ? total / entry.items.length : 0;
                                }
                            }
                        }
                        aggregated.push(row);
                    }
                    data = aggregated;
                }
                else if (stageName === '$sort') {
                    const sortKeys = Object.keys(stageConfig);
                    data.sort((a, b) => {
                        for (const k of sortKeys) {
                            const dir = stageConfig[k] === -1 || stageConfig[k] === 'desc' ? -1 : 1;
                            const aVal = a[k];
                            const bVal = b[k];
                            if (aVal < bVal)
                                return -1 * dir;
                            if (aVal > bVal)
                                return 1 * dir;
                        }
                        return 0;
                    });
                }
                else if (stageName === '$limit') {
                    data = data.slice(0, stageConfig);
                }
                else if (stageName === '$project') {
                    data = data.map((item) => {
                        const projected = {};
                        for (const k of Object.keys(stageConfig)) {
                            if (stageConfig[k] === 1) {
                                projected[k] = item[k];
                            }
                            else if (typeof stageConfig[k] === 'string' && stageConfig[k].startsWith('$')) {
                                projected[k] = getNestedValue(item, stageConfig[k].slice(1));
                            }
                        }
                        return projected;
                    });
                }
            }
            return data;
        }
    };
}
//# sourceMappingURL=firestoreModel.js.map