exports.getNews = function(req, res) {
    var Client = require("node-rest-client").Client
    var client = new Client()
    var solr_host = global.config.search_solr_host

    var cat_id = [1, 2, 3, 4, 5, 6, 7, 8, 9]

    new Promise((resolve, reject) => {
        connection.query(
            "select keyword from keywords where category_id =" +
                cat_id.join(" or category_id="),
            function(error, results, fields) {
                if (error) {
                    reject(error)
                } else {
                    results = results.map(function(value) {
                        return value["keyword"]
                    })
                    resolve(results)
                }
            }
        )
    })
        .catch(error => console.log(error))
        .then(all => {
            function getRandom() {
                var randomIndex = Math.floor(Math.random() * all.length)
                return all.splice(randomIndex, 1)[0]
            }
            var keywords = []
            var maxLength = all.length
            for (var i = 0; i < Math.min(maxLength, 10); i++) {
                keywords.push(getRandom())
            }

            var category = "news"

            function getLink(keywords, numShow) {
                var url =
                    solr_host +
                    "/select?fl=title,%20date,%20url,%20summary%20category&q=category:" +
                    encodeURI(category) +
                    "%20AND%20(search_content:" +
                    encodeURI(
                        " " + keywords.join(" OR search_content: ") + ")"
                    ) +
                    "&rows=" +
                    encodeURI(numShow) +
                    "&wt=json"
                return url
            }

            var url = getLink(keywords, 10)

            function makePromise(url) {
                var p = new Promise((resolve, reject) => {
                    // request is asynchronous
                    var client = new Client()
                    var r = client.get(url, function(data, response) {
                        var docs = JSON.parse(data).response.docs
                        resolve(docs)
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

            function shuffle(array) {
                var counter = array.length
                // While there are elements in the array
                while (counter > 0) {
                    // Pick a random index
                    var index = Math.floor(Math.random() * counter)

                    // Decrease counter by 1
                    counter--

                    // And swap the last element with it
                    var temp = array[counter]
                    array[counter] = array[index]
                    array[index] = temp
                }
                return array
            }

            combined
                .catch(function(error) {
                    console.log(error)
                })
                .then(function(values) {
                    var recommendations = shuffle(values).slice(0, 5)
                    res.send(recommendations)
                })
        })
}