const { Pool } = require("pg");

const pool = new Pool({
    user: "kosebinu",    
    host: "localhost",  
    database: "clubhouse", 
    password: "kosebinu",   
    port: 5432,  
});

module.exports = pool;
