exports.getTopLinks = () => {
    const links = new Promise((resolve, reject) => {
        connection.query(
            "select link, count(*) from click inner join documents on documents.doc_id = click.doc_id group by documents.doc_id order by count(*) desc",
            async (error, results, fields) => {
                if (error) {
                    console.log(error);
                    reject(error);
                } else {
                    resultLinks = [];
                    console.log("results length:", results.length);
                    
                    t=5;
                    if (results.length<5) {
                    	t= results.length;
                    }
                    for (let i = 0; i < t; i++) {
                        resultLinks.push(results[i].link);
                    }
                    resolve(resultLinks);
                }
            },
        );
    });
    return links;
};
