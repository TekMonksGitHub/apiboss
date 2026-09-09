/**
 * (C) 2025 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 *
 * Publishes an API route guarded by the AI Wall.
 *
 * Three things happen here and nothing else: check the required fields, assign
 * the ones the caller left blank, store the result. Storing writes the conf file
 * and cluster memory together - the enforcers read cluster memory, the file is
 * what survives a restart.
 *
 * Request:  path, backendurl and method. rules, rateLimit, x_api_key, headers
 *           and basicAuth are optional - see assignfields.js.
 * Response: result, x-api-key, and the registry entry the route was published with.
 */

const fs = require("fs").promises;
const cryptmod = require(`${CONSTANTS.LIBDIR}/crypt.js`);
const APIREGISTRY = require(`${CONSTANTS.LIBDIR}/apiregistry.js`);
const PUBLISHCONF = require(`${APPCONSTANTS.CONF_DIR}/publish.json`);
// required directly, not re-read per publish - a write to the same object is visible wherever
// else in the process requires this file, e.g. plugins/aiwall.js requires aiwallrules.json
const RATELIMITS = require(`${APPCONSTANTS.CONF_DIR}/ratelimits.json`);
const HTTPBASICAUTHS = require(`${APPCONSTANTS.CONF_DIR}/httpbasicauths.json`);
const AIWALLRULES = require(`${APPCONSTANTS.CONF_DIR}/aiwallrules.json`);
const assignfields = require(`${APPCONSTANTS.LIB_DIR}/publish/assignfields.js`);

const RATELIMITS_FILE = "ratelimits.json", HTTPBASICAUTHS_FILE = "httpbasicauths.json",
    AIWALLRULES_FILE = "aiwallrules.json";
const DUMMY_HOST = "http://dummyhost";  // APIREGISTRY parses a full URL to find the path

exports.doService = async req => {
    const jsonReq = req?.data;
    if (!validateRequest(jsonReq)) {
        LOG.error(`Bad API publish request ${jsonReq?JSON.stringify(jsonReq):"null"}.`);
        return {data:CONSTANTS.FALSE_RESULT};
    }

    try {
        const api = assignfields.assign(jsonReq, _registeredKey(jsonReq.path)), keys = PUBLISHCONF.clusterMemoryKeys;

        await _storeAPI(api, keys);

        // registered last, so the route only goes live once everything it needs is already stored
        await APIREGISTRY.addAPI(api.path, api.apiregentry, APPCONSTANTS.APP_NAME);
        LOG.info(`New API published ${api.path}:${api.apiregentry}`);

        return {data: {...CONSTANTS.TRUE_RESULT, "x-api-key": api.apiKey, "api-regentry": api.apiregentry}};
    } catch (err) {
        LOG.error(`API publish failed for ${jsonReq.path}, the error is: ${err.message||err}`);
        return {data:CONSTANTS.FALSE_RESULT};
    }
};

/** Stores everything a published API needs in one call: rate limit, basic auth (if any) and rules. */
async function _storeAPI(api, keys) {
    await _store(RATELIMITS, RATELIMITS_FILE, api.apiKey, api.rateLimit, keys.rateLimits);
    if (api.basicAuth) await _store(HTTPBASICAUTHS, HTTPBASICAUTHS_FILE, api.apiKey, `${cryptmod.encrypt(
        Buffer.from(`${api.basicAuth.userid}:${api.basicAuth.password}`).toString("base64"))}`, keys.httpBasicAuths);
    await _store(AIWALLRULES, AIWALLRULES_FILE, api.path, {rule: api.rules}, keys.aiwallRules);
}

/** Writes one key into the given (already required) conf object, and into cluster memory.
 *  The enforcers read cluster memory, so a file only write would not be seen until the next restart. */
async function _store(conf, fileName, key, value, clusterKey) {
    conf[key] = value; await fs.writeFile(`${APPCONSTANTS.CONF_DIR}/${fileName}`, JSON.stringify(conf, null, 4), "utf8");
    const shared = CLUSTER_MEMORY.get(clusterKey, {}) || {}; shared[key] = value;
    CLUSTER_MEMORY.set(clusterKey, shared);
    LOG.info(`Stored ${key} in ${fileName} and in cluster memory key ${clusterKey}.`);
}

/** The key already registered against a path, so republishing reuses it instead of rotating it. */
function _registeredKey(path) {
    try {return APIREGISTRY.getAPIConf(`${DUMMY_HOST}${path.trim()}`)?.keys || null;}
    catch (err) {LOG.warn(`Could not read the existing key for ${path}, the error is: ${err.message}`); return null;}
}

/* Only the required fields are checked. A missing optional is not a failure, it is assigned.
   Note the registry entry is never accepted from the caller - it names our plugin, our keys
   and our flags, so it is always generated. The caller supplies only its own endpoint. */
const validateRequest = jsonReq => {
    if (!jsonReq || typeof jsonReq != "object") {LOG.error(`API publish request is not an object.`); return false;}
    if (typeof jsonReq.path != "string" || jsonReq.path.trim() == "") {LOG.error(`API publish request has no path.`); return false;}
    if (!jsonReq.path.trim().startsWith("/")) {LOG.error(`API publish path ${jsonReq.path} does not start with /.`); return false;}
    if (typeof jsonReq.backendurl != "string" || jsonReq.backendurl.trim() == "") {LOG.error(`API publish request has no backendurl.`); return false;}
    try {new URL(jsonReq.backendurl);} catch (err) {LOG.error(`API publish backendurl ${jsonReq.backendurl} is not a valid URL.`); return false;}
    if (jsonReq.method && !PUBLISHCONF.allowedMethods.includes(String(jsonReq.method).trim().toUpperCase())) {
        LOG.error(`API publish method ${jsonReq.method} is not one of ${PUBLISHCONF.allowedMethods.join(", ")}.`); return false;}
    return true;
};
