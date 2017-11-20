exports.index = function(req, res) {
	res.send('<h1>Hello</h1>');
}

exports.default = function(req, res) {
	res.status(404).send('Invalid route');
}
