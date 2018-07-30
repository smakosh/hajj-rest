const express = require('express')
const _ = require('lodash')
const { authenticate } = require('../middleware/authenticate')
const { admin } = require('../middleware/admin')
const { User } = require('../models/user')

const router = express.Router()

router.post('/register', (req, res) => {
	const body = _.pick(req.body, ['firstName', 'lastName', 'username', 'email', 'password'])
	const user = new User(body)

	user.save()
		.then(() => user.generateAuthToken())
		.then(token => res.json({
			firstName: user.firstName,
			lastName: user.lastName,
			username: user.username,
			points: user.points,
			type: user.type,
			token
		}))
		.catch(() => res.status(400).json({ error: 'Something went wrong' }))
})

router.patch('/', authenticate, (req, res) => {
	const { firstName, lastName, username } = req.body
	const userFields = {
		firstName,
		lastName,
		username
	}

	User.findOneAndUpdate(
		{ user: res.user._id },
		{ $set: userFields },
		{ new: true }
	)
		.then(user => res.json(user))
		.catch(() => res.status(400).json({ error: 'user not found' }))
})

router.patch('/:id', admin, (req, res) => {
	const { type } = req.body
	const userFields = {
		type
	}

	User.findOneAndUpdate(
		{ user: req.params.id },
		{ $set: userFields },
		{ new: true }
	)
		.then(user => res.json(user))
		.catch(() => res.status(400).json({ error: 'user not found' }))
})

router.get('/me', authenticate, (req, res) => res.json(res.user))

router.post('/login', (req, res) => {
	const body = _.pick(req.body, ['email', 'password'])

	User.findByCredentials(body.email, body.password).then(user => {
		return user.generateAuthToken().then(token => res.json({
			firstName: user.firstName,
			lastName: user.lastName,
			type: user.type,
			points: user.points,
			username: user.username,
			token
		}))
	}).catch(() => res.status(400).send({ error: 'Wrong credentials' }))
})

router.delete('/me/token', authenticate, (req, res) => {
	res.user.removeToken(res.token).then(() => {
		res.status(200).json({ message: 'logged out' })
	}, () => {
		res.status(400).json({ error: 'could not log you out' })
	}).catch(() => res.status(502).json({ error: 'could not log you out' }))
})

module.exports = router
