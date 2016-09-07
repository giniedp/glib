var Benchmark = require('benchmark');

var suite = new Benchmark.Suite;

var a = { x:3, y: 7 };
function normalize(a) {
  var x = a.x
  var y = a.y
  var d = 1.0 / Math.sqrt(x * x + y * y)
  a.x *= d
  a.y *= d
  return a
}

function normalizeOut(a, b) {
  var x = a.x
  var y = a.y
  var d = 1.0 / Math.sqrt(x * x + y * y)
  b = b || a
  a.x = a.x * d
  a.y = a.y * d
  return a
}
function delegate(a, b) {
  return normalizeOut(a, b)
}


suite.add('normalize', function() {
  normalize(a)
})
.add('normalizeOut', function() {
  normalizeOut(a)
})
.add('delegate', function() {
  normalizeOut(a)
})
.on('cycle', function(event) {
  console.log(String(event.target));
})
.on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').map('name'));
})
.run({ 'async': true });
