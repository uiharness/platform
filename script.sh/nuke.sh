echo Nuke
pwd
echo

rm -rf node_modules
rm -rf code/*/node_modules

rm -f yarn.lock
rm -f code/*/yarn.lock

cd code/cell.modules && yarn nuke && cd ../../
cd code/cell.runtime.electron && yarn nuke && cd ../../
cd code/cell.service && yarn nuke && cd ../../
cd code/cell.router && yarn clean && cd ../../
