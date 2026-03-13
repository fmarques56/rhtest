#!/bin/sh

if [ -n "$LOCAL_WORKSPACE_URL" ]; then
	BASE_URL=$LOCAL_WORKSPACE_URL
else
    BASE_URL=https://$CODESPACE_NAME-8080.$GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN
fi

while true
do
    echo "${BASE_URL}/api/employees"
    curl ${BASE_URL}/api/employees
    curl ${BASE_URL}/api/employees
    curl ${BASE_URL}/api/employees
    curl ${BASE_URL}/api/employee/TEST
    curl ${BASE_URL}/api/employee/UNKNOWN
    curl ${BASE_URL}/api/employee/UNKNOWN
    curl -X POST ${BASE_URL}/api/rechercher -H 'Content-Type: application/json' --data-raw '{"mode": "detailed", "search": {"name": "TEST"}}'
    curl -X POST ${BASE_URL}/api/rechercher -H 'Content-Type: application/json' --data-raw '{"mode": "detailed", "search": {"name": "Unknown"}}'
    curl -X POST ${BASE_URL}/api/ajouter -H 'Content-Type: application/json' --data-raw '{"id":"TEST","name":"TEST","lastname":"Noise","level":"1","salary":"12345"}'
    sleep 1
done