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

function getMidnightToday(date) {
  const midnight = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  return midnight;
}

module.exports = {getMidnightToday, roundTo10Minutes}