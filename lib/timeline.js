// The MIT License (MIT)
//
// Copyright (c) 2014 Etienne Rossignon
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

/**
 *  @module Timeline : Module to deal with a Kanban Timeline
 */

var assert = require ('assert');

var Today = require("./today").Today;


function _weekday(date) {
  "use strict";
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()];
}

/**
 * @class Date
 * @method weekday
 * @return {String} the three first letters of the week day (in english)
 */
Date.prototype.weekday = function()
{
    return _weekday(this);  
}

/**
 *  find the date working days ago in the past from
 *  ( excluding week-end , but not vacation )
 *
 */
function _working_days_ago(d,working_day_ago, optional_hour_shift) {
  "use strict";
  var r = working_day_ago % 5;
  var w = Math.round( (working_day_ago-r) / 5 );
  var a = w*7+r;

  optional_hour_shift = (optional_hour_shift ? optional_hour_shift : 0);
  
  var nd = new Date(d.getFullYear(), 
                    d.getMonth(),
                    d.getDate() - a,
                    d.getHours() + optional_hour_shift,
                    d.getMinutes() + 0);

  return nd;
}
/**
 * @class Date
 * @method working_days_ago
 * @param working_days_ago {Integer} the number of working day in the past
 * @param optional_hour_shift
 * @return {Date} return a date in the past  matching the number of working days ago
 */
Date.prototype.working_days_ago = function (working_days_ago,optional_hour_shift){
   return _working_days_ago(this,working_days_ago,optional_hour_shift);
};


/**
 * @class Date
 * @param calendar_days
 * @param optional_hour_shift
 * @returns {Date}
 */
Date.prototype.next_day = function(calendar_days,optional_hour_shift) 
{
   calendar_days = calendar_days ? calendar_days : 1;
   optional_hour_shift = (optional_hour_shift  ? optional_hour_shift : 0);

   var d = new Date(this.getFullYear() , 
                    this.getMonth(), 
                    this.getDate(),
                    this.getHours() + optional_hour_shift, 
                    this.getMinutes() );
   d.setDate(d.getDate()+ calendar_days);
   return d;
};

Date.prototype.days_ago = function(calendar_days,optional_hour_shift)
{
   calendar_days = calendar_days ? calendar_days : 1;
   return this.next_day(-calendar_days,optional_hour_shift)
};

// exports.days_ago = _days_ago;
exports.weekday = _weekday;


// from http://snipplr.com/view/4086/
function calcBusinessDays_old(dDate1, dDate2) { // input given as Date objects

    "use strict";
    // turn date to dates
    if (typeof dDate1 === "string" ) {
        dDate1 = new Date(dDate1);
    } 
    if ( typeof dDate2 === "string") {
        dDate2 = new Date(dDate2);
    }
    var iWeeks, iDateDiff, iAdjust = 0;

    if (dDate2 < dDate1) return - calcBusinessDays(dDate2,dDate1); // error code if dates transposed

    var iWeekday1 = dDate1.getDay(); // day of week
    var iWeekday2 = dDate2.getDay();

    iWeekday1 = (iWeekday1 === 0) ? 7 : iWeekday1; // change Sunday from 0 to 7
    iWeekday2 = (iWeekday2 === 0) ? 7 : iWeekday2;

    if ((iWeekday1 > 5) && (iWeekday2 > 5)) iAdjust = 1; // adjustment if both days on weekend

    iWeekday1 = (iWeekday1 > 5) ? 5 : iWeekday1; // only count weekdays
    iWeekday2 = (iWeekday2 > 5) ? 5 : iWeekday2;

    // calculate differnece in weeks (1000mS * 60sec * 60min * 24hrs * 7 days = 604800000)
    iWeeks = Math.floor((dDate2.getTime() - dDate1.getTime()) / 604800000);

    if (iWeekday1 <= iWeekday2) {
        iDateDiff = (iWeeks * 5) + (iWeekday2 - iWeekday1)
    } else {
        iDateDiff = ((iWeeks + 1) * 5) - (iWeekday1 - iWeekday2)
    }

    iDateDiff -= iAdjust; // take into account both days on weekend

    return (iDateDiff + 1); // add 1 because dates are inclusive

}

// from http://snipplr.com/view/4086/
function calcBusinessDays(dDate1, dDate2) { // input given as Date objects

    "use strict";
    // turn date to dates
    if (typeof dDate1 === "string" ) {
        dDate1 = new Date(dDate1);
    } 
    if ( typeof dDate2 === "string") {
        dDate2 = new Date(dDate2);
    }
    if (dDate2 < dDate1) {
       // negative duration if dDate2 < dDate1
 	     return - calcBusinessDays(dDate2,dDate1); 
    }

    var nbWorkingDay = 0;
    var date = new Date(dDate1);

    while (date <= dDate2) {
       if ( date.isWorkingDay() ) { 
         nbWorkingDay +=1;
       }
       date.setDate(date.getDate()+1);
   }
   return nbWorkingDay;
}


function VacationTable()
{
    this._recurrent_vacation_date={};
}

