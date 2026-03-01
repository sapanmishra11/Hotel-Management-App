const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const generateInvoiceBuffer = (bookingDetails, mealData) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    let buffers = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    const currentHotelName = bookingDetails.hotel_name || "Hotel Palace";

    doc
      .fillColor("#003580")
      .fontSize(20)
      .text(currentHotelName.toUpperCase(), { align: "right" });
    doc
      .fontSize(10)
      .fillColor("#333")
      .text("Official Booking Invoice", { align: "right" });
    doc.moveDown();

    doc
      .fontSize(12)
      .fillColor("#000")
      .text(`Invoice Number: INV-00${bookingDetails.id}`);
    doc.text(`Date: ${new Date().toLocaleDateString()}`);
    doc.moveDown();

    doc.fontSize(14).text("Reservation Details", { underline: true });
    doc.fontSize(10).text(`Hotel: ${currentHotelName}`);

    const displayRoomType =
      bookingDetails.room_type || bookingDetails.roomType || "Classic Room";
    doc.text(`Room Type: ${displayRoomType}`);

    doc.text(
      `Check-in: ${new Date(bookingDetails.check_in_date).toDateString()}`,
    );
    doc.text(
      `Check-out: ${new Date(bookingDetails.check_out_date).toDateString()}`,
    );
    doc.moveDown();

    let totalMealPrice = 0;
    if (mealData && mealData.length > 0) {
      doc.fontSize(14).text("Selected Meals & Dining", { underline: true });
      mealData.forEach((meal) => {
        const dishPrice = parseFloat(meal.price || 0);
        totalMealPrice += dishPrice;
        doc
          .fontSize(10)
          .text(
            `${meal.dish_name || meal.name} (${meal.meal_category || meal.category} - ${meal.dietary_type || meal.type}): INR ${dishPrice.toFixed(2)}`,
          );
      });
      doc.moveDown();
    }

    doc.rect(50, doc.y, 500, 2).fill("#003580");
    doc.moveDown(0.5);

    const totalPrice = parseFloat(bookingDetails.total_price) || 0;
    const gstAmount = parseFloat(bookingDetails.gst_amount) || 0;
    const roomPrice = (totalPrice - gstAmount - totalMealPrice).toFixed(2);

    doc
      .fontSize(10)
      .fillColor("#333")
      .text(`Room Price: INR ${roomPrice}`, { align: "right" })
      .text(`Total Meal Price: INR ${totalMealPrice.toFixed(2)}`, {
        align: "right",
      })
      .text(`GST (5%): INR ${gstAmount.toFixed(2)}`, { align: "right" });
    doc
      .fontSize(14)
      .fillColor("#003580")
      .text(`Total Amount: INR ${totalPrice.toFixed(2)}`, {
        align: "right",
        bold: true,
      });

    doc.moveDown(2);
    doc
      .fontSize(12)
      .fillColor("#000")
      .text("Payment Method: Pay at Hotel", { align: "center", bold: true });
    doc
      .fontSize(10)
      .fillColor("#999")
      .text(`Thank you for choosing ${currentHotelName}!`, { align: "center" });

    doc.end();
  });
};

