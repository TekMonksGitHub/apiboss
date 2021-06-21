/* 
 * (C) 2018 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 * 
 * Enforces rate policies. This one also indirectly ensures API has
 * the right key, as we enforce SLA policies based on keys.
 */
const cryptmod = require(`${CONSTANTS.LIBDIR}/crypt.js`);
const APPCONSTANTS = require(`${__dirname}/../constants.js`);
const HTTPAUTH_DISTM_KEY = "__org_monkshu_apiboss_httpauths";

let conf;

function initSync(_apiregistry) {
    conf = CLUSTER_MEMORY.get(HTTPAUTH_DISTM_KEY) || require(`${APPCONSTANTS.CONF_DIR}/httpbasicauths.json`);
    if (!CLUSTER_MEMORY.get(HTTPAUTH_DISTM_KEY)) CLUSTER_MEMORY.set(HTTPAUTH_DISTM_KEY, conf);
}

function checkSecurity(apiregentry, url, req, headers, servObject, reason) {
    const apikeychecker = require(`${CONSTANTS.LIBDIR}/apiregistry_extensions/apikeychecker.js`);
    if (!apiregentry.query.needsBasicAuth) return true; // doesn't need authentication
    if (!apikeychecker.checkSecurity(apiregentry, url, req, headers, servObject)) return false; // bad key
    const key = apikeychecker.getIncomingAPIKey(headers); 
    if (!conf[key]) { // no auth configured for this key
        LOG.error(`No http basic auth found for key ${key} for url ${url}`); 
        reason.reason = `Basic auth missing key to auth mapping, URL ${url}.`; reason.code = 403;
        return false;
    } 

    const authExpected = cryptmod.decrypt(conf[key]), incomingToken = headers["authorization"];
    const token_splits = incomingToken?incomingToken.split(/[ \t]+/):[];
    if (token_splits.length == 2 && token_splits[0].trim().toLowerCase() == "basic") {
        if (token_splits[1] == authExpected) return true;
        else {reason.reason = `Basic auth incorrect password, URL ${url}, got token ${incomingToken}`; reason.code = 403; return false;}
    }
    else {reason.reason = `Basic auth header malformatted. Got token ${incomingToken}`; reason.code = 403; return false;}	// missing or badly formatted token
}

module.exports = {initSync, checkSecurity};