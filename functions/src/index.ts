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
        .then(async (parsed) => {
            const error_code = parsed.status.error_code;
            const error_message = parsed.status.error_message;
            const timestamp = parsed.status.timestamp;

            const data = parsed.data;
            console.log("Request completed, status: " + parsed.status.error_code);

            let message = ""
            message += "Request completed:\n";
            message += ` - error_code: ${error_code}\n`;
            message += ` - error_message: ${error_message}\n`;
            message += ` - timestamp: ${timestamp}\n`;
            message += ` - First coin: ${data[0].name}\n`;
            message += ` - Last coin: ${data[data.length - 1].name}\n`;

            const promises: Promise<FirebaseFirestore.WriteResult>[] = new Array();

            const tp = admin.firestore()
                .collection('service_info')
                .doc('last_updated')
                .set({ timestamp: timestamp }, { merge: true });

            promises.push(tp);

            await Promise.all(promises);

            response.send(message);
        })
        .catch((err) => {
            console.log("Error occurred: " + err.statusCode);
            response.send("Error occurred: " + err.statusCode);
        })
});

// async function saveData(parsed: any) {
//     const timestamp = parsed.status.timestamp;
//     const tp = await admin.firestore()
//         .collection(FS_COLLECTION_NAME_SERVICE)
//         .doc(FS_DOC_NAME_LAST_UPDATED)
//         .set({ timestamp: timestamp }, { merge: true });

//     return tp
// }
