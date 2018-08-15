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
                    const parsedStr = str.match(/\d*\.?\d+/g);
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
    connection.query("select * from documents", (error, results, fields) => {
        if (error) {
            console.log(error);
        } else {
            const id_to_link = {};
            results.forEach(dict => {
                id_to_link[dict.doc_id] = dict.link;
            });

            const numUsers = id_dict[0],
                numDocs = id_dict[1];
            id_dict = id_dict[2];
            const all = {};

            importances.forEach(vals => {
                if (typeof all[id_dict[vals[0]]] === "undefined") {
                    all[id_dict[vals[0]]] = [[id_dict[vals[1]], vals[2]]];
                } else {
                    const temp = all[id_dict[vals[0]]].concat([[id_dict[vals[1]], vals[2]]]);
                    all[id_dict[vals[0]]] = temp;
                }
            });

            const connectionRecs = {},
                docRecs = {};

            for (let i = 0; i < numUsers; i++) {
                const currentDocRecs = [];
                const currentConnectionRecs = [];
                all[id_dict[i]].sort(comparator);
                all[id_dict[i]].forEach(vals => {
                    if (vals[0] in id_to_link) {
                        currentDocRecs.push(id_to_link[vals[0]]);
                    } else {
                        currentConnectionRecs.push(vals[0]);
                    }
                });
                connectionRecs[id_dict[i]] = currentConnectionRecs;
                docRecs[id_dict[i]] = currentDocRecs;
            }

            function comparator(a, b) {
                if (a[1] === b[1]) {
                    return 0;
                } else {
                    return a[1] < b[1] ? 1 : -1;
                }
            }

            console.log(connectionRecs);
            console.log(docRecs);

            return [connectionRecs, docRecs];
        }
    });
};
