# MemeGenerator

Share jokes with your team!  Visit http://ucfpawn.dyndns.info:3010/ for a demo

## Requirements

You need a mongodb database and nodejs.

## Installing

First, install the dependencies:

```
npm install
```

Then, make a copy of the example options and set them based on your scenario:

```
cp options_example.json options.json
emacs options.json
```

Then, execute this line to launch the server:

```
node server/server.js --optionsFile=options_ucfpawn.json | ./node_modules/.bin/bunyan
```
