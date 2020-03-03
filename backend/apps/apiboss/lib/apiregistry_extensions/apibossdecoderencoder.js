/* 
 * (C) 2020 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 * 
 * Data decoder for APIBoss
 */
function decodeIncomingData(_apiregentry, _url, data, headers) {
    const retData = {data, headers};
    return retData;
}

function encodeResponse(_apiregentry, _url, respObj, _reqHeaders, _respHeaders) {
    return respObj.data;
}

module.exports = {decodeIncomingData, encodeResponse}