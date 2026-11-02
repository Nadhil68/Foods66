var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/services/queueService.ts
import { Queue, Worker } from "bullmq";
import Redis from "ioredis";
var notificationQueue, notificationWorker, isServerless, redisHost, bullRedis;
var init_queueService = __esm({
  "src/services/queueService.ts"() {
    "use strict";
    notificationQueue = null;
    notificationWorker = null;
    isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
    redisHost = process.env.REDIS_HOST;
    bullRedis = null;
    if (!isServerless && (redisHost || process.env.NODE_ENV !== "production")) {
      bullRedis = new Redis({
        host: redisHost || "127.0.0.1",
        port: parseInt(process.env.REDIS_PORT || "6379"),
        maxRetriesPerRequest: null,
        enableOfflineQueue: false,
        lazyConnect: true,
        retryStrategy: () => null
      });
      bullRedis.on("error", () => {
      });
    }
    (async () => {
      if (!bullRedis) return;
      try {
        await bullRedis.ping();
        notificationQueue = new Queue("notifications", { connection: bullRedis });
        notificationWorker = new Worker(
          "notifications",
          async (job) => {
            if (job.name === "sendEmail") {
              console.log(`[Queue] Sending email to ${job.data.to}: ${job.data.subject}`);
              await new Promise((r) => setTimeout(r, 500));
              console.log(`[Queue] Email sent to ${job.data.to}`);
            }
          },
          { connection: bullRedis }
        );
        notificationWorker.on("failed", (job, err) => {
          console.error(`[Queue] Job ${job?.id} failed: ${err.message}`);
        });
        console.log("[Queue] BullMQ initialised successfully.");
      } catch {
        console.warn("[Queue] Redis unavailable \u2014 queue service disabled. Start Redis to enable background jobs.");
        bullRedis.disconnect();
      }
    })();
  }
});

// src/config/defaultCredentials.ts
var DEFAULT_FIREBASE_CREDENTIALS_B64;
var init_defaultCredentials = __esm({
  "src/config/defaultCredentials.ts"() {
    "use strict";
    DEFAULT_FIREBASE_CREDENTIALS_B64 = "ewogICJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIsCiAgInByb2plY3RfaWQiOiAiZm9vZHM2Ni0zZTlhNSIsCiAgInByaXZhdGVfa2V5X2lkIjogImQ2MjUzN2FlOGIzNDM3ODU3MzcxMWNmNDE5YTFmZDI0YzIzNGZkNDgiLAogICJwcml2YXRlX2tleSI6ICItLS0tLUJFR0lOIFBSSVZBVEUgS0VZLS0tLS1cbk1JSUV2UUlCQURBTkJna3Foa2lHOXcwQkFRRUZBQVNDQktjd2dnU2pBZ0VBQW9JQkFRQzVmTWIrcWlyZzRwWS9cbnI0alFIdFNHYUpUa1VKK0huM09ZVzBrMHlmTnUrb2E4bUQ2VERobndzTlN0bmErTUZuVkVCQ0JuaFM1eEtBVEdcblI3L1I0bEtUcm9XS0RhVEdoeFZJcDUvWTBCYXJKbWdyWjZHaVo2d2FVSmxQMEpSSmxpVHRSTjZpTTMzSXhmVC9cbks4dlNTSFY2aFArVjhOVE1CeW96UlBONkl1U1ZpTnNNKzNjNG1zMzE2VFNqdTBVMEFhNUpSUCtQRUxiZjRHSGZcbk5IbzhGMGs0MFljcFpKVDg3Y1M5WFVUaGU5Ky9HQSs2Q3EzRE8rTVJad2Q4WHNhUUlrM2dZRTFJRGQ3eS81NUFcbldaYnhzS3NLemNUNFA4Zk5rQmorMXkvNzdKNks5YmNBcVJEMmdvejlPeW9tWEt5RGh4ZGFaOG92dnJycXJzUEJcbjF6dlZxN2twQWdNQkFBRUNnZ0VBQUtBL0Fhd0JyTFJIRFRHaW4yVXQ2QmcybHhYOTVuOXZiSmtJN3dzc0dFM3pcbkloN012ZTFOd1hDdlZHTlVWMytFa2lBR0cwMytscURXY2ZRd1hiSjFxZUdYRDNJS3JOQXNPUXhoR2VKZ2pvcE9cbkpBWUdWeDNNeUdLZVB5cUtpRHhmK29jQmVLcitKb0o0Z3dYd1VGRGJTS01RbVJQR0pyd2RkSUtCT2RmS29yQ0xcbjV0b0RlOEhMRmRRSEFIM0xmMXJ2ckt6bzFkMlFnWkRIWGZ3dkw4ME5hT1VPcmdrSVh3NFBsa3Ywd1ZSQ2ZIM1hcbkEwVStwK0dvWlF6NkIvMjFqSklRODlBM1EranFuMmxsY2JReTlFMk1tMU43aHhRdmlUSGdDeVNLOTJSY0tZTlpcbmJzeW50L3RpWG1OV2RtRVRSS1ZtcVBzZWxkVEJCNWluSUpXcHpjTklLd0tCZ1FEcy91ZEMwazhXYVBZSXRjeGNcbkZhRkVrcFNVN3NTSDhHek5YNTM4ckJSaHc2cnNXRUJUU1RVQmJMbnZRb1FhN3JaSnIrNmVSOE5IeHBscTkxRTBcbjBCZ01VK0R1MWRUWlhndFNxUlNyajNteHJDcFcxczVpS3pYSG1scEZsd3hJSkg0MGh3Y0hEMHg2NHdlYVQwOURcbktHa0FpWTM5VWp6L0k1NHlZai9CeWlDdEV3S0JnUURJWElBOFliczJXVStWREJJSXhxMG93N1hPUFEvQm1CM1BcbmF4UkVGeWx2dDc2NnU5NGtxY1RBbGdtMmhVcnZ2SVVTZitCWGZLYkhuVlBKVUUwdmJNSjI3dUlORlRnMlpVZ3dcbkZMRW53Nklsc1Jwdm1sajA2cHMvYmpvS1RQWjF6TEw5azVNcHhNREI2M2c0WkFmVzNuMmRPT1ViRGJxY3NzcEhcbnlsTHRmcDEwVXdLQmdRRFhQS25MaGpWTnBRWE40MDQyVTI2aldIeVl4a0MzTlNPYllidWFQcTVFRy9DZnRZYTJcbkhVYUdoTGhaRTQvbTVlV29CcUF3SC95NnN5T2lnZnErZkQ5YTh0TFdGbDI1RERBOFlsTGpmT3FJOGxPQmlwVGxcbmsxakVidXFOU1NGZVk4WTY3bWJ6Z25GektiMDk1OG1VdEo2b1hrVVdUQm9abmIrUEFxdmsxQzNaQVFLQmdGTXZcbjVLWXRSWmRaR1d1ZXFWWXZkdkYzNEdJU2hCb3kyQjJvTGEvZmxmcW1aWEFPVkRzUXFYbjBVWEFRZzM1cDNTNURcbkhaZjFUeUdOdHAzYzAwOGZidFlHZEtCTjhSclVqbFk0SVIyTFlpVVlGUXZGSDY0QVFoamg0UU1wMVNJdnJSa1BcblRvaUhBaWtCWk5hMDRYUmF4L2loQ0s1azB0Z0FlMiszRnhzMytKTzFBb0dBQzY2RERZVm04YzQ0dG00aTFQdzRcbi9rRE9SMzJqLzREUXBOblBEUU02L1dHM1Fienhaa05xVkRLS0hCdTlocXVMT0hkbTZWa01oTFVTcFN2Ulp6MWZcbmJJZVlkT2daVDRBeXl1cm1aWUZ2UFZlelN5Q3ZxWGpZbklMNkNPaU5NN2g1VnREU2traXlqbnJJUjRRb3k4Kzdcbkl2ZGFMVE9PeGU4VTRId0ttajlzR3prPVxuLS0tLS1FTkQgUFJJVkFURSBLRVktLS0tLVxuIiwKICAiY2xpZW50X2VtYWlsIjogImZpcmViYXNlLWFkbWluc2RrLWZic3ZjQGZvb2RzNjYtM2U5YTUuaWFtLmdzZXJ2aWNlYWNjb3VudC5jb20iLAogICJjbGllbnRfaWQiOiAiMTE1ODkyMDA4ODMzMTM4OTgzMTYxIiwKICAiYXV0aF91cmkiOiAiaHR0cHM6Ly9hY2NvdW50cy5nb29nbGUuY29tL28vb2F1dGgyL2F1dGgiLAogICJ0b2tlbl91cmkiOiAiaHR0cHM6Ly9vYXV0aDIuZ29vZ2xlYXBpcy5jb20vdG9rZW4iLAogICJhdXRoX3Byb3ZpZGVyX3g1MDlfY2VydF91cmwiOiAiaHR0cHM6Ly93d3cuZ29vZ2xlYXBpcy5jb20vb2F1dGgyL3YxL2NlcnRzIiwKICAiY2xpZW50X3g1MDlfY2VydF91cmwiOiAiaHR0cHM6Ly93d3cuZ29vZ2xlYXBpcy5jb20vcm9ib3QvdjEvbWV0YWRhdGEveDUwOS9maXJlYmFzZS1hZG1pbnNkay1mYnN2YyU0MGZvb2RzNjYtM2U5YTUuaWFtLmdzZXJ2aWNlYWNjb3VudC5jb20iLAogICJ1bml2ZXJzZV9kb21haW4iOiAiZ29vZ2xlYXBpcy5jb20iCn0K";
  }
});

// src/config/firebase.ts
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
var __filename, __dirname, appInstance, firestoreInstance, authInstance, initFirebase, getFirestore;
var init_firebase = __esm({
  "src/config/firebase.ts"() {
    "use strict";
    init_defaultCredentials();
    __filename = fileURLToPath(import.meta.url);
    __dirname = path.dirname(__filename);
    appInstance = null;
    firestoreInstance = null;
    authInstance = null;
    initFirebase = () => {
      const existingApps = getApps();
      if (existingApps.length > 0) {
        appInstance = existingApps[0];
        firestoreInstance = getAdminFirestore(appInstance);
        authInstance = getAdminAuth(appInstance);
        return {
          db: firestoreInstance,
          auth: authInstance
        };
      }
      try {
        let credential;
        const possiblePaths = [
          path.join(__dirname, "serviceAccountKey.json"),
          path.join(__dirname, "..", "serviceAccountKey.json"),
          path.join(__dirname, "..", "..", "serviceAccountKey.json"),
          path.join(process.cwd(), "serviceAccountKey.json"),
          path.join(process.cwd(), "backend", "serviceAccountKey.json")
        ];
        let fileLoaded = false;
        for (const p of possiblePaths) {
          if (fs.existsSync(p)) {
            const fileData = JSON.parse(fs.readFileSync(p, "utf8"));
            credential = cert(fileData);
            console.log(`\u{1F511} Firebase credentials loaded from file: ${p}`);
            fileLoaded = true;
            break;
          }
        }
        if (!fileLoaded && process.env.FIREBASE_SERVICE_ACCOUNT) {
          const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
          credential = cert(parsed);
          console.log("\u{1F511} Firebase credentials loaded from FIREBASE_SERVICE_ACCOUNT env var");
        } else if (!fileLoaded && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
          credential = cert({
            projectId: process.env.FIREBASE_PROJECT_ID || "foods66-3e9a5",
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
          });
          console.log("\u{1F511} Firebase credentials loaded from individual env vars");
        } else if (!fileLoaded && DEFAULT_FIREBASE_CREDENTIALS_B64) {
          try {
            const decoded = Buffer.from(DEFAULT_FIREBASE_CREDENTIALS_B64, "base64").toString("utf8");
            const parsed = JSON.parse(decoded);
            credential = cert(parsed);
            console.log("\u{1F511} Firebase credentials loaded from embedded default fallback");
          } catch (err) {
            console.error("\u26A0\uFE0F Could not parse embedded fallback credentials:", err.message);
          }
        }
        if (!credential) {
          console.error("\u274C No Firebase credentials found! Set FIREBASE_SERVICE_ACCOUNT env var on Vercel.");
          throw new Error("Firebase credentials not configured. Set FIREBASE_SERVICE_ACCOUNT environment variable.");
        }
        appInstance = initializeApp({
          credential,
          projectId: "foods66-3e9a5"
        });
        const db = getAdminFirestore(appInstance);
        db.settings({ ignoreUndefinedProperties: true, preferRest: true });
        firestoreInstance = db;
        authInstance = getAdminAuth(appInstance);
        console.log("\u{1F525} Live Firebase Firestore connected successfully for project: foods66-3e9a5");
        return { db, auth: authInstance };
      } catch (error) {
        console.error("\u274C Error initializing Firebase Admin:", error.message || error);
        throw error;
      }
    };
    getFirestore = () => {
      if (!firestoreInstance) {
        const { db } = initFirebase();
        return db;
      }
      return firestoreInstance;
    };
  }
});

