const nodemailer = require('nodemailer')

const sendEmail = (email, petitionId, confirmationKey) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'eprzymorze@gmail.com',
      pass: 'Ciasteczko!007',
    },
  })

  const mailOptions = {
    from: 'eprzymorze@gmail.com',
    to: email,
    subject: 'Confirm your petition signature',
    // text: ``,
    html: `<h1>Hi there!</h1><p>Please click the following link to confirm your signature:
    <a href="http://localhost:3000/petition/${petitionId}?key=${confirmationKey}">CONFRIM</a>
    <br>or copy the following link: http://localhost:3000/petition/${petitionId}?key=${confirmationKey}</p>`
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
