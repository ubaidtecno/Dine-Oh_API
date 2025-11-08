const nodemailer = require("nodemailer");

async function sendMail(
  email,
  message,
  html,
  subject = "Email from Dine Oh Application"
) {
  try {
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_CLIENT_SECRET,
      },
    });

    if (!html) {
      html = `<body>
      <div
        style="
          width: 90%;
          max-width: 90%;
          padding: 15px;
          background: #b9bcbcff;
          border: 5px solid #e77f4eff;
          margin: auto;
          font-family: 'HelveticaNeue-Light', 'Helvetica Neue Light', 'Helvetica Neue', Helvetica, Arial, sans-serif;
          border-radius: 18px;">

        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tbody><tr><td>
            <span>Dear user,
              <br> <br>
              ${message}
              <br>
              For help with any of our online services, please email:
              <a href="mailto:customerservice@dine-oh.com" target="_blank">${process.env.EMAIL_SUPPORT_EMAIL}</a>
              <br> 
              <br>
              Thanks, <br>
              The Dine Oh Team. <br> <br>
            </span>
          </td></tr></tbody>
        </table>
      </div>,</body>`;
    }

    let info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject,
      text: `${message}`,
      html: html,
    });

    console.log({ info });
    return info;
  } catch (error) {
    console.error("An error occurred while sending the email:", error);
  }
}

module.exports = {
  sendMail,
};
