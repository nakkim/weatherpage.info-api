const axios = require('axios');
const moment = require('moment')
const cors = require('cors')

const { roundTo10Minutes, getMidnightToday, isValidDateFormat } = require('./../utils/time')

module.exports = function weatherData(app) {
  const timeseries = 'https://opendata.fmi.fi/timeseries';
  const meteorologicalParameters = 'ri_10min,ws_10min,wg_10min,wd_10min,vis,wawa,t2m,n_man,r_1h,snow_aws,pressure,rh,dewpoint'

  async function _handleWeatherForecasts(req, res) {
    
    const time = req.query.time
    if (time !== undefined && !isValidDateFormat(time)) {
      res.send('Unknown time string format')
      res.status(400).send();
      return;
    }

    const promises = {};
    promises.observation = weatherForecast(time)

    const keys = Object.keys(promises);
    const results = await Promise.all(Object.values(promises));

    const data = Object.fromEntries(
      keys.map((_, i) => [keys[i], results[i]] || false)
    );

    res.set({
      'Cache-control': `public, max-age=300`,
    });
    res.send(data.observation);
  }

  async function weatherForecast(time) {
    const params = {
      param:
        `stationname as name,lat,lon,distance,region,fmisid,utctime as time,${meteorologicalParameters}`,
      startTime: time !== undefined ? getMidnightToday(new Date(time)) : getMidnightToday(new Date()),
      endtime: time !== undefined ? roundTo10Minutes(new Date(time)): roundTo10Minutes(new Date()),
      format: 'json',
      timeformat: 'sql',
      keyword: 'synop_fi',
      precision: 'full',
      producer: 'opendata',
      timestep: '60'
    };

    let data = false;
    try {
      const res = await axios.get(timeseries, {
        params,
      });
      data = res.data;
      // if (process.env.ENV !== 'prod') {
      const start = process.hrtime();
      const difference = _differenceInMs(start)
      console.log(`fetchWeatherObservationValues [FINISHED] ${difference.toLocaleString()} ms`);
      // }
    } catch (e) {
      console.error(e);
    }

    return _formatResponse(data)
  }

  function _formatResponse(data) {
    let returnArray = []

    let = r_1d = 0

    for (let i = 0; i < data.length - 1; i++) {
      if(data[i].fmisid === data[i+1].fmisid) {
        r_1d = r_1d + data[i]['r_1h']
      } else {
        data[i]["r_1d"] = Number(r_1d.toFixed(1))
        data[i]['t2mtdew'] = Number((data[i]['t2m'] - data[i]['dewpoint']).toFixed(1))

        returnArray.push(data[i])

        r_1d = 0
      }
    }

    return returnArray
  }

  function _differenceInMs(start) {
    const diff = process.hrtime(start);
    return (diff[0] * 1e9 + diff[1]) / 1e6;
  };

  app.use('/observation', cors(), _handleWeatherForecasts);
}