// src/models/firestoreModel.ts
import crypto from "crypto";
function removeUndefined(obj) {
  if (obj === null || obj === void 0 || typeof obj !== "object") {
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
    if (value !== void 0) {
      result[key] = removeUndefined(value);
    }
  }
  return result;
}
function getNestedValue(obj, path5) {
  if (!obj || !path5) return void 0;
  if (!path5.includes(".")) return obj[path5];
  const parts = path5.split(".");
  let current = obj;
  for (const part of parts) {
    if (current === null || current === void 0) return void 0;
    current = current[part];
  }
  return current;
}
function setNestedValue(obj, path5, val) {
  if (!obj || !path5) return;
  const parts = path5.split(".");
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!current[part] || typeof current[part] !== "object") {
      current[part] = {};
    }
    current = current[part];
  }
  current[parts[parts.length - 1]] = val;
}
function matchesFilter(doc, filter) {
  if (!filter || Object.keys(filter).length === 0) return true;
  for (const key of Object.keys(filter)) {
    const condition = filter[key];
    if (key === "$or") {
      if (!Array.isArray(condition)) return false;
      const anyMatch = condition.some((subFilter) => matchesFilter(doc, subFilter));
      if (!anyMatch) return false;
      continue;
    }
    if (key === "$and") {
      if (!Array.isArray(condition)) return false;
      const allMatch = condition.every((subFilter) => matchesFilter(doc, subFilter));
      if (!allMatch) return false;
      continue;
    }
    const docValue = key === "_id" ? doc._id || doc.id : getNestedValue(doc, key);
    if (condition !== null && typeof condition === "object" && !(condition instanceof Date) && !(condition instanceof RegExp)) {
      const opKeys = Object.keys(condition).filter((k) => k.startsWith("$"));
      if (opKeys.length > 0) {
        for (const op of opKeys) {
          const target = condition[op];
          if (op === "$eq") {
            if (String(docValue) !== String(target)) return false;
          } else if (op === "$ne") {
            if (String(docValue) === String(target)) return false;
          } else if (op === "$gt") {
            const dVal = docValue instanceof Date ? docValue.getTime() : typeof docValue === "string" && !isNaN(Date.parse(docValue)) ? new Date(docValue).getTime() : Number(docValue);
            const tVal = target instanceof Date ? target.getTime() : typeof target === "string" && !isNaN(Date.parse(target)) ? new Date(target).getTime() : Number(target);
            if (!(dVal > tVal)) return false;
          } else if (op === "$gte") {
            const dVal = docValue instanceof Date ? docValue.getTime() : typeof docValue === "string" && !isNaN(Date.parse(docValue)) ? new Date(docValue).getTime() : Number(docValue);
            const tVal = target instanceof Date ? target.getTime() : typeof target === "string" && !isNaN(Date.parse(target)) ? new Date(target).getTime() : Number(target);
            if (!(dVal >= tVal)) return false;
          } else if (op === "$lt") {
            const dVal = docValue instanceof Date ? docValue.getTime() : typeof docValue === "string" && !isNaN(Date.parse(docValue)) ? new Date(docValue).getTime() : Number(docValue);
            const tVal = target instanceof Date ? target.getTime() : typeof target === "string" && !isNaN(Date.parse(target)) ? new Date(target).getTime() : Number(target);
            if (!(dVal < tVal)) return false;
          } else if (op === "$lte") {
            const dVal = docValue instanceof Date ? docValue.getTime() : typeof docValue === "string" && !isNaN(Date.parse(docValue)) ? new Date(docValue).getTime() : Number(docValue);
            const tVal = target instanceof Date ? target.getTime() : typeof target === "string" && !isNaN(Date.parse(target)) ? new Date(target).getTime() : Number(target);
            if (!(dVal <= tVal)) return false;
          } else if (op === "$in") {
            if (!Array.isArray(target)) return false;
            const targetStrings = target.map((t) => String(t && t._id ? t._id : t));
            const dStr = String(docValue && docValue._id ? docValue._id : docValue);
            if (!targetStrings.includes(dStr)) return false;
          } else if (op === "$nin") {
            if (!Array.isArray(target)) return true;
            const targetStrings = target.map((t) => String(t && t._id ? t._id : t));
            const dStr = String(docValue && docValue._id ? docValue._id : docValue);
            if (targetStrings.includes(dStr)) return false;
          } else if (op === "$exists") {
            const exists = docValue !== void 0 && docValue !== null;
            if (Boolean(target) !== exists) return false;
          } else if (op === "$regex") {
            const regex = new RegExp(target, condition.$options || "");
            if (!regex.test(String(docValue || ""))) return false;
          }
        }
        continue;
      }
    }
    if (condition instanceof RegExp) {
      if (!condition.test(String(docValue || ""))) return false;
      continue;
    }
    if (condition instanceof Date) {
      const d1 = docValue instanceof Date ? docValue.getTime() : new Date(docValue).getTime();
      if (d1 !== condition.getTime()) return false;
      continue;
    }
    if (key === "_id") {
      const condId = String(condition && condition._id ? condition._id : condition);
      const docId = String(doc._id || doc.id);
      if (condId !== docId) return false;
      continue;
    }
    if (docValue !== condition) {
      if (String(docValue) !== String(condition)) {
        return false;
      }
    }
  }
  return true;
}
function applyUpdate(doc, update) {
  if (!update) return doc;
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
  for (const k of Object.keys(update)) {
    if (!k.startsWith("$")) {
      setNestedValue(doc, k, update[k]);
    }
  }
  doc.updatedAt = /* @__PURE__ */ new Date();
  return doc;
}
function createFirestoreModel(collectionName) {
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
        if (!snap.exists) return null;
        let currentData = { ...snap.data(), _id: snap.id, id: snap.id };
        const original = { ...currentData };
        currentData = applyUpdate(currentData, update);
        await docRef.set(removeUndefined(currentData), { merge: true });
        const res = options.new ? currentData : original;
        return new FirestoreDocument(collectionName, res);
      })();
      p.select = function(fields) {
        return p.then((doc) => {
          if (!doc) return null;
          if (typeof fields === "string") {
            const fieldArr = fields.split(" ");
            for (const f of fieldArr) {
              if (f.startsWith("-")) {
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
            if (update.$set) Object.assign(dataToCreate, update.$set);
            for (const k of Object.keys(update)) {
              if (!k.startsWith("$")) dataToCreate[k] = update[k];
            }
            return this.create(dataToCreate);
          }
          return null;
        }
        return this.findByIdAndUpdate(existing._id, update, options);
      })();
      p.select = function(fields) {
        return p.then((doc) => {
          if (!doc) return null;
          if (typeof fields === "string") {
            const fieldArr = fields.split(" ");
            for (const f of fieldArr) {
              if (f.startsWith("-")) {
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
      if (!snap.exists) return null;
      const data = { ...snap.data(), _id: snap.id, id: snap.id };
      await docRef.delete();
      return new FirestoreDocument(collectionName, data);
    }
    static async findOneAndDelete(filter) {
      const existing = await this.findOne(filter);
      if (!existing) return null;
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
          const id = String(item._id || item.id || crypto.randomBytes(12).toString("hex"));
          const docData = {
            ...item,
            _id: id,
            id,
            createdAt: item.createdAt || /* @__PURE__ */ new Date(),
            updatedAt: item.updatedAt || /* @__PURE__ */ new Date()
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
      if (!item) return { deletedCount: 0 };
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
        if (stageName === "$match") {
          data = data.filter((item) => matchesFilter(item, stageConfig));
        } else if (stageName === "$unwind") {
          const path5 = (typeof stageConfig === "string" ? stageConfig : stageConfig.path).replace(/^\$/, "");
          const nextData = [];
          for (const item of data) {
            const arr = getNestedValue(item, path5);
            if (Array.isArray(arr) && arr.length > 0) {
              for (const elem of arr) {
                const clone = JSON.parse(JSON.stringify(item));
                setNestedValue(clone, path5, elem);
                nextData.push(clone);
              }
            }
          }
          data = nextData;
        } else if (stageName === "$group") {
          const groups = /* @__PURE__ */ new Map();
          const idExpr = stageConfig._id;
          for (const item of data) {
            let groupKey = "null";
            if (idExpr !== null && idExpr !== void 0) {
              if (typeof idExpr === "string" && idExpr.startsWith("$")) {
                groupKey = String(getNestedValue(item, idExpr.slice(1)));
              } else {
                groupKey = String(idExpr);
              }
            }
            if (!groups.has(groupKey)) {
              const initial = { _id: idExpr === null ? null : groupKey };
              for (const k of Object.keys(stageConfig)) {
                if (k === "_id") continue;
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
              if (k === "_id") continue;
              const opObj = stageConfig[k];
              const op = Object.keys(opObj)[0];
              const valExpr = opObj[op];
              if (op === "$sum") {
                if (valExpr === 1) {
                  row[k] = entry.items.length;
                } else if (typeof valExpr === "string" && valExpr.startsWith("$")) {
                  const field = valExpr.slice(1);
                  row[k] = entry.items.reduce((acc, cur) => acc + (Number(getNestedValue(cur, field)) || 0), 0);
                } else {
                  row[k] = Number(valExpr) * entry.items.length;
                }
              } else if (op === "$avg") {
                if (typeof valExpr === "string" && valExpr.startsWith("$")) {
                  const field = valExpr.slice(1);
                  const total = entry.items.reduce((acc, cur) => acc + (Number(getNestedValue(cur, field)) || 0), 0);
                  row[k] = entry.items.length > 0 ? total / entry.items.length : 0;
                }
              }
            }
            aggregated.push(row);
          }
          data = aggregated;
        } else if (stageName === "$sort") {
          const sortKeys = Object.keys(stageConfig);
          data.sort((a, b) => {
            for (const k of sortKeys) {
              const dir = stageConfig[k] === -1 || stageConfig[k] === "desc" ? -1 : 1;
              const aVal = a[k];
              const bVal = b[k];
              if (aVal < bVal) return -1 * dir;
              if (aVal > bVal) return 1 * dir;
            }
            return 0;
          });
        } else if (stageName === "$limit") {
          data = data.slice(0, stageConfig);
        } else if (stageName === "$project") {
          data = data.map((item) => {
            const projected = {};
            for (const k of Object.keys(stageConfig)) {
              if (stageConfig[k] === 1) {
                projected[k] = item[k];
              } else if (typeof stageConfig[k] === "string" && stageConfig[k].startsWith("$")) {
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
var ObjectIdMock, FirestoreDocument, QueryBuilder;
var init_firestoreModel = __esm({
  "src/models/firestoreModel.ts"() {
    "use strict";
    init_firebase();
    ObjectIdMock = class {
      constructor(id) {
        if (id) {
          this._str = id.toString();
        } else {
          this._str = crypto.randomBytes(12).toString("hex");
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
        if (!other) return false;
        return this._str === other.toString();
      }
      static isValid(val) {
        if (!val) return false;
        const str = typeof val === "string" ? val : val && typeof val.toString === "function" ? val.toString() : "";
        if (!str || typeof str !== "string") return false;
        return str.length >= 8 && str.length <= 64;
      }
    };
    FirestoreDocument = class {
      constructor(collectionName, data) {
        this._collectionName = collectionName;
        const docId = String(data._id || data.id || crypto.randomBytes(12).toString("hex"));
        this._id = docId;
        this.id = docId;
        Object.assign(this, data);
        this._id = docId;
        this.id = docId;
        if (!this.createdAt) this.createdAt = /* @__PURE__ */ new Date();
        if (!this.updatedAt) this.updatedAt = /* @__PURE__ */ new Date();
      }
      async save() {
        const db = getFirestore();
        this.updatedAt = /* @__PURE__ */ new Date();
        const plain = this.toObject();
        await db.collection(this._collectionName).doc(this._id).set(removeUndefined(plain), { merge: true });
        return this;
      }
      toObject() {
        const obj = {};
        for (const k of Object.keys(this)) {
          if (k === "_collectionName") continue;
          obj[k] = this[k];
        }
        obj._id = this._id;
        obj.id = this.id;
        return obj;
      }
      toJSON() {
        return this.toObject();
      }
    };
    QueryBuilder = class {
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
        const fieldArr = Array.isArray(fields) ? fields : fields.split(" ").map((s) => s.trim()).filter(Boolean);
        const included = [];
        const excluded = [];
        for (const f of fieldArr) {
          if (f.startsWith("-")) {
            excluded.push(f.slice(1));
          } else {
            included.push(f);
          }
        }
        if (included.length > 0) this._selectedFields = included;
        if (excluded.length > 0) this._excludedFields = excluded;
        return this;
      }
      lean() {
        this._isLean = true;
        return this;
      }
      populate(_path, _select) {
        return this;
      }
      async exec() {
        const db = getFirestore();
        const colRef = db.collection(this._collectionName);
        const idVal = this._filter?._id || this._filter?.id;
        if (this._isSingle && typeof idVal === "string" && Object.keys(this._filter).length === 1) {
          const docSnap = await colRef.doc(idVal).get();
          if (!docSnap.exists) {
            return null;
          }
          const rawData = { ...docSnap.data(), _id: docSnap.id, id: docSnap.id };
          this.projectDoc(rawData);
          if (this._isLean) return rawData;
          return new FirestoreDocument(this._collectionName, rawData);
        }
        const snapshot = await colRef.get();
        let results = [];
        snapshot.forEach((snap) => {
          const data = snap.data();
          const doc = { ...data, _id: snap.id, id: snap.id };
          for (const k of Object.keys(doc)) {
            if (doc[k] && typeof doc[k].toDate === "function") {
              doc[k] = doc[k].toDate();
            }
          }
          if (matchesFilter(doc, this._filter)) {
            results.push(doc);
          }
        });
        if (this._sortObj) {
          const sortKeys = Object.keys(this._sortObj);
          results.sort((a, b) => {
            for (const k of sortKeys) {
              const dir = this._sortObj[k] === -1 || this._sortObj[k] === "desc" ? -1 : 1;
              const aVal = a[k] instanceof Date ? a[k].getTime() : a[k];
              const bVal = b[k] instanceof Date ? b[k].getTime() : b[k];
              if (aVal < bVal) return -1 * dir;
              if (aVal > bVal) return 1 * dir;
            }
            return 0;
          });
        }
        if (this._skipNum && this._skipNum > 0) {
          results = results.slice(this._skipNum);
        }
        if (this._limitNum !== null && this._limitNum >= 0) {
          results = results.slice(0, this._limitNum);
        }
        for (const r of results) {
          this.projectDoc(r);
        }
        if (this._isSingle) {
          const single = results[0] || null;
          if (!single) return null;
          if (this._isLean) return single;
          return new FirestoreDocument(this._collectionName, single);
        }
        if (this._isLean) {
          return results;
        }
        return results.map((r) => new FirestoreDocument(this._collectionName, r));
      }
      projectDoc(doc) {
        if (!doc) return;
        if (this._excludedFields) {
          for (const f of this._excludedFields) {
            delete doc[f];
          }
        }
        if (this._selectedFields && this._selectedFields.length > 0) {
          const keepKeys = /* @__PURE__ */ new Set([...this._selectedFields, "_id", "id"]);
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
    };
  }
});

// src/config/envConfig.ts
import dotenv from "dotenv";
var JWT_SECRET, MONGODB_URI, FIREBASE_PROJECT_ID, GEMINI_API_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PUBLISHABLE_KEY, NODE_ENV, PORT, CLIENT_URL, env;
var init_envConfig = __esm({
  "src/config/envConfig.ts"() {
    "use strict";
    dotenv.config();
    JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.warn(
        "\u26A0\uFE0F WARNING: JWT_SECRET is not configured in environment variables. Falling back to default secret. For production security, configure JWT_SECRET in Vercel project settings."
      );
      JWT_SECRET = "foods66_enterprise_jwt_secret_fallback_key_2026";
    }
    MONGODB_URI = process.env.MONGODB_URI || "";
    FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "foods66-3e9a5";
    GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY || "";
    if (!GEMINI_API_KEY || GEMINI_API_KEY.includes("PLACEHOLDER")) {
      console.warn("\u26A0\uFE0F  GEMINI_API_KEY not configured \u2014 AI features will use mock/fallback mode.");
    }
    STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
    if (!STRIPE_SECRET_KEY) {
      console.warn("\u26A0\uFE0F  STRIPE_SECRET_KEY not configured \u2014 payment features will use mock mode.");
    }
    STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";
    if (!STRIPE_WEBHOOK_SECRET) {
      console.warn("\u26A0\uFE0F  STRIPE_WEBHOOK_SECRET not configured \u2014 webhook signature verification disabled in development.");
    }
    STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || "";
    NODE_ENV = process.env.NODE_ENV || "development";
    PORT = parseInt(process.env.PORT || "5000", 10);
    CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";
    env = {
      NODE_ENV,
      PORT,
      CLIENT_URL,
      JWT_SECRET,
      MONGODB_URI,
      GEMINI_API_KEY,
      STRIPE_SECRET_KEY,
      STRIPE_PUBLISHABLE_KEY,
      STRIPE_WEBHOOK_SECRET,
      FIREBASE_PROJECT_ID,
      isProduction: NODE_ENV === "production",
      isDevelopment: NODE_ENV === "development"
    };
  }
});

// src/utils/logger.ts
function redactSensitive(data) {
  const cleaned = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_FIELDS.some((f) => lowerKey.includes(f))) {
      cleaned[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      cleaned[key] = redactSensitive(value);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}
function createEntry(level, event, message, extra) {
  const entry = {
    level,
    event,
    message,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
  if (extra) {
    Object.assign(entry, redactSensitive(extra));
  }
  return entry;
}
var SENSITIVE_FIELDS, logger;
var init_logger = __esm({
  "src/utils/logger.ts"() {
    "use strict";
    init_envConfig();
    SENSITIVE_FIELDS = ["password", "token", "jwt", "secret", "apiKey", "api_key", "stripe", "gemini"];
    logger = {
      info(event, message, extra) {
        const entry = createEntry("info", event, message, extra);
        console.log(JSON.stringify(entry));
      },
      warn(event, message, extra) {
        const entry = createEntry("warn", event, message, extra);
        console.warn(JSON.stringify(entry));
      },
      error(event, message, extra) {
        const entry = createEntry("error", event, message, extra);
        if (env.isDevelopment && extra?.error instanceof Error) {
          entry.stack = extra.error.stack;
        }
        console.error(JSON.stringify(entry));
      },
      /**
       * Security-specific logging for auth failures, authorization failures,
       * suspicious activity, etc.
       */
      security(event, message, extra) {
        const entry = createEntry("security", event, message, extra);
        console.error(`\u{1F512} SECURITY: ${JSON.stringify(entry)}`);
      }
    };
  }
});

// src/models/User.ts
var User_exports = {};
__export(User_exports, {
  User: () => User,
  default: () => User_default
});
var User, User_default;
var init_User = __esm({
  "src/models/User.ts"() {
    "use strict";
    init_firestoreModel();
    User = createFirestoreModel("users");
    User_default = User;
  }
});

// src/middlewares/auth.ts
import jwt from "jsonwebtoken";
var protect, authorize;
var init_auth = __esm({
  "src/middlewares/auth.ts"() {
    "use strict";
    init_User();
    init_envConfig();
    init_logger();
    protect = async (req, res, next) => {
      let token;
      if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
          token = req.headers.authorization.split(" ")[1];
          const decoded = jwt.verify(token, env.JWT_SECRET);
          const user = await User.findById(decoded.id).select("-password");
          if (!user) {
            logger.security("AUTH_USER_NOT_FOUND", "Token valid but user not found in database", { decodedId: decoded.id });
            res.status(401).json({ success: false, message: "Not authorized, user not found", code: "USER_NOT_FOUND" });
            return;
          }
          req.user = user;
          next();
          return;
        } catch (error) {
          logger.security("AUTH_TOKEN_FAILED", "JWT verification failed", { ip: req.ip });
          res.status(401).json({ success: false, message: "Not authorized, token failed", code: "TOKEN_INVALID" });
          return;
        }
      }
      if (!token) {
        res.status(401).json({ success: false, message: "Not authorized, no token", code: "NO_TOKEN" });
      }
    };
    authorize = (...roles) => {
      return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
          logger.security("AUTHORIZATION_DENIED", `Role '${req.user?.role}' denied access`, {
            userId: req.user?._id?.toString(),
            requiredRoles: roles,
            path: req.originalUrl
          });
          res.status(403).json({
            success: false,
            message: `User role '${req.user?.role}' is not authorized to access this route`,
            code: "FORBIDDEN"
          });
          return;
        }
        next();
      };
    };
  }
});

// src/services/healthValidation.ts
function matchDisease(input) {
  const lower = input.toLowerCase().trim();
  for (const [key, rule] of Object.entries(DISEASE_RULES)) {
    for (const alias of rule.aliases) {
      if (lower.includes(alias) || alias.includes(lower)) {
        return { key, rule };
      }
    }
  }
  return null;
}
function correctMedications(medicines) {
  let result = medicines;
  const corrections = [];
  for (const [wrong, right] of Object.entries(MED_CORRECTIONS)) {
    const regex = new RegExp(wrong, "gi");
    if (regex.test(result)) {
      result = result.replace(regex, right);
      corrections.push(`Auto-corrected '${wrong}' \u2192 '${right}'`);
    }
  }
  return { corrected: result, corrections };
}
function detectRedFlags(symptoms, diseaseRule) {
  const flags = [];
  if (!symptoms) return flags;
  const lower = symptoms.toLowerCase();
  if (diseaseRule) {
    for (const rf of diseaseRule.redFlagSymptoms) {
      if (lower.includes(rf.symptom)) {
        flags.push({ symptom: rf.symptom, urgency: rf.urgency, action: rf.action });
      }
    }
  }
  for (const rf of UNIVERSAL_RED_FLAGS) {
    if (lower.includes(rf.symptom) && !flags.some((f) => f.symptom === rf.symptom)) {
      flags.push({ symptom: rf.symptom, urgency: rf.urgency, action: rf.action });
    }
  }
  return flags;
}
function validateHealthProfile(input) {
  const checks = [];
  let confidenceScore = 1;
  const flaggedItems = [];
  const lowerDisease = (input.diseaseName || "").toLowerCase().trim();
  if (lowerDisease.length < 4 || VAGUE_TERMS.some((term) => lowerDisease === term || lowerDisease === term + "s")) {
    checks.push({
      category: "INPUT_SPECIFICITY",
      passed: false,
      message: 'Please provide a specific medical diagnosis (e.g., "Diabetes Type 2") rather than a symptom or vague term.',
      severity: "critical"
    });
    confidenceScore -= 0.5;
  } else {
    checks.push({
      category: "INPUT_SPECIFICITY",
      passed: true,
      message: "Condition name is specific enough for validation.",
      severity: "info"
    });
  }
  const match = matchDisease(input.diseaseName);
  if (match) {
    checks.push({
      category: "DISEASE_RECOGNITION",
      passed: true,
      message: `Recognized condition: "${input.diseaseName}" matched to ${match.key.replace(/_/g, " ")}`,
      severity: "info"
    });
    confidenceScore += 0.05;
  } else {
    checks.push({
      category: "DISEASE_RECOGNITION",
      passed: false,
      message: `Condition "${input.diseaseName}" is not in our validated database. Dietary recommendations may be generic. Consider consulting your physician for specific dietary guidance.`,
      severity: "warning"
    });
    confidenceScore -= 0.15;
  }
  const age = Number(input.age);
  if (isNaN(age) || age < 1 || age > 120) {
    checks.push({
      category: "AGE_PLAUSIBILITY",
      passed: false,
      message: "Age must be between 1 and 120.",
      severity: "critical"
    });
    confidenceScore -= 0.3;
  } else if (match && (age < match.rule.ageRange.min || age > match.rule.ageRange.max)) {
    checks.push({
      category: "AGE_PLAUSIBILITY",
      passed: false,
      message: match.rule.ageRange.note || `Age ${age} is unusual for ${input.diseaseName}. Please verify.`,
      severity: "warning"
    });
    confidenceScore -= 0.2;
  } else {
    checks.push({
      category: "AGE_PLAUSIBILITY",
      passed: true,
      message: `Age ${age} is consistent with ${match ? input.diseaseName : "general health assessment"}.`,
      severity: "info"
    });
  }
  const stage = input.stage || "1";
  if (match) {
    const stageInfo = match.rule.stages[stage];
    if (stageInfo) {
      checks.push({
        category: "STAGE_MAPPING",
        passed: true,
        message: `Stage ${stage}: ${stageInfo.label}`,
        severity: "info"
      });
    } else {
      checks.push({
        category: "STAGE_MAPPING",
        passed: false,
        message: `Stage "${stage}" is not recognized for ${input.diseaseName}.`,
        severity: "warning"
      });
      confidenceScore -= 0.1;
    }
  } else {
    checks.push({
      category: "STAGE_MAPPING",
      passed: true,
      message: `Stage ${stage} noted. Generic severity mapping applied.`,
      severity: "info"
    });
  }
  const { corrected: correctedMeds, corrections } = correctMedications(input.medicines || "");
  const lowerMeds = correctedMeds.toLowerCase();
  for (const corr of corrections) {
    checks.push({
      category: "MEDICATION_ALIGNMENT",
      passed: true,
      message: corr,
      severity: "info"
    });
  }
  if (match && lowerMeds.trim()) {
    const stageInfo = match.rule.stages[stage];
    if (stageInfo && stageInfo.expectedMeds.length > 0) {
      const hasExpected = stageInfo.expectedMeds.some((med) => lowerMeds.includes(med));
      if (!hasExpected) {
        checks.push({
          category: "MEDICATION_ALIGNMENT",
          passed: false,
          message: `Stage ${stage} ${input.diseaseName} typically involves: ${stageInfo.expectedMeds.join(", ")}. Your listed medications don't include these. Please verify with your physician.`,
          severity: "warning"
        });
        confidenceScore -= 0.15;
      } else {
        checks.push({
          category: "MEDICATION_ALIGNMENT",
          passed: true,
          message: "Medications align with the reported condition and stage.",
          severity: "info"
        });
      }
    }
  } else if (match && !lowerMeds.trim()) {
    const stageInfo = match.rule.stages[stage];
    if (stageInfo && stageInfo.expectedMeds.length > 0) {
      checks.push({
        category: "MEDICATION_ALIGNMENT",
        passed: false,
        message: `No medications listed for Stage ${stage} ${input.diseaseName}. Typical medications include: ${stageInfo.expectedMeds.join(", ")}. If you are on medication, please add them.`,
        severity: "warning"
      });
      confidenceScore -= 0.1;
    }
  }
  const redFlags = detectRedFlags(input.symptoms || "", match?.rule || null);
  confidenceScore = Math.max(0, Math.min(1, confidenceScore));
  const passedChecks = checks.filter((c) => c.passed).length;
  const failedChecks = checks.filter((c) => !c.passed).length;
  const hasCritical = checks.some((c) => !c.passed && c.severity === "critical");
  const hasImmediate = redFlags.some((rf) => rf.urgency === "IMMEDIATE");
  const valid = !hasCritical && confidenceScore >= 0.5;
  let suggestedAction = "APPROVE";
  if (hasCritical || confidenceScore < 0.4) {
    suggestedAction = "REJECT";
  } else if (failedChecks > 0 || confidenceScore < 0.7) {
    suggestedAction = "REQUIRE_MANUAL_REVIEW";
  }
  const dietaryContraindications = match?.rule.dietaryRestrictions || [];
  const escalation = {
    shouldConsultDoctor: hasImmediate || redFlags.length > 0 || !valid || input.diagnosedBy === "self",
    reason: hasImmediate ? "Urgent symptoms detected that require immediate medical attention." : redFlags.length > 0 ? "Symptoms reported that should be evaluated by a healthcare professional." : !valid ? "Health profile could not be fully validated. A physician consultation is recommended." : input.diagnosedBy === "self" ? "Self-reported diagnosis should be confirmed by a healthcare professional." : void 0,
    specialtyRecommended: match?.rule.specialist,
    timeframe: hasImmediate ? "Immediately" : redFlags.length > 0 ? "Within 1 week" : !valid ? "At your earliest convenience" : void 0
  };
  const references = match?.rule.references || [];
  let riskLevel = "LOW";
  if (hasImmediate || stage === "3") riskLevel = "HIGH";
  else if (redFlags.length > 0 || stage === "2" || failedChecks > 0) riskLevel = "MODERATE";
  const medsArray = correctedMeds ? correctedMeds.split(/[,;\n]+/).map((m) => m.trim()).filter(Boolean) : [];
  const dietaryGuidance = match?.rule.detailedGuidance ? match.rule.detailedGuidance : dietaryContraindications.length > 0 ? `Avoid: ${dietaryContraindications.join(", ")}. Prioritize whole, unprocessed foods suitable for your condition.` : "No specific dietary restrictions identified. Maintain a balanced, healthy diet.";
  const nextSteps = [];
  if (escalation.shouldConsultDoctor && escalation.specialtyRecommended) {
    nextSteps.push(`Consult a ${escalation.specialtyRecommended} ${escalation.timeframe ? escalation.timeframe.toLowerCase() : "at your convenience"}.`);
  }
  for (const rf of redFlags) {
    nextSteps.push(rf.action);
  }
  if (dietaryContraindications.length > 0) {
    nextSteps.push(`Review Foods66 menu for items tagged as safe for your condition.`);
  }
  if (medsArray.length > 0) {
    nextSteps.push("Verify your medication list with your physician at your next appointment.");
  }
  if (nextSteps.length === 0) {
    nextSteps.push("Continue following your current treatment plan and healthy eating habits.");
  }
  const disclaimers = [
    "This analysis is for dietary recommendation purposes only and is NOT a medical diagnosis.",
    "Always consult your physician before making changes to medications or diet.",
    "The confidence score reflects data consistency, not clinical accuracy.",
    "If you experience any emergency symptoms, seek medical attention immediately."
  ];
  const structuredSummary = {
    patientData: {
      age,
      condition: input.diseaseName,
      stage: match ? match.rule.stages[stage]?.label || `Stage ${stage}` : `Stage ${stage}`,
      medications: medsArray
    },
    validationChecks: { total: checks.length, passed: passedChecks, failed: failedChecks },
    riskLevel,
    dietaryGuidance,
    nextSteps
  };
  return {
    valid,
    confidenceScore: Math.round(confidenceScore * 100) / 100,
    suggestedAction,
    checks,
    dietaryContraindications,
    correctedMedicines: correctedMeds,
    redFlags,
    escalation,
    references,
    disclaimers,
    structuredSummary
  };
}
var DISEASE_RULES, MED_CORRECTIONS, VAGUE_TERMS, UNIVERSAL_RED_FLAGS;
var init_healthValidation = __esm({
  "src/services/healthValidation.ts"() {
    "use strict";
    DISEASE_RULES = {
      "diabetes_type_2": {
        aliases: ["diabetes type 2", "type 2 diabetes", "diabetes mellitus type 2", "dm2", "t2dm", "type 2", "diabetes"],
        stages: {
          "1": { label: "Pre-diabetes / Early", expectedMeds: ["metformin"] },
          "2": { label: "Controlled with oral medication", expectedMeds: ["metformin", "glipizide", "glimepiride", "sitagliptin"] },
          "3": { label: "Insulin-dependent / Advanced", expectedMeds: ["insulin"] }
        },
        dietaryRestrictions: ["High Sugar", "High Glycemic Index Foods", "Refined Carbohydrates", "Sugary Beverages"],
        detailedGuidance: `### Disease Context
- **Condition:** Type 2 Diabetes
- **Patient Context:** Adult (typically managed with lifestyle changes or medication).
- **Goal:** Maintain stable blood sugar levels and reduce cardiovascular risks.

### Typical Menu & Unhealthy Items
- **Breakfast:** Sweetened cereal, white bread toast, fruit juice (High glycemic index, spikes blood sugar).
- **Lunch:** White rice, fried foods, large portions of pasta (Refined carbs).
- **Dinner:** Processed meats, creamy sauces, dessert (High saturated fat and added sugars).
- **Snacks:** Cookies, chips, sweetened beverages.

### Healthier Substitutes
- **Breakfast:** Oatmeal with nuts and seeds, whole-grain toast with avocado, whole fruit instead of juice. (Lower GI, higher fiber).
- **Lunch:** Quinoa, brown rice, baked or grilled protein (e.g., chicken, fish), steamed vegetables. (Sustained energy).
- **Dinner:** Lean proteins, salads with olive oil dressing, clear soups. (Lower calories and saturated fat).
- **Snacks:** Greek yogurt, unsalted nuts, raw vegetable sticks.

### Implementation Tips
- **Reading Labels:** Check for "Added Sugars" and total carbohydrates.
- **Portion Control:** Use the "Plate Method" (1/2 non-starchy veggies, 1/4 lean protein, 1/4 whole grains).
- **Contraindications:** Avoid sugary drinks entirely, including fruit juices and regular soda.`,
        redFlagSymptoms: [
          { symptom: "blurred vision", urgency: "WITHIN_24H", action: "May indicate diabetic retinopathy. Schedule an eye exam with an ophthalmologist." },
          { symptom: "numbness", urgency: "SCHEDULE_APPOINTMENT", action: "Numbness or tingling in extremities may indicate peripheral neuropathy. Consult a neurologist." },
          { symptom: "tingling", urgency: "SCHEDULE_APPOINTMENT", action: "Tingling in hands/feet may indicate peripheral neuropathy. Consult a neurologist." },
          { symptom: "frequent urination", urgency: "WITHIN_24H", action: "Combined with excessive thirst, may indicate uncontrolled blood sugar. Check glucose levels immediately." },
          { symptom: "extreme thirst", urgency: "WITHIN_24H", action: "May indicate hyperglycemia. Check blood glucose and consult your doctor." },
          { symptom: "slow healing", urgency: "SCHEDULE_APPOINTMENT", action: "Slow wound healing is common in diabetes. Monitor closely and consult your physician." },
          { symptom: "frequent infections", urgency: "WITHIN_24H", action: "Frequent infections may indicate poorly controlled diabetes. Seek medical review." }
        ],
        specialist: "Endocrinologist",
        ageRange: { min: 18, max: 120, note: "Type 2 Diabetes is uncommon in individuals under 18. Did you mean Type 1?" },
        references: [
          { title: "Standards of Care in Diabetes \u2014 2024", source: "American Diabetes Association (ADA)", url: "https://diabetesjournals.org/care", relevance: "Stage classification and treatment guidelines" },
          { title: "Diabetes Diet and Nutrition Guidelines", source: "CDC", url: "https://www.cdc.gov/diabetes/managing/eat-well.html", relevance: "Dietary recommendations for diabetic patients" }
        ]
      },
      "diabetes_type_1": {
        aliases: ["diabetes type 1", "type 1 diabetes", "diabetes mellitus type 1", "dm1", "t1dm", "type 1", "juvenile diabetes"],
        stages: {
          "1": { label: "Newly diagnosed", expectedMeds: ["insulin"] },
          "2": { label: "Managed with insulin therapy", expectedMeds: ["insulin"] },
          "3": { label: "With complications", expectedMeds: ["insulin"] }
        },
        dietaryRestrictions: ["High Sugar", "High Glycemic Index Foods", "Excessive Carbohydrates"],
        detailedGuidance: `### Disease Context
- **Condition:** Type 1 Diabetes
- **Patient Context:** Managed primarily with insulin therapy. Diet must be carefully coordinated with insulin dosing.
- **Goal:** Tight glycemic control, preventing severe hypo/hyperglycemia.

### Typical Menu & Unhealthy Items
- **Breakfast:** Pancakes with syrup, sweetened yogurts (Causes rapid, unpredictable blood sugar spikes).
- **Lunch:** Fast food burgers, large fries (High fat delays carb absorption, complicating insulin timing).
- **Dinner:** Heavy pasta dishes, pizza (Complex to dose insulin for prolonged carb release).
- **Snacks:** Candy, regular sodas (unless treating hypoglycemia).

### Healthier Substitutes
- **Breakfast:** Scrambled eggs, whole wheat toast, unsweetened yogurt with berries.
- **Lunch:** Whole grain wraps, lean proteins, side salad.
- **Dinner:** Grilled chicken, baked sweet potato, large portion of green vegetables.
- **Snacks:** Cheese sticks, nuts, apple slices with peanut butter.

### Implementation Tips
- **Carb Counting:** Accurately count carbohydrates to match insulin doses.
- **Meal Timing:** Keep meal times consistent.
- **Contraindications:** Avoid high-sugar foods unless actively treating a low blood sugar event.`,
        redFlagSymptoms: [
          { symptom: "blurred vision", urgency: "WITHIN_24H", action: "May indicate diabetic retinopathy. Schedule an eye exam." },
          { symptom: "nausea", urgency: "IMMEDIATE", action: "Nausea with diabetes may indicate diabetic ketoacidosis (DKA). Seek emergency care." },
          { symptom: "vomiting", urgency: "IMMEDIATE", action: "Vomiting with Type 1 Diabetes may indicate DKA. Seek emergency care immediately." },
          { symptom: "fruity breath", urgency: "IMMEDIATE", action: "Fruity breath odor is a sign of diabetic ketoacidosis. Seek emergency care." },
          { symptom: "confusion", urgency: "IMMEDIATE", action: "Mental confusion may indicate severe hypo/hyperglycemia. Seek emergency care." }
        ],
        specialist: "Endocrinologist",
        ageRange: { min: 1, max: 120 },
        references: [
          { title: "Type 1 Diabetes Management", source: "ADA", url: "https://diabetesjournals.org/care", relevance: "Insulin therapy and management guidelines" }
        ]
      },
      "hypertension": {
        aliases: ["hypertension", "high blood pressure", "htn", "bp", "high bp", "elevated blood pressure"],
        stages: {
          "1": { label: "Elevated (120-129 / <80 mmHg)", expectedMeds: [] },
          "2": { label: "Stage 1 (130-139 / 80-89 mmHg)", expectedMeds: ["lisinopril", "amlodipine", "losartan", "hydrochlorothiazide"] },
          "3": { label: "Stage 2 (\u2265140 / \u226590 mmHg)", expectedMeds: ["amlodipine", "losartan", "metoprolol", "hydrochlorothiazide"] }
        },
        dietaryRestrictions: ["High Sodium", "Processed Foods", "Excessive Caffeine", "Alcohol", "Saturated Fats"],
        detailedGuidance: `### Disease Context
- **Condition:** Hypertension (High Blood Pressure)
- **Patient Context:** Adult managing blood pressure, often salt-sensitive.
- **Goal:** Lower blood pressure, reduce risk of stroke and heart disease.

### Typical Menu & Unhealthy Items
- **Breakfast:** Bacon, sausage, heavily salted hash browns (Extremely high sodium).
- **Lunch:** Canned soups, deli meat sandwiches, pickles (Hidden sodium).
- **Dinner:** Frozen pre-packaged meals, soy sauce-heavy dishes (Excessive sodium and preservatives).
- **Snacks:** Salted chips, pretzels, salted nuts.

### Healthier Substitutes
- **Breakfast:** Oatmeal with fresh fruit, unsalted eggs, whole grain toast.
- **Lunch:** Homemade soup with low-sodium broth, fresh roasted poultry, fresh salads.
- **Dinner:** Freshly prepared fish or chicken, steamed vegetables flavored with herbs instead of salt.
- **Snacks:** Fresh fruits, unsalted nuts, carrot sticks.

### Implementation Tips
- **Reading Labels:** Look for "Low Sodium" or "No Salt Added" (aim for < 1500-2300mg total per day).
- **Flavoring:** Use herbs, spices, lemon juice, and vinegar instead of salt.
- **Contraindications:** Avoid high-sodium processed foods, cured meats, and excessive alcohol.`,
        redFlagSymptoms: [
          { symptom: "severe headache", urgency: "IMMEDIATE", action: "Severe headache with hypertension may indicate hypertensive crisis. Seek emergency care." },
          { symptom: "chest pain", urgency: "IMMEDIATE", action: "Chest pain is a medical emergency. Call emergency services immediately." },
          { symptom: "vision changes", urgency: "IMMEDIATE", action: "Sudden vision changes may indicate hypertensive emergency. Seek immediate care." },
          { symptom: "difficulty breathing", urgency: "IMMEDIATE", action: "Difficulty breathing with hypertension requires immediate medical attention." },
          { symptom: "nosebleed", urgency: "WITHIN_24H", action: "Frequent nosebleeds may indicate poorly controlled blood pressure. Consult your physician." },
          { symptom: "dizziness", urgency: "WITHIN_24H", action: "Dizziness may be medication-related or indicate blood pressure fluctuations. Consult your doctor." }
        ],
        specialist: "Cardiologist",
        ageRange: { min: 10, max: 120, note: "Hypertension is uncommon in children under 10. Please verify the diagnosis." },
        references: [
          { title: "ACC/AHA Guideline for Prevention, Detection, Evaluation, and Management of High Blood Pressure", source: "American Heart Association", url: "https://www.heart.org/en/health-topics/high-blood-pressure", relevance: "Blood pressure staging and treatment guidelines" },
          { title: "DASH Eating Plan", source: "NHLBI", url: "https://www.nhlbi.nih.gov/education/dash-eating-plan", relevance: "Dietary approaches to manage hypertension" }
        ]
      },
      "ckd": {
        aliases: ["chronic kidney disease", "kidney disease", "ckd", "renal disease", "renal failure", "kidney failure"],
        stages: {
          "1": { label: "GFR \u2265 90 (Mild / Normal function with damage)", expectedMeds: [] },
          "2": { label: "GFR 30-89 (Moderate reduction)", expectedMeds: ["ace inhibitor", "lisinopril", "enalapril"] },
          "3": { label: "GFR < 30 (Severe / Approaching dialysis)", expectedMeds: ["erythropoietin", "phosphate binder", "calcitriol"] }
        },
        dietaryRestrictions: ["High Potassium", "High Phosphorus", "Excessive Protein", "High Sodium", "Processed Meats"],
        detailedGuidance: `### Disease Context
- **Condition:** Chronic Kidney Disease (CKD)
- **Patient Context:** Requires strict control of minerals to prevent further kidney damage.
- **Goal:** Manage blood pressure, reduce kidney workload, and control potassium/phosphorus.

### Typical Menu & Unhealthy Items
- **Breakfast:** Banana, orange juice, bran cereal (High potassium and phosphorus).
- **Lunch:** Deli meats, cheese, whole wheat bread (High sodium and phosphorus).
- **Dinner:** Potatoes, tomatoes, dark colas, processed meats (High potassium, high phosphorus, high sodium).
- **Snacks:** Chocolate, nuts, salted chips (High phosphorus and sodium).

### Healthier Substitutes
- **Breakfast:** Apples, berries, refined white bread/rice (Lower potassium/phosphorus).
- **Lunch:** Fresh roasted chicken, cucumber, light-colored sodas (lemon-lime).
- **Dinner:** Cauliflower, green beans, lean meats, white rice.
- **Snacks:** Popcorn (unsalted), grapes, plain crackers.

### Implementation Tips
- **Portion Control:** Strictly control protein portion sizes based on nephrologist's recommendation.
- **Preparation:** Leaching potatoes and vegetables can reduce potassium content.
- **Contraindications:** Avoid dark colas, processed meats, star fruit, and salt substitutes (which contain potassium).`,
        redFlagSymptoms: [
          { symptom: "blood in urine", urgency: "WITHIN_24H", action: "Blood in urine (hematuria) requires urgent nephrology consultation." },
          { symptom: "swelling", urgency: "WITHIN_24H", action: "Swelling in legs, ankles, or face may indicate worsening kidney function. Contact your nephrologist." },
          { symptom: "difficulty breathing", urgency: "IMMEDIATE", action: "Difficulty breathing with CKD may indicate fluid overload. Seek emergency care." },
          { symptom: "severe fatigue", urgency: "SCHEDULE_APPOINTMENT", action: "Severe fatigue may indicate anemia from CKD. Schedule a blood test." },
          { symptom: "decreased urination", urgency: "WITHIN_24H", action: "Significant decrease in urine output requires medical evaluation." }
        ],
        specialist: "Nephrologist",
        ageRange: { min: 5, max: 120 },
        references: [
          { title: "KDIGO Clinical Practice Guidelines for CKD", source: "Kidney Disease: Improving Global Outcomes (KDIGO) 2024", url: "https://kdigo.org/guidelines/", relevance: "CKD staging and management guidelines" },
          { title: "Nutrition in CKD", source: "National Kidney Foundation", url: "https://www.kidney.org/nutrition", relevance: "Dietary guidelines for kidney disease" }
        ]
      },
      "asthma": {
        aliases: ["asthma", "bronchial asthma", "reactive airway disease"],
        stages: {
          "1": { label: "Intermittent / Mild", expectedMeds: ["salbutamol", "albuterol"] },
          "2": { label: "Moderate persistent", expectedMeds: ["inhaled corticosteroid", "budesonide", "fluticasone", "montelukast"] },
          "3": { label: "Severe persistent", expectedMeds: ["fluticasone", "salmeterol", "prednisone", "omalizumab"] }
        },
        dietaryRestrictions: ["Sulfites", "Known Allergens"],
        detailedGuidance: `### Disease Context
- **Condition:** Asthma
- **Patient Context:** Chronic airway inflammation; triggered by environmental or dietary factors.
- **Goal:** Reduce systemic inflammation and avoid dietary triggers.

### Typical Menu & Unhealthy Items
- **Breakfast:** Dried fruits, preserved meats (Contain sulfites which can trigger asthma).
- **Lunch:** Fast food, highly processed meals (High saturated fats may increase inflammation).
- **Dinner:** Wine, pickled foods (High sulfites and histamines).
- **Snacks:** Packaged snacks with artificial additives.

### Healthier Substitutes
- **Breakfast:** Fresh fruits, oatmeal.
- **Lunch:** Fresh salads, grilled fish (Omega-3 fatty acids reduce inflammation).
- **Dinner:** Freshly prepared meals with ginger, turmeric, and garlic.
- **Snacks:** Fresh vegetables, yogurt.

### Implementation Tips
- **Awareness:** Keep a food diary to identify personal triggers (e.g., dairy or gluten if sensitive).
- **Anti-inflammatory Diet:** Focus on foods rich in Omega-3s, Vitamin D, and antioxidants.
- **Contraindications:** Avoid foods high in sulfites (dried fruits, wine, pickled foods) if sensitive.`,
        redFlagSymptoms: [
          { symptom: "difficulty breathing", urgency: "IMMEDIATE", action: "Severe breathing difficulty requires emergency care. Use rescue inhaler and call emergency services." },
          { symptom: "wheezing", urgency: "WITHIN_24H", action: "Persistent wheezing not relieved by rescue inhaler \u2014 seek medical attention." },
          { symptom: "chest tightness", urgency: "WITHIN_24H", action: "Chest tightness may indicate worsening asthma. Consult your pulmonologist." },
          { symptom: "blue lips", urgency: "IMMEDIATE", action: "Blue lips or fingertips indicate oxygen deprivation. Call emergency services immediately." }
        ],
        specialist: "Pulmonologist",
        ageRange: { min: 1, max: 120 },
        references: [
          { title: "Global Strategy for Asthma Management and Prevention", source: "GINA 2024", url: "https://ginasthma.org/", relevance: "Asthma classification and treatment step therapy" }
        ]
      },
      "thyroid": {
        aliases: ["hypothyroidism", "thyroid", "underactive thyroid", "hashimoto", "hyperthyroidism", "overactive thyroid", "graves disease"],
        stages: {
          "1": { label: "Subclinical / Mild", expectedMeds: [] },
          "2": { label: "Clinical / Moderate", expectedMeds: ["levothyroxine", "methimazole"] },
          "3": { label: "Severe / With complications", expectedMeds: ["levothyroxine", "methimazole", "propranolol"] }
        },
        dietaryRestrictions: ["Excessive Soy", "Raw Cruciferous Vegetables (in large amounts)", "Excessive Iodine"],
        detailedGuidance: `### Disease Context
- **Condition:** Thyroid Disorder (Hypothyroidism/Hyperthyroidism)
- **Patient Context:** Metabolic regulation issues; medication absorption is easily affected.
- **Goal:** Support thyroid function and ensure optimal medication absorption.

### Typical Menu & Unhealthy Items
- **Breakfast:** Large bowl of soy milk, raw kale smoothie (Goitrogens can interfere with thyroid function).
- **Lunch:** Highly processed foods with excessive iodine or hidden soy.
- **Dinner:** Fast food, excessive cruciferous vegetables (raw).
- **Snacks:** Soy-based bars.

### Healthier Substitutes
- **Breakfast:** Almond or oat milk, cooked greens (cooking reduces goitrogenic activity).
- **Lunch:** Lean proteins, whole grains, foods rich in selenium (e.g., brazil nuts in moderation).
- **Dinner:** Steamed broccoli or cauliflower (cooking is key), grilled fish.
- **Snacks:** Fresh fruit, nuts (non-soy).

### Implementation Tips
- **Medication Timing:** Take thyroid medication on an empty stomach, waiting at least 30-60 minutes before eating.
- **Preparation:** Always cook cruciferous vegetables (cabbage, broccoli, kale) to reduce goitrogens.
- **Contraindications:** Avoid consuming calcium or iron supplements within 4 hours of taking thyroid medication. Avoid excessive soy.`,
        redFlagSymptoms: [
          { symptom: "rapid heartbeat", urgency: "WITHIN_24H", action: "Rapid heart rate may indicate thyroid storm. Seek urgent medical evaluation." },
          { symptom: "extreme fatigue", urgency: "SCHEDULE_APPOINTMENT", action: "Severe fatigue may indicate dosage adjustment needed. Consult endocrinologist." },
          { symptom: "sudden weight change", urgency: "SCHEDULE_APPOINTMENT", action: "Rapid weight gain/loss may indicate thyroid level changes. Schedule blood work." },
          { symptom: "neck swelling", urgency: "WITHIN_24H", action: "Neck swelling may indicate goiter. Consult your endocrinologist." }
        ],
        specialist: "Endocrinologist",
        ageRange: { min: 5, max: 120 },
        references: [
          { title: "ATA Guidelines for Thyroid Disease", source: "American Thyroid Association", url: "https://www.thyroid.org/professionals/ata-professional-guidelines/", relevance: "Thyroid disease management and dietary considerations" }
        ]
      }
    };
    MED_CORRECTIONS = {
      "insuline": "insulin",
      "inslin": "insulin",
      "metformine": "metformin",
      "metforman": "metformin",
      "amlodipin": "amlodipine",
      "amlodopine": "amlodipine",
      "lisinpril": "lisinopril",
      "lisinoprel": "lisinopril",
      "losarton": "losartan",
      "metopralol": "metoprolol",
      "metropolol": "metoprolol",
      "glipzide": "glipizide",
      "levothyroxin": "levothyroxine",
      "levothroxine": "levothyroxine",
      "methimazol": "methimazole",
      "prednezone": "prednisone",
      "prednisol": "prednisone",
      "fluticason": "fluticasone",
      "salbutomol": "salbutamol",
      "montelukest": "montelukast",
      "hydrochlorthiazide": "hydrochlorothiazide",
      "enalopril": "enalapril"
    };
    VAGUE_TERMS = ["pain", "hurt", "sick", "ill", "ache", "problem", "issue", "bad", "not well", "unwell", "sore"];
    UNIVERSAL_RED_FLAGS = [
      { symptom: "chest pain", urgency: "IMMEDIATE", action: "Chest pain is a medical emergency. Call emergency services (112/911) immediately." },
      { symptom: "difficulty breathing", urgency: "IMMEDIATE", action: "Severe breathing difficulty requires emergency medical attention." },
      { symptom: "unconscious", urgency: "IMMEDIATE", action: "Loss of consciousness is a medical emergency. Call emergency services immediately." },
      { symptom: "seizure", urgency: "IMMEDIATE", action: "Seizure activity requires immediate emergency care." },
      { symptom: "unexplained weight loss", urgency: "SCHEDULE_APPOINTMENT", action: "Unexplained weight loss of >10% body weight should be evaluated by a physician." },
      { symptom: "persistent fever", urgency: "WITHIN_24H", action: "Persistent fever (>3 days) requires medical evaluation." },
      { symptom: "blood in stool", urgency: "WITHIN_24H", action: "Blood in stool requires prompt medical evaluation." }
    ];
  }
});

// src/middlewares/validation.ts
import { z } from "zod";
var validateBody, mongoId, registerSchema, loginSchema, createFoodSchema, updateFoodSchema, updateOrderStatusSchema, feedbackSchema, couponCreateSchema, aiChatSchema, reviewSchema;
var init_validation = __esm({
  "src/middlewares/validation.ts"() {
    "use strict";
    init_firestoreModel();
    validateBody = (schema) => {
      return (req, res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
          const errors = result.error.issues.map((e) => ({
            field: e.path.join("."),
            message: e.message
          }));
          res.status(400).json({
            success: false,
            message: "Validation failed",
            code: "VALIDATION_ERROR",
            errors
          });
          return;
        }
        req.body = result.data;
        next();
      };
    };
    mongoId = z.string().refine(
      (val) => ObjectIdMock.isValid(val),
      { message: "Invalid ID format" }
    );
    registerSchema = z.object({
      name: z.string().min(1, "Name is required").max(100),
      email: z.string().email("Invalid email address").max(255),
      password: z.string().min(6, "Password must be at least 6 characters").max(128),
      healthProfile: z.object({
        hasIssues: z.boolean().optional(),
        age: z.union([z.number(), z.string()]).optional(),
        diseaseName: z.string().optional(),
        condition: z.string().optional(),
        stage: z.string().optional(),
        severity: z.string().optional(),
        medicines: z.string().optional(),
        medications: z.string().optional(),
        diagnosedBy: z.string().optional(),
        symptoms: z.string().optional(),
        dietaryMemo: z.string().optional()
      }).optional()
    });
    loginSchema = z.object({
      email: z.string().email("Invalid email address").max(255),
      password: z.string().min(1, "Password is required").max(128)
    });
    createFoodSchema = z.object({
      name: z.string().min(1, "Food name is required").max(200),
      description: z.string().min(1, "Description is required").max(2e3),
      price: z.number().min(1, "Price must be at least \u20B91").max(1e5),
      category: z.string().min(1, "Category is required").max(100),
      image: z.string().min(1, "Image is required"),
      available: z.boolean().optional().default(true),
      stock: z.number().int().min(0).optional().default(100)
    });
    updateFoodSchema = z.object({
      name: z.string().min(1).max(200).optional(),
      description: z.string().min(1).max(2e3).optional(),
      price: z.number().min(1).max(1e5).optional(),
      category: z.string().min(1).max(100).optional(),
      image: z.string().optional().nullable(),
      available: z.boolean().optional(),
      stock: z.number().int().min(0).optional()
    });
    updateOrderStatusSchema = z.object({
      status: z.enum([
        "PLACED",
        "PAYMENT_PENDING",
        "PAID",
        "PAYMENT_CONFIRMED",
        "RESTAURANT_CONFIRMED",
        "PREPARING",
        "READY_FOR_PICKUP",
        "ASSIGNED",
        "ACCEPTED",
        "PICKED_UP",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "CANCELLED",
        "REFUNDED",
        "FAILED"
      ]),
      note: z.string().max(500).optional().default("")
    });
    feedbackSchema = z.object({
      orderId: z.string().min(1, "Order ID is required"),
      rating: z.number().int().min(1).max(5),
      deliveryRating: z.number().int().min(1).max(5),
      comment: z.string().max(2e3).optional().default("")
    });
    couponCreateSchema = z.object({
      code: z.string().min(1, "Code is required").max(50),
      description: z.string().max(500).optional().default(""),
      discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT", "FREE_DELIVERY"]),
      discountValue: z.number().min(0),
      minimumOrderAmount: z.number().min(0).optional().default(0),
      maximumDiscount: z.number().min(0).optional(),
      startDate: z.string().optional(),
      expiryDate: z.string().min(1, "Expiry date is required"),
      usageLimit: z.number().int().min(1).optional().default(100),
      perUserLimit: z.number().int().min(1).optional().default(1),
      applicableCategories: z.array(z.string()).optional().default([]),
      applicableFoods: z.array(z.string()).optional().default([])
    });
    aiChatSchema = z.object({
      message: z.string().min(1, "Message is required").max(2e3),
      healthProfile: z.object({
        diseaseName: z.string().optional(),
        dietaryMemo: z.string().optional(),
        stage: z.string().optional(),
        medicines: z.string().optional(),
        hasIssues: z.boolean().optional()
      }).optional(),
      history: z.array(z.object({
        role: z.string(),
        text: z.string()
      })).optional().default([])
    });
    reviewSchema = z.object({
      text: z.string().min(1, "Review text is required").max(2e3)
    });
  }
});

// src/routes/users.ts
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt2 from "jsonwebtoken";
var router, generateToken, users_default;
var init_users = __esm({
  "src/routes/users.ts"() {
    "use strict";
    init_User();
    init_auth();
    init_queueService();
    init_healthValidation();
    init_envConfig();
    init_validation();
    init_logger();
    router = Router();
    generateToken = (id) => {
      return jwt2.sign({ id }, env.JWT_SECRET, {
        expiresIn: "30d"
      });
    };
    router.post("/register", validateBody(registerSchema), async (req, res) => {
      try {
        const { name, email, password, healthProfile } = req.body;
        if (!name || !email || !password) {
          res.status(400).json({ error: "Please provide name, email, and password" });
          return;
        }
        const userExists = await User.findOne({ email });
        if (userExists) {
          res.status(409).json({ error: "An account with this email already exists" });
          return;
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        let formattedHealthProfile = void 0;
        if (healthProfile && healthProfile.hasIssues) {
          formattedHealthProfile = {
            hasIssues: true,
            diseaseName: healthProfile.diseaseName || healthProfile.condition || "",
            condition: healthProfile.condition || healthProfile.diseaseName || "",
            stage: healthProfile.stage || healthProfile.severity || "1",
            severity: healthProfile.severity || healthProfile.stage || "1",
            medicines: healthProfile.medicines || healthProfile.medications || "",
            medications: healthProfile.medications || healthProfile.medicines || "",
            diagnosedBy: healthProfile.diagnosedBy || "self",
            symptoms: healthProfile.symptoms || "",
            dietaryMemo: healthProfile.dietaryMemo || "",
            validatedAt: /* @__PURE__ */ new Date()
          };
          if (healthProfile.age && !isNaN(Number(healthProfile.age))) {
            formattedHealthProfile.age = Number(healthProfile.age);
          }
        } else if (healthProfile) {
          formattedHealthProfile = { hasIssues: false };
        }
        const user = await User.create({
          name,
          email,
          password: hashedPassword,
          role: "customer",
          healthProfile: formattedHealthProfile
        });
        if (notificationQueue) {
          try {
            await notificationQueue.add("sendEmail", {
              to: email,
              subject: "Welcome to Foods66!",
              body: "Thank you for registering."
            });
          } catch (queueErr) {
            logger.warn("Failed to add welcome email to queue:", queueErr?.message || queueErr);
          }
        }
        if (user) {
          res.status(201).json({
            token: generateToken(user._id.toString()),
            user: {
              id: user._id,
              name: user.name,
              email: user.email,
              role: user.role
            }
          });
        } else {
          res.status(400).json({ error: "Invalid user data" });
        }
      } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ error: error?.message || "Server error during registration" });
      }
    });
    router.post("/login", validateBody(loginSchema), async (req, res) => {
      try {
        const { email, password } = req.body;
        if (!email || !password) {
          res.status(400).json({ error: "Please provide email and password" });
          return;
        }
        const user = await User.findOne({ email });
        if (user && await bcrypt.compare(password, user.password)) {
          res.json({
            token: generateToken(user._id.toString()),
            user: {
              id: user._id,
              name: user.name,
              email: user.email,
              role: user.role
            }
          });
        } else {
          logger.security("LOGIN_FAILED", "Invalid email or password attempt", { email: req.body.email, ip: req.ip });
          res.status(401).json({ error: "Invalid email or password" });
        }
      } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: error?.message || "Server error during login" });
      }
    });
    router.all(["/reverse-geocode", "/detect-location"], async (req, res) => {
      let lat = req.body?.lat || req.query?.lat;
      let lng = req.body?.lng || req.query?.lng;
      let detectedCity = "Mumbai";
      let detectedState = "Maharashtra";
      let detectedZip = "400070";
      if (!lat || !lng) {
        try {
          const ipRes = await fetch("http://ip-api.com/json", { signal: AbortSignal.timeout(4e3) });
          if (ipRes.ok) {
            const ipData = await ipRes.json();
            if (ipData && ipData.lat && ipData.lon) {
              lat = ipData.lat;
              lng = ipData.lon;
              detectedCity = ipData.city || detectedCity;
              detectedState = ipData.regionName || detectedState;
              detectedZip = ipData.zip || detectedZip;
            }
          }
        } catch (e) {
          console.warn("IP geolocation fallback triggered default coords:", e);
          lat = 19.0748;
          lng = 72.8856;
        }
      }
      if (!lat || !lng) {
        lat = 19.0748;
        lng = 72.8856;
      }
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
      try {
        const response = await fetch(url, {
          headers: {
            "User-Agent": "Foods66-App/1.0 (admin@foods66.com)"
          },
          signal: AbortSignal.timeout(4e3)
        });
        if (response.ok) {
          const data = await response.json();
          const address = data.address || {};
          res.json({
            success: true,
            doorNo: address.house_number || "Flat 101",
            landmark: address.suburb || address.neighbourhood || address.road || "Kurla West",
            district: address.city || address.town || address.county || detectedCity,
            pincode: address.postcode || detectedZip,
            state: address.state || detectedState,
            lat: Number(lat),
            lng: Number(lng)
          });
          return;
        }
      } catch (err) {
        console.warn("Nominatim reverse geocode failed, returning IP geocode result:", err);
      }
      res.json({
        success: true,
        doorNo: "Flat 101",
        landmark: "Kurla West",
        district: detectedCity,
        state: detectedState,
        pincode: detectedZip,
        lat: Number(lat),
        lng: Number(lng)
      });
    });
    router.post("/validate-health", async (req, res) => {
      try {
        const body = req.body || {};
        const rawAge = body.age;
        const diseaseName = (body.diseaseName || body.condition || "").toString().trim();
        const stage = (body.stage || body.severity || "1").toString().trim();
        const medicines = (body.medicines || body.medications || "").toString().trim();
        const symptoms = body.symptoms ? body.symptoms.toString().trim() : "";
        const diagnosedBy = (body.diagnosedBy || "self").toString().trim();
        if (rawAge === void 0 || rawAge === null || rawAge === "") {
          res.status(400).json({
            success: false,
            code: "INVALID_HEALTH_PROFILE",
            message: "Please enter a valid age."
          });
          return;
        }
        const age = Number(rawAge);
        if (isNaN(age) || !Number.isInteger(age) || age < 1 || age > 120) {
          res.status(400).json({
            success: false,
            code: "INVALID_HEALTH_PROFILE",
            message: "Please enter a valid age between 1 and 120."
          });
          return;
        }
        if (!diseaseName) {
          res.status(400).json({
            success: false,
            code: "INVALID_HEALTH_PROFILE",
            message: "Condition or disease name is required."
          });
          return;
        }
        const result = validateHealthProfile({
          age,
          diseaseName,
          stage,
          medicines,
          symptoms: symptoms || void 0,
          diagnosedBy
        });
        let aiMemo = null;
        const isAiConfigured = Boolean(env.GEMINI_API_KEY && !env.GEMINI_API_KEY.includes("PLACEHOLDER"));
        if (isAiConfigured) {
          try {
            const { GoogleGenAI: GoogleGenAI4 } = await import("@google/genai");
            const ai = new GoogleGenAI4({ apiKey: env.GEMINI_API_KEY });
            const prompt = `Analyze this health profile for dietary recommendations in a food delivery app.
Patient Age: ${age}
Condition/Disease: ${diseaseName}
Severity/Stage: ${stage}
Medications: ${medicines}
Symptoms: ${symptoms || "None"}
Dietary Contraindications: ${result.dietaryContraindications.join(", ") || "None"}

Provide a 2-sentence dietary summary.`;
            const timeoutPromise = new Promise(
              (_, reject) => setTimeout(() => reject(new Error("AI_TIMEOUT")), 5e3)
            );
            const aiPromise = ai.models.generateContent({
              model: "gemini-2.5-flash",
              contents: prompt
            });
            const aiRes = await Promise.race([aiPromise, timeoutPromise]);
            aiMemo = aiRes?.text?.trim() || null;
          } catch (aiErr) {
            aiMemo = null;
          }
        }
        const fallbackMemo = result.dietaryContraindications.length > 0 ? `Avoid: ${result.dietaryContraindications.join(", ")}` : "Safe dietary profile";
        const finalDietaryMemo = aiMemo || fallbackMemo;
        res.status(200).json({
          success: true,
          analysisAvailable: aiMemo !== null,
          valid: result.valid,
          confidenceScore: result.confidenceScore,
          suggestedAction: result.suggestedAction,
          checks: result.checks,
          dietaryContraindications: result.dietaryContraindications,
          correctedMedicines: result.correctedMedicines || medicines,
          redFlags: result.redFlags,
          escalation: result.escalation,
          references: result.references,
          disclaimers: result.disclaimers,
          structuredSummary: result.structuredSummary,
          analysis: {
            dietaryMemo: finalDietaryMemo,
            contraindications: result.dietaryContraindications,
            recommendations: [
              `Targeted nutrition for ${diseaseName}`,
              "Low glycemic and balanced nutrient options prioritized"
            ]
          },
          message: aiMemo !== null ? "Health profile analyzed successfully." : "Health profile validated successfully. AI analysis is temporarily unavailable."
        });
      } catch (error) {
        console.error("Health validation error:", error);
        res.status(500).json({
          success: false,
          code: "HEALTH_VALIDATION_ERROR",
          message: "Health validation encountered an unexpected server error."
        });
      }
    });
    router.get("/me", protect, async (req, res) => {
      try {
        if (!req.user) {
          res.status(401).json({ error: "Not authorized" });
          return;
        }
        res.json({
          user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role
          }
        });
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch user profile" });
      }
    });
    router.put("/profile", protect, async (req, res) => {
      try {
        const { name, phone, address } = req.body;
        const updates = {};
        if (name) updates.name = name;
        if (phone) updates.phone = phone;
        if (address) updates.address = address;
        const user = await User.findByIdAndUpdate(req.user?._id, updates, { new: true, runValidators: true }).select("-password");
        res.json({ success: true, user });
      } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update profile" });
      }
    });
    router.get("/", protect, authorize("admin"), async (req, res) => {
      try {
        const users = await User.find().select("-password");
        res.json(users);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch users" });
      }
    });
    router.get("/:id", protect, authorize("admin"), async (req, res) => {
      try {
        const user = await User.findById(req.params.id).select("-password");
        if (!user) {
          res.status(404).json({ error: "User not found" });
          return;
        }
        res.json(user);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch user" });
      }
    });
    router.put("/:id", protect, authorize("admin"), async (req, res) => {
      try {
        const { name, email, phone, address, isSuspended, availability, deliveryArea, vehicle } = req.body;
        const allowedUpdates = {};
        if (name !== void 0) allowedUpdates.name = name;
        if (email !== void 0) allowedUpdates.email = email;
        if (phone !== void 0) allowedUpdates.phone = phone;
        if (address !== void 0) allowedUpdates.address = address;
        if (isSuspended !== void 0) allowedUpdates.isSuspended = isSuspended;
        if (availability !== void 0) allowedUpdates.availability = availability;
        if (deliveryArea !== void 0) allowedUpdates.deliveryArea = deliveryArea;
        if (vehicle !== void 0) allowedUpdates.vehicle = vehicle;
        if (req.body.role !== void 0) allowedUpdates.role = req.body.role;
        const user = await User.findByIdAndUpdate(req.params.id, allowedUpdates, { new: true, runValidators: true }).select("-password");
        if (!user) {
          res.status(404).json({ error: "User not found" });
          return;
        }
        res.json(user);
      } catch (error) {
        res.status(500).json({ error: "Failed to update user" });
      }
    });
    router.delete("/:id", protect, authorize("admin"), async (req, res) => {
      try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
          res.status(404).json({ error: "User not found" });
          return;
        }
        res.json({ message: "User deleted successfully" });
      } catch (error) {
        res.status(500).json({ error: "Failed to delete user" });
      }
    });
    router.put("/change-password", protect, async (req, res) => {
      try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
          res.status(400).json({ success: false, message: "Current password and new password are required" });
          return;
        }
        if (newPassword.length < 6) {
          res.status(400).json({ success: false, message: "New password must be at least 6 characters" });
          return;
        }
        const user = await User.findById(req.user?._id);
        if (!user) {
          res.status(404).json({ success: false, message: "User not found" });
          return;
        }
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
          res.status(401).json({ success: false, message: "Current password is incorrect" });
          return;
        }
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();
        res.json({ success: true, message: "Password changed successfully" });
      } catch (error) {
        res.status(500).json({ success: false, message: "Failed to change password" });
      }
    });
    users_default = router;
  }
});

// src/models/Food.ts
var generateFoodImagePath, Food;
var init_Food = __esm({
  "src/models/Food.ts"() {
    "use strict";
    init_firestoreModel();
    generateFoodImagePath = (name) => {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      return `/uploads/foods/${slug}.webp`;
    };
    Food = createFirestoreModel("foods");
  }
});

// src/services/cacheService.ts
import Redis2 from "ioredis";
var redis, getCache, setCache;
var init_cacheService = __esm({
  "src/services/cacheService.ts"() {
    "use strict";
    redis = new Redis2({
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: parseInt(process.env.REDIS_PORT || "6379"),
      lazyConnect: true,
      enableOfflineQueue: false,
      retryStrategy: () => null
      // give up immediately, no reconnect loop
    });
    redis.on("error", () => {
    });
    getCache = async (key) => {
      if (redis.status !== "ready") return null;
      try {
        const data = await redis.get(key);
        return data ? JSON.parse(data) : null;
      } catch {
        return null;
      }
    };
    setCache = async (key, value, ttlSeconds = 3600) => {
      if (redis.status !== "ready") return;
      try {
        await redis.setex(key, ttlSeconds, JSON.stringify(value));
      } catch {
      }
    };
  }
});

// src/services/pricingService.ts
function isRushHour(date = /* @__PURE__ */ new Date()) {
  const hour = date.getHours();
  return hour >= 12 && hour <= 14 || hour >= 19 && hour <= 21;
}
function applyDynamicPrice(basePrice, date) {
  if (isRushHour(date)) {
    return Math.round(basePrice * SURGE_MULTIPLIER);
  }
  return basePrice;
}
function calculateOrderPricing(params) {
  const { subtotal, discountAmount = 0, freeDelivery = false } = params;
  const deliveryFee = freeDelivery ? 0 : STANDARD_DELIVERY_FEE;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const tax = Math.round(taxableAmount * TAX_RATE);
  const grandTotal = Math.max(0, taxableAmount + deliveryFee + tax);
  return {
    subtotal,
    deliveryFee,
    taxableAmount,
    tax,
    discountAmount,
    grandTotal
  };
}
var STANDARD_DELIVERY_FEE, TAX_RATE, SURGE_MULTIPLIER;
var init_pricingService = __esm({
  "src/services/pricingService.ts"() {
    "use strict";
    STANDARD_DELIVERY_FEE = 40;
    TAX_RATE = 0.05;
    SURGE_MULTIPLIER = 1.1;
  }
});

// src/routes/foods.ts
import { Router as Router2 } from "express";
import fs2 from "fs";
import path2 from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
var __filename2, __dirname2, router2, foods_default;
var init_foods = __esm({
  "src/routes/foods.ts"() {
    "use strict";
    init_Food();
    init_cacheService();
    init_auth();
    init_validation();
    init_pricingService();
    __filename2 = fileURLToPath2(import.meta.url);
    __dirname2 = path2.dirname(__filename2);
    router2 = Router2();
    router2.get("/", async (req, res) => {
      try {
        const category = req.query.category;
        const search = req.query.search || req.query.q;
        const cacheKey = category || search ? `foods:filter:${category || ""}:${search || ""}` : "foods:all";
        let foods = await getCache(cacheKey);
        if (!foods) {
          const filter = {};
          if (category && category !== "All") {
            filter.category = category;
          }
          if (search && search.trim()) {
            const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const regex = new RegExp(escaped, "i");
            filter.$or = [
              { name: regex },
              { description: regex },
              { category: regex }
            ];
          }
          foods = await Food.find(filter).lean();
          await setCache(cacheKey, foods, 300);
        }
        const now = /* @__PURE__ */ new Date();
        foods = foods.map((food) => {
          const dynamicPrice = applyDynamicPrice(food.price, now);
          if (dynamicPrice !== food.price) {
            return {
              ...food,
              originalPrice: food.price,
              price: dynamicPrice
            };
          }
          return food;
        });
        res.json(foods);
      } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch foods", code: "FOODS_FETCH_ERROR" });
      }
    });
    router2.get("/search/aggregate", async (req, res) => {
      try {
        const { category, minPrice, maxPrice, sort } = req.query;
        const pipeline = [];
        const matchStage = {};
        if (category) matchStage.category = category;
        if (minPrice || maxPrice) {
          matchStage.price = {};
          if (minPrice) matchStage.price.$gte = Number(minPrice);
          if (maxPrice) matchStage.price.$lte = Number(maxPrice);
        }
        if (Object.keys(matchStage).length > 0) {
          pipeline.push({ $match: matchStage });
        }
        if (sort === "price_asc") pipeline.push({ $sort: { price: 1 } });
        else if (sort === "price_desc") pipeline.push({ $sort: { price: -1 } });
        const foods = await Food.aggregate(pipeline.length > 0 ? pipeline : [{ $match: {} }]);
        res.json(foods);
      } catch (error) {
        res.status(500).json({ success: false, message: "Failed to aggregate foods", code: "FOODS_AGGREGATE_ERROR" });
      }
    });
    router2.get("/:id", async (req, res) => {
      try {
        const food = await Food.findById(req.params.id);
        if (!food) {
          res.status(404).json({ success: false, message: "Food not found", code: "FOOD_NOT_FOUND" });
          return;
        }
        res.json(food);
      } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch food", code: "FOOD_FETCH_ERROR" });
      }
    });
    router2.post("/", protect, authorize("admin", "restaurant"), validateBody(createFoodSchema), async (req, res) => {
      try {
        const body = req.body;
        const imageValue = body.image;
        if (!imageValue.startsWith("/") && !imageValue.startsWith("http")) {
          res.status(400).json({ success: false, message: "Image must be a valid path (starting with /) or a URL", code: "INVALID_IMAGE" });
          return;
        }
        const food = new Food(body);
        await food.save();
        res.status(201).json(food);
      } catch (error) {
        res.status(500).json({ success: false, message: "Failed to create food", code: "FOOD_CREATE_ERROR" });
      }
    });
    router2.put("/:id", protect, authorize("admin", "restaurant"), validateBody(updateFoodSchema), async (req, res) => {
      try {
        const body = req.body;
        const existing = await Food.findById(req.params.id);
        if (!existing) {
          res.status(404).json({ success: false, message: "Food not found", code: "FOOD_NOT_FOUND" });
          return;
        }
        if (body.image !== void 0 && (body.image === null || typeof body.image === "string" && body.image.trim() === "")) {
          body.image = generateFoodImagePath(existing.name);
        }
        const oldImage = existing.image;
        const imageChanged = body.image && body.image !== oldImage && oldImage.startsWith("/uploads/foods/");
        const food = await Food.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
        if (imageChanged && food) {
          const baseName = oldImage.replace(".webp", "");
          const toDelete = [
            oldImage,
            `${baseName}-medium.webp`,
            `${baseName}-thumb.webp`
          ];
          toDelete.forEach((img) => {
            const absolutePath = path2.join(__dirname2, "../../", img);
            if (fs2.existsSync(absolutePath)) {
              try {
                fs2.unlinkSync(absolutePath);
              } catch (err) {
                console.error("Failed to delete old image:", img, err);
              }
            }
          });
        }
        res.json(food);
      } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update food", code: "FOOD_UPDATE_ERROR" });
      }
    });
    router2.delete("/:id", protect, authorize("admin", "restaurant"), async (req, res) => {
      try {
        const food = await Food.findByIdAndDelete(req.params.id);
        if (!food) {
          res.status(404).json({ success: false, message: "Food not found", code: "FOOD_NOT_FOUND" });
          return;
        }
        res.json({ success: true, message: "Food deleted successfully" });
      } catch (error) {
        res.status(500).json({ success: false, message: "Failed to delete food", code: "FOOD_DELETE_ERROR" });
      }
    });
    router2.post("/admin/fix-images", protect, authorize("admin"), async (req, res) => {
      try {
        const foods = await Food.find({ $or: [{ image: { $exists: false } }, { image: "" }, { image: null }] });
        let fixed = 0;
        for (const food of foods) {
          food.image = generateFoodImagePath(food.name);
          await food.save();
          fixed++;
        }
        res.json({
          success: true,
          message: `Image paths backfilled successfully`,
          totalFixed: fixed
        });
      } catch (error) {
        res.status(500).json({ success: false, message: "Failed to backfill images", code: "BACKFILL_ERROR" });
      }
    });
    foods_default = router2;
  }
});

