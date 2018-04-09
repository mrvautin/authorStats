# authorStats

Fetch the daily/weekly/monthly download stats for all your NPM packages/modules and print to a pretty unicode table.

## Installation

```
# npm install author-stats -g
```

## Usage

```
# authorStats <npm username>
```

Where `<npm username>` is the username on the NPM website. My profile is: `https://www.npmjs.com/~mrvautin` and username is `mrvautin`.

A nice command line table with the daily, weekly and monthly download numbers of all your packages will be output to your terminal.

## Options

### -s (sort)

The `-s` or `--sort` flag and column name will sort the table.

```
authorStats <npm username> -s name
```

> Possible values: `name`, `day`, `week`, `month`, `dependants`

### -o (order)

The `-o` or `--order` flag and direction will sort the table in the desired order.

```
authorStats <npm username> -o asc
```

> Possible values: `asc`, `desc`

![authorStats](https://raw.githubusercontent.com/mrvautin/mrvautin.github.io/master/images/authorStats/exampleoutput.png "authorStats output")