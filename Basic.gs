/********************************************************************************************************************************** 
 * This script is designed to guide users through pulling data from the FRC Events API into Google Sheets.                        *
 *                                                                                                                                *
 * In order to use the system, you will need to obtain an API Key at https://frc-events.firstinspires.org/services/api/register   *
 *                                                                                                                                *
 * This tool is meant for demo purposes only. For more information, see https://frc-api-docs.firstinspires.org.                   *
 * Created by Jared Hasen-Klein. Code is offered without any warranty or guarentee.                                               *
 **********************************************************************************************************************************/


// User-defined variables
const YEAR = '2024'; // Replace with the desired year
const EVENT = 'CAOC'; // Replace with the desired event code

// Your API credentials (replace with your actual credentials)
const API_USERNAME = 'your-api-username';
const API_TOKEN = 'your-api-token';

// API endpoint (replace with your desired endpoint)
const API_ENDPOINT = `https://frc-api.firstinspires.org/v3.0/${YEAR}/scores/${EVENT}/Qualification`;

// Function to fetch API data and write it to a sheet
function fetchAndWriteData() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getActiveSheet();
  
  sheet.clear();
  
  // Fetch data from API
  var options = {
    'method': 'get',
    'headers': {
      'Authorization': 'Basic ' + Utilities.base64Encode(API_USERNAME + ':' + API_TOKEN)
    }
  };
  
  var response = UrlFetchApp.fetch(API_ENDPOINT, options);
  var data = JSON.parse(response.getContentText());
  
  // Flatten JSON and write to sheet
  var flattenedData = flattenJSON(data);
  var headers = Object.keys(flattenedData[0]);
  
  // Write headers
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Write data
  var rowData = flattenedData.map(function(row) {
    return headers.map(function(header) {
      return row[header];
    });
  });
  
  if (rowData.length > 0) {
    sheet.getRange(2, 1, rowData.length, headers.length).setValues(rowData);
  }
  
  // Auto-resize columns
  sheet.autoResizeColumns(1, headers.length);
}

function flattenJSON(data) {
  var result = [];
  
  var dataArray = data.MatchScores || data.Schedule || [data];
  
  dataArray.forEach(function(item) {
    var flatItem = {};
    Object.keys(item).forEach(function(key) {
      if (typeof item[key] === 'object' && item[key] !== null) {
        Object.keys(item[key]).forEach(function(subKey) {
          if (typeof item[key][subKey] === 'object' && item[key][subKey] !== null) {
            Object.keys(item[key][subKey]).forEach(function(subSubKey) {
              flatItem[key + '_' + subKey + '_' + subSubKey] = item[key][subKey][subSubKey];
            });
          } else {
            flatItem[key + '_' + subKey] = item[key][subKey];
          }
        });
      } else {
        flatItem[key] = item[key];
      }
    });
    result.push(flatItem);
  });
  
  return result;
}

// Adds a menu item to fetch the data
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('FRC API')
      .addItem('Fetch Data', 'fetchAndWriteData')
      .addToUi();
}