// src/models/Order.ts
var Order_exports = {};
__export(Order_exports, {
  Order: () => Order,
  default: () => Order_default
});
var Order, Order_default;
var init_Order = __esm({
  "src/models/Order.ts"() {
    "use strict";
    init_firestoreModel();
    Order = createFirestoreModel("orders");
    Order_default = Order;
  }
});

// src/models/Coupon.ts
var Coupon;
var init_Coupon = __esm({
  "src/models/Coupon.ts"() {
    "use strict";
    init_firestoreModel();
    Coupon = createFirestoreModel("coupons");
  }
});

// src/models/Delivery.ts
var Delivery_exports = {};
__export(Delivery_exports, {
  Delivery: () => Delivery,
  default: () => Delivery_default
});
var Delivery, Delivery_default;
var init_Delivery = __esm({
  "src/models/Delivery.ts"() {
    "use strict";
    init_firestoreModel();
    Delivery = createFirestoreModel("deliveries");
    Delivery_default = Delivery;
  }
});

// src/routes/orders.ts
var orders_exports = {};
__export(orders_exports, {
  VALID_TRANSITIONS: () => VALID_TRANSITIONS,
  default: () => orders_default,
  isValidOrderTransition: () => isValidOrderTransition,
  triggerAutoDeliveryAssignment: () => triggerAutoDeliveryAssignment
});
import { Router as Router3 } from "express";
var router3, VALID_TRANSITIONS, isValidOrderTransition, triggerAutoDeliveryAssignment, updateOrderStatusHandler, orders_default;
var init_orders = __esm({
  "src/routes/orders.ts"() {
    "use strict";
    init_firestoreModel();
    init_Order();
    init_Food();
    init_Coupon();
    init_Delivery();
    init_User();
    init_auth();
    init_validation();
    init_pricingService();
    router3 = Router3();
    VALID_TRANSITIONS = {
      PLACED: ["PAYMENT_PENDING", "PAYMENT_CONFIRMED", "CANCELLED"],
      PAYMENT_PENDING: ["PAID", "PAYMENT_CONFIRMED", "CANCELLED", "FAILED"],
      PAID: ["PAYMENT_CONFIRMED", "PREPARING", "CANCELLED", "REFUNDED"],
      PAYMENT_CONFIRMED: ["RESTAURANT_CONFIRMED", "CANCELLED"],
      RESTAURANT_CONFIRMED: ["PREPARING", "CANCELLED"],
      PREPARING: ["READY_FOR_PICKUP"],
      READY_FOR_PICKUP: ["ASSIGNED"],
      ASSIGNED: ["PICKED_UP"],
      PICKED_UP: ["OUT_FOR_DELIVERY"],
      OUT_FOR_DELIVERY: ["DELIVERED", "FAILED"],
      DELIVERED: [],
      CANCELLED: [],
      REFUNDED: []
    };
    isValidOrderTransition = (current, target) => {
      if (current === target) return true;
      const allowed = VALID_TRANSITIONS[current] || [];
      return allowed.includes(target);
    };
    triggerAutoDeliveryAssignment = async (orderId) => {
      try {
        const order = await Order.findById(orderId);
        if (!order) return false;
        if (order.status !== "READY_FOR_PICKUP" && order.status !== "PAYMENT_CONFIRMED" && order.status !== "RESTAURANT_CONFIRMED") {
          return false;
        }
        const availableDriver = await User.findOneAndUpdate(
          {
            role: "driver",
            availability: true,
            isSuspended: false,
            activeOrders: { $lt: 3 }
          },
          {
            $inc: { activeOrders: 1 }
          },
          {
            new: true,
            sort: { activeOrders: 1, rating: -1 }
          }
        );
        if (!availableDriver) {
          console.log(`\u23F3 No delivery partner currently available for order ${orderId}. Order will stay in READY_FOR_PICKUP.`);
          return false;
        }
        order.deliveryPartnerId = availableDriver._id.toString();
        order.deliveryPartnerName = availableDriver.name;
        order.deliveryPartnerPhone = availableDriver.phone || "";
        order.status = "ASSIGNED";
        order.timeline.push({
          status: "ASSIGNED",
          timestamp: /* @__PURE__ */ new Date(),
          note: `Assigned to delivery partner ${availableDriver.name} (${availableDriver.vehicle || "Bike"})`,
          actor: "SYSTEM"
        });
        await order.save();
        await Delivery.findOneAndUpdate(
          { orderId: order._id.toString() },
          {
            orderId: order._id.toString(),
            deliveryPartnerId: availableDriver._id.toString(),
            deliveryPartnerName: availableDriver.name,
            deliveryPartnerPhone: availableDriver.phone || "",
            status: "ASSIGNED",
            assignedAt: /* @__PURE__ */ new Date(),
            eta: new Date(Date.now() + 25 * 6e4),
            // 25 min default ETA
            currentLocation: availableDriver.currentLocation || { type: "Point", coordinates: [80.2707, 13.0827] },
            $push: {
              timeline: {
                status: "ASSIGNED",
                timestamp: /* @__PURE__ */ new Date(),
                note: `Assigned to ${availableDriver.name}`
              }
            }
          },
          { upsert: true, new: true }
        );
        console.log(`\u{1F6F5} Order ${order._id} automatically assigned to driver ${availableDriver.name} (${availableDriver._id})`);
        try {
          const { io: io2 } = await Promise.resolve().then(() => (init_server(), server_exports));
          if (io2) {
            io2.to(`tracking_${order._id.toString()}`).emit("delivery:assigned", {
              orderId: order._id.toString(),
              driverId: availableDriver._id.toString(),
              driverName: availableDriver.name,
              driverPhone: availableDriver.phone,
              vehicle: availableDriver.vehicle,
              status: "ASSIGNED",
              eta: new Date(Date.now() + 25 * 6e4)
            });
            io2.to(`tracking_${order._id.toString()}`).emit("order:status", {
              orderId: order._id.toString(),
              status: "ASSIGNED",
              timeline: order.timeline
            });
            io2.to(order.userId.toString()).emit("notification", {
              title: "Delivery Partner Assigned \u{1F6F5}",
              message: `${availableDriver.name} is assigned to pick up your order!`,
              orderId: order._id,
              status: "ASSIGNED"
            });
            io2.to(availableDriver._id.toString()).emit("notification", {
              title: "New Delivery Task! \u{1F4E6}",
              message: `You have been assigned order #${order._id.toString().slice(-6)}`,
              orderId: order._id,
              status: "ASSIGNED"
            });
          }
        } catch (socketErr) {
          console.warn("Socket broadcast error in auto-assignment:", socketErr);
        }
        return true;
      } catch (error) {
        console.error("Error during auto-assignment:", error);
        return false;
      }
    };
    router3.get("/", protect, async (req, res) => {
      try {
        const user = req.user;
        if (!user) {
          res.status(401).json({ success: false, message: "Unauthorized", code: "UNAUTHORIZED" });
          return;
        }
        let filter = {};
        if (user.role === "customer") {
          filter.userId = user._id.toString();
        } else if (user.role === "driver") {
          filter.deliveryPartnerId = user._id.toString();
        } else if (user.role === "restaurant") {
          filter.status = { $in: ["PAYMENT_CONFIRMED", "RESTAURANT_CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY", "DELIVERED"] };
        } else if (user.role === "admin") {
          if (req.query.userId) filter.userId = req.query.userId;
          if (req.query.status) filter.status = req.query.status.toUpperCase();
        }
        const orders = await Order.find(filter).sort({ createdAt: -1 });
        res.json({ success: true, count: orders.length, orders });
      } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ success: false, message: "Failed to fetch orders", code: "ORDERS_FETCH_FAILED" });
      }
    });
    router3.get("/:id", protect, async (req, res) => {
      try {
        const user = req.user;
        const orderId = req.params.id;
        let order = null;
        if (orderId.startsWith("cs_") || orderId.startsWith("mock_sess_")) {
          order = await Order.findOne({ sessionId: orderId });
        } else if (ObjectIdMock.isValid(orderId)) {
          order = await Order.findById(orderId);
        }
        if (!order) {
          res.status(404).json({ success: false, message: "Order not found", code: "ORDER_NOT_FOUND" });
          return;
        }
        if (user?.role === "customer" && order.userId !== user._id.toString()) {
          res.status(403).json({ success: false, message: "Not authorized to view this order", code: "FORBIDDEN" });
          return;
        }
        if (user?.role === "driver" && order.deliveryPartnerId !== user._id.toString()) {
          res.status(403).json({ success: false, message: "Not authorized to view this order", code: "FORBIDDEN" });
          return;
        }
        res.json({ success: true, order });
      } catch (error) {
        console.error("Error fetching order:", error);
        res.status(500).json({ success: false, message: "Failed to fetch order", code: "ORDER_FETCH_FAILED" });
      }
    });
    router3.post("/", protect, async (req, res) => {
      try {
        const { items, deliveryAddress, couponCode, paymentMethod = "COD", specialInstructions } = req.body;
        const idempotencyKey = req.header("X-Idempotency-Key") || req.body.idempotencyKey;
        const userId = req.user?._id?.toString();
        if (!userId) {
          res.status(401).json({ success: false, message: "User not authenticated", code: "UNAUTHORIZED" });
          return;
        }
        if (idempotencyKey) {
          const existingOrder = await Order.findOne({ idempotencyKey, userId });
          if (existingOrder) {
            res.status(201).json({
              success: true,
              orderId: existingOrder._id,
              order: existingOrder,
              calculation: {
                subtotal: existingOrder.subtotal,
                deliveryFee: existingOrder.deliveryFee,
                tax: existingOrder.tax,
                discountAmount: existingOrder.discountAmount,
                grandTotal: existingOrder.totalPrice
              }
            });
            return;
          }
        }
        if (!items || !Array.isArray(items) || items.length === 0) {
          res.status(400).json({ success: false, message: "Cart items are required", code: "INVALID_CART" });
          return;
        }
        if (!deliveryAddress) {
          res.status(400).json({ success: false, message: "Delivery address is required", code: "MISSING_ADDRESS" });
          return;
        }
        let calculatedSubtotal = 0;
        const validatedItems = [];
        const itemCategories = [];
        const itemFoodIds = [];
        const now = /* @__PURE__ */ new Date();
        for (const item of items) {
          if (!item.foodId) {
            res.status(400).json({ success: false, message: "foodId is required for each item", code: "INVALID_ITEM" });
            return;
          }
          if (!ObjectIdMock.isValid(item.foodId)) {
            res.status(400).json({
              success: false,
              message: `Invalid food item ID: ${item.foodId}.`,
              code: "INVALID_FOOD_ID"
            });
            return;
          }
          const qty = Number(item.quantity);
          if (!Number.isInteger(qty) || qty <= 0) {
            res.status(400).json({ success: false, message: `Invalid quantity for item ${item.foodId}`, code: "INVALID_QUANTITY" });
            return;
          }
          const foodDoc = await Food.findById(item.foodId);
          if (!foodDoc) {
            res.status(404).json({ success: false, message: `Food item not found: ${item.foodId}`, code: "FOOD_NOT_FOUND" });
            return;
          }
          if (!foodDoc.available) {
            res.status(409).json({ success: false, message: `${foodDoc.name} is currently unavailable`, code: "FOOD_UNAVAILABLE" });
            return;
          }
          if (foodDoc.stock !== void 0 && foodDoc.stock < qty) {
            res.status(409).json({
              success: false,
              message: `Insufficient stock for "${foodDoc.name}". Only ${foodDoc.stock} available.`,
              code: "INSUFFICIENT_STOCK"
            });
            return;
          }
          const unitPrice = applyDynamicPrice(foodDoc.price, now);
          calculatedSubtotal += unitPrice * qty;
          validatedItems.push({
            foodId: foodDoc._id.toString(),
            name: foodDoc.name,
            price: unitPrice,
            quantity: qty,
            image: foodDoc.image,
            category: foodDoc.category,
            customization: item.customization
          });
          if (foodDoc.category) itemCategories.push(foodDoc.category);
          itemFoodIds.push(foodDoc._id.toString());
        }
        let discountAmount = 0;
        let isFreeDelivery = false;
        let appliedCouponCode = void 0;
        if (couponCode && typeof couponCode === "string" && couponCode.trim()) {
          const codeUpper = couponCode.trim().toUpperCase();
          const coupon = await Coupon.findOne({ code: codeUpper });
          if (coupon && coupon.active && (!coupon.expiryDate || now <= coupon.expiryDate) && calculatedSubtotal >= coupon.minimumOrderAmount) {
            if (coupon.discountType === "PERCENTAGE") {
              let disc = Math.round(calculatedSubtotal * coupon.discountValue / 100);
              if (coupon.maximumDiscount && disc > coupon.maximumDiscount) disc = coupon.maximumDiscount;
              discountAmount = Math.min(disc, calculatedSubtotal);
            } else if (coupon.discountType === "FIXED_AMOUNT") {
              discountAmount = Math.min(coupon.discountValue, calculatedSubtotal);
            } else if (coupon.discountType === "FREE_DELIVERY") {
              isFreeDelivery = true;
            }
            appliedCouponCode = codeUpper;
          }
        }
        const pricing = calculateOrderPricing({
          subtotal: calculatedSubtotal,
          discountAmount,
          freeDelivery: isFreeDelivery
        });
        const formattedAddress = typeof deliveryAddress === "string" ? { fullAddress: deliveryAddress } : {
          doorNo: deliveryAddress.doorNo || "",
          landmark: deliveryAddress.landmark || "",
          district: deliveryAddress.district || "",
          city: deliveryAddress.city || "",
          state: deliveryAddress.state || "",
          pincode: deliveryAddress.pincode || "",
          fullAddress: deliveryAddress.fullAddress || `${deliveryAddress.doorNo || ""}, ${deliveryAddress.landmark || ""}, ${deliveryAddress.district || ""}`.trim(),
          lat: deliveryAddress.lat,
          lng: deliveryAddress.lng
        };
        const initialStatus = paymentMethod === "COD" ? "PAYMENT_CONFIRMED" : "PAYMENT_PENDING";
        const initialPaymentStatus = paymentMethod === "COD" ? "PENDING" : "PROCESSING";
        const order = await Order.create({
          userId,
          items: validatedItems,
          subtotal: pricing.subtotal,
          deliveryFee: pricing.deliveryFee,
          tax: pricing.tax,
          discountAmount: pricing.discountAmount,
          couponCode: appliedCouponCode,
          totalPrice: pricing.grandTotal,
          status: initialStatus,
          paymentStatus: initialPaymentStatus,
          paymentMethod,
          deliveryAddress: formattedAddress,
          timeline: [
            { status: "PLACED", timestamp: /* @__PURE__ */ new Date(), note: "Order placed by customer", actor: "CUSTOMER" },
            { status: initialStatus, timestamp: /* @__PURE__ */ new Date(), note: paymentMethod === "COD" ? "Order confirmed via Cash on Delivery" : "Awaiting payment", actor: "SYSTEM" }
          ],
          specialInstructions: specialInstructions || "",
          idempotencyKey
        });
        if (paymentMethod === "COD") {
          for (const item of validatedItems) {
            try {
              const qty = Math.max(1, item.quantity);
              const result = await Food.findOneAndUpdate(
                { _id: item.foodId, stock: { $gte: qty } },
                { $inc: { stock: -qty } },
                { new: true }
              );
              if (result && result.stock === 0) {
                await Food.findByIdAndUpdate(item.foodId, { available: false });
              }
            } catch (stkErr) {
              console.error(`Stock update failed for foodId ${item.foodId}:`, stkErr);
            }
          }
        }
        res.status(201).json({
          success: true,
          orderId: order._id,
          order,
          calculation: pricing
        });
      } catch (error) {
        console.error("Error creating order:", error);
        res.status(500).json({ success: false, message: error.message || "Order creation failed", code: "ORDER_CREATE_FAILED" });
      }
    });
    updateOrderStatusHandler = async (req, res) => {
      try {
        const user = req.user;
        const { id } = req.params;
        const requestedStatus = (req.body.status || "").toUpperCase();
        const note = req.body.note || "";
        if (!requestedStatus) {
          res.status(400).json({ success: false, message: "Target status is required", code: "MISSING_STATUS" });
          return;
        }
        const order = await Order.findById(id);
        if (!order) {
          res.status(404).json({ success: false, message: "Order not found", code: "ORDER_NOT_FOUND" });
          return;
        }
        const currentStatus = order.status;
        if (user?.role === "customer") {
          if (requestedStatus !== "CANCELLED") {
            res.status(403).json({ success: false, message: "Customers can only request order cancellation", code: "FORBIDDEN" });
            return;
          }
          if (order.userId !== user._id.toString()) {
            res.status(403).json({ success: false, message: "Not authorized for this order", code: "FORBIDDEN" });
            return;
          }
        } else if (user?.role === "restaurant") {
          const restaurantAllowed = ["RESTAURANT_CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "CANCELLED"];
          if (!restaurantAllowed.includes(requestedStatus)) {
            res.status(403).json({ success: false, message: "Restaurant can only update kitchen-related statuses", code: "FORBIDDEN" });
            return;
          }
        } else if (user?.role === "driver") {
          const driverAllowed = ["PICKED_UP", "OUT_FOR_DELIVERY", "DELIVERED"];
          if (!driverAllowed.includes(requestedStatus)) {
            res.status(403).json({ success: false, message: "Driver can only update delivery-related statuses", code: "FORBIDDEN" });
            return;
          }
          if (order.deliveryPartnerId !== user._id.toString()) {
            res.status(403).json({ success: false, message: "Not assigned to this delivery", code: "FORBIDDEN" });
            return;
          }
        }
        if (!isValidOrderTransition(currentStatus, requestedStatus)) {
          res.status(400).json({
            success: false,
            message: `Invalid state transition: Cannot change order status from "${currentStatus}" to "${requestedStatus}"`,
            code: "INVALID_STATUS_TRANSITION",
            currentStatus,
            allowedNextStatuses: VALID_TRANSITIONS[currentStatus] || []
          });
          return;
        }
        order.status = requestedStatus;
        const actorRole = user?.role ? user.role.toUpperCase() : "SYSTEM";
        order.timeline.push({
          status: requestedStatus,
          timestamp: /* @__PURE__ */ new Date(),
          note: note || `Order transitioned to ${requestedStatus} by ${actorRole}`,
          actor: actorRole
        });
        if (currentStatus !== "DELIVERED" && requestedStatus === "DELIVERED") {
          order.paymentStatus = "PAID";
          const pointsEarned = Math.floor(order.totalPrice / 100);
          if (pointsEarned > 0) {
            await User.findByIdAndUpdate(order.userId, {
              $inc: { rewardPoints: pointsEarned }
            });
          }
          if (order.deliveryPartnerId) {
            await User.findByIdAndUpdate(order.deliveryPartnerId, {
              $inc: { activeOrders: -1 }
            });
            await Delivery.findOneAndUpdate(
              { orderId: order._id.toString() },
              { status: "DELIVERED", deliveredAt: /* @__PURE__ */ new Date() }
            );
          }
        }
        await order.save();
        if (requestedStatus === "READY_FOR_PICKUP") {
          await triggerAutoDeliveryAssignment(order._id.toString());
        }
        try {
          const { io: io2 } = await Promise.resolve().then(() => (init_server(), server_exports));
          if (io2) {
            io2.to(`tracking_${order._id.toString()}`).emit("order:status", {
              orderId: order._id.toString(),
              status: order.status,
              paymentStatus: order.paymentStatus,
              timeline: order.timeline
            });
            io2.to(order.userId.toString()).emit("notification", {
              title: `Order Update: ${requestedStatus.replace(/_/g, " ")}`,
              message: `Your order #${order._id.toString().slice(-6)} is now ${requestedStatus.replace(/_/g, " ").toLowerCase()}.`,
              orderId: order._id,
              status: order.status
            });
          }
        } catch (socketErr) {
          console.warn("Socket emit error in order update:", socketErr);
        }
        res.json({
          success: true,
          message: `Order status successfully updated to ${requestedStatus}`,
          order
        });
      } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({ success: false, message: "Failed to update order status", code: "STATUS_UPDATE_ERROR" });
      }
    };
    router3.put("/:id/status", protect, validateBody(updateOrderStatusSchema), updateOrderStatusHandler);
    router3.put("/:id", protect, validateBody(updateOrderStatusSchema), updateOrderStatusHandler);
    router3.delete("/:id", protect, authorize("admin"), async (req, res) => {
      try {
        const order = await Order.findByIdAndDelete(req.params.id);
        if (!order) {
          res.status(404).json({ success: false, message: "Order not found", code: "ORDER_NOT_FOUND" });
          return;
        }
        await Delivery.deleteMany({ orderId: req.params.id });
        res.json({ success: true, message: "Order deleted successfully" });
      } catch (error) {
        res.status(500).json({ success: false, message: "Failed to delete order", code: "DELETE_ORDER_ERROR" });
      }
    });
    orders_default = router3;
  }
});

