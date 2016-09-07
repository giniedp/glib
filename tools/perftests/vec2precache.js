var Benchmark = require('benchmark');

var suite = new Benchmark.Suite;

var a = { x:3, y: 7 };
var x1;
var y1;

function peel(a) {
  var x = a.x;
  var y = a.y;
  Math.sqrt(x * x + y * y);
}
function peelGlobal(a) {
  x1 = a.x;
  y1 = a.y;
  Math.sqrt(x1 * x1 + y1 * y1);
}
function noPeel(a) {
  Math.sqrt(a.x * a.x + a.y * a.y);
}

suite
.add('noPeel', function() {
  noPeel(a);
})
.add('peel', function() {
  peel(a);
})
.add('peelGlobal', function() {
  peelGlobal(a);
})
.on('cycle', function(event) {
  console.log(String(event.target));
})
.on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').map('name'));
})
.run({ 'async': true });
