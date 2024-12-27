// const { Pool } = require("pg");

// const pool = new Pool({
//     user: "kosebinu",    
//     host: "localhost",  
//     database: "clubhouse", 
//     password: "kosebinu",   
//     port: 5432,  
// });

// module.exports = pool;


const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

module.exports = pool;
