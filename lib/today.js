/**
 * @method  Today
 * mockable method returning Today's date
 * @returns {Date}
 * @constructor
 */

var _today = new Date();
function Today() {
  return _today;
}
Today.set = function(date) {
  _today = new Date(date);
}
exports.Today = Today;
