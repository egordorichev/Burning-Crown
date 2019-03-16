const fs = require("fs")

exports.loadDb = function() {
  exports.base = JSON.parse(fs.readFileSync("base.json"))
}

exports.saveDb = function() {
	fs.writeFileSync("base.json", JSON.stringify(exports.base, null, 4))
}