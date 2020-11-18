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

// helper functions ====================================
// to sort sightings by category
// and order(ascending or descending) ----------------------------
const sort = (sightings, category, order) => {
  // check order first then category
  if (order === 'asc') {
    if (category === 'shape' || category === 'city') {
      // sort by shape in ascending alphabetical order
      sightings.sort((a, b) => {
        // ignore upper and lowercase
        const aCategory = a[category].toUpperCase();
        const bCategory = b[category].toUpperCase();

        if (aCategory < bCategory) {
          return -1;
        }
        if (aCategory > bCategory) {
          return 1;
        }

        // for both sightings, values in that category are the same
        return 0;
      });
    }
  } else if (order === 'desc') {
    if (category === 'shape' || category === 'city') {
      // sort by shape in descending alphabetical order
      sightings.sort((a, b) => {
        // ignore upper and lowercase
        const aCategory = a[category].toUpperCase();
        const bCategory = b[category].toUpperCase();

        if (aCategory < bCategory) {
          return 1;
        }
        if (aCategory > bCategory) {
          return -1;
        }

        // for both sightings, values in that category are the same
        return 0;
      });
    }
  }
};

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
    response.render('show-sighting', templateData);
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

    // add an index to each sighting so we can use it
    // in the delete request functionality in main-page.ejs and
    // so that sorting will not mess up the sightings' indexes
    data.sightings.forEach((sighting, index) => {
      sighting.index = index;
    });

    // check if there is a query
    if (request.query.sortby) {
      // get the queries
      const category = request.query.sortby;
      const order = request.query.sortOrder;

      // sort sightings by the options in queryArray
      sort(data.sightings, category, order);

      console.log('sorting done!');
    }

    console.log(data.sightings);

    // render the form, pass in the template data
    response.render('main-page', data);
  });
});

// end of functionality for user to display a list (all) of sightings -------------------
// --------------------------------------------------------------------------------------

// start of functionality for user to delete a sighting  ---------------------------------
app.delete('/sighting/:index/delete', (request, response) => {
  console.log('delete request came in');

  const { index } = request.params;

  read('data.json', (data) => {
    // take a thing out of the array
    data.sightings.splice(index, 1);

    write('data.json', data, (doneData) => {
      response.redirect('/');
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

    // add an index key to the sighting so we can use it in edit.ejs
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

// start of functionality to render a list of sighting shapes ------------------------

// render the list of sighting shapes
app.get('/shapes', (request, response) => {
  console.log('get request for list of shapes came in');

  // read the JSON file
  read('data.json', (data) => {
    console.log('done with reading');

    // array to store the shapes of UFOs
    const shapes = [];

    // search for all the UFO shapes in data.json and store them
    data.sightings.forEach((sighting) => {
      // change letter of shape to lower case
      const shapeLowerCase = sighting.shape.toLowerCase();

      // returns true if there is already another of the same shape
      const isThereThisShape = shapes.includes(shapeLowerCase);

      // add shape if it has not been added before
      if (isThereThisShape === false) {
        shapes.push(shapeLowerCase);
      }
    });

    const templateData = { shapes };

    // render the shapes list, pass in the object containing shapes array
    response.render('shapes', templateData);
  });
});
// end of functionality fto render a list of sighting shapes --------------------------
// ------------------------------------------------------------------------------------

// start of functionality to render a list of sightings of a particular shape -------------------

// render the list of sightings of the requested shape
app.get('/shapes/:shape', (request, response) => {
  console.log('get request for list of shapes came in');

  // read the JSON file
  read('data.json', (data) => {
    console.log('done with reading');

    // store the requested shape (in lower caps)
    const requestedShape = request.params.shape;

    // to store sightings that report UFOs of the requested shape
    const sightingsOfRequestedShape = [];

    // filter out the sightings that contain the requested shape
    data.sightings.forEach((sighting, index) => {
      const currentShape = sighting.shape.toLowerCase();

      // if the UFO shape of this sighting is the requested shape
      // add into array of sightings to be displayed
      if (currentShape === requestedShape) {
        sighting.index = index;
        sightingsOfRequestedShape.push(sighting);
      }
    });

    const templateData = { sightingsOfRequestedShape };

    // render the shapes list, pass in the object containing shapes array
    response.render('shapes-filtered', templateData);
  });
});
// end of functionality to render a list of sightings of a particular shape -----------
// ------------------------------------------------------------------------------------

// set the port to listen for requests
app.listen(PORT);
