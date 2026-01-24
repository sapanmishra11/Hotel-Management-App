const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendInvoice = async (userEmail, bookingDetails) => {
  const formatMeals = (meals) => {
    if (!meals || !Array.isArray(meals) || meals.length === 0)
      return "Room Only";

    return meals
      .map((meal) => {
        if (typeof meal === "object" && meal !== null) {
          const name = meal.name || "Meal";
          const type = meal.type ? ` (${meal.type})` : "";
          const capitalizedName =
            String(name).charAt(0).toUpperCase() + String(name).slice(1);

          return `${capitalizedName}${type}`;
        }
        return String(meal).charAt(0).toUpperCase() + String(meal).slice(1);
      })
      .join(", ");
  };

  const formattedMeals = formatMeals(bookingDetails.meals);
  const formattedCheckIn = new Date(
    bookingDetails.check_in_date,
  ).toDateString();
  const formattedCheckOut = new Date(
    bookingDetails.check_out_date,
  ).toDateString();

  const mailOptions = {
    from: `"Hotel Palace Support" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: `Booking Confirmation - Invoice #${bookingDetails.id}`,
    html: `
      <div style="background-color: #f4f4f4; padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
          
          <div style="background-color: #003580; padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Booking Confirmed!</h1>
            <p style="color: #ffb700; margin: 10px 0 0 0; font-weight: bold;">Invoice #${bookingDetails.id}</p>
          </div>

          <div style="padding: 30px; color: #333333;">
            <p style="font-size: 16px; line-height: 1.6;">Hi there,</p>
            <p style="font-size: 16px; line-height: 1.6;">Thank you for choosing <strong>Hotel Palace</strong>. Your reservation has been successfully received and is now being processed.</p>
            
            <div style="background-color: #f9fafb; border-radius: 6px; padding: 20px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #003580; border-bottom: 2px solid #ffb700; display: inline-block;">Stay Details</h3>
              <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                <tr>
                  <td style="padding: 8px 0; color: #666;">Check-in</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: bold;">${formattedCheckIn}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Check-out</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: bold;">${formattedCheckOut}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Meal Plan</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #003580;">${formattedMeals}</td>
                </tr>
              </table>
            </div>

            <div style="margin-top: 20px;">
              <h3 style="margin-top: 0; color: #003580; border-bottom: 2px solid #ffb700; display: inline-block;">Price Summary</h3>
              <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                <tr>
                  <td style="padding: 8px 0; color: #666;">GST (5%)</td>
                  <td style="padding: 8px 0; text-align: right;">₹${bookingDetails.gst_amount}</td>
                </tr>
                <tr style="font-size: 20px; font-weight: bold; color: #1a1a1a;">
                  <td style="padding: 15px 0 8px 0; border-top: 1px solid #eeeeee;">Total Amount</td>
                  <td style="padding: 15px 0 8px 0; text-align: right; border-top: 1px solid #eeeeee; color: #008009;">₹${bookingDetails.total_price}</td>
                </tr>
              </table>
            </div>

            <p style="margin-top: 30px; font-size: 14px; color: #6b7280; text-align: center;">
              <strong>Payment Method:</strong> Pay at Hotel (Cash/Card)
            </p>
          </div>

          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; color: #999999; font-size: 12px;">
            <p style="margin: 0;">© 2026 Hotel Palace. All rights reserved.</p>
            <p style="margin: 5px 0 0 0;">This is an automated invoice. Please do not reply to this email.</p>
          </div>
        </div>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = { sendInvoice };
