/**
 * (C) 2020 TekMonks. All rights reserved.
 *
 * Simple echo API for APIBoss
 */

const mustache = require("mustache");
const respTemplate = `
<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" 
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">

<soap:Header>
    {{#headers}}
    <{{{header}}}>{{{value}}}</{{{header}}}>
    {{/headers}}
</soap:Header>

<soap:Body>
    {{{soapBody}}}
</soap:Body>
</soap:Envelope>`;

exports.doService = async jsonReq => {
	if (!validateRequest(jsonReq.data)) {LOG.error(`Bad Web Services request ${jsonReq.data}.`); return {data:CONSTANTS.FALSE_RESULT};}

    const data = {headers:[], soapBody:""}; for (const header in jsonReq.servObject.req.headers) data.headers.push({header,value:jsonReq.servObject.req.headers[header]});
    const bodyRE = jsonReq.data.match(/<soap.Body.*?>(.*)<\/soap.Body.*?>/s);
    if (!bodyRE) {LOG.error(`Bad Web Services request ${jsonReq.data}.`); return {data:CONSTANTS.FALSE_RESULT};}
    else data.soapBody = bodyRE[1];
    const resp = mustache.render(respTemplate, data);

	return {data: resp, headers: {"Server": "APIBoss"}};
}

const validateRequest = data => data && data.indexOf("<soap:Body") != -1 && data.indexOf("</soap:Body") != -1  && 
    data.indexOf("<?xml") != -1;