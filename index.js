#!/usr/bin/env node

const commander = require('commander');
const async = require('async');
const cliTable = require('cli-table');
const cliSpinner = require('cli-spinner').Spinner;
const registry = require('npm-registry');
const colors = require('colors');
const _ = require('lodash');
const pkg = require('./package.json');

// get the package version from the package.json file
const version = pkg.version;

// setup commander
commander
    .version(version)
    .usage('<username>')
    .option('-s, --sort <item>', 'Sort by column name')
    .option('-o, --order <item>', 'Sort by column order (asc, desc)')
    .parse(process.argv);

// get the author arg
let author = commander.args[0];

// check author arg has been specified and throw error
if(author === ''){
    commander.outputHelp(make_red);
    process.exit(1);
}

// Check sorting option
let sortBy;
if(commander.sort){
    sortBy = commander.sort;
}
// Validate sort
const valid_columns = [
    'name',
    'day',
    'week',
    'month',
    'dependants'
];
// If sortby value not valid
if(commander.sort && !valid_columns.includes(sortBy)){
    console.error(colors.red(`ERROR: Sort column is not valid. Pleease use: ${valid_columns.join(', ')}`));
    process.exit(1);
}

// Check order option
let orderBy = '';
if(commander.order){
    orderBy = commander.order;
}
// Validate sort
const orderby_values = [
    'asc',
    'desc'
];
// If sortby value not valid
if(commander.order && !orderby_values.includes(orderBy)){
    console.error(colors.red(`ERROR: Order column is not valid. Pleease use: ${orderby_values.join(', ')}`));
    process.exit(1);
}

// build the output table headers
let table = new cliTable({
    head: [
        colors.cyan('Package name'),
        colors.cyan('Daily Downloads'),
        colors.cyan('Weekly Downloads'),
        colors.cyan('Monthly Downloads'),
        colors.cyan('Dependants')
    ]
});

// start a new spinner
const spinner = new cliSpinner('%s');
spinner.setSpinnerString('|/-\\');
spinner.start();

const npm = new registry({
    registry: 'https://registry.npmjs.org'
});

npm.users.list(author.toString(), (err, userPackages) => {
    if(err || userPackages.length === 0){
        console.log('\n');
        console.error(colors.red('ERROR: Author not found or no packages. Check author username and try again.'));
        spinner.stop(true);
        process.exit(1);
    }

    const tableObject = [];

    async.each(userPackages, (pkg, callback) => {
        Promise.all([
            getDownloads('last-day', pkg.name),
            getDownloads('last-week', pkg.name),
            getDownloads('last-month', pkg.name),
            getDependants(pkg.name)
        ])
        .then(([lastDay, lastWeek, lastMonth, dependants]) => {
            tableObject.push(
                {
                    name: pkg.name,
                    lastDay: lastDay[0].downloads,
                    lastWeek: lastWeek[0].downloads,
                    lastMonth: lastMonth[0].downloads,
                    dependants: dependants.length || 0
                }
            );
            callback(null);
        })
        .catch((err) => {
            console.log('\n');
            console.error(colors.red('ERROR: Could not fetch packages. Please try again.'));
            spinner.stop(true);
            process.exit(1);
        });
    }, (err) => {
        if(err){
            // output the error
            console.log('\n');
            spinner.stop();
            console.error(colors.red('ERROR: ' + err));
            process.exit(1);
        }

        // Setup the sorting
        switch(sortBy){
            case'name':
                sortBy = 'name';
                break;
            case'day':
                sortBy = 'lastDay';
                break;
            case'week':
                sortBy = 'lastWeek';
                break;
            case'month':
                sortBy = 'lastMonth';
                break;
            case'dependants':
                sortBy = 'dependants';
                break;
            default:
                sortBy = 'lastMonth';
                break;
        };

        const sortedPackages = _.sortBy(tableObject, sortBy);
        if(orderBy === '' || orderBy === 'desc'){
            sortedPackages.reverse();
        }

        console.log('\n');
        let totalDay = 0;
        let totalWeek = 0;
        let totalMonth = 0;
        let totalDependants = 0;
        sortedPackages.forEach((pkg) => {
            table.push([
                colors.red(pkg.name),
                colors.yellow(pkg.lastDay),
                colors.yellow(pkg.lastWeek),
                colors.yellow(pkg.lastMonth),
                colors.yellow(pkg.dependants)
            ]);
            totalDay += pkg.lastDay;
            totalWeek += pkg.lastWeek;
            totalMonth += pkg.lastMonth;
            totalDependants += pkg.dependants;
        });

        // Push totals
        table.push([
            colors.green('Totals'),
            colors.green(totalDay),
            colors.green(totalWeek),
            colors.green(totalMonth),
            colors.green(totalDependants)
        ]);

        // output the table and stop the spinner
        console.log(table.toString().green);
        spinner.stop();
    });
});

// make the help text red
function make_red(txt){
    return colors.red(txt); // display the help text in red on the console
}

function getDownloads(period, pkg){
    return new Promise((resolve, reject) => {
        npm.downloads.totals(period, pkg, (err, data) => {
            if(err){
                reject(err);
            }
            resolve(data);
        });
    });
};

function getDependants(pkg){
    return new Promise((resolve, reject) => {
        npm.packages.depended(pkg, (err, data) => {
            if(err){
                reject(err);
            }
            resolve(data);
        });
    });
};
