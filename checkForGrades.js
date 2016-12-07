//NIGHTMARE BEFORE CHRISTMAS GRADE CHECKER

/* eslint-env node, browser*/
/* eslint no-console:0 */

var Nightmare = require('nightmare'),
    fs = require("fs");
var vo = require('vo');
require("nightmare-xpath");
var orgUnits = ["64229", "10011"]; //Diddy's sandbox, JAM's sandbox
var authData = JSON.parse(fs.readFileSync("./auth.json"));
var selector = '#z_b'
var results[];
vo(run)(function (err, result) {
    if (err) throw err
})

function* run() {
    //SPAWN NIGHTMARE, LOG IN, GET TO HOME PAGE
    var nightmare = Nightmare({
        show: true,
        typeInterval: 20,
        /*openDevTools: {
            mode: 'detach'
        },*/
        alwaysOnTop: false,
        waitTimeout: 20 * 60 * 1000
    });
    yield nightmare
        .goto('https://byui.brightspace.com/d2l/login?noredirect=1')
        .type("#userName", authData.username)
        .type("#password", authData.password)
        .click("a.vui-button-primary")
        .wait(function () {
            //go to d2l home
            console.log("Waiting");
            return document.location.href === "https://byui.brightspace.com/d2l/home";
        })
        .catch(function (error) {
            console.error(error);
        });
    //GRAB THE GRADE TABLES
    for (var i = 0; i < orgUnits.length; i++) {
        var unit = orgUnits[i];
        var associations = yield nightmare
            .goto("https://byui.brightspace.com/d2l/lms/grades/admin/manage/gradeslist.d2l?ou=" + unit)
            .wait(function (unit) {
                console.log("Waiting");
                return document.location.href === "https://byui.brightspace.com/d2l/lms/grades/admin/manage/gradeslist.d2l?ou=" + unit;
            }, unit)
            .wait('#z_b') //Wait for the grade-item table to load
            .xpath("//img[contains(@alt, 'Association Information')]", function (node) {
                return {
                    href: node.href,
                    innerText: node.innerText
                };
            })
        console.log("Found %d Grade Associations", associations.length, "in Unit", unit);
        results.push("Found %d Grade Associations", associations.length, "in Unit", unit);
        console.log(results);
    }
    yield nightmare.end()
}