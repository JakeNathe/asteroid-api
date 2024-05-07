// Setup
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const PORT = process.env.PORT || 3000;
const app = express ();
app.use(express.json());


// running confirmation
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}...`);
});


/**
 * Retrieves a list of astroids that match the given request criteria (date range and distance from Earth).
 */
app.post('/asteroids', (req, res) => {
    // verify input
    if (!req.body.dateStart || !isValidDate(req.body.dateStart) || !req.body.dateEnd || !isValidDate(req.body.dateEnd) || !req.body.within.value || req.body.within.value < 0) {
        // bad request
        res.status(400).send({'error': true});
        return;
    };
    // deconstruct json request parameters
    const startDate = req.body.dateStart;
    const endDate = req.body.dateEnd;
    const distance = req.body.within.value;

    // get the requested data from NASA API
    const url = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${startDate}&end_date=${endDate}&api_key=${process.env.API_KEY}`

    axios.get(url)
        .then(astroidData => {
            // filter data in another function then return the result
            const result = filterData(astroidData.data, distance);
            res.send(result);
        }).catch(error => {
            res.status(500).send({'error': true})
        });

});


/**
 * @param data is json data returned from the NASA API call. Cointains info for astroids over a specific date range.
 * @param distance is the filter variable for astroids. Looks for astroids that passed within {distance} of Earth.
 * @returns a list of astroid names that meet the distance constraint as an object: {astroids: [ast1, ast2, ast3 ...]}
 */
function filterData(data, distance) {
    const result = { asteroids: [] };
    
    // filter though each date in json data object
    Object.keys(data.near_earth_objects).forEach(date => {
        // then filter through each asteroid item
        data.near_earth_objects[date].forEach(item => {
            // if the asteroid's distance from Earth is less than distance parameter, add astroid's name to the result
            const kmMissDist = parseFloat(item.close_approach_data[0].miss_distance.kilometers);
            if (kmMissDist < distance) {
                result.asteroids.push(item.name);
            };
        });
    });

    return result;
};


/**
 * @param date validates date is in yyyy-mm-dd format
 */
function isValidDate(date) {
    var regEx = /^\d{4}-\d{2}-\d{2}$/;
    return date.match(regEx) != null;
}