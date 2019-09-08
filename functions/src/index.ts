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
            message += ` - First currency: ${data[0].name}\n`;
            message += ` - Last currency: ${data[data.length - 1].name}\n`;

            const database = admin.firestore();

            void await database
                .collection('service_info')
                .doc('last_updated')
                .set({ timestamp: timestamp }, { merge: true })

            const chunkPromises: Promise<FirebaseFirestore.WriteResult[]>[] = new Array();

            const chunked = chunk(data, 300);
            let batchCounter = 0;

            for (const singleChunk of chunked) {

                const chunkBatch = database.batch();

                for (const singleItem of singleChunk) {
                    const symbol = singleItem.symbol
                    const name = singleItem.name

                    chunkBatch.set(
                        database
                            .collection('currencies')
                            .doc(symbol),
                        { name: name }, { merge: true }
                    );
                }
                batchCounter++;
                chunkPromises.push(chunkBatch.commit());
            }

            await Promise.all(chunkPromises);

            message += ` - Handled batches: ${batchCounter}\n`;

            response.send(message);
        })
        .catch((err) => {
            console.log("Error occurred: " + err.statusCode);
            response.send("Error occurred: " + err.statusCode);
        })
});

function chunk(array: any, size: any) {
    const chunked_arr = [];
    let index = 0;
    while (index < array.length) {
        chunked_arr.push(array.slice(index, size + index));
        index += size;
    }
    return chunked_arr;
}
