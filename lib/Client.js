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

const https = require('https');

const Header = {
  'Accept': 'application/json, text/plain, */*',
  'Accept-Encoding': 'gzip, deflate, br',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
  'Host': 'tlshosted.fleetcomplete.com',
  'Origin': 'https://web.fleetcomplete.com',
  'Pragma': 'no-cache',
  'Referer': 'https://web.fleetcomplete.com/',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-site'
};

class Client {
  constructor(options) {
    Object.assign(this, options);

    if (!this.UserAgent || !this.Email || !this.Password || !this.ApplicationId || !this.ClientID) {
      throw new Error('Config is missing a required field.');
    }
  }

  getAuthenticationCode(callback) {
    const serializedRequest = Buffer.from(JSON.stringify({
      email: this.Email,
      password: this.Password
    }));

    const req = https.request({
      host: 'tlshosted.fleetcomplete.com',
      method: 'POST',
      path: '/Authentication/v10/Authentication.svc/authenticate_v3/',
      headers: Object.assign({
        'Content-Type': 'application/json;charset=UTF-8',
        'Content-Length': serializedRequest.byteLength.toString(),
        'User-Agent': this.UserAgent
      }, Header)
    }, (res) => {
      if (res.statusCode !== 200) {
        callback(true);
        return;
      }

      const b = [];
      res.on('data', (d) => { b.push(d); });
      res.on('end', () => {
        const response = {};
        try {
          Object.assign(response, JSON.parse(Buffer.concat(b).toString()));
        }
        catch (e) {
          callback(true);
          return;
        }

        if (!response.AuthenticationCode) {
          callback(true);
          return;
        }

        this.AuthenticationCode = response.AuthenticationCode;
        this.UserId = response.UserId;

        callback();
        return;
      });
    });

    req.end(serializedRequest);
  }

  getAuthenticationToken(callback) {
    const serializedRequest = Buffer.from(JSON.stringify({
      userId: this.UserId,
      email: this.Email,
      authenticationCode: this.AuthenticationCode,
      applicationId: this.ApplicationId,
      clientId: this.ClientID
    }));

    const req = https.request({
      host: 'tlshosted.fleetcomplete.com',
      method: 'POST',
      path: '/Authentication/v10/ApplicationToken.svc/getApplicationToken/',
      headers: Object.assign({
        'Content-Type': 'application/json;charset=UTF-8',
        'Content-Length': serializedRequest.byteLength.toString(),
        'User-Agent': this.UserAgent
      }, Header)
    }, (res) => {
      if (res.statusCode !== 200) {
        callback(true);
        return;
      }

      const b = [];
      res.on('data', (d) => { b.push(d); });
      res.on('end', () => {
        const response = {};

        try {
          Object.assign(response, JSON.parse(Buffer.concat(b).toString()));
        }
        catch (e) {
          callback(true);
          return;
        }

        if (!response.ApplicationToken || !response.RefreshToken) {
          callback(true);
          return;
        }

        this.ApplicationToken = response.ApplicationToken;
        this.RefreshToken = response.RefreshToken;

        callback();
        return;
      });
    });

    req.end(serializedRequest);
  }

  refreshApplicationToken(callback) {
    const serializedRequest = Buffer.from(JSON.stringify({
      refreshToken: this.RefreshToken
    }));

    const req = https.request({
      host: 'tlshosted.fleetcomplete.com',
      method: 'POST',
      path: '/Authentication/v10/ApplicationToken.svc/refreshApplicationToken/',
      headers: Object.assign({
        'Content-Type': 'application/json',
        'Content-Length': serializedRequest.byteLength.toString(),
        'User-Agent': this.UserAgent
      }, Header)
    }, (res) => {
      console.log((new Date).getTime(), (new Date), res.statusCode);
      if (res.statusCode !== 200) {
        callback(true);
        return;
      }

      const b = [];
      res.on('data', (d) => { b.push(d); });
      res.on('end', () => {
        const response = {};
        try {
          Object.assign(response, JSON.parse(Buffer.concat(b).toString()));
        }
        catch (e) {
          callback(true);
          return;
        }

        console.log((new Date).getTime(), (new Date), response);

        if (!response.ApplicationToken) {
          callback(true);
          return;
        }

        this.ApplicationToken = response.ApplicationToken;

        callback();
        return;
      });
    });

    req.end(serializedRequest);
  }

  getAssets(callback) {
    const req = https.request({
      host: 'tlshosted.fleetcomplete.com',
      method: 'GET',
      path: '/MicroService/Assets/v1/api/assets',
      headers: Object.assign({
        'AppToken': this.ApplicationToken,
        'Content-Type': 'application/json;v=1.0',
        'ClientID': this.ClientID,
        'Culture': 'en-US',
        'UserID': this.UserId,
        'User-Agent': this.UserAgent
      }, Header)
    }, (res) => {
      if (res.statusCode !== 200) {
        callback(true);
        return;
      }

      const b = [];
      res.on('data', (d) => { b.push(d); });
      res.on('end', () => {
        try {
          this.assets = JSON.parse(Buffer.concat(b).toString());
        }
        catch (e) {
          callback(true);
          return;
        }
        if (!this.assets || !this.assets.length) {
          callback(true);
        }

        callback();
      });
    });

    req.end();
  }
}

module.exports = Client;
