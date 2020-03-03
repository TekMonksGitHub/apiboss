/* 
 * (C) 2020 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 * 
 * Injects custom headers from APIBoss
 */

function injectResponseHeaders(_apiregentry, _url, response, _requestHeaders, responseHeaders) {
    const headersToAdd = response.headers;
    if (headersToAdd) for (const headerName of Object.keys(headersToAdd)) responseHeaders[headerName] = headersToAdd[headerName];
}

module.exports = {injectResponseHeaders};