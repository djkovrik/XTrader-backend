import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as rp from 'request-promise';

admin.initializeApp();

const FS_COLLECTION_NAME_SERVICE = 'service_info';
const FS_DOC_NAME_LAST_UPDATED = 'last_updated';
const FS_DOC_NAME_ERROR_MESSAGE = 'error_message';


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
            void saveTimestamp(parsed)
            void saveErrorMessage(parsed);
            
            response.send("Request completed, status: " + parsed.status.error_code);
        })
        .catch((err) => {
            response.send("Error occurred: " + err.statusCode);
        })
});

async function saveTimestamp(parsed: any) {
    const timestamp = parsed.status.timestamp;
    const tp = await admin.firestore()
        .collection(FS_COLLECTION_NAME_SERVICE)
        .doc(FS_DOC_NAME_LAST_UPDATED)
        .set({ timestamp: timestamp });

    return tp
}

async function saveErrorMessage(parsed: any) {
    const message = parsed.status.error_message;
    const em = await admin.firestore()
        .collection(FS_COLLECTION_NAME_SERVICE)
        .doc(FS_DOC_NAME_ERROR_MESSAGE)
        .set({ error_message: message });

    return em
}