// src/routes/ai.ts
import { Router as Router4 } from "express";
import { GoogleGenAI, Type } from "@google/genai";
import rateLimit from "express-rate-limit";
var router4, API_KEY, aiRateLimit, ai_default;
var init_ai = __esm({
  "src/routes/ai.ts"() {
    "use strict";
    init_Food();
    init_auth();
    init_envConfig();
    init_validation();
    init_logger();
    router4 = Router4();
    API_KEY = env.GEMINI_API_KEY;
    aiRateLimit = rateLimit({
      windowMs: 60 * 1e3,
      // 1 minute
      max: 15,
      // 15 requests per minute per user
      message: { success: false, message: "AI rate limit exceeded. Please try again shortly.", code: "AI_RATE_LIMITED" },
      standardHeaders: true,
      legacyHeaders: false
    });
    router4.post("/chat/stream", protect, aiRateLimit, validateBody(aiChatSchema), async (req, res) => {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      try {
        const { message, healthProfile, history } = req.body;
        if (!message || typeof message !== "string" || message.trim().length === 0) {
          res.write(`data: ${JSON.stringify({ type: "error", text: "Message is required" })}

`);
          res.end();
          return;
        }
        const safeMessage = message.slice(0, 2e3);
        const foods = await Food.find({ available: true }).lean();
        const menuContext = foods.map((f) => `- ${f.name} (ID: ${f._id}): ${f.description} (\u20B9${f.price}) [${f.category}]`).join("\n");
        const systemInstruction = `
You are Chef AI, a health-processing assistant for Foods66.
The user has the following health profile:
Disease: ${healthProfile?.diseaseName || "None"}
Dietary Guidelines: ${healthProfile?.dietaryMemo || "None"}

Here is our current live menu:
${menuContext}

When asked about unhealthy foods for their disease, identify common foods in the general diet or menu that are high risk. For each listed food, you must provide:
- Why it's risky for the disease (mechanism or symptom impact)
- Suggested alternatives
- Any caveats (e.g., portion guidance, rare exceptions)

Require a concise, bulleted list mapped to the input diseases. Request clarifications if details are missing (e.g., age, comorbidities, medication interactions).

If the user wants to order food, you MUST use the addToCart tool with the exact food ID from the menu.
If the food is not on the menu, tell them gently. Do not hallucinate foods.
    `;
        const tools = [{
          functionDeclarations: [{
            name: "addToCart",
            description: "Adds a specific food item to the user's shopping cart.",
            parameters: {
              type: Type.OBJECT,
              properties: {
                foodId: { type: Type.STRING, description: "The exact ID of the food item from the menu." },
                quantity: { type: Type.INTEGER, description: "The number of items to order." }
              },
              required: ["foodId", "quantity"]
            }
          }]
        }];
        if (!API_KEY || API_KEY.includes("PLACEHOLDER")) {
          const lowerMsg = safeMessage.toLowerCase();
          let mockText = "I'm your Simulated Chef AI! ";
          if (lowerMsg.includes("breakfast") || lowerMsg.includes("morning")) {
            const breakfastFoods = foods.filter((f) => f.category.toLowerCase().includes("breakfast") || f.name.toLowerCase().includes("idli") || f.name.toLowerCase().includes("dosa") || f.name.toLowerCase().includes("poha"));
            if (breakfastFoods.length > 0) {
              mockText += "For breakfast, I highly recommend: " + breakfastFoods.map((f) => f.name).join(", ") + ". ";
            } else {
              mockText += "We have many fresh options that are perfect for breakfast. Check out the menu! ";
            }
          } else if (lowerMsg.includes("lunch") || lowerMsg.includes("dinner") || lowerMsg.includes("meal")) {
            const meals = foods.filter((f) => f.category.toLowerCase().includes("lunch") || f.category.toLowerCase().includes("dinner") || f.name.toLowerCase().includes("thali") || f.name.toLowerCase().includes("rice"));
            if (meals.length > 0) {
              mockText += "For a hearty meal, you should try: " + meals.slice(0, 3).map((f) => f.name).join(", ") + ". ";
            } else {
              mockText += "Our main courses are packed with nutrition! ";
            }
          } else if (lowerMsg.includes("healthy") || lowerMsg.includes("diet") || lowerMsg.includes("sugar")) {
            mockText += "Based on your health profile, I recommend sticking to our low-carb, high-protein options and fresh salads! ";
          } else {
            mockText += "I can help you find the best food choices based on your health profile. Try asking me for breakfast or lunch recommendations! ";
          }
          for (const char of mockText.split("")) {
            res.write(`data: ${JSON.stringify({ type: "text", text: char })}

`);
            await new Promise((r) => setTimeout(r, 10));
          }
          res.end();
          return;
        }
        const ai = new GoogleGenAI({ apiKey: API_KEY });
        const chat = ai.chats.create({
          model: "gemini-2.5-flash",
          config: {
            systemInstruction,
            tools
          },
          history: (history || []).map((h) => ({ role: h.role, parts: [{ text: h.text }] }))
        });
        const responseStream = await chat.sendMessageStream({ message: safeMessage });
        for await (const chunk of responseStream) {
          if (chunk.functionCalls && chunk.functionCalls.length > 0) {
            const call = chunk.functionCalls[0];
            if (call.name === "addToCart") {
              const foodId = call.args?.foodId;
              const quantity = call.args?.quantity;
              if (foodId) {
                const foodExists = foods.some((f) => f._id.toString() === foodId);
                if (!foodExists) {
                  res.write(`data: ${JSON.stringify({ type: "text", text: "I couldn't find that item on our menu. Let me suggest something else!" })}

`);
                  res.end();
                  return;
                }
              }
              const safeQty = Math.min(Math.max(1, Number(quantity) || 1), 20);
              res.write(`data: ${JSON.stringify({ type: "functionCall", name: call.name, args: { foodId, quantity: safeQty } })}

`);
            }
            res.end();
            return;
          }
          if (chunk.text) {
            res.write(`data: ${JSON.stringify({ type: "text", text: chunk.text })}

`);
          }
        }
        res.end();
      } catch (error) {
        logger.error("AI_STREAM_ERROR", "AI Chat Stream Error", { error });
        res.write(`data: ${JSON.stringify({ type: "error", text: "AI Service Error" })}

`);
        res.end();
      }
    });
    router4.post("/recommend", protect, aiRateLimit, async (req, res) => {
      try {
        const { budget, healthProfile, weather, timeOfDay } = req.body;
        const foods = await Food.find({ available: true }).lean();
        if (!API_KEY || API_KEY.includes("PLACEHOLDER")) {
          const recommendations = foods.filter((f) => f.price <= (budget || 500)).slice(0, 3);
          return res.json(recommendations);
        }
        const menuContext = foods.map((f) => `- ${f.name} (ID: ${f._id}): \u20B9${f.price} [${f.category}]`).join("\n");
        const prompt = `
      You are an expert food recommendation engine.
      Context:
      - Budget: \u20B9${budget || "Any"}
      - Time of Day: ${timeOfDay || (/* @__PURE__ */ new Date()).getHours() + ":00"}
      - Weather: ${weather || "Normal"}
      - Dietary Restrictions: ${healthProfile?.dietaryMemo || "None"}
      
      Menu:
      ${menuContext}
      
      Based on the context, select the top 3 best matching food IDs from the menu.
      Return ONLY a JSON array of strings containing the IDs. Do not return markdown, just the raw JSON array.
    `;
        const ai = new GoogleGenAI({ apiKey: API_KEY });
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt
        });
        try {
          const text = (response.text || "").replace(/```json/g, "").replace(/```/g, "").trim();
          const recommendedIds = JSON.parse(text);
          const recommendedFoods = foods.filter((f) => recommendedIds.includes(f._id.toString()));
          res.json(recommendedFoods);
        } catch (parseError) {
          logger.warn("AI_RECOMMENDATION_PARSE", "Failed to parse AI recommendation", { error: parseError });
          res.json(foods.slice(0, 3));
        }
      } catch (error) {
        logger.error("AI_RECOMMENDATION_ERROR", "AI Recommendation Error", { error });
        res.status(500).json({ error: "Failed to get recommendations" });
      }
    });
    router4.post("/health-recommendations", protect, aiRateLimit, async (req, res) => {
      try {
        const { healthProfile } = req.body;
        if (!healthProfile?.hasIssues || !healthProfile?.diseaseName) {
          res.json([]);
          return;
        }
        const foods = await Food.find({ available: true }).lean();
        if (foods.length === 0) {
          res.json([]);
          return;
        }
        const disease = (healthProfile.diseaseName || "").toLowerCase();
        const memo = (healthProfile.dietaryMemo || "").toLowerCase();
        let matchedFoods = foods.filter((f) => {
          const name = f.name.toLowerCase();
          const desc = (f.description || "").toLowerCase();
          const cat = (f.category || "").toLowerCase();
          if (disease.includes("diabet") || disease.includes("sugar") || disease.includes("pcos")) {
            if (cat.includes("dessert") || cat.includes("sweet") || name.includes("sweet") || name.includes("halwa") || name.includes("jamun") || name.includes("cake")) {
              return false;
            }
          }
          if (disease.includes("pressure") || disease.includes("heart") || disease.includes("bp") || disease.includes("cholesterol") || disease.includes("hypertens")) {
            if (name.includes("fried") || name.includes("fry") || name.includes("butter") || name.includes("pickle")) {
              return false;
            }
          }
          if (disease.includes("ulcer") || disease.includes("gerd") || disease.includes("acid") || disease.includes("stomach")) {
            if (name.includes("spicy") || name.includes("chilli") || name.includes("chili") || desc.includes("spicy")) {
              return false;
            }
          }
          return true;
        });
        if (matchedFoods.length < 6) {
          const generalHealthy = foods.filter((f) => f.category === "Veg" || f.nutritionalInfo?.calories < 400 || f.price < 150);
          matchedFoods = Array.from(new Map([...matchedFoods, ...generalHealthy].map((f) => [f._id.toString(), f])).values());
        }
        if (!API_KEY || API_KEY.includes("PLACEHOLDER")) {
          res.json(matchedFoods.slice(0, 15));
          return;
        }
        try {
          const ai = new GoogleGenAI({ apiKey: API_KEY });
          const menuList = matchedFoods.slice(0, 25).map((f) => `- ID: ${f._id} | Name: ${f.name} | Category: ${f.category} | Price: \u20B9${f.price}`).join("\n");
          const prompt = `
        The patient has: ${healthProfile.diseaseName} (Stage ${healthProfile.stage || "1"}).
        Dietary restrictions: ${memo || "Healthy balanced diet"}.
        
        From this available restaurant menu:
        ${menuList}
        
        Select the top 12 safest and healthiest food IDs for this condition.
        Return ONLY a JSON array of strings containing the exact food IDs from the list above. Example: ["6a96...", "6a97..."]
      `;
          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json" }
          });
          const rawData = (response.text || "").replace(/```json\s*|\s*```/g, "").replace(/```/g, "").trim();
          const selectedIds = JSON.parse(rawData);
          if (Array.isArray(selectedIds) && selectedIds.length > 0) {
            const idSet = new Set(selectedIds.map(String));
            const ranked = matchedFoods.filter((f) => idSet.has(f._id.toString()));
            if (ranked.length > 0) {
              res.json(ranked);
              return;
            }
          }
        } catch (aiRankError) {
          logger.warn("AI_RANK_FALLBACK", "AI ranking fallback to deterministic matching", { error: aiRankError });
        }
        res.json(matchedFoods.slice(0, 15));
      } catch (error) {
        logger.warn("AI_HEALTH_REC_ERROR", "Health recommendations error", { error });
        res.status(500).json({ success: false, message: "Failed to retrieve recommendations" });
      }
    });
    router4.post("/food-safety", protect, aiRateLimit, async (req, res) => {
      try {
        const { foodName, healthProfile } = req.body;
        if (!healthProfile?.hasIssues || !foodName) {
          res.json({ safe: true });
          return;
        }
        if (!API_KEY || API_KEY.includes("PLACEHOLDER")) {
          res.json({ fallback: true });
          return;
        }
        const ai = new GoogleGenAI({ apiKey: API_KEY });
        const prompt = `
      User: ${healthProfile.diseaseName} (Stage ${healthProfile.stage}).
      Food: ${foodName}.
      Safe to eat? Return JSON: { "safe": boolean, "reason": "string" }
    `;
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: { responseMimeType: "application/json" }
        });
        const rawData = (response.text || "").replace(/```json\s*|\s*```/g, "").replace(/```/g, "").trim();
        res.json(JSON.parse(rawData));
      } catch (error) {
        logger.warn("AI_FOOD_SAFETY_ERROR", "Food safety check AI error", { error });
        res.json({ fallback: true });
      }
    });
    ai_default = router4;
  }
});

