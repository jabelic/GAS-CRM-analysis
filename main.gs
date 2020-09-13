/* getting data from 'sheet', output data to ‘sheet2'.*/
var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[2];
var sheet2 = SpreadsheetApp.getActiveSpreadsheet().getSheets()[3];
var sheet3 = SpreadsheetApp.getActiveSpreadsheet().getSheets()[4];


function setID() {
  const FValues = sheet.getRange('A:A').getValues();　 //B列の値を全て取得
  const LastRow = FValues.filter(String).length;　　//空白の要素を除いた長さを取得
  var userIDs = sheet.getRange(2, 1, LastRow, 1).getValues();
  var userIDs = Object.values(userIDs);
  //const transpose = a => a[0].map((_, c) => a.map(r => r[c]));
  //transpose(userIDs);
  var userIDs = Array.prototype.concat.apply([],userIDs).map(Number);
  var setIDs = new Set(userIDs);
  var setIDs = [...setIDs];
  var setIDs = setIDs.sort(compareNumbers);
  //console.log(setIDs);
  return setIDs;
}

function compareNumbers(a, b) {
  return a - b;
}

/* sheetからデータを取得. key: userID, value: 購入date */
function getData(){
  const FValues = sheet.getRange('C:C').getValues();　 //C列の値を全て取得
  const LastRow = FValues.filter(String).length;　　//空白の要素を除いた長さを取得
  var idData = sheet.getRange(2, 1, LastRow, 1).getValues();
  var dateData = sheet.getRange(2, 3, LastRow, 1).getValues();
  var idData = Object.values(idData);
  var dateData = Object.values(dateData);
  var data = concatTwoDimensionalArray(idData, dateData, 1);
  data.sort(function(a,b){return(new Date(a[1]) - new Date(b[1]));});
  data.sort(function(a,b){return(a[0] - b[0]);});
  /* dataはkeysに'indexnum', valuesに配列['num', 'data']をもつ. */
  //console.log(data)
  return data;
}


function concatTwoDimensionalArray(array1, array2, axis){
  if(axis != 1) axis = 0;
  var array3 = [];
  if(axis == 0){  //　縦方向の結合
    array3 = array1.slice();
    for(var i = 0; i < array2.length; i++){
      array3.push(array2[i]);
    }
  }
  else{  //　横方向の結合
    for(var i = 0; i < array1.length; i++){
      array3[i] = array1[i].concat(array2[i]);
    }
  }
  return array3;
}


/* UserID and purchase date */
function collection(){
  const setIDList = setID();
  var allData = getData();
  var linkingData = {};
  for(var i=0; i < allData.length; i++){
    if(linkingData[allData[i][0]] === undefined){
      linkingData[allData[i][0]] = new Array();
      linkingData[allData[i][0]].push(allData[i][1])
    }else{
      linkingData[allData[i][0]].push(allData[i][1]);
    }
  }
  //console.log(linkingData);
  return linkingData;
}

/* collecting the Number of purchases by users. : sheet2*/
function numOfPurch(){
  const linkingData = collection();
  var purch = {};
  for(const index in linkingData){
    if (linkingData[index].length in purch){
      purch[linkingData[index].length] += 1;
    }else{
      purch[linkingData[index].length] = 1;
    }
  }
  console.log(purch);
  for(var i=0; i < Object.keys(purch).length; i++){
    sheet2.getRange(i+1,1).setValue(Object.keys(purch)[i]);
    sheet2.getRange(i+1,2).setValue(Object.values(purch)[i]);
　}
  const reducer = (accumulator, currentValue) => accumulator + currentValue;
  const num = Object.values(purch).reduce(reducer);
  const oneTime = Object.values(purch)[0];
  const prob = (num - oneTime)/oneTime * 100;
  //console.log(prob);
  sheet2.getRange(1, 4).setValue("購入継続者率");
  sheet2.getRange(2, 4).setValue(prob + "%");
  return purch;
}

/* 初回購入月ごとの次回購入月のデータlist */
function repeatCust(){
  const linkingData = collection();
  const setDate = {};
  for (const [key, value] of Object.entries(linkingData)){
    if (value[0] in setDate){
      setDate[value[0]] = setDate[value[0]].concat(value);
    }else{
      setDate[value[0]] = [];
      setDate[value[0]] = setDate[value[0]].concat(value);
    }
  }
  //console.log(setDate);
  return setDate;
}


