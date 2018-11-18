const jwt = require('../components/jwt.js');
const fetch = require('../components/fetch.js');
const onfido = require('../components/onfido.js');
const userModel = require('../models/user.js');

// gets the jwt for a given acocunt
function post_applicant(req, res) {
    const bearer = req.headers.authorization.split(" ")
    const token = bearer[1];
    jwt.jwt_decode(token)
    .then((data) => {
        const applicant_id = data.onfido_id;
        const referrer = '*://*/*'
        const sdk_token = {
            url: 'https://api.onfido.com/v2/sdk_token',
            method: 'POST',
            headers: {'Authorization': `Token token=${process.env.ONFIDO_TOKEN}`},
            body: {applicant_id, referrer}
        }
        return fetch.fetch_data(sdk_token)
    })
    .then((jwt) => {
        res.status(200).json({data: true, kyc_token: jwt.token})
    })
    .catch((err) => {
        res.status(400).json({data: false})
    })
}

// Fired from within the dashboard when the user selects start application
function get_applicant(req, res) {
    const bearer = req.headers.authorization.split(" ")
    const token = bearer[1];
    let email;
    jwt.jwt_decode(token)
    .then((data) => {
        email = data.email; 
        return onfido.create_applicant()
    })
    .then((data) => {
        const onfido_id = data;
        const onfido_status = 'started';
        const newData = {onfido_status, onfido_id};
        const query = {email};
        userModel.findOneAndUpdate(query, newData, {upsert:true}, (err, doc) => {
            if (!err){
                const email = doc.email;
                const mongo_id = doc.mongo_id
                const onfido_status = doc.onfido_status
                const newjwt = jwt.jwt_sign({email, mongo_id, onfido_status, onfido_id});
                res.status(200).json({data: true, token: newjwt, onfido_status:'started'})
            } else {
                res.status(400).json({data: false})
            }
        });
    })
    .catch((err) => {
        res.status(400).json({data: false})
    })
}

function get_check(req, res) {
    const bearer = req.headers.authorization.split(" ")
    const token = bearer[1];
    jwt.jwt_decode(token)
    .then((data) => {
        const onfido_id = data.onfido_id;
        const type = 'express';
        const reports = [{ name: 'document' }, { name: 'facial_similarity' }, {name: 'identity', variant:'kyc'}, {name: 'watchlist', variant:'full'}];
        const sdk_token = {
            url: `https://api.onfido.com/v2/applicants/${onfido_id}/checks`,
            method: 'POST',
            headers: {'Authorization': `Token token=${process.env.ONFIDO_TOKEN}`, 'Accept': 'application/json', 'Content-Type': 'application/json'},
            body: {type, reports}
        }
        console.log(sdk_token);
        return fetch.fetch_data(sdk_token)
    })
    .then((data) => {
        console.log('--------report')
        console.log(data)
    })
}

function post_webhook(req, res){
    console.log(req)
    res.status(400).json({status: 200})
}

module.exports = { post_applicant, get_applicant, get_check, post_webhook};


