/* 
 * (C) 2020 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 * 
 * Data decoder / encoder for APIBoss
 */

function decodeIncomingData(_apiregentry, _url, data, headers, _servObject) {
    const dataDecoded = headers["content-type"]?.toLowerCase()=="text/xml"?data.toString("utf8"):data;
    return dataDecoded;
}

module.exports = {decodeIncomingData}