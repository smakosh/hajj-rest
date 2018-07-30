const express = require('express')
const _ = require('lodash')
const { ObjectID } = require('mongodb')
const { authenticate } = require('../middleware/authenticate')
const { admin } = require('../middleware/admin')
const { worker } = require('../middleware/worker')
const { Trashcan } = require('../models/trashcan')

const router = express.Router()

router.post('/', admin, (req, res) => {
	const { name, type, lat, lng } = req.body
	const trashcan = new Trashcan({
		name,
		type,
		lat,
		lng,
		_creator: res.user._id
	})

	trashcan.save()
		.then(doc => res.status(200).json(doc))
		.catch(() => res.status(400).send({ error: 'Something went wrong' }))
})

router.get('/', authenticate, (req, res) => {
	Trashcan.find({ _creator: res.user._id })
		.then(trashcans => res.status(200).json(trashcans))
		.catch(() => res.status(400).json({ error: 'This user has no trashcans added' }))
})

router.get('/:id', authenticate, (req, res) => {
	const { id } = req.params

	if (!ObjectID.isValid(id)) {
		return res.status(404).json({ error: 'Invalid ID' })
	}

	return Trashcan.findOne({
		_id: id,
		_creator: res.user._id
	}).then(trashcan => {
		if (!trashcan) {
			return res.status(400).json({ error: 'Unable to find that trashcan' })
		}

		return res.status(200).json(trashcan)
	}).catch(() => res.status(400).json({ error: 'Something went wrong' }))
})

router.delete('/:id', admin, (req, res) => {
	const { id } = req.params

	if (!ObjectID.isValid(id)) {
		return res.status(404).send('Invalid ID')
	}

	return Trashcan.findOneAndRemove({ _id: id, _creator: res.user._id })
		.then(trashcan => {
			if (!trashcan) {
				return res.status(400).json({ error: 'Unable to delete that trashcan' })
			}
			return res.status(200).json({ message: 'Trashcan has been removed successfully!' })
		}).catch(() => res.status(400).send({ error: 'Something went wrong' }))
})

router.patch('/:id', admin, (req, res) => {
	const { id } = req.params
	const body = _.pick(req.body, [
		'name',
		'type',
		'filled',
		'lat',
		'lng'
	])

	if (!ObjectID.isValid(id)) {
		return res.status(404).json({ error: 'Invalid ID' })
	}

	return Trashcan.findOneAndUpdate({
		_id: id, _creator: res.user._id
	}, { $set: body }, { new: true })
		.then(trashcan => {
			if (!trashcan) {
				return res.status(404).json({ error: 'Unable to update that trashcan' })
			}
			return res.status(200).json(trashcan)
		})
		.catch(() => res.status(400).send({ error: 'Something went wrong' }))
})

router.patch('/filled/:id', worker, (req, res) => {
	const { id } = req.params

	if (!ObjectID.isValid(id)) {
		return res.status(404).json({ error: 'Invalid ID' })
	}

	return Trashcan.findOneAndUpdate({
		_id: id
	}, { $set: { filled: true } }, { new: true })
		.then(trashcan => {
			if (!trashcan) {
				return res.status(404).json({ error: 'Unable to update that trashcan' })
			}
			return res.status(200).json(trashcan)
		})
		.catch(() => res.status(400).send({ error: 'Something went wrong' }))
})

router.post('/report/:trash_id', authenticate, (req, res) => {
	const { trash_id } = req.params

	if (!ObjectID.isValid(trash_id)) {
		return res.status(404).json({ error: 'Invalid ID' })
	}

	return Trashcan.findById(trash_id)
		.then(trashcan => {
			if (!trashcan) {
				return res.status(404).json({ error: 'Unable to update that trashcan' })
			}

			const newReport = {
				user: res.user._id
			}

			trashcan.reports.unshift(newReport)

			return trashcan.save().then(() => res.json({ message: 'successfully reported trashcan' }))
		})
		.catch(() => res.status(400).send({ error: 'Something went wrong' }))
})

module.exports = router
