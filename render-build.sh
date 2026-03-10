#!/usr/bin/env bash
#exit on error

set -o errexit
#Install dependencies

npm install
# Uncomment this line if you need to build your project
#npm run build
#Ensure the Puppeteer cache directory exists

PUPPETEER_CACHE_DIR=/opt/render/.cache/puppeteer
mkdir -p $PUPPETEER_CACHE_DIR
#Install Puppeteer and download Chrome

npx puppeteer browsers install chrome

#Move directory where puppeteer cache is
mv /opt/render/project/src/.cache/puppeteer/chrome/ $PUPPETEER_CACHE_DIR