var Lazy = require('lazy');
var fs = require('fs');
var l = new Lazy(fs.createReadStream("trigrams.csv", {encoding: 'utf-8'}));

var hMarkov = {};
var totalFrequency = 0;

l.lines.forEach(function(buffer) {
	buffer = buffer.toString();
	var word = buffer.slice(0, 3);
	var frequency = buffer.slice(4) - 0
	var front = word.slice(0, 2);
	var rear = word.slice(2, 3);
	if(!hMarkov[front]) {
		hMarkov[front] = {}
	};
	hMarkov[front][rear] = frequency;
});
l.on('end', function() {
	for(var front in hMarkov) {
		var fTotal = 0;
		for(var rear in hMarkov[front]) {
			fTotal += hMarkov[front][rear]
		}
		for(var rear in hMarkov[front]) {
			hMarkov[front][rear] = Math.round(-10000 * Math.log(hMarkov[front][rear] / fTotal * 0.9))
		}
	};
	fs.writeFileSync('markov.json', JSON.stringify(hMarkov));
});