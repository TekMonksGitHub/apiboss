/**
 * (C) 2020 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 * 
 * Injects custom headers from APIBoss
 */

function injectResponseHeaders(apiregentry, url, response, requestHeaders, responseHeaders) {
    const headersToAdd = response?.headers;
    if (headersToAdd) for (const headerName of Object.keys(headersToAdd)) responseHeaders[headerName] = headersToAdd[headerName];
    if (response.data.result) APIREGISTRY.getExtension("jwttokenmanager").injectResponseHeadersInternal(apiregentry, url, response, requestHeaders, responseHeaders);
}

module.exports = {injectResponseHeaders};