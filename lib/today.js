/**
 * @method  Today
 * mockable method returning Today's date
 * @returns {Date}
 * @constructor
 */

var _today = new Date("2012/12/01");
function Today() {
  return _today;
}
Today.set = function(date) {
  _today = new Date(date);
}
exports.Today = Today;
