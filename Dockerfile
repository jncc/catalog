# Image that both builds and runs the catalog database API.

FROM node:10.15.1

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

EXPOSE 8081
CMD [ "node", "built/api/server.js" ]
