var hFreq = {};
var hSy = {};
var fs = require('fs');
var util = require('util');
var CHARACTER_INFORMATION_ENTROPY = Math.log(1 / 1024);

fs.readFileSync('essay.txt').toString().split(/\r?\n/g).forEach(function(line){
	var ch = line[0]
	var prob = line.slice(2);
	hFreq[ch] = prob - 0;
});
fs.readFileSync('sy.txt').toString().split(/\r?\n/g).forEach(function(line){
	var data = line.split('\t');
	var ch = data[0]
	var syl = data[1]
	var mProb = data[2] ? (data[2] - 0) * 0.01 : 1
	if(!hSy[syl]) hSy[syl] = [];
	hSy[syl].push({
		ch: ch,
		freq: (hFreq[ch] || 1) * mProb
	});
});

for(var sy in hSy) {
	var fTotal = 0;
	for(var j = 0; j < hSy[sy].length; j++) {
		fTotal += hSy[sy][j].freq
	};
	if(fTotal < 1) fTotal = 1;
	for(var j = 0; j < hSy[sy].length; j++) {
		hSy[sy][j].prob = Math.log(hSy[sy][j].freq / fTotal);
	};
}


var hMarkov = require('./markov.json');
console.log('Read data complete.');
var snake = '^^';
var result = '';
var syls = []
for(var j = 2; j < process.argv.length; j++) {
	var sy = process.argv[j];
	if(!hSy[sy]) throw "不明音节 " + sy;
	syls.push(sy)
};
var pendingCharacters = [];
for(var j = 0; j < syls.length; j++) {
	pendingCharacters[j] = hSy[syls[j]].sort(function(a, b){return b.prob - a.prob});
};

var PROB_FREE = CHARACTER_INFORMATION_ENTROPY;
var phases = [
	{
		'^^' : {
			s: '',
			probablity: CHARACTER_INFORMATION_ENTROPY * 2,
		}
	}
];

var cProbablity = function(lpExisting, lpCharacter, lpMarkov) {
	return lpExisting + lpCharacter + lpMarkov
}


for(var j = 0; j < pendingCharacters.length; j++) {
	var currentStep = phases[j];
	var newStep = {};
	for(var i = 0; i < pendingCharacters[j].length; i++) {
		var ch = pendingCharacters[j][i];

		for(var k in currentStep) {
			var newTrig = k + ch.ch;
			var markovProb = hMarkov[k] ? (-0.0001 * hMarkov[k][ch.ch] || PROB_FREE) : PROB_FREE;
			var newTail = newTrig.slice(1);
			if(!newStep[newTail]) {
				newStep[newTail] = {
					s : currentStep[k].s + ch.ch,
					probablity : cProbablity(currentStep[k].probablity, ch.prob, PROB_FREE)
				}
			};
			if(cProbablity(currentStep[k].probablity, ch.prob, markovProb) > newStep[newTail].probablity) {
				newStep[newTail].probablity = cProbablity(currentStep[k].probablity, ch.prob, markovProb);
				newStep[newTail].s = currentStep[k].s + ch.ch;
			}
		}
	};
	// just keep top 50 items
	var aKept = []
	var kept = {}
	for(var k in newStep) {
		aKept.push({k:k, v: newStep[k]})
	}
	aKept = aKept.sort(function(a, b){return b.v.probablity - a.v.probablity}).slice(0, 25);
	for(var i = 0; i < aKept.length; i++) {
		kept[aKept[i].k] = aKept[i].v
	}
	phases.push(kept);
}

var lastStep = phases[phases.length - 1];
var pendingSentences = []
for(var k in lastStep) {
	pendingSentences.push(lastStep[k]);
}
var pendings = pendingSentences.sort(function(a, b){return b.probablity - a.probablity}).slice(0, 20)
console.log(pendings.filter(function(x){return x.probablity > CHARACTER_INFORMATION_ENTROPY * pendingCharacters.length}).map(util.inspect).join('\n'));
console.log("---- Probablity lower limit ", CHARACTER_INFORMATION_ENTROPY * pendingCharacters.length, ' ----');
console.log(pendings.filter(function(x){return x.probablity <= CHARACTER_INFORMATION_ENTROPY * pendingCharacters.length}).map(util.inspect).join('\n'));