const sendInvoice = async (userEmail, bookingDetails) => {
  try {
    const currentHotelName = bookingDetails.hotel_name || "Hotel Palace";

    let mealData = bookingDetails.meals;
    if (typeof mealData === "string") {
      try {
        mealData = JSON.parse(mealData);
      } catch (e) {
        mealData = [];
      }
    }

    const pdfBuffer = await generateInvoiceBuffer(bookingDetails, mealData);

    let totalMealPrice = 0;
    const groupedMeals = {};

    if (mealData && mealData.length > 0) {
      mealData.forEach((meal) => {
        totalMealPrice += parseFloat(meal.price || 0);
        const key = `${meal.meal_category || meal.category} (${meal.dietary_type || meal.type})`;
        if (!groupedMeals[key]) {
          groupedMeals[key] = [];
        }
        groupedMeals[key].push(meal.dish_name || meal.name);
      });
    }

    const mealRows =
      Object.keys(groupedMeals).length > 0
        ? Object.entries(groupedMeals)
            .map(
              ([category, dishes]) => `
        <div style="margin-bottom: 12px;">
          <strong style="text-transform: capitalize; color: #003580; font-size: 15px;">${category}</strong><br/>
          <span style="font-size: 13px; color: #666;">Includes: ${dishes.join(", ")}</span>
        </div>`,
            )
            .join("")
        : "Standard Room Only";

    const formattedCheckIn = new Date(
      bookingDetails.check_in_date,
    ).toDateString();
    const formattedCheckOut = new Date(
      bookingDetails.check_out_date,
    ).toDateString();

    const totalFinal = parseFloat(bookingDetails.total_price) || 0;
    const totalGst = parseFloat(bookingDetails.gst_amount) || 0;
    const roomPrice = (totalFinal - totalGst - totalMealPrice).toFixed(2);

    const mailOptions = {
      from: `"${currentHotelName} Support" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `Booking Confirmed: ${currentHotelName} - #${bookingDetails.id}`,
      attachments: [
        {
          filename: `Invoice_${bookingDetails.id}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
      html: `
        <div style="background-color: #f4f7f9; padding: 20px; font-family: 'Segoe UI', sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
            <div style="background-color: #003580; padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 26px;">Reservation Confirmed</h1>
              <p style="color: #ffb700; margin: 10px 0 0 0; font-weight: bold;">BOOKING ID: #00${bookingDetails.id}</p>
            </div>
            <div style="padding: 30px; color: #333333;">
              <p>Hi there,</p>
              <p>Your stay is booked at <strong>${currentHotelName}</strong>! Your official PDF invoice is attached.</p>
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 15px; margin: 20px 0; border: 1px solid #e5e7eb; display: flex;">
                 <div style="flex: 1; text-align: center; border-right: 1px solid #e5e7eb;">
                   <span style="font-size: 11px; color: #6b7280; text-transform: uppercase;">Check-In</span>
                   <p style="margin: 5px 0; font-weight: bold;">${formattedCheckIn}</p>
                 </div>
                 <div style="flex: 1; text-align: center; padding-left: 10px;">
                   <span style="font-size: 11px; color: #6b7280; text-transform: uppercase;">Check-Out</span>
                   <p style="margin: 5px 0; font-weight: bold;">${formattedCheckOut}</p>
                 </div>
              </div>
              <h3 style="font-size: 16px; color: #003580;">Room Details</h3>
              <p style="font-size: 14px;"><strong>Room Type:</strong> ${bookingDetails.room_type || bookingDetails.roomType || "Classic Room"}</p>
              
              <h3 style="font-size: 16px; color: #003580;">Dining & Meals</h3>
              <div style="margin-top: 10px;">${mealRows}</div>

              <div style="margin-top: 30px; background-color: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
                <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #475569;">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">Room Price</td>
                    <td style="text-align: right; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">₹${roomPrice}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">Total Meal Price</td>
                    <td style="text-align: right; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">₹${totalMealPrice.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">GST (5%)</td>
                    <td style="text-align: right; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">₹${totalGst.toFixed(2)}</td>
                  </tr>
                  <tr style="font-weight: bold; font-size: 18px; color: #003580;">
                    <td style="padding-top: 15px;">Total Amount</td>
                    <td style="text-align: right; padding-top: 15px;">₹${totalFinal.toFixed(2)}</td>
                  </tr>
                </table>
              </div>
            </div>
            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; color: #999; font-size: 12px;">
              <p>© 2026 ${currentHotelName}. All rights reserved.</p>
            </div>
          </div>
        </div>`,
    };

    return await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error in sendInvoice:", error);
    return null;
  }
};

const sendSetPasswordEmail = async (email, token) => {
  try {
    const setupUrl = `${process.env.FRONTEND_URL}/set-password?token=${token}`;
    const mailOptions = {
      from: `"Hotel Palace Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Welcome to Hotel Palace - Set Your Password",
      html: `
        <div style="background-color: #f4f7f9; padding: 20px; font-family: 'Segoe UI', sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
            <div style="background-color: #003580; padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 26px;">Welcome to Hotel Palace</h1>
            </div>
            <div style="padding: 40px; text-align: center; color: #333333;">
              <p style="font-size: 16px;">Hi there,</p>
              <p style="font-size: 16px; line-height: 1.5;">Your account has been created. Please click the button below to set your password and activate your account.</p>
              
              <div style="margin: 30px 0;">
                <a href="${setupUrl}" style="background-color: #ffb700; color: #003580; padding: 15px 35px; text-decoration: none; font-weight: bold; border-radius: 8px; font-size: 16px; display: inline-block;">Set My Password</a>
              </div>
              
              <p style="font-size: 12px; color: #6b7280; margin-top: 20px;">This link will expire in 24 hours.</p>
              <p style="font-size: 12px; color: #003580; word-break: break-all; margin-top: 10px;">
                <a href="${setupUrl}" style="color: #003580;">${setupUrl}</a>
              </p>
            </div>
            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; color: #999; font-size: 12px;">
              <p>© 2026 Hotel Palace. All rights reserved.</p>
            </div>
          </div>
        </div>`,
    };
    return await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error in sendSetPasswordEmail:", error);
    throw error;
  }
};

module.exports = { sendInvoice, sendSetPasswordEmail };
