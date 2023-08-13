var express = require('express');
var router = express.Router();

router.get('/', function (req, res, next) {
  res.send({
    observationParameters: ['ri_10min', 'ws_10min', 'wg_10min', 'wd_10min', 'vis', 'wawa', 't2m', 'n_man', 'r_1h', 'snow_aws', 'pressure', 'rh' ,'dewpoint']
  });
});

module.exports = router;
