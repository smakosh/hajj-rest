const { User } = require('../models/user')

const worker = (req, res, next) => {
	const token = req.header('worker-access')

	User.findByToken(token).then(user => {
		if (!user || user.type !== 'admin' || user.type !== 'worker') {
			return Promise.reject()
		}

		res.user = user
		res.token = token
		return next()
	}).catch(() => {
		res.status(401).send()
	})
}

module.exports = { worker }
