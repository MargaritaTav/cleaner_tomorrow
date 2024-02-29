const express = require('express');
const router = express.Router();
const { OAuth2Client } = require('google-auth-library');
const { google } = require('googleapis');
const MailComposer = require('nodemailer/lib/mail-composer');


const CLIENT_ID = "972999227282-0udhmoe36buggg8folg8tj7kgr8aavo1.apps.googleusercontent.com";
const CLIENT_SECRET = "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";
const REDIRECT_URI = 'http://localhost:3000/callback';
const SCOPES = 'https://www.googleapis.com/auth/gmail.send';


router.get("/", (req, res) => {
    res.render("index")
})

const oAuth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

router.get('/authorize', (req, res) => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  res.redirect(authUrl);
});

router.get('/callback', async (req, res) => {
  const { code } = req.query;

  try {
    const tokenResponse = await oAuth2Client.getToken(code);
    const accessToken = tokenResponse.tokens.access_token;
    console.log(tokenResponse)
    // Use the accessToken to make requests to the Gmail API or perform other actions

    res.send('Authorization successful! You can now make requests to the Gmail API.');
  } catch (error) {
    console.error('Error exchanging code for tokens:', error.message);
    res.status(500).send('Error exchanging code for tokens');
  }
});

router.get("/sendmail", async (req, res) => {
    const tokens = {
        access_token: 'ya29.a0AfB_byDUT1UlrBLuD4XX0a5hUn7TakZylfOd5hsFCiAVik6oTKYUW0-Z-Q4Jd3K9H-Nt_4lQpg-8pgoAyDq-0UYqI5w-aLjhxsrLWXC-6oaElMmSfPohh3wq843IzVqyGnxUB1X2FhzS2HAL3eMVKhrNfUsqpjbhUTHTaCgYKASISARMSFQHGX2MiDhEY9n6SEHC4iONYXdhacw0171',
        refresh_token: '1//09haEwkWecKaTCgYIARAAGAkSNwF-L9IrQRj6DV5uhehPD0s-8BY364dz3Of26J_lHpiVb0dUq-p2qIZgCPTsZLxMIxYiKqje5gw',
        scope: 'https://www.googleapis.com/auth/gmail.send',
        token_type: 'Bearer',
        expiry_date: 1709221674501
        // other properties like token_type, expiry_date, etc., may also be present
      };
    const client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
    client.setCredentials(tokens);

    async function sendEmail() {
        
        const gmail = google.gmail({ version: 'v1', auth: client });
        const options = {
            to: 'margaritatikis@gmail.com',
            cc: '',
            replyTo: '',
            subject: 'Hello Energy SAVER',
            text: 'This email is sent from Future Tomorrow',
            html: `<p>🙋🏻‍♀️  &mdash; This is a <b>report</b> onoptimal energy consumption.</p>`,
            
            textEncoding: 'base64',
            headers: [
              { key: 'X-Application-Developer', value: 'Amit Agarwal' },
              { key: 'X-Application-Version', value: 'v1.0.0.2' },
            ],
          };
        try {

            const encodeMessage = (message) => {
                return Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
              };
              
              const createMail = async (options) => {
                const mailComposer = new MailComposer(options);
                const message = await mailComposer.compile().build();
                return encodeMessage(message);
              };

              const sendMail = async (options) => {
                
                const rawMessage = await createMail(options);
                const { data: { id } = {} } = await gmail.users.messages.send({
                  userId: 'me',
                  resource: {
                    raw: rawMessage,
                  },
                });
                return id;
              };

            

            const messageId = await sendMail(options);
      
          console.log('Email sent successfully:', messageId);
        } catch (error) {
          console.error('Error sending email:', error.message);
        }
      }
    
    async function refreshAccessToken() {
        try {
          const { tokens } = await client.refreshToken(process.env.REFRESH_TOKEN);
          const accessToken = tokens.access_token;
      
          // Now you have a new access token, which can be used for API requests
          console.log('New Access Token:', accessToken);
      
          // Call your function to send an email using the new access token
          await sendEmail(accessToken, "schwarz.duscheleit@hotmail.de", "Data Update", "Your super interesting message");
        } catch (error) {
          console.error('Error refreshing access token:', error.message);
        }
      }
    
    try {
        await sendEmail()
        res.status(200).json({message: "Email send successfully"})
    } catch (error) {
        console.log(error)
    }
})

module.exports = router;