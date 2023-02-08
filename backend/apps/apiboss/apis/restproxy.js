/** 
 * (C) 2020 TekMonks. All rights reserved.
 * 
 * Proxy for JSON/REST APIs for APIBoss
 */
const crypto = require("crypto");
const rest = require(`${CONSTANTS.LIBDIR}/rest.js`);
const apibosslog = require(`${APPCONSTANTS.LIB_DIR}/apibosslog.js`);

exports.doService = doService;

async function doService(req) {
    let method = req.method.toLowerCase(); const url = new URL(req.url); const host = url.hostname; 
    const port = url.port; const path = url.pathname+url.search; if (!path.startsWith("/")) path = `/${path}`;
    const headers = {...req.headers}; const reqObj = req.data;

    if (url.protocol.toLowerCase() == "https:") method += "Https";           
    if (method == "delete") method = "deleteHttp";        // delete is a reserved word in JS

    const timestamp = Date.now(), id = `${timestamp}${parseInt(crypto.randomBytes(4).toString("hex"),16)}`;
    apibosslog.recordRequest(id, timestamp, method, host, port, path, headers, reqObj, "rest"); // log request, async, don't wait
    const {error,data,status,resHeaders} = await rest[method](host, port, path, headers, reqObj);
    apibosslog.recordResponse(id, Date.now(), error, data, status, resHeaders, "rest"); // log response, async, don't wait

    if (error) throw("APIBoss REST Proxy Error", {status, message:error}); 
    else return({data,headers: resHeaders});
}
