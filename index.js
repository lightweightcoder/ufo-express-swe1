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

// helper function to sort sightings by date (ascending or descending ) ----------------------------
// const sortDataByDate = () => {

// };

// end of functionality for user to sort sightings by date  ---------------------------------

// Routes =============================================================

// start of functionality for user to create a new sighting by filling up a form ------------

// render the form (sighting.ejs) that will create the request
app.get('/sighting', (request, response) => {
  response.render('sighting');
});

// accept form request and add the new sighting to data.json
// 1st param: the url that the post request is coming from
// 2nd param: callback to execute when post request is made
app.post('/sighting', (request, response) => {
  // add an element to the sightings array in data.json
  add('data.json', 'sightings', request.body, (data, error) => {
    // check for errors
    if (error) {
      response.status(500).send('sorry could not add data to file');
      return;
    }

    // get the index of the new sighting
    const lastIndex = data.sightings.length - 1;

    // redirect the webpage to newly created sighting
    response.redirect(`/sighting/${lastIndex}`);
  });
});

// end of functionality for user to create a new sighting by filling up a form ----------
// --------------------------------------------------------------------------------------

// start of functionality for user to display a single sighting -------------------------

app.get('/sighting/:index', (request, response) => {
  // read the data.json file
  read('data.json', (data) => {
    console.log('done with reading');

    // get the index param
    const { index } = request.params;

    // get out the sighting
    const sighting = data.sightings[index];

    // store sighting in an object
    const templateData = { sighting };

    // render the form, pass in the template data
    response.render('show', templateData);
  });
});

// end of functionality for user to display a single sighting -------------------------
// ------------------------------------------------------------------------------------

// start of functionality for user to display a list (all) of sightings -----------------

app.get('/', (request, response) => {
  console.log('request to render list of sightings came in');

  // read the data.json file
  read('data.json', (data) => {
    console.log('done with reading');

    // render the form, pass in the template data
    response.render('main-page', data);
  });
});

// end of functionality for user to display a list (all) of sightings -------------------
// --------------------------------------------------------------------------------------

// start of functionality for user to delete a sighting  ---------------------------------
app.delete('/sighting/:index/delete', (request, response) => {
  const { index } = request.params;

  read('data.json', (data) => {
    // take a thing out of the array
    data.sightings.splice(index, 1);

    write('data.json', data, (doneData) => {
      response.send('done deleting! Go to http://localhost:3004/ to go back to the main page');
    });
  });
});

// end of functionality for user to delete a sighting ------------------------------------
//----------------------------------------------------------------------

// start of functionality for user to edit a sighting  ---------------------------------
// render the form (edit.js) that will edit the sighting
app.get('/sighting/:index/edit', (request, response) => {
  console.log('edit request came in');

  // read the JSON file
  read('data.json', (data) => {
    console.log('done with reading');

    // get the index param
    const { index } = request.params;

    // get out the sighting
    const sighting = data.sightings[index];

    // add an index key to the recipe so we can use it in edit.ejs
    sighting.index = index;

    // put sighting (as a key-value pair) into an object
    const templateData = { sighting };

    // render the form, pass in the sighting
    response.render('edit', templateData);
  });
});

// set the route that will accept a request to edit the sighting
app.put('/sighting/:index/edit', (request, response) => {
  const { index } = request.params;

  read('data.json', (data) => {
    // completely replace the sighting obj of the coressponding index here
    data.sightings[index] = request.body;

    write('data.json', data, (doneData) => {
      // redirect the webpage to newly created sighting
      // note: nodemon will not work because it will cause
      // the server to reload when data.json is modified
      response.redirect(`/sighting/${index}`);
    });
  });
});

// end of functionality for user to edit a sighting  ---------------------------------
// -----------------------------------------------------------------------

// set the port to listen for requests
app.listen(PORT);
