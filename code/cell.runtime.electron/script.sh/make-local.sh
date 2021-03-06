# 
# Package ("make") the application.
# 
# NOTE: this is a light-weight "make" recipe only:
# 
#   - does not prepre the [node_module] folder (install locally rather than use the "yarn workspace").
#   - does not notarize the application (code-sign).
#   - does not bundle the [app.sys] module.
#   - bump verion: "patch"
# 
yarn cmd prepare make
export NODE_ENV=production
export NOTARIZE=false 

cd A1 
npm version patch
yarn make
