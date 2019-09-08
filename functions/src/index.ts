import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as rp from 'request-promise';

admin.initializeApp();

// Call invocation url with key query parameter which contains coinmarketkap api key
export const refreshCurrencies = functions.https.onRequest((request, response) => {

    const apiKey = request.query.key;
    
    const options = {
        uri: 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/map',
        headers: {
            'X-CMC_PRO_API_KEY': apiKey
        },
        json: true
    };

    rp(options)
        .then((parsed) => {
            response.send("Request completed, status: " + parsed.status.error_code);
        })
        .catch((err) => {
            response.send("Error occurred: " + err.statusCode);
        })
});
