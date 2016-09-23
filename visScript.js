var vis = {
	selector: $('#userid'),
	uniqueUserIDs: [],
	uniqueURLs: {},
	userIntention: {},
	userURLStats: {},
	averageIntention: {'KS':0, 'PS':0, 'ML':0, 'NA':0},
	queryData: {},
	selectData: {},
	operationData: {},
	clickData: {},
	allOperationsByUserId: {},
	queryFilter: null,
	userFilter: null,
	colorHashForQueries: {
		'KS' : '#66ccff',
		'ML' : '#C0C0C0',
		'NA' : '#ffcccc',
		'PS' : '#AA845C',
		'Clicks': '#008C00'
	},
	colorHashForOperations: {
		'target_clicked' : '#83365c',
		'scroll_down' : '#ff543a',
		'scroll_up' : '#ffd13a',
		'select' : '#0b333f'
	},
	timeRange: 1,
	clicksCount: 0,
	annotationsArray: [],

	loadCSVs: function() {
		this.loadOperationData();
		this.loadQueryData();
		this.loadClickData();
		this.loadSelectData();
	},
	loadOperationData: function() {
		d3.csv('data/class_operation.csv', function(error, queryData) {
			vis.operationData = queryData;
			
		});
	},
	loadQueryData: function() {
		d3.csv('data/class_query.csv', function(error, queryData) {
			vis.queryData = $.extend(true, {}, queryData);
		});
	},
	loadClickData: function() {
		d3.csv('data/class_click.csv', function(error, queryData) {
			vis.clickData = $.extend(true, {}, queryData);
		});
	},	
	loadSelectData: function() {
		d3.csv('data/class_select.csv', function(error, queryData) {
			vis.selectData = $.extend(true, {}, queryData);
		});
	},
	getUniqueUserIDs: function() {
		for (var key in vis.allOperationsByUserId) {
			vis.uniqueUserIDs.push(key)
 		}
 		vis.uniqueUserIDs.sort();
		var selector = document.getElementById('userid');
		for (var i = 0; i < vis.uniqueUserIDs.length;  i++) {
		    var currentOption = document.createElement('option');

		    currentOption.text = vis.uniqueUserIDs[i];
		    selector.appendChild(currentOption);
		    selector.addEventListener('change', vis.filterByUserID, false);
		}
		//console.info("uniqueUserIDs", uniqueUserIDs);
 	},
 	newBuildVis: function(traces) {
 		var data = traces;
		var layout = {
			title: 'Operations Chart for ' + vis.userId,
			hovermode: 'closest',
			barmode: 'stack',
			barstackgap: 2,
			gridwidth: 2,
			height: 700,
			width: 800,
			xaxis: {
				title: 'Number of operations',
		  		tickfont: {
			  		size: 8,
			  		color: 'rgb(107, 107, 107)'
				},
				showticklabels : true
			},
		  	yaxis: {
		  		title: 'Unique URLs visited by user',
		  		tickfont: {
			    	size: 8,
			    	color: 'rgb(107, 107, 107)'
				},
				showticklabels: false
			},
			//annotations: vis.annotationsArray,
			showlegend: false
		};

		$('#urlplot').html('');
		Plotly.newPlot('urlplot',data, layout);
		$('#legendViz2').show();
		$('html, body').animate({
        	scrollTop: $("#urlplot").offset().top
    	}, 2000);
 	},

 	buildVis: function(traces) {
 		var data = traces;
		var layout = {
			title: 'Intention and Follow-up Clicks Chart',
			hovermode: 'text',
			barmode: 'stack',
			barstackgap: 2,
			gridwidth: 2,
			xaxis: {
				title: "Intention+No. of clicks following each query",
		  		tickfont: {
			  		size: 7,
			  		color: 'rgb(107, 107, 107)'
				},
				showticklabels : false
			},
		  	yaxis: {
		  		title: "Queries made by user",
		  		tickfont: {
			    	size: 7,
			    	color: 'rgb(107, 107, 107)'
				},
				showticklabels: false
			},
			showlegend: false
		};

		$('#barplot').html('');
		Plotly.newPlot('barplot',data, layout);
		$('#legendViz1').show();
 	},
 	filterByQueryType: function() {
 		vis.queryType = document.getElementById('queryType').value;
 		if (vis.queryType == 'All' || vis.queryType == 'null') {
 			vis.queryType = null;
 		}
 		vis.filteredVis();
 	},
 	filterByUserID: function() {
 		vis.userId = document.getElementById('userid').value;
 		if (vis.userId == 'null') {
 			$('#viz2').hide();
 			vis.userId = null;
 		}
 		else {
 			$('#viz2').show();
 		}
 		vis.filteredVis();
 	},
 	filterByClicksCount: function() {
 		vis.clicksCount = document.getElementById('clickSlider').value;
 		$('#sliderValue').html(vis.clicksCount);
 		vis.filteredVis();
 	},
 	filterByQuestion: function() {
 		vis.questionFlag = document.getElementById('questionFlag').checked;
 		vis.filteredVis();
 	},
 	visOperation: function() {
 		var userId = vis.userId;
 		if (userId) {
 			console.log(userId);
	 		for (var row in vis.operationData) {
	 			var uid = vis.operationData[row].u_id;
	 			var url = vis.operationData[row].url;
	 			var timestamp = (Number)(vis.operationData[row].timestamp);
	 			var operation = vis.operationData[row].operation;
	 			if (uid == userId) {
	 				if (!vis.userURLStats[userId]) {
	 					vis.userURLStats[userId] = {};					
	 				}
	 				if (!vis.userURLStats[userId][url]) {
	 					vis.userURLStats[userId][url] = {};
	 					vis.userURLStats[userId][url]['timestamp'] = [];
	 					vis.userURLStats[userId][url]['operation'] = [];
	 				}
	 				vis.userURLStats[userId][url]['timestamp'].push(timestamp);
	 				vis.userURLStats[userId][url]['operation'].push(operation);
	 			}
	 		}

	 		var timeSpentArray = [];
	 		var daysVisitedArray = [];
	 		var tagsArray = [];
	 		var traceCount = 0;
	 		var urlCount = 0;
	 		var curUserOperationsListByUrl = {};
	 		vis.annotationsArray = [];
	 			//[ url {opType: 'click', timeTaken: '', doneTimes: 4}....]

	 		for (var key in vis.userURLStats[userId]) {
	 			//When all ops are created add to curUserOperationsList with url as key.

	 			urlCount++;
	 			var url = key;
	 			var curUrlForUser = vis.userURLStats[userId][url];
	 			curUserOperationsListByUrl[url] = [];
	 			// Create an array to hold all events for that url;

	 			var curUserOperationsList = curUserOperationsListByUrl[url];
	 			var op_type = '';
	 			var timeTaken = 0;
	 			var doneTimes = 1;
	 			var prevOpType = '';
	 			var prevOpTimestamp = 0;
	 			var totalTimeSpent = 0;

	 			for (var i=0; i< curUrlForUser.operation.length; i++) {
	 				//Loop through ops and form units of ops based on no. of times called.
	 				
	 				var curOpType = curUrlForUser.operation[i];
	 				var curOpTimestamp = curUrlForUser.timestamp[i];
	 				// Newly added: 

	 				if (i == 0) {
	 					timeTaken = 0;
	 					doneTimes = 1;
	 					prevOpType = curOpType;
	 					prevOpTimestamp = curOpTimestamp;
	 				} else {
	 					if (prevOpType === curOpType) {
	 						//Same operation repeated. Just increment values.
	 						timeTaken += (curOpTimestamp - prevOpTimestamp);
	 						// Newly added: 
	 						totalTimeSpent += timeTaken;
	 						prevOpTimestamp = curOpTimestamp;
	 						doneTimes++;
	 						if (i === curUrlForUser.operation.length-1) {
	 							//Last element in loop. So create Obj Here.
	 							var opObj = {
		 							opType: prevOpType,
		 							doneTimes: doneTimes,
		 							timeTaken: timeTaken
		 						};
		 						curUserOperationsList.push(opObj);
	 						}
	 					} else {
	 						//Here the operation continity ends.
	 						//So create an object and append to curUserOperationsObj array
	 						var opObj = {
	 							opType: prevOpType,
	 							doneTimes: doneTimes,
	 							timeTaken: timeTaken
	 						};
	 						curUserOperationsList.push(opObj);

	 						//Now reset values.
	 						timeTaken = 0;
	 						doneTimes = 1;
	 						prevOpType = curOpType;
	 						prevOpTimestamp = curOpTimestamp;

	 					}
	 				}
	 				if (curUserOperationsList.length > traceCount) {
	 					traceCount = curUserOperationsList.length;
	 				}
	 			}
	 			timeSpentArray.push(Math.round(totalTimeSpent/(1000*60)));
	 		}
	 		//console.log(timeSpentArray);
			/*
	 			Whichever URL has most ops, that many traces.
	 			Each trace :
	 				YArray - Unique URL Counter elements
	 				XArray - No. of times operation done
	 		*/

	 		var opsTraces = []; //Will have a length of traceCount.
	 		var counterNew = 0;
	 		for (var urlY in curUserOperationsListByUrl) {
	 			//console.log(urlY);
	 			var urlObj = curUserOperationsListByUrl[urlY];
	 			var annotationX = 0;
	 			var xArray = [], yArray = [], colorArray = [], textArray = [];
	 			if (urlObj.length > 0) {
	 				for (var ctr =0; ctr< urlObj.length; ctr++) {
	 					xArray.push(urlObj[ctr].doneTimes);
	 					// Newly added: console.log(tagsArray[counterNew] + " for " +  timeSpentArray[counterNew]);
		 				yArray.push(urlY);
		 				textArray.push(urlObj[ctr].doneTimes + urlObj[ctr].opType + "'s");
		 				// Newly added: textArray.push(tagsArray[counterNew] + " for " +  timeSpentArray[counterNew]);
		 				colorArray.push(vis.colorHashForOperations[urlObj[ctr].opType])	
	 				}
 				 
	 				for (var ctr=0; ctr<xArray.length; ctr++) {
	 					annotationX += urlObj[ctr].doneTimes; 
	 				}
 				var result = {
 					x: annotationX+1,
 					y: urlY,
 					text: timeSpentArray,
 					xanchor: 'center',
 					yanchor: 'bottom',
 					showarrow: false
 				}
 				vis.annotationsArray.push(result);
 				//console.log(annotationsArray);
	 				
	 			}
	 			counterNew++;
	 			var traceNew = {
	 				x: xArray,
					y: yArray,
					text: textArray,
					name: 'Event',
					orientation: 'h',
					hoverinfo: 'text',
					marker: {
						color: colorArray,
						width: 2
					},
					type: 'bar'
				}
				opsTraces.push(traceNew);
	 		}
	 		vis.newBuildVis(opsTraces);
	 	}
 	},
 	filteredVis: function() {
 		var userId = vis.userId;
 		var queryType = vis.queryType;
 		var clicksCount = vis.clicksCount;
 		console.log("clicksCount", clicksCount);
 		var xArrayForQueries = [];
		var yArrayForQueries = [];
		var textArrayForQueries = [];
		var colorsForQueries = [];
		var xArrayForClicks = [];
		var yArrayForClicks = [];
		var textArrayForClicks = [];
		var colorsForClicks = [];
		vis.visOperation();
		if (userId) {
			for (var key in vis.queryData) {
				var uid = vis.queryData[key].u_id;
				if (uid === userId) {
					if ((!queryType || (queryType && queryType == vis.queryData[key].intention))
							&& vis.queryData[key].clickCounter >= clicksCount) {
						var intention = vis.queryData[key].intention;
						if (!vis.questionFlag || (vis.questionFlag && vis.queryData[key].question)) {
							xArrayForQueries.push(20);
							yArrayForQueries.push("Query - " + key);
							textArrayForQueries.push(vis.queryData[key].intention);
							colorsForQueries.push(vis.colorHashForQueries[intention]);
							if (vis.queryData[key].clickCounter > 0) {
								xArrayForClicks.push(vis.queryData[key].clickCounter * 3);
								yArrayForClicks.push(vis.queryData[key].keyName);
								var text = vis.queryData[key].intention + " by " + vis.queryData[key].u_id + "  <br> " +
											 vis.queryData[key].clickCounter + " clicks";
								textArrayForClicks.push(text);
							}
						}						
					}
				}
				
			}
			var trace1 = {
					x: xArrayForQueries,
					y: yArrayForQueries,
					text: textArrayForQueries,
					name: 'Queries By User:' + userId,
					orientation: 'h',
					hoverinfo: 'text',
					marker: {
						color: colorsForQueries,
						width: 1
					},
					type: 'bar'
				};
			var trace2 = {
				x: xArrayForClicks,
				y: yArrayForClicks,
				text: textArrayForClicks,
				hoverinfo: 'text',
				name: 'Follow-up Clicks',
				orientation: 'h',
				marker: {
					color: 'rgba(0, 140, 0,0.6)',
					width: 1,
					size: 20
				},
				type: 'bar'
			};
			var traces = [trace1, trace2];
			vis.buildVis(traces);

		} else {
			for (var key in vis.queryData) {
				var uid = vis.queryData[key].u_id;
				if ((!queryType || (queryType && queryType == vis.queryData[key].intention))
					&& vis.queryData[key].clickCounter >= clicksCount) {
					if (!vis.questionFlag || (vis.questionFlag && vis.queryData[key].question)) {
						var intention = vis.queryData[key].intention;
						xArrayForQueries.push(20);
						yArrayForQueries.push("Query - " + key);
						textArrayForQueries.push(vis.queryData[key].intention);
						colorsForQueries.push(vis.colorHashForQueries[intention]);
						if (vis.queryData[key].clickCounter > 0) {
							xArrayForClicks.push(vis.queryData[key].clickCounter * 3);
							yArrayForClicks.push(vis.queryData[key].keyName);
							var text = vis.queryData[key].intention + " by " + vis.queryData[key].u_id + "  <br> " +
										 vis.queryData[key].clickCounter + " clicks";
							textArrayForClicks.push(text);
						}
					}
				}
			}
			var trace1 = {
					x: xArrayForQueries,
					y: yArrayForQueries,
					text: textArrayForQueries,
					name: 'Queries By User',
					orientation: 'h',
					marker: {
						color: colorsForQueries,
						width: 1
					},
					type: 'bar'
				};
			var trace2 = {
				x: xArrayForClicks,
				y: yArrayForClicks,
				text: textArrayForClicks,
				name: 'Follow-up Clicks',
				orientation: 'h',
				marker: {
					color: 'rgba(0, 140, 0,0.6)',
					width: 1,
					size: 20
				},
				type: 'bar'
			};
			var traces = [trace1, trace2];
			vis.buildVis(traces);
		}
 	},
 	generateColor: function(str) {
		var hash = 0;
	    for (var i = 0; i < str.length; i++) {
	       hash = str.charCodeAt(i) + ((hash << 5) - hash);
	    }
    	var c = (hash & 0x00FFFFFF)
        	.toString(16)
        	.toUpperCase();
		return "00000".substring(0, 6 - c.length) + c;
	},
	startVis: function() {
		console.log("All Data loaded");

		var xArrayForQueries = [];
		var yArrayForQueries = [];
		var textArrayForQueries = [];
		var colorsForQueries = [];
		var xArrayForClicks = [];
		var yArrayForClicks = [];
		var textArrayForClicks = [];
		var colorsForClicks = [];
		var userIdsForClicks = [];
		var userIdsForQueries = [];

		for (var key in vis.queryData) {
			var uid = vis.queryData[key].u_id;
			xArrayForQueries.push(20);
			vis.queryData[key].keyName = 'Query - ' + key;
			vis.queryData[key].clickCounter = 0;
			//Plotly compounds values in duplicate keys. Hence resolution.
			yArrayForQueries.push("Query - " + key);
			var intention = vis.queryData[key].intention;
			textArrayForQueries.push(vis.queryData[key].intention);
			colorsForQueries.push(vis.colorHashForQueries[intention]);
			userIdsForQueries.push(uid);
			if (!vis.allOperationsByUserId[uid]) {
				var color = vis.generateColor(uid);
				var obj = {
					queries: [],
					clicks: [],
					selects: [],
					others: [],
					color: '#' + color
				};
				obj.queries.push(vis.queryData[key]);
				vis.allOperationsByUserId[uid] = obj;
			} else {
				vis.allOperationsByUserId[uid].queries.push(vis.queryData[key]);
			}
		}
		vis.getUniqueUserIDs();
		
		//Go through each user and assign click data and counters
		for (var key in vis.clickData) {
			var currentClick = vis.clickData[key];
			if (currentClick.target.indexOf('questions/ask') > -1) {
				currentClick.question = true;
			}
			var uid = currentClick.u_id;
			if(vis.allOperationsByUserId[uid]) {
				vis.allOperationsByUserId[uid].clicks.push(currentClick);
			}			
		}

		for (var user in vis.allOperationsByUserId) {
			var curUser = vis.allOperationsByUserId[user];
			var queries = curUser.queries;
			var clicks = curUser.clicks;

			for (var i = 0; i < queries.length; i++) {
				var curQueryForUser = queries[i];
				for (var clickPointer in clicks) {
					//console.log(((Number)(clicks[clickPointer].timestamp) - (Number)(curQueryForUser.timestamp)) / 3600000);
					//console.log(clicks[clickPointer], curQueryForUser);
					var withinAnHour = (((Number)(clicks[clickPointer].timestamp) - (Number)(curQueryForUser.timestamp)) / 3600000) <= 1;
					var beforeNextQuery = true;
					if (queries[i+1] && ((Number)(queries[i+1].timestamp) > (Number)(queries[i].timestamp))) {
						beforeNextQuery = ((Number)(clicks[clickPointer].timestamp) > (Number)(curQueryForUser.timestamp)) &&
									((Number)(clicks[clickPointer].timestamp) < (Number)(queries[i+1].timestamp));
					}
					if (!clicks[clickPointer].attachedToQuery 
						&& withinAnHour && beforeNextQuery) {
						curQueryForUser.clickCounter++ ;
						if (clicks[clickPointer].question) {
							curQueryForUser.question = true;
						}
						clicks[clickPointer].attachedToQuery = true;
					}
				}
				// if (user == 'A0001') {
				// 	console.log(curUser.queries);
				// 	return;
				// }
			}
		}
		
		for (var key in vis.queryData) {
			if (vis.queryData[key].clickCounter > 0) {
				xArrayForClicks.push(vis.queryData[key].clickCounter * 3);
				yArrayForClicks.push(vis.queryData[key].keyName);
				userIdsForClicks.push(vis.queryData[key].u_id);
				var text = vis.queryData[key].intention + " by " + vis.queryData[key].u_id + "  <br> " +
							 vis.queryData[key].clickCounter + " clicks";
				textArrayForClicks.push(text);
			}
		}

		var trace1 = {
			x: xArrayForQueries,
			y: yArrayForQueries,
			text: textArrayForQueries,
			users: userIdsForQueries,
			name: 'Queries By User',
			orientation: 'h',
			marker: {
				color: colorsForQueries,
				width: 1
			},
			type: 'bar'
		};
		var trace2 = {
			x: xArrayForClicks,
			y: yArrayForClicks,
			users: userIdsForClicks,
			text: textArrayForClicks,
			name: 'Follow-up Clicks',
			orientation: 'h',
			marker: {
				//color: 'rgba(55,123,191,0.6)',
				color: 'rgba(0, 140, 0,0.6)',
				width: 1,
				size: 10
			},
			type: 'bar'
		};
		var traces = [trace1, trace2];
		this.buildVis(traces);
	},

	buildOpsLegend: function() {
		for (var key in vis.colorHashForOperations) {
			$('#legendViz2').append('<div class="legendHolder"><div class="legendBox"'
				+'style="background:'+vis.colorHashForOperations[key]+'">'+
				'</div><div class="legendText">'+ key +'</div></div>');
		}		
	},

	buildIntentionLegend: function() {
		for (var key in vis.colorHashForQueries) {
			$('#legendViz1').append('<div class="legendHolder"><div class="legendBox"'
				+'style="background:'+vis.colorHashForQueries[key]+'">'+
				'</div><div class="legendText">'+ key +'</div></div>');
		}
	},
};
$(document).ready(function() {
	vis.loadCSVs();
	var poll = setInterval(function(){
		if (!$.isEmptyObject(vis.operationData) && !$.isEmptyObject(vis.clickData)
			&& !$.isEmptyObject(vis.queryData) && !$.isEmptyObject(vis.selectData)) {
			clearTimeout (poll);
			vis.startVis();
			document.getElementById('queryType')
				.addEventListener('change', vis.filterByQueryType, false);
			document.getElementById('clickSlider')
				.addEventListener('change', vis.filterByClicksCount, false);
			document.getElementById('questionFlag')
				.addEventListener('change', vis.filterByQuestion, false);
			vis.buildIntentionLegend();
			vis.buildOpsLegend();
		}
	}, 1000);
});
