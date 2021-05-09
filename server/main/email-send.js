const nodemailer = require('nodemailer')
const hbs = require('nodemailer-express-handlebars')
const path = require('path')
require('dotenv').config()

const sendEmail = (email, petitionId, confirmationKey) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  })

  ///
  console.log("Current directory:", __dirname);

  ///

  // transporter.use('compile', hbs({
  //   viewEngine: 'express-handlebars',
  //   viewPath: '/app/main/views',
  // }))

  const mailOptions = {
    from: process.env.MAIL_USER,
    to: email,
    subject: 'Confirm your petition signature',
    // text: 'Does this work?',
    // template: 'tutorial',
    html: `<div
    style="
      width: 350px;
      margin: auto;
    "
  >
    <div
      style="
        border: 4px solid #3974b9;
        border-radius: 5px;
        text-align: center;
        padding: 20px;
      "
    >
    <img src="https://gifted-shaw-f3346e.netlify.app/favicon.ico"/>
      <h2 style="margin-top: -10px">Hi there!</h2>
      <a href="https://gifted-shaw-f3346e.netlify.app/petition/${petitionId}?key=${confirmationKey}"
      style="font-weight: bold; color: #3974b9;"><h3>
        Please click here to confirm your signature
        </h3></a
        >
        <br /><br /><span style="text-decoration: none; color: lightslategray;">
          or copy the following link:
          https://gifted-shaw-f3346e.netlify.app/petition/${petitionId}?key=${confirmationKey}
        </span>
      </p>
    </div>
  </div>`
  }

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error)
    } else {
      console.log('Email sent: ' + info.response)
    }
  })
}

module.exports = sendEmail
