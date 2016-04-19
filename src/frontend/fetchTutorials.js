/* global fetch */
module.exports = function(callback) {
  console.log("Fetch tutorials.");
  fetch('/getListOfTutorials', {
    credentials: 'same-origin'
  })
      .then(function(data) {
        return data.json();
      }).then(function(tutorialPaths) {
        console.log("Obtaining list of tutorials successful: " + tutorialPaths);
        callback(0, tutorialPaths);
      }).catch(function(error) {
        console.log("There was an error obtaining the list of " +
        "tutorial files: " + error);
      });
};
