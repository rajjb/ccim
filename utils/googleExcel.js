/* eslint-disable prefer-destructuring */
/* eslint-disable array-callback-return */
/* eslint-disable no-unused-vars */
const { google } = require('googleapis');
const ga_config = require('../googleKeys.json');
const logger = require('../utils/logger');

const client = new google.auth.JWT(
  ga_config.client_email,
  null,
  ga_config.private_key,
  ['https://www.googleapis.com/auth/spreadsheets']
);

const AsyncFunction = (async () => { }).constructor;
const _defaultSpreadSheetId = '1txgwdHC9P9Fb5XIQZ1IQ0UcCjL2_H8395Oaq7m4k6Lc';

// exports.authorize = function (callback) {
async function authorizeClient(callback) {
  return new Promise((resolve, reject) => {
    client.authorize(async (err, token) => {
      if (err) {
        logger.log(err, 'googleExcel.js');
        return;
      }
      if (callback instanceof AsyncFunction === true) {
        await callback(client);
        resolve();
      } else {
        callback(client);
        resolve();
      }

    });
  });
}

exports.ApplyToGoogleExcel = async function (rows, sheetName, spreadsheetId, locationToStart) {

  if (!rows) {
    return;
  }

  if (!spreadsheetId) {
    spreadsheetId = _defaultSpreadSheetId;
  }

  if (!locationToStart) {
    locationToStart = 'A2';
  }

  if (!sheetName) {
    sheetName = 'Data';
  }

  await authorizeClient(async (cl) => {
    const gsapi = google.sheets({ version: 'v4', auth: client });

    // this is to get the data.
    const opt = {
      spreadsheetId,
      range: `'${sheetName}'!${locationToStart}`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: rows }
    };
    const response = await gsapi.spreadsheets.values.update(opt);
  });

};

exports.GetGoogleExcel = async function (sheetName, spreadsheetId, locationToStart, locationToEnd) {

  if (!spreadsheetId) {
    spreadsheetId = _defaultSpreadSheetId;
  }

  if (!locationToStart && !locationToEnd) {
    locationToStart = '';
    locationToEnd = '';
  } else if (!locationToStart) {
    locationToStart = 'A1';
  }

  let range = locationToStart;
  if (locationToEnd) {
    range = `!${locationToStart}:${locationToEnd}`;
  } else {
    range = '';
  }

  if (!sheetName) {
    sheetName = 'Data';
  }

  let rows = [];
  await authorizeClient(async (cl) => {
    const gsapi = google.sheets({ version: 'v4', auth: client });

    // this is to get the data.
    const opt = {
      spreadsheetId,
      range: `${sheetName}${range}`,
    };
    const response = await gsapi.spreadsheets.values.get(opt);
    rows = response.data.values || [];
  });

  return rows;

};

const GetSheetId = async function (spreadsheetId, sheetName) {
  return new Promise((resolve, reject) => {
    authorizeClient(async (cl) => {
      const gsapi = google.sheets({ version: 'v4', auth: client });
      const resInfo = await gsapi.spreadsheets.get({
        spreadsheetId
      });

      if (resInfo && resInfo.data.sheets) {
        resInfo.data.sheets.map((sheet) => {
          if (sheet && sheet.properties.title === sheetName) {
            resolve(sheet.properties.sheetId);
          }
        });
      }
      reject();
    });

  });
};

exports.DeleteExcelRows = async function (sheetName, spreadsheetId, rowIndex, noOfRows) {

  if (!spreadsheetId) {
    spreadsheetId = _defaultSpreadSheetId;
  }

  if (!rowIndex) {
    rowIndex = 0;
  }

  if (!noOfRows) {
    noOfRows = 1;
  }

  if (!sheetName) {
    sheetName = 'Data';
  }

  const sheetId = await GetSheetId(spreadsheetId, sheetName);


  const request = {
    spreadsheetId,
    resource: {
      requests: [{
        deleteRange: {
          range: {
            sheetId,
            dimension: 'ROWS',
            startIndex: rowIndex,
            endIndex: rowIndex + noOfRows,
          },
          shiftDimension: 'ROWS'
        }        
      }]
    },
    auth: client,
  };

  
  await authorizeClient(async (cl) => {
    const gsapi = google.sheets({ version: 'v4', auth: client });
    await gsapi.spreadsheets.batchUpdate(request, (req) => {
    });
  });
};

