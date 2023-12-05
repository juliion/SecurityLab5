const uuid = require('uuid');
const express = require('express');
const onFinished = require('on-finished');
const bodyParser = require('body-parser');
const path = require('path');
const port = 3000;
const fs = require('fs');
const cookieParser = require('cookie-parser');
const axios = require('axios');
const querystring = require('querystring');
const { auth } = require('express-oauth2-jwt-bearer');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

const domain = 'https://dev-tftmuns7ezis58as.us.auth0.com';
const clientId = 'bJeCbmjniw3NbfLqnuHSjAzl7tjO6Shu';
const clientSecret = 'vnJMxf-n6Cx3B7cmYTf4jaMtBnEiyyQQznsxRI_WVEcVBoyYwfLvW8h96v-j-GJ5';
const audience = 'https://dev-tftmuns7ezis58as.us.auth0.com/api/v2/';

const checkJwtMiddleware = auth({
    audience: audience,
    issuerBaseURL: domain,
});

const userInfoMiddleware = (req, res, next) => {
    const access_token = req.cookies?.access_token;
    axios.get(`${domain}/userinfo/`, {
        headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json',
        },
    }).then((response) => {
        req.user = response.data;
        next();
    }).catch((error) => {
        next();
    });
};

// app.use((req, res, next) => {

//     console.log(access_token);
//     axios.get(`${domain}/userinfo`, {
//         headers: {
//             'Authorization': `Bearer ${access_token}`
//         }
//     }).then((response) => {
//         req.user = response.data;
//         next();
//     }).catch(() => {
//         next();
//     });
// });


app.get('/userinfo', checkJwtMiddleware, userInfoMiddleware, (req, res) => {
    if (req.user) {
        return res.json({
            email: req.user.email,
            logout: 'http://localhost:3000/logout'
        });
    }

    res.sendFile(path.join(__dirname+'/index.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname+'/index.html'));
});

app.get('/logout', (req, res) => {
    res.clearCookie('access_token');
    res.redirect('/');
});


app.post('/api/login', (req, res) => {
    const { login, password } = req.body;
    const body = {
        grant_type: 'http://auth0.com/oauth/grant-type/password-realm',
        username: login,
        password: password,
        scope: 'offline_access openid profile email read:current_user update:current_user_metadata',
        client_id: clientId,
        client_secret: clientSecret,
        realm: 'Username-Password-Authentication',
        audience: audience,
    };

    axios.post(`${domain}/oauth/token`, querystring.stringify(body)).then((response) => {
        const accessToken = response.data.access_token;
        res.cookie('access_token', accessToken, { httpOnly: false });
        res.json({ access_token: accessToken });
    }).catch(() => {
        res.status(401).send('Unauthorized');
    });
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
