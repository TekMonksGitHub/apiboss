/** 
 * (C) 2020 TekMonks. All rights reserved.
 * 
 * Proxy for JSON/REST APIs for APIBoss
 */
const rest = require(`${CONSTANTS.LIBDIR}/rest.js`);

exports.doService = doService;

async function doService(req) {
    const method = req.method.toLowerCase(); const url = new URL(req.url); const host = url.hostname; 
    const port = url.port; const path = url.pathname+url.search; if (!path.startsWith("/")) path = `/${path}`;
    const headers = {...req.headers}; const reqObj = req.data;

    if (url.protocol.toLowerCase() == "https:") method += "Https";           
    if (method == "delete") method = "deleteHttp";        // delete is a reserved word in JS

    const {error,data,status,resHeaders} = await rest[method](host, port, path, headers, reqObj);
    if (error) throw("APIBoss Proxy Error", {status, message:error}); 
    else return({data,headers: resHeaders});
}
