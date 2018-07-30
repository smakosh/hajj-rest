const { User } = require('../models/user')

const admin = (req, res, next) => {
	const token = req.header('admin-access')

	User.findByToken(token).then(user => {
		if (!user || user.type !== 'admin') {
			return Promise.reject()
		}

		res.user = user
		res.token = token
		return next()
	}).catch(() => {
		res.status(401).send()
	})
}

module.exports = { admin }