/**
 * @method add_recurrent_vacation_day
 * @param description {String}
 * @param day_in_month {Integer} 1-31
 * @param month 1-12
 */
VacationTable.prototype.add_recurrent_vacation_day = function(description, day_in_month,month) {
    assert(day_in_month >= 1 && day_in_month <= 31);
    assert(month >= 1 && month <= 12);

    this._recurrent_vacation_date[month*100+day_in_month] = "description";

};
VacationTable.prototype.isVacation = function(date) {

    // var year  = date.getFullYear();
    var dow   = date.getDay(); // 0-6 0 Sunday, 6 Saturday
    var month = date.getMonth()+1 ; // 1= Jan => 12 Dec
    var day   = date.getDate(); // 1 -31

    return this._recurrent_vacation_date.hasOwnProperty(month*100+day);
};
exports.VacationTable = VacationTable;


function build_french_vacation_manager(){
    var vm = new VacationTable();
    vm.add_recurrent_vacation_day("1st of Jan"     ,1,1);
    vm.add_recurrent_vacation_day("Fête du travail",1,5);
    vm.add_recurrent_vacation_day("8 Mai"          ,8,5);
    vm.add_recurrent_vacation_day("14 Juillet"     ,14,7);
    vm.add_recurrent_vacation_day("15 Aout"        ,15,8);
    vm.add_recurrent_vacation_day("11 Novembre"    ,11,11);
    vm.add_recurrent_vacation_day("Christmas"      ,25,12);
    vm.add_recurrent_vacation_day("Boxing day"     ,26,12);
    vm.add_recurrent_vacation_day("31 décembre"    ,31,12);


    vm.add_recurrent_vacation_day(" End of July"   ,20,7);
    vm.add_recurrent_vacation_day(" End of July"   ,21,7);
    vm.add_recurrent_vacation_day(" End of July"   ,22,7);
    vm.add_recurrent_vacation_day(" End of July"   ,23,7);
    vm.add_recurrent_vacation_day(" End of July"   ,24,7);
    vm.add_recurrent_vacation_day(" End of July"   ,25,7);
    vm.add_recurrent_vacation_day(" End of July"   ,26,7);
    vm.add_recurrent_vacation_day(" End of July"   ,27,7);
    vm.add_recurrent_vacation_day(" End of July"   ,28,7);
    vm.add_recurrent_vacation_day(" End of July"   ,29,7);
    vm.add_recurrent_vacation_day(" End of July"   ,30,7);
    vm.add_recurrent_vacation_day(" End of July"   ,31,7);

    vm.add_recurrent_vacation_day(" August"        ,1,8);
    vm.add_recurrent_vacation_day(" August"        ,2,8);
    vm.add_recurrent_vacation_day(" August"        ,3,8);
    vm.add_recurrent_vacation_day(" August"        ,4,8);
    vm.add_recurrent_vacation_day(" August"        ,5,8);
    vm.add_recurrent_vacation_day(" August"        ,6,8);
    vm.add_recurrent_vacation_day(" August"        ,7,8);
    vm.add_recurrent_vacation_day(" August"        ,8,8);
    vm.add_recurrent_vacation_day(" August"        ,9,8);
    vm.add_recurrent_vacation_day(" August"        ,10,8);
    vm.add_recurrent_vacation_day(" August"        ,11,8);
    vm.add_recurrent_vacation_day(" August"        ,12,8);
    vm.add_recurrent_vacation_day(" August"        ,13,8);
    vm.add_recurrent_vacation_day(" August"        ,14,8);

    return vm;
}


var default_vacationTable = build_french_vacation_manager();
exports.installVacationManager =function(vm) {
    var old_vacationTable = default_vacationTable;
   // assert(vm instanceof VacationTable);
    default_vacationTable = vm;
    return old_vacationTable;
};

function _isWeekEnd(date) {
    var dow = date.getDay(); // 0-6 0 Sunday, 6 Saturday
    return (dow===0) || (dow===6);
}

VacationTable.prototype.isBridgeDay = function(date)
{
    // this is not a week end date
    if (_isWeekEnd(date))   return false;
    if (this.isVacation(date))  return false;
    var yesterday = date.days_ago(1);
    var tomorrow  = date.next_day(1);
//    var day_before_yestarday = date.days_ago(2);
//    var day_after_tomorrow  = date.next_day(2);
  
    if (this.isVacation(yesterday)  && _isWeekEnd(tomorrow))
         return true;
    if (this.isVacation(tomorrow)   && _isWeekEnd(yesterday) )
         return true; // for instance    Sun - Mon - Thu
    return false;
}

VacationTable.prototype.isWorkingDay = function(date)
{
  if (_isWeekEnd(date))       { return false;}
  if (this.isVacation(date))  { return false;}
  if (this.isBridgeDay(date)) { return false;}
  return true;
};



Date.prototype.isWeekEnd       = function()  { return _isWeekEnd(this);    }
Date.prototype.isBridge        = function()  { return default_vacationTable.isBridgeDay(this);  }
Date.prototype.isWorkingDay    = function()  { return default_vacationTable.isWorkingDay(this); }
Date.prototype.isVacation      = function()  { return default_vacationTable.isVacation(this);   }

