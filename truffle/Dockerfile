FROM node:14

USER node

RUN cd/home/node/.npm-global
ENV PATH=/home/node/.npm-global/bin:$PATH
ENV NPM_CONFIG_PREFIX=/home/node/.npm-global


# Install Truffle
RUN npm install -g truffle@5.5.11
RUN npm config set bin-links false

# Move Contract Files
COPY contracts ./truffle/contracts
COPY migrations ./truffle/migrations
COPY truffle-config.js ./truffle/truffle-config.js
WORKDIR /truffle
