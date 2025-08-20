const express = require("express");
const router = express.Router();
const controller = require("../controllers/categorie.controller");

router.post("/", controller.create);           
router.get("/", controller.findAll);          
router.put("/:id", controller.update);         
router.delete("/:id", controller.remove);     

module.exports = router;
