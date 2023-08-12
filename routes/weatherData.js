const axios = require('axios');
const moment = require('moment')

const {roundTo10Minutes, getMidnightToday} = require('./../utils/time')

module.exports = function weatherData(app) {
  const timeseries = 'https://opendata.fmi.fi/timeseries';
  const meteorologicalParameters = 'ri_10min,ws_10min,wg_10min,wd_10min,vis,wawa,t2m,n_man,r_1h,snow_aws,pressure,rh,dewpoint'

  async function _handleWeatherForecasts(req, res) {
    const geoid = req.query.geoid

    // if (!geoid) {
    //   res.status(400).send();
    //   return;
    // }

    const promises = {};
    promises.observation = weatherForecast(geoid)

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

  async function weatherForecast(geoid) {
    const params = {
      param:
        `stationname as name,lat,lon,distance,region,fmisid,utctime as time,${meteorologicalParameters}`,
      startTime: getMidnightToday(new Date()),
      endtime: roundTo10Minutes(new Date()),
      format: 'json',
      timeformat: 'sql',
      fmisid: '101520',
      precision: 'full',
      producer: 'opendata',
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
      console.log(`fetchWeatherForecastValues [FINISHED] ${difference.toLocaleString()} ms`);
      // }
    } catch (e) {
      console.error(e);
    }

    //const formattedData = formatResponse(data, meteorologicalParameters)
    return data
  }

  function _formatResponse(data, parameters, modelLevel = false) {
    let returnArray = {}

    returnArray.location = data[0].name
    returnArray.timezone = data[0].localtz
    returnArray.origintime = data[0].origintime
    returnArray.modtime = data[0].modtime
    returnArray.dataset = {}

    // initialize response format
    const params = parameters.split(',')
    params.forEach(function (item) {
      let key = item
      let obj = {}
      obj[key] = []
      returnArray.dataset[item] = []
    })

    // populate forcast arrays 
    data.forEach(function (item) {
      params.forEach(function (parameter) {
        if (parameter === 'SmartSymbol')
          returnArray.dataset[parameter].push([moment(item.localtime).valueOf(), Math.floor(item[parameter])])
        else if (modelLevel)
          returnArray.dataset[parameter].push([moment(item.localtime).valueOf(), item.level, item[parameter]])
        else
          returnArray.dataset[parameter].push([moment(item.localtime).valueOf(), item[parameter]])

      })
    })
    return data
  }

  function _differenceInMs(start) {
    const diff = process.hrtime(start);
    return (diff[0] * 1e9 + diff[1]) / 1e6;
  };

  app.use('/observation/now', _handleWeatherForecasts);
}