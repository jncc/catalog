FROM node:10.15.1

# Create app directory
WORKDIR /usr/src/app

RUN apt update && apt -y upgrade && \
    apt -y install python3-pip && \
    ln -s /usr/bin/pip3 /usr/bin/pip && \
    ln -sf /usr/bin/python3 /usr/bin/python && \
    pip install sphinx sphinx-autobuild && \
    npm i -g typescript yarn

COPY app .

RUN yarn install && \
    yarn build 
    
    # && \
    # mkdir -p /app/built && \
    # cp -r ./built/ /app/built/ && \
    # cp ./package.json /app 
    
    # && \
    # rm -rf /usr/src/app

# # Install app dependencies
# # A wildcard is used to ensure both package.json AND package-lock.json are copied
# # where available (npm@5+)
# COPY package*.json ./
# #ADD api api

# RUN npm install

# # Bundle app source
# ADD built built

# # Copy log rotation script
# COPY config/etc/logrotate.d/application/application.logrotate /etc/logrotate.d/application


ENV NODE_ENV production

EXPOSE 8081
CMD [ "node", "built/api/server.js" ]
