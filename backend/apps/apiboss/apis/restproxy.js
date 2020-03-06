/* 
 * (C) 2020 TekMonks. All rights reserved.
 * License: MIT - see enclosed LICENSE file.
 * 
 * Proxy for JSON/REST APIs 
 */
const urlMod = require('url');
const restClient = require(`${CONSTANTS.LIBDIR}/rest.js`);

exports.doService = doService;

async function doService(req) {
    const method = req.method.toLowerCase(); const url = urlMod.parse(req.url); const host = url.hostname; 
    const port = url.port; const path = url.pathname; if (!path.startsWith("/")) path = `/${path}`;
    const headers = {...req.headers}; const data = req.data;

    if (url.protocol.toLowerCase() == "https:") method += "Https";           
    if (method == "delete") method = "deleteHttp";        // delete is a reserved word in JS

    return await rest(method, host, port, path, headers, data);
}

function rest(method, host, port, path, headers, data) {
    return new Promise((resolve, reject) => restClient[method](host, port, path, headers, data, (error, dataOut, status, headersBack) => {
        const statusOK = Math.trunc(status/200) == 1 && status %200 < 100;
        if (error || !statusOK) reject({status, message:error||`Bad status: ${status}`}); else resolve({data: dataOut, headers: headersBack}); 
    }));
}