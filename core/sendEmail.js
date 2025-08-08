const nodemailer = require("nodemailer");
const { google } = require("googleapis");

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
const REDIRECT_URI = "https://developers.google.com/oauthplayground";

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

module.exports = async (
  email,
  message,
  html,
  file,
  ccEmails,
  filename,
  subject = "Email from Dine Oh Application",
  bccEmails = ""
) => {
  if (email) {
    const accessToken = await oAuth2Client.getAccessToken();

    const transport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.EMAIL,
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: accessToken,
      },
      tls: {
        rejectUnauthorized: false,
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
              <a href="mailto:customerservice@greatlakes-tackle.com" target="_blank">${process.env.SUPPORT_EMAIL}</a>
              <br> 
              <br>
              Thanks, <br>
              The Dine Oh Team. <br> <br>
            </span>
          </td></tr></tbody>
        </table>
      </div>,</body>`;
    }

    // Configure the email options
    const emailOptions = {
      from: {
        name: "Dine Oh",
        address: process.env.EMAIL,
      },
      to: email,
      cc: ccEmails,
      bcc: bccEmails,
      subject,
      text: `${message}`,
      html: html,
    };

    // Add multiple attachments if files are provided
    if (file && file.length > 0) {
      emailOptions.attachments = file.map((file, index) => ({
        filename: filename[index] || `attachment-${index + 1}.pdf`,
        content: file.buffer,
      }));
    }

    // await
    // let status = await transport
    //   .sendMail({
    //     from: "tecnovatorssoftware@gmail.com",
    //     to: email,
    //     subject: "Email from GLT Wholesale System",
    //     text: `${message}`,
    //     html: html,
    //     attachments: [
    //       {
    //         filename: "attachment.pdf",
    //         content: pdfFile.buffer,
    //       },
    //     ],
    //   })
    //   .catch((err) => {
    //     console.log("in mail send", err);
    //     return true;
    //   });
    // console.log({ status });
    // return status;

    // Send the email
    try {
      const status = await transport.sendMail(emailOptions);
      console.log({ status });
      return status;
    } catch (err) {
      console.log("in mail send", err);
      return true;
    }
  }
};
