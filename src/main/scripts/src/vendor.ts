// Angular
import '@angular/platform-browser';
import '@angular/platform-browser-dynamic';
import '@angular/core';
import '@angular/common';
import '@angular/http';
import '@angular/router';
import '@angular/forms';
import '@angular/animations';

// Font Awesome
require('./font-awesome/font-awesome-core.css');
require('./font-awesome/font-awesome-brands.css');
require('./font-awesome/font-awesome-solid.css');
require('./font-awesome/font-awesome-regular.css');
require('./font-awesome/font-awesome-light.css');

import './js/custom.js';

import 'socket.io-client';
import 'angular2-drag-scroll';
import 'angular2-notifications';
import 'ngx-perfect-scrollbar';
import 'ng2-webstorage';

window['Minigrid'] = require('../node_modules/minigrid/dist/minigrid.min.js');
window['Keycloak'] = require('./js/keycloak.js');