//xx Date.prototype.isNonWorkingDay = function()  { return !_isWorkingDay(this); }

function calculateNumberOfNonBusinessDays(startDate, numBusinessDays) {
     // thanks stack overflow!
     // http://stackoverflow.com/questions/1534804/how-can-i-add-business-days-to-the-current-date-in-java
     // console.log(" startDate =", startDate," nbBusiness Days = ",  numBusinessDays) ;
    var cal       = new Date(startDate);
    var weekend   = 0;
    var vacations = 0;
    var bridge    = 0;

    if (numBusinessDays === 0 ) { 
        var res =  { 'weekend':weekend, 'vacations': vacations , 'bridge':bridge , 'end_date': cal};
        return res;
    }

    function creep() {
       while(!cal.isWorkingDay()) {
         
          if (cal.isWeekEnd()) {
            weekend+=1;
          } else if (cal.isBridge() ) {
            bridge +=1;
          } else if (cal.isVacation()) {
            vacations +=1;
          } 
          cal = cal.next_day(1);
       }
       assert(cal.isWorkingDay(), " Creep " + cal + "should be working day");
    }

    creep(); // move to next working day or stay at current date
    assert(cal.isWorkingDay(), cal + "should be working day");

    for(var i = 0; i <numBusinessDays-1; i++) {
       cal = cal.next_day(1);  // move to tommorow
       creep(cal); // .. and creep to next working day
    }
    var res =  { 'weekend':weekend, 'vacations': vacations , 'bridge':bridge , 'end_date': cal};
//    console.log(JSON.stringify(res));
    assert( cal.isWorkingDay(), " cal " + cal + " Should be a working day ("+numBusinessDays+")"+JSON.stringify(res));
    return res;

  }



/**
 * Calculates the number of calendar days
 * between two dates
 */
function diffDate (d1,d2 ) {

    d1 = new Date(d1);
    d2 = new Date(d2);

    // remove the time portion, set the dates to midnight
    // d1.setHours(0,0,0,0);
    // d2.setHours(0,0,0,0);
    var diff = Math.ceil((d2.getTime() - d1.getTime()) / 86400000);
    return (diff >= 0 ) ? diff + 1 : diff - 1;
}

/**
 *  calculate the date which is nb_business_day
 *  after the refDate
 *  this method takes into account weekend , vacations and bridges
 */
function _addBusinessDay(refDate,nb_business_day) {

    var b = calculateNumberOfNonBusinessDays(refDate,nb_business_day);

    var d1 = refDate.next_day(nb_business_day+ b.weekend + b.vacations + b.bridge-1);

    return d1;
}

Date.prototype.addBusinessDay = function(nb_business_day) {

   return _addBusinessDay(this,nb_business_day);
};

Date.prototype.removeBusinessDay = function(nb_business_day) {
  
   var d  = new Date(this);
   for (var i=0;i<nb_business_day;i++) {
     while (!d.isWorkingDay()) {
      	d = d.days_ago(1);
     }
     d = d.days_ago(1);
   }
   while (!d.isWorkingDay()) {
      	d = d.days_ago(1);
   }
   return d;
};


function build_time_line_raw(startDate,endDate) {
    "use strict";
    var timeline = [];

    if (!endDate) endDate = Today(); // TODAY

    for (var i = 0; i < 220; i++) {
        var d = new Date(startDate);
        d.setDate(d.getDate() + i);
        // avoid week ends
        if (d.getDay() >= 1 && d.getDay() <= 5) {
            timeline.push(new Date(d));
        }
        if (d >= endDate) break;
    }
    return timeline;
}


/**
 * @method  build_time_line
 * @param   startDate {Date}
 * @param   startDate {endDate}
 * @return {Array<Date>}
 * create a time line starting at startDate or next closest working day if startDate is  not a working date
 * and excluding vacations and week-ends
 */
function build_time_line(startDate,endDate) {
    "use strict";
    var timeline = [];

    endDate =new Date( endDate || Today());

    var current_date = new Date(startDate);
    if (endDate.getTime() < current_date.getTime()) {
        throw new Error("Invalid endDate < startDate in build_time_line endDate=" + endDate + " startDate=" + startDate);
    }
    // find first working day preceding startDate
    // if start date is not a working day
    while(!current_date.isWorkingDay()) {
        current_date = current_date.days_ago(1);
    }

    for (var i = 0; i<=1001 ; i++) {
        if (i>=1000) { throw new Error("Timeline too large !!!"); }
        // avoid week ends
        if (current_date.isWorkingDay()) {
            timeline.push(current_date);
        }
        current_date = current_date.next_day(1);
        if (current_date.getTime() > endDate.getTime()) break;
    }
    return timeline;
}




exports.calcBusinessDays = calcBusinessDays;
exports.calculateNumberOfNonBusinessDays = calculateNumberOfNonBusinessDays
exports.diffDate         = diffDate;
exports.build_time_line  = build_time_line;   
