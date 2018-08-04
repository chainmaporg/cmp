var md5 = require("md5");

var admin_pass = md5("admin_pass");
var admin_user = "admin";

exports.login = function(req, res) {
    var username = req.body.username;
    var password = md5(req.body.password);

    if (password == admin_pass && username == admin_user) {
        console.log("Login attempt successful.");
        req.session.admin = true;
        res.redirect("adminPage");
    } else {
        console.log("Login unsuccessful.");
        res.render("loginAdmin");
    }
};

exports.adminPageAccess = function(req, res) {
    var sitedata = {};

    connection.query("SELECT DISTINCT ip from ip", function(
        error,
        results,
        fields
    ) {
        if (error) console.log("Error: ", error);
        else {
            var ips = [];
            results.forEach(function(dict) {
                ips.push(dict["ip"]);
            });
            sitedata.ips = ips;
            connection.query("SELECT * from documents", function(
                error,
                results,
                fields
            ) {
                if (error) console.log("Error: ", error);
                else {
                    sitedata.docs = results;
                    connection.query("SELECT * from click", function(
                        error,
                        results,
                        fields
                    ) {
                        if (error) {
                            console.log("Error: ", error);
                        } else {
                            sitedata.click = results;
                            res.render("adminPage", { data: sitedata });
                        }
                    });
                }
            });
        }
    });
};
