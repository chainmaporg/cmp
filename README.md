# chainmap.org local build instructions


## What is chainmap
See http://chainmap.org


## How to start the server

(0) Need to have Node.js and relevant components (expressJS) installed. 

(1) Installation

    git clone https://github.com/chainmaporg/cmp into a directory as ${CMP_HOME}
    - under ${CMP_HOME} run NPM instal to install Node.js components
    - install mysql 5.x+
    - run mysql scripts under ${CMP_HOME}/dbscripts to create tables
    - run seed data scritps "insertKeywords.sql", "insertGroup.sql", "load_materials.sql", you can use mysql source command under mysql command line console
    - change the ${CMP_HOME}/local_deploy.env with your own mysql DB password

(2) cd ${CMP_HOME}/

    sudo sh startNode.sh 
    
    Note: need sudo to open the port 80. This shall create the Node.js server

(3) Check http://localhost/


## Contact

george.zhao@chainmap.org