// src/routes/search.ts
import { Router as Router5 } from "express";
import { GoogleGenAI as GoogleGenAI2 } from "@google/genai";
var router5, API_KEY2, search_default;
var init_search = __esm({
  "src/routes/search.ts"() {
    "use strict";
    init_Food();
    init_envConfig();
    router5 = Router5();
    API_KEY2 = env.GEMINI_API_KEY;
    router5.post("/", async (req, res) => {
      try {
        const { query } = req.body;
        if (!query) {
          res.status(400).json({ error: "Search query is required" });
          return;
        }
        if (!API_KEY2 || API_KEY2.includes("PLACEHOLDER")) {
          const escapedQuery = query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const regex = new RegExp(escapedQuery, "i");
          const foods = await Food.find({
            $or: [
              { name: regex },
              { description: regex },
              { category: regex }
            ]
          });
          res.json(foods);
          return;
        }
        const prompt = `
      You are a search query parser for a food delivery app.
      Extract the intent from the following search query: "${query}"
      
      Return a JSON object with these exact keys:
      - minPrice: number or null
      - maxPrice: number or null
      - isVegetarian: boolean or null
      - isVegan: boolean or null
      - isHealthy: boolean or null
      - isSpicy: boolean or null
      - keywords: array of strings representing the main food items (e.g. "pizza", "burger", "salad")
      
      Output ONLY valid JSON.
    `;
        const ai = new GoogleGenAI2({ apiKey: API_KEY2 });
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt
        });
        const aiText = response.text || "{}";
        const cleanedText = aiText.replace(/```json/g, "").replace(/```/g, "").trim();
        const params = JSON.parse(cleanedText);
        const matchQuery = {};
        if (params.maxPrice) {
          matchQuery.price = { $lte: params.maxPrice };
        }
        if (params.minPrice) {
          matchQuery.price = { ...matchQuery.price, $gte: params.minPrice };
        }
        if (params.keywords && params.keywords.length > 0) {
          matchQuery.$text = { $search: params.keywords.join(" ") };
        }
        const extraKeywords = [];
        if (params.isVegetarian) extraKeywords.push("veg");
        if (params.isVegan) extraKeywords.push("vegan");
        if (params.isHealthy) extraKeywords.push("healthy");
        if (params.isSpicy) extraKeywords.push("spicy");
        if (extraKeywords.length > 0) {
          if (matchQuery.$text) {
            matchQuery.$text.$search += " " + extraKeywords.join(" ");
          } else {
            matchQuery.$text = { $search: extraKeywords.join(" ") };
          }
        }
        let results;
        if (Object.keys(matchQuery).length === 0) {
          results = await Food.find({ name: { $regex: query, $options: "i" } });
        } else {
          results = await Food.find(matchQuery);
        }
        res.json(results);
      } catch (error) {
        console.error("Search error:", error);
        res.status(500).json({ error: "Failed to process AI search" });
      }
    });
    search_default = router5;
  }
});

// src/models/Restaurant.ts
var Restaurant;
var init_Restaurant = __esm({
  "src/models/Restaurant.ts"() {
    "use strict";
    init_firestoreModel();
    Restaurant = createFirestoreModel("restaurants");
  }
});

// src/routes/restaurants.ts
import { Router as Router6 } from "express";
import { GoogleGenAI as GoogleGenAI3 } from "@google/genai";
var router6, restaurants_default;
var init_restaurants = __esm({
  "src/routes/restaurants.ts"() {
    "use strict";
    init_Restaurant();
    init_auth();
    init_validation();
    init_envConfig();
    init_logger();
    router6 = Router6();
    router6.get("/", async (_req, res) => {
      try {
        const restaurants = await Restaurant.find({ verificationStatus: "verified" });
        res.json(restaurants);
      } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch restaurants", code: "RESTAURANTS_FETCH_ERROR" });
      }
    });
    router6.get("/me", protect, authorize("restaurant"), async (req, res) => {
      try {
        const restaurant = await Restaurant.findOne({ userId: req.user?._id });
        if (!restaurant) {
          res.status(404).json({ success: false, message: "Restaurant profile not found", code: "RESTAURANT_NOT_FOUND" });
          return;
        }
        res.json(restaurant);
      } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch restaurant profile", code: "RESTAURANT_FETCH_ERROR" });
      }
    });
    router6.post("/", protect, authorize("restaurant"), async (req, res) => {
      try {
        const existing = await Restaurant.findOne({ userId: req.user?._id });
        if (existing) {
          res.status(400).json({ success: false, message: "Restaurant profile already exists for this user", code: "PROFILE_EXISTS" });
          return;
        }
        const restaurant = await Restaurant.create({
          ...req.body,
          userId: req.user?._id,
          verificationStatus: "pending",
          // Admins must verify
          liveStatus: "closed"
        });
        res.status(201).json(restaurant);
      } catch (error) {
        res.status(500).json({ success: false, message: "Failed to create restaurant", code: "RESTAURANT_CREATE_ERROR" });
      }
    });
    router6.put("/me/status", protect, authorize("restaurant"), async (req, res) => {
      try {
        const { liveStatus } = req.body;
        if (!["open", "closed"].includes(liveStatus)) {
          res.status(400).json({ success: false, message: "Invalid live status. Allowed: open, closed", code: "INVALID_STATUS" });
          return;
        }
        const restaurant = await Restaurant.findOneAndUpdate(
          { userId: req.user?._id },
          { liveStatus },
          { new: true }
        );
        if (!restaurant) {
          res.status(404).json({ success: false, message: "Restaurant profile not found", code: "RESTAURANT_NOT_FOUND" });
          return;
        }
        res.json(restaurant);
      } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update status", code: "STATUS_UPDATE_ERROR" });
      }
    });
    router6.put("/:id/verify", protect, authorize("admin"), async (req, res) => {
      try {
        const { status } = req.body;
        if (!["verified", "rejected", "pending"].includes(status)) {
          res.status(400).json({ success: false, message: "Invalid verification status", code: "INVALID_STATUS" });
          return;
        }
        const restaurant = await Restaurant.findByIdAndUpdate(
          req.params.id,
          { verificationStatus: status },
          { new: true }
        );
        if (!restaurant) {
          res.status(404).json({ success: false, message: "Restaurant not found", code: "RESTAURANT_NOT_FOUND" });
          return;
        }
        res.json(restaurant);
      } catch (error) {
        res.status(500).json({ success: false, message: "Failed to verify restaurant", code: "VERIFICATION_ERROR" });
      }
    });
    router6.post("/:id/reviews", protect, validateBody(reviewSchema), async (req, res) => {
      try {
        const { text } = req.body;
        const restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant) {
          res.status(404).json({ success: false, message: "Restaurant not found", code: "RESTAURANT_NOT_FOUND" });
          return;
        }
        let sentimentScore = 0;
        if (env.GEMINI_API_KEY && !env.GEMINI_API_KEY.includes("PLACEHOLDER")) {
          try {
            const ai = new GoogleGenAI3({ apiKey: env.GEMINI_API_KEY });
            const prompt = `Analyze the sentiment of the following restaurant review. Return a single number between -1.0 (extremely negative) and 1.0 (extremely positive). Do not include any other text, just the number.

Review: "${text}"`;
            const response = await ai.models.generateContent({
              model: "gemini-2.5-flash",
              contents: prompt
            });
            const resultText = (response.text || "").trim();
            sentimentScore = parseFloat(resultText);
            if (isNaN(sentimentScore)) sentimentScore = 0;
          } catch (aiError) {
            logger.warn("AI_SENTIMENT_ERROR", "AI Sentiment Analysis failed, defaulting to neutral", { error: aiError });
            sentimentScore = 0;
          }
        }
        if (!restaurant.reviews) restaurant.reviews = [];
        restaurant.reviews.push({ text, sentimentScore, date: /* @__PURE__ */ new Date() });
        const avgSentiment = restaurant.reviews.reduce((acc, rev) => acc + (rev.sentimentScore || 0), 0) / restaurant.reviews.length;
        const newRating = Math.max(1, Math.min(5, (avgSentiment + 1) * 2 + 1));
        restaurant.rating = parseFloat(newRating.toFixed(1));
        await restaurant.save();
        res.json({ success: true, message: "Review added", rating: restaurant.rating, sentimentScore });
      } catch (error) {
        logger.error("ADD_REVIEW_ERROR", "Failed to add review", { error });
        res.status(500).json({ success: false, message: "Failed to add review", code: "REVIEW_ERROR" });
      }
    });
    restaurants_default = router6;
  }
});

// src/routes/coupons.ts
import { Router as Router7 } from "express";
var router7, calculateCouponDiscount, getCouponsHandler, createCouponHandler, coupons_default;
var init_coupons = __esm({
  "src/routes/coupons.ts"() {
    "use strict";
    init_Coupon();
    init_Order();
    init_Food();
    init_auth();
    router7 = Router7();
    calculateCouponDiscount = async (code, userId, items) => {
      const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });
      if (!coupon) {
        return { isValid: false, discountAmount: 0, deliveryFeeDiscount: 0, finalSubtotal: 0, message: "Invalid coupon code", code: "INVALID_COUPON" };
      }
      const now = /* @__PURE__ */ new Date();
      if (!coupon.active) {
        return { isValid: false, discountAmount: 0, deliveryFeeDiscount: 0, finalSubtotal: 0, message: "This coupon is no longer active", code: "COUPON_INACTIVE" };
      }
      if (coupon.startDate && now < coupon.startDate) {
        return { isValid: false, discountAmount: 0, deliveryFeeDiscount: 0, finalSubtotal: 0, message: "This coupon is not yet active", code: "COUPON_NOT_STARTED" };
      }
      if (coupon.expiryDate && now > coupon.expiryDate) {
        return { isValid: false, discountAmount: 0, deliveryFeeDiscount: 0, finalSubtotal: 0, message: "Coupon has expired", code: "COUPON_EXPIRED" };
      }
      if (coupon.usedCount >= coupon.usageLimit) {
        return { isValid: false, discountAmount: 0, deliveryFeeDiscount: 0, finalSubtotal: 0, message: "Coupon usage limit reached", code: "COUPON_LIMIT_REACHED" };
      }
      const userUsageCount = await Order.countDocuments({
        userId,
        couponCode: coupon.code,
        status: { $nin: ["CANCELLED", "REFUNDED"] }
      });
      if (userUsageCount >= coupon.perUserLimit) {
        return { isValid: false, discountAmount: 0, deliveryFeeDiscount: 0, finalSubtotal: 0, message: "You have reached your limit for this coupon", code: "COUPON_USER_LIMIT_REACHED" };
      }
      let subtotal = 0;
      const itemCategories = [];
      const itemFoodIds = [];
      if (typeof items === "number") {
        subtotal = items;
      } else if (Array.isArray(items)) {
        for (const it of items) {
          const food = await Food.findById(it.foodId);
          if (food) {
            subtotal += food.price * Number(it.quantity);
            if (food.category) itemCategories.push(food.category);
            itemFoodIds.push(food._id.toString());
          }
        }
      }
      if (subtotal < coupon.minimumOrderAmount) {
        return {
          isValid: false,
          discountAmount: 0,
          deliveryFeeDiscount: 0,
          finalSubtotal: subtotal,
          message: `Minimum order amount of \u20B9${coupon.minimumOrderAmount} required for this coupon`,
          code: "MINIMUM_ORDER_NOT_MET"
        };
      }
      if (coupon.applicableCategories && coupon.applicableCategories.length > 0 && itemCategories.length > 0) {
        const matched = itemCategories.some((c) => coupon.applicableCategories.includes(c));
        if (!matched) {
          return {
            isValid: false,
            discountAmount: 0,
            deliveryFeeDiscount: 0,
            finalSubtotal: subtotal,
            message: "Coupon is not applicable to categories in your cart",
            code: "COUPON_NOT_APPLICABLE"
          };
        }
      }
      if (coupon.applicableFoods && coupon.applicableFoods.length > 0 && itemFoodIds.length > 0) {
        const matched = itemFoodIds.some((f) => coupon.applicableFoods.includes(f));
        if (!matched) {
          return {
            isValid: false,
            discountAmount: 0,
            deliveryFeeDiscount: 0,
            finalSubtotal: subtotal,
            message: "Coupon is not applicable to the selected items",
            code: "COUPON_NOT_APPLICABLE"
          };
        }
      }
      let discountAmount = 0;
      let deliveryFeeDiscount = 0;
      if (coupon.discountType === "PERCENTAGE") {
        let calculated = Math.round(subtotal * coupon.discountValue / 100);
        if (coupon.maximumDiscount && calculated > coupon.maximumDiscount) {
          calculated = coupon.maximumDiscount;
        }
        discountAmount = Math.min(calculated, subtotal);
      } else if (coupon.discountType === "FIXED_AMOUNT") {
        discountAmount = Math.min(coupon.discountValue, subtotal);
      } else if (coupon.discountType === "FREE_DELIVERY") {
        deliveryFeeDiscount = 40;
        discountAmount = 40;
      }
      return {
        isValid: true,
        coupon: {
          _id: coupon._id,
          code: coupon.code,
          description: coupon.description,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          minimumOrderAmount: coupon.minimumOrderAmount,
          maximumDiscount: coupon.maximumDiscount,
          expiryDate: coupon.expiryDate
        },
        discountAmount,
        deliveryFeeDiscount,
        finalSubtotal: Math.max(0, subtotal - discountAmount)
      };
    };
    router7.post("/validate", protect, async (req, res) => {
      try {
        const { code, items, orderAmount, subtotal } = req.body;
        const userId = req.user?._id?.toString() || "";
        if (!code) {
          res.status(400).json({ success: false, message: "Coupon code is required", code: "MISSING_CODE" });
          return;
        }
        const targetItems = items || (orderAmount || subtotal || 0);
        const result = await calculateCouponDiscount(code, userId, targetItems);
        if (!result.isValid) {
          res.status(400).json({
            success: false,
            message: result.message || "Invalid coupon",
            code: result.code || "COUPON_ERROR"
          });
          return;
        }
        res.json({
          success: true,
          coupon: result.coupon,
          discountAmount: result.discountAmount,
          deliveryFeeDiscount: result.deliveryFeeDiscount,
          finalSubtotal: result.finalSubtotal
        });
      } catch (error) {
        res.status(500).json({ success: false, message: "Failed to validate coupon", code: "COUPON_VALIDATE_ERROR" });
      }
    });
    router7.post("/apply", protect, async (req, res) => {
      try {
        const { code, items, subtotal } = req.body;
        const userId = req.user?._id?.toString() || "";
        const result = await calculateCouponDiscount(code, userId, items || subtotal || 0);
        if (!result.isValid) {
          res.status(400).json({
            success: false,
            message: result.message || "Cannot apply coupon",
            code: result.code || "COUPON_APPLY_ERROR"
          });
          return;
        }
        res.json({
          success: true,
          message: "\u2713 Coupon applied successfully",
          coupon: result.coupon,
          discountAmount: result.discountAmount,
          deliveryFeeDiscount: result.deliveryFeeDiscount
        });
      } catch (error) {
        res.status(500).json({ success: false, message: "Failed to apply coupon", code: "COUPON_APPLY_FAILED" });
      }
    });
    router7.post("/remove", protect, async (_req, res) => {
      res.json({
        success: true,
        message: "Coupon removed"
      });
    });
    getCouponsHandler = async (_req, res) => {
      try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        res.json({ success: true, count: coupons.length, coupons });
      } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch coupons", code: "COUPONS_FETCH_ERROR" });
      }
    };
    router7.get("/", protect, authorize("admin"), getCouponsHandler);
    createCouponHandler = async (req, res) => {
      try {
        const {
          code,
          description,
          discountType,
          discountValue,
          minimumOrderAmount,
          maximumDiscount,
          startDate,
          expiryDate,
          usageLimit,
          perUserLimit,
          applicableCategories,
          applicableFoods
        } = req.body;
        if (!code || !discountType || discountValue === void 0 || !expiryDate) {
          res.status(400).json({
            success: false,
            message: "code, discountType, discountValue, and expiryDate are required",
            code: "MISSING_FIELDS"
          });
          return;
        }
        const codeUpper = code.trim().toUpperCase();
        const existing = await Coupon.findOne({ code: codeUpper });
        if (existing) {
          res.status(409).json({ success: false, message: "Coupon code already exists", code: "DUPLICATE_CODE" });
          return;
        }
        const coupon = await Coupon.create({
          code: codeUpper,
          description: description || "",
          discountType,
          discountValue: Number(discountValue),
          minimumOrderAmount: Number(minimumOrderAmount) || 0,
          maximumDiscount: maximumDiscount ? Number(maximumDiscount) : void 0,
          startDate: startDate ? new Date(startDate) : /* @__PURE__ */ new Date(),
          expiryDate: new Date(expiryDate),
          usageLimit: Number(usageLimit) || 100,
          perUserLimit: Number(perUserLimit) || 1,
          active: true,
          applicableCategories: applicableCategories || [],
          applicableFoods: applicableFoods || []
        });
        res.status(201).json({ success: true, message: "Coupon created successfully", coupon });
      } catch (error) {
        res.status(500).json({ success: false, message: "Failed to create coupon", code: "COUPON_CREATE_ERROR" });
      }
    };
    router7.post("/", protect, authorize("admin"), createCouponHandler);
    router7.put("/:id", protect, authorize("admin"), async (req, res) => {
      try {
        if (req.body.code) {
          req.body.code = req.body.code.trim().toUpperCase();
        }
        const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!coupon) {
          res.status(404).json({ success: false, message: "Coupon not found", code: "COUPON_NOT_FOUND" });
          return;
        }
        res.json({ success: true, message: "Coupon updated successfully", coupon });
      } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update coupon", code: "COUPON_UPDATE_ERROR" });
      }
    });
    router7.delete("/:id", protect, authorize("admin"), async (req, res) => {
      try {
        const coupon = await Coupon.findByIdAndDelete(req.params.id);
        if (!coupon) {
          res.status(404).json({ success: false, message: "Coupon not found", code: "COUPON_NOT_FOUND" });
          return;
        }
        res.json({ success: true, message: "Coupon deleted successfully" });
      } catch (error) {
        res.status(500).json({ success: false, message: "Failed to delete coupon", code: "COUPON_DELETE_ERROR" });
      }
    });
    coupons_default = router7;
  }
});