/* 行と列を入力 */
function drawPivodTable(){
  /* setValueで日付を入れるときに-1dayされてしまうので、1月前の2日に設定しておく */
  const dateInit = new Date(2018, 1, 1);
  var latestDate = new Date();
  var numOfMonths = (latestDate.getFullYear() - dateInit.getFullYear())*12 + latestDate.getMonth() - dateInit.getMonth();
  var eventDate = [];
  for (var i=0; i < numOfMonths+1; i++){
    var tmp = new Date(2018, 1, 1); 
    tmp.setMonth(tmp.getMonth() + i);
    eventDate.push(tmp);
  }
  //console.log(eventDate);
  
  /* sheet3にデータのindex, columnをoutput */
  
  var last_row = sheet3.getLastRow();
  var start_row = 1;
  var start_col = 2;
  //var num_rows = eventDate.length;
  var num_rows = 1;
  var num_cols = eventDate.length;
  var range = sheet3.getRange(start_row, start_col, num_rows, num_cols);
  range.setValues([eventDate]);
  //console.log([eventDate]);

  var last_row = sheet3.getLastRow();
  var start_row = 2;
  var start_col = 1;
  var indexDate = [];
  for (var i = 0; i < eventDate.length; i++){
    indexDate.push([eventDate[i]]);
  }
  //console.log(indexDate);
  var num_rows = eventDate.length;
  var num_cols = 1;
  var range = sheet3.getRange(start_row, start_col, num_rows, num_cols);
  range.setValues(indexDate);
  return eventDate;
}

/* sheet3に記入されたindex, columnに合わせて適当な数を入力 */
function plotData(){
  let setDate = repeatCust(); // key: dateInit, value: date

  /* 各行に当てはめる配列を月数ぶんに揃えて、カウント数を当てはめる (e.g. [10,4,2,1,0,1,0,....])*/
  var eventDate = drawPivodTable();
  const dateInit = new Date(2018, 1, 1);
  const latestDate = eventDate[eventDate.length - 1];
  console.log(latestDate);
  var numOfMonths = (latestDate.getFullYear() - dateInit.getFullYear())*12 + latestDate.getMonth() - dateInit.getMonth() + 1;
  console.log(numOfMonths);
  var outputIndexCount = 2;
  var indexNum = 0; // keyのdateを参照したい
  
  var setDatekeys = [];
  for (var item of Object.keys(setDate)){
    var tempDate = new Date(item);
    tempDate.setHours(0.0);
    setDatekeys.push(tempDate);
  }
  setDatekeys.sort(function(a,b){return(new Date(a) - new Date(b));});

  /* key: dateInit, value: dates のオブジェクトをkeyでソート */
  const obj = {};
  Object.keys(setDate).sort().forEach(key => obj[key] = setDate[key]);
  delete obj[""];
  //var setDatekeys = Object.keys(obj).map(x => (new Date(x)).setHours(0));
  //var setDatekeys = Object.keys(obj)
  //console.log(obj);
  const tmpdateInit = new Date(2018,1,1);
  //console.log(setDatekeys);

  /* 先にindexを登録しておいたほうがよさそう */
  console.log(Object.keys(obj)); // '2018-03', '2018-06',...
  //console.log(Object.values(obj));

  /* indexのdateを文字列に変換(YYYY-MM)*/
  var indexvalList = [];
  indexvalList.push('2018-01');
  for(var item of Object.values(eventDate)){
    var tmp = getStringFromDate(item);
    indexvalList.push(tmp);
  }
  indexvalList.pop();
  console.log(indexvalList);


  var indexbinaryList = new Array(numOfMonths)
          .fill(null)
          .map((_, i) => 0);;
  for(var i = 0 ; i < indexvalList.length; i++){
    for(const item of Object.keys(obj)){
      if (item == indexvalList[i]){
        indexbinaryList[i] = 1;
      }
    }
  }
  console.log(indexbinaryList);

  /* 2行目から1行ずつ処理 */
  for(var i = 0; i < numOfMonths; i++){
    var tmpEachDateCounts = new Array(numOfMonths)
        .fill(null)
        .map((_, i) => 0);
    
    //console.log(tmpdateInit.setFullYear(2018+ Math.floor((i+1)/12),i%11));
    console.log(setDatekeys.includes((new Date(tmpdateInit.setFullYear(2018+ Math.floor(i/12),i%12))).getTime()));

    //if(setDatekeys.includes(tmpdateInit.setFullYear(2018+ Math.floor((i+1)/12),i%11))){
    if(indexbinaryList[i] == 1){
      console.log(setDatekeys.indexOf(tmpdateInit.setFullYear(2018+ Math.floor((i+1)/12),i%11)));
      console.log(tmpdateInit.setFullYear(2018+ Math.floor((i+1)/12),i%11));
      var tmpSetDate = Object.entries(obj);
      tmpSetDate[indexNum][1].sort(function(a,b){return(new Date(a) - new Date(b));});
      //console.log(tmpSetDate);
      console.log(tmpSetDate[indexNum][1]);
      tmpSetDate[indexNum][1].forEach(function(item){
        item = new Date(item);
        var eachindexnum = (item.getFullYear() - dateInit.getFullYear())*12 + item.getMonth() - dateInit.getMonth() + 1;
        //console.log(eachindexnum);
        tmpEachDateCounts[eachindexnum] += 1;
      })
      indexNum += 1;
    }
    var start_row = outputIndexCount;
    var start_col = 2;
    var num_rows = 1;
    var num_cols = tmpEachDateCounts.length;
    var range = sheet3.getRange(start_row, start_col, num_rows, num_cols);
    range.setValues([tmpEachDateCounts]);
    outputIndexCount += 1;
  }
  console.log(indexNum);
  return 0;
}


