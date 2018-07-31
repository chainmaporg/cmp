exports.getNews = function(req, res) {
    var Client = require("node-rest-client").Client
    var client = new Client()
    var url = "http://107.181.170.169:3000/news/top/5"

    function makePromise(url) {
        var p = new Promise((resolve, reject) => {
            // request is asynchronous
            var client = new Client()
            var r = client.get(url, function(data, response) {
                resolve(data.response.docs)
            })

            r.on("requestTimeout", function(r) {
                console.log("request expired.")
                r.abort()
                reject()
            })

            r.on("error", function(err) {
                console.log("request error", error)
                reject()
            })
        }).catch(error => {
            console.log(error)
        })
        return p
    }

    var combined = makePromise(url)
    combined
        .catch(function(error) {
            console.log(error)
        })
        .then(function(values) {
            res.send(values)
        })
}
