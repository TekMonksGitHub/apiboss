/**
 * (C) 2020 TekMonks. All rights reserved.
 *
 * Delete existing API
 */

 exports.doService = async req => {
    const jsonReq = req.data;
	if (!validateRequest(jsonReq)) {LOG.error(`Bad API list request ${jsonReq?JSON.stringify(jsonReq):"null"}.`); return {data:CONSTANTS.FALSE_RESULT};}
    else {const result = {data:{apis: APIREGISTRY.listAPIs(jsonReq.path), result:true}}; LOG.info(`List APIs sending back API list ${result.apis}`); return result;}
}

const validateRequest = jsonReq => jsonReq?true:false;