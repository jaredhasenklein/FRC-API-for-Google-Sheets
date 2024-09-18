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

// Function to fetch API data and begin to parse it
function fetchAndParseData(endpoint, sheetName) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  } else {
    sheet.clear();
  }
  
  // Fetch data from API
  var options = {
    'method': 'get',
    'headers': {
      'Authorization': 'Basic ' + Utilities.base64Encode(API_USERNAME + ':' + API_TOKEN)
    }
  };
  
  var response = UrlFetchApp.fetch(endpoint, options);
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

function fetchScoreBreakdown() {
  var endpoint = `https://frc-api.firstinspires.org/v3.0/${YEAR}/scores/${EVENT}/Qualification`;
  fetchAndParseData(endpoint, "Score Breakdown");
}

function fetchMatchSchedule() {
  var endpoint = `https://frc-api.firstinspires.org/v3.0/${YEAR}/schedule/${EVENT}?tournamentLevel=Qualification`;
  fetchAndParseData(endpoint, "Match Schedule");
}

function flattenJSON(data) {
  var result = [];
  
  var dataArray = data.MatchScores || data.Schedule;
  
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

// Create sheets to process and parse the data to make it more usable

function createProcessingsheets() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  // Create "Simplified" sheet
  var simplifiedSheet = spreadsheet.getSheetByName("Simplified");
  if (!simplifiedSheet) {
    simplifiedSheet = spreadsheet.insertSheet("Simplified");
  } else {
    simplifiedSheet.clear(); // Clear existing content if the sheet already exists
  }

  // Create "Items" sheet
  var itemsSheet = spreadsheet.getSheetByName("Items by Team");
  if (!itemsSheet) {
    itemsSheet = spreadsheet.insertSheet("Items by Team");
  } else {
    itemsSheet.clear(); // Clear existing content if the sheet already exists
  }

  // Set the formulas
  simplifiedSheet.getRange('A1').setFormula("=ArrayFormula('Score Breakdown'!A:B)");
  simplifiedSheet.getRange('C1').setFormula(
    "=ArrayFormula({FILTER('Match Schedule'!1:1, REGEXMATCH('Match Schedule'!1:1, \"teamNumber\")),FILTER('Score Breakdown'!1:1, REGEXMATCH('Score Breakdown'!1:1, \"Robot1|Robot2|Robot3\"))})"
  );
  simplifiedSheet.getRange('C2').setFormula(
    "=CHOOSECOLS('Match Schedule'!F2:U,1,4,7,10,13,16)"
  );
  simplifiedSheet.getRange('I2').setFormula(
    "=CHOOSECOLS('Score Breakdown'!$A$2:$999, FILTER(MATCH(TRANSPOSE(FILTER('Score Breakdown'!1:1, REGEXMATCH('Score Breakdown'!1:1, \"Robot1|Robot2|Robot3\"))), 'Score Breakdown'!$A$1:$1, 0), ISNUMBER(MATCH(TRANSPOSE(FILTER('Score Breakdown'!1:1, REGEXMATCH('Score Breakdown'!1:1, \"Robot1|Robot2|Robot3\"))), 'Score Breakdown'!$A$1:$1, 0))))"
  );
    itemsSheet.getRange('A1').setValue(
    "Team"
  );
 itemsSheet.getRange('A2').setFormula(
    '=SORT(({CHOOSECOLS(Simplified!2:99999,(FILTER(COLUMN(Simplified!1:1), REGEXMATCH(Simplified!1:1, "^alliances_0.*Robot1$") + (Simplified!1:1 = "teams_0_teamNumber")))); CHOOSECOLS(Simplified!2:99999,(FILTER(COLUMN(Simplified!1:1), REGEXMATCH(Simplified!1:1, "^alliances_0.*Robot2$") + (Simplified!1:1 = "teams_1_teamNumber")))); CHOOSECOLS(Simplified!2:99999,(FILTER(COLUMN(Simplified!1:1), REGEXMATCH(Simplified!1:1, "^alliances_0.*Robot3$") + (Simplified!1:1 = "teams_2_teamNumber")))); CHOOSECOLS(Simplified!2:99999,(FILTER(COLUMN(Simplified!1:1), REGEXMATCH(Simplified!1:1, "^alliances_1.*Robot1$") + (Simplified!1:1 = "teams_3_teamNumber")))); CHOOSECOLS(Simplified!2:99999,(FILTER(COLUMN(Simplified!1:1), REGEXMATCH(Simplified!1:1, "^alliances_1.*Robot2$") + (Simplified!1:1 = "teams_4_teamNumber")))); CHOOSECOLS(Simplified!2:99999,(FILTER(COLUMN(Simplified!1:1), REGEXMATCH(Simplified!1:1, "^alliances_1.*Robot3$") + (Simplified!1:1 = "teams_5_teamNumber"))))}), 1, TRUE)'
  );
  itemsSheet.getRange('B1').setFormula(
    '={TRANSPOSE(UNIQUE(TRANSPOSE(ARRAYFORMULA(REGEXREPLACE(Simplified!I1:1, "alliances_(0|1)_(autoLine|endGame)Robot(1|2|3)", "$2")))))}'
  );
}

// Combines the key functions

function fetchDataAndCreateSheets() {
  fetchScoreBreakdown();  // This calls fetchAndParseData for score breakdown
  fetchMatchSchedule();   // This calls fetchAndParseData for match schedule
  createProcessingsheets();
}

// Adds a menu item to create the sheets

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('FRC API')
      .addItem('Fetch Data and Create Sheets', 'fetchDataAndCreateSheets')
      .addToUi();
}
