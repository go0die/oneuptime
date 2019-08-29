const express = require('express');
const path = require('path');
const app = express();
const envfile = require('envfile');
const fs = require('fs');

var env = {
  REACT_APP_FYIPE_HOSTED: process.env.FYIPE_HOSTED,
  REACT_APP_HOST: process.env.HOST,
  REACT_APP_DASHBOARD_HOST: process.env.DASHBOARD_HOST,
  REACT_APP_BACKEND_HOST: process.env.BACKEND_HOST
}

fs.writeFileSync('.env', envfile.stringifySync(env));

var reactEnv = require('@beam-australia/react-env');

reactEnv.apply();

app.use(express.static(path.join(__dirname, 'build')));

app.get('/*', function (req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(3003);