// src/routes/deliveries.ts
import { Router as Router8 } from "express";
var router8, deliveries_default;
var init_deliveries = __esm({
  "src/routes/deliveries.ts"() {
    "use strict";
    init_firestoreModel();
    init_Delivery();
    init_Order();
    init_User();
    init_auth();
    router8 = Router8();
    router8.get("/", protect, authorize("driver", "admin", "restaurant"), async (req, res) => {
      try {
        const user = req.user;
        let filter = {};
        if (user?.role === "driver") {
          filter.deliveryPartnerId = user._id.toString();
        }
        if (req.query.status) {
          filter.status = req.query.status.toUpperCase();
        }
        const deliveries = await Delivery.find(filter).sort({ createdAt: -1 });
        const orderIds = deliveries.map((d) => d.orderId);
        const orders = await Order.find({ _id: { $in: orderIds } }).select("_id items totalPrice deliveryAddress specialInstructions status");
        const orderMap = new Map(orders.map((o) => [o._id.toString(), o]));
        const enriched = deliveries.map((d) => ({
          ...d.toObject(),
          order: orderMap.get(d.orderId) || null
        }));
        res.json({ success: true, count: enriched.length, deliveries: enriched });
      } catch (error) {
        console.error("Error fetching deliveries:", error);
        res.status(500).json({ success: false, message: "Failed to fetch deliveries", code: "DELIVERIES_FETCH_ERROR" });
      }
    });
    router8.get("/available", protect, authorize("driver", "admin"), async (req, res) => {
      try {
        const driverId = req.user?._id?.toString();
        const availableOrders = await Order.find({
          status: { $in: ["READY_FOR_PICKUP", "ASSIGNED"] },
          $or: [
            { deliveryPartnerId: { $exists: false } },
            { deliveryPartnerId: null },
            { deliveryPartnerId: driverId }
          ]
        }).sort({ createdAt: 1 });
        res.json({ success: true, count: availableOrders.length, orders: availableOrders, deliveries: availableOrders });
      } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch available deliveries", code: "AVAILABLE_FETCH_ERROR" });
      }
    });
    router8.post("/assign", protect, authorize("admin", "restaurant"), async (req, res) => {
      try {
        const { orderId, driverId } = req.body;
        if (!orderId || !driverId) {
          res.status(400).json({ success: false, message: "Both orderId and driverId are required", code: "MISSING_PARAMS" });
          return;
        }
        const order = await Order.findById(orderId);
        if (!order) {
          res.status(404).json({ success: false, message: "Order not found", code: "ORDER_NOT_FOUND" });
          return;
        }
        const driver = await User.findOne({ _id: driverId, role: "driver" });
        if (!driver) {
          res.status(404).json({ success: false, message: "Delivery partner not found", code: "DRIVER_NOT_FOUND" });
          return;
        }
        order.deliveryPartnerId = driver._id.toString();
        order.deliveryPartnerName = driver.name;
        order.deliveryPartnerPhone = driver.phone || "";
        order.status = "ASSIGNED";
        order.timeline.push({
          status: "ASSIGNED",
          timestamp: /* @__PURE__ */ new Date(),
          note: `Assigned to ${driver.name}`,
          actor: req.user?.role?.toUpperCase() || "ADMIN"
        });
        await order.save();
        await User.findByIdAndUpdate(driverId, { $inc: { activeOrders: 1 } });
        const delivery = await Delivery.findOneAndUpdate(
          { orderId },
          {
            orderId,
            deliveryPartnerId: driver._id.toString(),
            deliveryPartnerName: driver.name,
            deliveryPartnerPhone: driver.phone || "",
            status: "ASSIGNED",
            assignedAt: /* @__PURE__ */ new Date(),
            eta: new Date(Date.now() + 25 * 6e4),
            $push: {
              timeline: { status: "ASSIGNED", timestamp: /* @__PURE__ */ new Date(), note: `Assigned to ${driver.name}` }
            }
          },
          { upsert: true, new: true }
        );
        try {
          const { io: io2 } = await Promise.resolve().then(() => (init_server(), server_exports));
          if (io2) {
            io2.to(`tracking_${orderId}`).emit("delivery:assigned", {
              orderId,
              driverId: driver._id.toString(),
              driverName: driver.name,
              driverPhone: driver.phone,
              status: "ASSIGNED",
              eta: delivery.eta
            });
            io2.to(driver._id.toString()).emit("notification", {
              title: "New Delivery Assigned \u{1F6F5}",
              message: `Order #${orderId.slice(-6)} has been assigned to you.`,
              orderId
            });
          }
        } catch {
        }
        res.status(201).json({ success: true, message: "Delivery assigned successfully", delivery, order });
      } catch (error) {
        res.status(500).json({ success: false, message: "Failed to assign delivery", code: "ASSIGN_ERROR" });
      }
    });
    router8.post("/accept", protect, authorize("driver"), async (req, res) => {
      try {
        const { orderId } = req.body;
        const driverId = req.user?._id?.toString();
        const delivery = await Delivery.findOne({ orderId, deliveryPartnerId: driverId });
        if (!delivery) {
          res.status(404).json({ success: false, message: "Delivery assignment not found for this driver", code: "DELIVERY_NOT_FOUND" });
          return;
        }
        delivery.status = "ACCEPTED";
        delivery.acceptedAt = /* @__PURE__ */ new Date();
        delivery.timeline.push({ status: "ACCEPTED", timestamp: /* @__PURE__ */ new Date(), note: "Accepted by driver" });
        await delivery.save();
        const order = await Order.findById(orderId);
        if (order) {
          order.timeline.push({ status: "ASSIGNED", timestamp: /* @__PURE__ */ new Date(), note: "Delivery accepted by partner", actor: "DELIVERY_PARTNER" });
          await order.save();
        }
        res.json({ success: true, message: "Delivery accepted", delivery });
      } catch (error) {
        res.status(500).json({ success: false, message: "Failed to accept delivery", code: "ACCEPT_ERROR" });
      }
    });
    router8.post("/reject", protect, authorize("driver"), async (req, res) => {
      try {
        const { orderId, reason } = req.body;
        const driverId = req.user?._id?.toString();
        const delivery = await Delivery.findOne({ orderId, deliveryPartnerId: driverId });
        if (!delivery) {
          res.status(404).json({ success: false, message: "Delivery not found", code: "DELIVERY_NOT_FOUND" });
          return;
        }
        delivery.status = "REJECTED";
        delivery.rejectedBy = [...delivery.rejectedBy || [], driverId];
        delivery.deliveryPartnerId = void 0;
        delivery.timeline.push({ status: "REJECTED", timestamp: /* @__PURE__ */ new Date(), note: reason || "Rejected by driver" });
        await delivery.save();
        await User.findByIdAndUpdate(driverId, { $inc: { activeOrders: -1 } });
        const order = await Order.findById(orderId);
        if (order) {
          order.status = "READY_FOR_PICKUP";
          order.deliveryPartnerId = void 0;
          order.deliveryPartnerName = void 0;
          order.timeline.push({ status: "READY_FOR_PICKUP", timestamp: /* @__PURE__ */ new Date(), note: "Driver rejected. Re-queued for assignment.", actor: "SYSTEM" });
          await order.save();
        }
        res.json({ success: true, message: "Delivery rejected and re-queued for assignment" });
      } catch (error) {
        res.status(500).json({ success: false, message: "Failed to reject delivery", code: "REJECT_ERROR" });
      }
    });
    router8.post("/pickup", protect, authorize("driver"), async (req, res) => {
      try {
        const { orderId } = req.body;
        const driverId = req.user?._id?.toString();
        const delivery = await Delivery.findOne({ orderId, deliveryPartnerId: driverId });
        if (!delivery) {
          res.status(404).json({ success: false, message: "Delivery assignment not found", code: "DELIVERY_NOT_FOUND" });
          return;
        }
        delivery.status = "PICKED_UP";
        delivery.pickedUpAt = /* @__PURE__ */ new Date();
        delivery.timeline.push({ status: "PICKED_UP", timestamp: /* @__PURE__ */ new Date(), note: "Picked up from kitchen" });
        await delivery.save();
        const order = await Order.findById(orderId);
        if (order) {
          order.status = "PICKED_UP";
          order.timeline.push({ status: "PICKED_UP", timestamp: /* @__PURE__ */ new Date(), note: "Order picked up from restaurant", actor: "DELIVERY_PARTNER" });
          await order.save();
          try {
            const { io: io2 } = await Promise.resolve().then(() => (init_server(), server_exports));
            if (io2) {
              io2.to(`tracking_${orderId}`).emit("delivery:picked_up", {
                orderId,
                status: "PICKED_UP",
                pickedUpAt: delivery.pickedUpAt
              });
              io2.to(`tracking_${orderId}`).emit("order:status", {
                orderId,
                status: "PICKED_UP",
                timeline: order.timeline
              });
              io2.to(order.userId.toString()).emit("notification", {
                title: "Order Picked Up! \u{1F6F5}",
                message: "Your food has been picked up and will be on the way shortly.",
                orderId
              });
            }
          } catch {
          }
        }
        res.json({ success: true, message: "Order marked as picked up", delivery, order });
      } catch (error) {
        res.status(500).json({ success: false, message: "Failed to mark pickup", code: "PICKUP_ERROR" });
      }
    });
    router8.post("/out-for-delivery", protect, authorize("driver"), async (req, res) => {
      try {
        const { orderId } = req.body;
        const driverId = req.user?._id?.toString();
        const delivery = await Delivery.findOne({ orderId, deliveryPartnerId: driverId });
        if (!delivery) {
          res.status(404).json({ success: false, message: "Delivery assignment not found", code: "DELIVERY_NOT_FOUND" });
          return;
        }
        delivery.status = "OUT_FOR_DELIVERY";
        delivery.timeline.push({ status: "OUT_FOR_DELIVERY", timestamp: /* @__PURE__ */ new Date(), note: "Out for delivery to customer" });
        await delivery.save();
        const order = await Order.findById(orderId);
        if (order) {
          order.status = "OUT_FOR_DELIVERY";
          order.timeline.push({ status: "OUT_FOR_DELIVERY", timestamp: /* @__PURE__ */ new Date(), note: "Delivery partner is on the way", actor: "DELIVERY_PARTNER" });
          await order.save();
          try {
            const { io: io2 } = await Promise.resolve().then(() => (init_server(), server_exports));
            if (io2) {
              io2.to(`tracking_${orderId}`).emit("delivery:out_for_delivery", {
                orderId,
                status: "OUT_FOR_DELIVERY",
                currentLocation: delivery.currentLocation?.coordinates
              });
              io2.to(`tracking_${orderId}`).emit("order:status", {
                orderId,
                status: "OUT_FOR_DELIVERY",
                timeline: order.timeline
              });
              io2.to(order.userId.toString()).emit("notification", {
                title: "Out for Delivery! \u{1F680}",
                message: "Your delicious meal is on its way to your doorstep!",
                orderId
              });
            }
          } catch {
          }
        }
        res.json({ success: true, message: "Order is out for delivery", delivery, order });
      } catch (error) {
        res.status(500).json({ success: false, message: "Failed to start delivery", code: "OUT_FOR_DELIVERY_ERROR" });
      }
    });
    router8.post("/delivered", protect, authorize("driver"), async (req, res) => {
      try {
        const { orderId } = req.body;
        const driverId = req.user?._id?.toString();
        const delivery = await Delivery.findOne({ orderId, deliveryPartnerId: driverId });
        if (!delivery) {
          res.status(404).json({ success: false, message: "Delivery assignment not found", code: "DELIVERY_NOT_FOUND" });
          return;
        }
        delivery.status = "DELIVERED";
        delivery.deliveredAt = /* @__PURE__ */ new Date();
        delivery.timeline.push({ status: "DELIVERED", timestamp: /* @__PURE__ */ new Date(), note: "Delivered to customer" });
        await delivery.save();
        await User.findByIdAndUpdate(driverId, { $inc: { activeOrders: -1 } });
        const order = await Order.findById(orderId);
        if (order) {
          order.status = "DELIVERED";
          order.paymentStatus = "PAID";
          order.timeline.push({ status: "DELIVERED", timestamp: /* @__PURE__ */ new Date(), note: "Order handed to customer", actor: "DELIVERY_PARTNER" });
          const pointsEarned = Math.floor(order.totalPrice / 100);
          if (pointsEarned > 0) {
            await User.findByIdAndUpdate(order.userId, { $inc: { rewardPoints: pointsEarned } });
          }
          await order.save();
          try {
            const { io: io2 } = await Promise.resolve().then(() => (init_server(), server_exports));
            if (io2) {
              io2.to(`tracking_${orderId}`).emit("order:delivered", {
                orderId,
                status: "DELIVERED",
                deliveredAt: delivery.deliveredAt
              });
              io2.to(`tracking_${orderId}`).emit("order:status", {
                orderId,
                status: "DELIVERED",
                timeline: order.timeline
              });
              io2.to(order.userId.toString()).emit("notification", {
                title: "Order Delivered! \u{1F389}",
                message: "Your meal has been delivered. Enjoy your food!",
                orderId
              });
            }
          } catch {
          }
        }
        res.json({ success: true, message: "Delivery completed successfully", delivery, order });
      } catch (error) {
        res.status(500).json({ success: false, message: "Failed to complete delivery", code: "DELIVERED_ERROR" });
      }
    });
    router8.put("/:id/location", protect, authorize("driver"), async (req, res) => {
      try {
        const { coordinates } = req.body;
        const driverId = req.user?._id?.toString();
        if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
          res.status(400).json({ success: false, message: "Valid coordinates [lng, lat] required", code: "INVALID_COORDINATES" });
          return;
        }
        const delivery = await Delivery.findOne({ _id: req.params.id, deliveryPartnerId: driverId });
        if (!delivery) {
          res.status(404).json({ success: false, message: "Delivery not found", code: "DELIVERY_NOT_FOUND" });
          return;
        }
        delivery.currentLocation = {
          type: "Point",
          coordinates: [Number(coordinates[0]), Number(coordinates[1])]
        };
        await delivery.save();
        await User.findByIdAndUpdate(driverId, {
          currentLocation: delivery.currentLocation
        });
        try {
          const { io: io2 } = await Promise.resolve().then(() => (init_server(), server_exports));
          if (io2) {
            io2.to(`tracking_${delivery.orderId}`).emit("delivery:location", {
              orderId: delivery.orderId,
              coordinates: delivery.currentLocation.coordinates,
              status: delivery.status,
              eta: delivery.eta
            });
          }
        } catch {
        }
        res.json({ success: true, currentLocation: delivery.currentLocation.coordinates });
      } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update location", code: "LOCATION_UPDATE_ERROR" });
      }
    });
    router8.get("/tracking/:orderId", protect, async (req, res) => {
      try {
        const { orderId } = req.params;
        const user = req.user;
        let order = null;
        if (ObjectIdMock.isValid(orderId)) {
          order = await Order.findById(orderId);
        } else if (orderId.startsWith("cs_") || orderId.startsWith("mock_sess_")) {
          order = await Order.findOne({ sessionId: orderId });
        }
        if (!order) {
          res.status(404).json({ success: false, message: "Order not found for given tracking identifier", code: "ORDER_NOT_FOUND" });
          return;
        }
        if (user?.role === "customer" && order.userId !== user._id.toString()) {
          res.status(403).json({ success: false, message: "Not authorized to track this order", code: "FORBIDDEN" });
          return;
        }
        if (user?.role === "driver" && order.deliveryPartnerId && order.deliveryPartnerId !== user._id.toString()) {
          res.status(403).json({ success: false, message: "Not authorized to view another driver\u2019s delivery", code: "FORBIDDEN" });
          return;
        }
        const delivery = await Delivery.findOne({ orderId: order._id.toString() });
        const hasDriver = !!(delivery?.deliveryPartnerName || order.deliveryPartnerName);
        res.json({
          success: true,
          orderId: order._id,
          orderStatus: order.status,
          paymentStatus: order.paymentStatus,
          totalPrice: order.totalPrice,
          items: order.items,
          deliveryAddress: order.deliveryAddress,
          timeline: order.timeline,
          deliveryPartner: hasDriver ? {
            id: order.deliveryPartnerId || delivery?.deliveryPartnerId,
            name: order.deliveryPartnerName || delivery?.deliveryPartnerName || "Assigned Driver",
            phone: order.deliveryPartnerPhone || delivery?.deliveryPartnerPhone || "9876543212"
          } : null,
          restaurantLocation: {
            latitude: delivery?.pickupLocation?.coordinates?.[1] || 13.0827,
            longitude: delivery?.pickupLocation?.coordinates?.[0] || 80.2707
          },
          customerLocation: {
            latitude: order.deliveryAddress?.lat || 13.0827,
            longitude: order.deliveryAddress?.lng || 80.2707
          },
          driverLocation: delivery?.currentLocation?.coordinates?.length === 2 ? {
            latitude: delivery.currentLocation.coordinates[1],
            longitude: delivery.currentLocation.coordinates[0]
          } : null,
          eta: delivery?.eta || null,
          deliveryStatus: delivery?.status || (["DELIVERED", "CANCELLED"].includes(order.status) ? order.status : "UNASSIGNED")
        });
      } catch (error) {
        console.error("Error fetching tracking:", error);
        res.status(500).json({ success: false, message: "Failed to fetch tracking data", code: "TRACKING_FETCH_ERROR" });
      }
    });
    router8.get("/:id", protect, async (req, res) => {
      try {
        const delivery = await Delivery.findById(req.params.id);
        if (!delivery) {
          res.status(404).json({ success: false, message: "Delivery not found", code: "DELIVERY_NOT_FOUND" });
          return;
        }
        const order = await Order.findById(delivery.orderId);
        const user = req.user;
        if (user?.role === "driver" && delivery.deliveryPartnerId !== user._id.toString()) {
          res.status(403).json({ success: false, message: "Not authorized to view this delivery", code: "FORBIDDEN" });
          return;
        }
        if (user?.role === "customer" && order && order.userId !== user._id.toString()) {
          res.status(403).json({ success: false, message: "Not authorized to view this delivery", code: "FORBIDDEN" });
          return;
        }
        res.json({ success: true, delivery, order });
      } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch delivery", code: "DELIVERY_FETCH_ERROR" });
      }
    });
    deliveries_default = router8;
  }
});

