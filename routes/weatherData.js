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

    if (time)
      res.set({
        'Cache-control': `public, max-age=300`,
      });
    else
      res.set({
        'Cache-control': `no-store`,
      });
    res.send(data.observation);
  }

  async function weatherForecast(time) {
    const params = {
      param:
        `stationname as name,lat,lon,distance,region,fmisid,utctime as time,${meteorologicalParameters}`,
      startTime: time !== undefined ? getMidnightToday(new Date(time)) : getMidnightToday(new Date()),
      endtime: time !== undefined ? roundTo10Minutes(new Date(time)) : roundTo10Minutes(new Date()),
      format: 'json',
      timeformat: 'sql',
      keyword: 'synop_fi',
      precision: 'full',
      producer: 'opendata',
      timestep: '10'
    };

    let data = false;
    try {
      const res = await axios.get(timeseries, {
        params,
      });
      data = res.data;
    } catch (e) {
      console.error(e);
    }

    return _formatResponse(data)
  }

  function _formatResponse(data) {
    let returnArray = []

    let r_1d = 0
    let r_1h = null
    let tmax = -999
    let tmin = 999
    let ws_1d = -0.1
    let wg_1d = -0.1
    let wg_max_dir = -0.1
    let ws_max_dir = -0.1

    for (let i = 0; i < data.length - 1; i++) {
      if (data[i].fmisid === data[i + 1].fmisid) {
        r_1d = r_1d + data[i]['r_1h']

        if (data[i]['t2m'] && data[i]['t2m'] > tmax) tmax = data[i]['t2m']
        if (data[i]['t2m'] && data[i]['t2m'] < tmin) tmin = data[i]['t2m']
        if (data[i]['ws_10min'] && data[i]['ws_10min'] > ws_1d) {
          ws_1d = data[i]['ws_10min']
          ws_max_dir = data[i]['wd_10min']
        }
        if (data[i]['wg_10min'] && data[i]['wg_10min'] > wg_1d) {
          wg_1d = data[i]['wg_10min']
          wg_max_dir = data[i]['wg_10min']
        }

        if ((new Date(data[i]['time'])).getUTCHours() === 0 && (new Date(data[i]['time'])).getUTCMinutes() === 0) {
          r_1h = data[i]['r_1h']
        }

        // final key
        if (i === data.length - 1) {
          if (data[i + 1]['t2m'] > tmax) data[i + 1]['tmax'] = data[i + 1]['t2m']
          if (data[i + 1]['t2m'] < tmin) data[i + 1]['tmin'] = data[i + 1]['t2m']

          if (data[i+1]['ws_10min'] && data[i+1]['ws_10min'] > ws_1d) {
            ws_1d = data[i+1]['ws_10min']
            ws_max_dir = data[i+1]['wd_10min']
          }
          if (data[i+1]['wg_10min'] && data[i+1]['wg_10min'] > wg_1d) {
            wg_1d = data[i+1]['wg_10min']
            wg_max_dir = data[i+1]['wg_10min']
          }

          data[i + 1]["r_1d"] = Number(r_1d.toFixed(1))
          data[i + 1]['t2mtdew'] = Number((data[i + 1]['t2m'] - data[i + 1]['dewpoint']).toFixed(1))

          if ((new Date(data[i + 1]['time'])).getUTCHours() === 0 && (new Date(data[i + 1]['time'])).getUTCMinutes() === 0) {
            r_1h = data[i + 1]['r_1h']
          }
          data[i + 1]['r_1h'] = r_1h
          returnArray.push(data[i + 1])
        }



      } else {
        data[i]["r_1d"] = Number(r_1d.toFixed(1))
        data[i]['t2mtdew'] = (data[i]['t2m'] && data[i]['dewpoint']) ? Number((data[i]['t2m'] - data[i]['dewpoint']).toFixed(1)) : null
        if ((new Date(data[i]['time'])).getUTCHours() === 0 && (new Date(data[i]['time'])).getUTCMinutes() === 0) {
          r_1h = data[i]['r_1h']
        }
        data[i]['r_1h'] = r_1h
        data[i]['tmin'] = tmin === 999 ? null : tmin
        data[i]['tmax'] = tmax === -999 ? null : tmax
        data[i]['ws_1d'] = ws_1d < 0 ? null : ws_1d
        data[i]['wg_1d'] = wg_1d < 0 ? null : wg_1d
        data[i]['ws_max_dir'] = ws_max_dir < 0 ? null : ws_max_dir
        data[i]['wg_max_dir'] = wg_max_dir < 0 ? null : wg_max_dir
        returnArray.push(data[i])

        tmax = -999
        tmin = 999
        r_1d = 0
        r_1h = 0
        ws_1d = -0.1
        wg_1d = -0.1
        wg_max_dir = -0.1
        ws_max_dir = -0.1

      }
    }

    return returnArray
  }

  app.use('/observation', cors(), _handleWeatherForecasts);
}