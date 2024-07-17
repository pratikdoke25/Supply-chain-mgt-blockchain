FROM node:14
USER node

RUN cd/home/node/.npm-global
ENV PATH=/home/node/.npm-global/bin:$PATH
ENV NPM_CONFIG_PREFIX=/home/node/.npm-global


EXPOSE 4200
COPY . /client
WORKDIR /client
RUN npm install
CMD [ "npm", "run", "start" ]

# # Stage 2: Serve app with nginx server
# # Use official nginx image as the base image
# FROM nginx:latest

# # Copy the build output to replace the default nginx contents.
# COPY --from=build /usr/local/app/dist/sample-angular-app /usr/share/nginx/html

# # Expose port 80
# EXPOSE 80