/* indexのdateを文字列に変換(YYYY-MM)、*/
function getStringFromDate(date) {
 
 var year_str = date.getFullYear();
 //月だけ+1すること
 var month_str = 1 + date.getMonth();
 var day_str = date.getDate();
 //var hour_str = date.getHours();
 //var minute_str = date.getMinutes();
 //var second_str = date.getSeconds();

 month_str = ('0' + month_str).slice(-2);
 day_str = ('0' + day_str).slice(-2);
 ///hour_str = ('0' + hour_str).slice(-2);
 //minute_str = ('0' + minute_str).slice(-2);
 //second_str = ('0' + second_str).slice(-2);
 
 //format_str = 'YYYY-MM-DD hh:mm:ss';
 format_str = 'YYYY-MM';
 format_str = format_str.replace(/YYYY/g, year_str);
 format_str = format_str.replace(/MM/g, month_str);
 //format_str = format_str.replace(/DD/g, day_str);
 //format_str = format_str.replace(/hh/g, hour_str);
 //format_str = format_str.replace(/mm/g, minute_str);
 //format_str = format_str.replace(/ss/g, second_str);
 return format_str;
};






/*
function setCellColor(){
  const dateInit = new Date(2018, 1, 1);
  var latestDate = new Date();
  var numOfMonths = (latestDate.getFullYear() - dateInit.getFullYear())*12 + latestDate.getMonth() - dateInit.getMonth();
  var start_row = 2;
  var start_col = 2;
  //var num_rows = eventDate.length;
  var num_rows = 1;

  var num_cols = numOfMonths;
  var range = sheet3.getRange(start_row, start_col, num_rows, num_cols).getValues();
  var maxNumofrange = Math.max(range);
  var colnum = 0
  for(const item of range[0]){
    var cell = sheet3.getRange(start_row, start_col, num_rows, num_cols + colnum);
    var red = item/maxNumofrange
    cell.setBackground('${red}, 0, 0');
    colnum += 1;
  }
}*/



/* for cohort */
function initEndData(){
  const linkingData = collection();
  const setIDList = setID();
  var pivodData = {};
  for(const index in linkingData){
    if(pivodData[linkingData[index][0]] === undefined){
      pivodData[linkingData[index][0]] = new Array();
      pivodData[linkingData[index][0]].push(linkingData[index][linkingData[index].length-1]);
    }else{
      pivodData[linkingData[index][0]].push(linkingData[index][linkingData[index].length-1]);
    }
  }
  return pivodData;
}




function outputData(){
  const pivodData = initEndData();
  console.log(Object.keys(pivodData));
  var indexDate = {};
  for (var i=0; i < numOfMonths+1; i++){
    var tmp = new Date(2018, 1, 1); 
    tmp.setMonth(tmp.getMonth() + i);
    //eventDate.push(tmp);
    indexDate[tmp] = [];
  }
  /*for (const [key, value] of Object.entries(pivodData)){
    
  }*/
}


