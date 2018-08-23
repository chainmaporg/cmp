exports.getGraph = () => {
    return new Promise((resolve, reject) => {
        connection.query("select distinct sender_id, receiver_id from messages", (error, results, fields) => {
            if (error) {
                reject(error);
            } else {
                const message_participants = results;
                connection.query("select distinct user_id, doc_id from click", (error, results, fields) => {
                    if (error) {
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

                        message_participants.forEach(dict => {
                            users.add(dict.sender_id);
                            users.add(dict.receiver_id);
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

                        // output the graph for docs to users
                        let output = "";
                        results.forEach(dict => {
                            output +=
                                get_graph_node_id_dict[dict.user_id] + " " + get_graph_node_id_dict[dict.doc_id] + "\n";
                            output +=
                                get_graph_node_id_dict[dict.doc_id] + " " + get_graph_node_id_dict[dict.user_id] + "\n";
                        });

                        // add graph nodes for users to users
                        message_participants.forEach(dict => {
                            output +=
                                get_graph_node_id_dict[dict.sender_id] +
                                " " +
                                get_graph_node_id_dict[dict.receiver_id] +
                                "\n";
                            output +=
                                get_graph_node_id_dict[dict.receiver_id] +
                                " " +
                                get_graph_node_id_dict[dict.sender_id] +
                                "\n";
                        });

                        const fs = require("fs");

                        fs.writeFile("./utils/graph.txt", output, err => {
                            if (error) {
                                reject(error);
                            } else {
                                console.log("The file was saved!");
                            }
                        });

                        const params = "" + users.size + " " + docs.size;

                        fs.writeFile("./utils/params.txt", params, err => {
                            if (error) {
                                reject(error);
                            } else {
                                console.log("Params were saved!");
                            }
                        });

                        resolve([users.size, docs.size, get_hash_id_dict]);
                    }
                });
            }
        });
    });
};

exports.runPPR = () => {
    return new Promise((resolve, reject) => {
        const spawn = require("child_process").spawn;
        const proc = spawn("./utils/randwalk");
        let result = "";

        proc.stdout.on('data', (data) => {
            result += data.toString();
        });

        proc.stderr.on('data', (data) => {
            reject("error: " + data.toString());
        });

        proc.on('close', (code) => {
            let vals = result.split("\n");
                console.log(vals[vals.length - 2]);
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

            const promiseStack = [];

            for (let i = 0; i < numUsers; i++) {
                promiseStack.push(
                    new Promise((resolve, reject) => {
                        const currentDocRecs = [];
                        const currentConnectionRecs = [];
                        all[id_dict[i]].sort(comparator);
                        connection.query(
                            "select distinct doc_id from click where user_id = ?",
                            [id_dict[i]],
                            (error, results, fields) => {
                                if (error) {
                                    reject(error);
                                } else {
                                    const notRecommended = new Set();
                                    results.forEach(val => {
                                        notRecommended.add(val.doc_id);
                                    });
                                    connection.query(
                                        "select doc_id from documents where type = ?",
                                        ["Job"],
                                        (error, results, fields) => {
                                            if (error) {
                                                console.log(error);
                                            } else {
                                                results.forEach(val => {
                                                    notRecommended.add(val.doc_id);
                                                });
                                                all[id_dict[i]].forEach(vals => {
                                                    if (notRecommended.has(vals[0])) {
                                                    } else if (vals[0] in id_to_link) {
                                                        currentDocRecs.push(id_to_link[vals[0]]);
                                                    } else {
                                                        currentConnectionRecs.push(vals[0]);
                                                    }
                                                });
                                                resolve([currentConnectionRecs, currentDocRecs]);
                                            }
                                        },
                                    );
                                }
                            },
                        );
                    }),
                );
            }

            function comparator(a, b) {
                if (a[1] === b[1]) {
                    return 0;
                } else {
                    return a[1] < b[1] ? 1 : -1;
                }
            }

            Promise.all(promiseStack)
                .then(values => {
                    values.forEach((val, i) => {
                        connectionRecs[id_dict[i]] = val[0];
                        docRecs[id_dict[i]] = val[1];
                    });
                    console.log(connectionRecs, docRecs);
                    storeRecommendations(connectionRecs, docRecs);
                    return [connectionRecs, docRecs];
                })
                .catch(error => {
                    console.log(error);
                });
        }
    });
};

function storeRecommendations(connectionRecs, docRecs) {
    connection.query("delete from doc_recommendations", (error, results, fields) => {
        if (error) {
            console.log(error);
        } else {
            Object.keys(docRecs).forEach(key => {
                docRecs[key].forEach(link => {
                    connection.query(
                        "insert into doc_recommendations(user_id, link) values (?)",
                        [[key, link]],
                        (error, results, fields) => {
                            if (error) {
                                console.log(error);
                            }
                        },
                    );
                });
            });
        }
    });

    connection.query("delete from user_recommendations", (error, results, fields) => {
        if (error) {
            console.log(error);
        } else {
            Object.keys(connectionRecs).forEach(key => {
                connectionRecs[key].forEach(connect => {
                    connection.query(
                        "insert into user_recommendations(user_id, suggested_user) values (?)",
                        [[key, connect]],
                        (error, results, fields) => {
                            if (error) {
                                console.log(error);
                            }
                        },
                    );
                });
            });
        }
    });
}
