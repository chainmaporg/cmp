exports.getGraph = function() {
    connection.query("select * from click", function(error, results, fields) {
        if (error) console.log(error)
        else {
            var graph_node_id = 0
            var get_graph_node_id_dict = {}
            var get_hash_id_dict = {}

            // find unique hash ids and user ids
            var users = new Set()
            var docs = new Set()
            results.forEach(function(dict) {
                users.add(dict.user_id)
                docs.add(dict.doc_id)
            })

            // assign consecutive ints as graph node ids
            users.forEach(user_id => {
                get_graph_node_id_dict[user_id] = graph_node_id
                get_hash_id_dict[graph_node_id] = user_id
                graph_node_id++
            })

            docs.forEach(doc_id => {
                get_graph_node_id_dict[doc_id] = graph_node_id
                get_hash_id_dict[graph_node_id] = doc_id
                graph_node_id++
            })

            // output the graph
            var output = ""
            results.forEach(dict => {
                output +=
                    get_graph_node_id_dict[dict.user_id] +
                    " " +
                    get_graph_node_id_dict[dict.doc_id] +
                    "\n"
            })

            console.log(output)

            var fs = require("fs")
            fs.writeFile("./utils/graph.txt", output, function(err) {
                if (err) {
                    return console.log(err)
                }

                console.log("The file was saved!")
            })
            return get_hash_id_dict
        }
    })
    return {}
}

exports.runPPR = function() {
    var exec = require("child_process").execFile

    console.log("running ppr executable.")

    exec("./utils/randwalk", function(err, data) {
        console.log(err)
        console.log(data.toString())
    })
}

exports.getMappings = function() {
    connection.query("select * from documents", function(
        error,
        results,
        fields
    ) {
        if (error) console.log(error)
        // else console.log(results)
    })
}