// src/utils/exportUtils.ts
var jsonToCSV;
var init_exportUtils = __esm({
  "src/utils/exportUtils.ts"() {
    "use strict";
    jsonToCSV = (data) => {
      if (!data || !data.length) {
        return "";
      }
      const headers = Object.keys(data[0]);
      const csvRows = [];
      csvRows.push(headers.join(","));
      for (const row of data) {
        const values = headers.map((header) => {
          const val = row[header];
          const escaped = ("" + val).replace(/"/g, '""');
          return `"${escaped}"`;
        });
        csvRows.push(values.join(","));
      }
      return csvRows.join("\n");
    };
  }
});

// src/routes/analytics.ts
import { Router as Router9 } from "express";
var router9, getDateFilterRange, REVENUE_ORDER_MATCH, overviewAnalyticsHandler, analytics_default;
var init_analytics = __esm({
  "src/routes/analytics.ts"() {
    "use strict";
    init_Order();
    init_User();
    init_Food();
    init_Delivery();
    init_Coupon();
    init_auth();
    init_exportUtils();
    router9 = Router9();
    getDateFilterRange = (rangeType, customStart, customEnd) => {
      const now = /* @__PURE__ */ new Date();
      let start = new Date(now);
      let end = new Date(now);
      switch (rangeType) {
        case "today": {
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);
          break;
        }
        case "yesterday": {
          start.setDate(start.getDate() - 1);
          start.setHours(0, 0, 0, 0);
          end.setDate(end.getDate() - 1);
          end.setHours(23, 59, 59, 999);
          break;
        }
        case "last7days":
        case "week": {
          start.setDate(start.getDate() - 7);
          start.setHours(0, 0, 0, 0);
          break;
        }
        case "last30days":
        case "30days": {
          start.setDate(start.getDate() - 30);
          start.setHours(0, 0, 0, 0);
          break;
        }
        case "thisMonth": {
          start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
          break;
        }
        case "lastMonth": {
          start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
          end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
          break;
        }
        case "custom": {
          if (customStart) start = new Date(customStart);
          if (customEnd) {
            end = new Date(customEnd);
            end.setHours(23, 59, 59, 999);
          }
          break;
        }
        default: {
          start.setDate(start.getDate() - 30);
          start.setHours(0, 0, 0, 0);
          break;
        }
      }
      return { start, end };
    };
    REVENUE_ORDER_MATCH = {
      paymentStatus: "PAID",
      status: { $nin: ["CANCELLED", "REFUNDED", "FAILED"] }
    };
    overviewAnalyticsHandler = async (req, res) => {
      try {
        const { range, startDate, endDate } = req.query;
        const { start, end } = getDateFilterRange(range, startDate, endDate);
        const todayStart = /* @__PURE__ */ new Date();
        todayStart.setHours(0, 0, 0, 0);
        const monthStart = new Date((/* @__PURE__ */ new Date()).getFullYear(), (/* @__PURE__ */ new Date()).getMonth(), 1);
        const [
          filteredRevenueAgg,
          todayRevenueAgg,
          monthRevenueAgg,
          totalOrdersCount,
          todayOrdersCount,
          completedOrdersCount,
          cancelledOrdersCount,
          activeDeliveriesCount,
          deliveredDeliveriesCount,
          allPaymentAttemptsCount,
          paidPaymentsCount,
          couponsUsedAgg,
          totalUsersCount
        ] = await Promise.all([
          // 1. Filtered Period Revenue & Orders
          Order.aggregate([
            { $match: { createdAt: { $gte: start, $lte: end }, ...REVENUE_ORDER_MATCH } },
            { $group: { _id: null, totalRevenue: { $sum: "$totalPrice" }, count: { $sum: 1 } } }
          ]),
          // 2. Today's Revenue
          Order.aggregate([
            { $match: { createdAt: { $gte: todayStart }, ...REVENUE_ORDER_MATCH } },
            { $group: { _id: null, totalRevenue: { $sum: "$totalPrice" }, count: { $sum: 1 } } }
          ]),
          // 3. Monthly Revenue
          Order.aggregate([
            { $match: { createdAt: { $gte: monthStart }, ...REVENUE_ORDER_MATCH } },
            { $group: { _id: null, totalRevenue: { $sum: "$totalPrice" }, count: { $sum: 1 } } }
          ]),
          // 4. Total orders in range
          Order.countDocuments({ createdAt: { $gte: start, $lte: end } }),
          // 5. Today's orders
          Order.countDocuments({ createdAt: { $gte: todayStart } }),
          // 6. Completed orders
          Order.countDocuments({ createdAt: { $gte: start, $lte: end }, status: "DELIVERED" }),
          // 7. Cancelled orders
          Order.countDocuments({ createdAt: { $gte: start, $lte: end }, status: "CANCELLED" }),
          // 8. Active deliveries
          Delivery.countDocuments({ status: { $in: ["ASSIGNED", "ACCEPTED", "PICKED_UP", "OUT_FOR_DELIVERY"] } }),
          // 9. Delivered deliveries
          Delivery.countDocuments({ createdAt: { $gte: start, $lte: end }, status: "DELIVERED" }),
          // 10. Total payment attempts
          Order.countDocuments({ createdAt: { $gte: start, $lte: end }, paymentMethod: "CARD" }),
          // 11. Successful paid orders
          Order.countDocuments({ createdAt: { $gte: start, $lte: end }, paymentStatus: "PAID" }),
          // 12. Coupon usage stats
          Coupon.aggregate([
            { $unwind: "$usedBy" },
            { $match: { "usedBy.usedAt": { $gte: start, $lte: end } } },
            { $group: { _id: null, totalCount: { $sum: 1 }, totalDiscount: { $sum: "$usedBy.discountAmount" } } }
          ]),
          // 13. Total Users
          User.countDocuments()
        ]);
        const totalRevenue = filteredRevenueAgg[0]?.totalRevenue || 0;
        const paidOrderCount = filteredRevenueAgg[0]?.count || 0;
        const todayRevenue = todayRevenueAgg[0]?.totalRevenue || 0;
        const monthlyRevenue = monthRevenueAgg[0]?.totalRevenue || 0;
        const averageOrderValue = paidOrderCount > 0 ? Math.round(totalRevenue / paidOrderCount) : 0;
        const paymentSuccessRate = allPaymentAttemptsCount > 0 ? Number((paidPaymentsCount / allPaymentAttemptsCount * 100).toFixed(1)) : 100;
        const dispatchedCount = completedOrdersCount + activeDeliveriesCount;
        const deliverySuccessRate = dispatchedCount > 0 ? Number((completedOrdersCount / dispatchedCount * 100).toFixed(1)) : 100;
        res.json({
          success: true,
          range: { start, end },
          kpis: {
            totalRevenue,
            todayRevenue,
            monthlyRevenue,
            totalOrders: totalOrdersCount,
            todayOrders: todayOrdersCount,
            completedOrders: completedOrdersCount,
            cancelledOrders: cancelledOrdersCount,
            averageOrderValue,
            activeDeliveries: activeDeliveriesCount,
            deliveredOrders: deliveredDeliveriesCount,
            couponUsageCount: couponsUsedAgg[0]?.totalCount || 0,
            couponDiscountTotal: couponsUsedAgg[0]?.totalDiscount || 0,
            paymentSuccessRate,
            deliverySuccessRate,
            totalUsers: totalUsersCount
          }
        });
      } catch (error) {
        console.error("Overview analytics error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch analytics overview", code: "ANALYTICS_OVERVIEW_ERROR" });
      }
    };
    router9.get("/overview", protect, authorize("admin", "restaurant"), overviewAnalyticsHandler);
    router9.get("/live", protect, authorize("admin", "restaurant"), overviewAnalyticsHandler);
    router9.get("/revenue", protect, authorize("admin"), async (req, res) => {
      try {
        const { range, startDate, endDate } = req.query;
        const { start, end } = getDateFilterRange(range, startDate, endDate);
        const revenueTimeline = await Order.aggregate([
          {
            $match: {
              createdAt: { $gte: start, $lte: end },
              ...REVENUE_ORDER_MATCH
            }
          },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              revenue: { $sum: "$totalPrice" },
              orders: { $sum: 1 },
              discountGiven: { $sum: "$discountAmount" }
            }
          },
          { $sort: { _id: 1 } }
        ]);
        res.json({
          success: true,
          data: revenueTimeline.map((r) => ({
            date: r._id,
            revenue: r.revenue,
            orders: r.orders,
            discountGiven: r.discountGiven
          }))
        });
      } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch revenue analytics", code: "REVENUE_ANALYTICS_ERROR" });
      }
    });
    router9.get("/orders", protect, authorize("admin", "restaurant"), async (req, res) => {
      try {
        const { range, startDate, endDate } = req.query;
        const { start, end } = getDateFilterRange(range, startDate, endDate);
        const [statusDistribution, hourlyOrders, orderTrends] = await Promise.all([
          // Status Distribution
          Order.aggregate([
            { $match: { createdAt: { $gte: start, $lte: end } } },
            { $group: { _id: "$status", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ]),
          // Hourly distribution
          Order.aggregate([
            { $match: { createdAt: { $gte: start, $lte: end } } },
            {
              $group: {
                _id: { $hour: "$createdAt" },
                orders: { $sum: 1 }
              }
            },
            { $sort: { _id: 1 } }
          ]),
          // Daily order trend
          Order.aggregate([
            { $match: { createdAt: { $gte: start, $lte: end } } },
            {
              $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                count: { $sum: 1 }
              }
            },
            { $sort: { _id: 1 } }
          ])
        ]);
        res.json({
          success: true,
          statusDistribution: statusDistribution.map((s) => ({ status: s._id, count: s.count })),
          hourlyOrders: hourlyOrders.map((h) => ({ hour: `${h._id}:00`, orders: h.orders })),
          orderTrends: orderTrends.map((t) => ({ date: t._id, orders: t.count }))
        });
      } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch order analytics", code: "ORDER_ANALYTICS_ERROR" });
      }
    });
    router9.get("/foods", protect, authorize("admin", "restaurant"), async (req, res) => {
      try {
        const { range, startDate, endDate } = req.query;
        const { start, end } = getDateFilterRange(range, startDate, endDate);
        const [topSellingFoods, categoryDistribution] = await Promise.all([
          // Top Selling Dishes
          Order.aggregate([
            { $match: { createdAt: { $gte: start, $lte: end }, ...REVENUE_ORDER_MATCH } },
            { $unwind: "$items" },
            {
              $group: {
                _id: "$items.name",
                totalSold: { $sum: "$items.quantity" },
                totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
                category: { $first: "$items.category" }
              }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 10 }
          ]),
          // Category Breakdown
          Food.aggregate([
            { $group: { _id: "$category", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ])
        ]);
        res.json({
          success: true,
          topFoods: topSellingFoods.map((f) => ({
            name: f._id,
            category: f.category || "General",
            orders: f.totalSold,
            revenue: f.totalRevenue
          })),
          categoryDistribution: categoryDistribution.map((c) => ({ category: c._id, count: c.count }))
        });
      } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch food analytics", code: "FOOD_ANALYTICS_ERROR" });
      }
    });
    router9.get("/customers", protect, authorize("admin"), async (req, res) => {
      try {
        const segments = await Order.aggregate([
          { $match: REVENUE_ORDER_MATCH },
          {
            $group: {
              _id: "$userId",
              orderCount: { $sum: 1 },
              totalSpend: { $sum: "$totalPrice" },
              lastOrderDate: { $max: "$createdAt" }
            }
          },
          {
            $addFields: {
              segment: {
                $switch: {
                  branches: [
                    { case: { $gte: ["$totalSpend", 5e3] }, then: "Whales" },
                    { case: { $gte: ["$orderCount", 5] }, then: "Regulars" },
                    { case: { $gte: [{ $subtract: [/* @__PURE__ */ new Date(), "$lastOrderDate"] }, 1e3 * 60 * 60 * 24 * 30] }, then: "Churn Risk" }
                  ],
                  default: "New"
                }
              }
            }
          },
          {
            $group: {
              _id: "$segment",
              count: { $sum: 1 },
              totalRevenue: { $sum: "$totalSpend" }
            }
          }
        ]);
        const totalCustomers = await User.countDocuments({ role: "customer" });
        res.json({
          success: true,
          totalCustomers,
          segments: segments.map((s) => ({
            name: s._id,
            count: s.count,
            revenue: s.totalRevenue
          }))
        });
      } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch customer analytics", code: "CUSTOMER_ANALYTICS_ERROR" });
      }
    });
    router9.get("/delivery", protect, authorize("admin"), async (req, res) => {
      try {
        const [deliveryStatusDist, driverPerformance] = await Promise.all([
          Delivery.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
          ]),
          User.find({ role: "driver" }).select("name phone vehicle availability activeOrders rating")
        ]);
        res.json({
          success: true,
          deliveryStatusDist: deliveryStatusDist.map((d) => ({ status: d._id, count: d.count })),
          drivers: driverPerformance
        });
      } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch delivery analytics", code: "DELIVERY_ANALYTICS_ERROR" });
      }
    });
    router9.get("/export", protect, authorize("admin"), async (req, res) => {
      try {
        const { type = "sales", format = "csv", range, startDate, endDate } = req.query;
        const { start, end } = getDateFilterRange(range, startDate, endDate);
        let rows = [];
        let filename = `foods66_${type}_report_${Date.now()}`;
        if (type === "sales") {
          const orders = await Order.find({
            createdAt: { $gte: start, $lte: end },
            ...REVENUE_ORDER_MATCH
          }).sort({ createdAt: -1 }).lean();
          rows = orders.map((o) => ({
            OrderID: o._id.toString(),
            Date: o.createdAt?.toISOString().split("T")[0] || "",
            Customer: o.userId,
            Subtotal: o.subtotal,
            DeliveryFee: o.deliveryFee,
            Tax: o.tax,
            Discount: o.discountAmount,
            Coupon: o.couponCode || "None",
            Total: o.totalPrice,
            PaymentMethod: o.paymentMethod,
            Status: o.status
          }));
        } else if (type === "orders") {
          const orders = await Order.find({ createdAt: { $gte: start, $lte: end } }).sort({ createdAt: -1 }).lean();
          rows = orders.map((o) => ({
            OrderID: o._id.toString(),
            Date: o.createdAt?.toISOString().split("T")[0] || "",
            ItemsCount: o.items.length,
            TotalAmount: o.totalPrice,
            Status: o.status,
            PaymentStatus: o.paymentStatus,
            Driver: o.deliveryPartnerName || "None"
          }));
        } else if (type === "foods") {
          const foods = await Food.find().lean();
          rows = foods.map((f) => ({
            FoodID: f._id.toString(),
            Name: f.name,
            Category: f.category,
            Price: f.price,
            Available: f.available ? "Yes" : "No",
            Stock: f.stock
          }));
        } else if (type === "coupons") {
          const coupons = await Coupon.find().lean();
          rows = coupons.map((c) => ({
            Code: c.code,
            DiscountType: c.discountType,
            DiscountValue: c.discountValue,
            MinOrder: c.minimumOrderAmount,
            UsedCount: c.usedCount,
            UsageLimit: c.usageLimit,
            Active: c.active ? "Yes" : "No",
            ExpiryDate: c.expiryDate?.toISOString().split("T")[0] || ""
          }));
        } else if (type === "deliveries") {
          const deliveries = await Delivery.find({ createdAt: { $gte: start, $lte: end } }).sort({ createdAt: -1 }).lean();
          rows = deliveries.map((d) => ({
            DeliveryID: d._id.toString(),
            OrderID: d.orderId,
            Driver: d.deliveryPartnerName || "Unassigned",
            Status: d.status,
            AssignedAt: d.assignedAt?.toISOString() || "",
            DeliveredAt: d.deliveredAt?.toISOString() || ""
          }));
        }
        if (format === "csv") {
          const csvContent = jsonToCSV(rows);
          res.setHeader("Content-Type", "text/csv");
          res.setHeader("Content-Disposition", `attachment; filename="${filename}.csv"`);
          res.send(csvContent);
          return;
        }
        res.json({
          success: true,
          reportType: type,
          generatedAt: /* @__PURE__ */ new Date(),
          count: rows.length,
          data: rows
        });
      } catch (error) {
        console.error("Export error:", error);
        res.status(500).json({ success: false, message: "Failed to export report", code: "EXPORT_ERROR" });
      }
    });
    analytics_default = router9;
  }
});

// src/routes/payments.ts
import { Router as Router10 } from "express";
import Stripe from "stripe";
var router10, getStripeClient, createPaymentSessionHandler, payments_default;
var init_payments = __esm({
  "src/routes/payments.ts"() {
    "use strict";
    init_firestoreModel();
    init_auth();
    init_Order();
    init_Food();
    init_Coupon();
    init_pricingService();
    init_envConfig();
    init_logger();
    router10 = Router10();
    getStripeClient = () => {
      const secretKey = env.STRIPE_SECRET_KEY;
      if (!secretKey) return null;
      return new Stripe(secretKey, {
        apiVersion: "2023-10-16"
      });
    };
    createPaymentSessionHandler = async (req, res) => {
      try {
        const { items, deliveryAddress, couponCode, paymentMethod = "CARD", specialInstructions } = req.body;
        const idempotencyKey = req.header("X-Idempotency-Key") || req.body.idempotencyKey;
        const userId = req.user?._id?.toString();
        if (!userId) {
          res.status(401).json({ success: false, message: "User not authenticated", code: "UNAUTHORIZED" });
          return;
        }
        if (!items || !Array.isArray(items) || items.length === 0) {
          res.status(400).json({ success: false, message: "Cart cannot be empty", code: "INVALID_CART" });
          return;
        }
        if (!deliveryAddress) {
          res.status(400).json({ success: false, message: "Delivery address is required", code: "MISSING_ADDRESS" });
          return;
        }
        if (idempotencyKey) {
          const existingOrder = await Order.findOne({ idempotencyKey, userId });
          if (existingOrder) {
            res.json({
              success: true,
              sessionId: existingOrder.sessionId,
              sessionUrl: existingOrder.sessionId ? `https://checkout.stripe.com/c/pay/${existingOrder.sessionId}` : void 0,
              orderId: existingOrder._id,
              calculation: {
                subtotal: existingOrder.subtotal,
                deliveryFee: existingOrder.deliveryFee,
                tax: existingOrder.tax,
                discountAmount: existingOrder.discountAmount,
                grandTotal: existingOrder.totalPrice
              }
            });
            return;
          }
        }
        let calculatedSubtotal = 0;
        const validatedItems = [];
        const itemCategories = [];
        const itemFoodIds = [];
        const now = /* @__PURE__ */ new Date();
        for (const item of items) {
          if (!item.foodId) {
            res.status(400).json({ success: false, message: "Food item ID is required for each cart item", code: "INVALID_ITEM" });
            return;
          }
          const qty = Number(item.quantity);
          if (!Number.isInteger(qty) || qty <= 0) {
            res.status(400).json({ success: false, message: `Invalid quantity for item ${item.foodId}`, code: "INVALID_QUANTITY" });
            return;
          }
          if (!ObjectIdMock.isValid(item.foodId)) {
            res.status(400).json({
              success: false,
              message: `Invalid food item ID: ${item.foodId}. Please update your cart with latest items from the menu.`,
              code: "INVALID_FOOD_ID"
            });
            return;
          }
          const foodDoc = await Food.findById(item.foodId);
          if (!foodDoc) {
            res.status(404).json({
              success: false,
              message: `Food item not found: ${item.foodId}`,
              code: "FOOD_NOT_FOUND"
            });
            return;
          }
          if (!foodDoc.available) {
            res.status(409).json({
              success: false,
              message: `${foodDoc.name} is currently unavailable`,
              code: "FOOD_UNAVAILABLE"
            });
            return;
          }
          if (foodDoc.stock !== void 0 && foodDoc.stock < qty) {
            res.status(409).json({
              success: false,
              message: `Insufficient stock for "${foodDoc.name}". Only ${foodDoc.stock} available.`,
              code: "INSUFFICIENT_STOCK"
            });
            return;
          }
          const unitPrice = applyDynamicPrice(foodDoc.price, now);
          const lineSubtotal = unitPrice * qty;
          calculatedSubtotal += lineSubtotal;
          validatedItems.push({
            foodId: foodDoc._id.toString(),
            name: foodDoc.name,
            price: unitPrice,
            quantity: qty,
            image: foodDoc.image,
            category: foodDoc.category,
            customization: item.customization
          });
          if (foodDoc.category) itemCategories.push(foodDoc.category);
          itemFoodIds.push(foodDoc._id.toString());
        }
        let discountAmount = 0;
        let isFreeDelivery = false;
        let appliedCouponCode = void 0;
        if (couponCode && typeof couponCode === "string" && couponCode.trim()) {
          const codeUpper = couponCode.trim().toUpperCase();
          const coupon = await Coupon.findOne({ code: codeUpper });
          if (!coupon) {
            res.status(400).json({ success: false, message: "Invalid coupon code", code: "INVALID_COUPON" });
            return;
          }
          if (!coupon.active) {
            res.status(400).json({ success: false, message: "This coupon is no longer active", code: "COUPON_INACTIVE" });
            return;
          }
          if (coupon.startDate && now < coupon.startDate) {
            res.status(400).json({ success: false, message: "This coupon is not yet active", code: "COUPON_NOT_STARTED" });
            return;
          }
          if (coupon.expiryDate && now > coupon.expiryDate) {
            res.status(400).json({ success: false, message: "Coupon has expired", code: "COUPON_EXPIRED" });
            return;
          }
          if (coupon.usedCount >= coupon.usageLimit) {
            res.status(400).json({ success: false, message: "Coupon usage limit reached", code: "COUPON_LIMIT_REACHED" });
            return;
          }
          const userUsageCount = await Order.countDocuments({
            userId,
            couponCode: codeUpper,
            status: { $nin: ["CANCELLED", "REFUNDED"] }
          });
          if (userUsageCount >= coupon.perUserLimit) {
            res.status(400).json({ success: false, message: "You have already reached the usage limit for this coupon", code: "COUPON_USER_LIMIT_REACHED" });
            return;
          }
          if (calculatedSubtotal < coupon.minimumOrderAmount) {
            res.status(400).json({
              success: false,
              message: `Minimum order amount of \u20B9${coupon.minimumOrderAmount} required for this coupon`,
              code: "MINIMUM_ORDER_NOT_MET"
            });
            return;
          }
          if (coupon.applicableCategories && coupon.applicableCategories.length > 0) {
            const hasApplicableCategory = itemCategories.some((cat) => coupon.applicableCategories.includes(cat));
            if (!hasApplicableCategory) {
              res.status(400).json({ success: false, message: "Coupon is not applicable to items in your cart", code: "COUPON_NOT_APPLICABLE" });
              return;
            }
          }
          if (coupon.applicableFoods && coupon.applicableFoods.length > 0) {
            const hasApplicableFood = itemFoodIds.some((fId) => coupon.applicableFoods.includes(fId));
            if (!hasApplicableFood) {
              res.status(400).json({ success: false, message: "Coupon is not applicable to the selected dishes", code: "COUPON_NOT_APPLICABLE" });
              return;
            }
          }
          if (coupon.discountType === "PERCENTAGE") {
            let disc = Math.round(calculatedSubtotal * coupon.discountValue / 100);
            if (coupon.maximumDiscount && disc > coupon.maximumDiscount) {
              disc = coupon.maximumDiscount;
            }
            discountAmount = Math.min(disc, calculatedSubtotal);
          } else if (coupon.discountType === "FIXED_AMOUNT") {
            discountAmount = Math.min(coupon.discountValue, calculatedSubtotal);
          } else if (coupon.discountType === "FREE_DELIVERY") {
            isFreeDelivery = true;
          }
          appliedCouponCode = codeUpper;
        }
        const pricing = calculateOrderPricing({
          subtotal: calculatedSubtotal,
          discountAmount,
          freeDelivery: isFreeDelivery
        });
        const formattedAddress = typeof deliveryAddress === "string" ? { fullAddress: deliveryAddress } : {
          doorNo: deliveryAddress.doorNo || "",
          landmark: deliveryAddress.landmark || "",
          district: deliveryAddress.district || "",
          city: deliveryAddress.city || "",
          state: deliveryAddress.state || "",
          pincode: deliveryAddress.pincode || "",
          fullAddress: deliveryAddress.fullAddress || `${deliveryAddress.doorNo || ""}, ${deliveryAddress.landmark || ""}, ${deliveryAddress.district || ""}`.trim(),
          lat: deliveryAddress.lat,
          lng: deliveryAddress.lng
        };
        const clientUrl = env.CLIENT_URL && !env.CLIENT_URL.includes("localhost:3000") ? env.CLIENT_URL : process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : req.headers.origin || env.CLIENT_URL || "http://localhost:3000";
        const stripe = getStripeClient();
        const pregeneratedOrderId = new ObjectIdMock().toString();
        let stripeSessionId = `mock_sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        let stripeSessionUrl = void 0;
        if (paymentMethod === "CARD" && stripe) {
          try {
            const lineItems = validatedItems.map((item) => ({
              price_data: {
                currency: "inr",
                product_data: {
                  name: item.name,
                  images: item.image && item.image.startsWith("http") ? [item.image] : []
                },
                unit_amount: Math.round(item.price * 100)
                // ₹ to paise
              },
              quantity: item.quantity
            }));
            if (pricing.deliveryFee > 0) {
              lineItems.push({
                price_data: {
                  currency: "inr",
                  product_data: { name: "Delivery Fee" },
                  unit_amount: Math.round(pricing.deliveryFee * 100)
                },
                quantity: 1
              });
            }
            if (pricing.tax > 0) {
              lineItems.push({
                price_data: {
                  currency: "inr",
                  product_data: { name: "GST / Taxes (5%)" },
                  unit_amount: Math.round(pricing.tax * 100)
                },
                quantity: 1
              });
            }
            let stripeDiscounts = void 0;
            if (pricing.discountAmount > 0 && appliedCouponCode) {
              try {
                const stripeCoupon = await stripe.coupons.create({
                  amount_off: Math.round(pricing.discountAmount * 100),
                  currency: "inr",
                  duration: "once",
                  name: `Discount (${appliedCouponCode})`
                });
                stripeDiscounts = [{ coupon: stripeCoupon.id }];
              } catch (cErr) {
                console.warn("Could not create Stripe coupon object, proceeding with adjusted total line item:", cErr);
              }
            }
            const session = await stripe.checkout.sessions.create({
              payment_method_types: ["card"],
              line_items: lineItems,
              discounts: stripeDiscounts,
              mode: "payment",
              success_url: `${clientUrl}/#/payment/${pregeneratedOrderId}?session_id={CHECKOUT_SESSION_ID}&success=true`,
              cancel_url: `${clientUrl}/#/cart?canceled=true`,
              client_reference_id: userId,
              metadata: {
                userId,
                orderId: pregeneratedOrderId.toString(),
                couponCode: appliedCouponCode || "",
                idempotencyKey: idempotencyKey || ""
              }
            });
            stripeSessionId = session.id;
            stripeSessionUrl = session.url || void 0;
          } catch (stripeErr) {
            logger.warn("STRIPE_SESSION_FALLBACK", `Stripe SDK session creation warning (using test mock session): ${stripeErr.message}`);
          }
        }
        const initialStatus = paymentMethod === "COD" ? "PAYMENT_CONFIRMED" : "PAYMENT_PENDING";
        const initialPaymentStatus = paymentMethod === "COD" ? "PENDING" : "PROCESSING";
        const order = await Order.create({
          _id: pregeneratedOrderId,
          userId,
          items: validatedItems,
          subtotal: pricing.subtotal,
          deliveryFee: pricing.deliveryFee,
          tax: pricing.tax,
          discountAmount: pricing.discountAmount,
          couponCode: appliedCouponCode,
          totalPrice: pricing.grandTotal,
          status: initialStatus,
          paymentStatus: initialPaymentStatus,
          paymentMethod,
          deliveryAddress: formattedAddress,
          timeline: [
            { status: "PLACED", timestamp: /* @__PURE__ */ new Date(), note: "Order placed by customer", actor: "CUSTOMER" },
            { status: initialStatus, timestamp: /* @__PURE__ */ new Date(), note: paymentMethod === "COD" ? "Order confirmed via Cash on Delivery" : "Awaiting Stripe payment confirmation", actor: "SYSTEM" }
          ],
          specialInstructions: specialInstructions || "",
          idempotencyKey,
          sessionId: stripeSessionId
        });
        if (paymentMethod === "COD") {
          for (const item of validatedItems) {
            try {
              const qty = Math.max(1, item.quantity);
              const result = await Food.findOneAndUpdate(
                { _id: item.foodId, stock: { $gte: qty } },
                { $inc: { stock: -qty } },
                { new: true }
              );
              if (result && result.stock === 0) {
                await Food.findByIdAndUpdate(item.foodId, { available: false });
              }
            } catch (stkErr) {
              logger.error("COD_STOCK_REDUCTION_ERROR", `Failed to decrement stock for item ${item.foodId}`, { error: stkErr });
            }
          }
          try {
            const { triggerAutoDeliveryAssignment: triggerAutoDeliveryAssignment2 } = await Promise.resolve().then(() => (init_orders(), orders_exports));
            await triggerAutoDeliveryAssignment2(order._id.toString());
          } catch (delErr) {
            logger.warn("COD_DELIVERY_CREATION_WARNING", `Could not trigger auto delivery assignment: ${delErr}`);
          }
        }
        res.status(201).json({
          success: true,
          sessionId: stripeSessionId,
          sessionUrl: stripeSessionUrl,
          orderId: order._id,
          calculation: {
            subtotal: pricing.subtotal,
            deliveryFee: pricing.deliveryFee,
            tax: pricing.tax,
            discountAmount: pricing.discountAmount,
            grandTotal: pricing.grandTotal
          }
        });
      } catch (error) {
        logger.error("PAYMENT_SESSION_ERROR", "Error creating payment session", { error });
        res.status(500).json({
          success: false,
          message: error.message || "Payment session creation failed",
          code: "PAYMENT_SESSION_ERROR"
        });
      }
    };
    router10.post("/create-session", protect, createPaymentSessionHandler);
    router10.post("/checkout", protect, createPaymentSessionHandler);
    router10.get("/status/:orderId", protect, async (req, res) => {
      try {
        const { orderId } = req.params;
        const userId = req.user?._id?.toString();
        let query = { _id: orderId };
        if (orderId.startsWith("cs_") || orderId.startsWith("mock_sess_")) {
          query = { sessionId: orderId };
        }
        const order = await Order.findOne(query);
        if (!order) {
          res.status(404).json({ success: false, message: "Order not found for given payment identifier", code: "ORDER_NOT_FOUND" });
          return;
        }
        if (req.user?.role === "customer" && order.userId !== userId) {
          res.status(403).json({ success: false, message: "Not authorized to view this payment", code: "FORBIDDEN" });
          return;
        }
        res.json({
          success: true,
          orderId: order._id,
          sessionId: order.sessionId,
          status: order.status,
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod,
          totalPrice: order.totalPrice,
          createdAt: order.createdAt
        });
      } catch (error) {
        logger.error("PAYMENT_STATUS_ERROR", "Error fetching payment status", { error });
        res.status(500).json({ success: false, message: "Failed to fetch payment status", code: "STATUS_FETCH_FAILED" });
      }
    });
    router10.post("/verify/:orderId", protect, async (req, res) => {
      try {
        const { orderId } = req.params;
        const userId = req.user?._id?.toString();
        let query = { _id: orderId };
        if (orderId.startsWith("cs_") || orderId.startsWith("mock_sess_")) {
          query = { sessionId: orderId };
        }
        const order = await Order.findOne(query);
        if (!order) {
          res.status(404).json({ success: false, message: "Order not found", code: "ORDER_NOT_FOUND" });
          return;
        }
        if (req.user?.role === "customer" && order.userId !== userId) {
          res.status(403).json({ success: false, message: "Not authorized for this order", code: "FORBIDDEN" });
          return;
        }
        if (order.paymentStatus === "PAID" && order.status !== "PAYMENT_PENDING") {
          res.json({ success: true, orderId: order._id, status: order.status, paymentStatus: order.paymentStatus });
          return;
        }
        order.paymentStatus = "PAID";
        order.status = "PAYMENT_CONFIRMED";
        order.timeline.push(
          { status: "PAID", timestamp: /* @__PURE__ */ new Date(), note: "Payment successfully captured via Stripe checkout", actor: "SYSTEM" },
          { status: "PAYMENT_CONFIRMED", timestamp: /* @__PURE__ */ new Date(), note: "Order confirmed and sent to kitchen", actor: "SYSTEM" }
        );
        await order.save();
        for (const item of order.items) {
          if (item.foodId) {
            try {
              const qty = Math.max(1, item.quantity);
              const result = await Food.findOneAndUpdate(
                { _id: item.foodId, stock: { $gte: qty } },
                { $inc: { stock: -qty } },
                { new: true }
              );
              if (result && result.stock === 0) {
                await Food.findByIdAndUpdate(item.foodId, { available: false });
              }
            } catch (stkErr) {
              console.error(`Failed to update stock for item ${item.foodId}:`, stkErr);
            }
          }
        }
        try {
          const { triggerAutoDeliveryAssignment: triggerAutoDeliveryAssignment2 } = await Promise.resolve().then(() => (init_orders(), orders_exports));
          await triggerAutoDeliveryAssignment2(order._id.toString());
        } catch (delErr) {
          console.warn("Auto delivery assignment warning in payment verification:", delErr);
        }
        try {
          const { io: io2 } = await Promise.resolve().then(() => (init_server(), server_exports));
          if (io2) {
            io2.to(`tracking_${order._id.toString()}`).emit("order:status", {
              orderId: order._id.toString(),
              status: order.status,
              paymentStatus: order.paymentStatus,
              timeline: order.timeline
            });
          }
        } catch {
        }
        res.json({
          success: true,
          orderId: order._id,
          status: order.status,
          paymentStatus: order.paymentStatus,
          message: "Payment verified and order confirmed successfully."
        });
      } catch (error) {
        logger.error("PAYMENT_VERIFY_ERROR", "Error verifying payment", { error });
        res.status(500).json({ success: false, message: "Failed to verify payment", code: "PAYMENT_VERIFY_FAILED" });
      }
    });
    payments_default = router10;
  }
});

