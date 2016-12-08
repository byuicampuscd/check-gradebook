//NIGHTMARE BEFORE CHRISTMAS GRADE CHECKER

/* eslint-env node, browser*/
/* eslint no-console:0 */

var Nightmare = require('nightmare'),
    fs = require("fs");
var vo = require('vo');
require("nightmare-xpath");
require('nightmare-helpers')(Nightmare);
var d3 = require('d3-dsv');
var orgUnits = ["64229", "10011"]; //Diddy's sandbox, JAM's sandbox "64229", "10011"
var authData = JSON.parse(fs.readFileSync("./auth.json"));

vo(run)(function (err, result) {
    if (err) throw err
})

function* run() {
    var results = [];
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
        .inject("javascript", "./jquery.js")
        .wait(1000)
        .evaluate(function () {

            $("body > *").css({
                visibility: "hidden",
                position: "absolute",
                "margin-left": "-10000px"
            });
            //            var instructions = $("<p id='instructions'>Please add the organization units that you would like to check for grade associations. When you have added all of the courses you wish to search, please enter your log-in information to begin the check.</p>");
            var username = $("<input>", {
                type: "text",
                placeholder: "username",
                id: "usernamethinggy"
            });
            var password = $("<input>", {
                type: "password",
                placeholder: "password",
                id: "passwordthinggy"
            });
            //            var courseinput = $("<input>", {type:"courseunit", placeholder:"org-unit", id:"orgunitthingy"});
            //            var addcourse = $("<button>ADD COURSE</button>", {value:"addcourse", id:"add"});
            var done = $("<button>SUBMIT</button>", {
                value: "submit",
                id: "done",
                "data-flag": "not sure"
            });
            //            var courses = ("<p id='coursesToAdd'>Courses that will be searched:</p>");
            //            var remove = $("<button class='remove'>-</button>")
            done.click("click", function () {
                $("#userName").val(username.val());
                $("#password").val(password.val());
                $(this).attr("data-flag", "sure")
            });
            //            addcourse.click("click", function(){
            //                //TODO: ADD COURSE ID TO ORGUNITS
            //                orgUnits.push(courseinput.val());
            //				$("#coursesToAdd").append("<div>" + courseinput.val() + " </div>");
            //                $("#coursesToAdd div:last-child").append(remove.clone(true));
            //			});
            //            remove.click("click", function(){
            //                $(this).parent().remove();
            //			});
            //            $("html").append(instructions);
            //            $("html").append(courseinput);
            //            $("html").append(addcourse);
            //            $("html").append("<br>");
            $("html").append(username);
            $("html").append(password);
            $("html").append(done);
            //            $("html").append(courses);
        })
        .setWaitTimeout(5, 0, 0)
        .wait("button[data-flag=\"sure\"]")
        .click("a.vui-button-primary")
        .wait(1000)
        .waitURL("https://byui.brightspace.com/d2l/home")
        .catch(function (error) {
            console.error(error);
        });

    //CHECK VALUE OF ORGUNITS
    console.log(orgUnits);
    //GO CHECK THE COURSES
    for (var i = 0; i < orgUnits.length; i++) {
        var unit = orgUnits[i];
         var associations = [];
        var totalgrades = [];
        yield nightmare
            .goto("https://byui.brightspace.com/d2l/lms/grades/admin/manage/gradeslist.d2l?ou=" + unit)
            .wait(function (unit) {
                console.log("Waiting");
                return document.location.href === "https://byui.brightspace.com/d2l/lms/grades/admin/manage/gradeslist.d2l?ou=" + unit;
            }, unit)
            .wait('#z_b') //Wait for the grade-item table to load
            .evaluate(function () {
                return document.evaluate("//img[contains(@alt, 'Association Information')]",document,null, XPathResult.ANY_TYPE, null);
            })
            .then(function (result) {
                console.log(result);
                associations = result;
                console.log(associations);
            })
            .then(function () {
                return nightmare.evaluate(function () {
                    return document.evaluate("//input[@class='d_chb' and contains(@title, 'Select') ]",document,null, XPathResult.ANY_TYPE, null);
                })
            })
            .then(function (results) {
                console.log(results);
                totalgrades = results;
                console.log(totalgrades);
            })

        console.log("Found %d Grade Associations", associations.length, "out of", totalgrades.length, "grade items in Unit", unit);

        results.push({
            unit: unit,
            associations: associations.length
        });
    }
    yield nightmare.end()
        //SAVE RESULTS OF SCRAPE
    fs.writeFile("results.csv", d3.csvFormat(results), function (err) {
        if (err) throw err
    });
}

// .xpath("//img[contains(@alt, 'Association Information')]", function (node) {
//                return {
//                    href: node.href,
//                    innerText: node.innerText
//                };
//            })
//        var totalgrades = yield nightmare
//            .xpath("//input[@class='d_chb' and contains(@title, 'Select) ]", function (node) {
//                return {
//                    href: node.href,
//                    innerText: node.innerText
//                };
//            })
