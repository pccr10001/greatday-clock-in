var puppeteer = require("puppeteer");
var Agenda = require("agenda");
var Agendash = require('agendash');
var bodyParser = require('body-parser');
var express = require('express');
const mongoose = require('mongoose');
const TelegramBot = require('node-telegram-bot-api');
var dateFormat = require('dateformat');
const token = process.env.TG_TOKEN;
const chatId = process.env.TG_CH_ID;
if(token == ''){
	bot = {};
	bot.sendMessage = function(){};
}else{
	const bot = new TelegramBot(token, {polling: false});
}


const mongoAgenda = "mongodb://mongo/agenda";

const eightHours = "in 60 minutes in 60 minutes in 60 minutes in 60 minutes in 60 minutes in 60 minutes in 60 minutes in 60 minutes in 60 minutes ";

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function login(company, email, pwd, npwd) {
    try {
        return (await axios.post(company.GOPATHNEW + '/auth/login', {
            username: email,
            password: pwd,
            npwd: npwd,
            ist: process.env.IST,
            keep: true,
            preLoginData: company
        })).data;
    } catch (err) {
        return err.response.data;
    }
}

async function doClock(email, pwd, npwd) {
    var company =
        (await axios.get(
            'https://saas.greatdayhr.com/getAPIConfig?account=' + process.env.IST))
        .data.DATA;

    var l = await login(company, email, pwd, npwd);
    if (l.hasOwnProperty("message")) {
        console.log(l.message);
        return l.message;
    }

    var profile = (await axios.get(company.GOPATHNEW + "/auth/profile", {
        headers: {
            "Authorization": l.id
        }
    })).data.data;
    var uploadReq = new FormData();
    uploadReq.append("file", fs.createReadStream('2021_09_27_12v_Kleki.png'))
    var u = await axios.post('https://apigonbcv2.dataon.com/storage/upload/storageAttendance/'+process.env.IST+'?access_token=' + l.id, uploadReq, {
        headers: uploadReq.getHeaders()
    })

    var clockInReq = {
        empid: profile.empId,
        companyId: profile.companyId,
        "datetime": new Date().toISOString(),
        "geolocation": {
            "latitude": 0,
            "longitude": 0
        },
        "photo": u.data.data.fileName,
        "attOn": "online",
        "address": null
    }

    var clockIn = await axios.post(company.GOPATHNEW + "/attendanceSf6/AddToTemp", clockInReq, {
        headers: {
            "Authorization": l.id
        }
    });

    if (clockIn.data.data.success){
        return true;
    }

}

function getRandomArbitrary(min, max) {
    return Math.ceil(Math.random() * (max - min) + min);
}


function sendNextDay(user, time, done) {
	bot.sendMessage(chatId, "Schedule for "+user.name+" at "+dateFormat(time, "mm/dd HH:MM"));
    done();
}

function sendClockOn(user, time, done) {
    bot.sendMessage(chatId, "Clock on for "+user.name+" and clock off at "+dateFormat(time, "mm/dd HH:MM"));
	done();
}

function sendClockOff(user, done) {
    bot.sendMessage(chatId, "Clock off for "+user.name);
    done();
}

mongoose.connect(mongoAgenda, {
    useNewUrlParser: true
});

var app = express();

const agenda = new Agenda({
    db: {
        address: mongoAgenda
    }
});

var userSchema = new mongoose.Schema({
    email: String,
    password: String,
    npwd: String,
    name: String
});
var User = mongoose.model("User", userSchema);

User.find({}, function (err, users) {
    users.forEach(function (user) {
        agenda.define(user.name + '_clock_out', (job, done) => {
            doClock(user.email, user.password, true);
            sendClockOff(user, done);
        });
        console.log("Job " + user.name + "_clock_out created.");

        agenda.define(user.name + '_clock_in', (job, done) => {
            var min = getRandomArbitrary(1, 30);
            doClock(user.email, user.password, false);
            (async function () {
                var j = await agenda.schedule(eightHours + "in " + min + " minutes", user.name + "_clock_out");
                sendClockOn(user, j.attrs.nextRunAt, done);
            })();

        });
        console.log("Job " + user.name + "_clock_in created.");
    })
});

agenda.define('reschedule_nextday', (job, done) => {
    User.find({}, function (err, users) {
        users.forEach(function (user) {
            var min = getRandomArbitrary(10, 55);
            var jobName = user.name + "_clock_in";
            (async function () {
                var j = await agenda.schedule("at 8:" + min + "am", jobName);
                sendNextDay(user, j.attrs.nextRunAt, done);
            })();
        })
        done();
    });

});

(async function () {
    await agenda.start();

    var jobs = await agenda.jobs({
        name: 'reschedule_nextday'
    });
    if (jobs.length == 0)
        //await agenda.now("reschedule_nextday");
        await agenda.every("0 20 * * 0-4", "reschedule_nextday");
})();

app.use(bodyParser.urlencoded({
    extended: false
}))
app.use(bodyParser.json())

app.use('/dash', Agendash(agenda));
app.listen(3000);

app.post("/cancel", (req, res) => {
    User.findOne({
        email: req.body.email
    }, function (err, user) {
        agenda.cancel({
            name: user.name + "_clock_in"
        });
        agenda.cancel({
            name: user.name + "_clock_out"
        });
        res.send({
            "messages": [{
                "text": "刪除成功"
            }]
        });
    });

});
