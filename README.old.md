# realbadcoin
Toy model cryptocurrency network written in JavaScript with peers communicating over WebRTC

# Installation

First install nvm (for windows, start with https://github.com/coreybutler/nvm-windows/releases),
and then run `nvm install lts` followed by `nvm use ????` (whatever the version of LTS got installed) in an admin terminal.

```bash
# Install npm and deps and browserify
npm install --save

npm install -g browserify
npm install babel-core babel-preset-env babelify --save-dev

# Bundle all the javascript into one chunk that we can include from HTML
npm run build
# not this anymore: browserify lib/main.js > assets/js/bundle.js
```
