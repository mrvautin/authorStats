#!/usr/bin/env node

var commander = require('commander');
var cheerio = require('cheerio');
var async = require('async');
var cliTable = require('cli-table');
var request = require('request');
var cliSpinner = require('cli-spinner').Spinner;
var async = require('async');
var colors = require('colors');
var pkg = require('./package.json');

// get the package version from the package.json file
var version = pkg.version;

// setup commander
commander
    .version(version)
    .usage('<username>')
    .parse(process.argv)

// get the author arg
var author = commander.args;

// check author arg has been specified and throw error
if(author == ""){
    commander.outputHelp(make_red);
    return;
}

// build the output table headers
var table = new cliTable({
    head: [colors.cyan('Name'), colors.cyan('Daily Downloads'), colors.cyan('Weekly Downloads'), colors.cyan('Monthly Downloads')]
});

// start a new spinner
var spinner = new cliSpinner('%s');
spinner.setSpinnerString('|/-\\');
spinner.start();

// get the npm packages from the npm user page
request('https://www.npmjs.com/~' + author, function (err, response, npmAuthor) {
    // Only proceed if the author exists and 200 https status code is returned
    if (!err && response.statusCode == 200) {
        // load the npm package html
        var $ = cheerio.load(npmAuthor);
        
        // get the package list
        var packages = $('.collaborated-packages li a');

        async.each(packages, function(item, callback) {
            getPackageHtml('https://www.npmjs.com' + item.attribs.href, function(err, npmPackage){
                $ = cheerio.load(npmPackage);
                var dailyDownloads = $('.daily-downloads').text();
                var weeklyDownloads = $('.weekly-downloads').text();
                var monthlyDownloads = $('.monthly-downloads').text();
                var packageName = item.attribs.href.replace('/package/','');
                
                // push stats into CLI table
                table.push(
                    [colors.red(packageName), dailyDownloads, weeklyDownloads, monthlyDownloads]
                );
                
                callback(null);
            });
        }, function(err) {
        if (err) {
            // output the error
            console.log('\n');
            return console.error("ERROR: " + err);
            spinner.stop();
        }
            // output the tale and stop the spinner
            console.log('\n');
            console.log(table.toString().green);
            spinner.stop();
        });
    }else{
        // request to NPM received a 404 - meaning author is not found
        console.log('\n');
        console.error("ERROR: Author not found. Check author username and try again.");
        spinner.stop(true);
        return;
    }
});

// get NPM package html
var getPackageHtml = function(url, callback) {
   request(url, function(err, response, html) {
        if(err){
            callback(err, null);
        }else{
            callback(null, html);
        }
    });
}

// make the help text red
function make_red(txt) {
    return colors.red(txt); //display the help text in red on the console 
}