FROM node:latest

# Create app working directory
RUN mkdir /opt/groundwire/node/tradingapi
WORKDIR /opt/groundwire/node/tradingapi

# Install app dependencies
COPY package.json /opt/groundwire/node/tradingapi
RUN npm install

# Bundle app source
COPY . /opt/groundwire/node/tradingapi

EXPOSE 3000
CMD ["npm", "start"]