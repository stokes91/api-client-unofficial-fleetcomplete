/*
   Copyright 2021 Alexander Stokes

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

const fs = require('fs');
const util = require('util');

const Client = require('../main');

/* ~/config.json
{
  "fleetComplete" : {
    "ApplicationId": "< GUID >",
    "ClientID": "< digits >",
    "Email": "< email >",
    "Password": "< password >"
  }
}
*/

if (require.main === module) {

  const buf = fs.readFileSync(process.env.HOME + '/config.json');

  const config = {};

  try {
    Object.assign(config, JSON.parse(buf.toString()));
  }
  catch (err) {
    console.log(util.inspect(err));
    return;
  }

  const client = new Client(Object.assign({}, config.fleetComplete));

  client.getAuthenticationCode((err) => {
    if (err) {
      console.log('getAuthenticationCode failed', client);
      return;
    }

    client.getAuthenticationToken((err) => {
      if (err) {
        console.log('getAuthenticationToken failed', client);
        return;
      }

      const ri = setInterval(() => {
        client.refreshApplicationToken((err) => {
          if (err) {
            console.log('refreshApplicationToken failed', client);
            clearInterval(gi);
            clearInterval(ri);
          }
        });
      }, 9.2 * 60 * 1000);

      const gi = setInterval(() => {
        client.getAssets((err) => {
          if (err) {
            console.log('getAssets failed', client);
            clearInterval(gi);
            clearInterval(ri);
            return;
          }

          console.log(client.assets.map((that) => {
            const { description, latitude, longitude } = that;
            return {
              description,
              latitude,
              longitude
            };
          }));
        });
      }, 5 * 60 * 1000);

    });
  });
}
