// Run from project root: node ./scripts/test-email-verification.js
require('dotenv').config({ path: './.env.local' });
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

async function main() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error('Missing MONGODB_URI in .env.local');
    process.exit(1);
  }
  await mongoose.connect(MONGODB_URI, { dbName: undefined });
  console.log('Connected to MongoDB');

  const users = mongoose.connection.collection('users');
  const wallets = mongoose.connection.collection('wallets');
  const emailVerifs = mongoose.connection.collection('emailverifications');

  // find or create a test user
  let user = await users.findOne({});
  if (!user) {
    const address = `0xtest${Date.now()}`;
    const nonce = crypto.randomBytes(8).toString('hex');
    const now = new Date();
    const newUser = {
      address,
      nonce,
      nonceCreatedAt: now,
      createdAt: now,
      updatedAt: now,
    };
    const r = await users.insertOne(newUser);
    user = await users.findOne({ _id: r.insertedId });
    console.log('Created test user', user.address);
    // also create a wallet doc for this address so wallet updates succeed
    await wallets.insertOne({ address: user.address.toLowerCase(), chain: 'eth', kycDetails: {} });
  } else {
    console.log('Using existing user', user.address);
  }

  const targetEmail = process.env.SMTP_USER || process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!targetEmail) {
    console.error('No target email configured in SMTP_USER or ADMIN_NOTIFICATION_EMAIL');
    process.exit(1);
  }

  // generate verification token and store
  const token = crypto.randomBytes(20).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await emailVerifs.insertOne({ address: user.address, email: targetEmail, token, createdAt: new Date(), expiresAt });
  console.log('Inserted EmailVerification token:', token);

  // send verification email via SMTP
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: (process.env.SMTP_SECURE === 'true') || false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    await transporter.verify();
    console.log('SMTP verified');
  } catch (err) {
    console.warn('SMTP verify failed', err);
  }

  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const verifyUrl = `${appUrl}/api/verify/email/confirm?token=${token}`;

  const mail = {
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to: targetEmail,
    subject: 'Test: confirm your email (Blockpages411)',
    text: `Confirm: ${verifyUrl}`,
    html: `<p>Confirm by visiting: <a href="${verifyUrl}">${verifyUrl}</a></p>`,
  };

  try {
    const info = await transporter.sendMail(mail);
    console.log('Sent verification email, accepted:', info.accepted);
  } catch (err) {
    console.warn('Failed to send verification email, continuing to simulate confirmation (error logged):', err && err.message ? err.message : err);
  }

  // Now simulate the user clicking the link: mark verified in DB
  const rec = await emailVerifs.findOne({ token });
  if (!rec) {
    console.error('Verification record not found after insert');
    process.exit(1);
  }

  await users.updateOne({ address: rec.address }, { $set: { email: rec.email, emailVerified: true } }, { upsert: false });
  await wallets.updateOne({ address: rec.address.toLowerCase() }, { $set: { 'kycDetails.email': rec.email, 'kycDetails.emailVerified': true } }, { upsert: false });
  await emailVerifs.deleteOne({ _id: rec._id });

  const updatedUser = await users.findOne({ address: rec.address });
  const updatedWallet = await wallets.findOne({ address: rec.address.toLowerCase() });
  console.log('User emailVerified:', !!updatedUser.emailVerified, 'email:', updatedUser.email);
  console.log('Wallet kycDetails.emailVerified:', !!(updatedWallet && updatedWallet.kycDetails && updatedWallet.kycDetails.emailVerified), 'email:', updatedWallet && updatedWallet.kycDetails && updatedWallet.kycDetails.email);

  await mongoose.disconnect();
  console.log('Done');
}

main().catch(err => { console.error(err); process.exit(1); });
