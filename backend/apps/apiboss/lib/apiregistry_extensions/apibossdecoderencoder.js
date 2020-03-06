/* 
 * (C) 2020 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 * 
 * Data decoder / encoder for APIBoss
 */

const utils = require(CONSTANTS.LIBDIR+"/utils.js");

function decodeIncomingData(apiregentry, _url, data, headers, servObject) {
    let headersDecoded = {...headers}; 
    const registryHeaders = apiregentry.query.headers?JSON.parse(apiregentry.query.headers):{};
    registryHeaders["Accept-Encoding"] = "gzip, identity";
    for (const keyThis of Object.keys(registryHeaders)) {
        if (utils.getObjectKeyValueCaseInsensitive(headersDecoded, keyThis)) 
            headersDecoded[utils.getObjectKeyNameCaseInsensitive(headersDecoded, keyThis)] = registryHeaders[keyThis];
        else headersDecoded[keyThis] = registryHeaders[keyThis];
    }

    return {url: apiregentry.query.url, method: apiregentry.query.method||servObject.req.method||"POST", data, headers: headersDecoded} 
};

const encodeResponse = (_apiregentry, _url, respObj, _reqHeaders, _respHeaders) => respObj.data;

module.exports = {decodeIncomingData, encodeResponse}