/**
 * (C) 2025 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 *
 * Assigns the fields a publish request left blank, from conf/publish.json.
 *
 * Path, backend URL and method are required and already checked by the caller.
 * Everything else - rules, rate limit, API key, headers, basic auth - is optional,
 * and so is the registry entry, which is always built here because it names our
 * plugin and our flags and is never a caller supplied value.
 */

const utils = require(`${CONSTANTS.LIBDIR}/utils.js`);   // generateUUID and isObject
const PUBLISHCONF = require(`${APPCONSTANTS.CONF_DIR}/publish.json`);

// Callers send rate limits in a shorter spelling than ratelimits.json stores.
const RATELIMIT_ALIASES = {persec: "callsPerSecond", permin: "callsPerMinute", perhour: "callsPerHour",
    perday: "callsPerDay", permonth: "callsPerMonth", peryear: "callsPerYear"};
// Headers can arrive as <name>value</name> text. "-" is in the name class so x-api-key matches.
const HEADER_TAG = /<([\w-]+)>([\s\S]*?)<\/\1>/g;
// Not in publish.json - unlike rate limits, the default method is fixed, not something to reconfigure.
const DEFAULT_METHOD = "POST";

/**
 * @param {Object} jsonReq     The validated request
 * @param {string} existingKey The key already registered for this path, or null
 * @return {Object} {path, backendurl, method, rules, apiKey, rateLimit, basicAuth, apiregentry}
 */
const assign = (jsonReq, existingKey) => {
    const defaults = PUBLISHCONF.defaults;

    const rateLimit = {...defaults.rateLimit};   // supplied tiers override the defaults, 0 stays 0
    for (const [field, value] of Object.entries(utils.isObject(jsonReq.rateLimit) ? jsonReq.rateLimit : {})) {
        const name = RATELIMIT_ALIASES[field] || field, parsed = parseInt(value);
        if (name in rateLimit && Number.isFinite(parsed)) rateLimit[name] = parsed;
    }

    let headers = {};   // a string spread into an object gives one entry per character, so text is parsed
    if (utils.isObject(jsonReq.headers)) headers = jsonReq.headers;
    else if (typeof jsonReq.headers == "string") {
        try {const parsed = JSON.parse(jsonReq.headers); if (utils.isObject(parsed)) headers = parsed;} catch (err) {}
        let tag; HEADER_TAG.lastIndex = 0;   // not JSON, so read it as tags instead
        if (!Object.keys(headers).length) while ((tag = HEADER_TAG.exec(jsonReq.headers)) !== null)
            headers[tag[1]] = tag[2].trim();
    }
    headers = {...headers, ...PUBLISHCONF.aiwallHeaders};   // last, so a caller cannot switch the wall off

    // credentials arrive at the top level, or riding inside rateLimit as the old flow expected
    const creds = utils.isObject(jsonReq.basicAuth) ? jsonReq.basicAuth :
        utils.isObject(jsonReq.rateLimit) ? jsonReq.rateLimit : null;

    const backendurl = jsonReq.backendurl.trim(), apiKey = existingKey || jsonReq.x_api_key?.trim() ||
        utils.generateUUID(true), method = (jsonReq.method || DEFAULT_METHOD).trim().toUpperCase();

    const assigned = {
        path: jsonReq.path.trim(), backendurl, method, apiKey, rateLimit,
        rules: (typeof jsonReq.rules == "string" && jsonReq.rules.trim()) || defaults.rules,
        basicAuth: creds && creds.userid && creds.password ? {userid: creds.userid, password: creds.password} : null,
        apiregentry: `${defaults.plugin}?keys=${encodeURIComponent(apiKey)}&url=${encodeURIComponent(backendurl)}` +
            `&method=${encodeURIComponent(method)}&headers=${encodeURIComponent(JSON.stringify(headers))}`
    };

    LOG.info(`Assigned fields for ${assigned.path}: ${JSON.stringify({...assigned, basicAuth: !!assigned.basicAuth})}`);
    return assigned;
};

module.exports = {assign};
