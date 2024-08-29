import nodemailer from 'nodemailer';

export function sendEmail({ email, subject, text }) {

    return new Promise((resolve, reject) => {

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'ammardata122@gmail.com',
                pass: 'ybgx kedd lhlg bvak'
            }
        })

        const mail_configs = {
            from: '"Muhammad Ammar Afridi" <ammardata122@gmail.com>',
            to: email,
            subject: subject,
            text: text,
            // html: "<h1>Hello world</h1>"
        }

        transporter.sendMail(mail_configs, (err, info) => {
            if (err) {
                console.log(err)
                reject({ message: "An error occurred while sending mail" })
            }
            console.log(info)
            return resolve({ message: "Mail is Sent Successfully" })
        })

    })

}