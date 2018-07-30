require('dotenv').config()

module.exports = {
	MONGO_URI: process.env.DB_DEV,
	secret_key: process.env.SECRET_KEY
}
