#!/bin/bash

BASE_PATH=${HOME}/acychart/

BASE_URL=https://docs.google.com/spreadsheets/d/
EXTENSION_URL='/export?format=csv&id='

ACTUAL_ID='1dJ-Rbj_tpUabys9fQ8cY4c-uk70rjqmAp1NylTjKoic'
ACTUAL_FILENAME='actual.csv'


PROJECTED_ID=16Ms8sXjnHcmTPtoQgTjNZKZvFXviXRKu7mvWLMpnBcs
PROJECTED_FILENAME='projected.csv'

PROJECTED_URL=${BASE_URL}${PROJECTED_ID}${EXTENSION_URL}${PROJECTED_ID}
ACTUAL_URL=${BASE_URL}${ACTUAL_ID}${EXTENSION_URL}${ACTUAL_ID}

PROJECTED_PATH=${BASE_PATH}${PROJECTED_FILENAME}
ACTUAL_PATH=${BASE_PATH}${ACTUAL_FILENAME}

curl -o $ACTUAL_PATH $ACTUAL_URL
curl -o $PROJECTED_PATH $PROJECTED_URL
