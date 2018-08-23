# chainmap.org local build instructions


## What is chainmap
See http://chainmap.org

## Version and milestones

Current version is V2.0 and we often have weekly releases.

## How to start the server

Note: Commands in terminal will be denoted by "", but "" should not be included within the command.

(0) Install Node.js at https://nodejs.org/en/
To check that Node.js is installed, you can run "npm -v" in the terminal. If you see a version number, then node.js is installed.

(1) Install MySQL, the preferred version is 5.6.40 MySQL Community Server.
Navigate to /usr/local/mysql/bin/ to ensure that MySQL is installed correctly.

Add MySQL to your bash with "echo 'export PATH="/usr/local/mysql/bin:$PATH"' >> ~/.bash_profile" in terminal.

Open MySQL in the terminal with "mysql -u 'username' -p 'password'" replacing 'username' and 'password' with your own information. If you did not set a password, then you do not need "-p".

(3) In a new terminal window, navigate to a folder you want to use to store chainmap, and use the command "git clone https://github.com/chainmaporg/cmp" into a directory.
Then open the folder with "open .".

(4) Create a new database in your mysql terminal window called cmpdb with the command "create database cmpdb;".
    - navigating back to the open folder, find the dbscripts folder inside CMP.
    - For each sql file inside dbscripts, type "source " inside the mysql terminal and then drag each sql file from the finder into the mysql terminal and end each line with ";". Press enter, and repeat for the next file.
    - change the CMP/local_deploy.env with your own mysql DB password in the exports, db section.

(5) Run in the terminal : "sudo sh startNode.sh"
    
    Note: need sudo to open the port 80. This shall create the Node.js server. You will need to enter a password for sudo commands if a password has not been entered recently.
    - stop it wih "sudo sh stopNode.sh"

(6) Access your local environment with http://localhost/ in a web browser.


## Contact

george.zhao@chainmap.org
