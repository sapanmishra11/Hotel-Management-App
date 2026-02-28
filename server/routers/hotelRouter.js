const express = require("express");
const router = express.Router();
const authorize = require("../middleware/authorize");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const hotelController = require("../controllers/hotelController");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "public/uploads/";
    if (!fs.existsSync(uploadPath))
      fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

router.get("/", hotelController.getHotels);

router.post(
  "/add",
  authorize("hotels"),
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "roomImages", maxCount: 50 },
  ]),
  hotelController.createHotel,
);
router.get("/search", hotelController.searchHotels);
router.get("/online", hotelController.fetchOnlineHotels);
router.get("/all", authorize("hotels"), hotelController.fetchAllHotels);

router.post("/locations/add", authorize("hotels"), hotelController.addLocation);
router.get("/locations", hotelController.fetchLocations);
router.delete(
  "/locations/delete",
  authorize("hotels"),
  hotelController.deleteLocation,
);

router.get(
  "/global-dishes",
  authorize("hotels"),
  hotelController.fetchGlobalDishes,
);
router.post(
  "/global-dishes",
  authorize("hotels"),
  hotelController.createGlobalDish,
);

router.post(
  "/rooms/meals/add",
  authorize("hotels"),
  hotelController.createRoomMeal,
);

router.post(
  "/rooms/add",
  authorize("hotels"),
  upload.array("roomImages", 10),
  hotelController.createHotelRoom,
);

router.get(
  "/online/paginated",
  authorize("hotels"),
  hotelController.fetchOnlineHotelsPaginated,
);

router.get(
  "/locations/paginated",
  authorize("hotels"),
  hotelController.fetchLocationsPaginated,
);

router.get(
  "/staff-list/paginated",
  authorize("staff"),
  hotelController.fetchStaffPaginated,
);

router.get(
  "/global-dishes/paginated",
  authorize("hotels"),
  hotelController.fetchGlobalDishesPaginated,
);

router.patch(
  "/global-dishes/status/:id",
  authorize("hotels"),
  hotelController.toggleGlobalDishStatus,
);

router.patch(
  "/locations/cities/status/:id",
  authorize("hotels"),
  hotelController.toggleCityStatus,
);

router.put(
  "/rooms/update/:roomId",
  authorize("hotels"),
  upload.array("roomImages", 10),
  hotelController.updateHotelRoom,
);

router.delete(
  "/rooms/meals/:dishId",
  authorize("hotels"),
  hotelController.removeRoomMeal,
);

router.get("/rooms/meals/:roomId", hotelController.fetchRoomMeals);

router.delete(
  "/meals/item/:dishId",
  authorize("hotels"),
  hotelController.removeHotelMeal,
);

router.get("/meals/:hotelId", hotelController.fetchHotelMeals);

router.post(
  "/meals/:hotelId",
  authorize("hotels"),
  hotelController.createHotelMeal,
);

router.delete(
  "/global-dishes/:type/:name",
  authorize("hotels"),
  hotelController.removeGlobalDish,
);

router.patch("/status/:id", authorize("hotels"), hotelController.updateStatus);

router.put(
  "/update/:id",
  authorize("hotels"),
  upload.array("images", 10),
  hotelController.updateHotel,
);

router.get("/staff/:id", authorize("hotels"), hotelController.fetchStaffById);

router.put(
  "/update-staff/:id",
  authorize("hotels"),
  hotelController.updateStaff,
);

router.get("/:id", hotelController.fetchHotelById);

module.exports = router;
