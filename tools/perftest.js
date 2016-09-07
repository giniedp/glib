var Benchmark = require('benchmark');

var suite = new Benchmark.Suite;

var fun = function() {}
var items = [fun];

// add tests
suite.add('loop', function() {
  for (var i = 0; i < items.length; i++) {
    items[i]();
  }
})
.add('unroll', function() {
  items[0]();
})
.on('cycle', function(event) {
  console.log(String(event.target));
})
.on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').map('name'));
})
.run({ 'async': true });
