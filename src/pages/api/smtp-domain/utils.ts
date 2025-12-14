import axios from 'axios';

const MAILGUN_API_USERNAME = process.env.MAILGUN_API_USERNAME;
const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
const MAILGUN_API_BASE = process.env.MAILGUN_API_BASE || 'https://api.eu.mailgun.net/v4';

export const mailgunRequest = async (method: 'GET' | 'POST' | 'DELETE', url: string, data?: any) => {
  const auth = {
    username: MAILGUN_API_USERNAME!,
    password: MAILGUN_API_KEY!,
  };
  return axios({
    method,
    url: `${MAILGUN_API_BASE}${url}`,
    auth,
    data,
  });
};
