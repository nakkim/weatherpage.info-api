function roundTo10Minutes(date) {
  const millisecondsPerMinute = 60000; // 1 minute = 60,000 milliseconds
  const minutesPerInterval = 10;
  const millisecondsPerInterval = millisecondsPerMinute * minutesPerInterval;
  
  const timestamp = date.getTime();
  const remainder = timestamp % millisecondsPerInterval;
  const flooredTimestamp = timestamp - remainder;

  const flooredDate = new Date(flooredTimestamp);
  return flooredDate;
}

function getISODateInPast(timestring) {

  let now = new Date()
  if(timestring)
  now = new Date(timestring);

  const past = new Date(now.getTime() - 80 * 60000); // 60,000 milliseconds in a minute
  return roundTo10Minutes(past).toISOString().split('.')[0]+"Z";
}

function getMidnightToday(date) {
  const midnight = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  return midnight;
}

function minutesFromMidnight(timestring) {

  let now = new Date()
  if(timestring)
  now = new Date(timestring);

  const midnight = new Date(now);
  midnight.setHours(0, 0, 0, 0); // Set to midnight

  const millisecondsPassed = now - midnight;
  const minutesPassed = Math.floor(millisecondsPassed / (1000 * 60));
  return minutesPassed;
}

function isValidDateFormat(dateString) {
  // Regular expressions for the valid formats
  const validFormats = [
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/,
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/,
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/,
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}Z$/
  ];

  // Check if the input string matches any of the valid formats
  return validFormats.some(format => format.test(dateString));
}

module.exports = {getMidnightToday, getISODateInPast, roundTo10Minutes, isValidDateFormat, minutesFromMidnight}