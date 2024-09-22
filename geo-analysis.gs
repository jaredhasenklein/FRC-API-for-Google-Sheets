/********************************************************************************************************************************** 
 * This script is designed to guide users through pulling data from the FRC Events API into Google Sheets.                        *
 *                                                                                                                                *
 * In order to use the system, you will need to obtain an API Key at https://frc-events.firstinspires.org/services/api/register   *
 *                                                                                                                                *
 * This tool is meant for demo purposes only. For more information, see https://frc-api-docs.firstinspires.org.                   *
 * Created by Jared Hasen-Klein. Code is offered without any warranty or guarentee.                                               *
 **********************************************************************************************************************************/

// User-defined variables
const YEAR = '2024'; //Replace with the desired year
const DISTRICT_CODE = ''; // (Optional) Replace with a district code (e.g. FMA, PNW, NE)
const STATE = 'California'; // (Optional) Replace with a state or province (e.g. California or Ontario)

// Your API credentials (replace with your actual credentials)
const API_USERNAME = 'your-api-username';
const API_TOKEN = 'your-api-token';

function getFRCTeamData() {
  const baseUrl = 'https://frc-api.firstinspires.org/v3.0/';
  const endpoint = `${baseUrl}${YEAR}/teams?districtCode=${DISTRICT_CODE}&state=${STATE}`;
  
  // Results are paginated. Get the total number of pages.
  const totalPagesResponse = fetchData(endpoint + '&page=200');
  const totalPages = totalPagesResponse.pageTotal;
  
  let allTeams = [];
  
  // Fetch data from all pages
  for (let page = 1; page <= totalPages; page++) {
    const response = fetchData(endpoint + `&page=${page}`);
    const teams = response.teams;
    
    // Extract required fields for each team
    const extractedTeams = teams.map(team => ({
      teamNumber: team.teamNumber,
      nameShort: team.nameShort,
      city: team.city,
      stateProv: team.stateProv,
      country: team.country
    }));
    
    allTeams = allTeams.concat(extractedTeams);
  }
  
  return allTeams;
}


function getFRCEventData() {
  const baseUrl = 'https://frc-api.firstinspires.org/v3.0/';
  const endpoints = [
    `${baseUrl}${YEAR}/events?tournamentType=1`,
    `${baseUrl}${YEAR}/events?tournamentType=2`
  ];
  
  let allEvents = [];
  
  endpoints.forEach(endpoint => {
    try {
      const response = fetchData(endpoint);
      const events = response.Events || [];
      
      const extractedEvents = events.map(event => ({
        code: event.code,
        name: event.name,
        type: event.type,
        venue: event.venue,
        city: event.city,
        stateprov: event.stateprov,
        country: event.country
      }));
      
      allEvents = allEvents.concat(extractedEvents);
    } catch (error) {
      Logger.log(`Error fetching data from ${endpoint}: ${error.toString()}`);
    }
  });
  
  Logger.log(`Total events fetched: ${allEvents.length}`);
  return allEvents;
}

function fetchData(url) {
  const options = {
    method: 'get',
    headers: {
      'Authorization': 'Basic ' + Utilities.base64Encode(API_USERNAME + ':' + API_TOKEN),
      'Accept': 'application/json'
    }
  };
  
  const response = UrlFetchApp.fetch(url, options);
  return JSON.parse(response.getContentText());
}

function writeDataToSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  // Write team data
  let teamSheet = spreadsheet.getSheetByName("Teams");
  if (!teamSheet) {
    teamSheet = spreadsheet.insertSheet("Teams");
  }
  
  const teams = getFRCTeamData();
  
  teamSheet.clear();
  teamSheet.getRange(1, 1, 1, 5).setValues([['Team Number', 'Name (Short)', 'City', 'State/Province', 'Country']]);
  
  if (teams.length > 0) {
    const teamData = teams.map(team => [team.teamNumber, team.nameShort, team.city, team.stateProv, team.country]);
    teamSheet.getRange(2, 1, teamData.length, 5).setValues(teamData);
  } else {
    teamSheet.getRange(2, 1).setValue("No teams found matching the criteria.");
  }
  
  // Write event data
  let eventSheet = spreadsheet.getSheetByName("Events");
  if (!eventSheet) {
    eventSheet = spreadsheet.insertSheet("Events");
  }
  
  const events = getFRCEventData();
  
  eventSheet.clear();
  eventSheet.getRange(1, 1, 1, 7).setValues([['Event Code', 'Name', 'Type', 'Venue', 'City', 'State/Province', 'Country']]);

//Pull in only the specified columns -- modify, if desired
  if (events && events.length > 0) {
    const eventData = events.map(event => [
      event.code,
      event.name,
      event.type,
      event.venue,
      event.city,
      event.stateprov,
      event.country
    ]);
    eventSheet.getRange(2, 1, eventData.length, 7).setValues(eventData);
  } else {
    eventSheet.getRange(2, 1).setValue("No events found or error occurred while fetching events.");
  }
  
  Logger.log(`Finished writing ${events ? events.length : 0} events to sheet.`);
}

// Adds a menu item to fetch the data
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('FRC Data')
    .addItem('Fetch Team and Event Data', 'writeDataToSheet')
    .addToUi();
}
