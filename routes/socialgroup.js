exports.getSocialGroup = () => {
    return new Promise((resolve, reject) => {
        connection.query("select * from socialgroup order by followers desc", [], (error, results, fields) => {
            if (error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
};
