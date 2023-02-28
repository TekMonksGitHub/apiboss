/* 
 * (C) 2018 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 * 
 * Enforces rate policies. This one also indirectly ensures API has
 * the right key, as we enforce SLA policies based on keys.
 */
const APPCONSTANTS = require(`${__dirname}/../constants.js`);
const utils = require(`${CONSTANTS.LIBDIR}/utils.js`);


const RATELIMIT_DISTM_KEY = "__org_monkshu_apiboss_ratelimits";
const API_CALLCOUNTS_DISTM_KEY = "__org_monkshu_apiboss_callcounts";
const CALL_MAP_TEMPLATE = {buckets:{
    decisecondsBucket: _createIntArray(10),
    secondsBucket: _createIntArray(60),
    minutesBucket: _createIntArray(60),
    hoursBucket: _createIntArray(24),
    dayBucket: _createIntArray(31),
    monthBucket: _createIntArray(12)
}};

let lastSecond, lastMinute, lastHour, lastDay, lastMonth;

function initSync(_apiregistry) {
    const conf = CLUSTER_MEMORY.get(RATELIMIT_DISTM_KEY) || require(`${APPCONSTANTS.CONF_DIR}/ratelimits.json`);
	LOG.info(`Read Policy, Rate Limits: ${JSON.stringify(conf)}`);
    if (!CLUSTER_MEMORY.get(RATELIMIT_DISTM_KEY)) CLUSTER_MEMORY.set(RATELIMIT_DISTM_KEY, conf);

    setInterval(_apiCountCleaner, 100);   // run our cleaner at 100ms intervals
}

function checkSecurity(apiregentry, url, req, headers, servObject, reason) {
    const apikeychecker = APIREGISTRY.getExtension("apikeychecker");
    if (!apikeychecker.checkSecurity(apiregentry, url, req, headers, servObject)) return false; // bad key

    const {decisecondsBucket, secondsBucket, minutesBucket, hoursBucket, dayBucket, monthBucket} = _getCurrentTimeBuckets();
    const keysExpected = apiregentry.query.keys ? (Array.isArray(apiregentry.query.keys) ? apiregentry.query.keys : [apiregentry.query.keys]) : [];
    if (!keysExpected.length) return true;   // an API without keys can't have a ratelimit

    const key = apikeychecker.getIncomingAPIKey(headers);

    const rateLimits = CLUSTER_MEMORY.get(RATELIMIT_DISTM_KEY)[key]; 
    if (!rateLimits) return true; // no SLA for this API Key

    const apiCallMap = _getAPICallMap(); if (!apiCallMap[key]) apiCallMap[key] = utils.clone(CALL_MAP_TEMPLATE);
    const buckets = apiCallMap[key].buckets;

    buckets.decisecondsBucket[decisecondsBucket] ++; buckets.secondsBucket[secondsBucket] ++;
    buckets.minutesBucket[minutesBucket] ++; buckets.hoursBucket[hoursBucket] ++;
    buckets.dayBucket[dayBucket] ++; buckets.monthBucket[monthBucket] ++;

    CLUSTER_MEMORY.set(API_CALLCOUNTS_DISTM_KEY, apiCallMap);   // update the call counts cluster wide

    if (rateLimits.callsPerSecond) if (_sumArray(buckets.decisecondsBucket) > rateLimits.callsPerSecond) 
        {reason.reason = `Rate limit: Calls per second exceeded for key: ${key}`; reason.code = 429; return false;}
    if (rateLimits.callsPerMinute) if (_sumArray(buckets.secondsBucket) > rateLimits.callsPerMinute)
        {reason.reason = `Rate limit: Calls per minute exceeded for key: ${key}`; reason.code = 429; return false;}
    if (rateLimits.callsPerHour) if (_sumArray(buckets.minutesBucket) > rateLimits.callsPerHour) 
        {reason.reason = `Rate limit: Calls per hour exceeded for key: ${key}`; reason.code = 429; return false;}
    if (rateLimits.callsPerDay) if (_sumArray(buckets.hoursBucket) > rateLimits.callsPerDay) 
        {reason.reason = `Rate limit: Calls per day exceeded for key: ${key}`; reason.code = 429; return false;}
    if (rateLimits.callsPerMonth) if (_sumArray(buckets.dayBucket) > rateLimits.callsPerMonth) 
        {reason.reason = `Rate limit: Calls per month exceeded for key: ${key}`; reason.code = 429; return false;}
    if (rateLimits.callsPerYear) if (_sumArray(buckets.monthBucket) > rateLimits.callsPerYear) 
        {reason.reason = `Rate limit: Calls per year exceeded for key: ${key}`; reason.code = 429; return false;}

    return true;
}

function _getAPICallMap() {
    const apiCallMap = CLUSTER_MEMORY.get(API_CALLCOUNTS_DISTM_KEY);
    if (!apiCallMap) CLUSTER_MEMORY.set(API_CALLCOUNTS_DISTM_KEY, {});
    return apiCallMap || {};
}

function _apiCountCleaner() {
    const {decisecondsBucket, secondsBucket, minutesBucket, hoursBucket, dayBucket, monthBucket} = _getCurrentTimeBuckets();

    const apiCallMap = _getAPICallMap();
    for (const apiKey of Object.keys(apiCallMap)) {
        const buckets = apiCallMap[apiKey].buckets;
        buckets.decisecondsBucket[decisecondsBucket] = 0;
        if (lastSecond != secondsBucket) {buckets.secondsBucket[secondsBucket] = 0; lastSecond = secondsBucket;};
        if (lastMinute != minutesBucket) {buckets.minutesBucket[minutesBucket] = 0; lastMinute = minutesBucket;};
        if (lastHour != hoursBucket) {buckets.hoursBucket[hoursBucket] = 0; lastHour = hoursBucket;};
        if (lastDay != dayBucket) {buckets.dayBucket[dayBucket] = 0; lastDay = dayBucket;};
        if (lastMonth != monthBucket) {buckets.monthBucket[monthBucket] = 0; lastMonth = monthBucket;};
    }
}

function _getCurrentTimeBuckets() {
    const time = new Date();
    const decisecondsBucket = ~~(time.getMilliseconds()/100);
    const secondsBucket = time.getSeconds();
    const minutesBucket = time.getMinutes();
    const hoursBucket = time.getHours();
    const dayBucket = time.getDate()-1;
    const monthBucket = time.getMonth();

    return {decisecondsBucket, secondsBucket, minutesBucket, hoursBucket, dayBucket, monthBucket}
}

function _createIntArray(size) {
    const array = [];
    for (let i = 0; i < size; i++) array[i] = 0;

    return array;
}

function _sumArray(array) {
    let sum = 0; 
    for (let i = 0; i < array.length; i++) sum += array[i];
    return sum;
}

module.exports = {initSync, checkSecurity};