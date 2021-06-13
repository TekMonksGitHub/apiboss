/* 
 * (C) 2020 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 * 
 * Data decoder / encoder for APIBoss
 */

const PASSTHRU_KEY = "x-apiboss-passthru-headers";

function decodeIncomingData(apiregentry, _url, data, headers, servObject) {
    let headersDecoded = {"accept-encoding": "gzip, identity"};

    const registryHeaders = apiregentry.query.headers?JSON.parse(apiregentry.query.headers):{};
    const passThruHeaders = registryHeaders[PASSTHRU_KEY] ? (Array.isArray(registryHeaders[PASSTHRU_KEY]) ? registryHeaders[PASSTHRU_KEY] : [registryHeaders[PASSTHRU_KEY]]) : [];
    for (const passThruHeader of passThruHeaders) if (headers[passThruHeader]) headersDecoded[passThruHeader] = headers[passThruHeader];
    delete registryHeaders[PASSTHRU_KEY];
    
    headersDecoded = {...headersDecoded, ...registryHeaders}; 

    return {url: apiregentry.query.url, method: apiregentry.query.method||servObject.req.method||"POST", data, headers: headersDecoded, servObject} 
}

const encodeResponse = (_apiregentry, _url, respObj, _reqHeaders, _respHeaders) => respObj?.data||null;

module.exports = {decodeIncomingData, encodeResponse}