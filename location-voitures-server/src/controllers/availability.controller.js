const db = require("../models");
const Availability = db.availabilities;
const Reservation = db.reservations;
const { Op } = require("sequelize");
exports.listCarAvailabilities = async (req, res) => {
  try {
    const availabilities = await Availability.findAll({
      where: { voitureId: req.params.voitureId }
    });
    res.status(200).json(availabilities);
  } catch (err) {
    console.error('listCarAvailabilities error:', err)
    res.status(500).json({ message: 'Server error listing availabilities', error: err?.message || String(err) });
  }
};

exports.addAvailability = async (req, res) => {
  try {
    const { startDate, endDate, startTime, endTime, manuallyEditable } = req.body || {};
    const voitureId = parseInt(req.params.voitureId, 10);
    if (!Number.isFinite(voitureId)) {
      return res.status(400).json({ message: 'Invalid voitureId' })
    }

    // Ensure the car exists and is validated
    const car = await db.voitures.findByPk(voitureId)
    if (!car) return res.status(404).json({ message: 'Car not found' })
    if (car.statut !== 'validated') return res.status(400).json({ message: 'Only validated cars can be blocked' })

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "startDate and endDate are required" })
    }
    const start = new Date(startDate)
    const end = new Date(endDate)
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD' })
    }
    // normalize to day bounds
    start.setHours(0,0,0,0)
    end.setHours(23,59,59,999)

    if (end < start) {
      return res.status(400).json({ message: "End date must be after start date." });
    }

    //  Vérifier conflit avec réservation (client)
    const reservationConflict = await Reservation.findOne({
      where: {
        voitureId,
        statut: { [Op.in]: ["pending", "confirmed"] },
        [Op.or]: [
          {
            dateDebut: { [Op.between]: [start, end] }
          },
          {
            dateFin: { [Op.between]: [start, end] }
          },
          {
            [Op.and]: [
              { dateDebut: { [Op.lte]: start } },
              { dateFin: { [Op.gte]: end } }
            ]
          }
        ]
      }
    });

    if (reservationConflict) {
      return res.status(400).json({
        message: "Cannot manually mark as available: car already reserved by a client in this period."
      });
    }

    //  Vérifier conflit avec disponibilité déjà existante
    const existingAvailability = await Availability.findOne({
      where: {
        voitureId,
        [Op.or]: [
          { startDate: { [Op.between]: [start, end] } },
          { endDate: { [Op.between]: [start, end] } },
          {
            [Op.and]: [
              { startDate: { [Op.lte]: start } },
              { endDate: { [Op.gte]: end } }
            ]
          }
        ]
      }
    });

    if (existingAvailability) {
      return res.status(400).json({
        message: "An availability already exists for this period."
      });
    }

    //  Créer disponibilité
    const availability = await Availability.create({
      voitureId,
      startDate: start,
      endDate: end,
      startTime: startTime || null,
      endTime: endTime || null,
      manuallyEditable: manuallyEditable !== undefined ? manuallyEditable : true
    });

    res.status(201).json(availability);
  } catch (err) {
    console.error('addAvailability error:', err)
    res.status(500).json({ message: 'Server error creating availability', error: err?.message || String(err) });
  }
};



exports.updateAvailability = async (req, res) => {
  try {
    const availability = await Availability.findByPk(req.params.id);
    if (!availability) return res.status(404).json({ message: "Availability not found." });

    const { startDate, endDate, startTime, endTime, manuallyEditable } = req.body;

    await availability.update({
      startDate: startDate || availability.startDate,
      endDate: endDate || availability.endDate,
      startTime: startTime || availability.startTime,
      endTime: endTime || availability.endTime,
      manuallyEditable: manuallyEditable !== undefined ? manuallyEditable : availability.manuallyEditable
    });

    res.status(200).json(availability);
  } catch (err) {
    console.error('updateAvailability error:', err)
    res.status(500).json({ message: 'Server error updating availability', error: err?.message || String(err) });
  }
};

exports.deleteAvailability = async (req, res) => {
  try {
    const availability = await Availability.findByPk(req.params.id);
    if (!availability) return res.status(404).json({ message: "Availability not found." });

    await availability.destroy();
    res.status(200).json({ message: "Availability successfully deleted." });
  } catch (err) {
    console.error('deleteAvailability error:', err)
    res.status(500).json({ message: 'Server error deleting availability', error: err?.message || String(err) });
  }
};
