import express from 'express';
import methodOverride from 'method-override';
import { add, read, write } from './jsonFileStorage.js';

// create an express application
const app = express();

// set the port number
const PORT = 3004;

// set the view engine to ejs
app.set('view engine', 'ejs');

// config to accept request form data
app.use(express.urlencoded({ extended: false }));

// override with POST having ?_method=PUT (in edit.ejs)
app.use(methodOverride('_method'));

// config to allow use of public folder
app.use(express.static('public'));

// Routes =============================================================

// start of functionality for user to create a new recipe by filling up a form ------------

// render the form (sighting.ejs) that will create the request
app.get('/sighting', (request, response) => {
  response.render('sighting');
});

// accept form request and add the new sighting to data.json
// 1st param: the url that the post request is coming from
// 2nd param: callback to execute when post request is made
app.post('/sighting', (request, response) => {
  console.log('request body', request.body);

  // add an element to the sightings array in data.json
  add('data.json', 'sightings', request.body, (data, error) => {
    // check for errors
    if (error) {
      response.status(500).send('sorry could not add data to file');
      return;
    }

    // send back an acknowledgement
    response.send('(POST) added new sighting!');
  });
});

// set the port to listen for requests
app.listen(PORT);
