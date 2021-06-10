const {google} = require('googleapis');
const keys = require('./keys.json');

//https://developers.google.com/sheets/api/quickstart/nodejs

const client = new google.auth.JWT(
    keys.client_email, 
    null, 
    keys.private_key,
    ['https://www.googleapis.com/auth/spreadsheets']
);

client.authorize(function(err, tokens){
    if (err) {
        console.log(err);
        return;
    } else {
        console.log('Connected');
        gsrun(client);
    }
});

async function gsrun(cl) {
    const gsapi = google.sheets({version: 'v4', auth: cl});
    const opt = {
        spreadsheetId: '1GyzGFvzVOWxgdg3i9Ztf9t6DdgvtDYmOnImC_9cXmT8',
        range: "'Sheet1'!A2:B3"
    };

    let data =  await gsapi.spreadsheets.values.get(opt);
    let dataArray = data.data.values;
    console.log(dataArray);

    const updateOptions = {
        spreadsheetId: '1GyzGFvzVOWxgdg3i9Ztf9t6DdgvtDYmOnImC_9cXmT8',
        range: "'Sheet1'!A6",
        valueInputOption: 'USER_ENTERED',
        resource: { values:  dataArray}
    }

    let res =  await gsapi.spreadsheets.values.update(updateOptions);
    console.log(res);
}