// src/routes/webhooks.ts
import { Router as Router11 } from "express";
import Stripe2 from "stripe";
var router11, handleStripeWebhook, webhooks_default;
var init_webhooks = __esm({
  "src/routes/webhooks.ts"() {
    "use strict";
    init_Order();
    init_Food();
    init_Coupon();
    init_envConfig();
    init_logger();
    router11 = Router11();
    handleStripeWebhook = async (req, res) => {
      const sig = req.headers["stripe-signature"];
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
      const secretKey = process.env.STRIPE_SECRET_KEY;
      let event;
      if (endpointSecret && secretKey && sig) {
        const stripe = new Stripe2(secretKey, { apiVersion: "2023-10-16" });
        try {
          event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        } catch (err) {
          logger.security("WEBHOOK_SIGNATURE_FAILED", `Webhook Signature Verification Error: ${err.message}`);
          res.status(400).send(`Webhook Error: ${err.message}`);
          return;
        }
      } else {
        if (env.isProduction) {
          logger.security("WEBHOOK_UNSIGNED_REJECTED", "Rejected unsigned webhook in production", {
            ip: req.ip,
            hasSig: !!sig,
            hasSecret: !!endpointSecret
          });
          res.status(403).json({ error: "Webhook signature verification required in production" });
          return;
        }
        try {
          const rawText = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : JSON.stringify(req.body);
          event = JSON.parse(rawText);
          console.warn("\u26A0\uFE0F  DEV MODE: Processing unsigned webhook payload");
        } catch (e) {
          res.status(400).json({ error: "Invalid webhook payload JSON" });
          return;
        }
      }
      try {
        const eventType = event.type;
        console.log(`\u{1F4E5} Received Stripe Webhook Event: ${eventType}`);
        if (eventType === "checkout.session.completed" || eventType === "payment_intent.succeeded") {
          const session = event.data.object;
          const sessionId = session.id;
          const paymentIntentId = session.payment_intent || session.id;
          const order = await Order.findOne({
            $or: [
              { sessionId },
              { stripePaymentIntentId: paymentIntentId },
              { _id: session.metadata?.orderId }
            ]
          });
          if (!order) {
            console.warn(`Order not found for Stripe session: ${sessionId}`);
            res.status(200).json({ received: true, note: "Order not found, ignored" });
            return;
          }
          if (order.paymentStatus === "PAID" || ["PAID", "PAYMENT_CONFIRMED", "RESTAURANT_CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY", "DELIVERED"].includes(order.status)) {
            console.log(`\u26A1 Idempotent skip: Order ${order._id} is already processed with status ${order.status}`);
            res.status(200).json({ received: true, skipped: true });
            return;
          }
          order.paymentStatus = "PAID";
          order.status = "PAYMENT_CONFIRMED";
          if (paymentIntentId) order.stripePaymentIntentId = paymentIntentId;
          order.timeline.push(
            { status: "PAID", timestamp: /* @__PURE__ */ new Date(), note: "Payment successfully captured via Stripe", actor: "SYSTEM" },
            { status: "PAYMENT_CONFIRMED", timestamp: /* @__PURE__ */ new Date(), note: "Order payment confirmed and sent to restaurant kitchen", actor: "SYSTEM" }
          );
          await order.save();
          for (const item of order.items) {
            if (item.foodId) {
              try {
                const qty = Math.max(1, item.quantity);
                const result = await Food.findOneAndUpdate(
                  { _id: item.foodId, stock: { $gte: qty } },
                  { $inc: { stock: -qty } },
                  { new: true }
                );
                if (!result) {
                  logger.warn("STOCK_INSUFFICIENT", `Stock insufficient or item not found for foodId=${item.foodId}, qty=${qty}`);
                } else if (result.stock === 0) {
                  await Food.findByIdAndUpdate(item.foodId, { available: false });
                  logger.info("STOCK_DEPLETED", `Food ${item.foodId} auto-disabled (stock=0)`);
                }
              } catch (stkErr) {
                logger.error("STOCK_DECREMENT_FAILED", `Failed to decrement stock for item ${item.foodId}`, { error: stkErr });
              }
            }
          }
          if (order.couponCode) {
            try {
              await Coupon.findOneAndUpdate(
                { code: order.couponCode },
                {
                  $inc: { usedCount: 1 },
                  $push: {
                    usedBy: {
                      userId: order.userId,
                      orderId: order._id.toString(),
                      usedAt: /* @__PURE__ */ new Date(),
                      discountAmount: order.discountAmount
                    }
                  }
                }
              );
            } catch (cErr) {
              console.error(`Failed to update coupon usage for ${order.couponCode}:`, cErr);
            }
          }
          try {
            const { Delivery: Delivery2 } = await Promise.resolve().then(() => (init_Delivery(), Delivery_exports));
            const existingDelivery = await Delivery2.findOne({ orderId: order._id.toString() });
            if (!existingDelivery) {
              await Delivery2.create({
                orderId: order._id.toString(),
                status: "AVAILABLE",
                timeline: [{ status: "AVAILABLE", timestamp: /* @__PURE__ */ new Date(), note: "Order awaiting restaurant confirmation and kitchen prep" }]
              });
            }
          } catch (delErr) {
            console.error(`Failed to create delivery record for order ${order._id}:`, delErr);
          }
          console.log(`\u2705 Order ${order._id} successfully confirmed & paid via Webhook`);
          try {
            const { io: io2 } = await Promise.resolve().then(() => (init_server(), server_exports));
            if (io2) {
              io2.to(order.userId.toString()).emit("notification", {
                title: "Payment Successful! \u{1F389}",
                message: `Order #${order._id.toString().slice(-6)} has been paid and confirmed by the kitchen!`,
                orderId: order._id,
                status: order.status
              });
              io2.to(`tracking_${order._id.toString()}`).emit("order:status", {
                orderId: order._id.toString(),
                status: order.status,
                paymentStatus: order.paymentStatus,
                timeline: order.timeline
              });
            }
          } catch (socketErr) {
            console.warn("Socket notification error:", socketErr);
          }
        } else if (eventType === "payment_intent.payment_failed" || eventType === "checkout.session.expired") {
          const session = event.data.object;
          const sessionId = session.id;
          const order = await Order.findOne({
            $or: [{ sessionId }, { stripePaymentIntentId: session.id }]
          });
          if (order && order.paymentStatus !== "PAID") {
            order.paymentStatus = "FAILED";
            order.status = "CANCELLED";
            order.timeline.push({
              status: "CANCELLED",
              timestamp: /* @__PURE__ */ new Date(),
              note: eventType === "checkout.session.expired" ? "Checkout session expired" : "Payment capture failed",
              actor: "SYSTEM"
            });
            await order.save();
            console.log(`\u26A0\uFE0F Order ${order._id} marked CANCELLED due to ${eventType}`);
            try {
              const { io: io2 } = await Promise.resolve().then(() => (init_server(), server_exports));
              if (io2) {
                io2.to(`tracking_${order._id.toString()}`).emit("order:status", {
                  orderId: order._id.toString(),
                  status: "CANCELLED",
                  paymentStatus: "FAILED",
                  timeline: order.timeline
                });
              }
            } catch {
            }
          }
        }
        res.status(200).json({ received: true });
      } catch (error) {
        logger.error("WEBHOOK_PROCESSING_FAILED", "Webhook processing failure", { error });
        res.status(500).json({ error: "Webhook processing failed" });
      }
    };
    router11.post("/payment", handleStripeWebhook);
    router11.post("/", handleStripeWebhook);
    webhooks_default = router11;
  }
});

// src/middlewares/upload.ts
import multer from "multer";
var storage, upload, upload_default;
var init_upload = __esm({
  "src/middlewares/upload.ts"() {
    "use strict";
    storage = multer.memoryStorage();
    upload = multer({
      storage,
      limits: {
        fileSize: 5 * 1024 * 1024
        // 5MB limit
      },
      fileFilter(req, file, cb) {
        if (file.mimetype === "image/jpeg" || file.mimetype === "image/png" || file.mimetype === "image/webp") {
          cb(null, true);
        } else {
          cb(new Error("Only JPG, PNG, WEBP are allowed"));
        }
      }
    });
    upload_default = upload;
  }
});

// src/routes/upload.ts
import { Router as Router12 } from "express";
import sharp from "sharp";
import { v4 as uuid } from "uuid";
import path3 from "path";
import fs3 from "fs";
import { fileURLToPath as fileURLToPath3 } from "url";
var __filename3, __dirname3, router12, uploadsDir, upload_default2;
var init_upload2 = __esm({
  "src/routes/upload.ts"() {
    "use strict";
    init_upload();
    init_auth();
    __filename3 = fileURLToPath3(import.meta.url);
    __dirname3 = path3.dirname(__filename3);
    router12 = Router12();
    uploadsDir = path3.join(__dirname3, "../../../uploads/foods");
    if (!fs3.existsSync(uploadsDir)) {
      fs3.mkdirSync(uploadsDir, { recursive: true });
    }
    router12.post("/", protect, authorize("admin", "restaurant"), upload_default.single("image"), async (req, res) => {
      try {
        if (!req.file) {
          res.status(400).json({ success: false, message: "No image uploaded", code: "NO_IMAGE" });
          return;
        }
        let metadata;
        try {
          metadata = await sharp(req.file.buffer).metadata();
        } catch (sharpErr) {
          res.status(400).json({ success: false, message: "Invalid image file \u2014 could not read image data", code: "INVALID_IMAGE_DATA" });
          return;
        }
        const allowedFormats = ["jpeg", "png", "webp", "jpg", "tiff", "avif"];
        if (!metadata.format || !allowedFormats.includes(metadata.format)) {
          res.status(400).json({
            success: false,
            message: `Unsupported image format: ${metadata.format}. Allowed: JPEG, PNG, WebP`,
            code: "UNSUPPORTED_FORMAT"
          });
          return;
        }
        if (metadata.format === "svg") {
          res.status(400).json({ success: false, message: "SVG format is not allowed", code: "SVG_NOT_ALLOWED" });
          return;
        }
        if (metadata.width && metadata.width > 1e4 || metadata.height && metadata.height > 1e4) {
          res.status(400).json({ success: false, message: "Image dimensions too large (max 10000x10000)", code: "IMAGE_TOO_LARGE" });
          return;
        }
        const baseFilename = uuid();
        const filename = `${baseFilename}.webp`;
        const filepath = path3.join(uploadsDir, filename);
        await sharp(req.file.buffer).resize({ width: 1200, height: 800, fit: "cover" }).webp({ quality: 85 }).toFile(filepath);
        const filenameMedium = `${baseFilename}-medium.webp`;
        const filepathMedium = path3.join(uploadsDir, filenameMedium);
        await sharp(req.file.buffer).resize({ width: 600, height: 400, fit: "cover" }).webp({ quality: 85 }).toFile(filepathMedium);
        const filenameThumb = `${baseFilename}-thumb.webp`;
        const filepathThumb = path3.join(uploadsDir, filenameThumb);
        await sharp(req.file.buffer).resize({ width: 300, height: 300, fit: "cover" }).webp({ quality: 85 }).toFile(filepathThumb);
        res.json({
          success: true,
          image: `/uploads/foods/${filename}`,
          imageMedium: `/uploads/foods/${filenameMedium}`,
          imageThumb: `/uploads/foods/${filenameThumb}`
        });
      } catch (error) {
        console.error("Upload Error:", error);
        res.status(500).json({ success: false, message: "Failed to process image", code: "UPLOAD_ERROR" });
      }
    });
    upload_default2 = router12;
  }
});

// src/models/Feedback.ts
var Feedback;
var init_Feedback = __esm({
  "src/models/Feedback.ts"() {
    "use strict";
    init_firestoreModel();
    Feedback = createFirestoreModel("feedback");
  }
});

// src/routes/feedback.ts
import { Router as Router13 } from "express";
var router13, feedback_default;
var init_feedback = __esm({
  "src/routes/feedback.ts"() {
    "use strict";
    init_auth();
    init_Feedback();
    init_Order();
    init_validation();
    init_logger();
    router13 = Router13();
    router13.post("/", protect, validateBody(feedbackSchema), async (req, res) => {
      try {
        const { orderId, rating, deliveryRating, comment } = req.body;
        const userId = req.user?._id?.toString();
        const order = await Order.findById(orderId);
        if (!order) {
          res.status(404).json({ success: false, message: "Order not found", code: "ORDER_NOT_FOUND" });
          return;
        }
        if (req.user?.role !== "admin" && order.userId !== userId) {
          logger.security("FEEDBACK_UNAUTHORIZED_SUBMISSION", "User attempted to submit feedback for another user's order", {
            userId,
            orderUserId: order.userId,
            orderId
          });
          res.status(403).json({ success: false, message: "You can only submit feedback for your own orders", code: "FORBIDDEN" });
          return;
        }
        const existing = await Feedback.findOne({ orderId });
        if (existing) {
          res.status(409).json({ success: false, message: "Feedback already submitted for this order", code: "FEEDBACK_EXISTS" });
          return;
        }
        const feedback = await Feedback.create({
          orderId,
          userId: req.user?._id,
          rating,
          deliveryRating,
          comment: comment || ""
        });
        res.status(201).json({ success: true, feedback });
      } catch (error) {
        logger.error("FEEDBACK_CREATION_ERROR", "Feedback creation error", { error });
        res.status(500).json({ success: false, message: "Failed to submit feedback", code: "FEEDBACK_ERROR" });
      }
    });
    router13.get("/:orderId", protect, async (req, res) => {
      try {
        const { orderId } = req.params;
        const userId = req.user?._id?.toString();
        const order = await Order.findById(orderId);
        if (!order) {
          res.status(404).json({ success: false, message: "Order not found", code: "ORDER_NOT_FOUND" });
          return;
        }
        if (req.user?.role === "customer" && order.userId !== userId) {
          res.status(403).json({ success: false, message: "Not authorized to view feedback for this order", code: "FORBIDDEN" });
          return;
        }
        const feedback = await Feedback.findOne({ orderId });
        if (!feedback) {
          res.status(404).json({ success: false, message: "No feedback found for this order", code: "FEEDBACK_NOT_FOUND" });
          return;
        }
        res.json({ success: true, feedback });
      } catch (error) {
        logger.error("FEEDBACK_FETCH_ERROR", "Failed to fetch feedback", { error });
        res.status(500).json({ success: false, message: "Failed to fetch feedback", code: "FEEDBACK_FETCH_ERROR" });
      }
    });
    feedback_default = router13;
  }
});

// src/models/Favorite.ts
var Favorite;
var init_Favorite = __esm({
  "src/models/Favorite.ts"() {
    "use strict";
    init_firestoreModel();
    Favorite = createFirestoreModel("favorites");
  }
});

// src/routes/favorites.ts
import { Router as Router14 } from "express";
var router14, favorites_default;
var init_favorites = __esm({
  "src/routes/favorites.ts"() {
    "use strict";
    init_firestoreModel();
    init_Favorite();
    init_Food();
    init_auth();
    router14 = Router14();
    router14.get("/", protect, async (req, res) => {
      try {
        const userId = req.user?._id?.toString();
        if (!userId) {
          res.status(401).json({ success: false, message: "Not authorized", code: "UNAUTHORIZED" });
          return;
        }
        const favorites = await Favorite.find({ userId }).sort({ createdAt: -1 });
        const foodIds = favorites.map((f) => f.foodId);
        const foods = await Food.find({ _id: { $in: foodIds } }).lean();
        const foodMap = new Map(foods.map((f) => [f._id.toString(), f]));
        const result = favorites.map((fav) => {
          const food = foodMap.get(fav.foodId);
          if (!food) return null;
          return {
            _id: fav._id,
            foodId: fav.foodId,
            food,
            createdAt: fav.createdAt
          };
        }).filter(Boolean);
        res.json({ success: true, count: result.length, favorites: result });
      } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch favorites", code: "FAVORITES_FETCH_ERROR" });
      }
    });
    router14.post("/", protect, async (req, res) => {
      try {
        const userId = req.user?._id?.toString();
        const { foodId } = req.body;
        if (!userId) {
          res.status(401).json({ success: false, message: "Not authorized", code: "UNAUTHORIZED" });
          return;
        }
        if (!foodId || !ObjectIdMock.isValid(foodId)) {
          res.status(400).json({ success: false, message: "Valid food ID is required", code: "INVALID_FOOD_ID" });
          return;
        }
        const food = await Food.findById(foodId);
        if (!food) {
          res.status(404).json({ success: false, message: "Food item not found", code: "FOOD_NOT_FOUND" });
          return;
        }
        const existing = await Favorite.findOne({ userId, foodId });
        if (existing) {
          res.status(409).json({ success: false, message: "Food is already in favorites", code: "ALREADY_FAVORITED" });
          return;
        }
        const favorite = await Favorite.create({ userId, foodId });
        res.status(201).json({ success: true, message: "Added to favorites", favorite });
      } catch (error) {
        res.status(500).json({ success: false, message: "Failed to add favorite", code: "FAVORITE_ADD_ERROR" });
      }
    });
    router14.delete("/:foodId", protect, async (req, res) => {
      try {
        const userId = req.user?._id?.toString();
        const { foodId } = req.params;
        if (!userId) {
          res.status(401).json({ success: false, message: "Not authorized", code: "UNAUTHORIZED" });
          return;
        }
        const result = await Favorite.findOneAndDelete({ userId, foodId });
        if (!result) {
          res.status(404).json({ success: false, message: "Favorite not found", code: "FAVORITE_NOT_FOUND" });
          return;
        }
        res.json({ success: true, message: "Removed from favorites" });
      } catch (error) {
        res.status(500).json({ success: false, message: "Failed to remove favorite", code: "FAVORITE_REMOVE_ERROR" });
      }
    });
    router14.get("/check/:foodId", protect, async (req, res) => {
      try {
        const userId = req.user?._id?.toString();
        const { foodId } = req.params;
        if (!userId) {
          res.status(401).json({ success: false, message: "Not authorized", code: "UNAUTHORIZED" });
          return;
        }
        const favorite = await Favorite.findOne({ userId, foodId });
        res.json({ success: true, isFavorited: !!favorite });
      } catch (error) {
        res.status(500).json({ success: false, message: "Failed to check favorite status", code: "FAVORITE_CHECK_ERROR" });
      }
    });
    favorites_default = router14;
  }
});

// src/middlewares/security.ts
import helmet from "helmet";
import rateLimit2 from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
var globalLimiter, authLimiter, setupSecurityMiddlewares;
var init_security = __esm({
  "src/middlewares/security.ts"() {
    "use strict";
    globalLimiter = rateLimit2({
      windowMs: 15 * 60 * 1e3,
      // 15 minutes
      max: 1e3,
      // Limit each IP to 1000 requests per windowMs
      message: { error: "Too many requests from this IP, please try again after 15 minutes." },
      standardHeaders: true,
      legacyHeaders: false
    });
    authLimiter = rateLimit2({
      windowMs: 60 * 60 * 1e3,
      // 1 hour
      max: 20,
      // Limit each IP to 20 auth requests per hour
      message: { error: "Too many authentication attempts, please try again later." },
      standardHeaders: true,
      legacyHeaders: false
    });
    setupSecurityMiddlewares = (app2) => {
      app2.use(helmet());
      app2.use(mongoSanitize());
      app2.use("/api/", globalLimiter);
      app2.use("/api/users/login", authLimiter);
      app2.use("/api/users/register", authLimiter);
    };
  }
});

// src/server.ts
var server_exports = {};
__export(server_exports, {
  app: () => app,
  default: () => server_default,
  httpServer: () => httpServer,
  io: () => io
});
import express4 from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import jwt3 from "jsonwebtoken";
import path4 from "path";
import { fileURLToPath as fileURLToPath4 } from "url";
var __filename4, __dirname4, app, PORT2, allowedOrigins, isAllowedOrigin, mountRoute, httpServer, io, server_default;
var init_server = __esm({
  "src/server.ts"() {
    init_queueService();
    init_firebase();
    init_firestoreModel();
    init_envConfig();
    init_logger();
    init_users();
    init_foods();
    init_orders();
    init_ai();
    init_search();
    init_restaurants();
    init_coupons();
    init_deliveries();
    init_analytics();
    init_payments();
    init_webhooks();
    init_upload2();
    init_feedback();
    init_favorites();
    init_security();
    __filename4 = fileURLToPath4(import.meta.url);
    __dirname4 = path4.dirname(__filename4);
    app = express4();
    PORT2 = env.PORT;
    setupSecurityMiddlewares(app);
    allowedOrigins = [
      env.CLIENT_URL,
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://10.0.2.2:5000",
      // Android emulator
      "http://10.0.2.2:3000"
      // Android emulator (frontend)
    ].filter(Boolean);
    isAllowedOrigin = (origin) => {
      if (!origin) return true;
      if (allowedOrigins.includes(origin)) return true;
      if (origin.endsWith(".vercel.app")) return true;
      if (process.env.VERCEL_URL && origin.includes(process.env.VERCEL_URL)) return true;
      return false;
    };
    app.use(cors({
      origin: (origin, callback) => {
        if (!origin || isAllowedOrigin(origin) || Boolean(process.env.VERCEL) || env.NODE_ENV !== "production") {
          callback(null, true);
        } else {
          callback(null, true);
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Idempotency-Key", "stripe-signature"]
    }));
    app.use(["/api/webhooks", "/webhooks"], express4.raw({ type: "application/json" }), webhooks_default);
    app.use(["/api/payments/webhook", "/payments/webhook"], express4.raw({ type: "application/json" }), webhooks_default);
    app.use(express4.json({ limit: "10mb" }));
    app.use(express4.urlencoded({ extended: true, limit: "10mb" }));
    try {
      initFirebase();
    } catch (err) {
      console.error("\u26A0\uFE0F Firebase init warning during startup:", err.message || err);
    }
    mountRoute = (routePath, router15) => {
      app.use(`/api${routePath}`, router15);
      app.use(routePath, router15);
    };
    mountRoute("/users", users_default);
    mountRoute("/foods", foods_default);
    mountRoute("/orders", orders_default);
    mountRoute("/ai", ai_default);
    mountRoute("/search", search_default);
    mountRoute("/restaurants", restaurants_default);
    mountRoute("/coupons", coupons_default);
    mountRoute("/admin/coupons", coupons_default);
    mountRoute("/deliveries", deliveries_default);
    mountRoute("/analytics", analytics_default);
    mountRoute("/payments", payments_default);
    mountRoute("/upload", upload_default2);
    mountRoute("/feedback", feedback_default);
    mountRoute("/favorites", favorites_default);
    app.use("/uploads", express4.static(path4.join(__dirname4, "../../uploads")));
    app.get("/", (_req, res) => {
      res.send("Foods66 Enterprise API is running! Please access the frontend web application on port 3000.");
    });
    app.get(["/api/health", "/health"], async (_req, res) => {
      let firestoreStatus = "disconnected";
      let firestoreStats = null;
      try {
        const db = getFirestore();
        const countPromise = Promise.all([
          db.collection("foods").count().get(),
          db.collection("users").count().get(),
          db.collection("orders").count().get()
        ]);
        const timeoutPromise = new Promise(
          (_, reject) => setTimeout(() => reject(new Error("Firestore stats query timed out")), 4e3)
        );
        const [fCountSnap, uCountSnap, oCountSnap] = await Promise.race([countPromise, timeoutPromise]);
        firestoreStatus = "connected";
        firestoreStats = {
          foods: fCountSnap.data().count,
          users: uCountSnap.data().count,
          orders: oCountSnap.data().count
        };
      } catch (err) {
        firestoreStatus = "error: " + (err.message || "unknown");
      }
      res.status(200).json({
        success: true,
        status: "OK",
        message: "Foods66 Backend is running with Live Firebase Firestore",
        databases: {
          firebaseFirestore: firestoreStatus,
          firestoreStats
        },
        projectId: "foods66-3e9a5",
        timestamp: /* @__PURE__ */ new Date()
      });
    });
    app.use((err, req, res, _next) => {
      logger.error("UNHANDLED_EXCEPTION", err.message || "Unhandled Application Error", {
        error: err,
        path: req.originalUrl,
        method: req.method,
        ip: req.ip
      });
      const status = err.status || err.statusCode || 500;
      const isProd = env.isProduction;
      const message = isProd && status === 500 ? "Internal Server Error" : err.message || "Internal Server Error";
      const code = err.code || "INTERNAL_SERVER_ERROR";
      res.status(status).json({
        success: false,
        message,
        code
      });
    });
    httpServer = createServer(app);
    io = new Server(httpServer, {
      cors: {
        origin: (origin, callback) => {
          if (isAllowedOrigin(origin)) {
            callback(null, true);
          } else {
            callback(new Error(`CORS origin not allowed: ${origin}`));
          }
        },
        methods: ["GET", "POST"],
        credentials: true
      }
    });
    io.use((socket, next) => {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(" ")[1];
      if (token) {
        try {
          const decoded = jwt3.verify(token, env.JWT_SECRET);
          socket.userId = decoded.id;
        } catch (err) {
          socket.userId = null;
        }
      }
      next();
    });
    io.on("connection", (socket) => {
      const authUserId = socket.userId;
      socket.on("join", (userId) => {
        if (userId) {
          if (authUserId && authUserId !== userId) {
            logger.security("SOCKET_UNAUTHORIZED_ROOM_JOIN", "User tried to join unauthorized room", {
              authUserId,
              targetUserId: userId
            });
            return;
          }
          socket.join(userId);
          console.log(`\u{1F50C} User ${userId} connected to notification channel`);
        }
      });
      socket.on("join_tracking", async (orderId) => {
        if (orderId) {
          try {
            if (authUserId) {
              const { Order: Order2 } = await Promise.resolve().then(() => (init_Order(), Order_exports));
              const { User: User2 } = await Promise.resolve().then(() => (init_User(), User_exports));
              let order = null;
              if (ObjectIdMock.isValid(orderId)) {
                order = await Order2.findById(orderId);
              } else if (orderId.startsWith("cs_") || orderId.startsWith("mock_sess_")) {
                order = await Order2.findOne({ sessionId: orderId });
              }
              if (order) {
                const user = await User2.findById(authUserId);
                const isOwner = order.userId === authUserId;
                const isDriver = user?.role === "driver" && (!order.deliveryPartnerId || order.deliveryPartnerId === authUserId);
                const isAdmin = user?.role === "admin" || user?.role === "restaurant";
                if (!isOwner && !isDriver && !isAdmin) {
                  logger.security("SOCKET_UNAUTHORIZED_TRACKING_JOIN", "User tried to join unauthorized order tracking room", {
                    authUserId,
                    orderId,
                    orderOwner: order.userId
                  });
                  return;
                }
              }
            }
            socket.join(`tracking_${orderId}`);
            console.log(`\u{1F4CD} Socket joined live tracking room: tracking_${orderId}`);
          } catch (err) {
            socket.join(`tracking_${orderId}`);
          }
        }
      });
      socket.on("leave_tracking", (orderId) => {
        if (orderId) {
          socket.leave(`tracking_${orderId}`);
          console.log(`\u{1F4CD} Socket left live tracking room: tracking_${orderId}`);
        }
      });
      socket.on("driver:location:update", async (data) => {
        if (!authUserId || !data.orderId || typeof data.latitude !== "number" || typeof data.longitude !== "number") return;
        if (data.latitude < -90 || data.latitude > 90 || data.longitude < -180 || data.longitude > 180) return;
        try {
          const { Delivery: Delivery2 } = await Promise.resolve().then(() => (init_Delivery(), Delivery_exports));
          const { User: User2 } = await Promise.resolve().then(() => (init_User(), User_exports));
          const user = await User2.findById(authUserId);
          if (user?.role !== "driver") return;
          const delivery = await Delivery2.findOne({ orderId: data.orderId, deliveryPartnerId: authUserId });
          if (!delivery || delivery.status !== "OUT_FOR_DELIVERY") return;
          const coordinates = [data.longitude, data.latitude];
          delivery.currentLocation = {
            type: "Point",
            coordinates
          };
          await delivery.save();
          await User2.findByIdAndUpdate(authUserId, { currentLocation: delivery.currentLocation });
          io.to(`tracking_${data.orderId}`).emit("delivery:location", {
            orderId: data.orderId,
            latitude: data.latitude,
            longitude: data.longitude,
            heading: data.heading,
            speed: data.speed,
            timestamp: data.timestamp || Date.now()
          });
        } catch (error) {
          logger.error("SOCKET_LOCATION_UPDATE_ERROR", "Error updating driver location", { error, orderId: data.orderId });
        }
      });
      socket.on("disconnect", () => {
      });
    });
    if (!process.env.VERCEL && env.NODE_ENV !== "test") {
      const listenPort = process.env.PORT || PORT2 || 5e3;
      httpServer.listen(listenPort, () => {
        console.log(`\u{1F680} Foods66 Server running on port ${listenPort}`);
      });
    }
    server_default = app;
  }
});
init_server();
export {
  app,
  server_default as default,
  httpServer,
  io
};
