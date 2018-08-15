exports.getGraph = () => {
    return new Promise((resolve, reject) => {
        connection.query("select distinct user_id, doc_id from click", (error, results, fields) => {
            if (error) {
                console.log(error);
                reject(error);
            } else {
                let graph_node_id = 0;
                const get_graph_node_id_dict = {};
                const get_hash_id_dict = {};

                // find unique hash ids and user ids
                const users = new Set();
                const docs = new Set();
                results.forEach(dict => {
                    users.add(dict.user_id);
                    docs.add(dict.doc_id);
                });

                // assign consecutive ints as graph node ids
                users.forEach(user_id => {
                    get_graph_node_id_dict[user_id] = graph_node_id;
                    get_hash_id_dict[graph_node_id] = user_id;
                    graph_node_id++;
                });

                docs.forEach(doc_id => {
                    get_graph_node_id_dict[doc_id] = graph_node_id;
                    get_hash_id_dict[graph_node_id] = doc_id;
                    graph_node_id++;
                });

                // output the graph
                let output = "";
                results.forEach(dict => {
                    output += get_graph_node_id_dict[dict.user_id] + " " + get_graph_node_id_dict[dict.doc_id] + "\n";
                    output += get_graph_node_id_dict[dict.doc_id] + " " + get_graph_node_id_dict[dict.user_id] + "\n";
                });

                const fs = require("fs");

                fs.writeFile("./utils/graph.txt", output, err => {
                    if (err) {
                        console.log(err);
                        reject(err);
                    } else {
                        console.log("The file was saved!");
                    }
                });

                const params = "" + users.size + " " + docs.size;

                fs.writeFile("./utils/params.txt", params, err => {
                    if (err) {
                        console.log(err);
                        reject(err);
                    } else {
                        console.log("Params were saved!");
                    }
                });

                resolve([users.size, docs.size, get_hash_id_dict]);
            }
        });
    });
};

exports.runPPR = () => {
    return new Promise((resolve, reject) => {
        const exec = require("child_process").execFile;
        exec("./utils/randwalk", (error, data) => {
            if (error) {
                console.log(error);
                reject(error);
            } else {
                let vals = data.toString().split("\n");
                vals = vals.slice(5, vals.length - 2);
                importances = [];
                vals.forEach(str => {
                    let parsedStr = str.match(/\d*\.?\d+/g);
                    importances.push([
                        Number.parseInt(parsedStr[0]),
                        Number.parseInt(parsedStr[1]),
                        Number.parseFloat(parsedStr[2]),
                    ]);
                });
                resolve(importances);
            }
        });
    });
};

exports.getMappings = (id_dict, importances) => {
    console.log(id_dict);
    console.log(importances);
    connection.query("select * from documents", (error, results, fields) => {
        if (error) console.log(error);
        // else console.log(results)
    });
};
