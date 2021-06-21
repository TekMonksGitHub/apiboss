/** 
 * apibosslog.js - APIBoss request/response logger.
 * 
 * (C) 2020 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */

const db = require(`${APPCONSTANTS.LIB_DIR}/db.js`);

async function recordRequest(id, timestamp, method, host, port, path, headers, reqObj, type) {
    const url = `${method.endsWith("Https")?"https://":"http://"}${host}:${port}/${path}`;
    const result = await db.runCmd("INSERT INTO requests (id,timestamp,type,url,headers,request) VALUES (?,?,?,?,?,?)", 
		  [id, timestamp, type, url, JSON.stringify(headers), JSON.stringify(reqObj)]);
    if (!result) LOG.error(`Error recording APIBoss request into the DB, ${JSON.stringify({id,timestamp,url,headers,reqObj})}`);
    LOG.debug(`APIBoss REST proxy requesting -> ${JSON.stringify({id,timestamp,url,headers,reqObj})}`);
    return result;
}

async function recordResponse(id, timestamp, error, data, status, resHeaders, type) {
    const result = await db.runCmd("INSERT INTO responses (id,timestamp,type,error,status,responseheaders,response) VALUES (?,?,?,?,?,?,?)", 
		  [id, timestamp, type, error||"", status, JSON.stringify(resHeaders), JSON.stringify(data)]);
    if (!result) LOG.error(`Error recording APIBoss response into the DB, ${JSON.stringify({id,timestamp,error,data,status,resHeaders})}`);
    LOG.debug(`APIBoss REST proxy responding -> ${JSON.stringify({id,timestamp,error,data,status,resHeaders})}`);
    return result;
}

module.exports = {recordRequest, recordResponse}